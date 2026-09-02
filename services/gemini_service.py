"""
Google Gemini GenAI Service for Clinical Narrative Generation
Provides secure GenAI interaction with zero credential logging and deterministic offline fallbacks.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from services.clinical_service import ClinicalService

logger = logging.getLogger(__name__)


class GeminiService:
    """Singleton Google GenAI client wrapper for narrative generation and pharmacovigilance chat"""

    _instance: Optional["GeminiService"] = None

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash") -> None:
        self.api_key = api_key if api_key is not None else os.getenv("GEMINI_API_KEY", "")
        # Dedicated key for drug-interaction work, matching the original design.
        # Spreads quota across two projects; falls back to the primary key.
        self.drug_api_key = os.getenv("GEMINI_API_KEY_DRUG_INTERACTIONS", "") or self.api_key
        self.model_name = model_name
        self.client: Optional[Any] = None
        self.drug_client: Optional[Any] = None
        self._initialize_client()

    @classmethod
    def get_instance(
        cls, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"
    ) -> "GeminiService":
        """Retrieve singleton service instance"""
        if cls._instance is None:
            cls._instance = cls(api_key=api_key, model_name=model_name)
        return cls._instance

    def _initialize_client(self) -> None:
        """Initialize Google GenAI client safely with zero secret logging"""
        if not self.api_key:
            logger.info(
                "No GEMINI_API_KEY detected. AI features running in deterministic offline fallback mode."
            )
            self.client = None
            return

        try:
            import google.genai as genai

            self.client = genai.Client(api_key=self.api_key)
            self.drug_client = (
                genai.Client(api_key=self.drug_api_key)
                if self.drug_api_key and self.drug_api_key != self.api_key
                else self.client
            )
            logger.info("Google GenAI client initialized successfully.")
        except Exception as e:
            logger.warning(
                f"Unable to initialize Google GenAI SDK: {e}. Falling back to rule-based generation."
            )
            self.client = None

    def is_available(self) -> bool:
        """Check if GenAI client is active and configured"""
        return self.client is not None

    def generate_clinical_report(
        self,
        patient_data: Dict[str, Any],
        prediction_result: Dict[str, Any],
        patient_name: str = "Patient",
        clinician_name: str = "Attending Physician",
    ) -> Dict[str, Any]:
        """Generate structured clinical report using Gemini with automatic offline fallback"""
        if not self.is_available() or self.client is None:
            report_text = ClinicalService.generate_fallback_report(
                patient_data, prediction_result, patient_name, clinician_name
            )
            return {
                "report": report_text,
                "generated_at": datetime.now().isoformat(),
                "ai_generated": False,
                "model": "rule-based-fallback",
            }
        assert self.client is not None

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
        try:
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return {
                "report": response.text if response else "",
                "generated_at": datetime.now().isoformat(),
                "ai_generated": True,
                "model": self.model_name,
            }
        except Exception as e:
            logger.warning(
                f"GenAI report generation failed: {e}. Falling back to rule-based report."
            )
            fallback_text = ClinicalService.generate_fallback_report(
                patient_data, prediction_result, patient_name, clinician_name
            )
            return {
                "report": fallback_text,
                "generated_at": datetime.now().isoformat(),
                "ai_generated": False,
                "model": f"{self.model_name}-fallback",
                "fallback_reason": str(e),
            }

    def analyze_drug_interactions(
        self, drugs: List[str], patient_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Evaluate multi-drug interactions"""
        if not self.is_available() or self.client is None:
            return {
                "interactions_found": len(drugs) > 1,
                "severity": "Moderate" if len(drugs) > 2 else "Low",
                "interactions": [
                    {
                        "drugs_involved": drugs[:2] if len(drugs) >= 2 else drugs,
                        "severity": "Moderate",
                        "mechanism": "Potential competitive CYP enzyme metabolism or additive pharmacodynamic effect.",
                        "clinical_management": "Monitor clinical response and relevant laboratory parameters regularly.",
                    }
                ],
                "ai_generated": False,
            }
        assert self.client is not None

        prompt = f"""
As a Clinical Pharmacologist, analyze potential drug-drug interactions for:
Medications: {", ".join(drugs)}
Patient Context: {patient_data if patient_data else "Standard adult"}

Return concise summary with severity and clinical management actions.
"""
        try:
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return {
                "raw_response": response.text if response else "",
                "interactions_found": len(drugs) > 1,
                "ai_generated": True,
            }
        except Exception as e:
            logger.warning(f"Interaction analysis failed: {e}. Using deterministic fallback.")
            return {
                "interactions_found": len(drugs) > 1,
                "severity": "Moderate",
                "interactions": [
                    {
                        "drugs_involved": drugs,
                        "severity": "Moderate",
                        "mechanism": "Standard interaction rule",
                        "clinical_management": "Monitor",
                    }
                ],
                "ai_generated": False,
            }

    def generate_drug_insights(
        self,
        medications: List[Dict[str, Any]],
        patient_age: Any = "Not specified",
        comorbidities: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Deep drug-drug interaction narrative for a full regimen.

        Ported from debug_server.py:1718. The legacy version used a second Gemini
        API key (GEMINI_API_KEY_DRUG_INTERACTIONS) via the deprecated
        google.generativeai SDK; this uses the same client as every other call and
        degrades to a deterministic summary when no key is configured.
        """
        comorbidities = comorbidities or []
        names = [str(m.get("name", m)) if isinstance(m, dict) else str(m) for m in medications]

        if not self.is_available() or self.client is None:
            return {
                "status": "success",
                "ai_generated": False,
                "medication_count": len(names),
                "insights": (
                    f"Offline analysis for {len(names)} agents ({', '.join(names)}). "
                    "Review for shared CYP450 metabolic pathways, additive pharmacodynamic "
                    "effects, and cumulative QT or bleeding risk. Configure GEMINI_API_KEY "
                    "for a full AI-generated interaction narrative."
                ),
            }
        assert self.client is not None

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
        try:
            response = (self.drug_client or self.client).models.generate_content(
                model=self.model_name, contents=prompt
            )
            return {
                "status": "success",
                "ai_generated": True,
                "medication_count": len(names),
                "insights": response.text if response and response.text else "",
            }
        except Exception as e:
            logger.warning(f"Drug insight generation failed: {e}. Using deterministic fallback.")
            return {
                "status": "success",
                "ai_generated": False,
                "medication_count": len(names),
                "insights": f"AI analysis unavailable ({e}). Review the regimen manually.",
            }

    def generate_medication_analysis(
        self,
        patient_data: Dict[str, Any],
        prediction_result: Dict[str, Any],
        patient_name: str = "Patient",
    ) -> Dict[str, Any]:
        """
        Medication therapy management narrative.
        Ported from debug_server.py:1438.
        """
        drug = patient_data.get("medication_name", "Unknown")

        if not self.is_available() or self.client is None:
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
        assert self.client is not None

        prompt = f"""As a clinical pharmacist and medication therapy management specialist, provide a comprehensive medication analysis for:

Patient: {patient_name}
Age: {patient_data.get("age", "Unknown")} years
Current Medication: {drug}
Current Dose: {patient_data.get("index_drug_dose", "Unknown")} mg
Risk Level: {prediction_result.get("risk_level", "Unknown")}
Predicted ADR: {prediction_result.get("predicted_adr", prediction_result.get("predicted_adr_type", "Unknown"))}

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
        try:
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return {
                "status": "success",
                "ai_generated": True,
                "analysis": response.text if response and response.text else "",
            }
        except Exception as e:
            logger.warning(f"Medication analysis failed: {e}. Using deterministic fallback.")
            return {
                "status": "success",
                "ai_generated": False,
                "analysis": f"AI analysis unavailable ({e}). Review the regimen manually.",
            }

    @staticmethod
    def _mitigation_schema() -> Any:
        """Array of prioritized mitigation actions."""
        from google.genai import types

        return types.Schema(
            type=types.Type.ARRAY,
            items=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "priority": types.Schema(type=types.Type.STRING),
                    "action": types.Schema(type=types.Type.STRING),
                    "rationale": types.Schema(type=types.Type.STRING),
                },
                required=["priority", "action", "rationale"],
            ),
        )

    @staticmethod
    def _organ_schema() -> Any:
        """Object keyed by organ system, each with a score and narrative."""
        from google.genai import types

        def system() -> Any:
            return types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "risk_score": types.Schema(type=types.Type.INTEGER),
                    "status": types.Schema(type=types.Type.STRING),
                    "findings": types.Schema(type=types.Type.STRING),
                    "monitoring": types.Schema(type=types.Type.STRING),
                },
                required=["risk_score", "status", "findings", "monitoring"],
            )

        return types.Schema(
            type=types.Type.OBJECT,
            properties={
                "renal_system": system(),
                "hepatic_system": system(),
                "hematologic_system": system(),
                "cardiovascular_system": system(),
            },
            required=[
                "renal_system",
                "hepatic_system",
                "hematologic_system",
                "cardiovascular_system",
            ],
        )

    def _generate_json(
        self,
        prompt: str,
        schema: Optional[Any] = None,
        client: Optional[Any] = None,
    ) -> Optional[Any]:
        """
        Ask Gemini for JSON and parse it.

        A response_schema is passed whenever the caller supplies one. That matters:
        with response_mime_type alone the model intermittently emits malformed JSON
        (unterminated strings, missing delimiters), because the format is only
        requested, not enforced. A schema constrains decoding, so the payload is
        structurally valid by construction.

        Markdown fences are still stripped defensively, and any failure returns
        None so the caller can fall back to deterministic logic.
        """
        target = client or self.client
        if target is None:
            return None

        try:
            from google.genai import types

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=4096,
                **({"response_schema": schema} if schema is not None else {}),
            )
            response = target.models.generate_content(
                model=self.model_name, contents=prompt, config=config
            )
        except Exception as e:
            logger.warning(f"JSON generation call failed: {e}")
            return None

        text = (response.text or "").strip() if response else ""
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
            logger.warning(f"Gemini returned unparseable JSON: {e}")
            return None

    @staticmethod
    def _fallback_organ_breakdown(patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Deterministic organ-system scoring, used when Gemini is unavailable."""
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

        if not self.is_available():
            return {"organ_system_breakdown": fallback, "ai_generated": False}

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

        parsed = self._generate_json(prompt, schema=self._organ_schema())
        if not isinstance(parsed, dict):
            logger.info("Detailed analysis falling back to rule-based breakdown.")
            return {"organ_system_breakdown": fallback, "ai_generated": False}

        # Guarantee the three keys the existing clients rely on.
        for key, default in fallback.items():
            entry = parsed.get(key)
            if not isinstance(entry, dict) or "risk_score" not in entry:
                parsed[key] = default

        return {"organ_system_breakdown": parsed, "ai_generated": True}

    @staticmethod
    def _fallback_mitigation(prediction_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Deterministic mitigation list, used when Gemini is unavailable."""
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

        if not self.is_available():
            return {"mitigation_strategies": fallback, "ai_generated": False}

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

Return ONLY a JSON array of 4 to 6 objects, ordered most urgent first. Each object:
  "priority"  one of "Critical", "High", "Medium", "Low"
  "action"    short imperative title, under 60 characters
  "rationale" one or two sentences citing THIS patient's specific values

Be specific to the numbers above - do not give generic advice.
"""

        parsed = self._generate_json(prompt, schema=self._mitigation_schema())
        if isinstance(parsed, dict):
            for key in ("mitigation_strategies", "strategies", "items"):
                if isinstance(parsed.get(key), list):
                    parsed = parsed[key]
                    break

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

        return {"mitigation_strategies": clean, "ai_generated": True}

    def chat_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Handle chatbot queries with pharmacovigilance expertise"""
        if not self.is_available() or self.client is None:
            return (
                "PhenoRx Assistant (Offline Mode): I can help you interpret ADR predictions, "
                "understand laboratory reference ranges, and evaluate pharmacogenomic CYP alleles. "
                "For live AI responses, ensure the GEMINI_API_KEY is configured in your environment."
            )
        assert self.client is not None

        prompt = f"""
You are PhenoRx Assistant, a clinical pharmacologist and medical AI assistant specializing in adverse drug reactions, pharmacogenomics, and patient medication safety.
User Query: {message}
Context: {context if context else "None"}

Provide an accurate, concise, evidence-based clinical explanation with actionable pharmacovigilance guidance.
"""
        try:
            response = self.client.models.generate_content(model=self.model_name, contents=prompt)
            return response.text if response and response.text else "No response generated."
        except Exception as e:
            logger.warning(f"Chat generation error: {e}")
            return f"Clinical Assistant temporarily in fallback mode: {e}"
