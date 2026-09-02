"""
Security and Defensive Middleware Integration Tests
"""

from flask.testing import FlaskClient


def test_security_headers_present(client: FlaskClient) -> None:
    """Test that all responses contain defensive HTTP security headers"""
    response = client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "strict-origin-when-cross-origin" in response.headers.get("Referrer-Policy", "")


def test_404_error_handler_api(client: FlaskClient) -> None:
    """Test standard JSON 404 response on unknown endpoints"""
    response = client.get("/api/unknown_route_xyz")
    assert response.status_code == 404
    data = response.get_json()
    assert data["status"] == "error"
    assert data["code"] == 404


def test_security_no_credentials_in_health(client: FlaskClient) -> None:
    """Test that health and diagnostic endpoints never expose API keys or credentials"""
    response = client.get("/health")
    data = response.get_json()
    json_str = str(data)

    assert "AIza" not in json_str
    assert "GEMINI_API_KEY" not in json_str


def test_invalid_method_handling(client: FlaskClient) -> None:
    """Test 405 Method Not Allowed error handler"""
    response = client.post("/health")
    assert response.status_code == 405
    data = response.get_json()
    assert data["status"] == "error"
    assert data["code"] == 405
