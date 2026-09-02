"""
ADR Predictor Service Module
Dedicated domain inference engine for Adverse Drug Reaction predictive modeling.
"""

from services.ml_service import MLService, ModelNotReadyError

__all__ = ["ADRPredictor", "MLService", "ModelNotReadyError"]


class ADRPredictor(MLService):
    """ADR Prediction Service providing typed inference signatures"""

    pass
