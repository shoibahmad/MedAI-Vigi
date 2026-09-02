"""
Modular Pharmacogenomics Engine Orchestrator
Bridges CYP, Transporter, HLA, and Non-CYP sub-engines into a unified precision dosing interface.
"""

from typing import Any, Dict

from services.pharmacogenomics.cyp_engine import CYPEngine
from services.pharmacogenomics.hla_engine import HLAEngine
from services.pharmacogenomics.non_cyp_engine import NonCYPEngine
from services.pharmacogenomics.transporter_engine import TransporterEngine


class PharmacogenomicsEngine:
    """Unified PGx rule and scoring engine for drug metabolism and safety"""

    def __init__(self) -> None:
        self.cyp_engine = CYPEngine()
        self.transporter_engine = TransporterEngine()
        self.hla_engine = HLAEngine()
        self.non_cyp_engine = NonCYPEngine()

    def analyze_expanded_cyp_profile(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive CYP enzyme metabolizer scoring"""
        return self.cyp_engine.analyze_profile(patient_data)

    def analyze_transporter_genetics(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive drug transporter genetic profiling"""
        return self.transporter_engine.analyze_profile(patient_data)

    def analyze_hla_hypersensitivity_risk(
        self, patient_data: Dict[str, Any], medication_name: str
    ) -> Dict[str, Any]:
        """HLA allele screening for severe hypersensitivity syndromes"""
        return self.hla_engine.analyze_profile(patient_data, medication_name)

    def analyze_non_cyp_enzymes(self, patient_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analysis of non-CYP precision pharmacogenomic markers (TPMT, DPYD, VKORC1)"""
        return self.non_cyp_engine.analyze_profile(patient_data)
