"""
Typed Exception Hierarchy for PhenoRx
Provides structured, typed error handling across ML, Clinical, PGx, and AI domains.
"""

from typing import Any, Dict, Optional


class ADRException(Exception):
    """Base exception for all domain errors in PhenoRx"""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        """Serialize exception to structured API dictionary"""
        return {
            "error": self.error_code,
            "message": self.message,
            "details": self.details,
        }


class ModelLoadError(ADRException):
    """Raised when machine learning weights or preprocessor artifacts cannot be loaded"""

    def __init__(self, message: str, path: Optional[str] = None) -> None:
        super().__init__(
            message, error_code="MODEL_LOAD_FAILED", details={"path": path} if path else {}
        )


class ModelNotReadyError(ADRException):
    """Raised when inference is attempted on an uninitialized model pipeline"""

    def __init__(
        self, message: str = "Machine learning model pipeline is not ready for inference"
    ) -> None:
        super().__init__(message, error_code="MODEL_NOT_READY")


class ModelInferenceError(ADRException):
    """Raised when feature transformation or class probability estimation fails"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message, error_code="MODEL_INFERENCE_FAILED", details=details)


class ClinicalValidationError(ADRException):
    """Raised when clinical physiological ranges or drug dosages violate safety constraints"""

    def __init__(
        self, message: str, field: Optional[str] = None, value: Optional[Any] = None
    ) -> None:
        super().__init__(
            message,
            error_code="CLINICAL_VALIDATION_ERROR",
            details={"field": field, "value": value} if field else {},
        )


class GenAIServiceError(ADRException):
    """Raised when Google GenAI API communication fails or quota is exhausted"""

    def __init__(self, message: str, model_name: Optional[str] = None) -> None:
        super().__init__(
            message,
            error_code="GENAI_SERVICE_UNAVAILABLE",
            details={"model": model_name} if model_name else {},
        )


class DrugInteractionError(ADRException):
    """Raised when drug-drug interaction matrix evaluation fails"""

    def __init__(self, message: str) -> None:
        super().__init__(message, error_code="DRUG_INTERACTION_ERROR")


class PharmacogenomicsError(ADRException):
    """Raised when CYP metabolic phenotype resolution fails"""

    def __init__(self, message: str) -> None:
        super().__init__(message, error_code="PGX_ANALYSIS_ERROR")
