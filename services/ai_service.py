"""
LLM service for clinical narrative generation.

Backed by NVIDIA NIM, which exposes an OpenAI-compatible API, so the official
`openai` client is used with a custom base_url.

Two layers of resilience, because the hosted models are not always available:

1. Model fallback. The configured primary model is tried first; if it errors or
   times out, the secondary model is tried. The large Nemotron endpoints return
   "Service temporarily overloaded" under load, and a smaller model answering is
   better than no answer.
2. Deterministic fallback. If every model fails, each method returns rule-based
   output with ai_generated=False, so the clinical workflow never breaks on an
   unavailable third party.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from services.clinical_service import ClinicalService

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"
DEFAULT_FALLBACK_MODEL = "nvidia/nemotron-3-super-120b-a12b"

# The reasoning models emit a separate reasoning_content stream. It is not wanted
# in clinical output, and it costs latency, so thinking is disabled by default.
ENABLE_THINKING = os.getenv("NVIDIA_ENABLE_THINKING", "false").lower() == "true"


class AIService:
    """Singleton wrapper around the NVIDIA NIM chat-completions endpoint."""

    _instance: Optional["AIService"] = None

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        base_url: Optional[str] = None,
        fallback_model: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else os.getenv("NVIDIA_API_KEY", "")
        self.model_name = model_name or os.getenv("NVIDIA_MODEL_NAME", DEFAULT_MODEL)
        self.base_url = base_url or os.getenv("NVIDIA_BASE_URL", DEFAULT_BASE_URL)
        # Set NVIDIA_FALLBACK_MODEL="" to disable the secondary model entirely.
        env_fallback = os.getenv("NVIDIA_FALLBACK_MODEL")
        self.fallback_model = (
            fallback_model
            if fallback_model is not None
            else (DEFAULT_FALLBACK_MODEL if env_fallback is None else env_fallback)
        )
        # Deliberately short. The large Nemotron endpoints frequently return
        # "Service temporarily overloaded" and would otherwise hold the request for
        # the full timeout before the fallback model is tried. 30s is enough for a
        # healthy model to start responding (measured first token at 0.6-1.1s) and
        # keeps the worst case - primary times out, fallback answers - near 40s.
        self.timeout = (
            timeout if timeout is not None else float(os.getenv("NVIDIA_TIMEOUT", "30"))
        )
        # Budget for the final attempt. A 3000-token clinical narrative takes well
        # over the short timeout to generate even on a healthy model.
        self.long_timeout = float(os.getenv("NVIDIA_LONG_TIMEOUT", "120"))
        self.client: Optional[Any] = None
        self.last_model_used: Optional[str] = None
        self._initialize_client()

    @classmethod
    def get_instance(
        cls,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
    ) -> "AIService":
        """Retrieve the singleton service instance."""
        if cls._instance is None:
            cls._instance = cls(api_key=api_key, model_name=model_name)
        return cls._instance

    def _initialize_client(self) -> None:
        """Initialize the OpenAI-compatible client without logging any secret."""
        if not self.api_key:
            logger.info(
                "No NVIDIA_API_KEY detected. AI features running in deterministic "
                "offline fallback mode."
            )
            self.client = None
            return

        try:
            from openai import OpenAI

            self.client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                timeout=self.timeout,
                # No client-side retry: a retry doubles the wait before the
                # fallback model is tried, and the fallback IS the retry here.
                max_retries=0,
            )
            logger.info("NVIDIA NIM client initialized (model=%s).", self.model_name)
        except Exception as e:
            logger.warning(
                f"Unable to initialize the NVIDIA client: {e}. "
                "Falling back to rule-based generation."
            )
            self.client = None

    def is_available(self) -> bool:
        """True when a client is configured. Does not guarantee the model responds."""
        return self.client is not None

    # ------------------------------------------------------------------ core

    def _models_to_try(self) -> List[str]:
        models = [self.model_name]
        if self.fallback_model and self.fallback_model != self.model_name:
            models.append(self.fallback_model)
        return models

    def _complete(
        self,
        prompt: str,
        system: Optional[str] = None,
        max_tokens: int = 2048,
        temperature: float = 0.6,
        json_mode: bool = False,
    ) -> Optional[str]:
        """
        Run a chat completion, trying the primary model then the fallback.

        Returns the message content, or None when every model failed so the
        caller can use its deterministic path.
        """
        if self.client is None:
            return None

        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        kwargs: Dict[str, Any] = {
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "extra_body": {"chat_template_kwargs": {"enable_thinking": ENABLE_THINKING}},
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        last_error: Optional[Exception] = None
        models = self._models_to_try()
        for position, model in enumerate(models):
            # Short leash on every model except the last: an overloaded endpoint
            # should fail fast so the next one is tried. The final model gets a
            # generous timeout because it is the last chance before the
            # deterministic fallback, and a long narrative genuinely needs time
            # to generate even once the model is responding.
            is_last = position == len(models) - 1
            per_request_timeout = self.long_timeout if is_last else self.timeout
            try:
                response = self.client.with_options(
                    timeout=per_request_timeout
                ).chat.completions.create(model=model, **kwargs)
                content = (response.choices[0].message.content or "").strip()
                if not content:
                    raise ValueError("empty completion")
                self.last_model_used = model
                if model != self.model_name:
                    logger.info("Primary model unavailable; answered with %s.", model)
                return content
            except Exception as e:
                last_error = e
                logger.warning("Model %s failed: %s", model, str(e)[:200])

        logger.warning("All models failed; using deterministic fallback. Last error: %s", last_error)
        return None

    def _generate_json(self, prompt: str, system: Optional[str] = None) -> Optional[Any]:
        """
        Ask for JSON and parse it.

        response_format constrains the endpoint to emit a JSON object, but markdown
        fences are still stripped defensively. Returns None on any failure.
        """
        text = self._complete(
            prompt,
            system=system or "You output only valid JSON. No markdown fences, no prose.",
            temperature=0.2,
            max_tokens=2048,
            json_mode=True,
        )
        if not text:
            return None

        if text.startswith("```"):
            text = text.split("```")[1] if "```" in text[3:] else text.strip("`")
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.warning(f"Model returned unparseable JSON: {e}")
            return None

    @staticmethod
    def _unwrap_list(parsed: Any, keys: tuple) -> Any:
        """JSON mode returns an object, so a list often arrives wrapped in one."""
        if isinstance(parsed, dict):
            for key in keys:
                if isinstance(parsed.get(key), list):
                    return parsed[key]
            # Single-key object wrapping the array under an unexpected name.
            values = [v for v in parsed.values() if isinstance(v, list)]
            if len(values) == 1:
                return values[0]
        return parsed

    # -------------------------------------------------------------- narrative

    def generate_clinical_report(
        self,
        patient_data: Dict[str, Any],
        prediction_result: Dict[str, Any],
        patient_name: str = "Patient",
        clinician_name: str = "Attending Physician",
    ) -> Dict[str, Any]:
        """Clinical narrative report, with a rule-based fallback."""
        prompt = f"""
You are an expert Clinical Pharmacologist and Pharmacovigilance Specialist. Generate an Adverse Drug Reaction (ADR) Risk Assessment Report for:
Patient Name: {patient_name}
Age: {patient_data.get("age")} | Sex: {patient_data.get("sex")}
Suspected Medication: {patient_data.get("medication_name")} ({patient_data.get("index_drug_dose")} mg)
Overall ADR Risk Score: {prediction_result.get("overall_adr_risk")}% ({prediction_result.get("risk_level")})
Predicted ADR Category: {prediction_result.get("predicted_adr_type")}

Top Specific Risks: {prediction_result.get("top_specific_adr_risks")}
Contributing Factors: {prediction_result.get("major_contributing_factors")}

Format the output cleanly in Markdown with:
1. Executive Summary & Stratification
2. Mechanism of Suspected Adverse Drug Reaction
3. Patient-Specific Contributing Risk Drivers
4. Recommended Dosing & Clinical Mitigation Plan
5. Monitoring Protocol & Follow-up Timeline
Evaluating Clinician: {clinician_name}
"""
        text = self._complete(prompt, max_tokens=3072)

        if text:
            return {
                "report": text,
                "generated_at": datetime.now().isoformat(),
                "ai_generated": True,
                "model": self.last_model_used,
            }

        return {
            "report": ClinicalService.generate_fallback_report(
                patient_data, prediction_result, patient_name, clinician_name
            ),
            "generated_at": datetime.now().isoformat(),
            "ai_generated": False,
            "model": "rule-based-fallback",
            "fallback_reason": "No model returned a completion.",
        }

    def analyze_drug_interactions(
        self, drugs: List[str], patient_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate multi-drug interactions."""
        prompt = f"""
As a Clinical Pharmacologist, analyze potential drug-drug interactions for:
Medications: {", ".join(drugs)}
Patient Context: {patient_data if patient_data else "Standard adult"}

Return a concise summary with severity and clinical management actions.
"""
        text = self._complete(prompt, max_tokens=2048)

        if text:
            return {
                "raw_response": text,
                "interactions_found": len(drugs) > 1,
                "ai_generated": True,
                "model": self.last_model_used,
            }

        return {
            "interactions_found": len(drugs) > 1,
            "severity": "Moderate" if len(drugs) > 2 else "Low",
            "interactions": [
                {
                    "drugs_involved": drugs[:2] if len(drugs) >= 2 else drugs,
                    "severity": "Moderate",
                    "mechanism": (
                        "Potential competitive CYP enzyme metabolism or additive "
                        "pharmacodynamic effect."
                    ),
                    "clinical_management": (
                        "Monitor clinical response and relevant laboratory parameters regularly."
                    ),
                }
            ],
            "ai_generated": False,
        }

    def generate_drug_insights(
        self,
        medications: List[Any],
        patient_age: Any = "Not specified",
        comorbidities: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Deep interaction narrative for a full regimen."""
        comorbidities = comorbidities or []
        names = [str(m.get("name", m)) if isinstance(m, dict) else str(m) for m in medications]

        newline = chr(10)
        medications_list = newline.join(
            f"- {m.get('name', m)} ({m.get('dose', 'dose not specified')})"
            if isinstance(m, dict)
            else f"- {m}"
            for m in medications
        )
        prompt = f"""As a clinical pharmacologist and drug interaction expert, analyze the following medication combination:

**Patient Information:**
- Age: {patient_age}
- Comorbidities: {", ".join(comorbidities) if comorbidities else "None reported"}

**Medications:**
{medications_list}

Provide a comprehensive drug interaction analysis covering critical, moderate, and minor
interactions; pharmacokinetic and pharmacodynamic mechanisms; patient-specific
considerations; clinical recommendations; and risk mitigation strategies.
"""
        text = self._complete(prompt, max_tokens=3072)

        if text:
            return {
                "status": "success",
                "ai_generated": True,
                "model": self.last_model_used,
                "medication_count": len(names),
                "insights": text,
            }

        return {
            "status": "success",
            "ai_generated": False,
            "medication_count": len(names),
            "insights": (
                f"Offline analysis for {len(names)} agents ({', '.join(names)}). "
                "Review for shared CYP450 metabolic pathways, additive pharmacodynamic "
                "effects, and cumulative QT or bleeding risk. Configure NVIDIA_API_KEY "
                "for a full AI-generated interaction narrative."
            ),
        }

    def generate_medication_analysis(
        self,
        patient_data: Dict[str, Any],
        prediction_result: Dict[str, Any],
        patient_name: str = "Patient",
    ) -> Dict[str, Any]:
        """Medication therapy management narrative."""
        drug = patient_data.get("medication_name", "Unknown")

        prompt = f"""As a clinical pharmacist and medication therapy management specialist, provide a comprehensive medication analysis for:

Patient: {patient_name}
Age: {patient_data.get("age", "Unknown")} years
Current Medication: {drug}
Current Dose: {patient_data.get("index_drug_dose", "Unknown")} mg
Risk Level: {prediction_result.get("risk_level", "Unknown")}
Predicted ADR: {prediction_result.get("predicted_adr_type", "Unknown")}

Patient Details:
- Weight: {patient_data.get("weight", "Unknown")} kg
- eGFR: {patient_data.get("egfr", "Unknown")} mL/min/1.73m2
- AST/ALT: {patient_data.get("ast_alt", "Unknown")} U/L
- Concomitant drugs: {patient_data.get("concomitant_drugs_count", 0)}
- CYP2C9: {patient_data.get("cyp2c9", "Unknown")}
- CYP2D6: {patient_data.get("cyp2d6", "Unknown")}

Cover current medication assessment, dose optimization, administration guidelines and
timing, monitoring parameters, and patient counselling points.
"""
        text = self._complete(prompt, max_tokens=3072)

        if text:
            return {
                "status": "success",
                "ai_generated": True,
                "model": self.last_model_used,
                "analysis": text,
            }

        return {
            "status": "success",
            "ai_generated": False,
            "analysis": (
                f"Offline medication review for {drug} at "
                f"{patient_data.get('index_drug_dose', 'unknown')} mg. "
                f"Predicted risk level: {prediction_result.get('risk_level', 'Unknown')}. "
                "Assess dose appropriateness against renal eGFR "
                f"({patient_data.get('egfr', 'unknown')} mL/min/1.73m2) and hepatic "
                f"transaminases ({patient_data.get('ast_alt', 'unknown')} U/L), and confirm "
                "no contraindication from the recorded CYP phenotypes."
            ),
        }

    # ------------------------------------------------------------- structured

    @staticmethod
    def _fallback_organ_breakdown(patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic organ-system scoring, used when no model answers."""
        egfr = patient_data.get("egfr", 90)
        ast_alt = patient_data.get("ast_alt", 25)
        return {
            "renal_system": {
                "risk_score": 85 if egfr < 30 else 20,
                "status": "Impaired" if egfr < 60 else "Normal",
                "findings": f"eGFR: {egfr} mL/min",
            },
            "hepatic_system": {
                "risk_score": 75 if ast_alt > 80 else 15,
                "status": "Stressed" if ast_alt > 60 else "Normal",
                "findings": f"AST/ALT: {ast_alt} U/L",
            },
            "hematologic_system": {
                "risk_score": 30,
                "status": "Stable",
                "findings": f"Platelets: {patient_data.get('platelet_count', 250000)} /uL",
            },
        }

    def generate_detailed_analysis(
        self, patient_data: Dict[str, Any], prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Organ-system risk breakdown. AI-generated, with a rule-based fallback."""
        fallback = self._fallback_organ_breakdown(patient_data)

        prompt = f"""You are a clinical pharmacologist. Assess organ-system risk for this patient
starting {patient_data.get("medication_name", "the index drug")}.

Patient: {patient_data.get("age")}y {patient_data.get("sex")}, weight {patient_data.get("weight")}kg
Renal: eGFR {patient_data.get("egfr")} mL/min/1.73m2, creatinine {patient_data.get("creatinine")} mg/dL
Hepatic: AST/ALT {patient_data.get("ast_alt")} U/L, bilirubin {patient_data.get("bilirubin")} mg/dL, albumin {patient_data.get("albumin")} g/dL
Haematology: haemoglobin {patient_data.get("hemoglobin")} g/dL, platelets {patient_data.get("platelet_count")} /uL, WBC {patient_data.get("wbc_count")} /uL
Cardiac: BP {patient_data.get("bp_systolic")}/{patient_data.get("bp_diastolic")} mmHg, HR {patient_data.get("heart_rate")} bpm
Pharmacogenomics: CYP2C9 {patient_data.get("cyp2c9")}, CYP2D6 {patient_data.get("cyp2d6")}, CYP2C19 {patient_data.get("cyp2c19")}
Model output: {prediction_result.get("risk_level")} risk, {prediction_result.get("overall_adr_risk")}%, predicted {prediction_result.get("predicted_adr_type")}

Return ONLY a JSON object with these exact keys: renal_system, hepatic_system,
hematologic_system, cardiovascular_system. Each value must be an object with:
  "risk_score"  integer 0-100
  "status"      short label, e.g. "Normal", "Impaired", "Stressed", "Critical"
  "findings"    one sentence citing the specific values that drove the score
  "monitoring"  one sentence naming the test and interval to monitor
"""
        parsed = self._generate_json(prompt)
        if not isinstance(parsed, dict):
            logger.info("Detailed analysis falling back to rule-based breakdown.")
            return {"organ_system_breakdown": fallback, "ai_generated": False}

        # Guarantee the three keys the existing clients rely on.
        for key, default in fallback.items():
            entry = parsed.get(key)
            if not isinstance(entry, dict) or "risk_score" not in entry:
                parsed[key] = default

        return {
            "organ_system_breakdown": parsed,
            "ai_generated": True,
            "model": self.last_model_used,
        }

    @staticmethod
    def _fallback_mitigation(prediction_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Deterministic mitigation list, used when no model answers."""
        strategies = [
            {
                "priority": "High",
                "action": "Renal & Hepatic Dose Optimization",
                "rationale": "Align dosing to eGFR and baseline transaminases.",
            },
            {
                "priority": "High",
                "action": "Therapeutic Drug Monitoring (TDM)",
                "rationale": "Measure trough serum concentrations at steady-state.",
            },
            {
                "priority": "Medium",
                "action": "Patient Education & Symptom Diary",
                "rationale": (
                    "Instruct patient to report early hypersensitivity or bleeding "
                    "signs immediately."
                ),
            },
        ]
        if prediction_result.get("risk_level") in ["High", "Critical"]:
            strategies.insert(
                0,
                {
                    "priority": "Critical",
                    "action": "Urgent Clinical Pharmacologist Review",
                    "rationale": "Evaluate alternative agents with lower toxicity potential.",
                },
            )
        return strategies

    def generate_mitigation_strategies(
        self, patient_data: Dict[str, Any], prediction_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Patient-specific mitigation plan. AI-generated, with a rule-based fallback."""
        fallback = self._fallback_mitigation(prediction_result)

        top_risks = prediction_result.get("top_specific_adr_risks", {})
        prompt = f"""You are a clinical pharmacologist producing a risk-mitigation plan.

Patient: {patient_data.get("age")}y {patient_data.get("sex")}
Index drug: {patient_data.get("medication_name")} {patient_data.get("index_drug_dose")} mg
Concomitant drugs: {patient_data.get("concomitant_drugs_count", 0)}
Renal: eGFR {patient_data.get("egfr")} mL/min/1.73m2
Hepatic: AST/ALT {patient_data.get("ast_alt")} U/L, albumin {patient_data.get("albumin")} g/dL
Pharmacogenomics: CYP2C9 {patient_data.get("cyp2c9")}, CYP2D6 {patient_data.get("cyp2d6")}
Prior ADR history: {"yes" if patient_data.get("prior_adr_history") else "no"}
Risk: {prediction_result.get("risk_level")} ({prediction_result.get("overall_adr_risk")}%)
Predicted reaction: {prediction_result.get("predicted_adr_type")}
Top specific risks: {top_risks}

Return ONLY a JSON object with a single key "mitigation_strategies" whose value is an
array of 4 to 6 objects, ordered most urgent first. Each object:
  "priority"  one of "Critical", "High", "Medium", "Low"
  "action"    short imperative title, under 60 characters
  "rationale" one or two sentences citing THIS patient's specific values

Be specific to the numbers above - do not give generic advice.
"""
        parsed = self._unwrap_list(
            self._generate_json(prompt), ("mitigation_strategies", "strategies", "items")
        )

        if not isinstance(parsed, list) or not parsed:
            logger.info("Mitigation strategies falling back to rule-based list.")
            return {"mitigation_strategies": fallback, "ai_generated": False}

        clean = [
            {
                "priority": str(item.get("priority", "Medium")),
                "action": str(item.get("action", "")),
                "rationale": str(item.get("rationale", "")),
            }
            for item in parsed
            if isinstance(item, dict) and item.get("action")
        ]
        if not clean:
            return {"mitigation_strategies": fallback, "ai_generated": False}

        return {
            "mitigation_strategies": clean,
            "ai_generated": True,
            "model": self.last_model_used,
        }

    # -------------------------------------------------------------------- chat

    def chat_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Clinical assistant chat. Stateless; the caller supplies the context."""
        prompt = f"""
You are the PhenoRx Assistant, a clinical pharmacologist and medical AI assistant specializing in adverse drug reactions, pharmacogenomics, and patient medication safety.
User Query: {message}
Context: {context if context else "None"}

Provide an accurate, concise, evidence-based clinical explanation with actionable pharmacovigilance guidance.
"""
        text = self._complete(prompt, max_tokens=1536)
        if text:
            return text

        return (
            "PhenoRx Assistant (Offline Mode): I can help you interpret ADR predictions, "
            "understand laboratory reference ranges, and evaluate pharmacogenomic CYP alleles. "
            "For live AI responses, ensure NVIDIA_API_KEY is configured and the model endpoint "
            "is reachable."
        )
