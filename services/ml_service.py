"""
Machine Learning Inference Service for ADR Risk Prediction
Handles model loading, dataframe transformation, and probability distribution calibration.
"""

import logging
import os
from typing import Any, Dict, Optional

import pandas as pd

from services.clinical_service import ClinicalService
from services.pharmacogenomics import PharmacogenomicsEngine
from utils.errors import ModelInferenceError, ModelNotReadyError
from utils.model_utils import load_adr_models

logger = logging.getLogger(__name__)


class MLService:
    """Singleton ML Service managing Scikit-Learn Pipeline and HistGradientBoosting predictions"""

    _instance: Optional["MLService"] = None

    def __init__(self, model_path: str = "models/adr_model.pkl") -> None:
        self.model_path = model_path
        self.model: Optional[Any] = None
        self.preprocessor: Optional[Any] = None
        self.pgx_engine = PharmacogenomicsEngine()
        self._load_artifacts()

    @classmethod
    def get_instance(cls, model_path: str = "models/adr_model.pkl") -> "MLService":
        """Retrieve singleton service instance"""
        if cls._instance is None:
            cls._instance = cls(model_path=model_path)
        return cls._instance

    def _load_artifacts(self) -> None:
        """Attempt to load trained pipeline or preprocessors"""
        if os.path.exists(self.model_path):
            try:
                self.model, self.preprocessor = load_adr_models(
                    os.path.dirname(self.model_path) or "models"
                )
                logger.info("ML model and preprocessor artifacts loaded successfully.")
            except Exception as e:
                logger.warning(
                    "model_load_failed",
                    extra={"path": self.model_path, "error": str(e)},
                )
                self.model = None
                self.preprocessor = None
        else:
            logger.warning(
                "model_path_not_found",
                extra={"path": self.model_path},
            )

    def is_ready(self) -> bool:
        """Check if model is loaded and ready for inference"""
        return self.model is not None

    def prepare_feature_dataframe(self, patient_data: Dict[str, Any]) -> pd.DataFrame:
        """Map client JSON payload into the 38-feature vector required by the trained pipeline"""
        row: Dict[str, Any] = {
            "age": patient_data.get("age", 45),
            "sex": patient_data.get("sex", "M"),
            "ethnicity": patient_data.get("ethnicity", "Asian"),
            "bmi": patient_data.get("bmi", 24.0),
            "height": patient_data.get("height", 170.0),
            "weight": patient_data.get("weight", 70.0),
            "creatinine": patient_data.get("creatinine", 1.0),
            "egfr": patient_data.get("egfr", 90.0),
            "ast_alt": patient_data.get("ast_alt", 25.0),
            "bilirubin": patient_data.get("bilirubin", 0.8),
            "albumin": patient_data.get("albumin", 4.2),
            "hemoglobin": patient_data.get("hemoglobin", 14.0),
            "hematocrit": patient_data.get("hematocrit", 42.0),
            "wbc_count": patient_data.get("wbc_count", 7000.0),
            "platelet_count": patient_data.get("platelet_count", 250000.0),
            "rbc_count": patient_data.get("rbc_count", 4.8),
            "neutrophils": patient_data.get("neutrophils", 60.0),
            "lymphocytes": patient_data.get("lymphocytes", 30.0),
            "monocytes": patient_data.get("monocytes", 7.0),
            "eosinophils": patient_data.get("eosinophils", 2.0),
            "basophils": patient_data.get("basophils", 1.0),
            "mcv": patient_data.get("mcv", 90.0),
            "mch": patient_data.get("mch", 30.0),
            "mchc": patient_data.get("mchc", 34.0),
            "rdw": patient_data.get("rdw", 13.0),
            "bp_systolic": patient_data.get("bp_systolic", 120.0),
            "bp_diastolic": patient_data.get("bp_diastolic", 80.0),
            "heart_rate": patient_data.get("heart_rate", 75.0),
            "temperature": patient_data.get("temperature", 37.0),
            "ind_value": patient_data.get("ind_value", 1.0),
            "atpp_value": patient_data.get("atpp_value", 30.0),
            "indication": patient_data.get("indication", "Pain"),
            "cyp2c9": patient_data.get("cyp2c9", "Wild"),
            "cyp2d6": patient_data.get("cyp2d6", "EM"),
            "cyp3a4": patient_data.get("cyp3a4", "Normal"),
            "cyp1a2": patient_data.get("cyp1a2", "Normal"),
            "cyp2b6": patient_data.get("cyp2b6", "Normal"),
            "cyp2c19": patient_data.get("cyp2c19", "EM"),
            "slco1b1_genotype": patient_data.get("slco1b1_genotype", "*1/*1"),
            "abcb1_genotype": patient_data.get("abcb1_genotype", "CC"),
            "abcg2_genotype": patient_data.get("abcg2_genotype", "Wild/Wild"),
            "medication_name": patient_data.get("medication_name", "Warfarin"),
            "index_drug_dose": patient_data.get("index_drug_dose", 5.0),
            "time_since_start_days": patient_data.get("time_since_start_days", 7),
            "concomitant_drugs_count": patient_data.get("concomitant_drugs_count", 0),
            "diabetes": patient_data.get("diabetes", 0),
            "liver_disease": patient_data.get("liver_disease", 0),
            "ckd": patient_data.get("ckd", 0),
            "cardiac_disease": patient_data.get("cardiac_disease", 0),
            "hypertension": patient_data.get("hypertension", 0),
            "respiratory_disease": patient_data.get("respiratory_disease", 0),
            "neurological_disease": patient_data.get("neurological_disease", 0),
            "autoimmune_disease": patient_data.get("autoimmune_disease", 0),
            "cyp_inhibitors_flag": patient_data.get("cyp_inhibitors_flag", 0),
            "qt_prolonging_flag": patient_data.get("qt_prolonging_flag", 0),
            "hla_risk_allele_flag": patient_data.get("hla_risk_allele_flag", 0),
            "inpatient_flag": patient_data.get("inpatient_flag", 0),
            "prior_adr_history": patient_data.get("prior_adr_history", 0),
            "polypharmacy_flag": patient_data.get("polypharmacy_flag", 0),
            "high_risk_drug_flag": patient_data.get("high_risk_drug_flag", 0),
            "cumulative_dose_mg": patient_data.get("cumulative_dose_mg", 0.0),
            "dose_density_mg_day": patient_data.get("dose_density_mg_day", 0.0),
        }
        return pd.DataFrame([row])

    def predict(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute ML inference pipeline and return calibrated risk probabilities"""
        if not self.is_ready() or self.model is None:
            raise ModelNotReadyError(
                "ADR predictive model is not loaded. Model artifacts are unavailable."
            )
        assert self.model is not None

        try:
            df = self.prepare_feature_dataframe(patient_data)

            # Predict probabilities
            if hasattr(self.model, "predict_proba"):
                probabilities = self.model.predict_proba(df)[0]
                classes = self.model.classes_
            else:
                pred_label = self.model.predict(df)[0]
                classes = [pred_label]
                probabilities = [1.0]

            class_probs = {
                str(cls_name): round(float(prob) * 100, 2)
                for cls_name, prob in zip(classes, probabilities, strict=False)
            }

            # Extract No ADR probability
            no_adr_prob = class_probs.get("No ADR", 50.0)
            overall_adr_risk = round(100.0 - no_adr_prob, 2)

            # Filter specific ADRs
            specific_adrs = {k: v for k, v in class_probs.items() if k != "No ADR"}
            sorted_adrs = sorted(specific_adrs.items(), key=lambda x: x[1], reverse=True)
            top_adrs = dict(sorted_adrs[:5])

            top_adr_type = sorted_adrs[0][0] if sorted_adrs else "General Adverse Reaction"

            # Risk Tier Categorization
            if overall_adr_risk >= 75.0:
                risk_level = "Critical"
            elif overall_adr_risk >= 50.0:
                risk_level = "High"
            elif overall_adr_risk >= 25.0:
                risk_level = "Moderate"
            else:
                risk_level = "Low"

            # Pharmacogenomics Profile
            pgx_cyp = self.pgx_engine.analyze_expanded_cyp_profile(patient_data)
            pgx_transporter = self.pgx_engine.analyze_transporter_genetics(patient_data)
            pgx_hla = self.pgx_engine.analyze_hla_hypersensitivity_risk(
                patient_data, medication_name=patient_data.get("medication_name", "")
            )

            # Clinical Factors
            major_factors = ClinicalService.analyze_major_adr_factors(patient_data, top_adrs)

            return {
                "status": "success",
                "risk_level": risk_level,
                "overall_adr_risk": overall_adr_risk,
                "no_adr_probability": no_adr_prob,
                "predicted_adr_type": top_adr_type,
                "top_specific_adr_risks": top_adrs,
                "all_class_probabilities": class_probs,
                "major_contributing_factors": major_factors,
                "pharmacogenomics": {
                    "cyp_metabolism": pgx_cyp,
                    "transporters": pgx_transporter,
                    "hla_alleles": pgx_hla,
                },
            }

        except ModelNotReadyError:
            raise
        except Exception as e:
            logger.error("Inference error in MLService", extra={"error": str(e)}, exc_info=True)
            raise ModelInferenceError(
                f"Inference execution failed: {e}", details={"error": str(e)}
            ) from e
