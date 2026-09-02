"""
Pytest Fixtures and Configuration for PhenoRx Test Suite
"""

from collections.abc import Generator
from typing import Any, Dict

import pytest
from flask import Flask
from flask.testing import FlaskClient

from app import create_app
from config import TestingConfig


@pytest.fixture(scope="session")
def app() -> Flask:
    """Create Flask application fixture for testing environment"""
    test_app = create_app(TestingConfig)
    return test_app


@pytest.fixture
def client(app: Flask) -> Generator[FlaskClient, None, None]:
    """Test client fixture with clean context"""
    with app.test_client() as test_client:
        with app.app_context():
            yield test_client


@pytest.fixture(autouse=True)
def mock_offline_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Auto-use fixture ensuring all tests run completely offline in hermetic isolation without live keys or external calls"""
    monkeypatch.setenv("GEMINI_API_KEY", "")
    monkeypatch.setenv("GEMINI_API_KEY_DRUG_INTERACTIONS", "")
    monkeypatch.setenv("SENTRY_DSN", "")
    try:
        import sentry_sdk

        monkeypatch.setattr(sentry_sdk, "init", lambda *args, **kwargs: None)
    except ImportError:
        pass


@pytest.fixture
def sample_patient() -> Dict[str, Any]:
    """Standard adult patient sample for testing"""
    return {
        "name": "Alex Johnson",
        "age": 45,
        "sex": "M",
        "ethnicity": "Asian",
        "height": 175.0,
        "weight": 75.0,
        "bmi": 24.5,
        "creatinine": 1.0,
        "egfr": 95.0,
        "ast_alt": 28.0,
        "bilirubin": 0.8,
        "albumin": 4.2,
        "cyp2c9": "Wild",
        "cyp2d6": "EM",
        "cyp3a4": "Normal",
        "medication_name": "Warfarin",
        "index_drug_dose": 5.0,
        "concomitant_drugs_count": 2,
        "prior_adr_history": 0,
        "diabetes": 0,
        "ckd": 0,
        "cardiac_disease": 0,
        "liver_disease": 0,
    }


@pytest.fixture
def sample_high_risk_patient() -> Dict[str, Any]:
    """High-risk geriatric patient with comorbidities and impaired organ function"""
    return {
        "name": "Eleanor Vance",
        "age": 78,
        "sex": "F",
        "ethnicity": "White",
        "height": 160.0,
        "weight": 52.0,
        "bmi": 20.3,
        "creatinine": 2.6,
        "egfr": 22.0,
        "ast_alt": 140.0,
        "bilirubin": 2.4,
        "albumin": 2.7,
        "cyp2c9": "Poor",
        "cyp2d6": "PM",
        "cyp3a4": "Poor",
        "medication_name": "Warfarin",
        "index_drug_dose": 10.0,
        "concomitant_drugs_count": 8,
        "prior_adr_history": 1,
        "diabetes": 1,
        "ckd": 1,
        "cardiac_disease": 1,
        "liver_disease": 1,
    }


@pytest.fixture
def sample_prediction_result() -> Dict[str, Any]:
    """Sample output from MLService prediction pipeline"""
    return {
        "risk_level": "High",
        "predicted_adr_type": "Hepatotoxicity",
        "overall_adr_risk": 78.5,
        "no_adr_probability": 21.5,
        "top_specific_adr_risks": {
            "Hepatotoxicity": 48.2,
            "Nephrotoxicity": 22.1,
            "Cardiovascular Event (Arrhythmia)": 8.2,
        },
        "major_contributing_factors": [
            {
                "factor": "Advanced Age",
                "value": "78 years",
                "risk_contribution": "High",
            },
            {
                "factor": "Renal Impairment",
                "value": "eGFR: 22.0 mL/min, Creatinine: 2.6 mg/dL",
                "risk_contribution": "Critical",
            },
        ],
        "pharmacogenomics": {
            "cyp_metabolism": {
                "composite_metabolism_score": 0.15,
                "overall_risk_assessment": "Critical - Severe metabolic impairment",
            }
        },
    }
