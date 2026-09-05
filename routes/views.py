"""
Static serving for the React SPA.

The entire user interface now lives in client/. This blueprint serves the built
bundle and its assets, and routes every non-API path to the SPA shell so
client-side routing handles deep links.
"""

import os
from typing import Any, Tuple, Union

from flask import Blueprint, Response, current_app, jsonify, send_from_directory

views_bp = Blueprint("views", __name__)

# client/dist, resolved relative to this file so it works regardless of cwd.
SPA_DIST = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client", "dist"
)

# Prefixes owned by the JSON API. A miss under these must stay a JSON 404 rather
# than being swallowed by the SPA catch-all.
API_PREFIXES = (
    "api/",
    "predict",
    "mitigation_strategies",
    "sample_data",
    "get_drug_adrs",
    "generate_report",
    "generate_detailed_analysis",
    "generate_medication_analysis",
    "analyze_drug_interactions_ai",
    "get_ai_drug_insights",
    "get_lab_reference",
    "get_medication_suggestions",
    "interpret_lab_value",
    "enhanced_lab_analysis",
    "upload_liver_function",
    "save_assessment",
    "health",
    "ready",
    "live",
    "metrics",
    "status",
)


def spa_is_built() -> bool:
    """True when client/dist/index.html exists."""
    return os.path.isfile(os.path.join(SPA_DIST, "index.html"))


def _serve_spa() -> Union[Response, Tuple[Response, int]]:
    """Return the SPA shell, or a clear instruction if it has not been built."""
    if spa_is_built():
        return send_from_directory(SPA_DIST, "index.html")

    current_app.logger.error("SPA build missing at %s", SPA_DIST)
    return jsonify(
        {
            "status": "error",
            "message": (
                "The frontend has not been built. Run 'npm install && npm run build' "
                "in the client/ directory."
            ),
            "code": 503,
        }
    ), 503


@views_bp.route("/", methods=["GET"])
def index() -> Any:
    """SPA entry point."""
    return _serve_spa()


@views_bp.route("/assets/<path:filename>", methods=["GET"])
def spa_assets(filename: str) -> Any:
    """Hashed JS/CSS/font bundles emitted by Vite."""
    return send_from_directory(os.path.join(SPA_DIST, "assets"), filename)


@views_bp.route("/<path:path>", methods=["GET"])
def spa_catch_all(path: str) -> Any:
    """
    Deep-link support for client-side routes.

    Without this, loading /assessment directly would fall through to the app-wide
    404 handler, which returns JSON -- the user would get an error payload instead
    of the application. API paths are excluded so genuine bad endpoints still
    return the JSON envelope.
    """
    if path.startswith(API_PREFIXES):
        return jsonify(
            {"status": "error", "message": "The requested endpoint was not found.", "code": 404}
        ), 404

    # Serve real files out of the build (favicon, manifest, images) before falling
    # back to the SPA shell.
    candidate = os.path.join(SPA_DIST, path)
    if os.path.isfile(candidate):
        return send_from_directory(SPA_DIST, path)

    return _serve_spa()
