import { z } from 'zod'

/**
 * Client-side mirror of PatientDataSchema in schemas.py.
 *
 * Every bound here matches a Pydantic Field(ge=..., le=...) on the server. Keeping
 * them in sync is what turns an opaque 422 into an inline field error. If you change
 * a bound in schemas.py, change it here too.
 *
 * Select option lists mirror the accepted keys in services/pharmacogenomics/* --
 * an unlisted genotype silently scores as "normal activity" on the server, so the
 * UI must not let clinicians invent values.
 */

// Coerces '' -> undefined so an untouched optional number field falls back to its
// default rather than failing as NaN.
const num = (min, max) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: 'Must be a number' }).min(min).max(max),
  )

const int = (min, max) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: 'Must be a number' }).int('Must be a whole number').min(min).max(max),
  )

// Comorbidity / risk flags are 0|1 ints on the server but checkboxes in the UI.
const flag = z.preprocess((v) => (v === true ? 1 : v === false ? 0 : Number(v ?? 0)), z.union([z.literal(0), z.literal(1)]))

export const SEX_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
]

export const ETHNICITY_OPTIONS = ['Asian', 'White', 'Black', 'Hispanic', 'Middle Eastern', 'Other']

export const CYP_OPTIONS = {
  cyp2c9: ['Poor', 'Intermediate', 'Wild', 'Rapid'],
  cyp2d6: ['PM', 'IM', 'EM', 'UM'],
  cyp3a4: ['Poor', 'Intermediate', 'Normal', 'Rapid'],
  cyp1a2: ['Slow', 'Intermediate', 'Normal', 'Rapid'],
  cyp2b6: ['Poor', 'Intermediate', 'Normal', 'Rapid'],
  cyp2c19: ['PM', 'IM', 'EM', 'RM', 'UM'],
}

export const CYP_LABELS = {
  cyp2c9: 'CYP2C9',
  cyp2d6: 'CYP2D6',
  cyp3a4: 'CYP3A4',
  cyp1a2: 'CYP1A2',
  cyp2b6: 'CYP2B6',
  cyp2c19: 'CYP2C19',
}

export const TRANSPORTER_OPTIONS = {
  slco1b1_genotype: ['*1/*1', '*1/*5', '*1/*15', '*5/*5', '*15/*15'],
  abcb1_genotype: ['CC', 'CT', 'TT'],
  abcg2_genotype: ['Wild/Wild', 'Wild/Variant', 'Variant/Variant'],
}

export const TRANSPORTER_LABELS = {
  slco1b1_genotype: 'SLCO1B1',
  abcb1_genotype: 'ABCB1',
  abcg2_genotype: 'ABCG2',
}

// Alleles the HLAEngine actually screens for.
export const HLA_OPTIONS = {
  hla_a_typing: ['HLA-A*3101'],
  hla_b_typing: ['HLA-B*5701', 'HLA-B*5801'],
  hla_drb1_typing: ['HLA-DRB1*0701'],
}

export const COMORBIDITY_FIELDS = [
  { name: 'diabetes', label: 'Diabetes mellitus' },
  { name: 'liver_disease', label: 'Liver disease' },
  { name: 'ckd', label: 'Chronic kidney disease' },
  { name: 'cardiac_disease', label: 'Cardiac disease' },
  { name: 'hypertension', label: 'Hypertension' },
  { name: 'respiratory_disease', label: 'Respiratory disease' },
  { name: 'neurological_disease', label: 'Neurological disease' },
  { name: 'autoimmune_disease', label: 'Autoimmune disease' },
]

export const RISK_FLAG_FIELDS = [
  { name: 'cyp_inhibitors_flag', label: 'On CYP inhibitors', hint: 'Concurrent strong CYP450 inhibitor' },
  { name: 'qt_prolonging_flag', label: 'QT-prolonging agent', hint: 'Concurrent QT-prolonging drug' },
  { name: 'hla_risk_allele_flag', label: 'HLA risk allele present', hint: 'Known SCAR-associated allele' },
  { name: 'inpatient_flag', label: 'Inpatient', hint: 'Currently admitted' },
  { name: 'prior_adr_history', label: 'Prior ADR history', hint: 'Documented previous adverse reaction' },
  { name: 'polypharmacy_flag', label: 'Polypharmacy', hint: 'Auto-set when concomitant drugs >= 5' },
  { name: 'high_risk_drug_flag', label: 'High-risk drug', hint: 'Narrow therapeutic index agent' },
]

export const patientSchema = z.object({
  // Demographics
  name: z.string().max(100).default('Patient'),
  patient_id: z.string().max(50).default('PT-UNKNOWN'),
  age: int(0, 125),
  sex: z.enum(['M', 'F']).default('M'),
  ethnicity: z.string().max(50).default('Asian'),

  // Anthropometrics
  height: num(30, 250).default(170),
  weight: num(2, 300).default(70),
  bmi: num(0, 80).default(24.2),

  // Renal
  creatinine: num(0.1, 25).default(1.0),
  egfr: num(1, 200).default(90),

  // Hepatic
  ast_alt: num(1, 5000).default(25),
  bilirubin: num(0.1, 50).default(0.8),
  albumin: num(0.5, 7).default(4.2),

  // Complete blood count
  hemoglobin: num(2, 25).default(14),
  hematocrit: num(5, 75).default(42),
  wbc_count: num(100, 100000).default(7000),
  platelet_count: num(5000, 2000000).default(250000),
  rbc_count: num(0.5, 10).default(4.8),

  // Differential (%)
  neutrophils: num(0, 100).default(60),
  lymphocytes: num(0, 100).default(30),
  monocytes: num(0, 100).default(7),
  eosinophils: num(0, 100).default(2),
  basophils: num(0, 100).default(1),

  // RBC indices
  mcv: num(40, 150).default(90),
  mch: num(10, 50).default(30),
  mchc: num(15, 45).default(34),
  rdw: num(5, 40).default(13),

  // Vitals
  bp_systolic: num(40, 260).default(120),
  bp_diastolic: num(30, 180).default(80),
  heart_rate: num(25, 250).default(75),
  temperature: num(30, 45).default(37),

  // Pharmacogenomics - CYP
  cyp2c9: z.enum(CYP_OPTIONS.cyp2c9).default('Wild'),
  cyp2d6: z.enum(CYP_OPTIONS.cyp2d6).default('EM'),
  cyp3a4: z.enum(CYP_OPTIONS.cyp3a4).default('Normal'),
  cyp1a2: z.enum(CYP_OPTIONS.cyp1a2).default('Normal'),
  cyp2b6: z.enum(CYP_OPTIONS.cyp2b6).default('Normal'),
  cyp2c19: z.enum(CYP_OPTIONS.cyp2c19).default('EM'),

  // Pharmacogenomics - transporters
  slco1b1_genotype: z.enum(TRANSPORTER_OPTIONS.slco1b1_genotype).default('*1/*1'),
  abcb1_genotype: z.enum(TRANSPORTER_OPTIONS.abcb1_genotype).default('CC'),
  abcg2_genotype: z.enum(TRANSPORTER_OPTIONS.abcg2_genotype).default('Wild/Wild'),

  // Pharmacogenomics - HLA
  hla_a_typing: z.array(z.string()).default([]),
  hla_b_typing: z.array(z.string()).default([]),
  hla_drb1_typing: z.array(z.string()).default([]),

  // Drug regimen
  medication_name: z.string().min(1, 'Select a medication').max(100).default('Warfarin'),
  index_drug_dose: num(0.01, 10000).default(5),
  time_since_start_days: int(0, 3650).default(7),
  concomitant_drugs_count: int(0, 50).default(0),

  // Comorbidities
  diabetes: flag.default(0),
  liver_disease: flag.default(0),
  ckd: flag.default(0),
  cardiac_disease: flag.default(0),
  hypertension: flag.default(0),
  respiratory_disease: flag.default(0),
  neurological_disease: flag.default(0),
  autoimmune_disease: flag.default(0),

  // Risk flags
  cyp_inhibitors_flag: flag.default(0),
  qt_prolonging_flag: flag.default(0),
  hla_risk_allele_flag: flag.default(0),
  inpatient_flag: flag.default(0),
  prior_adr_history: flag.default(0),
  polypharmacy_flag: flag.default(0),
  high_risk_drug_flag: flag.default(0),

  // Calculated dosage metrics
  cumulative_dose_mg: num(0, Number.MAX_SAFE_INTEGER).default(0),
  dose_density_mg_day: num(0, Number.MAX_SAFE_INTEGER).default(0),

  // Extra medication context
  external_drugs: z.array(z.record(z.string(), z.any())).default([]),
  external_drugs_list: z.array(z.string()).default([]),
  all_medications: z.array(z.string()).default([]),
})

/**
 * Mirrors PatientDataSchema.compute_derived_metrics (schemas.py:125).
 * Applied before submit so the payload the server receives is the one the UI showed.
 */
export function applyDerivedMetrics(values) {
  const next = { ...values }

  if (next.bmi <= 5.0 && next.height > 0) {
    const hM = next.height / 100
    next.bmi = Math.round((next.weight / (hM * hM)) * 10) / 10
  }

  if (next.concomitant_drugs_count >= 5) {
    next.polypharmacy_flag = 1
  }

  return next
}

/** Field defaults, derived from the schema so there is only one source of truth. */
export const patientDefaults = patientSchema.parse({ age: 45 })

/** Groups drive the sticky section rail and per-section completion on /assessment. */
export const ASSESSMENT_SECTIONS = [
  { id: 'demographics', label: 'Demographics' },
  { id: 'laboratory', label: 'Laboratory Values' },
  { id: 'comorbidities', label: 'Comorbidities' },
  { id: 'medication', label: 'Medication' },
  { id: 'pharmacogenomics', label: 'Pharmacogenomics' },
  { id: 'additional', label: 'Additional Clinical Data' },
]
