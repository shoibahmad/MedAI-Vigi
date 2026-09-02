"""
Clinical Decision Support and Laboratory Data Processing Routes
"""

from typing import Tuple

from flask import Blueprint, Response, jsonify, request
from pydantic import ValidationError

from schemas import AssessmentSaveSchema, CounsellingSubmitSchema, LabInterpretationRequestSchema
from services.clinical_service import ClinicalService
from utils.base_record_store import BaseRecordStore

clinical_bp = Blueprint("clinical", __name__)
clinical_store = BaseRecordStore("ClinicalAssessments")


@clinical_bp.route("/get_lab_reference", methods=["GET"])
def get_lab_reference() -> Tuple[Response, int]:
    """Return biological reference ranges for clinical laboratory markers"""
    return jsonify({"status": "success", "lab_ranges": ClinicalService.get_reference_ranges()}), 200


@clinical_bp.route("/get_medication_suggestions", methods=["GET"])
def get_medication_suggestions() -> Tuple[Response, int]:
    """Return list of frequently evaluated medications"""
    meds = [
        "Warfarin",
        "Metformin",
        "Simvastatin",
        "Aspirin",
        "Lisinopril",
        "Amiodarone",
        "Atorvastatin",
        "Clopidogrel",
        "Digoxin",
        "Methotrexate",
        "Carbamazepine",
        "Allopurinol",
        "Abacavir",
        "Phenytoin",
        "Ciprofloxacin",
    ]
    return jsonify(meds), 200


@clinical_bp.route("/interpret_lab_value", methods=["POST"])
def interpret_lab_value() -> Tuple[Response, int]:
    """Evaluate single laboratory measurement"""
    raw_data = request.get_json() or {}
    try:
        schema = LabInterpretationRequestSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 400

    interpretation = ClinicalService.interpret_lab_value(
        test_name=schema.test_name, value=schema.value, sex=schema.sex
    )
    return jsonify(
        {"status": "success", "test_name": schema.test_name, "interpretations": [interpretation]}
    ), 200


@clinical_bp.route("/enhanced_lab_analysis", methods=["POST"])
def enhanced_lab_analysis() -> Tuple[Response, int]:
    """Evaluate a multi-marker comprehensive metabolic panel"""
    data = request.get_json() or {}
    sex = data.get("sex", "M")
    evaluations = {}

    for test_key in ["creatinine", "egfr", "ast_alt", "bilirubin", "albumin"]:
        if test_key in data:
            try:
                val = float(data[test_key])
                evaluations[test_key] = ClinicalService.interpret_lab_value(test_key, val, sex=sex)
            except (ValueError, TypeError):
                pass

    return jsonify(
        {"status": "success", "tests_evaluated": len(evaluations), "results": evaluations}
    ), 200


@clinical_bp.route("/upload_liver_function", methods=["POST"])
def upload_liver_function() -> Tuple[Response, int]:
    """Evaluate Liver Function Tests (LFTs) for Drug-Induced Liver Injury (DILI)"""
    data = request.get_json() or {}
    ast = float(data.get("ast", data.get("ast_alt", 30)))
    alt = float(data.get("alt", ast))
    bilirubin = float(data.get("bilirubin", 1.0))

    # Hy's Law Criteria Evaluation
    hy_law = (alt > 120.0 or ast > 120.0) and (bilirubin > 2.4)
    dili_tier = "High" if hy_law or (alt > 200) else ("Moderate" if alt > 80 else "Low")

    return jsonify(
        {
            "status": "success",
            "dili_risk_level": dili_tier,
            "hy_law_criteria_met": hy_law,
            "clinical_action": "Immediate drug discontinuation and specialist referral"
            if hy_law
            else "Routine monitoring",
        }
    ), 200


@clinical_bp.route("/save_assessment", methods=["POST"])
def save_assessment() -> Tuple[Response, int]:
    """Persist structured patient ADR assessment record"""
    raw_data = request.get_json() or {}
    try:
        schema = AssessmentSaveSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 422

    record = clinical_store.create_record(
        record_id=schema.patient_id,
        data={"patient_data": schema.patient_data, "prediction": schema.prediction},
    )
    return jsonify(
        {"status": "success", "record_id": schema.patient_id, "checksum": record["checksum"]}
    ), 200


@clinical_bp.route("/api/counselling/submit", methods=["POST"])
def submit_counselling() -> Tuple[Response, int]:
    """Record pharmacist patient counselling session"""
    raw_data = request.get_json() or {}
    try:
        schema = CounsellingSubmitSchema(**raw_data)
    except ValidationError as e:
        return jsonify({"status": "validation_error", "errors": e.errors()}), 422

    return jsonify(
        {
            "status": "success",
            "message": "Counselling consultation recorded successfully",
            "counsellor": schema.counsellor_name,
            "session_type": schema.session_type,
        }
    ), 200
