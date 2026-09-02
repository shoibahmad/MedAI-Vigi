"""
Non-CYP Precision Genetic Enzymes (TPMT, DPYD, VKORC1)
"""

from typing import Any, Dict


class NonCYPEngine:
    """Evaluates non-CYP genetic markers for thiopurines, fluoropyrimidines, and warfarin"""

    def __init__(self) -> None:
        self.non_cyp_enzymes: Dict[str, Dict[str, Dict[str, Any]]] = {
            "TPMT": {
                "*1/*1": {
                    "activity": 1.0,
                    "risk": "Normal",
                    "impact": "Standard thiopurine dosing",
                },
                "*1/*3A": {
                    "activity": 0.5,
                    "risk": "Intermediate",
                    "impact": "Reduce thiopurine dose by 30-50%",
                },
                "*3A/*3A": {
                    "activity": 0.0,
                    "risk": "Poor",
                    "impact": "Reduce thiopurine dose by 90% or avoid",
                },
            },
            "DPYD": {
                "*1/*1": {
                    "activity": 1.0,
                    "risk": "Normal",
                    "impact": "Standard fluoropyrimidine dosing",
                },
                "*2A/*1": {
                    "activity": 0.5,
                    "risk": "Intermediate",
                    "impact": "Reduce 5-FU/capecitabine dose by 50%",
                },
                "*2A/*2A": {
                    "activity": 0.0,
                    "risk": "Poor",
                    "impact": "Fluoropyrimidines strictly contraindicated",
                },
            },
            "VKORC1": {
                "GG": {
                    "activity": 1.0,
                    "risk": "Normal",
                    "impact": "Standard warfarin dose requirement",
                },
                "GA": {
                    "activity": 0.7,
                    "risk": "Sensitive",
                    "impact": "Moderate warfarin sensitivity",
                },
                "AA": {
                    "activity": 0.4,
                    "risk": "High Sensitivity",
                    "impact": "High warfarin sensitivity, lower starting dose",
                },
            },
        }

    def analyze_profile(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analysis of non-CYP precision pharmacogenomic markers (TPMT, DPYD, VKORC1)"""
        enzymes = {
            "TPMT": patient_data.get("tpmt_genotype", "*1/*1"),
            "DPYD": patient_data.get("dpyd_genotype", "*1/*1"),
            "VKORC1": patient_data.get("vkorc1_genotype", "GG"),
        }

        analysis = {}
        high_risk_flag = False

        for gene, genotype in enzymes.items():
            profile = self.non_cyp_enzymes.get(gene, {}).get(
                genotype, {"activity": 1.0, "risk": "Normal", "impact": "Standard dosing"}
            )
            if profile["risk"] in ("Poor", "High Sensitivity"):
                high_risk_flag = True
            analysis[gene] = {
                "genotype": genotype,
                "activity_level": profile["activity"],
                "risk_category": profile["risk"],
                "clinical_impact": profile["impact"],
            }

        return {
            "non_cyp_profiles": analysis,
            "high_risk_non_cyp": high_risk_flag,
        }
