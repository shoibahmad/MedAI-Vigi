"""
Health, Diagnostic, Metrics, and Readiness Probes for PhenoRx Service
Provides Kubernetes-compliant /health, /ready, /live, and Prometheus-formatted /metrics endpoints.
"""

import logging
import platform
import sys
import time
from datetime import datetime
from typing import Any, Dict, Tuple

from flask import Blueprint, Response, current_app, jsonify, request

from services.gemini_service import GeminiService
from services.ml_service import MLService

logger = logging.getLogger(__name__)

health_bp = Blueprint("health", __name__)
START_TIME = time.time()


@health_bp.route("/health", methods=["GET"])
@health_bp.route("/api/v1/health", methods=["GET"])
def health_check() -> Tuple[Response, int]:
    """Comprehensive health check probe for load balancers and orchestrators"""
    ml_service = MLService.get_instance()
    gemini_service = GeminiService.get_instance()

    ml_ready = ml_service.is_ready()
    gemini_available = gemini_service.is_available()

    health_status: Dict[str, Any] = {
        "status": "ok" if ml_ready else "degraded",
        "version": current_app.config.get("APP_VERSION", "2.2.0"),
        "environment": current_app.config.get("ENV_NAME", "production"),
        "timestamp": datetime.now().isoformat(),
        "components": {
            "ml_model": {
                "loaded": ml_ready,
                "status": "operational" if ml_ready else "unavailable",
            },
            "gemini_ai": {
                "available": gemini_available,
                "status": "connected" if gemini_available else "offline_fallback_active",
            },
            "structured_logging": {"active": True, "framework": "pythonjsonlogger"},
        },
    }

    http_code = 200 if ml_ready else 503
    return jsonify(health_status), http_code


@health_bp.route("/ready", methods=["GET"])
def readiness_check() -> Tuple[Response, int]:
    """Kubernetes readiness probe"""
    ml_ready = MLService.get_instance().is_ready()
    if ml_ready:
        return jsonify(
            {"ready": True, "message": "Service ready to receive inference traffic"}
        ), 200
    return jsonify({"ready": False, "message": "ML model artifacts not loaded"}), 503


@health_bp.route("/live", methods=["GET"])
def liveness_check() -> Tuple[Response, int]:
    """Kubernetes liveness probe"""
    return jsonify({"alive": True, "status": "running"}), 200


@health_bp.route("/metrics", methods=["GET"])
def metrics() -> Response:
    """Prometheus-formatted or JSON metrics summary"""
    ml_service = MLService.get_instance()
    uptime = round(time.time() - START_TIME, 2)
    model_loaded = 1 if ml_service.is_ready() else 0
    gemini_active = 1 if GeminiService.get_instance().is_available() else 0

    accept_header = request.headers.get("Accept", "")

    # Return Prometheus plain text format if requested
    if "text/plain" in accept_header:
        prometheus_text = (
            "# HELP adr_app_uptime_seconds Application uptime in seconds\n"
            "# TYPE adr_app_uptime_seconds gauge\n"
            f"adr_app_uptime_seconds {uptime}\n"
            "# HELP adr_ml_model_loaded Flag indicating if ML model pipeline is active\n"
            "# TYPE adr_ml_model_loaded gauge\n"
            f"adr_ml_model_loaded {model_loaded}\n"
            "# HELP adr_gemini_service_active Flag indicating if GenAI service is available\n"
            "# TYPE adr_gemini_service_active gauge\n"
            f"adr_gemini_service_active {gemini_active}\n"
            "# HELP adr_predictions_total Total adverse drug reaction inference requests\n"
            "# TYPE adr_predictions_total counter\n"
            "adr_predictions_total 0\n"
        )
        return Response(
            prometheus_text, mimetype="text/plain; version=0.0.4; charset=utf-8", status=200
        )

    metrics_data = {
        "app_uptime_seconds": uptime,
        "ml_model_loaded": model_loaded,
        "gemini_service_active": gemini_active,
        "predictions_total": 0,
        "timestamp": datetime.now().isoformat(),
    }
    return jsonify(metrics_data)


@health_bp.route("/status", methods=["GET"])
def system_status() -> Tuple[Response, int]:
    """Detailed runtime and environment diagnostics"""
    ml_service = MLService.get_instance()
    gemini_service = GeminiService.get_instance()

    status_data: Dict[str, Any] = {
        "application": {
            "name": "PhenoRx Adverse Drug Reaction Engine",
            "version": current_app.config.get("APP_VERSION", "2.2.0"),
            "python_version": sys.version,
            "platform": platform.platform(),
        },
        "ml_pipeline": {
            "model_loaded": ml_service.is_ready(),
            "target_classes_count": (
                len(ml_service.model.classes_)
                if (
                    ml_service.is_ready()
                    and ml_service.model is not None
                    and hasattr(ml_service.model, "classes_")
                )
                else 0
            ),
        },
        "genai_service": {
            "active": gemini_service.is_available(),
            "model": gemini_service.model_name
            if gemini_service.is_available()
            else "rule-based-fallback",
        },
    }
    return jsonify(status_data), 200
