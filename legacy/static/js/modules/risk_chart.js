/**
 * Risk Visualization & Probability Gauge Module
 * Renders risk scores, dynamic badges, probability breakdown meters, and mitigation recommendations.
 */

export function renderRiskResults(resultContainer, predictionData) {
    if (!resultContainer || !predictionData) return;

    const riskScore = predictionData.risk_score || (predictionData.probability ? Math.round(predictionData.probability * 100) : 0);
    const riskLevel = predictionData.risk_level || "Unknown";
    const adrType = predictionData.predicted_adr_type || predictionData.predicted_adr || "No ADR";
    const probabilities = predictionData.probabilities || {};

    let badgeClass = "badge-success";
    if (riskLevel === "High" || riskLevel === "Severe") badgeClass = "badge-danger";
    else if (riskLevel === "Moderate" || riskLevel === "Medium") badgeClass = "badge-warning";

    let probHtml = "";
    for (const [outcome, prob] of Object.entries(probabilities)) {
        const pct = Math.round(prob * 100);
        probHtml += `
            <div class="probability-item mb-2">
                <div class="d-flex justify-content-between">
                    <span>${outcome}</span>
                    <span class="font-weight-bold">${pct}%</span>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar ${pct > 40 ? 'bg-danger' : (pct > 20 ? 'bg-warning' : 'bg-info')}" 
                         role="progressbar" style="width: ${pct}%"></div>
                </div>
            </div>
        `;
    }

    resultContainer.innerHTML = `
        <div class="card shadow-sm border-0 mb-4">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="card-title text-primary mb-0">Predicted Outcome: ${adrType}</h4>
                    <span class="badge ${badgeClass} px-3 py-2 text-uppercase font-weight-bold">${riskLevel} Risk</span>
                </div>
                <div class="row align-items-center my-4">
                    <div class="col-md-4 text-center">
                        <div class="display-3 font-weight-bold ${riskScore > 60 ? 'text-danger' : (riskScore > 30 ? 'text-warning' : 'text-success')}">
                            ${riskScore}%
                        </div>
                        <p class="text-muted mb-0">Adverse Reaction Probability</p>
                    </div>
                    <div class="col-md-8">
                        <h6 class="font-weight-bold text-secondary mb-3">Differential Diagnosis Breakdown:</h6>
                        ${probHtml || '<p class="text-muted">Single-class assessment active.</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}
