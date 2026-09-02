/**
 * Drug Interaction & Polypharmacy Analysis Module
 * Interacts with /analyze_drug_interactions_ai and displays metabolic conflict alerts.
 */

export async function checkDrugInteractions(primaryDrug, concomitantDrugs, patientContext = {}) {
    const response = await fetch('/analyze_drug_interactions_ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            primary_drug: primaryDrug,
            concomitant_drugs: concomitantDrugs,
            patient_context: patientContext
        })
    });

    if (!response.ok) {
        throw new Error(`Interaction check failed with status ${response.status}`);
    }
    return await response.json();
}

export function renderInteractionAlerts(containerElement, interactionData) {
    if (!containerElement || !interactionData) return;

    const severity = interactionData.severity || "Low";
    const alerts = interactionData.interactions || [];

    let alertHtml = "";
    if (alerts.length === 0) {
        alertHtml = `<div class="alert alert-success">No high-risk pharmacokinetic interactions detected.</div>`;
    } else {
        alertHtml = alerts.map(item => `
            <div class="alert alert-warning mb-2">
                <h6 class="font-weight-bold mb-1">${item.drug1} + ${item.drug2}</h6>
                <p class="mb-0 small">${item.description || item.mechanism}</p>
            </div>
        `).join("");
    }

    containerElement.innerHTML = `
        <div class="interactions-panel mt-3">
            <h6 class="font-weight-bold">Polypharmacy Interaction Screening (${severity} Severity)</h6>
            ${alertHtml}
        </div>
    `;
}
