// Detailed Analysis Module - Separate file for better organization

// Trigger detailed analysis
function triggerDetailedAnalysis() {
    console.log('🚀 Triggering detailed analysis...');

    const analysisContainer = document.getElementById('ai-detailed-analysis-container');
    const analysisContent = document.getElementById('ai-detailed-content');

    if (!analysisContainer || !analysisContent) {
        console.error('❌ Analysis container not found');
        return;
    }

    // Show loading state
    analysisContent.innerHTML = `
        <div class="analysis-loading">
            <div class="loading-spinner"></div>
            <h3>Generating detailed clinical analysis using AI...</h3>
            <p>Please wait while we analyze the patient data...</p>
        </div>
    `;

    // Make API call
    generateDetailedAnalysisAPI();
}

// API call for detailed analysis
async function generateDetailedAnalysisAPI() {
    try {
        if (!currentPatientData || !currentPredictionResult) {
            throw new Error('Missing patient data or prediction results');
        }

        const requestData = {
            patient_data: currentPatientData,
            prediction_result: currentPredictionResult,
            patient_name: patientInfo.name || 'Patient',
            patient_id: patientInfo.id || '',
            clinician_name: patientInfo.clinician || 'Clinician'
        };

        console.log('📤 Sending analysis request...');

        const response = await fetch('/generate_detailed_analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Analysis received:', result.ai_generated);

        // Display the analysis
        displayAnalysisResult(result.analysis, result.ai_generated);

    } catch (error) {
        console.error('❌ Error generating analysis:', error);
        showAnalysisError(error.message);
    }
}

// Display analysis result
function displayAnalysisResult(analysisText, aiGenerated) {
    const analysisContent = document.getElementById('ai-detailed-content');

    if (!analysisContent) {
        console.error('❌ Analysis content element not found');
        return;
    }

    // Format the analysis text
    let formattedAnalysis = analysisText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^# (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h4>$1</h4>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Wrap in paragraphs if needed
    if (!formattedAnalysis.includes('<p>')) {
        formattedAnalysis = '<p>' + formattedAnalysis + '</p>';
    }

    // Wrap list items in ul tags
    formattedAnalysis = formattedAnalysis.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    analysisContent.innerHTML = `
        <div class="analysis-result">
            <div class="analysis-header">
                <h3><i class="fas fa-check-circle"></i> Analysis Complete</h3>
                <div class="analysis-badge ${aiGenerated ? 'ai-powered' : 'fallback'}">
                    <i class="fas fa-${aiGenerated ? 'robot' : 'cogs'}"></i>
                    ${aiGenerated ? 'AI-Powered' : 'Clinical Algorithm'}
                </div>
            </div>
            
            <div class="analysis-content">
                ${formattedAnalysis}
            </div>
            
            <div class="analysis-actions">
                <button onclick="regenerateAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-redo"></i> Regenerate
                </button>
                <button onclick="exportAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Export
                </button>
                <button onclick="hideDetailedAnalysis()" class="btn btn-outline">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;

    console.log('✅ Analysis displayed successfully');
}

// Show analysis error
function showAnalysisError(errorMessage) {
    const analysisContent = document.getElementById('ai-detailed-content');

    if (analysisContent) {
        analysisContent.innerHTML = `
            <div class="analysis-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Analysis Generation Failed</h3>
                <p>Unable to generate detailed analysis: ${errorMessage}</p>
                <div class="error-actions">
                    <button onclick="triggerDetailedAnalysis()" class="btn btn-primary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                    <button onclick="hideDetailedAnalysis()" class="btn btn-secondary">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
    }
}

// Regenerate analysis
function regenerateAnalysis() {
    console.log('🔄 Regenerating analysis...');
    triggerDetailedAnalysis();
}

// Export analysis
function exportAnalysis() {
    const analysisContent = document.querySelector('.analysis-content');
    if (analysisContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Detailed Clinical Analysis</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        h3, h4 { color: #1f2937; }
                        h3 { border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
                        ul { margin: 12px 0; padding-left: 20px; }
                        li { margin: 6px 0; }
                        p { margin: 12px 0; }
                    </style>
                </head>
                <body>
                    <h1>Detailed Clinical Analysis</h1>
                    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    ${analysisContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    } else {
        alert('No analysis content to export');
    }
}

// Hide detailed analysis
function hideDetailedAnalysis() {
    const analysisContainer = document.getElementById('ai-detailed-analysis-container');
    if (analysisContainer) {
        analysisContainer.style.display = 'none';
    }
}

// Show detailed analysis container
function showDetailedAnalysisContainer() {
    const analysisContainer = document.getElementById('ai-detailed-analysis-container');
    if (analysisContainer) {
        analysisContainer.style.display = 'block';
        analysisContainer.scrollIntoView({ behavior: 'smooth' });
    }
}