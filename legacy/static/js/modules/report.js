/**
 * Clinical Report Generation & Export Module
 * Communicates with /generate_report and renders formatted clinical consultation reports.
 */

export async function fetchClinicalReport(patientData, predictionResult) {
    const response = await fetch('/generate_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patient_data: patientData,
            prediction_result: predictionResult
        })
    });

    if (!response.ok) {
        throw new Error(`Report generation failed: status ${response.status}`);
    }
    return await response.json();
}

export function displayFormattedReport(containerElement, reportData) {
    if (!containerElement || !reportData) return;

    const narrative = reportData.clinical_narrative || reportData.report || "No narrative generated.";
    const formattedHtml = narrative
        .replace(/^### (.*$)/gim, '<h5 class="mt-3 text-primary">$1</h5>')
        .replace(/^## (.*$)/gim, '<h4 class="mt-4 text-dark font-weight-bold">$1</h4>')
        .replace(/^# (.*$)/gim, '<h3 class="mt-4 text-dark font-weight-bold">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    containerElement.innerHTML = `
        <div class="report-box p-4 bg-white border rounded shadow-sm">
            <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <h5 class="font-weight-bold mb-0">MedAI-VIGI Clinical Consultation Report</h5>
                <button class="btn btn-sm btn-outline-secondary" onclick="window.print()">
                    <i class="fas fa-print mr-1"></i> Print / Export PDF
                </button>
            </div>
            <div class="report-body">
                <p>${formattedHtml}</p>
            </div>
        </div>
    `;
}
