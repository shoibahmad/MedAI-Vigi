"""
Integration Tests for Health, Status, Readiness, Liveness, and Metrics Probes
"""

from unittest.mock import patch

from flask.testing import FlaskClient

from services.ml_service import MLService


def test_health_check_endpoint(client: FlaskClient) -> None:
    """Test GET /health returns 200 and structured status dictionary"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
    assert "components" in data
    assert data["components"]["ml_model"]["loaded"] is True
    assert "timestamp" in data


def test_api_v1_health_alias(client: FlaskClient) -> None:
    """Test GET /api/v1/health alias endpoint"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"


def test_readiness_and_liveness_probes(client: FlaskClient) -> None:
    """Test /ready and /live Kubernetes endpoints"""
    ready_res = client.get("/ready")
    assert ready_res.status_code == 200
    assert ready_res.get_json()["ready"] is True

    live_res = client.get("/live")
    assert live_res.status_code == 200
    assert live_res.get_json()["alive"] is True


def test_metrics_and_status_endpoints(client: FlaskClient) -> None:
    """Test /metrics and /status endpoints"""
    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    assert "ml_model_loaded" in metrics_res.get_json()

    status_res = client.get("/status")
    assert status_res.status_code == 200
    assert "application" in status_res.get_json()


def test_health_degraded_when_model_not_ready(client: FlaskClient) -> None:
    """Test /health and /ready return 503 degraded when ML model is unavailable"""
    ml_service = MLService.get_instance()
    with patch.object(ml_service, "is_ready", return_value=False):
        response = client.get("/health")
        assert response.status_code == 503
        data = response.get_json()
        assert data["status"] == "degraded"

        ready_res = client.get("/ready")
        assert ready_res.status_code == 503
        assert ready_res.get_json()["ready"] is False


def test_sentry_sdk_initialization_when_dsn_configured() -> None:
    """Test that Sentry SDK init is invoked when SENTRY_DSN environment variable is present"""
    import sys
    from unittest.mock import MagicMock

    from utils.logging_config import setup_structured_logging

    mock_sentry = MagicMock()
    with patch.dict("os.environ", {"SENTRY_DSN": "https://examplePublicKey@o0.ingest.sentry.io/0"}):
        with patch.dict(
            sys.modules, {"sentry_sdk": mock_sentry, "sentry_sdk.integrations.flask": MagicMock()}
        ):
            setup_structured_logging()
            assert mock_sentry.init.called is True
