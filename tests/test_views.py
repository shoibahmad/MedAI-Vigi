"""
Unit and Integration Tests for Template UI View Routes
"""

import pytest
from flask.testing import FlaskClient

VIEW_ROUTES = [
    "/",
    "/about",
    "/patient_details_form",
    "/clinical_decision_support",
    "/drug_interactions",
    "/chatbot",
    "/medical_report",
    "/patient_counselling",
    "/api_reference",
    "/documentation",
    "/research_papers",
    "/faqs",
    "/privacy_policy",
    "/terms_of_service",
    "/cookie_policy",
]


@pytest.mark.parametrize("route", VIEW_ROUTES)
def test_ui_view_routes_status_200(client: FlaskClient, route: str) -> None:
    """Test that all frontend Jinja2 HTML routes render with status 200"""
    response = client.get(route)
    assert response.status_code == 200, f"Expected 200 for {route}, got {response.status_code}"
    assert b"<!DOCTYPE html>" in response.data or b"<html" in response.data.lower()
