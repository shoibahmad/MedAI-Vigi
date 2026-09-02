"""
CYP Enzyme Phase I/II Activity and Metabolizer Phenotyping Engine
"""

from typing import Any, Dict


class CYPEngine:
    """Calculates CYP enzyme activity scores and metabolic risk profiles"""

    def __init__(self) -> None:
        self.cyp_activity_scores: Dict[str, Dict[str, float]] = {
            "CYP2C9": {"Poor": 0.1, "Intermediate": 0.5, "Wild": 1.0, "Rapid": 1.5},
            "CYP2D6": {"PM": 0.0, "IM": 0.5, "EM": 1.0, "UM": 2.0},
            "CYP3A4": {"Poor": 0.2, "Intermediate": 0.6, "Normal": 1.0, "Rapid": 1.8},
            "CYP1A2": {"Slow": 0.3, "Intermediate": 0.7, "Normal": 1.0, "Rapid": 1.6},
            "CYP2B6": {"Poor": 0.1, "Intermediate": 0.4, "Normal": 1.0, "Rapid": 1.7},
            "CYP2C19": {"PM": 0.0, "IM": 0.3, "EM": 1.0, "RM": 1.5, "UM": 2.5},
        }

    def analyze_profile(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive CYP enzyme metabolizer scoring"""
        cyp_inputs = {
            "CYP2C9": patient_data.get("cyp2c9", "Wild"),
            "CYP2D6": patient_data.get("cyp2d6", "EM"),
            "CYP3A4": patient_data.get("cyp3a4", "Normal"),
            "CYP1A2": patient_data.get("cyp1a2", "Normal"),
            "CYP2B6": patient_data.get("cyp2b6", "Normal"),
            "CYP2C19": patient_data.get("cyp2c19", "EM"),
        }

        detailed_analysis = {}
        total_activity = 0.0

        for enzyme, genotype in cyp_inputs.items():
            activity_score = self.cyp_activity_scores.get(enzyme, {}).get(genotype, 1.0)
            if activity_score <= 0.2:
                risk_level = "Critical"
                impact = "Severe metabolic impairment - consider major dose reduction or alternative drug"
            elif activity_score <= 0.5:
                risk_level = "High"
                impact = "Moderate metabolic impairment - dose reduction recommended"
            elif activity_score >= 1.5:
                risk_level = "Moderate"
                impact = "Ultrarapid metabolism - risk of therapeutic failure or prodrug toxicity"
            else:
                risk_level = "Low"
                impact = "Extensive / normal expected metabolism"

            detailed_analysis[enzyme] = {
                "genotype": genotype,
                "activity_score": activity_score,
                "risk_level": risk_level,
                "clinical_impact": impact,
            }
            total_activity += activity_score

        composite_score = round(total_activity / len(cyp_inputs), 2)
        if composite_score <= 0.3:
            overall_risk = "Critical - Severe metabolic impairment"
        elif composite_score <= 0.6:
            overall_risk = "High - Significant metabolic impairment"
        elif composite_score >= 1.5:
            overall_risk = "Moderate - Enhanced rapid metabolism"
        else:
            overall_risk = "Low - Normal baseline metabolism"

        return {
            "individual_enzymes": detailed_analysis,
            "composite_metabolism_score": composite_score,
            "overall_risk_assessment": overall_risk,
        }
