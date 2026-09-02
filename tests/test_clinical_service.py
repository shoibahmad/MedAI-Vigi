"""
Unit Tests for Clinical Decision Support Service
"""

from services.clinical_service import ClinicalService


def test_interpret_lab_value_renal() -> None:
    """Test interpretation of normal and elevated creatinine values"""
    normal_res = ClinicalService.interpret_lab_value("creatinine", 0.9, sex="M")
    assert normal_res["status"] == "Normal"

    elevated_res = ClinicalService.interpret_lab_value("creatinine", 2.8, sex="M")
    assert elevated_res["status"] == "High"
    assert "renal" in elevated_res["clinical_significance"].lower()


def test_interpret_lab_value_hepatic() -> None:
    """Test interpretation of AST/ALT hepatic values"""
    elevated_ast = ClinicalService.interpret_lab_value("ast_alt", 120.0)
    assert elevated_ast["status"] == "High"
    assert elevated_ast["severity"] in ["Moderate", "Severe"]


def test_analyze_major_adr_factors() -> None:
    """Test major ADR contributing factor identification"""
    patient = {
        "age": 75,
        "creatinine": 2.5,
        "egfr": 25.0,
        "ast_alt": 110.0,
        "concomitant_drugs_count": 7,
        "prior_adr_history": 1,
        "diabetes": 1,
        "ckd": 1,
    }
    factors = ClinicalService.analyze_major_adr_factors(patient)
    assert len(factors) >= 4
    factor_names = [f["factor"] for f in factors]
    assert "Advanced Age" in factor_names
    assert "Renal Impairment" in factor_names
    assert "Polypharmacy" in factor_names


def test_get_comprehensive_adr_list() -> None:
    """Test retrieval of known ADRs for specific medication"""
    warfarin_adrs = ClinicalService.get_comprehensive_adr_list("Warfarin")
    assert "Bleeding/Hemorrhage" in warfarin_adrs
    assert "Bruising/Petechiae" in warfarin_adrs
