/**
 * Personalized dosing and organ-impairment adjustment.
 *
 * Ported verbatim (behaviour-preserving) from:
 *   static/js/dosing/database.js    -> MEDICATION_DATABASE, getMedicationInfo
 *   static/js/dosing/calculator.js  -> calculatePersonalizedDose
 *   static/js/modules/dosing.js     -> calculateRenalDoseAdjustment, evaluateHepaticDoseAdjustment
 *
 * The DOM-binding halves of those files (bindDosingEvents, setupBMICalculation) are
 * intentionally dropped -- React owns the wiring now.
 *
 * Pure module: no imports, no aliases, so node:test can import it directly.
 */

export const MEDICATION_DATABASE = {
  // Cardiovascular
  Aspirin: { standardDose: 81, unit: 'mg', frequency: 'once daily', category: 'Antiplatelet' },
  Atorvastatin: { standardDose: 20, unit: 'mg', frequency: 'once daily', category: 'Statin' },
  Lisinopril: { standardDose: 10, unit: 'mg', frequency: 'once daily', category: 'ACE Inhibitor' },
  Metoprolol: { standardDose: 50, unit: 'mg', frequency: 'twice daily', category: 'Beta Blocker' },
  Amlodipine: {
    standardDose: 5,
    unit: 'mg',
    frequency: 'once daily',
    category: 'Calcium Channel Blocker',
  },
  Warfarin: { standardDose: 5, unit: 'mg', frequency: 'once daily', category: 'Anticoagulant' },
  Clopidogrel: { standardDose: 75, unit: 'mg', frequency: 'once daily', category: 'Antiplatelet' },

  // Metabolic and diabetes
  Metformin: { standardDose: 500, unit: 'mg', frequency: 'twice daily', category: 'Antidiabetic' },
  Insulin: { standardDose: 10, unit: 'units', frequency: 'as directed', category: 'Insulin' },
  Glipizide: { standardDose: 5, unit: 'mg', frequency: 'once daily', category: 'Sulfonylurea' },
  Sitagliptin: {
    standardDose: 100,
    unit: 'mg',
    frequency: 'once daily',
    category: 'DPP-4 Inhibitor',
  },

  // Anti-infectives
  Amoxicillin: {
    standardDose: 500,
    unit: 'mg',
    frequency: 'three times daily',
    category: 'Antibiotic',
  },
  Ciprofloxacin: {
    standardDose: 500,
    unit: 'mg',
    frequency: 'twice daily',
    category: 'Antibiotic',
  },
  Azithromycin: { standardDose: 250, unit: 'mg', frequency: 'once daily', category: 'Antibiotic' },

  // Analgesics and anti-inflammatory
  Ibuprofen: { standardDose: 400, unit: 'mg', frequency: 'every 6 hours', category: 'NSAID' },
  Acetaminophen: {
    standardDose: 650,
    unit: 'mg',
    frequency: 'every 6 hours',
    category: 'Analgesic',
  },
  Tramadol: { standardDose: 50, unit: 'mg', frequency: 'every 6 hours', category: 'Opioid' },

  // Neuro-psychiatric
  Sertraline: { standardDose: 50, unit: 'mg', frequency: 'once daily', category: 'SSRI' },
  Fluoxetine: { standardDose: 20, unit: 'mg', frequency: 'once daily', category: 'SSRI' },
  Lorazepam: { standardDose: 1, unit: 'mg', frequency: 'twice daily', category: 'Benzodiazepine' },

  // Other
  Omeprazole: { standardDose: 20, unit: 'mg', frequency: 'once daily', category: 'PPI' },
  Furosemide: { standardDose: 40, unit: 'mg', frequency: 'once daily', category: 'Diuretic' },
  Digoxin: {
    standardDose: 0.25,
    unit: 'mg',
    frequency: 'once daily',
    category: 'Cardiac Glycoside',
  },
}

export const MEDICATION_NAMES = Object.keys(MEDICATION_DATABASE).sort()

export function getMedicationInfo(name) {
  return MEDICATION_DATABASE[name] || null
}

export function calculateRenalDoseAdjustment(drugName, standardDose, egfr) {
  if (!egfr || egfr >= 60) {
    return {
      adjustedDose: standardDose,
      reductionPercent: 0,
      recommendation: 'Normal dosing appropriate. Standard monitoring intervals.',
      severity: 'Normal',
    }
  }
  if (egfr >= 30 && egfr < 60) {
    return {
      adjustedDose: Math.round(standardDose * 0.7 * 10) / 10,
      reductionPercent: 30,
      recommendation:
        'Moderate renal impairment: Reduce dose by 30-50% or extend dosing interval.',
      severity: 'Moderate',
    }
  }
  if (egfr >= 15 && egfr < 30) {
    return {
      adjustedDose: Math.round(standardDose * 0.5 * 10) / 10,
      reductionPercent: 50,
      recommendation:
        'Severe renal impairment: Reduce dose by 50-75% with therapeutic drug monitoring.',
      severity: 'Severe',
    }
  }
  return {
    adjustedDose: Math.round(standardDose * 0.25 * 10) / 10,
    reductionPercent: 75,
    recommendation:
      'End-Stage Renal Disease (ESRD): Drug contraindicated or requires post-dialysis titration.',
    severity: 'Critical',
  }
}

export function evaluateHepaticDoseAdjustment(drugName, astAlt, bilirubin, albumin) {
  let score = 0
  if (astAlt > 120) score += 2
  else if (astAlt > 40) score += 1
  if (bilirubin > 2.0) score += 2
  else if (bilirubin > 1.2) score += 1
  if (albumin < 2.8) score += 2
  else if (albumin < 3.5) score += 1

  if (score >= 4) {
    return {
      adjustmentRequired: true,
      reductionPercent: 50,
      guidance:
        'Severe hepatic impairment (Child-Pugh Class C equivalent). Avoid hepatically metabolized drugs.',
      status: 'High Risk',
    }
  }
  if (score >= 2) {
    return {
      adjustmentRequired: true,
      reductionPercent: 25,
      guidance:
        'Moderate hepatic impairment: 25-50% dose reduction recommended with weekly LFT monitoring.',
      status: 'Caution',
    }
  }
  return {
    adjustmentRequired: false,
    reductionPercent: 0,
    guidance: 'Normal hepatic metabolic capacity. Standard titration schedule.',
    status: 'Normal',
  }
}

export function calculatePersonalizedDose(drugName, standardDose, patientContext = {}) {
  const med = MEDICATION_DATABASE[drugName]
  if (!med) return { adjustedDose: standardDose, reasoning: 'Standard starting dosage' }

  let factor = 1.0
  const reasons = []

  const age = patientContext.age || 45
  if (age >= 75) {
    factor *= 0.75
    reasons.push('Geriatric dose adjustment (-25%)')
  } else if (age >= 65) {
    factor *= 0.85
    reasons.push('Elderly caution adjustment (-15%)')
  }

  const egfr = patientContext.egfr || 90
  if (egfr < 30) {
    factor *= 0.5
    reasons.push('Severe renal impairment eGFR < 30 mL/min (-50%)')
  } else if (egfr < 60) {
    factor *= 0.75
    reasons.push('Moderate renal impairment eGFR 30-59 mL/min (-25%)')
  }

  const astAlt = patientContext.ast_alt || 25
  if (astAlt > 120) {
    factor *= 0.5
    reasons.push('Elevated transaminases > 3x ULN (-50%)')
  }

  if (drugName === 'Warfarin' && patientContext.cyp2c9 === 'Poor') {
    factor *= 0.4
    reasons.push('CYP2C9 Poor Metabolizer: Marked sensitivity to Warfarin (-60%)')
  }

  return {
    drug: drugName,
    standardDose,
    adjustedDose: Math.round(standardDose * factor * 10) / 10,
    unit: med.unit,
    frequency: med.frequency,
    reductionPercent: Math.round((1 - factor) * 100),
    reasoning: reasons.length > 0 ? reasons.join('; ') : 'Standard baseline dosing appropriate',
  }
}
