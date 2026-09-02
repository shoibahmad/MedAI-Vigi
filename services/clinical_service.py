"""
Clinical Decision Support and Laboratory Interpretation Service
Provides reference intervals, multi-marker interpretation, and ADR risk factor analysis.
"""

from typing import Any, Dict, List, Optional


class ClinicalService:
    """Clinical reference intervals and rule-based diagnostic evaluation"""

    LAB_REFERENCE_RANGES: Dict[str, Dict[str, Any]] = {
        "creatinine": {
            "name": "Serum Creatinine",
            "unit": "mg/dL",
            "ranges": {"M": {"low": 0.7, "high": 1.3}, "F": {"low": 0.6, "high": 1.1}},
            "critical_high": 3.0,
            "clinical_significance": "Elevated creatinine indicates impaired renal filtration and reduced drug clearance.",
        },
        "egfr": {
            "name": "Estimated GFR",
            "unit": "mL/min/1.73m²",
            "ranges": {"M": {"low": 90.0, "high": 120.0}, "F": {"low": 90.0, "high": 120.0}},
            "critical_low": 30.0,
            "clinical_significance": "Values <60 mL/min indicate chronic kidney disease; <30 mL/min requires renal dose adjustment.",
        },
        "ast_alt": {
            "name": "AST/ALT Hepatic Transaminases",
            "unit": "U/L",
            "ranges": {"M": {"low": 10.0, "high": 40.0}, "F": {"low": 7.0, "high": 35.0}},
            "critical_high": 150.0,
            "clinical_significance": "Transaminase elevation >3x ULN signifies hepatocellular injury.",
        },
        "bilirubin": {
            "name": "Total Bilirubin",
            "unit": "mg/dL",
            "ranges": {"M": {"low": 0.2, "high": 1.2}, "F": {"low": 0.2, "high": 1.2}},
            "critical_high": 2.5,
            "clinical_significance": "Elevated bilirubin indicates cholestatic or hepatocellular impairment.",
        },
        "albumin": {
            "name": "Serum Albumin",
            "unit": "g/dL",
            "ranges": {"M": {"low": 3.5, "high": 5.0}, "F": {"low": 3.5, "high": 5.0}},
            "critical_low": 2.8,
            "clinical_significance": "Hypoalbuminemia increases the free active fraction of highly protein-bound drugs (e.g. Warfarin, Phenytoin).",
        },
    }

    KNOWN_DRUG_ADRS: Dict[str, List[str]] = {
        "Warfarin": ["Bleeding/Hemorrhage", "Bruising/Petechiae", "Elevated INR", "Necrosis"],
        "Metformin": [
            "Metabolic Acidosis",
            "Gastrointestinal (Nausea/Vomiting)",
            "Diarrhea",
            "Hypoglycemia",
        ],
        "Simvastatin": [
            "Muscle Pain/Myalgia",
            "Elevated Liver Enzymes",
            "Rhabdomyolysis",
            "Hepatotoxicity",
        ],
        "Aspirin": ["Gastrointestinal Bleeding", "Gastric Ulcer", "Tinnitus", "Hypersensitivity"],
        "Lisinopril": [
            "Dry Cough",
            "Hyperkalemia",
            "Angioedema",
            "Hypotension",
            "Acute Kidney Injury",
        ],
        "Amiodarone": [
            "QT Prolongation",
            "Cardiovascular Event (Arrhythmia)",
            "Hepatotoxicity",
            "Thyroid Dysfunction",
        ],
    }

    @classmethod
    def get_reference_ranges(cls) -> Dict[str, Any]:
        """Return standardized clinical laboratory reference ranges"""
        return {
            "renal": {
                "creatinine": cls.LAB_REFERENCE_RANGES["creatinine"],
                "egfr": cls.LAB_REFERENCE_RANGES["egfr"],
            },
            "liver": {
                "ast_alt": cls.LAB_REFERENCE_RANGES["ast_alt"],
                "bilirubin": cls.LAB_REFERENCE_RANGES["bilirubin"],
                "albumin": cls.LAB_REFERENCE_RANGES["albumin"],
            },
        }

    @classmethod
    def interpret_lab_value(cls, test_name: str, value: float, sex: str = "M") -> Dict[str, Any]:
        """Evaluate a single lab value against biological reference ranges"""
        test_key = test_name.lower().replace(" ", "_")
        ref_data = cls.LAB_REFERENCE_RANGES.get(test_key)

        if not ref_data:
            return {
                "test_name": test_name,
                "value": value,
                "status": "Unknown",
                "severity": "Normal",
                "clinical_significance": "No reference range available.",
            }

        ranges = ref_data["ranges"].get(sex.upper(), ref_data["ranges"]["M"])
        low, high = ranges["low"], ranges["high"]

        if value < low:
            status = "Low"
            severity = (
                "Severe"
                if "critical_low" in ref_data and value <= ref_data["critical_low"]
                else "Moderate"
            )
        elif value > high:
            status = "High"
            severity = (
                "Severe"
                if "critical_high" in ref_data and value >= ref_data["critical_high"]
                else "Moderate"
            )
        else:
            status = "Normal"
            severity = "Normal"

        return {
            "test_name": ref_data["name"],
            "value": value,
            "unit": ref_data["unit"],
            "status": status,
            "severity": severity,
            "reference_range": f"{low} - {high} {ref_data['unit']}",
            "clinical_significance": ref_data["clinical_significance"],
        }

    @classmethod
    def analyze_major_adr_factors(
        cls, patient_data: Dict[str, Any], adr_types: Optional[Dict[str, float]] = None
    ) -> List[Dict[str, Any]]:
        """Identify key physiological and pharmacogenomic risk drivers"""
        factors = []
        age = patient_data.get("age", 0)
        egfr = patient_data.get("egfr", 90.0)
        creatinine = patient_data.get("creatinine", 1.0)
        ast_alt = patient_data.get("ast_alt", 25.0)
        concomitant = patient_data.get("concomitant_drugs_count", 0)
        prior_adr = patient_data.get("prior_adr_history", 0)

        if age >= 65:
            factors.append(
                {
                    "factor": "Advanced Age",
                    "value": f"{age} years",
                    "risk_contribution": "High" if age >= 75 else "Medium",
                    "description": "Age-related reduction in renal clearance and hepatic Phase I metabolism.",
                }
            )

        if egfr < 60 or creatinine > 1.4:
            factors.append(
                {
                    "factor": "Renal Impairment",
                    "value": f"eGFR: {egfr} mL/min, Creatinine: {creatinine} mg/dL",
                    "risk_contribution": "Critical" if egfr < 30 else "High",
                    "description": "Impaired renal elimination leads to drug accumulation and nephrotoxicity.",
                }
            )

        if ast_alt > 60:
            factors.append(
                {
                    "factor": "Hepatic Transaminase Elevation",
                    "value": f"AST/ALT: {ast_alt} U/L",
                    "risk_contribution": "High" if ast_alt > 120 else "Medium",
                    "description": "Pre-existing hepatocellular stress elevates susceptibility to drug-induced liver injury.",
                }
            )

        if concomitant >= 5:
            factors.append(
                {
                    "factor": "Polypharmacy",
                    "value": f"{concomitant} concomitant medications",
                    "risk_contribution": "High",
                    "description": "Exponential risk of drug-drug interactions and competitive CYP binding.",
                }
            )

        if prior_adr == 1:
            factors.append(
                {
                    "factor": "Prior ADR History",
                    "value": "Positive",
                    "risk_contribution": "High",
                    "description": "Known idiosyncratic or pharmacodynamic hyper-reactivity.",
                }
            )

        return factors

    @classmethod
    def get_comprehensive_adr_list(cls, drug_name: str) -> List[str]:
        """Retrieve known ADR profile for drug"""
        return cls.KNOWN_DRUG_ADRS.get(
            drug_name, ["Gastrointestinal (Nausea/Vomiting)", "Rash", "Headache/Dizziness"]
        )

    @classmethod
    def generate_fallback_report(
        cls,
        patient_data: Dict[str, Any],
        prediction_result: Dict[str, Any],
        patient_name: str = "Patient",
        clinician_name: str = "Attending Clinician",
    ) -> str:
        """Generate structured deterministic clinical narrative report"""
        risk_level = prediction_result.get("risk_level", "Moderate")
        top_adr = prediction_result.get("predicted_adr_type", "General Adverse Reaction")
        overall_risk = prediction_result.get("overall_adr_risk", 50.0)

        report = f"""# Adverse Drug Reaction (ADR) Risk Assessment Report

## Patient Demographics & Context
- **Patient Name:** {patient_name}
- **Age:** {patient_data.get("age", "N/A")} years | **Sex:** {patient_data.get("sex", "N/A")}
- **Suspected / Index Medication:** {patient_data.get("medication_name", "Not specified")} ({patient_data.get("index_drug_dose", "N/A")} mg)
- **Concomitant Medications:** {patient_data.get("concomitant_drugs_count", 0)} drugs

## Machine Learning Stratification
- **Overall ADR Probability:** {overall_risk:.1f}%
- **Assessed Risk Level:** **{risk_level.upper()}**
- **Primary Suspected Reaction:** **{top_adr}**

## Clinical Risk Factors Identified
"""
        factors = cls.analyze_major_adr_factors(patient_data)
        for f in factors:
            report += f"- **{f['factor']}** ({f['value']}): {f['description']}\n"

        report += f"""
## Pharmacovigilance Recommendations
1. **Dose Optimization:** Review current dosing regimen against renal/hepatic function.
2. **Laboratory Monitoring:** Repeat renal and hepatic panels within 7-14 days.
3. **Patient Counselling:** Counsel patient on early symptoms of {top_adr}.

---
*Generated by PhenoRx Clinical Decision Support Engine (Offline Rule-Based Mode)*
*Evaluating Clinician: {clinician_name}*
"""
        return report
