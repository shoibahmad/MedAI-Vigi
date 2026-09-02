"""
HLA Allele Screening and Severe Immune-Mediated Hypersensitivity Engine
"""

from typing import Any, Dict, List


class HLAEngine:
    """Screens for high-risk HLA alleles causing severe cutaneous adverse reactions (SCAR/SJS/TEN/DILI)"""

    def __init__(self) -> None:
        self.hla_drug_associations: Dict[str, Dict[str, Any]] = {
            "HLA-B*5701": {
                "drugs": ["Abacavir", "Flucloxacillin"],
                "reaction": "Severe Hypersensitivity Syndrome",
                "risk_level": "Critical",
            },
            "HLA-B*5801": {
                "drugs": ["Allopurinol", "Carbamazepine"],
                "reaction": "Stevens-Johnson Syndrome / Toxic Epidermal Necrolysis",
                "risk_level": "Critical",
            },
            "HLA-A*3101": {
                "drugs": ["Carbamazepine", "Phenytoin"],
                "reaction": "Severe Cutaneous Adverse Reactions (SCAR)",
                "risk_level": "High",
            },
            "HLA-DRB1*0701": {
                "drugs": ["Lapatinib"],
                "reaction": "Drug-Induced Liver Injury (DILI)",
                "risk_level": "High",
            },
        }

    def analyze_profile(self, patient_data: Dict[str, Any], medication_name: str) -> Dict[str, Any]:
        """HLA allele screening for severe hypersensitivity syndromes"""
        patient_alleles: List[str] = []
        for locus in ["hla_a_typing", "hla_b_typing", "hla_drb1_typing"]:
            val = patient_data.get(locus, [])
            if isinstance(val, list):
                patient_alleles.extend(val)
            elif val:
                patient_alleles.append(str(val))

        high_risk_present = []
        drug_specific_risks = []
        overall_risk = "Low"

        for allele, data in self.hla_drug_associations.items():
            if allele in patient_alleles:
                high_risk_present.append(
                    {
                        "allele": allele,
                        "associated_drugs": data["drugs"],
                        "reaction": data["reaction"],
                        "risk_level": data["risk_level"],
                    }
                )

                if medication_name in data["drugs"]:
                    overall_risk = "Critical"
                    drug_specific_risks.append(
                        {
                            "medication": medication_name,
                            "hla_allele": allele,
                            "reaction": data["reaction"],
                            "recommendation": f"CONTRAINDICATED - High risk of {data['reaction']}. Select alternative agent.",
                        }
                    )

        return {
            "high_risk_alleles_present": high_risk_present,
            "drug_specific_risks": drug_specific_risks,
            "overall_hypersensitivity_risk": overall_risk,
        }
