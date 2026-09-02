"""
Static serving for the React SPA, plus the Jinja pages not yet migrated.

The clinical workflow (landing, patient details, assessment, report, drug
interactions, decision support, counselling, chatbot) is owned by the React client
in client/. This blueprint serves that build and its assets, and keeps the
remaining content and legal pages rendering from templates/ at their existing URLs.
"""

import os
from typing import Any, Tuple, Union

from flask import Blueprint, Response, current_app, jsonify, render_template, send_from_directory

views_bp = Blueprint("views", __name__)

# client/dist, resolved relative to this file so it works regardless of cwd.
SPA_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "client", "dist")

# Pages still rendered by Jinja. Each maps a URL path to its template.
LEGACY_PAGES = {
    "about": "about.html",
    "documentation": "documentation.html",
    "api_reference": "api_reference.html",
    "research_papers": "research_papers.html",
    "faqs": "faqs.html",
    "privacy_policy": "privacy_policy.html",
    "terms_of_service": "terms_of_service.html",
    "cookie_policy": "cookie_policy.html",
}

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


def _legacy_page(template: str) -> Any:
    return render_template(template)


# Register the un-migrated Jinja pages at the URLs the existing links already use.
for _path, _template in LEGACY_PAGES.items():
    views_bp.add_url_rule(
        f"/{_path}",
        endpoint=_path,
        view_func=(lambda template=_template: _legacy_page(template)),
        methods=["GET"],
    )


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
