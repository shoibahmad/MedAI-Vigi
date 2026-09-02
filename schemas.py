"""
Validation Schemas for PhenoRx Adverse Drug Reaction Engine
Uses Pydantic V2 for strict type checking, boundary enforcement, and sanitized field coercions.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class PatientDataSchema(BaseModel):
    """Demographics, physiological vitals, clinical lab markers, and pharmacogenomic profile"""

    # Demographics
    name: str = Field(default="Patient", max_length=100)
    patient_id: str = Field(default="PT-UNKNOWN", max_length=50)
    age: int = Field(..., ge=0, le=125, description="Patient age in years (0 - 125)")
    sex: str = Field(default="M", description="'M' or 'F'")
    ethnicity: str = Field(default="Asian", max_length=50)

    # Anthropometrics
    height: float = Field(default=170.0, ge=30.0, le=250.0, description="Height in cm")
    weight: float = Field(default=70.0, ge=2.0, le=300.0, description="Weight in kg")
    bmi: float = Field(default=24.2, ge=0.0, le=80.0, description="Body Mass Index (kg/m²)")

    # Renal Panel
    creatinine: float = Field(default=1.0, ge=0.1, le=25.0, description="Serum Creatinine (mg/dL)")
    egfr: float = Field(default=90.0, ge=1.0, le=200.0, description="Estimated GFR (mL/min/1.73m²)")

    # Hepatic Panel
    ast_alt: float = Field(
        default=25.0, ge=1.0, le=5000.0, description="AST/ALT Liver Enzyme Level (U/L)"
    )
    bilirubin: float = Field(default=0.8, ge=0.1, le=50.0, description="Total Bilirubin (mg/dL)")
    albumin: float = Field(default=4.2, ge=0.5, le=7.0, description="Serum Albumin (g/dL)")

    # Complete Blood Count (CBC)
    hemoglobin: float = Field(default=14.0, ge=2.0, le=25.0)
    hematocrit: float = Field(default=42.0, ge=5.0, le=75.0)
    wbc_count: float = Field(default=7000.0, ge=100.0, le=100000.0)
    platelet_count: float = Field(default=250000.0, ge=5000.0, le=2000000.0)
    rbc_count: float = Field(default=4.8, ge=0.5, le=10.0)

    # Differential (%)
    neutrophils: float = Field(default=60.0, ge=0.0, le=100.0)
    lymphocytes: float = Field(default=30.0, ge=0.0, le=100.0)
    monocytes: float = Field(default=7.0, ge=0.0, le=100.0)
    eosinophils: float = Field(default=2.0, ge=0.0, le=100.0)
    basophils: float = Field(default=1.0, ge=0.0, le=100.0)

    # RBC Indices
    mcv: float = Field(default=90.0, ge=40.0, le=150.0)
    mch: float = Field(default=30.0, ge=10.0, le=50.0)
    mchc: float = Field(default=34.0, ge=15.0, le=45.0)
    rdw: float = Field(default=13.0, ge=5.0, le=40.0)

    # Hemodynamics & Vitals
    bp_systolic: float = Field(default=120.0, ge=40.0, le=260.0)
    bp_diastolic: float = Field(default=80.0, ge=30.0, le=180.0)
    heart_rate: float = Field(default=75.0, ge=25.0, le=250.0)
    temperature: float = Field(default=37.0, ge=30.0, le=45.0)

    # Pharmacogenomics - Cytochrome P450 Enzymes
    cyp2c9: str = Field(default="Wild")
    cyp2d6: str = Field(default="EM")
    cyp3a4: str = Field(default="Normal")
    cyp1a2: str = Field(default="Normal")
    cyp2b6: str = Field(default="Normal")
    cyp2c19: str = Field(default="EM")

    # Pharmacogenomics - Transporters
    slco1b1_genotype: str = Field(default="*1/*1")
    abcb1_genotype: str = Field(default="CC")
    abcg2_genotype: str = Field(default="Wild/Wild")

    # Pharmacogenomics - HLA Hypersensitivity Alleles
    hla_a_typing: List[str] = Field(default_factory=list)
    hla_b_typing: List[str] = Field(default_factory=list)
    hla_drb1_typing: List[str] = Field(default_factory=list)

    # Drug Regimen
    medication_name: str = Field(default="Warfarin", max_length=100)
    index_drug_dose: float = Field(default=5.0, ge=0.01, le=10000.0)
    time_since_start_days: int = Field(default=7, ge=0, le=3650)
    concomitant_drugs_count: int = Field(default=0, ge=0, le=50)

    # Clinical Comorbidities (0 or 1)
    diabetes: int = Field(default=0, ge=0, le=1)
    liver_disease: int = Field(default=0, ge=0, le=1)
    ckd: int = Field(default=0, ge=0, le=1)
    cardiac_disease: int = Field(default=0, ge=0, le=1)
    hypertension: int = Field(default=0, ge=0, le=1)
    respiratory_disease: int = Field(default=0, ge=0, le=1)
    neurological_disease: int = Field(default=0, ge=0, le=1)
    autoimmune_disease: int = Field(default=0, ge=0, le=1)

    # Risk Flags (0 or 1)
    cyp_inhibitors_flag: int = Field(default=0, ge=0, le=1)
    qt_prolonging_flag: int = Field(default=0, ge=0, le=1)
    hla_risk_allele_flag: int = Field(default=0, ge=0, le=1)
    inpatient_flag: int = Field(default=0, ge=0, le=1)
    prior_adr_history: int = Field(default=0, ge=0, le=1)
    polypharmacy_flag: int = Field(default=0, ge=0, le=1)
    high_risk_drug_flag: int = Field(default=0, ge=0, le=1)

    # Calculated Dosage Metrics
    cumulative_dose_mg: float = Field(default=0.0, ge=0.0)
    dose_density_mg_day: float = Field(default=0.0, ge=0.0)

    # Extra Medication Context
    external_drugs: List[Dict[str, Any]] = Field(default_factory=list)
    external_drugs_list: List[str] = Field(default_factory=list)
    all_medications: List[str] = Field(default_factory=list)

    @field_validator("sex", mode="before")
    @classmethod
    def sanitize_sex(cls, v: Any) -> str:
        s = str(v).strip().upper()
        if s in ["M", "MALE"]:
            return "M"
        if s in ["F", "FEMALE"]:
            return "F"
        return "M"

    @model_validator(mode="after")
    def compute_derived_metrics(self) -> "PatientDataSchema":
        """Compute automatic BMI if not supplied or zero"""
        if self.bmi <= 5.0 and self.height > 0:
            h_m = self.height / 100.0
            self.bmi = round(self.weight / (h_m * h_m), 1)

        # Polypharmacy flag sync
        if self.concomitant_drugs_count >= 5:
            self.polypharmacy_flag = 1
        return self


def validate_patient_data(
    data: Dict[str, Any],
) -> tuple[bool, Optional[str], Optional[PatientDataSchema]]:
    """Validate raw patient payload dictionary using PatientDataSchema"""
    try:
        schema = PatientDataSchema(**data)
        return True, None, schema
    except Exception as e:
        return False, str(e), None


class ReportGenerationSchema(BaseModel):
    """Schema for report generation request validation"""

    patient_data: Dict[str, Any]
    prediction_result: Dict[str, Any]
    patient_name: str = "Patient"
    patient_id: str = ""
    clinician_name: str = "Clinician"


class DrugInteractionRequestSchema(BaseModel):
    """Schema for drug-drug interaction requests"""

    drugs: List[str] = Field(..., min_length=1, description="List of drug names to check")
    patient_data: Optional[Dict[str, Any]] = Field(default=None)


class ChatRequestSchema(BaseModel):
    """Schema for clinical assistant chat inquiries"""

    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[Dict[str, Any]] = Field(default=None)


class LabInterpretationRequestSchema(BaseModel):
    """Schema for single lab test interpretation requests"""

    test_name: str = Field(..., min_length=1, max_length=50)
    value: float = Field(...)
    sex: str = Field(default="M")


class ReportRequestSchema(BaseModel):
    """Schema for AI narrative report requests"""

    patient_data: Dict[str, Any] = Field(...)
    prediction_result: Dict[str, Any] = Field(...)
    patient_name: str = Field(default="Patient")
    patient_id: str = Field(default="PT-UNKNOWN")
    clinician_name: str = Field(default="Attending Physician")


class DrugInsightsRequestSchema(BaseModel):
    """Schema for deep AI drug interaction insight requests"""

    medications: List[Any] = Field(..., min_length=2, description="At least two medications")
    patient_age: Any = Field(default="Not specified")
    comorbidities: List[str] = Field(default_factory=list)


class MedicationAnalysisRequestSchema(BaseModel):
    """Schema for medication therapy management analysis requests"""

    patient_data: Dict[str, Any] = Field(...)
    prediction_result: Dict[str, Any] = Field(default_factory=dict)
    patient_name: str = Field(default="Patient")


class AssessmentSaveSchema(BaseModel):
    """Schema for saving complete patient risk assessments"""

    patient_id: str = Field(..., min_length=1)
    patient_data: Dict[str, Any] = Field(...)
    prediction: Dict[str, Any] = Field(...)


class CounsellingSubmitSchema(BaseModel):
    """Schema for patient counselling log submissions"""

    session_type: str = Field(default="Discharge Consultation")
    counsellor_name: str = Field(default="Clinical Pharmacist")
    comprehension_notes: str = Field(default="")
    patient_data: Optional[Dict[str, Any]] = Field(default=None)
