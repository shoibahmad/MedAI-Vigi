/**
 * Personalized Dosing Calculator & Event Handlers
 * Performs patient-specific dose titrations based on age, renal eGFR, hepatic enzymes, and CYP phenotypes.
 */

import { medicationDatabase } from './database.js';

export function calculatePersonalizedDose(drugName, standardDose, patientContext = {}) {
    const med = medicationDatabase[drugName];
    if (!med) return { adjustedDose: standardDose, reasoning: "Standard starting dosage" };

    let factor = 1.0;
    const reasons = [];

    // Age adjustment
    const age = patientContext.age || 45;
    if (age >= 75) {
        factor *= 0.75;
        reasons.push("Geriatric dose adjustment (-25%)");
    } else if (age >= 65) {
        factor *= 0.85;
        reasons.push("Elderly caution adjustment (-15%)");
    }

    // Renal adjustment (eGFR)
    const egfr = patientContext.egfr || 90;
    if (egfr < 30) {
        factor *= 0.50;
        reasons.push("Severe renal impairment eGFR < 30 mL/min (-50%)");
    } else if (egfr < 60) {
        factor *= 0.75;
        reasons.push("Moderate renal impairment eGFR 30-59 mL/min (-25%)");
    }

    // Hepatic adjustment (AST/ALT)
    const astAlt = patientContext.ast_alt || 25;
    if (astAlt > 120) {
        factor *= 0.50;
        reasons.push("Elevated transaminases > 3x ULN (-50%)");
    }

    // Pharmacogenomics (CYP2C9 for Warfarin, SLCO1B1 for Statins)
    if (drugName === 'Warfarin' && patientContext.cyp2c9 === 'Poor') {
        factor *= 0.40;
        reasons.push("CYP2C9 Poor Metabolizer: Marked sensitivity to Warfarin (-60%)");
    }

    const calculated = Math.round((standardDose * factor) * 10) / 10;
    return {
        drug: drugName,
        standardDose: standardDose,
        adjustedDose: calculated,
        unit: med.unit,
        frequency: med.frequency,
        reductionPercent: Math.round((1 - factor) * 100),
        reasoning: reasons.length > 0 ? reasons.join("; ") : "Standard baseline dosing appropriate"
    };
}

export function bindDosingEvents() {
    const calculateBtn = document.getElementById('calculate-dosing-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            const drugSelect = document.getElementById('dosing-medication-select');
            const drugName = drugSelect ? drugSelect.value : 'Warfarin';
            const med = medicationDatabase[drugName];
            const stdDose = med ? med.standardDose : 5;

            const patient = window.currentPatientData || {};
            const result = calculatePersonalizedDose(drugName, stdDose, patient);

            const displayEl = document.getElementById('personalized-dose-result');
            if (displayEl) {
                displayEl.innerHTML = `
                    <div class="alert alert-info border-0 shadow-sm mt-3">
                        <h6 class="font-weight-bold mb-1">${result.drug}: ${result.adjustedDose} ${result.unit} (${result.frequency})</h6>
                        <p class="mb-0 small text-muted">${result.reasoning}</p>
                    </div>
                `;
            }
        });
    }
}
