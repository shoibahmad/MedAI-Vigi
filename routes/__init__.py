"""
Blueprints package for PhenoRx Service
"""

from routes.clinical import clinical_bp
from routes.health import health_bp
from routes.predict import predict_bp
from routes.report import report_bp
from routes.views import views_bp

__all__ = ["views_bp", "health_bp", "predict_bp", "report_bp", "clinical_bp"]
