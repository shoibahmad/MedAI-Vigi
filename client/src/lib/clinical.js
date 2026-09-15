/**
 * Clinical calculations and laboratory interpretation.
 *
 * Ported from static/js/modules/form.js. LAB_REFERENCE_RANGES mirrors
 * ClinicalService.LAB_REFERENCE_RANGES in services/clinical_service.py — keep the
 * two in sync, or client-side interpretation will disagree with /interpret_lab_value.
 *
 * Pure module: no imports, no aliases, so node:test can import it directly.
 */

export function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null
  const heightM = heightCm / 100
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10
}

export function bmiCategory(bmi) {
  if (bmi == null) return null
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

/**
 * CKD-EPI 2021 creatinine equation (race-free).
 * eGFR = 142 x min(Scr/k,1)^a x max(Scr/k,1)^-1.200 x 0.9938^age x 1.012 [if female]
 */
export function calculateEGFR(creatinine, age, sex = 'M') {
  const scr = Number(creatinine)
  const yrs = Number(age)
  if (!scr || scr <= 0 || !yrs || yrs <= 0) return null

  const female = String(sex).toUpperCase().startsWith('F')
  const kappa = female ? 0.7 : 0.9
  const alpha = female ? -0.241 : -0.302

  const ratio = scr / kappa
  const egfr =
    142 *
    Math.pow(Math.min(ratio, 1), alpha) *
    Math.pow(Math.max(ratio, 1), -1.2) *
    Math.pow(0.9938, yrs) *
    (female ? 1.012 : 1)

  return Math.round(egfr * 10) / 10
}

export const LAB_REFERENCE_RANGES = {
  creatinine: {
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    ranges: { M: { low: 0.7, high: 1.3 }, F: { low: 0.6, high: 1.1 } },
    critical_high: 3.0,
    clinical_significance:
      'Elevated creatinine indicates impaired renal filtration and reduced drug clearance.',
  },
  egfr: {
    name: 'Estimated GFR',
    unit: 'mL/min/1.73m\u00b2',
    ranges: { M: { low: 90.0, high: 120.0 }, F: { low: 90.0, high: 120.0 } },
    critical_low: 30.0,
    clinical_significance:
      'Values <60 mL/min indicate chronic kidney disease; <30 mL/min requires renal dose adjustment.',
  },
  ast_alt: {
    name: 'AST/ALT Hepatic Transaminases',
    unit: 'U/L',
    ranges: { M: { low: 10.0, high: 40.0 }, F: { low: 7.0, high: 35.0 } },
    critical_high: 150.0,
    clinical_significance: 'Transaminase elevation >3x ULN signifies hepatocellular injury.',
  },
  bilirubin: {
    name: 'Total Bilirubin',
    unit: 'mg/dL',
    ranges: { M: { low: 0.2, high: 1.2 }, F: { low: 0.2, high: 1.2 } },
    critical_high: 2.5,
    clinical_significance:
      'Elevated bilirubin indicates cholestatic or hepatocellular impairment.',
  },
  albumin: {
    name: 'Serum Albumin',
    unit: 'g/dL',
    ranges: { M: { low: 3.5, high: 5.0 }, F: { low: 3.5, high: 5.0 } },
    critical_low: 2.8,
    clinical_significance:
      'Hypoalbuminemia increases the free active fraction of highly protein-bound drugs (e.g. Warfarin, Phenytoin).',
  },
}

/**
 * Mirrors ClinicalService.interpret_lab_value so the UI can flag values inline
 * without a round trip. Returns severity 'Normal' | 'Moderate' | 'Severe'.
 */
export function interpretLabValue(testName, value, sex = 'M') {
  const key = String(testName).toLowerCase().replace(/ /g, '_')
  const ref = LAB_REFERENCE_RANGES[key]
  const numeric = Number(value)

  if (!ref || Number.isNaN(numeric)) {
    return {
      test_name: testName,
      value,
      status: 'Unknown',
      severity: 'Normal',
      clinical_significance: 'No reference range available.',
    }
  }

  const ranges = ref.ranges[String(sex).toUpperCase()] || ref.ranges.M
  const { low, high } = ranges

  let status
  let severity
  if (numeric < low) {
    status = 'Low'
    severity =
      ref.critical_low !== undefined && numeric <= ref.critical_low ? 'Severe' : 'Moderate'
  } else if (numeric > high) {
    status = 'High'
    severity =
      ref.critical_high !== undefined && numeric >= ref.critical_high ? 'Severe' : 'Moderate'
  } else {
    status = 'Normal'
    severity = 'Normal'
  }

  return {
    test_name: ref.name,
    value: numeric,
    unit: ref.unit,
    status,
    severity,
    reference_range: `${low} - ${high} ${ref.unit}`,
    clinical_significance: ref.clinical_significance,
  }
}

/** Maps an interpretation onto the lab-* design tokens. */
export function labStateFor(interpretation) {
  if (!interpretation || interpretation.status === 'Unknown') return 'unknown'
  if (interpretation.severity === 'Severe') return 'critical'
  if (interpretation.status === 'Normal') return 'normal'
  return 'abnormal'
}
