"""
Unit Tests for Pydantic Input Validation Schemas
"""

import pytest
from pydantic import ValidationError

from schemas import (
    ChatRequestSchema,
    DrugInteractionRequestSchema,
    LabInterpretationRequestSchema,
    PatientDataSchema,
    ReportRequestSchema,
)


def test_patient_data_schema_valid() -> None:
    """Test standard valid patient demographic and clinical payload"""
    data = {
        "name": "Jane Doe",
        "age": 55,
        "sex": "F",
        "creatinine": 1.1,
        "egfr": 75.0,
        "ast_alt": 32.0,
        "bilirubin": 0.9,
        "albumin": 4.0,
        "cyp2c9": "Intermediate",
        "cyp2d6": "IM",
        "medication_name": "Warfarin",
        "index_drug_dose": 4.0,
    }
    schema = PatientDataSchema(**data)
    assert schema.age == 55
    assert schema.sex == "F"
    assert schema.creatinine == 1.1


def test_patient_data_schema_boundary_validation() -> None:
    """Test that extreme boundary values trigger ValidationError"""
    with pytest.raises(ValidationError):
        PatientDataSchema(age=-5)

    with pytest.raises(ValidationError):
        PatientDataSchema(age=200)

    with pytest.raises(ValidationError):
        PatientDataSchema(age=50, creatinine=35.0)


def test_drug_interaction_schema() -> None:
    """Test drug interaction request payload validation"""
    valid_payload = {"drugs": ["Warfarin", "Amiodarone"]}
    schema = DrugInteractionRequestSchema(**valid_payload)
    assert len(schema.drugs) == 2

    # Must have at least 1 drug
    with pytest.raises(ValidationError):
        DrugInteractionRequestSchema(drugs=[])


def test_chat_request_schema() -> None:
    """Test chatbot message payload validation"""
    schema = ChatRequestSchema(message="How does CYP2D6 affect codeine metabolism?")
    assert len(schema.message) > 0

    with pytest.raises(ValidationError):
        ChatRequestSchema(message="")


def test_lab_interpretation_schema() -> None:
    """Test lab interpretation schema validation"""
    schema = LabInterpretationRequestSchema(test_name="creatinine", value=2.2, sex="M")
    assert schema.test_name == "creatinine"
    assert schema.value == 2.2


def test_report_request_schema() -> None:
    """Test report generation request schema validation"""
    schema = ReportRequestSchema(patient_data={"age": 60}, prediction_result={"risk_level": "High"})
    assert schema.patient_data["age"] == 60
