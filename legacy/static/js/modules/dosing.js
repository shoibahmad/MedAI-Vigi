/**
 * Personalized Dosing & Organ Impairment Adjustment Module
 * Computes renal clearance dosage adjustments and liver disease titration recommendations.
 */

export function calculateRenalDoseAdjustment(drugName, standardDose, egfr) {
    if (!egfr || egfr >= 60) {
        return {
            adjustedDose: standardDose,
            reductionPercent: 0,
            recommendation: "Normal dosing appropriate. Standard monitoring intervals.",
            severity: "Normal"
        };
    }
    if (egfr >= 30 && egfr < 60) {
        return {
            adjustedDose: Math.round((standardDose * 0.7) * 10) / 10,
            reductionPercent: 30,
            recommendation: "Moderate renal impairment: Reduce dose by 30-50% or extend dosing interval.",
            severity: "Moderate"
        };
    }
    if (egfr >= 15 && egfr < 30) {
        return {
            adjustedDose: Math.round((standardDose * 0.5) * 10) / 10,
            reductionPercent: 50,
            recommendation: "Severe renal impairment: Reduce dose by 50-75% with therapeutic drug monitoring.",
            severity: "Severe"
        };
    }
    return {
        adjustedDose: Math.round((standardDose * 0.25) * 10) / 10,
        reductionPercent: 75,
        recommendation: "End-Stage Renal Disease (ESRD): Drug contraindicated or requires post-dialysis titration.",
        severity: "Critical"
    };
}

export function evaluateHepaticDoseAdjustment(drugName, astAlt, bilirubin, albumin) {
    let score = 0;
    if (astAlt > 120) score += 2;
    else if (astAlt > 40) score += 1;
    if (bilirubin > 2.0) score += 2;
    else if (bilirubin > 1.2) score += 1;
    if (albumin < 2.8) score += 2;
    else if (albumin < 3.5) score += 1;

    if (score >= 4) {
        return {
            adjustmentRequired: true,
            reductionPercent: 50,
            guidance: "Severe hepatic impairment (Child-Pugh Class C equivalent). Avoid hepatically metabolized drugs.",
            status: "High Risk"
        };
    }
    if (score >= 2) {
        return {
            adjustmentRequired: true,
            reductionPercent: 25,
            guidance: "Moderate hepatic impairment: 25-50% dose reduction recommended with weekly LFT monitoring.",
            status: "Caution"
        };
    }
    return {
        adjustmentRequired: false,
        reductionPercent: 0,
        guidance: "Normal hepatic metabolic capacity. Standard titration schedule.",
        status: "Normal"
    };
}
