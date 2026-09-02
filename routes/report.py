"""
Report Generation and AI Communication Routes
"""

from typing import Tuple

from flask import Blueprint, Response, jsonify, request
from pydantic import ValidationError

from schemas import (
    ChatRequestSchema,
    DrugInsightsRequestSchema,
    DrugInteractionRequestSchema,
    MedicationAnalysisRequestSchema,
    ReportRequestSchema,
)
from services.gemini_service import GeminiService

report_bp = Blueprint("report", __name__)


@report_bp.route("/generate_report", methods=["POST"])
def generate_report() -> Tuple[Response, int]:
    """Generate narrative clinical report using Google GenAI or offline fallback"""
    raw_data = request.get_json() or {}
    try:
        schema = ReportRequestSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 422
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

    gemini_service = GeminiService.get_instance()
    report_dict = gemini_service.generate_clinical_report(
        patient_data=schema.patient_data,
        prediction_result=schema.prediction_result,
        patient_name=schema.patient_name,
        clinician_name=schema.clinician_name,
    )

    return jsonify({"status": "success", **report_dict}), 200


@report_bp.route("/generate_detailed_analysis", methods=["POST"])
def generate_detailed_analysis() -> Tuple[Response, int]:
    """
    Organ-system risk breakdown.

    Previously a hardcoded lookup (hematologic risk was always 30). Now generated
    by Gemini from the actual patient values, with the original rule-based
    scoring retained as the offline fallback.
    """
    raw_data = request.get_json() or {}
    patient_data = raw_data.get("patient_data", {})
    prediction_result = raw_data.get("prediction_result", {})

    gemini_service = GeminiService.get_instance()
    result = gemini_service.generate_detailed_analysis(
        patient_data=patient_data, prediction_result=prediction_result
    )

    return jsonify({"status": "success", **result}), 200


@report_bp.route("/analyze_drug_interactions_ai", methods=["POST"])
def analyze_drug_interactions_ai() -> Tuple[Response, int]:
    """Analyze multi-drug interaction profile"""
    raw_data = request.get_json() or {}
    try:
        schema = DrugInteractionRequestSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 422

    gemini_service = GeminiService.get_instance()
    result = gemini_service.analyze_drug_interactions(
        drugs=schema.drugs, patient_data=schema.patient_data
    )
    return jsonify(result), 200


@report_bp.route("/api/chat", methods=["POST"])
def api_chat() -> Tuple[Response, int]:
    """Conversational clinical pharmacovigilance assistant endpoint"""
    raw_data = request.get_json() or {}
    try:
        schema = ChatRequestSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 422

    gemini_service = GeminiService.get_instance()
    reply = gemini_service.chat_response(message=schema.message, context=schema.context)
    return jsonify({"status": "success", "response": reply}), 200


@report_bp.route("/get_ai_drug_insights", methods=["POST"])
def get_ai_drug_insights() -> Tuple[Response, int]:
    """
    Deep AI drug interaction insights for a full regimen.
    Ported from debug_server.py:1718 so this endpoint exists on the modular backend
    -- the drug interactions page called it and got a 404 under app.py.
    """
    raw_data = request.get_json() or {}
    try:
        schema = DrugInsightsRequestSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 422

    gemini_service = GeminiService.get_instance()
    result = gemini_service.generate_drug_insights(
        medications=schema.medications,
        patient_age=schema.patient_age,
        comorbidities=schema.comorbidities,
    )
    return jsonify(result), 200


@report_bp.route("/generate_medication_analysis", methods=["POST"])
def generate_medication_analysis() -> Tuple[Response, int]:
    """
    Medication therapy management narrative.
    Ported from debug_server.py:1438.
    """
    raw_data = request.get_json() or {}
    try:
        schema = MedicationAnalysisRequestSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 422

    gemini_service = GeminiService.get_instance()
    result = gemini_service.generate_medication_analysis(
        patient_data=schema.patient_data,
        prediction_result=schema.prediction_result,
        patient_name=schema.patient_name,
    )
    return jsonify(result), 200
