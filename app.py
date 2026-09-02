"""
PhenoRx: Adverse Drug Reaction (ADR) Risk Predictor Application Entrypoint
Structured Flask Application Factory with Modular Blueprints and Defensive Security Headers.
"""

import logging
import os
from typing import Any, Tuple

from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

from config import get_config
from routes.clinical import clinical_bp
from routes.health import health_bp
from routes.predict import predict_bp
from routes.report import report_bp
from routes.views import views_bp
from utils.logging_config import setup_structured_logging

logger = logging.getLogger(__name__)


def create_app(config_class: Any = None) -> Flask:
    """
    Application Factory for PhenoRx Flask Service.
    Configures logging, security middleware, blueprints, and exception handlers.
    """
    app = Flask(__name__)

    # Load configuration
    if config_class is None:
        config_instance = get_config()
        app.config.from_object(config_instance)
    else:
        app.config.from_object(config_class)

    # Enable Cross-Origin Resource Sharing
    CORS(app)

    # Initialize structured JSON logging & error tracking
    setup_structured_logging(app, log_level=app.config.get("LOG_LEVEL", logging.INFO))

    # Register modular route blueprints
    app.register_blueprint(views_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(clinical_bp)

    # Security Headers Middleware
    @app.after_request
    def set_security_headers(response: Response) -> Response:
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # The SPA bundles its own JS/CSS/fonts, so no external script origins are
        # needed. 'unsafe-inline' remains only for the un-migrated Jinja pages,
        # which still carry inline <style> blocks; drop it once those are gone.
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; "
            "img-src 'self' data: blob:; "
            "font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        return response

    # Global Error Handlers
    @app.errorhandler(404)
    def not_found_handler(error: Any) -> Any:
        # Browser navigations should land on the SPA, which renders its own
        # not-found route. Only API clients get the JSON envelope.
        from routes.views import spa_is_built, SPA_DIST

        wants_html = "text/html" in (request.accept_mimetypes or "")
        if wants_html and spa_is_built():
            return send_from_directory(SPA_DIST, "index.html"), 404

        return jsonify(
            {"status": "error", "message": "The requested endpoint was not found.", "code": 404}
        ), 404

    @app.errorhandler(405)
    def method_not_allowed_handler(error: Any) -> Tuple[Response, int]:
        return jsonify(
            {
                "status": "error",
                "message": "HTTP Method Not Allowed for this endpoint.",
                "code": 405,
            }
        ), 405

    @app.errorhandler(500)
    def internal_server_error_handler(error: Any) -> Tuple[Response, int]:
        logger.error(f"Unhandled 500 Internal Server Error: {error}", exc_info=True)
        return jsonify(
            {"status": "error", "message": "An internal server error occurred.", "code": 500}
        ), 500

    logger.info("PhenoRx application initialized successfully.")
    return app


# Root application instance for WSGI servers (Gunicorn)
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    app.run(host=host, port=port, debug=debug_mode)
