"""
Unit Tests for Clinical Service Reference Ranges and Multi-Severity Interpretation
"""

from services.clinical_service import ClinicalService


def test_creatinine_interpretation_severities() -> None:
    """Test creatinine interpretation across Normal, Elevated (Moderate), and Critical (Severe) severities"""
    # Normal male
    normal = ClinicalService.interpret_lab_value("creatinine", 0.9, sex="M")
    assert normal["status"] == "Normal"
    assert normal["severity"] == "Normal"

    # Elevated male (Moderate)
    elevated = ClinicalService.interpret_lab_value("creatinine", 1.8, sex="M")
    assert elevated["status"] == "High"
    assert elevated["severity"] == "Moderate"

    # Critical male (Severe >= 3.0)
    critical = ClinicalService.interpret_lab_value("creatinine", 3.8, sex="M")
    assert critical["status"] == "High"
    assert critical["severity"] == "Severe"


def test_egfr_interpretation_severities() -> None:
    """Test eGFR interpretation across Normal, Mild/Moderate, and Severe CKD"""
    # Normal
    normal = ClinicalService.interpret_lab_value("egfr", 105.0)
    assert normal["status"] == "Normal"
    assert normal["severity"] == "Normal"

    # Reduced / Moderate
    moderate = ClinicalService.interpret_lab_value("egfr", 45.0)
    assert moderate["status"] == "Low"
    assert moderate["severity"] == "Moderate"

    # Severe (<30)
    critical = ClinicalService.interpret_lab_value("egfr", 18.0)
    assert critical["status"] == "Low"
    assert critical["severity"] == "Severe"


def test_ast_alt_hepatic_severities() -> None:
    """Test transaminases hepatic injury classification"""
    # Normal female
    normal = ClinicalService.interpret_lab_value("ast_alt", 22.0, sex="F")
    assert normal["status"] == "Normal"
    assert normal["severity"] == "Normal"

    # Moderate elevation
    moderate = ClinicalService.interpret_lab_value("ast_alt", 75.0, sex="F")
    assert moderate["status"] == "High"
    assert moderate["severity"] == "Moderate"

    # Severe hepatocellular injury (>150)
    critical = ClinicalService.interpret_lab_value("ast_alt", 220.0, sex="F")
    assert critical["status"] == "High"
    assert critical["severity"] == "Severe"


def test_bilirubin_and_albumin_severities() -> None:
    """Test bilirubin and albumin multi-level classification"""
    # Normal Bilirubin
    bili_norm = ClinicalService.interpret_lab_value("bilirubin", 0.8)
    assert bili_norm["status"] == "Normal"
    assert bili_norm["severity"] == "Normal"

    # Severe Bilirubin (>=2.5)
    bili_crit = ClinicalService.interpret_lab_value("bilirubin", 3.2)
    assert bili_crit["status"] == "High"
    assert bili_crit["severity"] == "Severe"

    # Severe Low Albumin (<=2.8)
    alb_crit = ClinicalService.interpret_lab_value("albumin", 2.2)
    assert alb_crit["status"] == "Low"
    assert alb_crit["severity"] == "Severe"


def test_unknown_lab_handling() -> None:
    """Test unrecognized laboratory test name handling"""
    res = ClinicalService.interpret_lab_value("troponin_i", 0.04)
    assert res["status"] == "Unknown"
    assert res["severity"] == "Normal"
