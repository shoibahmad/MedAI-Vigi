"""
Comprehensive Boundary and Malformed Payload Validation Tests for Schemas
Tests field-level constraints, type coercion, and edge cases.
"""

import pytest
from pydantic import ValidationError

from schemas import (
    AssessmentSaveSchema,
    CounsellingSubmitSchema,
    PatientDataSchema,
)


def test_patient_data_schema_missing_required_fields() -> None:
    """Test validation fails when required age field is omitted"""
    with pytest.raises(ValidationError) as exc_info:
        PatientDataSchema(name="John")  # type: ignore[call-arg]
    errors = exc_info.value.errors()
    assert any(err["loc"] == ("age",) for err in errors)


def test_patient_data_schema_out_of_range_values() -> None:
    """Test boundary rejection for physiological extremes"""
    # Negative eGFR
    with pytest.raises(ValidationError):
        PatientDataSchema(age=40, egfr=-1.0)

    # Systolic BP > 260 mmHg
    with pytest.raises(ValidationError):
        PatientDataSchema(age=40, bp_systolic=300)

    # Diastolic BP < 30 mmHg
    with pytest.raises(ValidationError):
        PatientDataSchema(age=40, bp_diastolic=20)

    # Invalid comorbidity indicator (>1)
    with pytest.raises(ValidationError):
        PatientDataSchema(age=40, diabetes=5)


def test_patient_data_schema_type_coercion() -> None:
    """Test type coercion of string inputs for numeric fields"""
    patient = PatientDataSchema(
        age="52",  # type: ignore[arg-type]
        bmi="27.4",  # type: ignore[arg-type]
        creatinine="1.3",  # type: ignore[arg-type]
        egfr="65.0",  # type: ignore[arg-type]
        ast_alt="45",  # type: ignore[arg-type]
        bilirubin="0.9",  # type: ignore[arg-type]
        albumin="4.1",  # type: ignore[arg-type]
    )
    assert patient.age == 52
    assert patient.bmi == 27.4
    assert patient.creatinine == 1.3


def test_patient_data_schema_bmi_calculation_fallback() -> None:
    """Test automatic BMI calculation when BMI is zero or omitted"""
    patient = PatientDataSchema(
        age=30,
        height=180.0,  # 1.8m
        weight=81.0,  # 81 kg -> BMI = 81 / (1.8 * 1.8) = 25.0
        bmi=0.0,
    )
    assert patient.bmi == 25.0


def test_assessment_save_schema() -> None:
    """Test AssessmentSaveSchema validation"""
    assessment = AssessmentSaveSchema(
        patient_id="PT-999",
        patient_data={"age": 55, "sex": "M"},
        prediction={"risk_level": "High", "predicted_adr": "Hepatotoxicity"},
    )
    assert assessment.patient_id == "PT-999"
    assert assessment.prediction["risk_level"] == "High"


def test_counselling_submit_schema() -> None:
    """Test CounsellingSubmitSchema validation"""
    counselling = CounsellingSubmitSchema(
        session_type="Follow-up",
        counsellor_name="PharmD Sarah",
        comprehension_notes="Patient understood warfarin dosing and INR monitoring plan.",
    )
    assert counselling.session_type == "Follow-up"
    assert "warfarin" in counselling.comprehension_notes.lower()
