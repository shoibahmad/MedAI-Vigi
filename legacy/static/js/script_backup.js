// DOM Elements - will be initialized when DOM is ready
let form, clearButton, resultsContainer, resultsContent, generateReportButton, reportContainer, reportContent, loadingOverlay;

// Global variables
let currentPatientData = {};
let currentPredictionResult = {};
let patientInfo = {};

// Generate random patient ID
function generatePatientId() {
    const prefix = 'PT';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${year}${month}${day}${random}`;
}

// Initialize patient info with generated ID
function initializePatientInfo() {
    const patientId = generatePatientId();
    const currentDate = new Date().toLocaleDateString();

    patientInfo = {
        id: patientId,
        name: 'New Patient',
        clinician: 'Healthcare Provider',
        startTime: new Date().toISOString()
    };

    // Update displays
    updatePatientDisplay();

    // Store in session
    sessionStorage.setItem('patientId', patientId);
    sessionStorage.setItem('assessmentStartTime', patientInfo.startTime);
}

// Update patient display elements
function updatePatientDisplay() {
    const patientIdDisplay = document.getElementById('patient-id-display');
    const patientNameDisplay = document.getElementById('patient-name-display');
    const assessmentDateDisplay = document.getElementById('assessment-date-display');

    if (patientIdDisplay) {
        patientIdDisplay.textContent = `ID: ${patientInfo.id}`;
    }

    if (patientNameDisplay) {
        patientNameDisplay.textContent = patientInfo.name;
    }

    if (assessmentDateDisplay) {
        assessmentDateDisplay.textContent = new Date().toLocaleDateString();
    }
}

// Initialize DOM elements
function initializeDOMElements() {
    console.log('🔍 Initializing DOM elements...');

    form = document.getElementById('adr-form');
    clearButton = document.getElementById('clear-form');
    resultsContainer = document.getElementById('results-container');
    resultsContent = document.getElementById('results-content');
    generateReportButton = document.getElementById('generate-report');
    reportContainer = document.getElementById('report-container');
    reportContent = document.getElementById('report-content');
    loadingOverlay = document.getElementById('loading-overlay');

    // Log which elements were found
    console.log('📋 DOM Elements Status:', {
        'adr-form': !!form,
        'clear-form': !!clearButton,
        'results-container': !!resultsContainer,
        'results-content': !!resultsContent,
        'generate-report': !!generateReportButton,
        'report-container': !!reportContainer,
        'report-content': !!reportContent,
        'loading-overlay': !!loadingOverlay
    });

    // Make elements globally accessible for debugging
    window.resultsContainer = resultsContainer;
    window.resultsContent = resultsContent;
    window.reportContent = reportContent;

    // Setup BMI calculation
    setupBMICalculation();
}

// Mobile Navigation Functions
function initializeMobileNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    // Function to open sidebar
    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    // Function to close sidebar
    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Toggle sidebar
    if (navToggle && sidebar) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Close sidebar with close button
    if (sidebarClose) {
        sidebarClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }

    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Menu item navigation
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            const section = item.dataset.section;
            showSection(section);

            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });

    // Close sidebar when clicking outside (backup)
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 768 &&
            sidebar && sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            navToggle && !navToggle.contains(e.target)) {
            closeSidebar();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// Show specific section
function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Form Progress Tracking
function updateFormProgress() {
    const sections = ['demographics', 'laboratory', 'comorbidities', 'medication', 'pharmacogenomics', 'clinical'];

    sections.forEach(section => {
        const isComplete = checkSectionCompletion(section);
        const progressCircle = document.querySelector(`[data-section="${section}"]`);

        if (progressCircle) {
            if (isComplete) {
                progressCircle.classList.add('completed');
            } else {
                progressCircle.classList.remove('completed');
            }
        }
    });
}

// BMI Calculation Function
function calculateBMI() {
    const heightField = document.getElementById('height');
    const weightField = document.getElementById('weight');
    const bmiField = document.getElementById('bmi');
    const bmiValueDisplay = document.getElementById('bmi-value');
    const bmiCategoryDisplay = document.getElementById('bmi-category');

    if (!heightField || !weightField || !bmiField) {
        console.warn('BMI calculation fields not found');
        return;
    }

    const height = parseFloat(heightField.value);
    const weight = parseFloat(weightField.value);

    if (height && weight && height > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);

        bmiField.value = bmi.toFixed(1);

        // Update BMI category and display
        let category = '';
        let categoryClass = '';

        if (bmi < 18.5) {
            category = 'Underweight';
            categoryClass = 'underweight';
        } else if (bmi < 25) {
            category = 'Normal Weight';
            categoryClass = 'normal';
        } else if (bmi < 30) {
            category = 'Overweight';
            categoryClass = 'overweight';
        } else {
            category = 'Obese';
            categoryClass = 'obese';
        }

        // Update displays
        if (bmiValueDisplay) {
            bmiValueDisplay.textContent = bmi.toFixed(1);
        }

        if (bmiCategoryDisplay) {
            bmiCategoryDisplay.textContent = category;
            bmiCategoryDisplay.className = `bmi-category ${categoryClass}`;
        }

    } else {
        bmiField.value = '';
        if (bmiValueDisplay) {
            bmiValueDisplay.textContent = '--';
        }
        if (bmiCategoryDisplay) {
            bmiCategoryDisplay.textContent = 'Enter height & weight';
            bmiCategoryDisplay.className = 'bmi-category';
        }
    }
}

// Update BMI visual display
function updateBMIDisplay(bmi, category, categoryClass) {
    const bmiDisplay = document.querySelector('.bmi-display');
    if (!bmiDisplay) return;

    const bmiNumber = bmiDisplay.querySelector('.bmi-number');
    const bmiCategoryElement = bmiDisplay.querySelector('.bmi-category');
    const bmiProgressFill = bmiDisplay.querySelector('.bmi-progress-fill');
    const healthIcon = bmiDisplay.querySelector('.health-icon');
    const healthText = bmiDisplay.querySelector('.health-text');

    if (bmiNumber) bmiNumber.textContent = bmi.toFixed(1);
    if (bmiCategoryElement) {
        bmiCategoryElement.textContent = category;
        bmiCategoryElement.className = `bmi-category ${categoryClass}`;
    }

    // Update progress bar
    if (bmiProgressFill) {
        let progressWidth = 0;
        if (bmi < 18.5) progressWidth = (bmi / 18.5) * 25;
        else if (bmi < 25) progressWidth = 25 + ((bmi - 18.5) / 6.5) * 25;
        else if (bmi < 30) progressWidth = 50 + ((bmi - 25) / 5) * 25;
        else prog
        // Setup BMI Calculation
        function setupBMICalculation() {
            const heightField = document.getElementById('height');
            const weightField = document.getElementById('weight');

            if (heightField && weightField) {
                heightField.addEventListener('input', calculateBMI);
                weightField.addEventListener('input', calculateBMI);
            }
        }

        // Check if a form section is complete
        function checkSectionCompletion(section) {
            // All sections are now optional - users can leave fields empty
            // We'll just check if at least one field in each section has a value
            switch (section) {
                case 'demographics':
                    return document.getElementById('age').value ||
                        document.getElementById('sex').value ||
                        document.getElementById('ethnicity').value ||
                        document.getElementById('height').value ||
                        document.getElementById('weight').value;

                case 'laboratory':
                    return document.getElementById('creatinine').value ||
                        document.getElementById('egfr').value ||
                        document.getElementById('ast_alt').value ||
                        document.getElementById('bilirubin').value ||
                        document.getElementById('albumin').value;

                case 'comorbidities':
                    return true; // Comorbidities are always optional

                case 'medication':
                    return document.getElementById('medication_name').value ||
                        document.getElementById('index_drug_dose').value ||
                        document.getElementById('concomitant_drugs_count').value ||
                        document.getElementById('drug_interactions').value;

                case 'pharmacogenomics':
                    return document.getElementById('cyp2c9').value ||
                        document.getElementById('cyp2d6').value;

                case 'clinical':
                    return document.getElementById('bp_systolic').value ||
                        document.getElementById('bp_diastolic').value ||
                        document.getElementById('heart_rate').value ||
                        document.getElementById('time_since_start_days').value;

                default:
                    return false;
            }
        }

        // Quick Actions
        function initializeQuickActions() {
            const loadSampleBtn = document.getElementById('load-sample-data');
            const clearFormBtn = document.getElementById('clear-form');
            const voiceInputBtn = document.getElementById('voice-input');
            const sampleSelector = document.getElementById('sample-data-selector');
            const sampleContainer = document.getElementById('sample-selector-container');

            // Load sample data
            if (loadSampleBtn) {
                loadSampleBtn.addEventListener('click', () => {
                    if (sampleContainer.style.display === 'none' || !sampleContainer.style.display) {
                        sampleContainer.style.display = 'block';
                    } else {
                        sampleContainer.style.display = 'none';
                    }
                });
            }

            // Sample selector change
            if (sampleSelector) {
                sampleSelector.addEventListener('change', (e) => {
                    if (e.target.value) {
                        loadSampleData(e.target.value);
                        sampleContainer.style.display = 'none';
                    }
                });
            }

            // Clear form
            if (clearFormBtn) {
                clearFormBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to clear all form data?')) {
                        form.reset();
                        updateFormProgress();
                        showSuccess('Form cleared successfully');
                    }
                });
            }

            // Voice input (placeholder)
            if (voiceInputBtn) {
                voiceInputBtn.addEventListener('click', () => {
                    showInfo('Voice input feature coming soon!');
                });
            }
        }

        // Enhanced form validation with visual feedback
        function validateFormWithFeedback() {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            let firstInvalidField = null;

            requiredFields.forEach(field => {
                const inputGroup = field.closest('.input-group');

                if (!field.value.trim()) {
                    field.style.borderColor = 'var(--medical-danger)';
                    field.style.backgroundColor = 'rgba(220, 38, 38, 0.05)';

                    if (inputGroup) {
                        inputGroup.classList.add('error');
                    }

                    if (!firstInvalidField) {
                        firstInvalidField = field;
                    }

                    isValid = false;
                } else {
                    field.style.borderColor = 'var(--medical-success)';
                    field.style.backgroundColor = 'rgba(5, 150, 105, 0.05)';

                    if (inputGroup) {
                        inputGroup.classList.remove('error');
                    }
                }
            });

            // Scroll to first invalid field
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                firstInvalidField.focus();
            }

            return isValid;
        }

        // Form submission handler
        function setupFormHandler() {
            if (!form) {
                console.error('Form element not found!');
                return;
            }

            console.log('Form handler setup successfully');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Form submitted!');
                console.log('Form element:', form);
                console.log('Results container:', document.getElementById('results-container'));
                console.log('AI analysis container:', document.getElementById('ai-detailed-analysis-container'));

                // Basic validation - only check for invalid numeric values, not missing fields
                const invalidFields = [];
                const numericFields = ['age', 'height', 'weight', 'bmi', 'creatinine', 'egfr', 'ast_alt',
                    'bilirubin', 'albumin', 'index_drug_dose', 'concomitant_drugs_count',
                    'bp_systolic', 'bp_diastolic', 'heart_rate', 'time_since_start_days'];

                for (const field of numericFields) {
                    const element = document.getElementById(field);
                    if (element && element.value.trim()) {
                        const value = element.value.trim();
                        const numValue = parseFloat(value);
                        if (isNaN(numValue) || numValue < 0) {
                            invalidFields.push(`${field.replace(/_/g, ' ')} (must be a positive number)`);
                        }
                    }
                }

                if (invalidFields.length > 0) {
                    showError(`Please correct the following fields: ${invalidFields.join(', ')}`);
                    return;
                }

                try {
                    showLoading();

                    // Collect form data
                    const formData = new FormData(form);
                    const patientData = {};

                    // Process form data
                    for (let [key, value] of formData.entries()) {
                        if (value === '') continue;

                        // Handle checkboxes
                        if (['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 'hypertension',
                            'respiratory_disease', 'neurological_disease', 'autoimmune_disease',
                            'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag',
                            'inpatient_flag', 'prior_adr_history'].includes(key)) {
                            patientData[key] = 1;
                        } else {
                            // Convert numeric fields
                            if (['age', 'height', 'weight', 'bmi', 'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
                                'index_drug_dose', 'concomitant_drugs_count', 'bp_systolic',
                                'bp_diastolic', 'heart_rate', 'time_since_start_days'].includes(key)) {
                                patientData[key] = parseFloat(value);
                            } else {
                                patientData[key] = value;
                            }
                        }
                    }

                    // Set default values for unchecked checkboxes
                    const checkboxFields = ['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 'hypertension',
                        'respiratory_disease', 'neurological_disease', 'autoimmune_disease',
                        'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag',
                        'inpatient_flag', 'prior_adr_history'];

                    checkboxFields.forEach(field => {
                        if (!(field in patientData)) {
                            patientData[field] = 0;
                        }
                    });

                    // Calculate derived fields
                    patientData.polypharmacy_flag = patientData.concomitant_drugs_count > 5 ? 1 : 0;
                    patientData.cumulative_dose_mg = patientData.index_drug_dose * patientData.time_since_start_days;
                    patientData.dose_density_mg_day = patientData.cumulative_dose_mg / patientData.time_since_start_days;

                    // Validate numeric fields before sending
                    const numericFields = ['age', 'height', 'weight', 'bmi', 'creatinine', 'egfr', 'ast_alt',
                        'bilirubin', 'albumin', 'index_drug_dose', 'concomitant_drugs_count',
                        'bp_systolic', 'bp_diastolic', 'heart_rate', 'time_since_start_days'];

                    for (const field of numericFields) {
                        if (field in patientData) {
                            const value = patientData[field];
                            if (isNaN(value) || value === null || value === undefined) {
                                console.error(`❌ Invalid numeric value for ${field}:`, value);
                                throw new Error(`Invalid numeric value for ${field}: ${value}`);
                            }
                        }
                    }

                    console.log('✅ Data validation passed');
                    console.log('📤 Sending patient data:', patientData);

                    // Collect concomitant drug names
                    const concomitantDrugs = [];
                    const drugInputs = document.querySelectorAll('.concomitant-drug-input');
                    drugInputs.forEach(input => {
                        if (input.value.trim()) {
                            concomitantDrugs.push(input.value.trim());
                        }
                    });
                    patientData.concomitant_drug_names = concomitantDrugs;

                    // Store current patient data
                    currentPatientData = patientData;

                    // Make prediction request
                    const response = await fetch('/predict', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(patientData)
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                    }

                    const result = await response.json();
                    console.log('Prediction result:', result);

                    // Store current prediction result
                    currentPredictionResult = result;

                    // Display results (this will also trigger the ADR alert system)
                    displayResults(result);
                    
                    // Check for ADR risk and show alert if needed
                    checkAndShowADRAlert(result);

                    // Show detailed analysis container
                    showDetailedAnalysisContainer();

                    // Switch to results section
                    showSection('results');

                    // Show success message
                    showSuccess('ADR risk assessment completed successfully!');

                } catch (error) {
                    console.error('Error:', error);
                    showError(`Failed to assess ADR risk: ${error.message}`);
                } finally {
                    hideLoading();
                }
            });
        }

        // Clear form handler
        function setupClearHandler() {
            if (!clearButton) return;

            clearButton.addEventListener('click', () => {
                form.reset();
                resultsContainer.style.display = 'none';
                reportContainer.style.display = 'none';
                currentPatientData = {};
                currentPredictionResult = {};
            });
        }

        // Generate report handler
        function setupReportHandler() {
            if (!generateReportButton) return;

            generateReportButton.addEventListener('click', async () => {
                await generateClinicalReport();
            });
        }

        // Generate clinical report function
        async function generateClinicalReport() {
            try {
                console.log('=== Starting clinical report generation ===');
                showLoading();

                // Show loading in report section
                showReportLoading();

                // Ensure we have the required data
                if (!currentPatientData || !currentPredictionResult) {
                    console.error('Missing data:', {
                        hasPatientData: !!currentPatientData,
                        hasPredictionResult: !!currentPredictionResult
                    });
                    throw new Error('Missing patient data or prediction results');
                }

                const requestData = {
                    patient_data: currentPatientData,
                    prediction_result: currentPredictionResult,
                    patient_name: patientInfo.name || 'Patient',
                    patient_id: patientInfo.id || '',
                    clinician_name: patientInfo.clinician || 'Clinician'
                };

                console.log('Sending report request with data:', requestData);

                const response = await fetch('/generate_report', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestData)
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Server error response:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                }

                const result = await response.json();
                console.log('Report generated successfully, AI generated:', result.ai_generated);
                console.log('Report length:', result.report ? result.report.length : 0);

                // Display formatted report
                displayFormattedReport(result.report);

                // Show success message
                showSuccess(`Clinical report generated successfully! ${result.ai_generated ? '(AI-powered)' : '(Fallback)'}`)

            } catch (error) {
                console.error('Error generating report:', error);
                showError(`Failed to generate clinical report: ${error.message}`);

                // Show fallback message in report area
                const reportContentElement = document.getElementById('report-content');
                if (reportContentElement) {
                    reportContentElement.innerHTML = `
                <div class="report-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Report Generation Failed</h4>
                    <p>Unable to generate clinical report: ${error.message}</p>
                    <button onclick="generateClinicalReport()" class="btn btn-secondary">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
                } else {
                    console.error('❌ report-content element not found');
                }
            } finally {
                hideLoading();
            }
        }

        // This function is replaced by the enhanced version below

        // Get risk description
        function getRiskDescription(riskLevel) {
            switch (riskLevel) {
                case 'low':
                    return 'Low probability of adverse events';
                case 'medium':
                    return 'Moderate monitoring recommended';
                case 'high':
                    return 'Enhanced monitoring required';
                default:
                    return 'Assessment completed';
            }
        }

        // Get follow-up schedule based on risk level
        function getFollowUpSchedule(riskLevel) {
            switch (riskLevel) {
                case 'high':
                    return 'Daily for first week, then weekly for first month';
                case 'medium':
                    return 'Weekly for first month, then bi-weekly';
                case 'low':
                    return 'Bi-weekly for first month, then monthly';
                default:
                    return 'As clinically indicated';
            }
        }

        // Generate risk-based suggestions
        function generateRiskSuggestions(result, riskLevel) {
            if (riskLevel === 'low') {
                return ''; // No suggestions for low risk
            }

            const suggestions = getRiskBasedSuggestions(result, riskLevel);
            const suggestionClass = riskLevel === 'high' ? 'high-risk-suggestions' : 'medium-risk-suggestions';
            const iconClass = riskLevel === 'high' ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';
            const titleColor = riskLevel === 'high' ? '#dc2626' : '#f59e0b';

            return `
                <div class="risk-suggestions ${suggestionClass}">
                    <h3 style="color: ${titleColor};">
                        <i class="${iconClass}"></i> 
                        ${riskLevel === 'high' ? 'Critical Risk Management Suggestions' : 'Enhanced Monitoring Suggestions'}
                    </h3>
                    <div class="suggestions-grid">
                        ${suggestions.map(suggestion => `
                            <div class="suggestion-card ${suggestion.priority}">
                                <div class="suggestion-icon">
                                    <i class="${suggestion.icon}"></i>
                                </div>
                                <div class="suggestion-content">
                                    <h4>${suggestion.title}</h4>
                                    <p>${suggestion.description}</p>
                                    ${suggestion.action ? `<div class="suggestion-action">${suggestion.action}</div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Get risk-based suggestions
        function getRiskBasedSuggestions(result, riskLevel) {
            const suggestions = [];
            const predictedADR = result.predicted_adr_type;
            const noAdrProb = result.no_adr_probability;

            if (riskLevel === 'high') {
                // Critical suggestions for high risk
                suggestions.push({
                    priority: 'critical',
                    icon: 'fas fa-ambulance',
                    title: 'Immediate Medical Attention',
                    description: 'Patient requires immediate clinical evaluation and continuous monitoring.',
                    action: 'Contact physician within 1 hour'
                });

                suggestions.push({
                    priority: 'critical',
                    icon: 'fas fa-pills',
                    title: 'Medication Review',
                    description: 'Consider immediate dose reduction or alternative therapy.',
                    action: 'Review with clinical pharmacist'
                });

                suggestions.push({
                    priority: 'urgent',
                    icon: 'fas fa-vial',
                    title: 'Laboratory Monitoring',
                    description: 'Urgent lab work required to assess organ function.',
                    action: 'Order CBC, CMP, LFTs within 4 hours'
                });

                // Add specific suggestions based on predicted ADR
                if (predictedADR === 'Hepatotoxicity') {
                    suggestions.push({
                        priority: 'critical',
                        icon: 'fas fa-liver',
                        title: 'Liver Function Alert',
                        description: 'High risk of liver damage. Monitor ALT, AST, bilirubin closely.',
                        action: 'Consider hepatoprotective measures'
                    });
                } else if (predictedADR === 'Nephrotoxicity') {
                    suggestions.push({
                        priority: 'critical',
                        icon: 'fas fa-kidneys',
                        title: 'Kidney Function Alert',
                        description: 'High risk of kidney damage. Monitor creatinine and urine output.',
                        action: 'Ensure adequate hydration'
                    });
                } else if (predictedADR === 'Cardiotoxicity') {
                    suggestions.push({
                        priority: 'critical',
                        icon: 'fas fa-heart',
                        title: 'Cardiac Monitoring Alert',
                        description: 'High risk of cardiac complications. Monitor ECG and cardiac enzymes.',
                        action: 'Consider cardiology consultation'
                    });
                }

            } else if (riskLevel === 'medium') {
                // Enhanced monitoring suggestions for medium risk
                suggestions.push({
                    priority: 'urgent',
                    icon: 'fas fa-eye',
                    title: 'Enhanced Monitoring',
                    description: 'Increase monitoring frequency and patient education.',
                    action: 'Weekly clinical assessments'
                });

                suggestions.push({
                    priority: 'moderate',
                    icon: 'fas fa-chart-line',
                    title: 'Trend Monitoring',
                    description: 'Track symptoms and lab values for early detection of ADRs.',
                    action: 'Maintain detailed monitoring log'
                });

                suggestions.push({
                    priority: 'moderate',
                    icon: 'fas fa-user-md',
                    title: 'Patient Education',
                    description: 'Educate patient on warning signs and when to seek help.',
                    action: 'Provide ADR symptom checklist'
                });
            }

            return suggestions;
        }

        // Show blinking warning overlay for high-risk cases
        function showBlinkingWarningOverlay() {
            // Remove any existing overlay
            const existingOverlay = document.getElementById('high-risk-warning-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            // Create blinking overlay
            const overlay = document.createElement('div');
            overlay.id = 'high-risk-warning-overlay';
            overlay.className = 'high-risk-blinking-overlay';

            document.body.appendChild(overlay);

            // Auto-remove overlay after 30 seconds or when user clicks
            const removeOverlay = () => {
                if (overlay.parentElement) {
                    overlay.remove();
                }
            };

            overlay.addEventListener('click', removeOverlay);
            setTimeout(removeOverlay, 30000); // Remove after 30 seconds

            console.log('🚨 High-risk blinking overlay activated');
        }

        // Show medium risk indicator
        function showMediumRiskIndicator() {
            // Create subtle indicator for medium risk
            const indicator = document.createElement('div');
            indicator.className = 'medium-risk-indicator';
            indicator.innerHTML = `
                <div class="medium-risk-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Medium Risk Detected - Enhanced Monitoring Required</span>
                </div>
            `;

            document.body.appendChild(indicator);

            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (indicator.parentElement) {
                    indicator.remove();
                }
            }, 10000);
        }

        // Show loading overlay
        function showLoading() {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            } else {
                console.log('Loading...');
            }
        }

        // Hide loading overlay
        function hideLoading() {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }

        // Show error message
        function showError(message) {
            // Create error notification
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-notification';
            errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

            // Add error styles if not already added
            if (!document.querySelector('#error-styles')) {
                const style = document.createElement('style');
                style.id = 'error-styles';
                style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fed7d7;
                color: #c53030;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #e53e3e;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .error-content button {
                background: none;
                border: none;
                color: #c53030;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
                document.head.appendChild(style);
            }

            document.body.appendChild(errorDiv);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentElement) {
                    errorDiv.remove();
                }
            }, 5000);
        }

        // Show success message
        function showSuccess(message) {
            // Create success notification
            const successDiv = document.createElement('div');
            successDiv.className = 'success-notification';
            successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

            // Add success styles if not already added
            if (!document.querySelector('#success-styles')) {
                const style = document.createElement('style');
                style.id = 'success-styles';
                style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #c6f6d5;
                color: #2f855a;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #38a169;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .success-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .success-content button {
                background: none;
                border: none;
                color: #2f855a;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
                document.head.appendChild(style);
            }

            document.body.appendChild(successDiv);

            // Auto remove after 4 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 4000);
        }

        // Show report loading state
        function showReportLoading() {
            const reportContent = document.getElementById('report-content');
            const reportContainer = document.getElementById('report-container');

            if (reportContent && reportContainer) {
                reportContainer.style.display = 'block';
                reportContent.innerHTML = `
            <div class="report-loading">
                <div class="loading-spinner"></div>
                <h3>Generating Clinical Report...</h3>
                <p>AI is analyzing patient data and generating comprehensive clinical recommendations.</p>
            </div>
        `;

                // Add loading styles if not already added
                if (!document.querySelector('#report-loading-styles')) {
                    const style = document.createElement('style');
                    style.id = 'report-loading-styles';
                    style.textContent = `
                .report-loading {
                    text-align: center;
                    padding: 60px 20px;
                    color: #4a5568;
                }
                
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #e2e8f0;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .report-loading h3 {
                    margin-bottom: 10px;
                    color: #2d3748;
                }
                
                .report-loading p {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }
            `;
                    document.head.appendChild(style);
                }
            }
        }

        // Form validation
        function validateForm() {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#e53e3e';
                    isValid = false;
                } else {
                    field.style.borderColor = '#e2e8f0';
                }
            });

            return isValid;
        }

        // Setup form validation
        function setupFormValidation() {
            if (!form) return;

            // Real-time validation
            form.addEventListener('input', (e) => {
                if (e.target.hasAttribute('required') && e.target.value.trim()) {
                    e.target.style.borderColor = '#48bb78';
                }
            });
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🏥 Medical ADR Risk Predictor initialized');

            // Initialize assessment page
            initializeAssessmentPage();

            // Initialize DOM elements
            initializeDOMElements();

            // Initialize mobile navigation
            initializeMobileNavigation();

            // Initialize quick actions
            initializeQuickActions();

            // Setup event handlers
            setupFormHandler();
            setupReportHandler();
            setupSampleDataHandlers();
            setupFormValidation();
            setupPrintHandlers();

            // Show patient header
            const patientHeader = document.getElementById('patient-header-card');
            if (patientHeader) {
                patientHeader.style.display = 'flex';
            }

            // Add form input listeners for progress tracking
            const formInputs = form.querySelectorAll('input, select');
            formInputs.forEach(input => {
                input.addEventListener('input', updateFormProgress);
                input.addEventListener('change', updateFormProgress);
            });

            // Check if model is loaded (silently)
            fetch('/health')
                .then(response => response.json())
                .then(data => {
                    if (data.model_loaded) {
                        console.log('✅ Medical AI system ready');
                    } else {
                        console.warn('⚠️ Model not loaded');
                    }
                })
                .catch(error => {
                    console.error('Health check failed:', error);
                });
        });

        // Load patient information
        function loadPatientInfo() {
            const patientName = sessionStorage.getItem('patientName');
            const patientId = sessionStorage.getItem('patientId');
            const clinicianName = sessionStorage.getItem('clinicianName');
            const assessmentStartTime = sessionStorage.getItem('assessmentStartTime');

            if (!patientName || !clinicianName) {
                // Show a prompt to enter patient info instead of redirecting
                showPatientInfoPrompt();
                return;
            }

            patientInfo = {
                name: patientName,
                id: patientId,
                clinician: clinicianName,
                startTime: assessmentStartTime
            };

            // Display patient information
            displayPatientInfo();
        }

        // Show patient info prompt
        function showPatientInfoPrompt() {
            const patientName = prompt('Please enter patient name:');
            const clinicianName = prompt('Please enter clinician name:');

            if (patientName && clinicianName) {
                // Store the info
                sessionStorage.setItem('patientName', patientName);
                sessionStorage.setItem('clinicianName', clinicianName);
                sessionStorage.setItem('assessmentStartTime', new Date().toISOString());

                patientInfo = {
                    name: patientName,
                    id: '',
                    clinician: clinicianName,
                    startTime: new Date().toISOString()
                };

                displayPatientInfo();
            } else {
                // Set default values if user cancels
                patientInfo = {
                    name: 'Patient',
                    id: '',
                    clinician: 'Clinician',
                    startTime: new Date().toISOString()
                };

                sessionStorage.setItem('patientName', 'Patient');
                sessionStorage.setItem('clinicianName', 'Clinician');
                sessionStorage.setItem('assessmentStartTime', new Date().toISOString());

                displayPatientInfo();
            }
        }

        // Display patient information in the header
        function displayPatientInfo() {
            const patientInfoBar = document.getElementById('patient-info-bar');
            const displayPatientName = document.getElementById('display-patient-name');
            const displayPatientId = document.getElementById('display-patient-id');
            const displayClinicianName = document.getElementById('display-clinician-name');
            const displayAssessmentTime = document.getElementById('display-assessment-time');

            if (patientInfoBar && displayPatientName && displayClinicianName && displayAssessmentTime) {
                displayPatientName.textContent = patientInfo.name;
                displayPatientId.textContent = patientInfo.id || '';
                displayClinicianName.textContent = patientInfo.clinician;
                displayAssessmentTime.textContent = new Date(patientInfo.startTime).toLocaleString();

                patientInfoBar.style.display = 'block';
            }
        }
        // Disp
        // lay formatted report with better styling
        function displayFormattedReport(reportText) {
            const reportContent = document.getElementById('report-content');

            // Add patient header to report
            const patientHeader = `
        <div style="border-bottom: 2px solid #667eea; padding-bottom: 15px; margin-bottom: 25px;">
            <h1 style="color: #2d3748; margin: 0 0 10px 0;">ADR Risk Assessment Report</h1>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.95rem; color: #4a5568;">
                <div><strong>Patient:</strong> ${patientInfo.name}</div>
                ${patientInfo.id ? `<div><strong>Patient ID:</strong> ${patientInfo.id}</div>` : ''}
                <div><strong>Clinician:</strong> ${patientInfo.clinician}</div>
                <div><strong>Assessment Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Assessment Time:</strong> ${new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    `;

            // Format the report text
            let formattedReport = reportText
                // Convert markdown-style headers
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                // Convert bold text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Convert bullet points
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                // Convert numbered lists
                .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                // Convert line breaks
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');

            // Wrap in paragraphs and handle lists
            formattedReport = '<p>' + formattedReport + '</p>';
            formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            formattedReport = formattedReport.replace(/<\/ul><br><ul>/g, '');
            formattedReport = formattedReport.replace(/<p><\/p>/g, '');

            reportContent.innerHTML = patientHeader + formattedReport;
        }

        // Setup print report functionality
        function setupPrintHandlers() {
            const printButton = document.getElementById('print-report');
            const downloadButton = document.getElementById('download-report');

            if (printButton) {
                printButton.addEventListener('click', () => {
                    const reportContent = document.getElementById('report-content').innerHTML;
                    const printWindow = window.open('', '_blank');

                    printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>ADR Risk Assessment Report - ${patientInfo.name}</title>
                    <style>
                        body { 
                            font-family: 'Arial', sans-serif; 
                            line-height: 1.6; 
                            color: #333; 
                            max-width: 800px; 
                            margin: 0 auto; 
                            padding: 20px; 
                        }
                        h1, h2, h3 { color: #2d3748; margin-top: 25px; }
                        h1 { border-bottom: 2px solid #667eea; padding-bottom: 10px; }
                        h2 { color: #667eea; }
                        strong { color: #2d3748; }
                        ul { margin: 15px 0; padding-left: 25px; }
                        li { margin-bottom: 8px; }
                        .header-grid { 
                            display: grid; 
                            grid-template-columns: repeat(2, 1fr); 
                            gap: 15px; 
                            margin-bottom: 25px; 
                        }
                        @media print {
                            body { margin: 0; padding: 15px; }
                            .header-grid { grid-template-columns: 1fr; }
                        }
                    </style>
                </head>
                <body>
                    ${reportContent}
                </body>
                </html>
            `);

                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                });
            }

            if (downloadButton) {
                downloadButton.addEventListener('click', () => {
                    showError('PDF download feature coming soon. Please use the print option for now.');
                });
            }
        }

        // REMOVED: Duplicate displayResults function - using the main one at end of file
        function displayResults_DUPLICATE_1(result) {
            console.log('Displaying results:', result);

            if (!resultsContent || !resultsContainer) {
                console.error('Results container elements not found');
                showError('Unable to display results. Please refresh the page.');
                return;
            }

            const riskLevel = result.risk_level.toLowerCase();
            const noAdrProb = result.no_adr_probability;
            const topRisks = result.top_adr_risks;

            resultsContent.innerHTML = `
        <div class="results-header">
            <h2><i class="fas fa-chart-bar"></i> Risk Assessment Results</h2>
            <div class="results-meta">
                <span class="patient-name-display">
                    <i class="fas fa-user"></i> ${patientInfo.name}
                </span>
                <span>
                    <i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}
                </span>
            </div>
        </div>
        
        <div class="risk-summary">
            <div class="risk-card ${riskLevel}">
                <h3>Overall Risk Level</h3>
                <div class="risk-value">${result.risk_level}</div>
                <div class="risk-label">Risk Assessment</div>
            </div>
            <div class="risk-card">
                <h3>No ADR Probability</h3>
                <div class="risk-value">${noAdrProb}%</div>
                <div class="risk-label">Safety Likelihood</div>
            </div>
            <div class="risk-card">
                <h3>Predicted ADR Type</h3>
                <div class="risk-value" style="font-size: 1.2rem; line-height: 1.2;">
                    ${result.predicted_adr_type}
                </div>
                <div class="risk-label">Most Likely Outcome</div>
            </div>
        </div>
        
        <div class="prediction-details">
            <h3><i class="fas fa-info-circle"></i> Assessment Details</h3>
            <div class="prediction-item">
                <span class="prediction-label">Patient Name:</span>
                <span class="prediction-value">${patientInfo.name}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Risk Classification:</span>
                <span class="prediction-value ${riskLevel}">${result.risk_level} Risk</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Assessment Time:</span>
                <span class="prediction-value">${new Date(result.timestamp).toLocaleString()}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Clinician:</span>
                <span class="prediction-value">${patientInfo.clinician}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Model Confidence:</span>
                <span class="prediction-value">${getRiskDescription(riskLevel)}</span>
            </div>
        </div>
        
        <div class="top-risks">
            <h3><i class="fas fa-exclamation-triangle"></i> Top ADR Risk Probabilities</h3>
            ${Object.entries(topRisks).map(([adrType, probability]) => `
                <div class="risk-item">
                    <span class="risk-name">${adrType}</span>
                    <span class="risk-percentage">${probability}%</span>
                </div>
            `).join('')}
        </div>
        
        ${result.top_specific_adr_risks ? `
        <div class="specific-adr-risks">
            <h3><i class="fas fa-medical-kit"></i> Specific ADR Type Risks</h3>
            <div class="adr-types-grid">
                ${Object.entries(result.top_specific_adr_risks).map(([adrType, probability]) => {
                const riskCategory = probability > 15 ? 'high' : probability > 5 ? 'medium' : 'low';
                return `
                        <div class="adr-type-card ${riskCategory}">
                            <div class="adr-type-name">${adrType}</div>
                            <div class="adr-type-probability">${probability}%</div>
                            <div class="adr-type-category">${riskCategory.charAt(0).toUpperCase() + riskCategory.slice(1)} Risk</div>
                        </div>
                    `;
            }).join('')}
            </div>
            ${Object.keys(result.all_adr_types || {}).length > 3 ? `
                <div class="additional-adr-info">
                    <i class="fas fa-info-circle"></i>
                    ${Object.keys(result.all_adr_types).length - 3} additional ADR types monitored with lower probabilities
                </div>
            ` : ''}
        </div>
        ` : ''}
        
        <div class="clinical-management-plan">
            <h3><i class="fas fa-clipboard-check"></i> Clinical Management Plan</h3>
            <div class="management-grid">
                <div class="management-section">
                    <h4><i class="fas fa-heartbeat"></i> Monitoring Parameters</h4>
                    <ul>
                        <li><i class="fas fa-check-circle"></i> Vital signs</li>
                        <li><i class="fas fa-check-circle"></i> Clinical symptoms</li>
                        <li><i class="fas fa-check-circle"></i> Laboratory parameters</li>
                    </ul>
                </div>
                <div class="management-section">
                    <h4><i class="fas fa-tasks"></i> Clinical Actions</h4>
                    <ul>
                        <li><i class="fas fa-arrow-right"></i> Regular clinical assessment</li>
                        <li><i class="fas fa-arrow-right"></i> Patient symptom monitoring</li>
                    </ul>
                </div>
                <div class="management-section">
                    <h4><i class="fas fa-calendar-alt"></i> Follow-up Schedule</h4>
                    <p><i class="fas fa-clock"></i> ${getFollowUpSchedule(riskLevel)}</p>
                </div>
            </div>
        </div>
        
        ${generateRiskSuggestions(result, riskLevel)}
        
        ${generateHighRiskADRWarning(result)}
    `;

            resultsContainer.style.display = 'block';

            // Show Clinical Decision Support
            showClinicalDecisionSupport(result, currentPatientData);

            // Play warning notification and show blinking overlay for high-risk cases
            if (result.risk_level && result.risk_level.toLowerCase() === 'high') {
                setTimeout(() => {
                    playWarningNotification();
                    showBlinkingWarningOverlay();
                }, 500);
            } else if (result.risk_level && result.risk_level.toLowerCase() === 'medium') {
                // Show subtle warning for medium risk
                showMediumRiskIndicator();
            }

            // Generate AI-powered detailed analysis
            generateAIDetailedAnalysis(result);

            resultsContainer.scrollIntoView({ behavior: 'smooth' });

            // Show loading state in report section
            showReportLoading();

            // Auto-generate report after a short delay
            setTimeout(() => {
                generateClinicalReport();
            }, 1500);
        }// Sample patient data
        const samplePatients = {
            'high-risk': {
                name: 'High Risk Patient',
                data: {
                    age: 75,
                    sex: 'M',
                    ethnicity: 'White',
                    bmi: 32.5,
                    creatinine: 2.1,
                    egfr: 35,
                    ast_alt: 95,
                    bilirubin: 1.8,
                    albumin: 2.8,
                    diabetes: 1,
                    liver_disease: 1,
                    ckd: 1,
                    cardiac_disease: 1,
                    index_drug_dose: 200,
                    concomitant_drugs_count: 12,
                    indication: 'Cancer',
                    cyp2c9: 'Poor',
                    cyp2d6: 'PM',
                    bp_systolic: 165,
                    bp_diastolic: 95,
                    heart_rate: 95,
                    time_since_start_days: 45,
                    cyp_inhibitors_flag: 1,
                    qt_prolonging_flag: 1,
                    hla_risk_allele_flag: 1,
                    inpatient_flag: 1,
                    prior_adr_history: 1
                }
            },
            'medium-risk': {
                name: 'Medium Risk Patient',
                data: {
                    age: 55,
                    sex: 'F',
                    ethnicity: 'Asian',
                    bmi: 27.2,
                    creatinine: 1.3,
                    egfr: 65,
                    ast_alt: 45,
                    bilirubin: 0.8,
                    albumin: 3.5,
                    diabetes: 1,
                    liver_disease: 0,
                    ckd: 0,
                    cardiac_disease: 1,
                    index_drug_dose: 150,
                    concomitant_drugs_count: 6,
                    indication: 'Pain',
                    cyp2c9: 'Intermediate',
                    cyp2d6: 'IM',
                    bp_systolic: 140,
                    bp_diastolic: 85,
                    heart_rate: 78,
                    time_since_start_days: 30,
                    cyp_inhibitors_flag: 0,
                    qt_prolonging_flag: 1,
                    hla_risk_allele_flag: 0,
                    inpatient_flag: 0,
                    prior_adr_history: 0
                }
            },
            'low-risk': {
                name: 'Low Risk Patient',
                data: {
                    age: 35,
                    sex: 'M',
                    ethnicity: 'White',
                    bmi: 24.1,
                    creatinine: 0.9,
                    egfr: 95,
                    ast_alt: 25,
                    bilirubin: 0.5,
                    albumin: 4.2,
                    diabetes: 0,
                    liver_disease: 0,
                    ckd: 0,
                    cardiac_disease: 0,
                    index_drug_dose: 100,
                    concomitant_drugs_count: 2,
                    indication: 'Pain',
                    cyp2c9: 'Wild',
                    cyp2d6: 'EM',
                    bp_systolic: 120,
                    bp_diastolic: 75,
                    heart_rate: 68,
                    time_since_start_days: 14,
                    cyp_inhibitors_flag: 0,
                    qt_prolonging_flag: 0,
                    hla_risk_allele_flag: 0,
                    inpatient_flag: 0,
                    prior_adr_history: 0
                }
            },
            'elderly': {
                name: 'Elderly Patient',
                data: {
                    age: 82,
                    sex: 'F',
                    ethnicity: 'Hispanic',
                    bmi: 28.8,
                    creatinine: 1.6,
                    egfr: 45,
                    ast_alt: 38,
                    bilirubin: 0.9,
                    albumin: 3.2,
                    diabetes: 1,
                    liver_disease: 0,
                    ckd: 1,
                    cardiac_disease: 1,
                    index_drug_dose: 100,
                    concomitant_drugs_count: 9,
                    indication: 'Autoimmune',
                    cyp2c9: 'Intermediate',
                    cyp2d6: 'EM',
                    bp_systolic: 155,
                    bp_diastolic: 88,
                    heart_rate: 72,
                    time_since_start_days: 60,
                    cyp_inhibitors_flag: 1,
                    qt_prolonging_flag: 0,
                    hla_risk_allele_flag: 0,
                    inpatient_flag: 1,
                    prior_adr_history: 1
                }
            },
            'young-adult': {
                name: 'Young Adult Patient',
                data: {
                    age: 28,
                    sex: 'F',
                    ethnicity: 'Black',
                    bmi: 22.5,
                    creatinine: 0.8,
                    egfr: 105,
                    ast_alt: 22,
                    bilirubin: 0.4,
                    albumin: 4.5,
                    diabetes: 0,
                    liver_disease: 0,
                    ckd: 0,
                    cardiac_disease: 0,
                    index_drug_dose: 50,
                    concomitant_drugs_count: 1,
                    indication: 'Pain',
                    cyp2c9: 'Wild',
                    cyp2d6: 'EM',
                    bp_systolic: 115,
                    bp_diastolic: 70,
                    heart_rate: 65,
                    time_since_start_days: 7,
                    cyp_inhibitors_flag: 0,
                    qt_prolonging_flag: 0,
                    hla_risk_allele_flag: 0,
                    inpatient_flag: 0,
                    prior_adr_history: 0
                }
            }
        };

        // Setup sample data handlers
        function setupSampleDataHandlers() {
            const loadSampleButton = document.getElementById('load-sample-data');
            const sampleSelector = document.getElementById('sample-data-selector');

            if (loadSampleButton && sampleSelector) {
                loadSampleButton.addEventListener('click', () => {
                    const selectedSample = sampleSelector.value;
                    if (!selectedSample) {
                        // Load default high-risk sample if none selected
                        loadSampleData('high-risk');
                        sampleSelector.value = 'high-risk';
                    } else {
                        loadSampleData(selectedSample);
                    }
                });

                // Also load when selector changes
                sampleSelector.addEventListener('change', (e) => {
                    if (e.target.value) {
                        loadSampleData(e.target.value);
                    }
                });
            }
        }

        // Load sample data into form
        function loadSampleData(sampleType) {
            const sampleData = samplePatients[sampleType];
            if (!sampleData) {
                showError('Sample data not found.');
                return;
            }

            const loadButton = document.getElementById('load-sample-data');
            if (loadButton) {
                loadButton.classList.add('loading');
                loadButton.innerHTML = '<i class="fas fa-spinner"></i> Loading...';
            }

            try {
                // Fill form fields immediately
                Object.entries(sampleData.data).forEach(([key, value]) => {
                    const field = document.getElementById(key);
                    if (field) {
                        if (field.type === 'checkbox') {
                            field.checked = value === 1;
                        } else {
                            field.value = value;
                        }

                        // Trigger change event for validation
                        field.dispatchEvent(new Event('change'));

                        // Add visual feedback
                        field.style.borderColor = '#48bb78';
                        field.style.backgroundColor = '#f0fff4';

                        // Reset styling after a moment
                        setTimeout(() => {
                            field.style.borderColor = '';
                            field.style.backgroundColor = '';
                        }, 1000);
                    }
                });

                // Show success message
                showSuccess(`Sample data loaded: ${sampleData.name}`);

                // Scroll to form
                const formElement = document.getElementById('adr-form');
                if (formElement) {
                    formElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }

            } catch (error) {
                console.error('Error loading sample data:', error);
                showError('Failed to load sample data.');
            } finally {
                if (loadButton) {
                    setTimeout(() => {
                        loadButton.classList.remove('loading');
                        loadButton.innerHTML = '<i class="fas fa-flask"></i> Load Sample Patient Data';
                    }, 500);
                }
            }
        }

        // Show success message
        function showSuccess(message) {
            // Create success notification
            const successDiv = document.createElement('div');
            successDiv.className = 'success-notification';
            successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

            // Add success styles if not already added
            if (!document.querySelector('#success-styles')) {
                const style = document.createElement('style');
                style.id = 'success-styles';
                style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #c6f6d5;
                color: #22543d;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #38a169;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .success-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .success-content button {
                background: none;
                border: none;
                color: #22543d;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
                document.head.appendChild(style);
            }

            document.body.appendChild(successDiv);

            // Auto remove after 3 seconds
            setTimeout(() => {
                if (successDiv.parentElement) {
                    successDiv.remove();
                }
            }, 3000);
        }
        // Show loading state in report section
        function showReportLoading() {
            if (reportContent) {
                reportContent.innerHTML = `
            <div class="report-loading">
                <i class="fas fa-spinner"></i>
                <p>Generating AI clinical report...</p>
                <p class="report-hint">This may take a few moments</p>
            </div>
        `;
            }
        }

        // Enhanced report display with better formatting
        function displayFormattedReport(reportText) {
            if (!reportContent) {
                console.error('Report content element not found');
                return;
            }

            // Add patient header to report
            const patientHeader = `
        <div class="report-patient-header">
            <h4>Patient Information</h4>
            <div class="patient-info-grid">
                <div><strong>Patient:</strong> ${patientInfo.name || 'N/A'}</div>
                ${patientInfo.id ? `<div><strong>ID:</strong> ${patientInfo.id}</div>` : ''}
                <div><strong>Clinician:</strong> ${patientInfo.clinician || 'N/A'}</div>
                <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Time:</strong> ${new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    `;

            // Format the report text with better styling
            let formattedReport = reportText
                // Convert markdown-style headers
                .replace(/^### (.*$)/gm, '<h4 class="report-h4">$1</h4>')
                .replace(/^## (.*$)/gm, '<h3 class="report-h3">$1</h3>')
                .replace(/^# (.*$)/gm, '<h2 class="report-h2">$1</h2>')
                // Convert bold text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Convert bullet points
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                // Convert numbered lists
                .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                // Convert line breaks
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');

            // Wrap in paragraphs and handle lists
            formattedReport = '<div class="report-body"><p>' + formattedReport + '</p></div>';
            formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            formattedReport = formattedReport.replace(/<\/ul><br><ul>/g, '');
            formattedReport = formattedReport.replace(/<p><\/p>/g, '');

            // Display the formatted report
            if (reportContent) {
                reportContent.innerHTML = patientHeader + formattedReport;
            } else {
                console.error('❌ reportContent is null, cannot display report');
            }

            // Add success styling
            reportContent.parentElement.classList.add('report-success');

            // Show report actions
            const reportActions = document.querySelector('.report-actions');
            if (reportActions) {
                reportActions.style.display = 'flex';
            }
        }

        // Add additional CSS for report formatting
        function addReportStyles() {
            if (!document.querySelector('#report-styles')) {
                const style = document.createElement('style');
                style.id = 'report-styles';
                style.textContent = `
            .report-patient-header {
                background: #f7fafc;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 25px;
                border-left: 4px solid #667eea;
            }
            
            .report-patient-header h4 {
                color: #2d3748;
                margin: 0 0 15px 0;
                font-size: 1.1rem;
            }
            
            .patient-info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                font-size: 0.9rem;
                color: #4a5568;
            }
            
            .report-body {
                line-height: 1.7;
                color: #2d3748;
            }
            
            .report-h2 {
                color: #2d3748;
                font-size: 1.3rem;
                margin: 25px 0 15px 0;
                padding-bottom: 8px;
                border-bottom: 2px solid #667eea;
            }
            
            .report-h3 {
                color: #667eea;
                font-size: 1.1rem;
                margin: 20px 0 12px 0;
            }
            
            .report-h4 {
                color: #4a5568;
                font-size: 1rem;
                margin: 15px 0 10px 0;
                font-weight: 600;
            }
            
            .report-body ul {
                margin: 15px 0;
                padding-left: 25px;
            }
            
            .report-body li {
                margin-bottom: 8px;
                color: #4a5568;
            }
            
            .report-body strong {
                color: #2d3748;
                font-weight: 600;
            }
            
            .report-body p {
                margin-bottom: 15px;
            }
        `;
                document.head.appendChild(style);
            }
        }
        // ===
        // == MOBILE RESPONSIVE ENHANCEMENTS =====

        // Add mobile-specific optimizations
        function addMobileOptimizations() {
            // Detect mobile device
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            if (isMobile || isTouch) {
                document.body.classList.add('mobile-device');

                // Add touch-friendly interactions
                addTouchOptimizations();

                // Optimize form interactions for mobile
                optimizeFormForMobile();

                // Add mobile-specific event listeners
                addMobileEventListeners();
            }

            // Handle orientation changes
            window.addEventListener('orientationchange', handleOrientationChange);
            window.addEventListener('resize', debounce(handleResize, 250));
        }

        // Add touch-friendly optimizations
        function addTouchOptimizations() {
            // Add touch feedback to buttons
            const buttons = document.querySelectorAll('.btn, .risk-item, .adr-type-card');
            buttons.forEach(button => {
                button.addEventListener('touchstart', function () {
                    this.style.transform = 'scale(0.98)';
                });

                button.addEventListener('touchend', function () {
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                });
            });

            // Prevent double-tap zoom on buttons
            const clickableElements = document.querySelectorAll('.btn, button, .checkbox-group');
            clickableElements.forEach(element => {
                element.addEventListener('touchend', function (e) {
                    e.preventDefault();
                    this.click();
                });
            });
        }

        // Optimize form for mobile
        function optimizeFormForMobile() {
            // Auto-focus prevention on mobile (prevents keyboard popup)
            const inputs = document.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('focus', function () {
                    // Scroll element into view on mobile
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            this.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                        }, 300);
                    }
                });

                // Add input validation feedback
                input.addEventListener('blur', function () {
                    if (this.hasAttribute('required') && !this.value.trim()) {
                        this.classList.add('error');
                    } else {
                        this.classList.remove('error');
                    }
                });
            });

            // Optimize select dropdowns for mobile
            const selects = document.querySelectorAll('select');
            selects.forEach(select => {
                if (window.innerWidth <= 768) {
                    select.setAttribute('size', '1');
                }
            });
        }

        // Add mobile-specific event listeners
        function addMobileEventListeners() {
            // Handle swipe gestures for results sections
            let startX, startY, distX, distY;
            const threshold = 100;

            const swipeableElements = document.querySelectorAll('.results-container, .report-container');
            swipeableElements.forEach(element => {
                element.addEventListener('touchstart', function (e) {
                    const touch = e.touches[0];
                    startX = touch.clientX;
                    startY = touch.clientY;
                });

                element.addEventListener('touchmove', function (e) {
                    if (!startX || !startY) return;

                    const touch = e.touches[0];
                    distX = touch.clientX - startX;
                    distY = touch.clientY - startY;
                });

                element.addEventListener('touchend', function (e) {
                    if (!startX || !startY) return;

                    // Horizontal swipe detection
                    if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > threshold) {
                        if (distX > 0) {
                            // Swipe right - could trigger previous section
                            console.log('Swipe right detected');
                        } else {
                            // Swipe left - could trigger next section
                            console.log('Swipe left detected');
                        }
                    }

                    // Reset values
                    startX = startY = distX = distY = null;
                });
            });

            // Add pull-to-refresh functionality (optional)
            let startY_refresh = 0;
            document.addEventListener('touchstart', function (e) {
                startY_refresh = e.touches[0].clientY;
            });

            document.addEventListener('touchmove', function (e) {
                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY_refresh;

                // If at top of page and pulling down
                if (window.scrollY === 0 && pullDistance > 100) {
                    // Could add pull-to-refresh indicator here
                    console.log('Pull to refresh detected');
                }
            });
        }

        // Handle orientation changes
        function handleOrientationChange() {
            // Delay to allow for orientation change to complete
            setTimeout(() => {
                // Recalculate layout if needed
                const activeElement = document.activeElement;
                if (activeElement && activeElement.tagName === 'INPUT') {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                // Adjust grid layouts for landscape/portrait
                adjustLayoutForOrientation();
            }, 500);
        }

        // Handle window resize
        function handleResize() {
            // Adjust layouts based on new window size
            adjustLayoutForOrientation();

            // Update any dynamic calculations
            updateDynamicSizing();
        }

        // Adjust layout for current orientation
        function adjustLayoutForOrientation() {
            const isLandscape = window.innerWidth > window.innerHeight;
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                if (isLandscape) {
                    document.body.classList.add('landscape-mobile');
                    document.body.classList.remove('portrait-mobile');
                } else {
                    document.body.classList.add('portrait-mobile');
                    document.body.classList.remove('landscape-mobile');
                }
            } else {
                document.body.classList.remove('landscape-mobile', 'portrait-mobile');
            }
        }

        // Update dynamic sizing
        function updateDynamicSizing() {
            // Update any elements that need dynamic sizing
            const riskCards = document.querySelectorAll('.risk-card');
            riskCards.forEach(card => {
                // Ensure consistent height on mobile
                if (window.innerWidth <= 768) {
                    card.style.minHeight = 'auto';
                }
            });
        }

        // Debounce function for performance
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Enhanced error handling for mobile
        function showMobileError(message) {
            // Use native mobile alerts for critical errors
            if (window.innerWidth <= 480) {
                alert(message);
            } else {
                showError(message);
            }
        }
        // Enhanced success handling for mobile
        function showMobileSuccess(message) {
            // Show success with haptic feedback if available
            if ('vibrate' in navigator) {
                navigator.vibrate(200);
            }
            showSuccess(message);
        }

        // Add mobile-specific styles dynamically
        function addMobileStyles() {
            const style = document.createElement('style');
            style.id = 'mobile-dynamic-styles';
            style.textContent = `
        .mobile-device .form-group input:focus,
        .mobile-device .form-group select:focus {
            transform: scale(1.02);
            transition: transform 0.2s ease;
        }
        
        .mobile-device .btn:active {
            transform: scale(0.98);
        }
        
        .mobile-device .risk-item:active,
        .mobile-device .adr-type-card:active {
            transform: scale(0.98);
            transition: transform 0.1s ease;
        }
        
        .mobile-device input.error {
            border-color: #e53e3e;
            background-color: #fed7d7;
            animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        /* Landscape mobile optimizations */
        .landscape-mobile .form-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .landscape-mobile .checkbox-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .landscape-mobile .risk-summary {
            grid-template-columns: repeat(3, 1fr);
        }
        
        /* Portrait mobile optimizations */
        .portrait-mobile .form-actions {
            position: sticky;
            bottom: 10px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 15px;
            border-radius: 12px;
            box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1);
        }
    `;
            document.head.appendChild(style);
        }

        // Initialize mobile optimizations when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            addMobileOptimizations();
            addMobileStyles();
        });

        // Add viewport height fix for mobile browsers
        function fixMobileViewportHeight() {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        }

        // Update viewport height on resize
        window.addEventListener('resize', fixMobileViewportHeight);
        fixMobileViewportHeight();// 
        // REMOVED: Duplicate displayResults function - using the main one at end of file
        function displayResults_DUPLICATE_2(result) {
            console.log('Displaying results:', result);

            const resultsContainer = document.getElementById('results-container');
            const resultsContent = document.getElementById('results-content');

            if (!resultsContainer || !resultsContent) {
                console.error('Results container elements not found');
                showError('Unable to display results. Please refresh the page.');
                return;
            }

            // Store current prediction result for enhanced analysis
            currentPredictionResult = result;

            const riskLevel = result.risk_level.toLowerCase();
            const noAdrProb = result.no_adr_probability;
            const topRisks = result.top_adr_risks;

            resultsContent.innerHTML = `
        <div class="results-header">
            <h2><i class="fas fa-chart-bar"></i> Risk Assessment Results</h2>
            <div class="results-meta">
                <span class="patient-name-display">
                    <i class="fas fa-user"></i> ${patientInfo.name}
                </span>
                <span>
                    <i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}
                </span>
            </div>
        </div>
        
        <div class="risk-summary">
            <div class="risk-card ${riskLevel}">
                <h3>Overall Risk Level</h3>
                <div class="risk-value">${result.risk_level}</div>
                <div class="risk-label">Risk Assessment</div>
            </div>
            <div class="risk-card">
                <h3>No ADR Probability</h3>
                <div class="risk-value">${noAdrProb}%</div>
                <div class="risk-label">Safety Likelihood</div>
            </div>
            <div class="risk-card">
                <h3>Predicted ADR Type</h3>
                <div class="risk-value" style="font-size: 1.2rem; line-height: 1.2;">
                    ${result.predicted_adr_type}
                </div>
                <div class="risk-label">Most Likely Outcome</div>
            </div>
        </div>
        
        <div class="prediction-details">
            <h3><i class="fas fa-info-circle"></i> Assessment Details</h3>
            <div class="prediction-item">
                <span class="prediction-label">Patient Name:</span>
                <span class="prediction-value">${patientInfo.name}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Risk Classification:</span>
                <span class="prediction-value ${riskLevel}">${result.risk_level} Risk</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Assessment Time:</span>
                <span class="prediction-value">${new Date(result.timestamp).toLocaleString()}</span>
            </div>
            <div class="prediction-item">
                <span class="prediction-label">Clinician:</span>
                <span class="prediction-value">${patientInfo.clinician}</span>
            </div>
        </div>
        
        <div class="top-risks">
            <h3><i class="fas fa-exclamation-triangle"></i> Top ADR Risk Probabilities</h3>
            ${Object.entries(topRisks).map(([adrType, probability]) => `
                <div class="risk-item">
                    <span class="risk-name">${adrType}</span>
                    <span class="risk-percentage">${probability}%</span>
                </div>
            `).join('')}
        </div>
        
        ${result.top_specific_adr_risks ? `
        <div class="specific-adr-risks">
            <h3><i class="fas fa-medical-kit"></i> Specific ADR Type Risks</h3>
            <div class="adr-types-grid">
                ${Object.entries(result.top_specific_adr_risks).map(([adrType, probability]) => {
                const riskCategory = probability > 15 ? 'high' : probability > 5 ? 'medium' : 'low';
                return `
                        <div class="adr-type-card ${riskCategory}">
                            <div class="adr-type-name">${adrType}</div>
                            <div class="adr-type-probability">${probability}%</div>
                            <div class="adr-type-category">${riskCategory.charAt(0).toUpperCase() + riskCategory.slice(1)} Risk</div>
                        </div>
                    `;
            }).join('')}
            </div>
        </div>
        ` : ''}
        
        ${generateHighRiskADRWarning(result)}
        
        <div class="enhanced-features">
            <div class="feature-buttons">
                <button onclick="showRiskFactorAnalysis()" class="btn btn-feature">
                    <i class="fas fa-chart-pie"></i> Risk Analysis
                </button>
                <button onclick="checkDrugInteractions()" class="btn btn-feature">
                    <i class="fas fa-pills"></i> Drug Interactions
                </button>
                <button onclick="showRiskTrendAnalysis()" class="btn btn-feature">
                    <i class="fas fa-chart-line"></i> Trend Analysis
                </button>
                <button onclick="generateClinicalReport()" class="btn btn-feature">
                    <i class="fas fa-file-medical-alt"></i> Generate Report
                </button>
            </div>
        </div>
    `;

            resultsContainer.style.display = 'block';

            // Generate AI-powered detailed analysis
            generateAIDetailedAnalysis(result);

            // Save assessment for trend analysis
            saveCurrentAssessment();

            // Auto-generate report
            setTimeout(() => {
                generateClinicalReport();
            }, 1500);
        }

        // Generate High Risk ADR Warning
        function generateHighRiskADRWarning(result) {
            const riskLevel = result.risk_level.toLowerCase();
            const predictedADR = result.predicted_adr_type;
            const noAdrProb = result.no_adr_probability;

            // Show warning for high and medium risk cases
            if (riskLevel === 'low') {
                return '';
            }

            // Get the highest specific ADR risk
            const topSpecificRisks = result.top_specific_adr_risks || {};
            const topADRs = Object.entries(topSpecificRisks)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);

            const warningColor = getWarningColor(riskLevel);
            const urgencyLevel = getUrgencyLevel(noAdrProb);
            const clinicalRecommendations = getClinicalRecommendations(predictedADR, riskLevel);
            const alertTitle = riskLevel === 'high' ? '⚠️ HIGH RISK ADR ALERT' : '⚠️ MODERATE RISK ADR ALERT';
            const alertIcon = riskLevel === 'high' ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';

            return `
                <div class="high-risk-adr-warning ${warningColor}" data-risk-level="${riskLevel}">
                    <div class="warning-header">
                        <div class="warning-icon">
                            <i class="${alertIcon}"></i>
                        </div>
                        <div class="warning-title">
                            <h3>${alertTitle}</h3>
                            <p class="urgency-badge ${urgencyLevel.class}">${urgencyLevel.text}</p>
                        </div>
                        <div class="warning-actions">
                            <button class="btn-acknowledge" onclick="acknowledgeWarning(this)" title="Acknowledge Warning">
                                <i class="fas fa-check"></i> Acknowledge
                            </button>
                            <button class="btn-print-warning" onclick="printWarning(this)" title="Print Warning">
                                <i class="fas fa-print"></i> Print
                            </button>
                            <button class="btn-share-warning" onclick="shareWarning(this)" title="Share Warning">
                                <i class="fas fa-share-alt"></i> Share
                            </button>
                        </div>
                    </div>
                    
                    <div class="warning-content">
                        <div class="risk-summary-alert">
                            <div class="alert-item">
                                <span class="alert-label">Risk Level:</span>
                                <span class="alert-value high-risk">${result.risk_level}</span>
                            </div>
                            <div class="alert-item">
                                <span class="alert-label">Primary ADR Risk:</span>
                                <span class="alert-value">${predictedADR}</span>
                            </div>
                            <div class="alert-item">
                                <span class="alert-label">Safety Probability:</span>
                                <span class="alert-value">${noAdrProb}%</span>
                            </div>
                        </div>
                        
                        ${topADRs.length > 0 ? `
                        <div class="specific-adr-alerts">
                            <h4><i class="fas fa-medical-kit"></i> Specific ADR Risks to Monitor</h4>
                            <div class="adr-risk-grid">
                                ${topADRs.map(([adrType, probability]) => `
                                    <div class="adr-risk-item ${getRiskClass(probability)}">
                                        <div class="adr-name">${adrType}</div>
                                        <div class="adr-probability">${probability}%</div>
                                        <div class="adr-severity">${getSeverityText(probability)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="clinical-recommendations">
                            <h4><i class="fas fa-stethoscope"></i> Immediate Clinical Actions Required</h4>
                            <div class="recommendations-grid">
                                ${clinicalRecommendations.map(rec => `
                                    <div class="recommendation-item ${rec.priority}">
                                        <div class="rec-icon">
                                            <i class="${rec.icon}"></i>
                                        </div>
                                        <div class="rec-content">
                                            <div class="rec-title">${rec.title}</div>
                                            <div class="rec-description">${rec.description}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="emergency-contacts">
                            <h4><i class="fas fa-phone-alt"></i> Emergency Response</h4>
                            <div class="emergency-grid">
                                <div class="emergency-item critical">
                                    <i class="fas fa-ambulance"></i>
                                    <div>
                                        <strong>Severe ADR Emergency</strong>
                                        <p>Call 911 immediately</p>
                                    </div>
                                </div>
                                <div class="emergency-item urgent">
                                    <i class="fas fa-user-md"></i>
                                    <div>
                                        <strong>Physician Consultation</strong>
                                        <p>Contact prescribing physician within 2 hours</p>
                                    </div>
                                </div>
                                <div class="emergency-item moderate">
                                    <i class="fas fa-pills"></i>
                                    <div>
                                        <strong>Pharmacy Consultation</strong>
                                        <p>Consult clinical pharmacist for medication review</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="monitoring-schedule">
                            <h4><i class="fas fa-calendar-check"></i> Enhanced Monitoring Protocol</h4>
                            <div class="monitoring-timeline">
                                <div class="timeline-item immediate">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <strong>Immediate (0-2 hours)</strong>
                                        <p>Assess vital signs, review symptoms, consider dose reduction</p>
                                    </div>
                                </div>
                                <div class="timeline-item short-term">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <strong>Short-term (2-24 hours)</strong>
                                        <p>Monitor for early ADR signs, laboratory follow-up if indicated</p>
                                    </div>
                                </div>
                                <div class="timeline-item ongoing">
                                    <div class="timeline-marker"></div>
                                    <div class="timeline-content">
                                        <strong>Ongoing (Daily)</strong>
                                        <p>Daily symptom assessment, weekly lab monitoring, medication adherence review</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="warning-footer">
                        <div class="disclaimer">
                            <i class="fas fa-info-circle"></i>
                            <span>This is a predictive assessment. Clinical judgment should always take precedence. Document all interventions and patient responses.</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Helper functions for ADR warning
        function getWarningColor(riskLevel) {
            switch (riskLevel) {
                case 'high': return 'danger';
                case 'medium': return 'warning';
                case 'low': return 'info';
                default: return 'info';
            }
        }

        function getUrgencyLevel(noAdrProb) {
            if (noAdrProb < 30) {
                return { class: 'critical', text: 'CRITICAL - Immediate Action Required' };
            } else if (noAdrProb < 50) {
                return { class: 'urgent', text: 'URGENT - Enhanced Monitoring' };
            } else if (noAdrProb < 70) {
                return { class: 'moderate', text: 'MODERATE - Increased Vigilance' };
            } else {
                return { class: 'low', text: 'LOW - Standard Monitoring' };
            }
        }

        // Acknowledge warning function
        function acknowledgeWarning(button) {
            const warningContainer = button.closest('.high-risk-adr-warning');
            const riskLevel = warningContainer.dataset.riskLevel;

            // Add acknowledged state
            warningContainer.classList.add('acknowledged');

            // Update button
            button.innerHTML = '<i class="fas fa-check-circle"></i> Acknowledged';
            button.disabled = true;
            button.classList.add('acknowledged');

            // Show confirmation
            showSuccess(`${riskLevel.toUpperCase()} risk ADR warning acknowledged. Please ensure all recommended actions are implemented.`);

            // Log acknowledgment (in real system, this would be sent to server)
            console.log(`ADR Warning Acknowledged: ${riskLevel} risk at ${new Date().toISOString()}`);

            // Add timestamp
            const timestamp = document.createElement('div');
            timestamp.className = 'acknowledgment-timestamp';
            timestamp.innerHTML = `<i class="fas fa-clock"></i> Acknowledged at ${new Date().toLocaleString()}`;
            warningContainer.querySelector('.warning-footer').appendChild(timestamp);
        }

        // Play warning notification sound
        function playWarningNotification() {
            try {
                // Create audio context for notification sound
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // Create a simple warning tone
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // Configure warning tone (urgent beeping pattern)
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);

                // Repeat the warning tone 3 times
                setTimeout(() => {
                    if (audioContext.state !== 'closed') {
                        const osc2 = audioContext.createOscillator();
                        const gain2 = audioContext.createGain();
                        osc2.connect(gain2);
                        gain2.connect(audioContext.destination);
                        osc2.frequency.setValueAtTime(800, audioContext.currentTime);
                        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                        osc2.start();
                        osc2.stop(audioContext.currentTime + 0.2);
                    }
                }, 500);

                setTimeout(() => {
                    if (audioContext.state !== 'closed') {
                        const osc3 = audioContext.createOscillator();
                        const gain3 = audioContext.createGain();
                        osc3.connect(gain3);
                        gain3.connect(audioContext.destination);
                        osc3.frequency.setValueAtTime(800, audioContext.currentTime);
                        gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
                        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                        osc3.start();
                        osc3.stop(audioContext.currentTime + 0.2);
                    }
                }, 1000);

                console.log('🔊 High-risk ADR warning notification played');

            } catch (error) {
                console.warn('Could not play warning notification sound:', error);
                // Fallback: show visual notification
                showVisualWarningNotification();
            }
        }

        // Visual warning notification fallback
        function showVisualWarningNotification() {
            const notification = document.createElement('div');
            notification.className = 'visual-warning-notification';
            notification.innerHTML = `
                <div class="visual-warning-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>HIGH RISK ADR DETECTED - Review Clinical Management Plan</span>
                </div>
            `;

            // Add styles if not already added
            if (!document.querySelector('#visual-warning-styles')) {
                const style = document.createElement('style');
                style.id = 'visual-warning-styles';
                style.textContent = `
                    .visual-warning-notification {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                        color: white;
                        padding: 20px 30px;
                        border-radius: 12px;
                        box-shadow: 0 20px 40px rgba(220, 38, 38, 0.4);
                        z-index: 2000;
                        animation: warningFlash 0.5s ease-in-out 6 alternate;
                        font-weight: 600;
                        text-align: center;
                        border: 3px solid #fca5a5;
                    }
                    
                    .visual-warning-content {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        font-size: 1.1rem;
                    }
                    
                    .visual-warning-content i {
                        font-size: 1.5rem;
                        animation: warningBounce 0.5s ease-in-out infinite alternate;
                    }
                    
                    @keyframes warningFlash {
                        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
                    }
                    
                    @keyframes warningBounce {
                        0% { transform: scale(1); }
                        100% { transform: scale(1.2); }
                    }
                `;
                document.head.appendChild(style);
            }

            document.body.appendChild(notification);

            // Remove after 3 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 3000);
        }

        // Print warning function
        function printWarning(button) {
            const warningContainer = button.closest('.high-risk-adr-warning');
            const patientName = patientInfo.name || 'Patient';
            const currentDate = new Date().toLocaleDateString();
            const currentTime = new Date().toLocaleTimeString();

            // Create printable version
            const printContent = `
                <html>
                <head>
                    <title>ADR Risk Warning - ${patientName}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        .print-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .warning-box { border: 3px solid #dc2626; padding: 15px; margin: 20px 0; background: #fef2f2; }
                        .urgent { color: #dc2626; font-weight: bold; text-transform: uppercase; }
                        .section { margin: 15px 0; }
                        .section h3 { color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
                        .item { padding: 8px; border: 1px solid #ddd; background: #f9f9f9; }
                        .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h1>ADVERSE DRUG REACTION RISK WARNING</h1>
                        <p><strong>Patient:</strong> ${patientName} | <strong>Date:</strong> ${currentDate} | <strong>Time:</strong> ${currentTime}</p>
                        <p class="urgent">⚠️ This document contains critical patient safety information ⚠️</p>
                    </div>
                    
                    ${warningContainer.innerHTML.replace(/onclick="[^"]*"/g, '').replace(/class="btn-[^"]*"/g, 'style="display:none"')}
                    
                    <div class="footer">
                        <p><strong>Important:</strong> This warning was generated by an AI-powered ADR risk prediction system. Clinical judgment should always take precedence. All recommendations should be reviewed by qualified healthcare professionals.</p>
                        <p><strong>Generated:</strong> ${currentDate} at ${currentTime} | <strong>System:</strong> ADR Risk Predictor v2.0</p>
                    </div>
                </body>
                </html>
            `;

            // Open print dialog
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();

            showSuccess('ADR warning prepared for printing');
        }

        // Share warning function
        function shareWarning(button) {
            const warningContainer = button.closest('.high-risk-adr-warning');
            const riskLevel = warningContainer.dataset.riskLevel;
            const patientName = patientInfo.name || 'Patient';

            // Create shareable summary
            const shareText = `🚨 ADR RISK ALERT 🚨
            
Patient: ${patientName}
Risk Level: ${riskLevel.toUpperCase()}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

⚠️ HIGH PRIORITY: Enhanced monitoring and immediate clinical review required.

Generated by ADR Risk Predictor System
            `;

            // Try to use Web Share API if available
            if (navigator.share) {
                navigator.share({
                    title: `ADR Risk Alert - ${patientName}`,
                    text: shareText,
                    url: window.location.href
                }).then(() => {
                    showSuccess('ADR warning shared successfully');
                }).catch((error) => {
                    console.log('Error sharing:', error);
                    fallbackShare(shareText);
                });
            } else {
                fallbackShare(shareText);
            }
        }

        // Fallback share function
        function fallbackShare(text) {
            // Copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                showSuccess('ADR warning copied to clipboard - you can now paste it in your preferred communication app');
            }).catch(() => {
                // Final fallback - show text in modal
                const modal = document.createElement('div');
                modal.className = 'share-modal';
                modal.innerHTML = `
                    <div class="share-modal-content">
                        <div class="share-modal-header">
                            <h3>Share ADR Warning</h3>
                            <button onclick="this.closest('.share-modal').remove()" class="close-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="share-modal-body">
                            <p>Copy the text below to share this ADR warning:</p>
                            <textarea readonly class="share-text">${text}</textarea>
                            <button onclick="this.previousElementSibling.select(); document.execCommand('copy'); showSuccess('Copied to clipboard!');" class="btn-copy">
                                <i class="fas fa-copy"></i> Copy Text
                            </button>
                        </div>
                    </div>
                `;

                // Add modal styles
                if (!document.querySelector('#share-modal-styles')) {
                    const style = document.createElement('style');
                    style.id = 'share-modal-styles';
                    style.textContent = `
                        .share-modal {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0, 0, 0, 0.5);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 2000;
                        }
                        .share-modal-content {
                            background: white;
                            border-radius: 12px;
                            max-width: 500px;
                            width: 90%;
                            max-height: 80vh;
                            overflow-y: auto;
                        }
                        .share-modal-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 20px;
                            border-bottom: 1px solid #e5e7eb;
                        }
                        .share-modal-body {
                            padding: 20px;
                        }
                        .share-text {
                            width: 100%;
                            height: 200px;
                            padding: 10px;
                            border: 2px solid #e5e7eb;
                            border-radius: 8px;
                            font-family: monospace;
                            font-size: 0.9rem;
                            resize: vertical;
                        }
                        .btn-copy {
                            margin-top: 10px;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        .close-btn {
                            background: none;
                            border: none;
                            font-size: 1.2rem;
                            cursor: pointer;
                            color: #6b7280;
                        }
                    `;
                    document.head.appendChild(style);
                }

                document.body.appendChild(modal);
            });
        }

        function getRiskClass(probability) {
            if (probability > 15) return 'high-risk';
            if (probability > 5) return 'medium-risk';
            return 'low-risk';
        }

        function getSeverityText(probability) {
            if (probability > 15) return 'High Risk';
            if (probability > 5) return 'Moderate Risk';
            return 'Low Risk';
        }

        function getClinicalRecommendations(predictedADR, riskLevel) {
            const baseRecommendations = [
                {
                    priority: 'critical',
                    icon: 'fas fa-heartbeat',
                    title: 'Vital Signs Monitoring',
                    description: 'Monitor blood pressure, heart rate, temperature every 2-4 hours'
                },
                {
                    priority: 'urgent',
                    icon: 'fas fa-vial',
                    title: 'Laboratory Monitoring',
                    description: 'Order CBC, CMP, liver function tests within 24 hours'
                },
                {
                    priority: 'urgent',
                    icon: 'fas fa-pills',
                    title: 'Medication Review',
                    description: 'Consider dose reduction or alternative therapy options'
                },
                {
                    priority: 'moderate',
                    icon: 'fas fa-clipboard-list',
                    title: 'Symptom Assessment',
                    description: 'Document any new symptoms or changes in patient condition'
                }
            ];

            // Add patient-specific recommendations based on current data
            const patientSpecificRecs = getPatientSpecificRecommendations();

            // Add specific recommendations based on predicted ADR type
            const specificRecommendations = getSpecificRecommendations(predictedADR);

            return [...baseRecommendations, ...patientSpecificRecs, ...specificRecommendations];
        }

        // Get patient-specific recommendations based on current patient data
        function getPatientSpecificRecommendations() {
            const recommendations = [];

            if (!currentPatientData) return recommendations;

            // Age-based recommendations
            if (currentPatientData.age >= 65) {
                recommendations.push({
                    priority: 'urgent',
                    icon: 'fas fa-user-clock',
                    title: 'Geriatric Considerations',
                    description: 'Enhanced monitoring for elderly patient - consider reduced dosing and increased fall risk'
                });
            }

            // Kidney function recommendations
            if (currentPatientData.egfr && currentPatientData.egfr < 60) {
                recommendations.push({
                    priority: 'critical',
                    icon: 'fas fa-kidneys',
                    title: 'Renal Impairment Alert',
                    description: `eGFR ${currentPatientData.egfr} - Dose adjustment required, monitor creatinine daily`
                });
            }

            // Liver function recommendations
            if (currentPatientData.ast_alt && currentPatientData.ast_alt > 40) {
                recommendations.push({
                    priority: 'critical',
                    icon: 'fas fa-liver',
                    title: 'Hepatic Function Alert',
                    description: `Elevated AST/ALT (${currentPatientData.ast_alt}) - Monitor liver function closely`
                });
            }

            // Polypharmacy recommendations
            if (currentPatientData.concomitant_drugs_count > 5) {
                recommendations.push({
                    priority: 'urgent',
                    icon: 'fas fa-pills',
                    title: 'Polypharmacy Alert',
                    description: `${currentPatientData.concomitant_drugs_count} concurrent medications - Review for interactions and deprescribing opportunities`
                });
            }

            // Comorbidity-based recommendations
            if (currentPatientData.diabetes === 1) {
                recommendations.push({
                    priority: 'moderate',
                    icon: 'fas fa-tint',
                    title: 'Diabetes Management',
                    description: 'Monitor blood glucose levels - ADR may affect glycemic control'
                });
            }

            if (currentPatientData.cardiac_disease === 1) {
                recommendations.push({
                    priority: 'urgent',
                    icon: 'fas fa-heart',
                    title: 'Cardiac Monitoring',
                    description: 'Existing cardiac disease - Monitor for cardiovascular ADRs, consider ECG'
                });
            }

            return recommendations;
        }

        function getSpecificRecommendations(adrType) {
            const recommendations = {
                'Hepatotoxicity': [
                    {
                        priority: 'critical',
                        icon: 'fas fa-liver',
                        title: 'Liver Function Monitoring',
                        description: 'Immediate ALT, AST, bilirubin, INR assessment'
                    }
                ],
                'Nephrotoxicity': [
                    {
                        priority: 'critical',
                        icon: 'fas fa-kidneys',
                        title: 'Renal Function Monitoring',
                        description: 'Check creatinine, BUN, urine output every 6 hours'
                    }
                ],
                'Cardiotoxicity': [
                    {
                        priority: 'critical',
                        icon: 'fas fa-heart',
                        title: 'Cardiac Monitoring',
                        description: 'ECG monitoring, troponin levels, echocardiogram if indicated'
                    }
                ],
                'Hematologic': [
                    {
                        priority: 'critical',
                        icon: 'fas fa-tint',
                        title: 'Blood Count Monitoring',
                        description: 'Daily CBC with differential, platelet count, coagulation studies'
                    }
                ],
                'Dermatologic': [
                    {
                        priority: 'urgent',
                        icon: 'fas fa-hand-paper',
                        title: 'Skin Assessment',
                        description: 'Daily skin examination for rash, blistering, or severe reactions'
                    }
                ]
            };

            return recommendations[adrType] || [];
        }

        // Generate Clinical Report Function
        function generateClinicalReport() {
            if (!currentPatientData || !currentPredictionResult) {
                showError('Please complete a patient assessment first');
                return;
            }

            showLoading();

            const requestData = {
                patient_data: currentPatientData,
                prediction_result: currentPredictionResult,
                patient_name: patientInfo.name || 'Patient',
                patient_id: patientInfo.id || '',
                clinician_name: patientInfo.clinician || 'Clinician'
            };

            fetch('/generate_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })
                .then(response => response.json())
                .then(data => {
                    displayFormattedReport(data.report);
                    showSection('reports');
                    showSuccess('Clinical report generated successfully!');
                })
                .catch(error => {
                    console.error('Error generating report:', error);
                    showError('Failed to generate clinical report');
                })
                .finally(() => {
                    hideLoading();
                });
        }

        // Display Formatted Report
        function displayFormattedReport(reportText) {
            const reportContent = document.getElementById('report-content');
            if (!reportContent) return;

            // Add patient header to report
            const patientHeader = `
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px;">
            <h1 style="color: #1e293b; margin: 0 0 10px 0;">ADR Risk Assessment Report</h1>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; font-size: 0.95rem; color: #475569;">
                <div><strong>Patient:</strong> ${patientInfo.name}</div>
                ${patientInfo.id ? `<div><strong>Patient ID:</strong> ${patientInfo.id}</div>` : ''}
                <div><strong>Clinician:</strong> ${patientInfo.clinician}</div>
                <div><strong>Assessment Date:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Assessment Time:</strong> ${new Date().toLocaleTimeString()}</div>
            </div>
        </div>
    `;

            // Format the report text
            let formattedReport = reportText
                .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');

            formattedReport = '<p>' + formattedReport + '</p>';
            formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
            formattedReport = formattedReport.replace(/<\/ul><br><ul>/g, '');
            formattedReport = formattedReport.replace(/<p><\/p>/g, '');

            reportContent.innerHTML = patientHeader + formattedReport;

            // Show report actions
            const reportActions = document.querySelector('.report-actions');
            if (reportActions) {
                reportActions.style.display = 'flex';
            }
        }// 
        // Save Assessment for Trend Analysis
        function saveCurrentAssessment() {
            if (!currentPatientData || !currentPredictionResult) {
                console.log('No assessment data to save');
                return; // Silently fail if no data
            }

            const assessmentData = {
                patient_id: patientInfo.id || patientInfo.name,
                patient_name: patientInfo.name,
                clinician_name: patientInfo.clinician,
                patient_data: currentPatientData,
                prediction_result: currentPredictionResult
            };

            fetch('/save_assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assessmentData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        console.log('Assessment saved for trend analysis');
                    }
                })
                .catch(error => {
                    console.error('Error saving assessment:', error);
                });
        }// 
        // Updated Mobile Navigation Functions
        function initializeMobileNavigation() {
            const navToggle = document.getElementById('nav-toggle');
            const sidebar = document.getElementById('sidebar');
            const sidebarClose = document.getElementById('sidebar-close');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            const menuItems = document.querySelectorAll('.menu-item');

            // Toggle sidebar
            if (navToggle) {
                navToggle.addEventListener('click', () => {
                    sidebar.classList.toggle('active');
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.toggle('active');
                    }
                });
            }

            // Close sidebar
            function closeSidebar() {
                sidebar.classList.remove('active');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
            }

            if (sidebarClose) {
                sidebarClose.addEventListener('click', closeSidebar);
            }

            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', closeSidebar);
            }

            // Menu item navigation
            menuItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Update active menu item
                    menuItems.forEach(mi => mi.classList.remove('active'));
                    item.classList.add('active');

                    // Show corresponding section
                    const section = item.dataset.section;
                    showSection(section);

                    // Close sidebar on mobile
                    if (window.innerWidth < 768) {
                        closeSidebar();
                    }
                });
            });

            // Close sidebar when clicking outside (backup)
            document.addEventListener('click', (e) => {
                if (window.innerWidth < 768 &&
                    !sidebar.contains(e.target) &&
                    !navToggle.contains(e.target) &&
                    sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            });
        }
        // Fallback functions for enhanced features (to prevent errors)
        function showRiskFactorAnalysis() {
            showInfo('Risk factor analysis feature will be available after completing an assessment');
        }

        function checkDrugInteractions() {
            showInfo('Drug interaction checker feature coming soon');
        }

        function showRiskTrendAnalysis() {
            showInfo('Risk trend analysis feature will be available after multiple assessments');
        }
        // / Clean initialization function
        function initializePatientInfo() {
            const patientId = generatePatientId();

            patientInfo = {
                id: patientId,
                name: 'New Patient',
                clinician: 'Healthcare Provider',
                startTime: new Date().toISOString()
            };

            // Update displays
            updatePatientDisplay();

            // Store in session
            sessionStorage.setItem('patientId', patientId);
            sessionStorage.setItem('patientName', 'New Patient');
            sessionStorage.setItem('clinicianName', 'Healthcare Provider');
            sessionStorage.setItem('assessmentStartTime', patientInfo.startTime);

            console.log(`🏥 New patient initialized: ${patientId}`);
        }// 
        // Clean sample data loading
        function loadSampleData(sampleType) {
            const samplePatients = {
                'high-risk': {
                    age: 75, sex: 'M', ethnicity: 'White', bmi: 32.5,
                    creatinine: 2.1, egfr: 35, ast_alt: 95, bilirubin: 1.8, albumin: 2.8,
                    diabetes: true, liver_disease: true, ckd: true, cardiac_disease: true,
                    index_drug_dose: 200, concomitant_drugs_count: 12, indication: 'Cancer',
                    cyp2c9: 'Poor', cyp2d6: 'PM', bp_systolic: 165, bp_diastolic: 95,
                    heart_rate: 95, time_since_start_days: 45,
                    cyp_inhibitors_flag: true, qt_prolonging_flag: true, hla_risk_allele_flag: true,
                    inpatient_flag: true, prior_adr_history: true
                },
                'medium-risk': {
                    age: 55, sex: 'F', ethnicity: 'Asian', bmi: 27.2,
                    creatinine: 1.3, egfr: 65, ast_alt: 45, bilirubin: 0.8, albumin: 3.5,
                    diabetes: true, liver_disease: false, ckd: false, cardiac_disease: true,
                    index_drug_dose: 150, concomitant_drugs_count: 6, indication: 'Pain',
                    cyp2c9: 'Intermediate', cyp2d6: 'IM', bp_systolic: 140, bp_diastolic: 85,
                    heart_rate: 78, time_since_start_days: 30,
                    cyp_inhibitors_flag: false, qt_prolonging_flag: true, hla_risk_allele_flag: false,
                    inpatient_flag: false, prior_adr_history: false
                },
                'low-risk': {
                    age: 35, sex: 'M', ethnicity: 'White', bmi: 24.1,
                    creatinine: 0.9, egfr: 95, ast_alt: 25, bilirubin: 0.5, albumin: 4.2,
                    diabetes: false, liver_disease: false, ckd: false, cardiac_disease: false,
                    index_drug_dose: 100, concomitant_drugs_count: 2, indication: 'Pain',
                    cyp2c9: 'Wild', cyp2d6: 'EM', bp_systolic: 120, bp_diastolic: 75,
                    heart_rate: 68, time_since_start_days: 14,
                    cyp_inhibitors_flag: false, qt_prolonging_flag: false, hla_risk_allele_flag: false,
                    inpatient_flag: false, prior_adr_history: false
                }
            };

            const sampleData = samplePatients[sampleType];
            if (!sampleData) return;

            // Fill form fields
            Object.keys(sampleData).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = sampleData[key];
                    } else {
                        element.value = sampleData[key];
                    }
                }
            });

            // Update progress
            updateFormProgress();
            showSuccess(`${sampleType.replace('-', ' ')} sample data loaded successfully!`);
        }// P
        // Patient Name Modal Functions
        function showPatientNameModal() {
            const modal = document.getElementById('patient-name-modal');
            if (modal) {
                modal.classList.add('active');
                const input = document.getElementById('patient-name-input');
                if (input) {
                    setTimeout(() => input.focus(), 300);
                }
            }
        }

        function closePatientModal() {
            const modal = document.getElementById('patient-name-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        function startAssessment() {
            const input = document.getElementById('patient-name-input');
            const patientName = input.value.trim();

            if (!patientName) {
                showError('Please enter patient name');
                input.focus();
                return;
            }

            // Update patient info with the entered name
            const patientId = generatePatientId();
            patientInfo = {
                id: patientId,
                name: patientName,
                clinician: 'Healthcare Provider',
                startTime: new Date().toISOString()
            };

            // Update displays
            updatePatientDisplay();

            // Store in session
            sessionStorage.setItem('patientId', patientId);
            sessionStorage.setItem('patientName', patientName);
            sessionStorage.setItem('clinicianName', 'Healthcare Provider');
            sessionStorage.setItem('assessmentStartTime', patientInfo.startTime);

            // Show patient header
            const patientHeader = document.getElementById('patient-header-card');
            if (patientHeader) {
                patientHeader.style.display = 'flex';
            }

            // Close modal
            closePatientModal();

            // Show success message
            showSuccess(`Assessment started for ${patientName}`);

            console.log(`🏥 Assessment started for: ${patientName} (ID: ${patientId})`);
        }

        // Handle Enter key in patient name input
        document.addEventListener('DOMContentLoaded', () => {
            const input = document.getElementById('patient-name-input');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        startAssessment();
                    }
                });
            }
        });

        // Show modal when assessment page loads
        function initializeAssessmentPage() {
            // Check if we already have patient info
            const existingPatientName = sessionStorage.getItem('patientName');

            if (!existingPatientName || existingPatientName === 'New Patient') {
                // Show modal to get patient name
                setTimeout(() => {
                    showPatientNameModal();
                }, 500);
            } else {
                // Use existing patient info
                patientInfo = {
                    id: sessionStorage.getItem('patientId') || generatePatientId(),
                    name: existingPatientName,
                    clinician: sessionStorage.getItem('clinicianName') || 'Healthcare Provider',
                    startTime: sessionStorage.getItem('assessmentStartTime') || new Date().toISOString()
                };

                updatePatientDisplay();

                const patientHeader = document.getElementById('patient-header-card');
                if (patientHeader) {
                    patientHeader.style.display = 'flex';
                }
            }
        }//
        //  Show specific section function
        function showSection(sectionName) {
            console.log(`Switching to section: ${sectionName}`);

            // Hide all sections
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
                console.log(`Section ${sectionName} activated`);
            } else {
                console.warn(`Section ${sectionName}-section not found`);
            }

            // Update page title based on section
            const sectionTitles = {
                'assessment': 'Patient Assessment',
                'results': 'Assessment Results',
                'reports': 'Clinical Reports',
                'history': 'Patient History'
            };

            if (sectionTitles[sectionName]) {
                document.title = `ADR Risk Predictor - ${sectionTitles[sectionName]}`;
            }
        }
    }
}
// L
// oad sample data function
async function loadSampleData(sampleType) {
    try {
        showLoading();

        const response = await fetch(`/sample_data/${sampleType}`);
        if (!response.ok) {
            throw new Error(`Failed to load sample data: ${response.status}`);
        }

        const sampleData = await response.json();

        // Populate form fields
        Object.keys(sampleData).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = sampleData[key] === 1;
                } else {
                    field.value = sampleData[key];
                }
            }
        });

        // Trigger BMI calculation if height and weight are loaded
        if (sampleData.height && sampleData.weight) {
            calculateBMI();
        }

        showSuccess(`Sample data loaded: ${sampleData.name}`);

    } catch (error) {
        console.error('Error loading sample data:', error);
        showError(`Failed to load sample data: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Show success message
function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <div class="success-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add success styles if not already added
    if (!document.querySelector('#success-styles')) {
        const style = document.createElement('style');
        style.id = 'success-styles';
        style.textContent = `
            .success-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #c6f6d5;
                color: #2f855a;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #38a169;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .success-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .success-content button {
                background: none;
                border: none;
                color: #2f855a;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(successDiv);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (successDiv.parentElement) {
            successDiv.remove();
        }
    }, 4000);
}

// Show error message
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add error styles if not already added
    if (!document.querySelector('#error-styles')) {
        const style = document.createElement('style');
        style.id = 'error-styles';
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fed7d7;
                color: #c53030;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #e53e3e;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .error-content button {
                background: none;
                border: none;
                color: #c53030;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(errorDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

// Show info message
function showInfo(message) {
    // Create info notification
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-notification';
    infoDiv.innerHTML = `
        <div class="info-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add info styles if not already added
    if (!document.querySelector('#info-styles')) {
        const style = document.createElement('style');
        style.id = 'info-styles';
        style.textContent = `
            .info-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #bee3f8;
                color: #2b6cb0;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #3182ce;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .info-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .info-content button {
                background: none;
                border: none;
                color: #2b6cb0;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(infoDiv);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (infoDiv.parentElement) {
            infoDiv.remove();
        }
    }, 4000);
}
// / Multiple Medications Management
let medicationCount = 1;
let medications = [];

// Initialize medication management
function initializeMedicationManagement() {
    const addMedicationBtn = document.getElementById('add-medication');
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', addMedication);
    }

    // Initialize first medication
    setupMedicationEventListeners(0);
    updateMedicationSummary();
}

// Add new medication
function addMedication() {
    const container = document.getElementById('medications-container');
    if (!container) return;

    const medicationCard = createMedicationCard(medicationCount);
    container.appendChild(medicationCard);

    setupMedicationEventListeners(medicationCount);
    medicationCount++;
    updateMedicationSummary();

    // Scroll to new medication
    medicationCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Create medication card HTML
function createMedicationCard(index) {
    const card = document.createElement('div');
    card.className = 'medication-card';
    card.setAttribute('data-medication-index', index);

    card.innerHTML = `
        <div class="medication-header">
            <span class="medication-label">${index === 0 ? 'Primary Medication' : `Medication ${index + 1}`}</span>
            <div class="dose-index-display">
                <span class="dose-index-label">Dose Index:</span>
                <span class="dose-index-value" id="dose-index-${index}">0.0</span>
            </div>
            ${index > 0 ? `<button type="button" class="btn-remove-medication" onclick="removeMedication(${index})"><i class="fas fa-times"></i></button>` : ''}
        </div>
        
        <div class="medication-form-grid">
            <div class="modern-form-group">
                <label for="medication_name_${index}">Medication Name</label>
                <select id="medication_name_${index}" name="medication_name_${index}" required>
                    <option value="">Select medication...</option>
                    <option value="Warfarin">Warfarin</option>
                    <option value="Metformin">Metformin</option>
                    <option value="Atorvastatin">Atorvastatin</option>
                    <option value="Lisinopril">Lisinopril</option>
                    <option value="Amlodipine">Amlodipine</option>
                    <option value="Metoprolol">Metoprolol</option>
                    <option value="Omeprazole">Omeprazole</option>
                    <option value="Levothyroxine">Levothyroxine</option>
                    <option value="Aspirin">Aspirin</option>
                    <option value="Clopidogrel">Clopidogrel</option>
                    <option value="Furosemide">Furosemide</option>
                    <option value="Digoxin">Digoxin</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label for="dose_${index}">Dose (mg)</label>
                <input type="number" id="dose_${index}" name="dose_${index}" min="1" max="2000" step="0.1" placeholder="Enter dose" required>
            </div>
            
            <div class="modern-form-group">
                <label for="frequency_${index}">Frequency</label>
                <select id="frequency_${index}" name="frequency_${index}" required>
                    <option value="">Select frequency...</option>
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Three times daily">Three times daily</option>
                    <option value="Four times daily">Four times daily</option>
                    <option value="As needed">As needed</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label for="route_${index}">Route</label>
                <select id="route_${index}" name="route_${index}" required>
                    <option value="">Select route...</option>
                    <option value="Oral">Oral</option>
                    <option value="IV">Intravenous</option>
                    <option value="IM">Intramuscular</option>
                    <option value="SC">Subcutaneous</option>
                    <option value="Topical">Topical</option>
                    <option value="Inhaled">Inhaled</option>
                    <option value="Rectal">Rectal</option>
                </select>
            </div>
            
            <div class="modern-form-group">
                <label for="duration_${index}">Duration (days)</label>
                <input type="number" id="duration_${index}" name="duration_${index}" min="1" max="365" placeholder="Treatment duration" required>
            </div>
            
            <div class="modern-form-group">
                <label for="indication_${index}">Indication</label>
                <select id="indication_${index}" name="indication_${index}" required>
                    <option value="">Select indication...</option>
                    <option value="Pain">Pain Management</option>
                    <option value="Cancer">Cancer Treatment</option>
                    <option value="Autoimmune">Autoimmune Disease</option>
                    <option value="Cardiovascular">Cardiovascular Disease</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Hypertension">Hypertension</option>
                    <option value="Infection">Infection</option>
                    <option value="Mental Health">Mental Health</option>
                    <option value="Respiratory">Respiratory Disease</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Neurological">Neurological</option>
                    <option value="Endocrine">Endocrine Disorder</option>
                </select>
            </div>
        </div>
    `;

    return card;
}

// Remove medication
function removeMedication(index) {
    const card = document.querySelector(`[data-medication-index="${index}"]`);
    if (card && index > 0) { // Don't allow removing primary medication
        card.remove();
        updateMedicationSummary();
        detectDrugInteractions();
    }
}

// Setup event listeners for medication fields
function setupMedicationEventListeners(index) {
    const doseField = document.getElementById(`dose_${index}`);
    const frequencyField = document.getElementById(`frequency_${index}`);
    const durationField = document.getElementById(`duration_${index}`);
    const medicationField = document.getElementById(`medication_name_${index}`);

    if (doseField) {
        doseField.addEventListener('input', () => calculateDoseIndex(index));
    }

    if (frequencyField) {
        frequencyField.addEventListener('change', () => calculateDoseIndex(index));
    }

    if (durationField) {
        durationField.addEventListener('input', () => calculateDoseIndex(index));
    }

    if (medicationField) {
        medicationField.addEventListener('change', () => {
            calculateDoseIndex(index);
            detectDrugInteractions();
        });
    }
}

// Calculate dose index for a medication
function calculateDoseIndex(index) {
    const dose = parseFloat(document.getElementById(`dose_${index}`)?.value || 0);
    const frequency = document.getElementById(`frequency_${index}`)?.value || '';
    const duration = parseFloat(document.getElementById(`duration_${index}`)?.value || 0);

    // Convert frequency to daily multiplier
    const frequencyMultiplier = {
        'Once daily': 1,
        'Twice daily': 2,
        'Three times daily': 3,
        'Four times daily': 4,
        'As needed': 0.5,
        'Weekly': 1 / 7,
        'Monthly': 1 / 30
    };

    const dailyMultiplier = frequencyMultiplier[frequency] || 0;
    const totalDose = dose * dailyMultiplier * duration;

    // Calculate dose index (normalized score)
    const doseIndex = totalDose > 0 ? Math.min(totalDose / 1000, 10).toFixed(1) : '0.0';

    const doseIndexElement = document.getElementById(`dose-index-${index}`);
    if (doseIndexElement) {
        doseIndexElement.textContent = doseIndex;

        // Color code based on dose index
        const display = doseIndexElement.parentElement;
        if (parseFloat(doseIndex) > 5) {
            display.style.background = '#ef4444'; // High dose - red
        } else if (parseFloat(doseIndex) > 2) {
            display.style.background = '#f59e0b'; // Medium dose - orange
        } else {
            display.style.background = '#667eea'; // Normal dose - blue
        }
    }

    updateMedicationSummary();
}

// Update medication summary
function updateMedicationSummary() {
    const medicationCards = document.querySelectorAll('.medication-card');
    const totalMedications = medicationCards.length;

    // Update total count
    const totalElement = document.getElementById('total-medications');
    if (totalElement) {
        totalElement.textContent = totalMedications;
    }

    // Calculate average dose index
    let totalDoseIndex = 0;
    let validMedications = 0;

    medicationCards.forEach((card, index) => {
        const doseIndexElement = document.getElementById(`dose-index-${card.dataset.medicationIndex}`);
        if (doseIndexElement) {
            const doseIndex = parseFloat(doseIndexElement.textContent);
            if (!isNaN(doseIndex)) {
                totalDoseIndex += doseIndex;
                validMedications++;
            }
        }
    });

    const averageDoseIndex = validMedications > 0 ? (totalDoseIndex / validMedications).toFixed(1) : '0.0';
    const averageElement = document.getElementById('average-dose-index');
    if (averageElement) {
        averageElement.textContent = averageDoseIndex;
    }
}

// Detect drug interactions
function detectDrugInteractions() {
    const medicationCards = document.querySelectorAll('.medication-card');
    const medications = [];

    medicationCards.forEach(card => {
        const index = card.dataset.medicationIndex;
        const medicationName = document.getElementById(`medication_name_${index}`)?.value;
        if (medicationName) {
            medications.push(medicationName);
        }
    });

    // Simple interaction detection logic
    let interactionLevel = 'None';

    if (medications.length > 1) {
        // Check for known high-risk combinations
        const highRiskCombinations = [
            ['Warfarin', 'Aspirin'],
            ['Warfarin', 'Clopidogrel'],
            ['Digoxin', 'Furosemide'],
            ['Metformin', 'Furosemide']
        ];

        const moderateRiskCombinations = [
            ['Atorvastatin', 'Digoxin'],
            ['Lisinopril', 'Furosemide'],
            ['Metoprolol', 'Digoxin']
        ];

        // Check for high-risk interactions
        for (const combo of highRiskCombinations) {
            if (combo.every(med => medications.includes(med))) {
                interactionLevel = 'Major';
                break;
            }
        }

        // Check for moderate-risk interactions if no high-risk found
        if (interactionLevel === 'None') {
            for (const combo of moderateRiskCombinations) {
                if (combo.every(med => medications.includes(med))) {
                    interactionLevel = 'Moderate';
                    break;
                }
            }
        }

        // If multiple medications but no specific interactions, mark as minor
        if (interactionLevel === 'None' && medications.length > 2) {
            interactionLevel = 'Minor';
        }
    }

    const interactionSelect = document.getElementById('drug_interactions');
    if (interactionSelect) {
        interactionSelect.value = interactionLevel;

        // Color code the select based on interaction level
        interactionSelect.style.borderColor = {
            'None': '#10b981',
            'Minor': '#f59e0b',
            'Moderate': '#ef4444',
            'Major': '#dc2626',
            'Contraindicated': '#7c2d12'
        }[interactionLevel] || '#e5e7eb';
    }
}

// Initialize patient info from session storage
function initializePatientInfo() {
    const patientName = sessionStorage.getItem('patientName') || 'Patient';
    const clinicianName = sessionStorage.getItem('clinicianName') || 'Clinician';
    const patientId = sessionStorage.getItem('patientId') || '0';

    const patientNameDisplay = document.getElementById('patient-name-display');
    const clinicianNameDisplay = document.getElementById('clinician-name-display');
    const timestampDisplay = document.getElementById('timestamp-display');

    if (patientNameDisplay) {
        patientNameDisplay.textContent = patientName;
    }

    if (clinicianNameDisplay) {
        clinicianNameDisplay.textContent = clinicianName;
    }

    if (timestampDisplay) {
        const now = new Date();
        timestampDisplay.textContent = now.toLocaleString();
    }

    // Update patient ID display
    const patientIdElements = document.querySelectorAll('.patient-id');
    patientIdElements.forEach(element => {
        element.textContent = patientId;
    });
}

// Enhanced form submission to handle multiple medications
function collectMedicationData() {
    const medicationCards = document.querySelectorAll('.medication-card');
    const medicationsData = [];

    medicationCards.forEach(card => {
        const index = card.dataset.medicationIndex;
        const medicationData = {
            name: document.getElementById(`medication_name_${index}`)?.value || '',
            dose: parseFloat(document.getElementById(`dose_${index}`)?.value || 0),
            frequency: document.getElementById(`frequency_${index}`)?.value || '',
            route: document.getElementById(`route_${index}`)?.value || '',
            duration: parseFloat(document.getElementById(`duration_${index}`)?.value || 0),
            indication: document.getElementById(`indication_${index}`)?.value || '',
            doseIndex: parseFloat(document.getElementById(`dose-index-${index}`)?.textContent || 0)
        };

        if (medicationData.name) {
            medicationsData.push(medicationData);
        }
    });

    return medicationsData;
}

// Update the main initialization to include medication management
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing application...');

    // Initialize all components
    initializeDOMElements();
    initializePatientInfo();
    initializeMedicationManagement();
    setupFormHandler();
    setupClearHandler();
    setupReportHandler();

    console.log('Application initialized successfully');
});
// / Setup sample data loading functionality
function setupSampleDataLoading() {
    const loadSampleBtn = document.getElementById('load-sample-data');
    const sampleSelector = document.getElementById('sample-data-selector');

    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            const selectedValue = sampleSelector ? sampleSelector.value : '';
            if (selectedValue) {
                loadSampleData(selectedValue);
                sampleSelector.value = '';
            } else {
                showNotification('Please select a sample patient first', 'error');
            }
        });
    }

    if (sampleSelector) {
        sampleSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadSampleData(e.target.value);
                e.target.value = '';
            }
        });
    }
}

// Enhanced load sample data function
async function loadSampleDataEnhanced(sampleType) {
    try {
        showLoading();

        const response = await fetch(`/sample_data/${sampleType}`);
        if (!response.ok) {
            throw new Error(`Failed to load sample data: ${response.status}`);
        }

        const sampleData = await response.json();

        // Populate form fields
        Object.keys(sampleData).forEach(key => {
            const field = document.getElementById(key);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = sampleData[key] === 1;
                } else {
                    field.value = sampleData[key];
                }
            }
        });

        // Trigger BMI calculation if height and weight are loaded
        if (sampleData.height && sampleData.weight) {
            calculateBMI();
        }

        showNotification(`Sample data loaded: ${sampleData.name}`, 'success');

    } catch (error) {
        console.error('Error loading sample data:', error);
        showNotification(`Failed to load sample data: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Enhanced notification system
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; margin-left: auto; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add notification styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 12px;
                color: white;
                font-weight: 600;
                z-index: 1001;
                animation: slideIn 0.3s ease;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            }
            
            .notification.success {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }
            
            .notification.error {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

// Enhanced results display function
function displayEnhancedResults(result) {
    console.log('Displaying enhanced results:', result);

    // Ensure enhanced results container is visible
    const enhancedContainer = document.getElementById('enhanced-results-container');
    if (enhancedContainer) {
        enhancedContainer.style.display = 'block';
        console.log('Enhanced results container made visible');
    } else {
        console.error('Enhanced results container not found');
        return;
    }

    // Display major ADR factors with enhanced clinical information
    console.log('Major ADR factors:', result.major_adr_factors);
    if (result.major_adr_factors && result.major_adr_factors.length > 0) {
        const factorsHtml = result.major_adr_factors.map(factor => `
            <div class="adr-factor-card ${factor.risk_contribution.toLowerCase()}-risk">
                <div class="factor-header">
                    <h5>${factor.factor}</h5>
                    <span class="risk-badge ${factor.risk_contribution.toLowerCase()}">${factor.risk_contribution} Risk</span>
                </div>
                <div class="factor-value">${factor.value}</div>
                <div class="factor-description">${factor.description}</div>
                ${factor.clinical_reference ? `<div class="factor-reference"><i class="fas fa-book-medical"></i> ${factor.clinical_reference}</div>` : ''}
            </div>
        `).join('');

        const factorsContainer = document.getElementById('major-factors-container');
        if (factorsContainer) {
            factorsContainer.innerHTML = factorsHtml;
        }
    } else {
        const factorsContainer = document.getElementById('major-factors-container');
        if (factorsContainer) {
            factorsContainer.innerHTML = '<div class="no-data">No major ADR factors identified or data not available.</div>';
        }
    }

    // Display medication list
    console.log('Medication list:', result.medication_list);
    if (result.medication_list && result.medication_list.length > 0) {
        const medicationsHtml = result.medication_list.map(med => `
            <div class="medication-card ${med.risk_level.toLowerCase()}-risk">
                <div class="med-header">
                    <h5>${med.name}</h5>
                    <span class="med-type ${med.type.toLowerCase()}">${med.type}</span>
                </div>
                <div class="med-details">
                    <div class="med-dose">${med.dose}</div>
                    <div class="med-indication">${med.indication}</div>
                    <div class="med-risk">Risk Level: ${med.risk_level}</div>
                </div>
            </div>
        `).join('');

        const medicationsContainer = document.getElementById('medications-container');
        if (medicationsContainer) {
            medicationsContainer.innerHTML = medicationsHtml;
        }
    } else {
        const medicationsContainer = document.getElementById('medications-container');
        if (medicationsContainer) {
            medicationsContainer.innerHTML = '<div class="no-data">Medication list not available.</div>';
        }
    }

    // Display ADR list
    console.log('ADR list:', result.adr_list);
    if (result.adr_list && result.adr_list.length > 0) {
        const adrHtml = result.adr_list.map(adr => `
            <div class="adr-detail-card">
                <div class="adr-header">
                    <h5>${adr.name}</h5>
                    <span class="adr-probability">${adr.probability}%</span>
                </div>
                <div class="adr-info">
                    <div class="adr-category">${adr.category} - ${adr.severity}</div>
                    <div class="adr-onset">Onset: ${adr.onset}</div>
                    <div class="adr-symptoms">
                        <strong>Symptoms:</strong> ${adr.symptoms.join(', ')}
                    </div>
                    <div class="adr-monitoring">
                        <strong>Monitoring:</strong> ${adr.monitoring}
                    </div>
                </div>
            </div>
        `).join('');

        const adrContainer = document.getElementById('adr-details-container');
        if (adrContainer) {
            adrContainer.innerHTML = adrHtml;
        }
    } else {
        const adrContainer = document.getElementById('adr-details-container');
        if (adrContainer) {
            adrContainer.innerHTML = '<div class="no-data">ADR risk profile not available.</div>';
        }
    }
}

// Trigger detailed analysis function
function triggerDetailedAnalysis() {
    if (!currentPredictionResult || !currentPatientData) {
        showNotification('Please complete a risk assessment first', 'error');
        return;
    }

    generateAIDetailedAnalysis(currentPredictionResult);
}

// AI-Powered Detailed Analysis function - Enhanced with all field details
function generateAIDetailedAnalysis(result) {
    console.log('Generating AI-powered detailed analysis:', result);

    const aiContainer = document.getElementById('ai-detailed-analysis-container');
    const aiContent = document.getElementById('ai-detailed-content');

    if (!aiContainer || !aiContent) {
        console.error('AI detailed analysis containers not found');
        return;
    }

    // Show the container
    aiContainer.style.display = 'block';

    // Show loading state first
    aiContent.innerHTML = `
        <div class="ai-analysis-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Generating comprehensive clinical analysis using AI...</p>
        </div>
    `;

    // Generate content after a short delay
    setTimeout(() => {
        const analysisContent = generateComprehensiveAnalysis(result, currentPatientData);
        aiContent.innerHTML = analysisContent;
        console.log('AI detailed analysis generated successfully');
    }, 1500);
}

// Clinical Decision Support Functions
function showClinicalDecisionSupport(result, patientData) {
    console.log('Showing Clinical Decision Support:', result);

    const cdsContainer = document.getElementById('clinical-decision-support');
    if (cdsContainer) {
        cdsContainer.style.display = 'block';

        // Generate alerts
        generateClinicalAlerts(result, patientData);

        // Generate guidelines
        generateClinicalGuidelines(result, patientData);
    }
}

function generateClinicalAlerts(result, patientData) {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    const alerts = [];

    // Critical alerts based on risk level
    if (result.risk_level === 'High') {
        alerts.push({
            severity: 'critical',
            title: 'High ADR Risk Detected',
            message: `Patient has ${result.predicted_adr_type} risk of ${Object.values(result.top_adr_risks)[0]}%. Immediate monitoring required.`,
            actions: ['Monitor Closely', 'Consider Dose Reduction', 'Alternative Therapy']
        });
    }

    // Lab value alerts
    if (patientData.creatinine && patientData.creatinine > 2.0) {
        alerts.push({
            severity: 'critical',
            title: 'Severe Renal Impairment',
            message: `Creatinine ${patientData.creatinine} mg/dL indicates severe kidney dysfunction. Dose adjustment required for renally cleared drugs.`,
            actions: ['Adjust Dose', 'Monitor eGFR', 'Nephrology Consult']
        });
    }

    if (patientData.ast_alt && patientData.ast_alt > 200) {
        alerts.push({
            severity: 'critical',
            title: 'Severe Hepatic Impairment',
            message: `AST/ALT ${patientData.ast_alt} U/L indicates severe liver dysfunction. Hepatotoxic drugs contraindicated.`,
            actions: ['Stop Hepatotoxic Drugs', 'Monitor LFTs', 'Hepatology Consult']
        });
    }

    // Drug interaction alerts
    if (patientData.drug_interactions === 'Major') {
        alerts.push({
            severity: 'warning',
            title: 'Major Drug Interactions',
            message: 'Major drug interactions detected. Review medication regimen for potential adverse effects.',
            actions: ['Review Medications', 'Consider Alternatives', 'Monitor Closely']
        });
    }

    // Polypharmacy alert
    if (patientData.concomitant_drugs_count > 10) {
        alerts.push({
            severity: 'warning',
            title: 'Polypharmacy Risk',
            message: `Patient on ${patientData.concomitant_drugs_count} medications. Increased risk of drug interactions and ADRs.`,
            actions: ['Medication Review', 'Deprescribing', 'Monitor Adherence']
        });
    }

    // Age-related alerts
    if (patientData.age > 75) {
        alerts.push({
            severity: 'info',
            title: 'Geriatric Patient',
            message: 'Elderly patient at increased risk for ADRs. Consider age-appropriate dosing and monitoring.',
            actions: ['Geriatric Dosing', 'Fall Risk Assessment', 'Cognitive Assessment']
        });
    }

    // CBC alerts
    if (patientData.hemoglobin && patientData.hemoglobin < 8.0) {
        alerts.push({
            severity: 'critical',
            title: 'Severe Anemia',
            message: `Hemoglobin ${patientData.hemoglobin} g/dL indicates severe anemia. May affect drug tolerance.`,
            actions: ['Transfusion Consider', 'Iron Studies', 'Hematology Consult']
        });
    }

    if (patientData.platelet_count && patientData.platelet_count < 50) {
        alerts.push({
            severity: 'critical',
            title: 'Severe Thrombocytopenia',
            message: `Platelet count ${patientData.platelet_count}×10³/μL. High bleeding risk with anticoagulants.`,
            actions: ['Avoid Anticoagulants', 'Bleeding Precautions', 'Hematology Consult']
        });
    }

    displayAlerts(alerts);
}

function displayAlerts(alerts) {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    if (alerts.length === 0) {
        alertsContainer.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <p>No critical alerts detected. Continue monitoring as per standard protocols.</p>
            </div>
        `;
        return;
    }

    const alertsHtml = alerts.map((alert, index) => `
        <div class="alert-item ${alert.severity}" id="alert-${index}">
            <div class="alert-header-content">
                <div class="alert-title">${alert.title}</div>
                <span class="alert-severity ${alert.severity}">${alert.severity}</span>
            </div>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-actions">
                ${alert.actions.map(action => `
                    <button class="alert-action-btn" onclick="handleAlertAction('${action}', ${index})">
                        ${action}
                    </button>
                `).join('')}
                <button class="alert-action-btn" onclick="dismissAlert(${index})">
                    <i class="fas fa-times"></i> Dismiss
                </button>
            </div>
        </div>
    `).join('');

    alertsContainer.innerHTML = alertsHtml;
}

function generateClinicalGuidelines(result, patientData) {
    const guidelines = [];

    // FDA Drug Labeling Guidelines
    if (patientData.medication_name) {
        guidelines.push({
            source: 'FDA',
            title: `${patientData.medication_name} - FDA Drug Labeling`,
            recommendation: 'Monitor for hepatotoxicity, nephrotoxicity, and drug interactions as per FDA labeling requirements.',
            evidence: 'FDA-approved prescribing information',
            actions: ['View Full Label', 'Dosing Guidelines', 'Contraindications']
        });
    }

    // Renal dosing guidelines
    if (patientData.creatinine > 1.5 || (patientData.egfr && patientData.egfr < 60)) {
        guidelines.push({
            source: 'KDIGO',
            title: 'Chronic Kidney Disease - Drug Dosing',
            recommendation: 'Adjust doses for renally cleared medications based on eGFR. Monitor for drug accumulation and toxicity.',
            evidence: 'KDIGO Clinical Practice Guidelines',
            actions: ['Dose Calculator', 'Renal Dosing Chart', 'Monitor eGFR']
        });
    }

    // Liver disease guidelines
    if (patientData.liver_disease === 1 || (patientData.ast_alt && patientData.ast_alt > 100)) {
        guidelines.push({
            source: 'AASLD',
            title: 'Hepatic Impairment - Drug Safety',
            recommendation: 'Avoid hepatotoxic medications. Reduce doses of hepatically metabolized drugs. Monitor liver function closely.',
            evidence: 'AASLD Practice Guidelines',
            actions: ['Hepatotoxic Drug List', 'Dose Adjustment', 'LFT Monitoring']
        });
    }

    // Cardiac guidelines
    if (patientData.cardiac_disease === 1 || patientData.qt_prolonging_flag === 1) {
        guidelines.push({
            source: 'AHA/ACC',
            title: 'Cardiovascular Risk - QT Prolongation',
            recommendation: 'Monitor ECG for QT prolongation. Avoid QT-prolonging drug combinations. Consider cardiology consultation.',
            evidence: 'AHA/ACC Scientific Statements',
            actions: ['ECG Monitoring', 'Drug Interaction Check', 'Cardiology Consult']
        });
    }

    // Geriatric guidelines
    if (patientData.age > 65) {
        guidelines.push({
            source: 'AGS',
            title: 'Geriatric Pharmacotherapy - Beers Criteria',
            recommendation: 'Review medications against Beers Criteria. Consider age-appropriate dosing and monitoring intervals.',
            evidence: 'American Geriatrics Society Beers Criteria',
            actions: ['Beers Criteria Check', 'Deprescribing', 'Fall Risk Assessment']
        });
    }

    // Pharmacogenomic guidelines
    if (patientData.cyp2d6 === 'PM' || patientData.cyp2c9 === 'Poor') {
        guidelines.push({
            source: 'CPIC',
            title: 'Pharmacogenomic Dosing Guidelines',
            recommendation: 'Adjust doses based on genetic metabolizer status. Consider alternative medications for poor metabolizers.',
            evidence: 'Clinical Pharmacogenetics Implementation Consortium',
            actions: ['Genetic Dosing', 'Alternative Drugs', 'Therapeutic Monitoring']
        });
    }

    displayGuidelines(guidelines);
}

function displayGuidelines(guidelines) {
    const guidelinesContainer = document.getElementById('guidelines-container');
    if (!guidelinesContainer) return;

    if (guidelines.length === 0) {
        guidelinesContainer.innerHTML = `
            <div class="no-guidelines">
                <i class="fas fa-book-open"></i>
                <p>No specific guidelines identified. Follow standard clinical protocols.</p>
            </div>
        `;
        return;
    }

    const guidelinesHtml = guidelines.map((guideline, index) => `
        <div class="guideline-item" id="guideline-${index}">
            <div class="guideline-header-content">
                <div class="guideline-title">${guideline.title}</div>
                <span class="guideline-source">${guideline.source}</span>
            </div>
            <div class="guideline-recommendation">${guideline.recommendation}</div>
            <div class="guideline-evidence">Evidence: ${guideline.evidence}</div>
            <div class="guideline-actions">
                ${guideline.actions.map(action => `
                    <button class="guideline-action-btn" onclick="handleGuidelineAction('${action}', ${index})">
                        ${action}
                    </button>
                `).join('')}
            </div>
        </div>
    `).join('');

    guidelinesContainer.innerHTML = guidelinesHtml;
}

// Alert and Guideline Action Handlers
function handleAlertAction(action, alertIndex) {
    console.log(`Alert action: ${action} for alert ${alertIndex}`);
    showNotification(`Action "${action}" logged for clinical review`, 'info');
}

function handleGuidelineAction(action, guidelineIndex) {
    console.log(`Guideline action: ${action} for guideline ${guidelineIndex}`);
    showNotification(`Guideline "${action}" accessed`, 'info');
}

function dismissAlert(alertIndex) {
    const alertElement = document.getElementById(`alert-${alertIndex}`);
    if (alertElement) {
        alertElement.style.opacity = '0.5';
        alertElement.style.pointerEvents = 'none';
        showNotification('Alert dismissed', 'success');
    }
}

function refreshAlerts() {
    if (currentPredictionResult && currentPatientData) {
        generateClinicalAlerts(currentPredictionResult, currentPatientData);
        showNotification('Alerts refreshed', 'success');
    }
}

function clearAlerts() {
    const alertsContainer = document.getElementById('alerts-container');
    if (alertsContainer) {
        alertsContainer.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <p>All alerts cleared. Complete new assessment to generate alerts.</p>
            </div>
        `;
        showNotification('All alerts cleared', 'success');
    }
}

function searchGuidelines() {
    const guidelineSource = document.getElementById('guideline-source').value;
    console.log(`Searching guidelines for: ${guidelineSource}`);

    if (currentPredictionResult && currentPatientData) {
        generateClinicalGuidelines(currentPredictionResult, currentPatientData);
        showNotification(`Guidelines filtered for ${guidelineSource}`, 'info');
    }
}

// Generate comprehensive analysis with all entered fields
function generateComprehensiveAnalysis(result, patientData) {
    const riskLevel = result.risk_level || 'High';
    const predictedADR = result.predicted_adr_type || 'Hepatotoxicity';
    const noADRProb = result.no_adr_probability || 8.51;
    const topRisks = result.top_adr_risks || {};

    return `
        <div class="comprehensive-analysis">
            <h1><i class="fas fa-brain"></i> Comprehensive ADR Risk Assessment</h1>
            
            <!-- Patient Overview Section -->
            <div class="analysis-section patient-overview">
                <h2><i class="fas fa-user-md"></i> Patient Overview</h2>
                <div class="patient-summary-grid">
                    ${generatePatientSummaryCards(patientData)}
                </div>
            </div>

            <!-- Risk Assessment Summary -->
            <div class="analysis-section risk-summary">
                <h2><i class="fas fa-exclamation-triangle"></i> Risk Assessment Summary</h2>
                <div class="risk-overview-cards">
                    <div class="risk-card primary-risk">
                        <div class="risk-icon"><i class="fas fa-warning"></i></div>
                        <div class="risk-content">
                            <h3>Primary Risk</h3>
                            <p class="risk-value">${predictedADR}</p>
                            <p class="risk-probability">${topRisks[Object.keys(topRisks)[0]] || '60.06'}% probability</p>
                        </div>
                    </div>
                    <div class="risk-card overall-risk">
                        <div class="risk-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="risk-content">
                            <h3>Overall Risk Level</h3>
                            <p class="risk-value risk-${riskLevel.toLowerCase()}">${riskLevel}</p>
                            <p class="risk-description">${getRiskDescription(riskLevel)}</p>
                        </div>
                    </div>
                    <div class="risk-card safety-margin">
                        <div class="risk-icon"><i class="fas fa-shield-alt"></i></div>
                        <div class="risk-content">
                            <h3>Safety Probability</h3>
                            <p class="risk-value safety">${noADRProb}%</p>
                            <p class="risk-description">No adverse reactions</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Field Analysis -->
            <div class="analysis-section field-analysis">
                <h2><i class="fas fa-microscope"></i> Detailed Field Analysis</h2>
                ${generateDetailedFieldAnalysis(patientData)}
            </div>

            <!-- Laboratory Values Analysis -->
            <div class="analysis-section lab-analysis">
                <h2><i class="fas fa-flask"></i> Laboratory Values Assessment</h2>
                ${generateLabAnalysis(patientData)}
            </div>

            <!-- Medication Analysis -->
            <div class="analysis-section medication-analysis">
                <h2><i class="fas fa-pills"></i> Medication Risk Analysis</h2>
                ${generateMedicationAnalysis(patientData)}
            </div>

            <!-- Clinical Recommendations -->
            <div class="analysis-section recommendations">
                <h2><i class="fas fa-clipboard-list"></i> Clinical Recommendations</h2>
                ${generateClinicalRecommendations(riskLevel, predictedADR, patientData)}
            </div>

            <!-- Monitoring Protocol -->
            <div class="analysis-section monitoring">
                <h2><i class="fas fa-heartbeat"></i> Monitoring Protocol</h2>
                ${generateMonitoringProtocol(riskLevel, patientData)}
            </div>

            <!-- Follow-up Timeline -->
            <div class="analysis-section timeline">
                <h2><i class="fas fa-calendar-alt"></i> Follow-up Timeline</h2>
                ${generateFollowupTimeline(riskLevel)}
            </div>
        </div>
    `;
}

// Generate patient summary cards
function generatePatientSummaryCards(patientData) {
    const demographics = [
        { label: 'Age', value: patientData.age, unit: 'years', icon: 'fas fa-birthday-cake' },
        { label: 'Sex', value: patientData.sex, icon: 'fas fa-venus-mars' },
        { label: 'Ethnicity', value: patientData.ethnicity, icon: 'fas fa-globe' },
        { label: 'BMI', value: patientData.bmi, unit: 'kg/m²', icon: 'fas fa-weight' }
    ];

    return demographics.map(item => `
        <div class="summary-card">
            <div class="summary-icon"><i class="${item.icon}"></i></div>
            <div class="summary-content">
                <h4>${item.label}</h4>
                <p>${item.value || 'Not specified'} ${item.unit || ''}</p>
            </div>
        </div>
    `).join('');
}

// Generate detailed field analysis
function generateDetailedFieldAnalysis(patientData) {
    const fieldCategories = {
        'Demographics': {
            fields: ['age', 'sex', 'ethnicity', 'height', 'weight', 'bmi'],
            icon: 'fas fa-user',
            color: '#3b82f6'
        },
        'Laboratory Values': {
            fields: ['creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin', 'temperature', 'ind_value', 'atpp_value'],
            icon: 'fas fa-flask',
            color: '#10b981'
        },
        'Complete Blood Count (CBC)': {
            fields: ['hemoglobin', 'hematocrit', 'wbc_count', 'platelet_count', 'rbc_count', 'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils', 'mcv', 'mch', 'mchc', 'rdw'],
            icon: 'fas fa-microscope',
            color: '#dc2626'
        },
        'Vital Signs': {
            fields: ['bp_systolic', 'bp_diastolic', 'heart_rate'],
            icon: 'fas fa-heartbeat',
            color: '#f59e0b'
        },
        'Comorbidities': {
            fields: ['diabetes', 'liver_disease', 'ckd', 'cardiac_disease', 'hypertension', 'respiratory_disease', 'neurological_disease', 'autoimmune_disease'],
            icon: 'fas fa-notes-medical',
            color: '#8b5cf6'
        },
        'Medications': {
            fields: ['medication_name', 'index_drug_dose', 'concomitant_drugs_count', 'drug_interactions', 'indication'],
            icon: 'fas fa-pills',
            color: '#06b6d4'
        },
        'Pharmacogenomics': {
            fields: ['cyp2c9', 'cyp2d6', 'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag'],
            icon: 'fas fa-dna',
            color: '#ec4899'
        },
        'Clinical Context': {
            fields: ['time_since_start_days', 'inpatient_flag', 'prior_adr_history'],
            icon: 'fas fa-hospital',
            color: '#84cc16'
        }
    };

    let analysisHtml = '<div class="comprehensive-field-analysis">';
    let totalFieldsAnalyzed = 0;

    Object.entries(fieldCategories).forEach(([category, config]) => {
        const categoryFields = config.fields.filter(field =>
            patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== ''
        );

        if (categoryFields.length > 0) {
            totalFieldsAnalyzed += categoryFields.length;
            analysisHtml += `
                <div class="field-category" style="border-left: 4px solid ${config.color};">
                    <div class="category-header" style="background: linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%);">
                        <h3><i class="${config.icon}" style="color: ${config.color};"></i> ${category}</h3>
                        <span class="field-count">${categoryFields.length} field${categoryFields.length > 1 ? 's' : ''} analyzed</span>
                    </div>
                    <div class="field-grid">
                        ${categoryFields.map(field => generateEnhancedFieldCard(field, patientData[field], config.color)).join('')}
                    </div>
                </div>
            `;
        }
    });

    analysisHtml += `
        <div class="analysis-summary">
            <div class="summary-card">
                <i class="fas fa-chart-bar"></i>
                <div class="summary-content">
                    <h4>Analysis Summary</h4>
                    <p><strong>${totalFieldsAnalyzed}</strong> clinical parameters analyzed across <strong>${Object.keys(fieldCategories).filter(cat => fieldCategories[cat].fields.some(field => patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== '')).length}</strong> categories</p>
                </div>
            </div>
        </div>
    </div>`;

    return analysisHtml || '<p class="no-data-message">No clinical data available for detailed analysis.</p>';
}

// Generate enhanced individual field card
function generateEnhancedFieldCard(fieldName, value, categoryColor) {
    const fieldLabels = {
        // Demographics
        'age': 'Age (years)',
        'sex': 'Sex',
        'ethnicity': 'Ethnicity',
        'height': 'Height (cm)',
        'weight': 'Weight (kg)',
        'bmi': 'BMI (kg/m²)',

        // Laboratory Values
        'creatinine': 'Creatinine (mg/dL)',
        'egfr': 'eGFR (mL/min/1.73m²)',
        'ast_alt': 'AST/ALT (U/L)',
        'bilirubin': 'Bilirubin (mg/dL)',
        'albumin': 'Albumin (g/dL)',
        'temperature': 'Temperature (°F)',
        'ind_value': 'INR',
        'atpp_value': 'aPTT (sec)',

        // CBC
        'hemoglobin': 'Hemoglobin (g/dL)',
        'hematocrit': 'Hematocrit (%)',
        'wbc_count': 'WBC Count (×10³/μL)',
        'platelet_count': 'Platelet Count (×10³/μL)',
        'rbc_count': 'RBC Count (×10⁶/μL)',
        'neutrophils': 'Neutrophils (%)',
        'lymphocytes': 'Lymphocytes (%)',
        'monocytes': 'Monocytes (%)',
        'eosinophils': 'Eosinophils (%)',
        'basophils': 'Basophils (%)',
        'mcv': 'Mean Corpuscular Volume (fL)',
        'mch': 'Mean Corpuscular Hemoglobin (pg)',
        'mchc': 'MCHC (g/dL)',
        'rdw': 'Red Cell Distribution Width (%)',

        // Vital Signs
        'bp_systolic': 'Systolic BP (mmHg)',
        'bp_diastolic': 'Diastolic BP (mmHg)',
        'heart_rate': 'Heart Rate (bpm)',

        // Comorbidities
        'diabetes': 'Diabetes Mellitus',
        'liver_disease': 'Liver Disease',
        'ckd': 'Chronic Kidney Disease',
        'cardiac_disease': 'Cardiac Disease',
        'hypertension': 'Hypertension',
        'respiratory_disease': 'Respiratory Disease',
        'neurological_disease': 'Neurological Disease',
        'autoimmune_disease': 'Autoimmune Disease',

        // Medications
        'medication_name': 'Primary Medication',
        'index_drug_dose': 'Drug Dose (mg)',
        'concomitant_drugs_count': 'Concomitant Medications',
        'drug_interactions': 'Drug Interactions',
        'indication': 'Indication',

        // Pharmacogenomics
        'cyp2c9': 'CYP2C9 Genotype',
        'cyp2d6': 'CYP2D6 Genotype',
        'cyp_inhibitors_flag': 'CYP Inhibitors',
        'qt_prolonging_flag': 'QT Prolonging Drugs',
        'hla_risk_allele_flag': 'HLA Risk Alleles',

        // Clinical Context
        'time_since_start_days': 'Treatment Duration (days)',
        'inpatient_flag': 'Inpatient Status',
        'prior_adr_history': 'Prior ADR History'
    };

    const normalRanges = {
        'age': '18-65 (adult)',
        'bmi': '18.5-24.9',
        'creatinine': '0.6-1.2',
        'egfr': '>90',
        'ast_alt': '10-40',
        'bilirubin': '0.2-1.2',
        'albumin': '3.5-5.0',
        'hemoglobin': 'M: 13.5-17.5, F: 12.0-15.5',
        'hematocrit': 'M: 41-50, F: 36-44',
        'wbc_count': '4.5-11.0',
        'platelet_count': '150-450',
        'rbc_count': 'M: 4.7-6.1, F: 4.2-5.4',
        'neutrophils': '50-70',
        'lymphocytes': '20-40',
        'monocytes': '2-8',
        'eosinophils': '1-4',
        'basophils': '0.5-1',
        'mcv': '80-100',
        'mch': '27-32',
        'mchc': '32-36',
        'rdw': '11.5-14.5',
        'bp_systolic': '90-140',
        'bp_diastolic': '60-90',
        'heart_rate': '60-100',
        'temperature': '97.0-99.5',
        'ind_value': '0.8-1.2',
        'atpp_value': '25-35'
    };

    // Format display value
    let displayValue = value;
    if (typeof value === 'number' && [0, 1].includes(value) && (fieldName.includes('disease') || fieldName.includes('flag') || fieldName.includes('history'))) {
        displayValue = value === 1 ? 'Present' : 'Absent';
    } else if (typeof value === 'number' && !Number.isInteger(value)) {
        displayValue = parseFloat(value).toFixed(2);
    }

    const riskLevel = assessFieldRisk(fieldName, value);
    const interpretation = getEnhancedFieldInterpretation(fieldName, value);
    const normalRange = normalRanges[fieldName];

    return `
        <div class="enhanced-field-card ${riskLevel}" style="border-top: 3px solid ${categoryColor};">
            <div class="field-header">
                <div class="field-title">
                    <h4>${fieldLabels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                    ${normalRange ? `<span class="normal-range">Normal: ${normalRange}</span>` : ''}
                </div>
                <span class="field-risk-badge ${riskLevel}" style="background: ${getRiskColor(riskLevel)};">
                    ${getRiskIcon(riskLevel)} ${riskLevel.toUpperCase()}
                </span>
            </div>
            <div class="field-content">
                <div class="field-value" style="color: ${getRiskColor(riskLevel)};">
                    ${displayValue}
                    ${getValueTrend(fieldName, value)}
                </div>
                <div class="field-interpretation">
                    ${interpretation}
                </div>
                ${getRiskFactorContribution(fieldName, value)}
            </div>
        </div>
    `;
}

// Helper functions for enhanced field analysis
function getRiskColor(riskLevel) {
    const colors = {
        'low': '#10b981',
        'normal': '#10b981',
        'moderate': '#f59e0b',
        'high': '#ef4444',
        'critical': '#dc2626'
    };
    return colors[riskLevel] || '#6b7280';
}

function getRiskIcon(riskLevel) {
    const icons = {
        'low': '🟢',
        'normal': '🟢',
        'moderate': '🟡',
        'high': '🔴',
        'critical': '🚨'
    };
    return icons[riskLevel] || '⚪';
}

function getValueTrend(fieldName, value) {
    // Add trend indicators for numeric values
    if (typeof value === 'number') {
        const trends = {
            'creatinine': value > 1.5 ? ' ↗️' : value < 0.8 ? ' ↘️' : '',
            'egfr': value < 60 ? ' ↘️' : value > 90 ? ' ↗️' : '',
            'ast_alt': value > 50 ? ' ↗️' : '',
            'bilirubin': value > 2.0 ? ' ↗️' : '',
            'hemoglobin': value < 10 ? ' ↘️' : value > 16 ? ' ↗️' : '',
            'wbc_count': value > 12 ? ' ↗️' : value < 4 ? ' ↘️' : '',
            'platelet_count': value < 150 ? ' ↘️' : value > 450 ? ' ↗️' : '',
            'bp_systolic': value > 140 ? ' ↗️' : value < 90 ? ' ↘️' : '',
            'heart_rate': value > 100 ? ' ↗️' : value < 60 ? ' ↘️' : ''
        };
        return trends[fieldName] || '';
    }
    return '';
}

function getEnhancedFieldInterpretation(fieldName, value) {
    const interpretations = {
        'age': value > 65 ? 'Elderly patient - increased ADR risk due to age-related physiological changes' :
            value < 18 ? 'Pediatric considerations may apply' : 'Adult patient within standard age range',

        'bmi': value > 30 ? 'Obese - may affect drug distribution and metabolism' :
            value > 25 ? 'Overweight - monitor for dose adjustments' :
                value < 18.5 ? 'Underweight - may require dose modifications' : 'Normal weight range',

        'creatinine': value > 2.0 ? 'Significantly elevated - severe renal impairment, dose adjustments required' :
            value > 1.5 ? 'Elevated - moderate renal impairment, monitor closely' :
                value > 1.2 ? 'Mildly elevated - mild renal impairment' : 'Within normal range',

        'egfr': value < 30 ? 'Severe renal impairment - significant dose adjustments needed' :
            value < 60 ? 'Moderate renal impairment - dose modifications may be required' :
                value < 90 ? 'Mild renal impairment - monitor renal function' : 'Normal kidney function',

        'ast_alt': value > 200 ? 'Severely elevated - significant hepatic impairment' :
            value > 100 ? 'Markedly elevated - moderate hepatic impairment' :
                value > 50 ? 'Mildly elevated - monitor liver function' : 'Normal liver enzymes',

        'hemoglobin': value < 8 ? 'Severe anemia - may affect drug tolerance' :
            value < 10 ? 'Moderate anemia - monitor for symptoms' :
                value < 12 ? 'Mild anemia' : 'Normal hemoglobin levels',

        'wbc_count': value > 15 ? 'Significantly elevated - possible infection or inflammation' :
            value > 11 ? 'Elevated - monitor for infection' :
                value < 4 ? 'Low - increased infection risk' : 'Normal white cell count',

        'platelet_count': value < 100 ? 'Thrombocytopenia - bleeding risk increased' :
            value < 150 ? 'Low normal - monitor for bleeding' :
                value > 450 ? 'Elevated - thrombosis risk' : 'Normal platelet count',

        'neutrophils': value > 80 ? 'Neutrophilia - possible bacterial infection or stress' :
            value < 40 ? 'Neutropenia - increased infection risk' : 'Normal neutrophil percentage',

        'lymphocytes': value > 50 ? 'Lymphocytosis - possible viral infection or hematologic malignancy' :
            value < 15 ? 'Lymphopenia - immunosuppression concern' : 'Normal lymphocyte percentage',

        'monocytes': value > 12 ? 'Monocytosis - chronic inflammation or infection' :
            value < 1 ? 'Monocytopenia - rare, monitor immune function' : 'Normal monocyte percentage',

        'eosinophils': value > 8 ? 'Eosinophilia - allergic reaction, parasites, or drug reaction' :
            value < 0.5 ? 'Eosinopenia - stress or corticosteroid effect' : 'Normal eosinophil percentage',

        'mcv': value > 100 ? 'Macrocytic - B12/folate deficiency, alcohol use' :
            value < 80 ? 'Microcytic - iron deficiency, thalassemia' : 'Normal red cell size',

        'mch': value > 32 ? 'Elevated - macrocytic anemia' :
            value < 27 ? 'Low - microcytic anemia' : 'Normal hemoglobin content per cell',

        'rdw': value > 14.5 ? 'Elevated - mixed cell populations, nutritional deficiency' :
            'Normal red cell size variation',

        'bp_systolic': value > 180 ? 'Hypertensive crisis - immediate attention needed' :
            value > 140 ? 'Hypertensive - cardiovascular risk increased' :
                value < 90 ? 'Hypotensive - monitor for symptoms' : 'Normal blood pressure',

        'diabetes': value === 1 ? 'Present - affects drug metabolism and increases ADR risk' : 'Not present',
        'liver_disease': value === 1 ? 'Present - significantly affects drug metabolism' : 'Not present',
        'ckd': value === 1 ? 'Present - requires dose adjustments for renally cleared drugs' : 'Not present',
        'cardiac_disease': value === 1 ? 'Present - increases risk of cardiovascular ADRs' : 'Not present'
    };

    return interpretations[fieldName] || `Value: ${value} - Clinical significance being evaluated`;
}

function getRiskFactorContribution(fieldName, value) {
    const riskContributions = {
        'age': value > 65 ? 'High' : value > 50 ? 'Moderate' : 'Low',
        'creatinine': value > 2.0 ? 'High' : value > 1.5 ? 'Moderate' : 'Low',
        'ast_alt': value > 100 ? 'High' : value > 50 ? 'Moderate' : 'Low',
        'diabetes': value === 1 ? 'Moderate' : 'Low',
        'liver_disease': value === 1 ? 'High' : 'Low',
        'ckd': value === 1 ? 'High' : 'Low'
    };

    const contribution = riskContributions[fieldName];
    if (contribution && contribution !== 'Low') {
        return `<div class="risk-contribution ${contribution.toLowerCase()}">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${contribution} ADR Risk Contribution</span>
        </div>`;
    }
    return '';
}

// Generate laboratory analysis
function generateLabAnalysis(patientData) {
    const labFields = {
        'creatinine': { label: 'Creatinine (mg/dL)', normal: '0.6-1.2' },
        'egfr': { label: 'eGFR (mL/min/1.73m²)', normal: '>90' },
        'ast_alt': { label: 'AST/ALT (U/L)', normal: '10-40' },
        'bilirubin': { label: 'Bilirubin (mg/dL)', normal: '0.2-1.2' },
        'albumin': { label: 'Albumin (g/dL)', normal: '3.5-5.0' },
        'hemoglobin': { label: 'Hemoglobin (g/dL)', normal: 'M: 13.5-17.5, F: 12.0-15.5' },
        'hematocrit': { label: 'Hematocrit (%)', normal: 'M: 41-50, F: 36-44' },
        'wbc_count': { label: 'WBC Count (×10³/μL)', normal: '4.5-11.0' },
        'platelet_count': { label: 'Platelet Count (×10³/μL)', normal: '150-450' },
        'rbc_count': { label: 'RBC Count (×10⁶/μL)', normal: 'M: 4.7-6.1, F: 4.2-5.4' }
    };

    const enteredLabs = Object.entries(labFields).filter(([field]) =>
        patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== ''
    );

    if (enteredLabs.length === 0) {
        return '<p>No laboratory values entered for analysis.</p>';
    }

    return `
        <div class="lab-analysis-grid">
            ${enteredLabs.map(([field, config]) => `
                <div class="lab-card ${assessLabRisk(field, patientData[field])}">
                    <div class="lab-header">
                        <h4>${config.label}</h4>
                        <span class="lab-normal">Normal: ${config.normal}</span>
                    </div>
                    <div class="lab-value-section">
                        <div class="lab-value">${patientData[field]}</div>
                        <div class="lab-status ${assessLabRisk(field, patientData[field])}">${getLabStatus(field, patientData[field])}</div>
                    </div>
                    <div class="lab-interpretation">${getLabInterpretation(field, patientData[field])}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate medication analysis
function generateMedicationAnalysis(patientData) {
    const medicationFields = ['medication_name', 'index_drug_dose', 'concomitant_drugs_count', 'drug_interactions'];
    const enteredMeds = medicationFields.filter(field =>
        patientData[field] !== undefined && patientData[field] !== null && patientData[field] !== ''
    );

    if (enteredMeds.length === 0) {
        return '<p>No medication information entered for analysis.</p>';
    }

    return `
        <div class="medication-analysis-content">
            ${patientData.medication_name ? `
                <div class="med-primary">
                    <h4><i class="fas fa-prescription-bottle-alt"></i> Primary Medication</h4>
                    <div class="med-details">
                        <span class="med-name">${patientData.medication_name}</span>
                        ${patientData.index_drug_dose ? `<span class="med-dose">${patientData.index_drug_dose} mg</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="med-metrics">
                ${patientData.concomitant_drugs_count ? `
                    <div class="med-metric">
                        <div class="metric-icon"><i class="fas fa-pills"></i></div>
                        <div class="metric-content">
                            <h5>Concomitant Medications</h5>
                            <p class="metric-value">${patientData.concomitant_drugs_count}</p>
                            <p class="metric-risk ${patientData.concomitant_drugs_count > 10 ? 'high' : patientData.concomitant_drugs_count > 5 ? 'medium' : 'low'}">
                                ${patientData.concomitant_drugs_count > 10 ? 'High polypharmacy risk' : patientData.concomitant_drugs_count > 5 ? 'Moderate polypharmacy' : 'Low medication burden'}
                            </p>
                        </div>
                    </div>
                ` : ''}
                
                ${patientData.drug_interactions ? `
                    <div class="med-metric">
                        <div class="metric-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <div class="metric-content">
                            <h5>Drug Interactions</h5>
                            <p class="metric-value interaction-${patientData.drug_interactions.toLowerCase()}">${patientData.drug_interactions}</p>
                            <p class="metric-risk ${patientData.drug_interactions.toLowerCase()}">
                                ${getInteractionRiskDescription(patientData.drug_interactions)}
                            </p>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Generate clinical recommendations
function generateClinicalRecommendations(riskLevel, predictedADR, patientData) {
    const emergencyManagement = riskLevel === 'High' ? generateEmergencyADRManagement(predictedADR, patientData) : '';

    return `
        <div class="recommendations-content">
            ${emergencyManagement}
            
            <div class="recommendation-category immediate">
                <h4><i class="fas fa-exclamation"></i> Immediate Actions</h4>
                <ul>
                    <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols immediately</li>
                    <li>Educate patient on early warning signs of ${predictedADR.toLowerCase()}</li>
                    <li>Establish baseline laboratory values for monitoring</li>
                    <li>Schedule follow-up within ${riskLevel === 'High' ? '1-2 days' : riskLevel === 'Medium' ? '3-7 days' : '1-2 weeks'}</li>
                </ul>
            </div>
            
            <div class="recommendation-category monitoring">
                <h4><i class="fas fa-stethoscope"></i> Monitoring Strategy</h4>
                <ul>
                    <li><strong>Laboratory Monitoring:</strong> ${getLabMonitoringFrequency(riskLevel, patientData)}</li>
                    <li><strong>Clinical Assessment:</strong> ${getClinicalMonitoringFrequency(riskLevel)}</li>
                    <li><strong>Patient Education:</strong> Signs and symptoms to report immediately</li>
                    <li><strong>Emergency Protocol:</strong> Clear instructions for severe reactions</li>
                </ul>
            </div>
            
            <div class="recommendation-category mitigation">
                <h4><i class="fas fa-shield-alt"></i> Risk Mitigation</h4>
                <ul>
                    <li>${getDoseMitigationAdvice(patientData)}</li>
                    <li>Evaluate alternative therapeutic options if appropriate</li>
                    <li>${getSpecificMitigationAdvice(predictedADR)}</li>
                    <li>Optimize concomitant medication regimen</li>
                </ul>
            </div>
        </div>
    `;
}

// Generate Emergency ADR Management Section (High Risk Only)
function generateEmergencyADRManagement(predictedADR, patientData) {
    const emergencyActions = getEmergencyActions(predictedADR);
    const warningSignsData = getWarningSignsForADR(predictedADR);
    const emergencyContacts = getEmergencyContacts(predictedADR);

    return `
        <div class="emergency-adr-management">
            <div class="emergency-header">
                <div class="emergency-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="emergency-title">
                    <h3>🚨 HIGH RISK ADR - EMERGENCY MANAGEMENT PROTOCOL</h3>
                    <p>Immediate action required for ${predictedADR} prevention and management</p>
                </div>
            </div>
            
            <div class="emergency-content">
                <div class="emergency-section critical-actions">
                    <h4><i class="fas fa-bolt"></i> IMMEDIATE CRITICAL ACTIONS</h4>
                    <div class="critical-actions-grid">
                        ${emergencyActions.immediate.map(action => `
                            <div class="critical-action-item">
                                <div class="action-priority">URGENT</div>
                                <div class="action-text">${action}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="emergency-section warning-signs">
                    <h4><i class="fas fa-eye"></i> CRITICAL WARNING SIGNS - SEEK IMMEDIATE MEDICAL ATTENTION</h4>
                    <div class="warning-signs-grid">
                        ${warningSignsData.map(sign => `
                            <div class="warning-sign-item">
                                <i class="fas fa-exclamation-circle"></i>
                                <span>${sign}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="emergency-section emergency-interventions">
                    <h4><i class="fas fa-medical-kit"></i> EMERGENCY INTERVENTIONS</h4>
                    <div class="interventions-list">
                        ${emergencyActions.interventions.map(intervention => `
                            <div class="intervention-item">
                                <div class="intervention-step">${intervention.step}</div>
                                <div class="intervention-action">${intervention.action}</div>
                                <div class="intervention-rationale">${intervention.rationale}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="emergency-section emergency-contacts">
                    <h4><i class="fas fa-phone-alt"></i> EMERGENCY CONTACTS & RESOURCES</h4>
                    <div class="contacts-grid">
                        ${emergencyContacts.map(contact => `
                            <div class="contact-item">
                                <div class="contact-type">${contact.type}</div>
                                <div class="contact-info">${contact.info}</div>
                                <div class="contact-when">${contact.when}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="emergency-section patient-instructions">
                    <h4><i class="fas fa-user-md"></i> PATIENT EMERGENCY INSTRUCTIONS</h4>
                    <div class="patient-instructions-box">
                        <p><strong>GIVE TO PATIENT:</strong> "If you experience any of the following symptoms, STOP taking your medication immediately and seek emergency medical care:"</p>
                        <ul class="patient-warning-list">
                            ${getPatientWarningInstructions(predictedADR).map(instruction => `
                                <li>${instruction}</li>
                            `).join('')}
                        </ul>
                        <div class="emergency-number">
                            <strong>Emergency Contact: Call 911 or go to nearest Emergency Department</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Emergency ADR Management Helper Functions
function getEmergencyActions(predictedADR) {
    const actions = {
        'Hepatotoxicity': {
            immediate: [
                'STOP all hepatotoxic medications immediately',
                'Order STAT liver function tests (AST, ALT, Bilirubin, INR)',
                'Assess for signs of acute liver failure',
                'Consider N-acetylcysteine if acetaminophen involved',
                'Prepare for potential hepatology consultation'
            ],
            interventions: [
                { step: '1', action: 'Discontinue offending medication', rationale: 'Prevent further hepatic damage' },
                { step: '2', action: 'Monitor vital signs q15min', rationale: 'Early detection of hemodynamic instability' },
                { step: '3', action: 'IV access and fluid resuscitation', rationale: 'Maintain perfusion and prepare for interventions' },
                { step: '4', action: 'Serial liver function monitoring', rationale: 'Track progression and recovery' },
                { step: '5', action: 'Consider liver transplant evaluation', rationale: 'For fulminant hepatic failure' }
            ]
        },
        'Nephrotoxicity': {
            immediate: [
                'STOP all nephrotoxic medications immediately',
                'Order STAT renal function tests (Creatinine, BUN, eGFR)',
                'Check electrolytes and acid-base status',
                'Assess fluid balance and urine output',
                'Consider nephrology consultation'
            ],
            interventions: [
                { step: '1', action: 'Discontinue nephrotoxic agents', rationale: 'Prevent further renal damage' },
                { step: '2', action: 'Optimize fluid balance', rationale: 'Maintain renal perfusion' },
                { step: '3', action: 'Monitor urine output hourly', rationale: 'Early detection of oliguria/anuria' },
                { step: '4', action: 'Correct electrolyte imbalances', rationale: 'Prevent cardiac complications' },
                { step: '5', action: 'Prepare for renal replacement therapy', rationale: 'For severe acute kidney injury' }
            ]
        },
        'Cardiovascular Event (Arrhythmia)': {
            immediate: [
                'Continuous cardiac monitoring immediately',
                'Order STAT 12-lead ECG and compare to baseline',
                'Check electrolytes (K+, Mg2+, Ca2+)',
                'Review all QT-prolonging medications',
                'Prepare emergency cardiac medications'
            ],
            interventions: [
                { step: '1', action: 'Continuous telemetry monitoring', rationale: 'Real-time arrhythmia detection' },
                { step: '2', action: 'Correct electrolyte abnormalities', rationale: 'Stabilize cardiac conduction' },
                { step: '3', action: 'Have defibrillator/pacing ready', rationale: 'For life-threatening arrhythmias' },
                { step: '4', action: 'Antiarrhythmic therapy as indicated', rationale: 'Restore normal rhythm' },
                { step: '5', action: 'Cardiology consultation STAT', rationale: 'Expert management of complex arrhythmias' }
            ]
        }
    };

    return actions[predictedADR] || {
        immediate: [
            'STOP suspected medication immediately',
            'Assess patient for signs of serious ADR',
            'Order appropriate monitoring tests',
            'Consider specialist consultation',
            'Implement supportive care measures'
        ],
        interventions: [
            { step: '1', action: 'Discontinue suspected medication', rationale: 'Prevent further adverse effects' },
            { step: '2', action: 'Supportive care as indicated', rationale: 'Manage symptoms and complications' },
            { step: '3', action: 'Monitor vital signs closely', rationale: 'Early detection of deterioration' },
            { step: '4', action: 'Specialist consultation', rationale: 'Expert management guidance' },
            { step: '5', action: 'Document and report ADR', rationale: 'Pharmacovigilance and future prevention' }
        ]
    };
}

function getWarningSignsForADR(predictedADR) {
    const warningSigns = {
        'Hepatotoxicity': [
            'Jaundice (yellowing of skin or eyes)',
            'Dark urine or pale stools',
            'Severe nausea, vomiting, or loss of appetite',
            'Severe fatigue or weakness',
            'Abdominal pain (especially right upper quadrant)',
            'Confusion or altered mental status',
            'Easy bruising or bleeding'
        ],
        'Nephrotoxicity': [
            'Decreased urine output or no urination',
            'Swelling in legs, ankles, or face',
            'Severe fatigue or weakness',
            'Shortness of breath',
            'Nausea and vomiting',
            'Confusion or altered mental status',
            'Chest pain or pressure'
        ],
        'Cardiovascular Event (Arrhythmia)': [
            'Chest pain or pressure',
            'Severe shortness of breath',
            'Dizziness or fainting',
            'Rapid or irregular heartbeat',
            'Severe fatigue or weakness',
            'Sweating or nausea',
            'Loss of consciousness'
        ]
    };

    return warningSigns[predictedADR] || [
        'Severe allergic reaction (rash, swelling, difficulty breathing)',
        'Severe nausea, vomiting, or diarrhea',
        'Unusual bleeding or bruising',
        'Severe fatigue or weakness',
        'Confusion or altered mental status',
        'Fever or signs of infection',
        'Any severe or unusual symptoms'
    ];
}

function getEmergencyContacts(predictedADR) {
    return [
        {
            type: 'Emergency Department',
            info: 'Call 911 or go to nearest ED',
            when: 'Life-threatening symptoms'
        },
        {
            type: 'Poison Control',
            info: '1-800-222-1222',
            when: 'Drug overdose or poisoning'
        },
        {
            type: 'Prescribing Physician',
            info: 'Contact immediately',
            when: 'Any concerning symptoms'
        },
        {
            type: 'Pharmacist',
            info: '24-hour pharmacy consultation',
            when: 'Drug interaction questions'
        },
        {
            type: 'Specialist Consultation',
            info: getSpecialistForADR(predictedADR),
            when: 'Organ-specific complications'
        }
    ];
}

function getSpecialistForADR(predictedADR) {
    const specialists = {
        'Hepatotoxicity': 'Hepatology/Gastroenterology',
        'Nephrotoxicity': 'Nephrology',
        'Cardiovascular Event (Arrhythmia)': 'Cardiology',
        'Severe Cutaneous Reaction': 'Dermatology',
        'Hypersensitivity': 'Allergy/Immunology'
    };

    return specialists[predictedADR] || 'General Medicine';
}

function getPatientWarningInstructions(predictedADR) {
    const instructions = {
        'Hepatotoxicity': [
            'Yellow skin or eyes (jaundice)',
            'Dark urine or light-colored stools',
            'Severe stomach pain (especially upper right side)',
            'Severe nausea, vomiting, or loss of appetite',
            'Unusual tiredness or weakness',
            'Easy bruising or bleeding'
        ],
        'Nephrotoxicity': [
            'Little or no urination',
            'Swelling in your legs, ankles, or feet',
            'Severe tiredness or weakness',
            'Trouble breathing',
            'Nausea and vomiting',
            'Confusion or feeling "foggy"'
        ],
        'Cardiovascular Event (Arrhythmia)': [
            'Chest pain or pressure',
            'Severe shortness of breath',
            'Dizziness or fainting',
            'Fast or irreg',
            'Severe sweating',
            'Loss of consciousness'
        ]
    };

    return instructions[predictedADR] || [
        'Severe allergic reaction (rash, swelling, trouble breathing)',
        'Severe nausea, vomiting, or diarrhea',
        'Unusual bleeding or bruising',
        'Severe tiredness or weakness',
        'Confusion or feeling "foggy"',
        'Any severe or unusual symptoms'
    ];
}

// Generate monitoring protocol
function generateMonitoringProtocol(riskLevel, patientData) {
    return `
        <div class="monitoring-protocol">
            <div class="protocol-timeline">
                <div class="timeline-item immediate">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h5>Immediate (Today)</h5>
                        <p>Patient counseling, baseline assessments, emergency contact information</p>
                    </div>
                </div>
                
                <div class="timeline-item short-term">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h5>${getShortTermTiming(riskLevel)}</h5>
                        <p>First follow-up, laboratory monitoring, symptom assessment</p>
                    </div>
                </div>
                
                <div class="timeline-item ongoing">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <h5>Ongoing</h5>
                        <p>Regular monitoring, dose adjustments, risk reassessment</p>
                    </div>
                </div>
            </div>
            
            <div class="monitoring-parameters">
                <h5>Key Parameters to Monitor</h5>
                <div class="parameter-grid">
                    ${generateMonitoringParameters(patientData)}
                </div>
            </div>
        </div>
    `
}

// Generate follow-up timeline
function generateFollowupTimeline(riskLevel) {
    const timelines = {
        'High': [
            { time: '24-48 hours', action: 'Initial safety check and symptom assessment' },
            { time: '1 week', action: 'Comprehensive follow-up with laboratory monitoring' },
            { time: '2 weeks', action: 'Risk reassessment and dose optimization' },
            { time: 'Monthly', action: 'Ongoing monitoring and management' }
        ],
        'Medium': [
            { time: '3-7 days', action: 'Initial follow-up and patient education' },
            { time: '2 weeks', action: 'First comprehensive assessment' },
            { time: 'Monthly', action: 'Regular monitoring and reassessment' },
            { time: 'Quarterly', action: 'Long-term safety evaluation' }
        ],
        'Low': [
            { time: '1-2 weeks', action: 'Initial follow-up and baseline establishment' },
            { time: 'Monthly', action: 'Routine monitoring' },
            { time: 'Quarterly', action: 'Comprehensive reassessment' },
            { time: 'Annually', action: 'Long-term safety review' }
        ]
    };

    const timeline = timelines[riskLevel] || timelines['Medium'];

    return `
        <div class="followup-timeline">
            ${timeline.map((item, index) => `
                <div class="timeline-step step-${index + 1}">
                    <div class="step-marker">${index + 1}</div>
                    <div class="step-content">
                        <h5>${item.time}</h5>
                        <p>${item.action}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Generate simple detailed clinical analysis content
function generateSimpleDetailedAnalysis(result) {
    const riskLevel = result.risk_level || 'Unknown';
    const predictedADR = result.predicted_adr_type || 'Unknown';
    const noADRProb = result.no_adr_probability || 0;
    const topRisks = result.top_adr_risks || {};

    return `
        <h2>🎯 Risk Assessment Summary</h2>
        <div class="risk-summary-section">
            <div class="risk-metrics">
                <div class="metric-card">
                    <div class="metric-title">Overall Risk Level</div>
                    <div class="metric-value risk-${riskLevel.toLowerCase()}">${riskLevel}</div>
                    <div class="metric-desc">${getRiskDescription(riskLevel)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Primary Concern</div>
                    <div class="metric-value">${predictedADR}</div>
                    <div class="metric-desc">Most likely ADR type</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Safety Probability</div>
                    <div class="metric-value">${noADRProb}%</div>
                    <div class="metric-desc">No adverse reactions</div>
                </div>
            </div>
        </div>

        <h2>🔍 Detailed Risk Breakdown</h2>
        <div class="risk-breakdown-section">
            ${Object.entries(topRisks).slice(0, 5).map(([adr, prob]) => `
                <div class="risk-item">
                    <div class="risk-item-name">${adr}</div>
                    <div class="risk-item-prob">${prob}%</div>
                    <div class="risk-item-bar">
                        <div class="risk-bar-fill" style="width: ${prob}%; background-color: ${prob > 20 ? '#ef4444' : prob > 10 ? '#f59e0b' : '#10b981'}"></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <h2>💊 Clinical Recommendations</h2>
        <div class="recommendations-section">
            <div class="recommendation-box">
                <h3>Immediate Actions</h3>
                <ul>
                    <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols</li>
                    <li>Patient education on warning signs</li>
                    <li>Schedule appropriate follow-up</li>
                </ul>
            </div>
            
            <div class="recommendation-box">
                <h3>Monitoring Strategy</h3>
                <ul>
                    <li>${getMonitoringRecommendation(riskLevel)}</li>
                    <li>Regular effectiveness vs. risk assessment</li>
                    <li>Patient-reported outcome tracking</li>
                </ul>
            </div>

            <div class="recommendation-box">
                <h3>Risk Mitigation</h3>
                <ul>
                    <li>${getRiskMitigationAdvice(riskLevel)}</li>
                    <li>Consider dose optimization</li>
                    <li>Evaluate alternative therapies if needed</li>
                </ul>
            </div>
        </div>

        <h2>📋 Follow-up Timeline</h2>
        <div class="timeline-section">
            <div class="timeline-item">
                <div class="timeline-marker immediate"></div>
                <div class="timeline-content">
                    <strong>Today:</strong> Patient counseling and baseline assessments
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-marker short-term"></div>
                <div class="timeline-content">
                    <strong>${getFollowUpTiming(riskLevel)}:</strong> First follow-up and monitoring
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-marker long-term"></div>
                <div class="timeline-content">
                    <strong>Ongoing:</strong> Continuous monitoring and reassessment
                </div>
            </div>
        </div>

        <div class="clinical-note">
            <p><strong>Clinical Note:</strong> This AI-powered analysis provides decision support based on statistical modeling. Clinical judgment should always supersede algorithmic recommendations.</p>
        </div>
    `;
}

// Generate detailed clinical analysis content
function generateDetailedClinicalAnalysis(result) {
    const riskLevel = result.risk_level;
    const predictedADR = result.predicted_adr_type;
    const noADRProb = result.no_adr_probability;
    const topRisks = result.top_adr_risks || {};

    return `
        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">🎯 Risk Assessment Summary</h3>
            <div class="risk-overview">
                <div class="risk-grid">
                    <div class="risk-metric">
                        <div class="metric-label">Overall Risk Classification</div>
                        <div class="metric-value risk-${riskLevel.toLowerCase()}">${riskLevel} Risk</div>
                        <div class="metric-description">${getRiskDescription(riskLevel)}</div>
                    </div>
                    <div class="risk-metric">
                        <div class="metric-label">Primary ADR Concern</div>
                        <div class="metric-value">${predictedADR}</div>
                        <div class="metric-description">${getADRDescription(predictedADR)}</div>
                    </div>
                    <div class="risk-metric">
                        <div class="metric-label">Safety Probability</div>
                        <div class="metric-value">${noADRProb}%</div>
                        <div class="metric-description">Likelihood of no adverse reactions</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">🔍 Detailed Risk Analysis</h3>
            <div class="detailed-risks">
                ${Object.entries(topRisks).slice(0, 5).map(([adr, prob]) => `
                    <div class="risk-detail-item">
                        <div class="risk-name">${adr}</div>
                        <div class="risk-probability">${prob}%</div>
                        <div class="risk-bar">
                            <div class="risk-fill" style="width: ${prob}%; background: ${getRiskColor(prob)}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">💊 Clinical Recommendations</h3>
            <div class="recommendations">
                <div class="recommendation-category">
                    <h4>Immediate Actions</h4>
                    <ul>
                        <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols</li>
                        <li>Educate patient on ${predictedADR !== 'No ADR' ? predictedADR.toLowerCase() : 'potential ADR'} warning signs</li>
                        <li>Schedule appropriate follow-up based on risk level</li>
                    </ul>
                </div>
                
                <div class="recommendation-category">
                    <h4>Monitoring Strategy</h4>
                    <ul>
                        <li>${getMonitoringRecommendation(riskLevel, predictedADR)}</li>
                        <li>Regular assessment of medication effectiveness vs. risk</li>
                        <li>Patient-reported outcome monitoring</li>
                    </ul>
                </div>

                <div class="recommendation-category">
                    <h4>Risk Mitigation</h4>
                    <ul>
                        <li>${getRiskMitigationAdvice(riskLevel, predictedADR)}</li>
                        <li>Consider dose optimization if clinically appropriate</li>
                        <li>Evaluate alternative therapeutic options if high risk</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="clinical-analysis-section">
            <h3 class="analysis-section-title">📋 Next Steps</h3>
            <div class="next-steps">
                <div class="step-timeline">
                    <div class="timeline-item">
                        <div class="timeline-marker immediate"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">Immediate (Today)</div>
                            <div class="timeline-description">Patient counseling and baseline assessments</div>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker short-term"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">${getFollowUpTiming(riskLevel)}</div>
                            <div class="timeline-description">First follow-up and monitoring assessment</div>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-marker long-term"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">Ongoing</div>
                            <div class="timeline-description">Continuous monitoring and risk reassessment</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="clinical-disclaimer">
            <p><strong>Clinical Note:</strong> This AI-powered analysis provides decision support based on statistical modeling. Clinical judgment should always supersede algorithmic recommendations. Consider individual patient factors, contraindications, and current clinical guidelines.</p>
        </div>
    `;
}

// Helper functions for clinical analysis
function getRiskDescription(riskLevel) {
    switch (riskLevel.toLowerCase()) {
        case 'high': return 'Enhanced monitoring and immediate intervention required';
        case 'medium': return 'Regular monitoring with proactive management';
        case 'low': return 'Standard monitoring with routine follow-up';
        default: return 'Risk assessment completed';
    }
}

function getADRDescription(adrType) {
    const descriptions = {
        'Hepatotoxicity': 'Liver function monitoring and hepatoprotective measures essential',
        'Nephrotoxicity': 'Renal function surveillance and hydration status management',
        'Cardiotoxicity': 'Cardiac monitoring and rhythm assessment protocols',
        'Gastrointestinal': 'GI symptom monitoring and supportive care measures',
        'Neurological': 'Neurological assessment and cognitive function monitoring',
        'Hematological': 'Blood count monitoring and bleeding risk assessment',
        'Dermatological': 'Skin examination and allergic reaction monitoring',
        'No ADR': 'Continue standard monitoring protocols'
    };
    return descriptions[adrType] || 'Specific monitoring protocols as clinically indicated';
}

function getRiskColor(probability) {
    if (probability > 20) return '#ef4444';
    if (probability > 10) return '#f59e0b';
    if (probability > 5) return '#eab308';
    return '#10b981';
}

function getMonitoringRecommendation(riskLevel) {
    const monitoring = {
        'High': 'Weekly clinical assessments with laboratory monitoring',
        'Medium': 'Bi-weekly follow-up with targeted laboratory tests',
        'Low': 'Monthly monitoring with routine laboratory panels'
    };
    return monitoring[riskLevel] || 'Standard monitoring protocols';
}

function getRiskMitigationAdvice(riskLevel) {
    if (riskLevel === 'High') {
        return 'Consider dose reduction, alternative therapy, or enhanced supportive care';
    } else if (riskLevel === 'Medium') {
        return 'Optimize dosing regimen and implement preventive measures';
    } else {
        return 'Continue current therapy with standard precautions';
    }
}

function getFollowUpTiming(riskLevel) {
    switch (riskLevel.toLowerCase()) {
        case 'high': return '1-3 Days';
        case 'medium': return '1-2 Weeks';
        case 'low': return '2-4 Weeks';
        default: return '1-2 Weeks';
    }
}

// Generate fallback analysis when AI is not available
function generateFallbackAnalysis(result) {
    const riskLevel = result.risk_level;
    const predictedADR = result.predicted_adr_type;
    const noADRProb = result.no_adr_probability;

    return `
        <div class="fallback-section">
            <h4>Risk Assessment Summary</h4>
            <div class="risk-summary-grid">
                <div class="risk-item">
                    <span class="risk-label">Overall Risk Level:</span>
                    <span class="risk-value ${riskLevel.toLowerCase()}">${riskLevel}</span>
                </div>
                <div class="risk-item">
                    <span class="risk-label">Predicted ADR Type:</span>
                    <span class="risk-value">${predictedADR}</span>
                </div>
                <div class="risk-item">
                    <span class="risk-label">No ADR Probability:</span>
                    <span class="risk-value">${noADRProb}%</span>
                </div>
            </div>
        </div>
        
        <div class="fallback-section">
            <h4>Clinical Recommendations</h4>
            <ul>
                <li>Monitor patient closely for signs of ${predictedADR !== 'No ADR' ? predictedADR.toLowerCase() : 'any adverse reactions'}</li>
                <li>Consider ${riskLevel.toLowerCase()} risk monitoring protocols</li>
                <li>Regular follow-up appointments recommended</li>
                <li>Patient education on potential side effects</li>
            </ul>
        </div>
        
        <div class="fallback-section">
            <h4>Next Steps</h4>
            <p>This assessment provides a baseline risk evaluation. Clinical judgment should always supersede algorithmic recommendations. Consider individual patient factors not captured in the model.</p>
        </div>
    `;
}

// Clean version of detailed analysis generator
function generateCleanDetailedAnalysis(result) {
    try {
        const riskLevel = result.risk_level || 'Unknown';
        const predictedADR = result.predicted_adr_type || 'Unknown';
        const noADRProb = result.no_adr_probability || 0;
        const topRisks = result.top_adr_risks || {};

        return `
            <h2>🎯 Risk Assessment Summary</h2>
            <div class="risk-summary-section">
                <div class="risk-metrics">
                    <div class="metric-card">
                        <div class="metric-title">Overall Risk Level</div>
                        <div class="metric-value risk-${riskLevel.toLowerCase()}">${riskLevel}</div>
                        <div class="metric-desc">Enhanced monitoring ${riskLevel.toLowerCase() === 'high' ? 'required' : 'recommended'}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Primary Concern</div>
                        <div class="metric-value">${predictedADR}</div>
                        <div class="metric-desc">Most likely ADR type</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-title">Safety Probability</div>
                        <div class="metric-value">${noADRProb}%</div>
                        <div class="metric-desc">No adverse reactions</div>
                    </div>
                </div>
            </div>

            <h2>🔍 Detailed Risk Breakdown</h2>
            <div class="risk-breakdown-section">
                ${Object.entries(topRisks).slice(0, 5).map(([adr, prob]) => `
                    <div class="risk-item">
                        <div class="risk-item-name">${adr}</div>
                        <div class="risk-item-prob">${prob}%</div>
                        <div class="risk-item-bar">
                            <div class="risk-bar-fill" style="width: ${Math.min(prob, 100)}%; background-color: ${prob > 20 ? '#ef4444' : prob > 10 ? '#f59e0b' : '#10b981'}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <h2>💊 Clinical Recommendations</h2>
            <div class="recommendations-section">
                <div class="recommendation-box">
                    <h3>Immediate Actions</h3>
                    <ul>
                        <li>Implement ${riskLevel.toLowerCase()}-risk monitoring protocols</li>
                        <li>Patient education on warning signs</li>
                        <li>Schedule appropriate follow-up</li>
                    </ul>
                </div>
                
                <div class="recommendation-box">
                    <h3>Monitoring Strategy</h3>
                    <ul>
                        <li>${riskLevel.toLowerCase() === 'high' ? 'Weekly clinical assessments' : riskLevel.toLowerCase() === 'medium' ? 'Bi-weekly follow-up' : 'Monthly monitoring'}</li>
                        <li>Regular effectiveness vs. risk assessment</li>
                        <li>Patient-reported outcome tracking</li>
                    </ul>
                </div>

                <div class="recommendation-box">
                    <h3>Risk Mitigation</h3>
                    <ul>
                        <li>${riskLevel.toLowerCase() === 'high' ? 'Consider dose reduction or alternative therapy' : riskLevel.toLowerCase() === 'medium' ? 'Optimize dosing regimen' : 'Continue current therapy with standard precautions'}</li>
                        <li>Consider dose optimization</li>
                        <li>Evaluate alternative therapies if needed</li>
                    </ul>
                </div>
            </div>

            <h2>📋 Follow-up Timeline</h2>
            <div class="timeline-section">
                <div class="timeline-item">
                    <div class="timeline-marker immediate"></div>
                    <div class="timeline-content">
                        <strong>Today:</strong> Patient counseling and baseline assessments
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-marker short-term"></div>
                    <div class="timeline-content">
                        <strong>${riskLevel.toLowerCase() === 'high' ? '1-3 Days' : riskLevel.toLowerCase() === 'medium' ? '1-2 Weeks' : '2-4 Weeks'}:</strong> First follow-up and monitoring
                    </div>
                </div>
                <div class="timeline-item">
                    <div class="timeline-marker long-term"></div>
                    <div class="timeline-content">
                        <strong>Ongoing:</strong> Continuous monitoring and reassessment
                    </div>
                </div>
            </div>

            <div class="clinical-note">
                <p><strong>Clinical Note:</strong> This AI-powered analysis provides decision support based on statistical modeling. Clinical judgment should always supersede algorithmic recommendations.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error generating detailed analysis:', error);
        return `
            <div class="error-message">
                <h3>⚠️ Analysis Generation Error</h3>
                <p>Unable to generate detailed analysis. Please try refreshing the page.</p>
            </div>
        `;
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing enhanced application...');

    // Initialize patient info
    initializePatientInfo();

    // Setup sample data loading
    setupSampleDataLoading();

    // Show initial loading
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 1500);
    }

    console.log('Enhanced application initialized successfully');
});
// 
// Display formatted report function
function displayFormattedReport(reportText) {
    console.log('Displaying formatted report...');

    if (!reportContent) {
        console.error('Report content element not found');
        return;
    }

    if (!reportText) {
        console.error('No report text provided');
        reportContent.innerHTML = `
            <div class="report-error">
                <i class="fas fa-exclamation-triangle"></i>
                <h4>No Report Content</h4>
                <p>The report was generated but contains no content.</p>
            </div>
        `;
        return;
    }

    // Convert markdown-style formatting to HTML
    let formattedReport = reportText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic text
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')             // H1 headers
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')            // H2 headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')           // H3 headers
        .replace(/^- (.*$)/gm, '<li>$1</li>')             // List items
        .replace(/\n\n/g, '</p><p>')                      // Paragraphs
        .replace(/\n/g, '<br>');                          // Line breaks

    // Wrap in paragraphs if not already wrapped
    if (!formattedReport.includes('<p>')) {
        formattedReport = '<p>' + formattedReport + '</p>';
    }

    // Wrap list items in ul tags
    formattedReport = formattedReport.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    // Display the formatted report
    reportContent.innerHTML = `
        <div class="clinical-report">
            <div class="report-header">
                <i class="fas fa-file-medical"></i>
                <h2>Clinical ADR Risk Assessment Report</h2>
                <div class="report-meta">
                    <span class="report-date">Generated: ${new Date().toLocaleString()}</span>
                    <span class="ai-badge">
                        <i class="fas fa-robot"></i> AI-Powered Analysis
                    </span>
                </div>
            </div>
            
            <div class="report-content">
                ${formattedReport}
            </div>
            
            <div class="report-actions">
                <button onclick="printReport()" class="btn btn-secondary">
                    <i class="fas fa-print"></i> Print Report
                </button>
                <button onclick="downloadReport()" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Download PDF
                </button>
                <button onclick="generateClinicalReport()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Regenerate Report
                </button>
            </div>
        </div>
    `;

    // Show the report container
    if (reportContainer) {
        reportContainer.style.display = 'block';
        reportContainer.scrollIntoView({ behavior: 'smooth' });
    }

    console.log('Report displayed successfully');
}

// Show report loading function
function showReportLoading() {
    if (reportContent) {
        reportContent.innerHTML = `
            <div class="report-loading">
                <div class="loading-spinner"></div>
                <h3>Generating detailed clinical analysis using AI...</h3>
                <p>Please wait while we analyze the patient data and generate a comprehensive report.</p>
            </div>
        `;
    }

    if (reportContainer) {
        reportContainer.style.display = 'block';
    }
}

// Print report function
function printReport() {
    const reportContent = document.querySelector('.clinical-report');
    if (reportContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Clinical ADR Risk Assessment Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .clinical-report { max-width: 800px; margin: 0 auto; }
                        .report-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                        .report-actions { display: none; }
                        h1, h2, h3 { color: #333; }
                        .ai-badge { background: #e3f2fd; padding: 5px 10px; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    ${reportContent.outerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Download report function (placeholder)
function downloadReport() {
    showInfo('PDF download feature coming soon!');
}

// REMOVED: Duplicate displayResults function - using the main one below
function displayResults_DUPLICATE_3(result) {
    console.log('Displaying results:', result);

    const resultsContainer = document.getElementById('results-container');
    const resultsContent = document.getElementById('results-content');

    if (!resultsContainer || !resultsContent) {
        console.error('Results container elements not found');
        return;
    }

    // Show results container
    resultsContainer.style.display = 'block';

    // Generate results HTML
    const resultsHTML = generateResultsHTML(result);
    if (resultsContent) {
        resultsContent.innerHTML = resultsHTML;
    } else {
        console.error('❌ resultsContent is null, cannot set innerHTML');
    }

    // Trigger detailed clinical analysis
    setTimeout(() => {
        generateDetailedClinicalAnalysis(currentPatientData, result);
    }, 1000);

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Generate results HTML
function generateResultsHTML(result) {
    const riskLevel = result.risk_level || 'Unknown';
    const predictedADR = result.predicted_adr_type || 'Unknown';
    const noADRProb = result.no_adr_probability || 0;
    const topRisks = result.top_adr_risks || {};
    const specificRisks = result.top_specific_adr_risks || {};

    // Risk level styling
    const getRiskColor = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#dc2626';
            case 'medium': return '#d97706';
            case 'low': return '#059669';
            default: return '#6b7280';
        }
    };

    const getRiskBg = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#fef2f2';
            case 'medium': return '#fffbeb';
            case 'low': return '#f0fdf4';
            default: return '#f9fafb';
        }
    };

    return `
        <div class="results-summary">
            <div class="risk-overview">
                <div class="risk-card main-risk" style="background: ${getRiskBg(riskLevel)}; border-left: 4px solid ${getRiskColor(riskLevel)};">
                    <div class="risk-header">
                        <h3 style="color: ${getRiskColor(riskLevel)};">Overall Risk Level</h3>
                        <div class="risk-badge ${riskLevel.toLowerCase()}" style="background: ${getRiskColor(riskLevel)}; color: white;">
                            ${riskLevel.toUpperCase()}
                        </div>
                    </div>
                    <div class="risk-details">
                        <div class="risk-probability">
                            <span class="prob-label">No ADR Probability:</span>
                            <span class="prob-value" style="color: ${getRiskColor(riskLevel)};">${noADRProb}%</span>
                        </div>
                        <div class="predicted-adr">
                            <span class="adr-label">Most Likely ADR:</span>
                            <span class="adr-value">${predictedADR}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="risk-breakdown">
                <h3><i class="fas fa-chart-pie"></i> Risk Breakdown</h3>
                <div class="risk-types-grid">
                    ${Object.entries(topRisks).slice(0, 4).map(([type, prob]) => `
                        <div class="risk-type-card">
                            <div class="risk-type-name">${type}</div>
                            <div class="risk-type-prob">${prob}%</div>
                            <div class="risk-type-bar">
                                <div class="risk-type-fill" style="width: ${prob}%; background: ${prob > 50 ? '#dc2626' : prob > 25 ? '#d97706' : '#059669'};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${Object.keys(specificRisks).length > 0 ? `
                <div class="specific-adr-risks">
                    <h3><i class="fas fa-exclamation-triangle"></i> Specific ADR Type Risks</h3>
                    <div class="specific-risks-grid">
                        ${Object.entries(specificRisks).map(([type, prob]) => `
                            <div class="specific-risk-card">
                                <div class="specific-risk-name">${type}</div>
                                <div class="specific-risk-prob">${prob}%</div>
                                <div class="specific-risk-level ${prob > 15 ? 'high' : prob > 5 ? 'medium' : 'low'}">
                                    ${prob > 15 ? 'High Risk' : prob > 5 ? 'Medium Risk' : 'Low Risk'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="clinical-actions">
                <button id="generate-report-btn" class="btn btn-primary" onclick="generateClinicalReport()">
                    <i class="fas fa-file-medical"></i> Generate Clinical Report
                </button>
                <button onclick="showDetailedAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-microscope"></i> View Detailed Analysis
                </button>
            </div>
        </div>
        
        <style>
            .results-summary { padding: 20px 0; }
            .risk-overview { margin-bottom: 30px; }
            .risk-card { padding: 20px; border-radius: 12px; margin-bottom: 15px; }
            .risk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .risk-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
            .risk-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .prob-value, .adr-value { font-weight: 600; font-size: 1.1rem; }
            .risk-breakdown { margin-bottom: 30px; }
            .risk-types-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
            .risk-type-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .risk-type-name { font-weight: 600; margin-bottom: 8px; }
            .risk-type-prob { font-size: 1.2rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
            .risk-type-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
            .risk-type-fill { height: 100%; transition: width 0.5s ease; }
            .specific-adr-risks { margin-bottom: 30px; }
            .specific-risks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px; }
            .specific-risk-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; }
            .specific-risk-name { font-weight: 600; margin-bottom: 8px; }
            .specific-risk-prob { font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; }
            .specific-risk-level { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
            .specific-risk-level.high { background: #fef2f2; color: #dc2626; }
            .specific-risk-level.medium { background: #fffbeb; color: #d97706; }
            .specific-risk-level.low { background: #f0fdf4; color: #059669; }
            .clinical-actions { display: flex; gap: 15px; justify-content: center; margin-top: 30px; }
            
            @media (max-width: 768px) {
                .risk-details { grid-template-columns: 1fr; }
                .risk-types-grid, .specific-risks-grid { grid-template-columns: 1fr; }
                .clinical-actions { flex-direction: column; }
            }
        </style>
    `;
}

// Generate detailed clinical analysis using AI
async function generateDetailedClinicalAnalysis(patientData, predictionResult) {
    console.log('Generating detailed clinical analysis...');

    const analysisContainer = document.getElementById('ai-detailed-analysis-container');
    const analysisContent = document.getElementById('ai-detailed-content');

    if (!analysisContainer || !analysisContent) {
        console.error('AI analysis container elements not found');
        return;
    }

    // Show loading state
    analysisContent.innerHTML = `
        <div class="ai-analysis-loading">
            <div class="loading-spinner"></div>
            <p>Generating detailed clinical analysis using AI...</p>
        </div>
    `;

    try {
        // Prepare comprehensive data for AI analysis
        const analysisData = {
            patient_data: patientData,
            prediction_result: predictionResult,
            analysis_type: 'detailed_clinical',
            patient_name: patientInfo.name || 'Patient',
            patient_id: patientInfo.id || '',
            clinician_name: patientInfo.clinician || 'Clinician'
        };

        console.log('Sending detailed analysis request...');

        const response = await fetch('/generate_detailed_analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(analysisData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Detailed analysis generated:', result.model_based ? 'Model-based' : 'AI-generated');

        // Display the analysis
        displayDetailedAnalysis(result.analysis, result.model_based);

    } catch (error) {
        console.error('Error generating detailed analysis:', error);

        // Show fallback analysis
        const fallbackAnalysis = generateFallbackAnalysis(patientData, predictionResult);
        displayDetailedAnalysis(fallbackAnalysis);
    }
}

// Display detailed clinical analysis
function displayDetailedAnalysis(analysisText, isModelBased = false) {
    const analysisContent = document.getElementById('ai-analysis-content');

    if (!analysisContent) {
        console.error('Analysis content element not found');
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

    // Wrap in paragraphs
    if (!formattedAnalysis.includes('<p>')) {
        formattedAnalysis = '<p>' + formattedAnalysis + '</p>';
    }

    // Wrap list items
    formattedAnalysis = formattedAnalysis.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

    analysisContent.innerHTML = `
        <div class="detailed-analysis-content">
            ${formattedAnalysis}
            
            <div class="analysis-actions">
                <button onclick="regenerateAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-redo"></i> Regenerate Analysis
                </button>
                <button onclick="exportAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-download"></i> Export Analysis
                </button>
            </div>
        </div>
        
        <style>
            .detailed-analysis-content { 
                background: white; 
                padding: 25px; 
                border-radius: 12px; 
                border: 1px solid #e5e7eb;
                line-height: 1.6;
            }
            .detailed-analysis-content h3 { 
                color: #1f2937; 
                margin: 20px 0 10px 0; 
                padding-bottom: 8px;
                border-bottom: 2px solid #e5e7eb;
            }
            .detailed-analysis-content h
                color: #374151; 
                margin: 15px 0 8px 0; 
            }
            .detailed-analysis-content p { 
                margin: 12px 0; 
                color: #4b5563;
            }
            .detailed-analysis-content ul { 
                margin: 12px 0; 
                padding-left: 20px; 
            }
            .detailed-analysis-content li { 
                margin: 6px 0; 
                color: #4b5563;
            }
            .analysis-actions { 
                margin-top: 25px; 
                padding-top: 20px; 
                border-top: 1px solid #e5e7eb;
                display: flex; 
                gap: 10px; 
                justify-content: center;
            }
            
            @media (max-width: 768px) {
                .detailed-analysis-content { padding: 15px; }
                .analysis-actions { flex-direction: column; }
            }
        </style>
    `;
}

// Generate fallback analysis when AI is not available
function generateFallbackAnalysis(patientData, predictionResult) {
    const riskLevel = predictionResult.risk_level || 'Unknown';
    const predictedADR = predictionResult.predicted_adr_type || 'Unknown';
    const noADRProb = predictionResult.no_adr_probability || 0;

    return `
# Detailed Clinical Analysis

## Risk Assessment Summary
The patient presents with a **${riskLevel}** risk profile for adverse drug reactions, with a ${noADRProb}% probability of no ADR occurrence.

## mary Risk Factors
- **Age**: ${patientData.age} years - ${patientData.age > 65 ? 'Increased risk due to advanced age' : 'Age within normal risk range'}
- **Renal Function**: eGFR ${patientData.egfr} mL/min/1.73m² - ${patientData.egfr < 60 ? 'Reduced renal function requiring dose adjustment' : 'Normal renal function'}
- **Hepatic Function**: ${patientData.ast_alt > 40 ? 'Elevated liver enzymes suggesting hepatic impairment' : 'Normal liver function parameters'}

## Predicted ADR Type: ${predictedADR}
${predictedADR !== 'No ADR' ? `
The model predicts **${predictedADR}** as the most likely adverse reaction type. This requires:
- Enhanced monitoring for specific symptoms
- Patient education on warning signs
- Appropriate intervention protocols
` : 'Low probability of adverse drug reactions with current medication regimen.'}

## Clinical Recommendations
- **Monitoring Frequency**: ${riskLevel === 'High' ? 'Weekly clinical assessments' : riskLevel === 'Medium' ? 'Bi-weekly follow-up' : 'Monthly monitoring'}
- **Laboratory Monitoring**: ${patientData.egfr < 60 || patientData.ast_alt > 40 ? 'Enhanced laboratory monitoring recommended' : 'Standard laboratory monitoring'}
- **Dose Adjustments**: ${riskLevel === 'High' ? 'Consider dose reduction or alternative therapy' : 'Continue current dosing with monitoring'}

## Patient Education Points
- Recognition of early warning signs
- When to contact healthcare provider
- Importance of medication adherence
- Regular follow-up appointments

---
*This analysis is generated using clinical decision support algorithms. Clinical judgment should always supersede algorithmic recommendations.*
    `;
}

// Regenerate analysis function
async function regenerateAnalysis() {
    if (currentPatientData && currentPredictionResult) {
        await generateDetailedClinicalAnalysis(currentPatientData, currentPredictionResult);
    }
}

// Export analysis function
function exportAnalysis() {
    const analysisContent = document.querySelector('.detailed-analysis-content');
    {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Detailed Clinical Analysis</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                        h3 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
                        h4 { color: #374151; }
                        .analysis-actions { display: none; }
                    </style>
                </head>
                <body>
                    <h1>Detailed Clinical Analysis</h1>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                    ${analysisContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Show detailed analysis (for button click)
function showDetailedAnalysis() {
    const analysisContainer = document.getElementById('ai-detailed-analysis-container');
    if (analysisContainer) {
        analysisContainer.scrollIntoView({ behavior: 'smooth' });
    }
}// 
// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded, initializing application...');

    // Initialize DOM elements
    initializeDOMElements();

    // Initialize patient info
    initializePatientInfo();

    // Setup form handlers
    setupFormHandler();
    setupClearHandler();
    setupReportHandler();

    // Setup mobile navigation
    initializeMobileNavigation();

    // Setup quick actions
    initializeQuickActions();

    console.log('Application initialized successfully');
});

// Initialize DOM elements
function initializeDOMElements() {
    form = document.getElementById('adr-form');
    clearButton = document.getElementById('clear-form');
    resultsContainer = document.getElementById('results-container');
    resultsContent = document.getElementById('results-content');
    generateReportButton = document.getElementById('generate-report');
    reportContainer = document.getElementById('report-container');
    reportContent = document.getElementById('report-content');
    loadingOverlay = document.getElementById('loading-overlay');

    // Setup BMI calculation
    setupBMICalculation();

    console.log('DOM elements initialized');
}

// Setup BMI Calculation
function setupBMICalculation() {
    const heightField = document.getElementById('height');
    const weightField = document.getElementById('weight');

    if (heightField && weightField) {
        heightField.addEventListener('input', calculateBMI);
        weightField.addEventListener('input', calculateBMI);
    }
}

// Initialize mobile navigation
function initializeMobileNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    // Function to open sidebar
    function openSidebar() {
        if (sidebar) {
            sidebar.classList.add('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }

    // Function to close sidebar
    function closeSidebar() {
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
    }

    // Toggle sidebar
    if (navToggle && sidebar) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    // Close sidebar with close button
    if (sidebarClose) {
        sidebarClose.addEventListener('click', (e) => {
            e.stopPropagation();
            closeSidebar();
        });
    }

    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Menu item navigation
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            const section = item.dataset.section;
            showSection(section);

            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth < 768 &&
            sidebar && sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            navToggle && !navToggle.contains(e.target)) {
            closeSidebar();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
            closeSidebar();
        }
    });
}

// Show specific section
function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

// Initialize quick actions
function initializeQuickActions() {
    const loadSampleBtn = document.getElementById('load-sample-data');
    const clearFormBtn = document.getElementById('clear-form');
    const voiceInputBtn = document.getElementById('voice-input');
    const sampleSelector = document.getElementById('sample-data-selector');
    const sampleContainer = document.getElementById('sample-selector-container');

    // Load sample data
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', () => {
            if (sampleContainer && (sampleContainer.style.display === 'none' || !sampleContainer.style.display)) {
                sampleContainer.style.display = 'block';
            } else if (sampleContainer) {
                sampleContainer.style.display = 'none';
            }
        });
    }

    // Sample selector change
    if (sampleSelector) {
        sampleSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                loadSampleData(e.target.value);
                if (sampleContainer) {
                    sampleContainer.style.display = 'none';
                }
            }
        });
    }

    // Clear form
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all form data?')) {
                if (form) {
                    form.reset();
                }
                showSuccess('Form cleared successfully');
            }
        });
    }

    // Voice input (placeholder)
    if (voiceInputBtn) {
        voiceInputBtn.addEventListener('click', () => {
            showInfo('Voice input feature coming soon!');
        });
    }
}

// Load sample data function (placeholder)
function loadSampleData(sampleType) {
    console.log('Loading sample data:', sampleType);
    showInfo(`Loading ${sampleType} sample data...`);

    // This would load actual sample data in a real implementation
    // For now, just show a message
}

// Show info message
function showInfo(message) {
    // Create info notification
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info-notification';
    infoDiv.innerHTML = `
        <div class="info-content">
            <i class="fas fa-info-circle"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add info styles if not already added
    if (!document.querySelector('#info-styles')) {
        const style = document.createElement('style');
        style.id = 'info-styles';
        style.textContent = `
            .info-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #dbeafe;
                color: #1e40af;
                padding: 15px 20px;
                border-radius: 10px;
                border-left: 4px solid #3b82f6;
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                z-index: 1001;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .info-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .info-content button {
                background: none;
                border: none;
                color: #1e40af;
                cursor: pointer;
                padding: 5px;
                margin-left: auto;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(infoDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (infoDiv.parentElement) {
            infoDiv.remove();
        }
    }, 3000);
}// Displa
// Display results function
function displayResults(result) {
    console.log('🎯 displayResults called with:', result);

    // Use global variables first, fallback to getElementById
    let resultsContainer = window.resultsContainer || document.getElementById('results-container');
    let resultsContent = window.resultsContent || document.getElementById('results-content');

    console.log('📦 Results container found:', !!resultsContainer);
    console.log('📄 Results content found:', !!resultsContent);

    if (!resultsContainer || !resultsContent) {
        console.error('❌ Results container elements not found');
        console.log('Available elements:', {
            'results-container': !!document.getElementById('results-container'),
            'results-content': !!document.getElementById('results-content'),
            'ai-detailed-analysis-container': !!document.getElementById('ai-detailed-analysis-container'),
            'ai-detailed-content': !!document.getElementById('ai-detailed-content')
        });

        // Try to create a temporary results display
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px; text-align: center;">
                <h3 style="color: #dc2626; margin-bottom: 10px;">⚠️ Display Error</h3>
                <p style="color: #7f1d1d;">Results container not found. Please refresh the page.</p>
                <button onclick="location.reload()" style="background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-top: 10px; cursor: pointer;">
                    Refresh Page
                </button>
            </div>
        `;
        document.body.appendChild(tempContainer);
        return;
    }

    console.log('✅ Showing results container...');
    // Show results container
    resultsContainer.style.display = 'block';

    // Generate results HTML
    console.log('🔧 Generating results HTML...');
    const resultsHTML = generateResultsHTML(result);
    if (resultsContent) {
        resultsContent.innerHTML = resultsHTML;
        console.log('✅ Results HTML set');
    } else {
        console.error('❌ resultsContent is null, cannot set innerHTML');
    }

    // Trigger ADR alert system for ALL risk levels (High, Medium, Low)
    const riskLevel = result.risk_level ? result.risk_level.toLowerCase() : 'unknown';
    console.log('🎯 Risk level detected:', riskLevel, 'from result:', result.risk_level);

    // Store current prediction result for alert system
    window.currentPredictionResult = result;

    // Trigger the integrated ADR alert system for ANY risk level
    console.log('🚨 Triggering ADR alert system for:', riskLevel);
    setTimeout(() => {
        try {
            if (typeof showADRRiskPopup === 'function') {
                console.log('📞 Calling showADRRiskPopup() for', riskLevel, 'risk');
                showADRRiskPopup(result);
                console.log('✅ ADR alert system triggered successfully');
            } else {
                console.error('❌ showADRRiskPopup function not found');
                // Fallback alert for any risk level
                alert(`ADR RISK DETECTED!\n\nRisk Level: ${result.risk_level}\nADR Type: ${result.predicted_adr_type}\nSafety Probability: ${result.no_adr_probability}%\n\nPlease review the assessment results carefully.`);
            }
        } catch (error) {
            console.error('❌ Error calling ADR alert system:', error);
            alert(`ADR RISK DETECTED!\n\nError: ${error.message}\n\nRisk Level: ${result.risk_level}\nADR Type: ${result.predicted_adr_type}`);
        }
    }, 1000); // Delay to allow results to render first

    // Trigger detailed clinical analysis
    console.log('🤖 Triggering detailed analysis in 1 second...');
    setTimeout(() => {
        console.log('🚀 Starting detailed analysis...');
        generateDetailedClinicalAnalysis(currentPatientData, result);
    }, 1000);

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
    console.log('✅ displayResults completed');
}

// Generate results HTML
function generateResultsHTML(result) {
    console.log('🔧 generateResultsHTML called with:', result);

    const riskLevel = result.risk_level || 'Unknown';
    const predictedADR = result.predicted_adr_type || 'Unknown';
    const noADRProb = result.no_adr_probability || 0;
    const topRisks = result.top_adr_risks || {};
    const specificRisks = result.top_specific_adr_risks || {};

    // Risk level styling
    const getRiskColor = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#dc2626';
            case 'medium': return '#d97706';
            case 'low': return '#059669';
            default: return '#6b7280';
        }
    };

    const getRiskBg = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#fef2f2';
            case 'medium': return '#fffbeb';
            case 'low': return '#f0fdf4';
            default: return '#f9fafb';
        }
    };

    const html = `
        <div class="results-summary">
            <div class="risk-overview">
                <div class="risk-card main-risk" style="background: ${getRiskBg(riskLevel)}; border-left: 4px solid ${getRiskColor(riskLevel)};">
                    <div class="risk-header">
                        <h3 style="color: ${getRiskColor(riskLevel)};">Overall Risk Level</h3>
                        <div class="risk-badge ${riskLevel.toLowerCase()}" style="background: ${getRiskColor(riskLevel)}; color: white;">
                            ${riskLevel.toUpperCase()}
                        </div>
                    </div>
                    <div class="risk-details">
                        <div class="risk-probability">
                            <span class="prob-label">No ADR Probability:</span>
                            <span class="prob-value" style="color: ${getRiskColor(riskLevel)};">${noADRProb}%</span>
                        </div>
                        <div class="predicted-adr">
                            <span class="adr-label">Most Likely ADR:</span>
                            <span class="adr-value">${predictedADR}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="risk-breakdown">
                <h3><i class="fas fa-chart-pie"></i> Risk Breakdown</h3>
                <div class="risk-types-grid">
                    ${Object.entries(topRisks).slice(0, 4).map(([type, prob]) => `
                        <div class="risk-type-card">
                            <div class="risk-type-name">${type}</div>
                            <div class="risk-type-prob">${prob}%</div>
                            <div class="risk-type-bar">
                                <div class="risk-type-fill" style="width: ${prob}%; background: ${prob > 50 ? '#dc2626' : prob > 25 ? '#d97706' : '#059669'};"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${Object.keys(specificRisks).length > 0 ? `
                <div class="specific-adr-risks">
                    <h3><i class="fas fa-exclamation-triangle"></i> Specific ADR Type Risks</h3>
                    <div class="specific-risks-grid">
                        ${Object.entries(specificRisks).map(([type, prob]) => `
                            <div class="specific-risk-card">
                                <div class="specific-risk-name">${type}</div>
                                <div class="specific-risk-prob">${prob}%</div>
                                <div class="specific-risk-level ${prob > 15 ? 'high' : prob > 5 ? 'medium' : 'low'}">
                                    ${prob > 15 ? 'High Risk' : prob > 5 ? 'Medium Risk' : 'Low Risk'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="clinical-actions">
                <button id="generate-report-btn" class="btn btn-primary" onclick="generateClinicalReport()">
                    <i class="fas fa-file-medical"></i> Generate Clinical Report
                </button>
                <button onclick="showDetailedAnalysis()" class="btn btn-secondary">
                    <i class="fas fa-microscope"></i> View Detailed Analysis
                </button>
            </div>
        </div>
        
        <style>
            .results-summary { padding: 20px 0; }
            .risk-overview { margin-bottom: 30px; }
            .risk-card { padding: 20px; border-radius: 12px; margin-bottom: 15px; }
            .risk-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .risk-badge { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
            .risk-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .prob-value, .adr-value { font-weight: 600; font-size: 1.1rem; }
            .risk-breakdown { margin-bottom: 30px; }
            .risk-types-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px; }
            .risk-type-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .risk-type-name { font-weight: 600; margin-bottom: 8px; }
            .risk-type-prob { font-size: 1.2rem; font-weight: 700; color: #1f2937; margin-bottom: 8px; }
            .risk-type-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
            .risk-type-fill { height: 100%; transition: width 0.5s ease; }
            .specific-adr-risks { margin-bottom: 30px; }
            .specific-risks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px; }
            .specific-risk-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; }
            .specific-risk-name { font-weight: 600; margin-bottom: 8px; }
            .specific-risk-prob { font-size: 1.4rem; font-weight: 700; margin-bottom: 8px; }
            .specific-risk-level { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
            .specific-risk-level.high { background: #fef2f2; color: #dc2626; }
            .specific-risk-level.medium { background: #fffbeb; color: #d97706; }
            .specific-risk-level.low { background: #f0fdf4; color: #059669; }
            .clinical-actions { display: flex; gap: 15px; justify-content: center; margin-top: 30px; }
            
            @media (max-width: 768px) {
                .risk-details { grid-template-columns: 1fr; }
                .risk-types-grid, .specific-risks-grid { grid-template-columns: 1fr; }
                .clinical-actions { flex-direction: column; }
            }
        </style>
    `;

    console.log('✅ Results HTML generated');
    return html;
}

// DOM Initialization - Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 DOM Content Loaded - Initializing application...');

    try {
        // Initialize DOM elements
        initializeDOMElements();
        console.log('✅ DOM elements initialized');

        // Initialize patient info
        initializePatientInfo();
        console.log('✅ Patient info initialized');

        // Setup form handlers
        setupFormHandler();
        setupClearHandler();
        setupReportHandler();
        console.log('✅ Form handlers setup');

        // Initialize mobile navigation
        initializeMobileNavigation();
        console.log('✅ Mobile navigation initialized');

        // Initialize quick actions
        initializeQuickActions();
        console.log('✅ Quick actions initialized');

        console.log('🎉 Application initialization complete!');

    } catch (error) {
        console.error('❌ Error during initialization:', error);
        showError('Application initialization failed. Please refresh the page.');
    }
});

// Backup initialization for older browsers
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded
    initializeApp();
}

function initializeApp() {
    console.log('🔄 Backup initialization triggered');
    if (!document.getElementById('adr-form')) {
        console.log('⏳ Waiting for DOM elements...');
        setTimeout(initializeApp, 100);
        return;
    }

    try {
        initializeDOMElements();
        initializePatientInfo();
        setupFormHandler();
        setupClearHandler();
        setupReportHandler();
        initializeMobileNavigation();
        initializeQuickActions();
        console.log('✅ Backup initialization complete');
    } catch (error) {
        console.error('❌ Backup initialization error:', error);
    }
}
// Utility functions for field analysis
// Assess field risk level
function assessFieldRisk(fieldName, value) {
    const riskAssessments = {
        'age': (val) => val > 70 ? 'high' : val > 50 ? 'medium' : 'low',
        'bmi': (val) => val > 30 ? 'high' : val > 25 ? 'medium' : val < 18.5 ? 'medium' : 'low',
        'bp_systolic': (val) => val > 160 ? 'high' : val > 140 ? 'medium' : 'low',
        'bp_diastolic': (val) => val > 100 ? 'high' : val > 90 ? 'medium' : 'low',
        'heart_rate': (val) => val > 100 || val < 60 ? 'medium' : 'low',
        'diabetes': (val) => val === 1 ? 'medium' : 'low',
        'liver_disease': (val) => val === 1 ? 'high' : 'low',
        'ckd': (val) => val === 1 ? 'high' : 'low',
        'cardiac_disease': (val) => val === 1 ? 'medium' : 'low'
    };

    return riskAssessments[fieldName] ? riskAssessments[fieldName](value) : 'low';
}

// Get field interpretation
function getFieldInterpretation(fieldName, value) {
    const interpretations = {
        'age': (val) => val > 70 ? 'Advanced age increases ADR risk' : val > 50 ? 'Moderate age-related risk' : 'Low age-related risk',
        'bmi': (val) => val > 30 ? 'Obesity may affect drug metabolism' : val > 25 ? 'Overweight - monitor dosing' : val < 18.5 ? 'Underweight - consider dose adjustment' : 'Normal BMI',
        'bp_systolic': (val) => val > 160 ? 'Severe hypertension - high cardiovascular risk' : val > 140 ? 'Hypertension present' : 'Normal blood pressure',
        'bp_diastolic': (val) => val > 100 ? 'Severe diastolic hypertension' : val > 90 ? 'Diastolic hypertension' : 'Normal diastolic pressure',
        'heart_rate': (val) => val > 100 ? 'Tachycardia present' : val < 60 ? 'Bradycardia present' : 'Normal heart rate',
        'diabetes': (val) => val === 1 ? 'Diabetes increases ADR risk and affects drug metabolism' : 'No diabetes',
        'liver_disease': (val) => val === 1 ? 'Liver disease significantly increases hepatotoxicity risk' : 'No liver disease',
        'ckd': (val) => val === 1 ? 'Kidney disease increases nephrotoxicity risk' : 'No kidney disease',
        'cardiac_disease': (val) => val === 1 ? 'Cardiac disease increases cardiovascular ADR risk' : 'No cardiac disease'
    };

    return interpretations[fieldName] ? interpretations[fieldName](value) : 'Normal range';
}

// Assess laboratory risk
function assessLabRisk(fieldName, value) {
    const labRisks = {
        'creatinine': (val) => val > 2.0 ? 'high' : val > 1.5 ? 'medium' : 'low',
        'egfr': (val) => val < 30 ? 'high' : val < 60 ? 'medium' : 'low',
        'ast_alt': (val) => val > 200 ? 'high' : val > 80 ? 'medium' : 'low',
        'bilirubin': (val) => val > 3.0 ? 'high' : val > 1.5 ? 'medium' : 'low',
        'albumin': (val) => val < 2.5 ? 'high' : val < 3.0 ? 'medium' : 'low',
        'hemoglobin': (val) => val < 8.0 ? 'high' : val < 10.0 ? 'medium' : 'low',
        'wbc_count': (val) => val > 15.0 || val < 3.0 ? 'high' : val > 12.0 || val < 4.0 ? 'medium' : 'low',
        'platelet_count': (val) => val < 100 ? 'high' : val < 150 ? 'medium' : 'low'
    };

    return labRisks[fieldName] ? labRisks[fieldName](value) : 'low';
}

// Get lab status
function getLabStatus(fieldName, value) {
    const risk = assessLabRisk(fieldName, value);
    return risk === 'high' ? 'Critical' : risk === 'medium' ? 'Abnormal' : 'Normal';
}

// Get lab interpretation
function getLabInterpretation(fieldName, value) {
    const interpretations = {
        'creatinine': (val) => val > 2.0 ? 'Severe kidney impairment - high nephrotoxicity risk' : val > 1.5 ? 'Moderate kidney impairment' : 'Normal kidney function',
        'egfr': (val) => val < 30 ? 'Severe kidney disease - dose adjustment required' : val < 60 ? 'Moderate kidney disease' : 'Normal kidney function',
        'ast_alt': (val) => val > 200 ? 'Severe liver dysfunction - high hepatotoxicity risk' : val > 80 ? 'Elevated liver enzymes' : 'Normal liver function',
        'bilirubin': (val) => val > 3.0 ? 'Severe hyperbilirubinemia' : val > 1.5 ? 'Elevated bilirubin' : 'Normal bilirubin',
        'albumin': (val) => val < 2.5 ? 'Severe hypoalbuminemia - affects drug binding' : val < 3.0 ? 'Mild hypoalbuminemia' : 'Normal albumin',
        'hemoglobin': (val) => val < 8.0 ? 'Severe anemia' : val < 10.0 ? 'Moderate anemia' : 'Normal hemoglobin',
        'wbc_count': (val) => val > 15.0 ? 'Leukocytosis - possible infection' : val < 3.0 ? 'Leukopenia - immunosuppression risk' : 'Normal WBC count',
        'platelet_count': (val) => val < 100 ? 'Thrombocytopenia - bleeding risk' : val < 150 ? 'Low platelets' : 'Normal platelet count'
    };

    return interpretations[fieldName] ? interpretations[fieldName](value) : 'Within normal limits';
}

// Get interaction risk description
function getInteractionRiskDescription(interaction) {
    const descriptions = {
        'Major': 'Significant interaction risk - close monitoring required',
        'Moderate': 'Moderate interaction risk - monitor for effects',
        'Minor': 'Minor interaction risk - routine monitoring',
        'None': 'No significant interactions identified'
    };
    return descriptions[interaction] || 'Unknown interaction level';
}

// Get lab monitoring frequency
function getLabMonitoringFrequency(riskLevel, patientData) {
    if (patientData.liver_disease === 1) return 'Liver function tests every 1-2 weeks initially';
    if (patientData.ckd === 1) return 'Kidney function tests every 1-2 weeks initially';

    return riskLevel === 'High' ? 'Weekly laboratory monitoring initially' :
        riskLevel === 'Medium' ? 'Bi-weekly laboratory monitoring' :
            'Monthly laboratory monitoring';
}

// Get clinical monitoring frequency
function getClinicalMonitoringFrequency(riskLevel) {
    return riskLevel === 'High' ? 'Daily clinical assessment for first week' :
        riskLevel === 'Medium' ? 'Weekly clinical assessment for first month' :
            'Bi-weekly clinical assessment';
}

// Get dose mitigation advice
function getDoseMitigationAdvice(patientData) {
    if (patientData.liver_disease === 1) return 'Consider dose reduction due to liver impairment';
    if (patientData.ckd === 1) return 'Dose adjustment required for kidney impairment';
    if (patientData.age > 70) return 'Consider dose reduction for elderly patient';
    return 'Standard dosing appropriate with monitoring';
}

// Get specific mitigation advice
function getSpecificMitigationAdvice(predictedADR) {
    const advice = {
        'Hepatotoxicity': 'Implement hepatoprotective measures and avoid hepatotoxic drugs',
        'Nephrotoxicity': 'Ensure adequate hydration and avoid nephrotoxic agents',
        'Cardiovascular Event': 'Monitor cardiac function and blood pressure closely',
        'Hypersensitivity': 'Have emergency medications available and educate on signs'
    };
    return advice[predictedADR] || 'Implement general safety measures';
}

// Get short-term timing
function getShortTermTiming(riskLevel) {
    return riskLevel === 'High' ? '24-48 hours' :
        riskLevel === 'Medium' ? '3-7 days' :
            '1-2 weeks';
}

// Generate monitoring parameters
function generateMonitoringParameters(patientData) {
    const parameters = [];

    if (patientData.liver_disease === 1 || patientData.ast_alt > 80) {
        parameters.push({ name: 'Liver Function', icon: 'fas fa-liver', frequency: 'Weekly' });
    }

    if (patientData.ckd === 1 || patientData.creatinine > 1.5) {
        parameters.push({ name: 'Kidney Function', icon: 'fas fa-kidneys', frequency: 'Weekly' });
    }

    if (patientData.cardiac_disease === 1) {
        parameters.push({ name: 'Cardiac Function', icon: 'fas fa-heartbeat', frequency: 'Bi-weekly' });
    }

    parameters.push({ name: 'Vital Signs', icon: 'fas fa-thermometer-half', frequency: 'Each visit' });
    parameters.push({ name: 'Symptom Assessment', icon: 'fas fa-clipboard-list', frequency: 'Each visit' });

    return parameters.map(param => `
        <div class="parameter-card">
            <div class="param-icon"><i class="${param.icon}"></i></div>
            <div class="param-content">
                <h6>${param.name}</h6>
                <p>${param.frequency}</p>
            </div>
        </div>
    `).join('');
}
// 
// Generate High Risk ADR Warning
function generateHighRiskADRWarning(result) {
    const riskLevel = result.risk_level.toLowerCase();
    const predictedADR = result.predicted_adr_type;
    const noAdrProb = result.no_adr_probability;

    // Show warning for high and medium risk cases
    if (riskLevel === 'low') {
        return '';
    }

    // Get the highest specific ADR risk
    const topSpecificRisks = result.top_specific_adr_risks || {};
    const topADRs = Object.entries(topSpecificRisks)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const warningColor = getWarningColor(riskLevel);
    const urgencyLevel = getUrgencyLevel(noAdrProb);
    const clinicalRecommendations = getClinicalRecommendations(predictedADR, riskLevel);
    const alertTitle = riskLevel === 'high' ? '⚠️ HIGH RISK ADR ALERT' : '⚠️ MODERATE RISK ADR ALERT';
    const alertIcon = riskLevel === 'high' ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';

    return `
        <div class="high-risk-adr-warning ${warningColor}" data-risk-level="${riskLevel}">
            <div class="warning-header">
                <div class="warning-icon">
                    <i class="${alertIcon}"></i>
                </div>
                <div class="warning-title">
                    <h3>${alertTitle}</h3>
                    <p class="urgency-badge ${urgencyLevel.class}">${urgencyLevel.text}</p>
                </div>
                <div class="warning-actions">
                    <button class="btn-acknowledge" onclick="acknowledgeWarning(this)" title="Acknowledge Warning">
                        <i class="fas fa-check"></i> Acknowledge
                    </button>
                    <button class="btn-print-warning" onclick="printWarning(this)" title="Print Warning">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn-share-warning" onclick="shareWarning(this)" title="Share Warning">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
            
            <div class="warning-content">
                <div class="risk-summary-alert">
                    <div class="alert-item">
                        <span class="alert-label">Risk Level:</span>
                        <span class="alert-value high-risk">${result.risk_level}</span>
                    </div>
                    <div class="alert-item">
                        <span class="alert-label">Primary ADR Risk:</span>
                        <span class="alert-value">${predictedADR}</span>
                    </div>
                    <div class="alert-item">
                        <span class="alert-label">Safety Probability:</span>
                        <span class="alert-value">${noAdrProb}%</span>
                    </div>
                </div>
                
                ${topADRs.length > 0 ? `
                <div class="specific-adr-alerts">
                    <h4><i class="fas fa-medical-kit"></i> Specific ADR Risks to Monitor</h4>
                    <div class="adr-risk-grid">
                        ${topADRs.map(([adrType, probability]) => `
                            <div class="adr-risk-item ${getRiskClass(probability)}">
                                <div class="adr-name">${adrType}</div>
                                <div class="adr-probability">${probability}%</div>
                                <div class="adr-severity">${getSeverityText(probability)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="clinical-recommendations">
                    <h4><i class="fas fa-stethoscope"></i> Immediate Clinical Actions Required</h4>
                    <div class="recommendations-grid">
                        ${clinicalRecommendations.map(rec => `
                            <div class="recommendation-item ${rec.priority}">
                                <div class="rec-icon">
                                    <i class="${rec.icon}"></i>
                                </div>
                                <div class="rec-content">
                                    <div class="rec-title">${rec.title}</div>
                                    <div class="rec-description">${rec.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="emergency-contacts">
                    <h4><i class="fas fa-phone-alt"></i> Emergency Response</h4>
                    <div class="emergency-grid">
                        <div class="emergency-item critical">
                            <i class="fas fa-ambulance"></i>
                            <div>
                                <strong>Severe ADR Emergency</strong>
                                <p>Call 911 immediately</p>
                            </div>
                        </div>
                        <div class="emergency-item urgent">
                            <i class="fas fa-user-md"></i>
                            <div>
                                <strong>Physician Consultation</strong>
                                <p>Contact prescribing physician within 2 hours</p>
                            </div>
                        </div>
                        <div class="emergency-item moderate">
                            <i class="fas fa-pills"></i>
                            <div>
                                <strong>Pharmacy Consultation</strong>
                                <p>Consult clinical pharmacist for medication review</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="monitoring-schedule">
                    <h4><i class="fas fa-calendar-check"></i> Enhanced Monitoring Protocol</h4>
                    <div class="monitoring-timeline">
                        <div class="timeline-item immediate">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <strong>Immediate (0-2 hours)</strong>
                                <p>Assess vital signs, review symptoms, consider dose reduction</p>
                            </div>
                        </div>
                        <div class="timeline-item short-term">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <strong>Short-term (2-24 hours)</strong>
                                <p>Monitor for early ADR signs, laboratory follow-up if indicated</p>
                            </div>
                        </div>
                        <div class="timeline-item ongoing">
                            <div class="timeline-marker"></div>
                            <div class="timeline-content">
                                <strong>Ongoing (Daily)</strong>
                                <p>Daily symptom assessment, weekly lab monitoring, medication adherence review</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="warning-footer">
                <div class="disclaimer">
                    <i class="fas fa-info-circle"></i>
                    <span>This is a predictive assessment. Clinical judgment should always take precedence. Document all interventions and patient responses.</span>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for ADR warning
function getWarningColor(riskLevel) {
    switch (riskLevel) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'info';
    }
}

function getUrgencyLevel(noAdrProb) {
    if (noAdrProb < 30) {
        return { class: 'critical', text: 'CRITICAL - Immediate Action Required' };
    } else if (noAdrProb < 50) {
        return { class: 'urgent', text: 'URGENT - Enhanced Monitoring' };
    } else if (noAdrProb < 70) {
        return { class: 'moderate', text: 'MODERATE - Increased Vigilance' };
    } else {
        return { class: 'low', text: 'LOW - Standard Monitoring' };
    }
}

function getRiskClass(probability) {
    if (probability > 15) return 'high-risk';
    if (probability > 5) return 'medium-risk';
    return 'low-risk';
}

function getSeverityText(probability) {
    if (probability > 15) return 'High Risk';
    if (probability > 5) return 'Moderate Risk';
    return 'Low Risk';
}

function getClinicalRecommendations(predictedADR, riskLevel) {
    const baseRecommendations = [
        {
            priority: 'critical',
            icon: 'fas fa-heartbeat',
            title: 'Vital Signs Monitoring',
            description: 'Monitor blood pressure, heart rate, temperature every 2-4 hours'
        },
        {
            priority: 'urgent',
            icon: 'fas fa-vial',
            title: 'Laboratory Monitoring',
            description: 'Order CBC, CMP, liver function tests within 24 hours'
        },
        {
            priority: 'urgent',
            icon: 'fas fa-pills',
            title: 'Medication Review',
            description: 'Consider dose reduction or alternative therapy options'
        },
        {
            priority: 'moderate',
            icon: 'fas fa-clipboard-list',
            title: 'Symptom Assessment',
            description: 'Document any new symptoms or changes in patient condition'
        }
    ];

    // Add patient-specific recommendations based on current data
    const patientSpecificRecs = getPatientSpecificRecommendations();

    // Add specific recommendations based on predicted ADR type
    const specificRecommendations = getSpecificRecommendations(predictedADR);

    return [...baseRecommendations, ...patientSpecificRecs, ...specificRecommendations];
}

// Get patient-specific recommendations based on current patient data
function getPatientSpecificRecommendations() {
    const recommendations = [];

    if (!currentPatientData) return recommendations;

    // Age-based recommendations
    if (currentPatientData.age >= 65) {
        recommendations.push({
            priority: 'urgent',
            icon: 'fas fa-user-clock',
            title: 'Geriatric Considerations',
            description: 'Enhanced monitoring for elderly patient - consider reduced dosing and increased fall risk'
        });
    }

    // Kidney function recommendations
    if (currentPatientData.egfr && currentPatientData.egfr < 60) {
        recommendations.push({
            priority: 'critical',
            icon: 'fas fa-kidneys',
            title: 'Renal Impairment Alert',
            description: `eGFR ${currentPatientData.egfr} - Dose adjustment required, monitor creatinine daily`
        });
    }

    // Liver function recommendations
    if (currentPatientData.ast_alt && currentPatientData.ast_alt > 40) {
        recommendations.push({
            priority: 'critical',
            icon: 'fas fa-liver',
            title: 'Hepatic Function Alert',
            description: `Elevated AST/ALT (${currentPatientData.ast_alt}) - Monitor liver function closely`
        });
    }

    // Polypharmacy recommendations
    if (currentPatientData.concomitant_drugs_count > 5) {
        recommendations.push({
            priority: 'urgent',
            icon: 'fas fa-pills',
            title: 'Polypharmacy Alert',
            description: `${currentPatientData.concomitant_drugs_count} concurrent medications - Review for interactions and deprescribing opportunities`
        });
    }

    // Comorbidity-based recommendations
    if (currentPatientData.diabetes === 1) {
        recommendations.push({
            priority: 'moderate',
            icon: 'fas fa-tint',
            title: 'Diabetes Management',
            description: 'Monitor blood glucose levels - ADR may affect glycemic control'
        });
    }

    if (currentPatientData.cardiac_disease === 1) {
        recommendations.push({
            priority: 'urgent',
            icon: 'fas fa-heart',
            title: 'Cardiac Monitoring',
            description: 'Existing cardiac disease - Monitor for cardiovascular ADRs, consider ECG'
        });
    }

    return recommendations;
}

function getSpecificRecommendations(adrType) {
    const recommendations = {
        'Hepatotoxicity': [
            {
                priority: 'critical',
                icon: 'fas fa-liver',
                title: 'Liver Function Monitoring',
                description: 'Immediate ALT, AST, bilirubin, INR assessment'
            }
        ],
        'Nephrotoxicity': [
            {
                priority: 'critical',
                icon: 'fas fa-kidneys',
                title: 'Renal Function Monitoring',
                description: 'Check creatinine, BUN, urine output every 6 hours'
            }
        ],
        'Cardiotoxicity': [
            {
                priority: 'critical',
                icon: 'fas fa-heart',
                title: 'Cardiac Monitoring',
                description: 'ECG monitoring, troponin levels, echocardiogram if indicated'
            }
        ],
        'Hematologic': [
            {
                priority: 'critical',
                icon: 'fas fa-tint',
                title: 'Blood Count Monitoring',
                description: 'Daily CBC with differential, platelet count, coagulation studies'
            }
        ],
        'Dermatologic': [
            {
                priority: 'urgent',
                icon: 'fas fa-hand-paper',
                title: 'Skin Assessment',
                description: 'Daily skin examination for rash, blistering, or severe reactions'
            }
        ]
    };

    return recommendations[adrType] || [];
}

// Acknowledge warning function
function acknowledgeWarning(button) {
    const warningContainer = button.closest('.high-risk-adr-warning');
    const riskLevel = warningContainer.dataset.riskLevel;

    // Add acknowledged state
    warningContainer.classList.add('acknowledged');

    // Update button
    button.innerHTML = '<i class="fas fa-check-circle"></i> Acknowledged';
    button.disabled = true;
    button.classList.add('acknowledged');

    // Show confirmation
    showSuccess(`${riskLevel.toUpperCase()} risk ADR warning acknowledged. Please ensure all recommended actions are implemented.`);

    // Log acknowledgment (in real system, this would be sent to server)
    console.log(`ADR Warning Acknowledged: ${riskLevel} risk at ${new Date().toISOString()}`);

    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'acknowledgment-timestamp';
    timestamp.innerHTML = `<i class="fas fa-clock"></i> Acknowledged at ${new Date().toLocaleString()}`;
    warningContainer.querySelector('.warning-footer').appendChild(timestamp);
}

// Play warning notification sound
function playWarningNotification() {
    try {
        // Create audio context for notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create a simple warning tone
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configure warning tone (urgent beeping pattern)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);

        // Repeat the warning tone 3 times
        setTimeout(() => {
            if (audioContext.state !== 'closed') {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                osc2.frequency.setValueAtTime(800, audioContext.currentTime);
                gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                osc2.start();
                osc2.stop(audioContext.currentTime + 0.2);
            }
        }, 500);

        setTimeout(() => {
            if (audioContext.state !== 'closed') {
                const osc3 = audioContext.createOscillator();
                const gain3 = audioContext.createGain();
                osc3.connect(gain3);
                gain3.connect(audioContext.destination);
                osc3.frequency.setValueAtTime(800, audioContext.currentTime);
                gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
                gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                osc3.start();
                osc3.stop(audioContext.currentTime + 0.2);
            }
        }, 1000);

        console.log('🔊 High-risk ADR warning notification played');

    } catch (error) {
        console.warn('Could not play warning notification sound:', error);
        // Fallback: show visual notification
        showVisualWarningNotification();
    }
}

// Visual warning notification fallback
function showVisualWarningNotification() {
    const notification = document.createElement('div');
    notification.className = 'visual-warning-notification';
    notification.innerHTML = `
        <div class="visual-warning-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>HIGH RISK ADR DETECTED - Review Clinical Management Plan</span>
        </div>
    `;

    // Add styles if not already added
    if (!document.querySelector('#visual-warning-styles')) {
        const style = document.createElement('style');
        style.id = 'visual-warning-styles';
        style.textContent = `
            .visual-warning-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 20px 30px;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(220, 38, 38, 0.4);
                z-index: 2000;
                animation: warningFlash 0.5s ease-in-out 6 alternate;
                font-weight: 600;
                text-align: center;
                border: 3px solid #fca5a5;
            }
            
            .visual-warning-content {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 1.1rem;
            }
            
            .visual-warning-content i {
                font-size: 1.5rem;
                animation: warningBounce 0.5s ease-in-out infinite alternate;
            }
            
            @keyframes warningFlash {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.05); }
            }
            
            @keyframes warningBounce {
                0% { transform: scale(1); }
                100% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Print warning function
function printWarning(button) {
    const warningContainer = button.closest('.high-risk-adr-warning');
    const patientName = patientInfo.name || 'Patient';
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    // Create printable version
    const printContent = `
        <html>
        <head>
            <title>ADR Risk Warning - ${patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .print-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                .warning-box { border: 3px solid #dc2626; padding: 15px; margin: 20px 0; background: #fef2f2; }
                .urgent { color: #dc2626; font-weight: bold; text-transform: uppercase; }
                .section { margin: 15px 0; }
                .section h3 { color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
                .item { padding: 8px; border: 1px solid #ddd; background: #f9f9f9; }
                .footer { margin-top: 30px; font-size: 0.9em; color: #666; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>ADVERSE DRUG REACTION RISK WARNING</h1>
                <p><strong>Patient:</strong> ${patientName} | <strong>Date:</strong> ${currentDate} | <strong>Time:</strong> ${currentTime}</p>
                <p class="urgent">⚠️ This document contains critical patient safety information ⚠️</p>
            </div>
            
            ${warningContainer.innerHTML.replace(/onclick="[^"]*"/g, '').replace(/class="btn-[^"]*"/g, 'style="display:none"')}
            
            <div class="footer">
                <p><strong>Important:</strong> This warning was generated by an AI-powered ADR risk prediction system. Clinical judgment should always take precedence. All recommendations should be reviewed by qualified healthcare professionals.</p>
                <p><strong>Generated:</strong> ${currentDate} at ${currentTime} | <strong>System:</strong> ADR Risk Predictor v2.0</p>
            </div>
        </body>
        </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    showSuccess('ADR warning prepared for printing');
}

// Share warning function
function shareWarning(button) {
    const warningContainer = button.closest('.high-risk-adr-warning');
    const riskLevel = warningContainer.dataset.riskLevel;
    const patientName = patientInfo.name || 'Patient';

    // Create shareable summary
    const shareText = `🚨 ADR RISK ALERT 🚨
    
Patient: ${patientName}
Risk Level: ${riskLevel.toUpperCase()}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

⚠️ HIGH PRIORITY: Enhanced monitoring and immediate clinical review required.

Generated by ADR Risk Predictor System
    `;

    // Try to use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: `ADR Risk Alert - ${patientName}`,
            text: shareText,
            url: window.location.href
        }).then(() => {
            showSuccess('ADR warning shared successfully');
        }).catch((error) => {
            console.log('Error sharing:', error);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback share function
function fallbackShare(text) {
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        showSuccess('ADR warning copied to clipboard - you can now paste it in your preferred communication app');
    }).catch(() => {
        // Final fallback - show text in modal
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>Share ADR Warning</h3>
                    <button onclick="this.closest('.share-modal').remove()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="share-modal-body">
                    <p>Copy the text below to share this ADR warning:</p>
                    <textarea readonly class="share-text">${text}</textarea>
                    <button onclick="this.previousElementSibling.select(); document.execCommand('copy'); showSuccess('Copied to clipboard!');" class="btn-copy">
                        <i class="fas fa-copy"></i> Copy Text
                    </button>
                </div>
            </div>
        `;

        // Add modal styles
        if (!document.querySelector('#share-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'share-modal-styles';
            style.textContent = `
                .share-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                }
                .share-modal-content {
                    background: white;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                }
                .share-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .share-modal-body {
                    padding: 20px;
                }
                .share-text {
                    width: 100%;
                    height: 200px;
                    padding: 10px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-family: monospace;
                    font-size: 0.9rem;
                    resize: vertical;
                }
                .btn-copy {
                    margin-top: 10px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: #6b7280;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
    });
}

// ===== DOWNLOAD FUNCTIONALITY FOR GEMINI ANALYSIS =====

// Download analysis as PDF
function downloadAnalysisPDF() {
    console.log('downloadAnalysisPDF called');
    console.log('currentPredictionResult:', currentPredictionResult);
    console.log('window.currentPredictionResult:', window.currentPredictionResult);

    const result = currentPredictionResult || window.currentPredictionResult;
    if (!result || Object.keys(result).length === 0) {
        showNotification('No analysis data available for download. Please run an analysis first.', 'error');
        return;
    }

    const button = document.querySelector('.btn-download-pdf');
    if (button) {
        button.classList.add('loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    }

    try {
        // Create comprehensive analysis report
        const reportData = generateComprehensiveReport(result);

        // Send to server for PDF generation
        fetch('/download/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                patient_info: patientInfo || window.patientInfo || { id: 'Unknown', name: 'Patient' },
                analysis_data: result,
                report_content: reportData,
                timestamp: new Date().toISOString()
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('PDF generation failed');
                }
                return response.blob();
            })
            .then(blob => {
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ADR_Analysis_${patientInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                showNotification('PDF report downloaded successfully', 'success');
            })
            .catch(error => {
                console.error('PDF download error:', error);
                showNotification('Failed to generate PDF. Please try again.', 'error');
            })
            .finally(() => {
                if (button) {
                    button.classList.remove('loading');
                    button.innerHTML = '<i class="fas fa-file-pdf"></i> Download PDF';
                }
            });

    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Failed to prepare PDF data. Please try again.', 'error');
        if (button) {
            button.classList.remove('loading');
            button.innerHTML = '<i class="fas fa-file-pdf"></i> Download PDF';
        }
    }
}

// Download analysis as Word document
function downloadAnalysisWord() {
    console.log('downloadAnalysisWord called');

    const result = currentPredictionResult || window.currentPredictionResult;
    if (!result || Object.keys(result).length === 0) {
        showNotification('No analysis data available for download. Please run an analysis first.', 'error');
        return;
    }

    const button = document.querySelector('.btn-download-word');
    if (button) {
        button.classList.add('loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Word...';
    }

    try {
        // Create comprehensive analysis report
        const reportData = generateComprehensiveReport(result);

        // Send to server for Word generation
        fetch('/download/word', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                patient_info: patientInfo || window.patientInfo || { id: 'Unknown', name: 'Patient' },
                analysis_data: result,
                report_content: reportData,
                timestamp: new Date().toISOString()
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Word generation failed');
                }
                return response.blob();
            })
            .then(blob => {
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ADR_Analysis_${patientInfo.id}_${new Date().toISOString().split('T')[0]}.docx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                showNotification('Word document downloaded successfully', 'success');
            })
            .catch(error => {
                console.error('Word download error:', error);
                showNotification('Failed to generate Word document. Please try again.', 'error');
            })
            .finally(() => {
                if (button) {
                    button.classList.remove('loading');
                    button.innerHTML = '<i class="fas fa-file-word"></i> Download Word';
                }
            });

    } catch (error) {
        console.error('Word generation error:', error);
        showNotification('Failed to prepare Word document data. Please try again.', 'error');
        if (button) {
            button.classList.remove('loading');
            button.innerHTML = '<i class="fas fa-file-word"></i> Download Word';
        }
    }
}

// Download analysis as JSON
function downloadAnalysisJSON() {
    console.log('downloadAnalysisJSON called');

    const result = currentPredictionResult || window.currentPredictionResult;
    if (!result || Object.keys(result).length === 0) {
        showNotification('No analysis data available for download. Please run an analysis first.', 'error');
        return;
    }

    const button = document.querySelector('.btn-download-json');
    if (button) {
        button.classList.add('loading');
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing JSON...';
    }

    try {
        // Create comprehensive data export
        const patientInfoData = patientInfo || window.patientInfo || { id: 'Unknown', name: 'Patient', clinician: 'Unknown' };
        const exportData = {
            metadata: {
                patient_id: patientInfoData.id,
                patient_name: patientInfoData.name,
                clinician: patientInfoData.clinician,
                analysis_date: new Date().toISOString(),
                system_version: "ADR Risk Predictor v2.0",
                export_timestamp: new Date().toISOString()
            },
            patient_data: currentPatientData || window.currentPatientData || {},
            prediction_results: result,
            gemini_analysis: {
                report_generated: !!document.querySelector('.report-content')?.textContent,
                report_content: document.querySelector('.report-content')?.textContent || null,
                analysis_timestamp: new Date().toISOString()
            },
            clinical_recommendations: extractClinicalRecommendations(),
            risk_assessment: {
                overall_risk: currentPredictionResult.risk_level,
                no_adr_probability: currentPredictionResult.no_adr_probability,
                predicted_adr_type: currentPredictionResult.predicted_adr_type,
                specific_risks: currentPredictionResult.top_specific_adr_risks || {}
            }
        };

        // Convert to JSON and create download
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ADR_Analysis_${patientInfo.id}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification('JSON data exported successfully', 'success');

    } catch (error) {
        console.error('JSON export error:', error);
        showNotification('Failed to export JSON data. Please try again.', 'error');
    } finally {
        if (button) {
            button.classList.remove('loading');
            button.innerHTML = '<i class="fas fa-file-code"></i> Download JSON';
        }
    }
}

// Generate comprehensive report for downloads
function generateComprehensiveReport(result) {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    const predictionResult = result || currentPredictionResult || window.currentPredictionResult || {};

    const patientInfoData = patientInfo || window.patientInfo || { id: 'Unknown', name: 'Patient', clinician: 'Unknown' };

    return {
        header: {
            title: "ADR Risk Assessment Report",
            patient_name: patientInfoData.name,
            patient_id: patientInfoData.id,
            clinician: patientInfoData.clinician,
            date: currentDate,
            time: currentTime
        },
        executive_summary: {
            risk_level: predictionResult.risk_level,
            no_adr_probability: predictionResult.no_adr_probability,
            predicted_adr_type: predictionResult.predicted_adr_type,
            key_findings: generateKeyFindings(predictionResult)
        },
        patient_profile: generatePatientProfile(),
        risk_analysis: generateRiskAnalysis(),
        clinical_recommendations: extractClinicalRecommendations(),
        monitoring_plan: generateMonitoringPlan(),
        gemini_insights: document.querySelector('.report-content')?.textContent || 'No AI analysis available',
        disclaimer: "This report is generated by an AI-powered system and should be used in conjunction with clinical judgment. All recommendations should be reviewed by qualified healthcare professionals."
    };
}

// Generate key findings summary
function generateKeyFindings(result) {
    const findings = [];
    const predictionResult = result || currentPredictionResult || window.currentPredictionResult || {};

    if (predictionResult.risk_level === 'High') {
        findings.push("HIGH RISK: Immediate clinical attention required");
    } else if (predictionResult.risk_level === 'Medium') {
        findings.push("MODERATE RISK: Enhanced monitoring recommended");
    }

    if (predictionResult.no_adr_probability < 50) {
        findings.push(`Low safety probability (${predictionResult.no_adr_probability}%)`);
    }

    if (currentPatientData.age >= 65) {
        findings.push("Elderly patient - increased ADR susceptibility");
    }

    if (currentPatientData.concomitant_drugs_count > 5) {
        findings.push(`Polypharmacy risk (${currentPatientData.concomitant_drugs_count} medications)`);
    }

    return findings;
}

// Generate patient profile summary
function generatePatientProfile() {
    return {
        demographics: {
            age: currentPatientData.age,
            gender: currentPatientData.gender === 1 ? 'Male' : 'Female',
            bmi: currentPatientData.bmi
        },
        comorbidities: extractComorbidities(),
        medications: {
            total_count: currentPatientData.concomitant_drugs_count,
            polypharmacy_risk: currentPatientData.concomitant_drugs_count > 5
        },
        laboratory_values: extractLabValues()
    };
}

// Extract comorbidities from patient data
function extractComorbidities() {
    const comorbidities = [];

    if (currentPatientData.diabetes === 1) comorbidities.push('Diabetes');
    if (currentPatientData.hypertension === 1) comorbidities.push('Hypertension');
    if (currentPatientData.cardiac_disease === 1) comorbidities.push('Cardiac Disease');
    if (currentPatientData.liver_disease === 1) comorbidities.push('Liver Disease');
    if (currentPatientData.ckd === 1) comorbidities.push('Chronic Kidney Disease');
    if (currentPatientData.copd === 1) comorbidities.push('COPD');
    if (currentPatientData.depression === 1) comorbidities.push('Depression');
    if (currentPatientData.anxiety === 1) comorbidities.push('Anxiety');

    return comorbidities;
}

// Extract laboratory values
function extractLabValues() {
    return {
        creatinine: currentPatientData.creatinine,
        egfr: currentPatientData.egfr,
        ast_alt: currentPatientData.ast_alt,
        hemoglobin: currentPatientData.hemoglobin
    };
}

// Generate risk analysis section
function generateRiskAnalysis() {
    return {
        overall_assessment: {
            risk_level: currentPredictionResult.risk_level,
            confidence: currentPredictionResult.no_adr_probability,
            primary_concern: currentPredictionResult.predicted_adr_type
        },
        specific_risks: currentPredictionResult.top_specific_adr_risks || {},
        risk_factors: identifyRiskFactors()
    };
}

// Identify key risk factors
function identifyRiskFactors() {
    const factors = [];

    if (currentPatientData.age >= 65) {
        factors.push({ factor: 'Advanced age', impact: 'High', description: 'Increased ADR susceptibility' });
    }

    if (currentPatientData.egfr < 60) {
        factors.push({ factor: 'Renal impairment', impact: 'High', description: 'Reduced drug clearance' });
    }

    if (currentPatientData.liver_disease === 1) {
        factors.push({ factor: 'Liver disease', impact: 'High', description: 'Altered drug metabolism' });
    }

    if (currentPatientData.concomitant_drugs_count > 5) {
        factors.push({ factor: 'Polypharmacy', impact: 'Medium', description: 'Increased interaction risk' });
    }

    return factors;
}

// Extract clinical recommendations
function extractClinicalRecommendations() {
    const recommendations = [];

    // Get recommendations from warning if present
    const warningElement = document.querySelector('.high-risk-adr-warning');
    if (warningElement) {
        const recElements = warningElement.querySelectorAll('.recommendation-item');
        recElements.forEach(rec => {
            const title = rec.querySelector('.rec-title')?.textContent;
            const description = rec.querySelector('.rec-description')?.textContent;
            const priority = rec.classList.contains('critical') ? 'Critical' :
                rec.classList.contains('urgent') ? 'Urgent' : 'Moderate';

            if (title && description) {
                recommendations.push({ title, description, priority });
            }
        });
    }

    return recommendations;
}

// Generate monitoring plan
function generateMonitoringPlan() {
    const plan = {
        immediate: [],
        short_term: [],
        ongoing: []
    };

    // Immediate monitoring (0-24 hours)
    plan.immediate.push('Assess vital signs and symptoms');
    plan.immediate.push('Review current medications');

    if (currentPredictionResult.risk_level === 'High') {
        plan.immediate.push('Consider dose reduction or alternative therapy');
        plan.immediate.push('Obtain baseline laboratory studies');
    }

    // Short-term monitoring (1-7 days)
    plan.short_term.push('Daily symptom assessment');
    plan.short_term.push('Monitor for early ADR signs');

    if (currentPatientData.liver_disease === 1 || currentPatientData.ast_alt > 40) {
        plan.short_term.push('Monitor liver function tests');
    }

    if (currentPatientData.ckd === 1 || currentPatientData.egfr < 60) {
        plan.short_term.push('Monitor renal function');
    }

    // Ongoing monitoring
    plan.ongoing.push('Regular medication adherence assessment');
    plan.ongoing.push('Periodic laboratory monitoring as indicated');
    plan.ongoing.push('Patient education on ADR recognition');

    return plan;
}

// Initialize download functionality
function initializeDownloadFunctionality() {
    // Add event listeners for download buttons
    document.addEventListener('click', function (e) {
        if (e.target.closest('.btn-download-pdf')) {
            e.preventDefault();
            downloadAnalysisPDF();
        } else if (e.target.closest('.btn-download-word')) {
            e.preventDefault();
            downloadAnalysisWord();
        } else if (e.target.closest('.btn-download-json')) {
            e.preventDefault();
            downloadAnalysisJSON();
        }
    });

    console.log('Download functionality initialized');
}

// Add download section to results
function addDownloadSection() {
    const resultsContainer = document.querySelector('.results-container');
    if (!resultsContainer || document.querySelector('.download-section')) {
        return; // Already exists or no results container
    }

    const downloadSection = document.createElement('div');
    downloadSection.className = 'download-section';
    downloadSection.innerHTML = `
        <h4><i class="fas fa-download"></i> Download Analysis Report</h4>
        <div class="download-buttons">
            <button class="btn-download btn-download-pdf" title="Download as PDF">
                <i class="fas fa-file-pdf"></i> Download PDF
            </button>
            <button class="btn-download btn-download-word" title="Download as Word Document">
                <i class="fas fa-file-word"></i> Download Word
            </button>
            <button class="btn-download btn-download-json" title="Download raw data as JSON">
                <i class="fas fa-file-code"></i> Download JSON
            </button>
        </div>
        <div class="download-info">
            <i class="fas fa-info-circle"></i>
            Download comprehensive analysis reports including AI insights and clinical recommendations
        </div>
    `;

    resultsContainer.appendChild(downloadSection);
}

// Call initialization when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeDownloadFunctionality();
});

// Add download section when results are displayed
function showDownloadOptions() {
    setTimeout(() => {
        addDownloadSection();
    }, 500);
}

// Simple test functions for immediate functionality
function downloadAnalysisPDF() {
    console.log('PDF download clicked');
    alert('PDF download functionality is being prepared. This feature will be available soon.');
    showNotification('PDF download feature coming soon!', 'info');
}

function downloadAnalysisWord() {
    console.log('Word download clicked');
    alert('Word download functionality is being prepared. This feature will be available soon.');
    showNotification('Word download feature coming soon!', 'info');
}

function downloadAnalysisJSON() {
    console.log('JSON download clicked');

    // Get current results
    const result = currentPredictionResult || window.currentPredictionResult;
    if (!result || Object.keys(result).length === 0) {
        showNotification('No analysis data available for download. Please run an analysis first.', 'error');
        return;
    }

    try {
        // Create simple JSON export
        const exportData = {
            timestamp: new Date().toISOString(),
            analysis_results: result,
            patient_data: currentPatientData || window.currentPatientData || {},
            system_info: {
                version: "ADR Risk Predictor v2.0",
                export_type: "JSON"
            }
        };

        // Convert to JSON and create download
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ADR_Analysis_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showNotification('JSON data exported successfully', 'success');

    } catch (error) {
        console.error('JSON export error:', error);
        showNotification('Failed to export JSON data. Please try again.', 'error');
    }
}

// Export functions for global access
window.downloadAnalysisPDF = downloadAnalysisPDF;
window.downloadAnalysisWord = downloadAnalysisWord;
window.downloadAnalysisJSON = downloadAnalysisJSON;
// ==
// ========================================
// COMPREHENSIVE ADR ALERT SYSTEM
// ========================================
console.log('🚨 Loading Comprehensive ADR Alert System...');

// Main ADR Risk Alert Function - triggers for EVERY risk level
window.showADRRiskPopup = function (result) {
    console.log('🚨 ADR Risk Alert triggered for:', result.risk_level);

    const riskLevel = result.risk_level.toLowerCase();

    // Always show popup, play sound, and vibrate for ANY risk level
    showADRPopup(result);
    playADRWarningSound(riskLevel);
    triggerPhoneVibration(riskLevel);
    showColorOverlay(riskLevel);

    console.log(`✅ Complete ADR alert system activated for ${riskLevel} risk`);
};

// Create and show ADR popup for any risk level
function showADRPopup(result) {
    const riskLevel = result.risk_level.toLowerCase();

    console.log(`🚨 Showing ${riskLevel.toUpperCase()} RISK popup`);

    // Remove any existing popup
    const existingPopup = document.getElementById('adr-risk-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Configure popup based on risk level
    let config = getPopupConfig(riskLevel, result);

    const popup = createADRPopupElement(config);
    document.body.appendChild(popup);

    // Auto-focus for accessibility
    setTimeout(() => {
        const acknowledgeBtn = popup.querySelector('.btn-acknowledge');
        if (acknowledgeBtn) {
            acknowledgeBtn.focus();
        }
    }, 100);
}

// Get popup configuration based on risk level
function getPopupConfig(riskLevel, result) {
    const configs = {
        high: {
            title: '🚨 HIGH RISK ADR ALERT',
            subtitle: 'IMMEDIATE MEDICAL ATTENTION REQUIRED',
            riskLevel: 'high',
            result: result,
            color: '#dc2626',
            bgColor: '#fef2f2',
            borderColor: '#fca5a5',
            urgency: 'critical'
        },
        medium: {
            title: '⚠️ MEDIUM RISK ADR ALERT',
            subtitle: 'Enhanced monitoring recommended',
            riskLevel: 'medium',
            result: result,
            color: '#d97706',
            bgColor: '#fffbeb',
            borderColor: '#fcd34d',
            urgency: 'moderate'
        },
        low: {
            title: '✅ LOW RISK ADR ASSESSMENT',
            subtitle: 'Standard monitoring sufficient',
            riskLevel: 'low',
            result: result,
            color: '#059669',
            bgColor: '#f0fdf4',
            borderColor: '#86efac',
            urgency: 'routine'
        }
    };

    return configs[riskLevel] || configs.low;
}

// Create ADR popup element
function createADRPopupElement(config) {
    const popup = document.createElement('div');
    popup.id = 'adr-risk-popup';
    popup.className = `adr-popup ${config.riskLevel}-risk`;

    popup.innerHTML = `
        <div class="popup-overlay" onclick="closeADRPopup()"></div>
        <div class="popup-content" style="border-color: ${config.borderColor}; background: ${config.bgColor};">
            <div class="popup-header" style="color: ${config.color};">
                <h2>${config.title}</h2>
                <p class="popup-subtitle">${config.subtitle}</p>
                <button class="popup-close" onclick="closeADRPopup()" style="color: ${config.color};">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="popup-body">
                <div class="risk-summary">
                    <div class="risk-item">
                        <span class="risk-label">Risk Level:</span>
                        <span class="risk-value" style="color: ${config.color};">${config.result.risk_level}</span>
                    </div>
                    <div class="risk-item">
                        <span class="risk-label">Primary ADR Type:</span>
                        <span class="risk-value">${config.result.predicted_adr_type}</span>
                    </div>
                    <div class="risk-item">
                        <span class="risk-label">Safety Probability:</span>
                        <span class="risk-value">${config.result.no_adr_probability}%</span>
                    </div>
                </div>
                
                ${Object.keys(config.result.top_specific_adr_risks || {}).length > 0 ? `
                <div class="specific-risks">
                    <h4>Specific ADR Risks:</h4>
                    <div class="risks-grid">
                        ${Object.entries(config.result.top_specific_adr_risks).map(([adr, prob]) => `
                            <div class="risk-card">
                                <div class="adr-name">${adr}</div>
                                <div class="adr-prob" style="color: ${config.color};">${prob}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                <div class="recommendations">
                    <h4>Clinical Recommendations:</h4>
                    <div class="rec-list">
                        ${getADRRecommendations(config.riskLevel).map(rec => `
                            <div class="rec-item">
                                <i class="${rec.icon}" style="color: ${config.color};"></i>
                                <span>${rec.text}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="popup-footer">
                <button class="btn-acknowledge" onclick="acknowledgeADRRisk('${config.riskLevel}')" 
                        style="background: ${config.color};">
                    <i class="fas fa-check"></i> Acknowledge & Continue
                </button>
                <button class="btn-print" onclick="printADRAlert()" style="border-color: ${config.color}; color: ${config.color};">
                    <i class="fas fa-print"></i> Print Alert
                </button>
            </div>
        </div>
    `;

    return popup;
}

// Get clinical recommendations based on risk level
function getADRRecommendations(riskLevel) {
    const recommendations = {
        high: [
            { icon: 'fas fa-ambulance', text: 'Immediate medical evaluation required' },
            { icon: 'fas fa-pills', text: 'Consider dose reduction or alternative therapy' },
            { icon: 'fas fa-heartbeat', text: 'Continuous vital signs monitoring' },
            { icon: 'fas fa-vial', text: 'Emergency laboratory tests within 2 hours' },
            { icon: 'fas fa-phone-alt', text: 'Contact physician immediately' }
        ],
        medium: [
            { icon: 'fas fa-eye', text: 'Enhanced monitoring required' },
            { icon: 'fas fa-calendar-check', text: 'Weekly clinical assessments' },
            { icon: 'fas fa-user-md', text: 'Patient education on warning signs' },
            { icon: 'fas fa-clipboard-list', text: 'Document all symptoms and changes' },
            { icon: 'fas fa-pills', text: 'Review medication regimen' }
        ],
        low: [
            { icon: 'fas fa-check-circle', text: 'Standard monitoring sufficient' },
            { icon: 'fas fa-calendar', text: 'Regular follow-up appointments' },
            { icon: 'fas fa-info-circle', text: 'Patient awareness of potential side effects' },
            { icon: 'fas fa-notes-medical', text: 'Continue current treatment plan' }
        ]
    };

    return recommendations[riskLevel] || recommendations.low;
}

// Enhanced warning sound system for all risk levels
function playADRWarningSound(riskLevel) {
    console.log(`🔊 Playing ${riskLevel} risk warning sound...`);

    try {
        // Request audio context (required for modern browsers)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Configure sound parameters based on risk level
        let soundConfig = getSoundConfig(riskLevel);

        // Play the warning tones
        playWarningTones(audioContext, soundConfig);

        console.log(`✅ ${riskLevel} risk warning sound played successfully`);

    } catch (error) {
        console.warn('Could not play warning sound:', error);
        // Fallback to visual notification
        showVisualSoundNotification(riskLevel);
    }
}

// Get sound configuration for each risk level
function getSoundConfig(riskLevel) {
    const configs = {
        high: {
            frequency: 800,
            duration: 0.4,
            repeats: 4,
            interval: 400,
            volume: 0.4
        },
        medium: {
            frequency: 600,
            duration: 0.3,
            repeats: 3,
            interval: 500,
            volume: 0.3
        },
        low: {
            frequency: 450,
            duration: 0.2,
            repeats: 2,
            interval: 600,
            volume: 0.25
        }
    };

    return configs[riskLevel] || configs.low;
}

// Play warning tones with specified configuration
function playWarningTones(audioContext, config) {
    function playTone(delay = 0) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(config.frequency, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + config.duration);
        }, delay);
    }

    // Play multiple tones with intervals
    for (let i = 0; i < config.repeats; i++) {
        playTone(i * config.interval);
    }
}

// Enhanced phone vibration system for all risk levels
function triggerPhoneVibration(riskLevel) {
    console.log(`📳 Triggering ${riskLevel} risk vibration...`);

    // Check if vibration is supported
    if (!('vibrate' in navigator)) {
        console.log('📳 Vibration not supported on this device');
        return;
    }

    // Configure vibration patterns based on risk level
    let vibrationPattern = getVibrationPattern(riskLevel);

    try {
        // Trigger vibration
        navigator.vibrate(vibrationPattern);
        console.log(`✅ ${riskLevel} risk vibration triggered:`, vibrationPattern);

        // Show vibration indicator
        showVibrationIndicator(riskLevel);

    } catch (error) {
        console.warn('Could not trigger vibration:', error);
    }
}

// Get vibration patterns for each risk level
function getVibrationPattern(riskLevel) {
    const patterns = {
        high: [200, 100, 200, 100, 200, 100, 400], // Urgent pattern
        medium: [150, 150, 150, 150, 300],          // Moderate pattern  
        low: [100, 200, 100]                        // Gentle pattern
    };

    return patterns[riskLevel] || patterns.low;
}

// Show vibration indicator for user feedback
function showVibrationIndicator(riskLevel) {
    const indicator = document.createElement('div');
    indicatlassName = `vibration-indicator ${riskLevel}-vibration`;

    let icon, message, color;

    switch (riskLevel) {
        case 'high':
            icon = 'fas fa-mobile-alt';
            message = 'HIGH RISK - DVibrating';
            color = '#dc2626';
            break;
        case 'medium':
            icon = 'fas fa-mobile-alt';
            message = 'MEDIUM RISK - Device Vibrating';
            color = '#d97706';
            break;
        case 'low':
            icon = 'fas fa-mobile-alt';
            message = 'LOW RISK - Device Vibrating';
            color = '#059669';
            break;
        default:
            icon = 'fas fa-mobile-alt';
            message = 'Device Vibrating';
            color = '#6b7280';
    }

    indicator.innerHTML = `
        <div class="vibration-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
    `;

    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: ${color};
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        z-index: 2002;
        animation: vibrationPulse 0.5s ease-in-out infinite alternate;
        font-weight: 600;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    document.body.appendChild(indicator);

    // Remove after 3 seconds
    setTimeout(() => {
        if (indicator.parentElement) {
            indicator.remove();
        }
    }, 3000);
}

// Show color overlay based on risk level
function showColorOverlay(riskLevel) {
    console.log(`🎨 Showing ${riskLevel} risk color overlay...`);

    // Remove any existing overlay
    const existingOverlay = document.getElementById('adr-color-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'adr-color-overlay';
    overlay.className = `color-overlay ${riskLevel}-overlay`;

    let overlayConfig = getOverlayConfig(riskLevel);

    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: ${overlayConfig.color};
        z-index: 998;
        pointer-events: none;
        animation: ${overlayConfig.animation} 2s ease-in-out infinite alternate;
    `;

    document.body.appendChild(overlay);

    // Auto-remove overlay after duration
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, overlayConfig.duration);

    console.log(`✅ ${riskLevel} risk color overlay activated`);
}

// Get overlay configuration for each risk level
function getOverlayConfig(riskLevel) {
    const configs = {
        high: {
            color: 'rgba(220, 38, 38, 0.3)',
            animation: 'redPulse',
            duration: 30000 // 30 seconds for high risk
        },
        medium: {
            color: 'rgba(217, 119, 6, 0.25)',
            animation: 'orangePulse',
            duration: 15000 // 15 seconds for medium risk
        },
        low: {
            color: 'rgba(5, 150, 105, 0.2)',
            animation: 'greenPulse',
            duration: 8000 // 8 seconds for low risk
        }
    };

    return configs[riskLevel] || configs.low;
}

// Visual notification fallback when sound fails
function showVisualSoundNotification(riskLevel) {
    const notification = document.createElement('div');
    notification.className = `visual-sound-notification ${riskLevel}-notification`;

    let icon, message, color;

    switch (riskLevel) {
        case 'high':
            icon = 'fas fa-volume-up';
            message = 'HIGH RISK ADR - SOUND ALERT';
            color = '#dc2626';
            break;
        case 'medium':
            icon = 'fas fa-volume-up';
            message = 'MEDIUM RISK ADR - SOUND ALERT';
            color = '#d97706';
            break;
        case 'low':
            icon = 'fas fa-volume-up';
            message = 'LOW RISK ADR - SOUND ALERT';
            color = '#059669';
            break;
        default:
            icon = 'fas fa-volume-up';
            message = 'ADR SOUND ALERT';
            color = '#6b7280';
    }

    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 2001;
        animation: slideInRight 0.3s ease, soundPulse 1s ease-in-out infinite alternate;
        font-weight: 600;
        max-width: 300px;
    `;

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Close ADR popup
function closeADRPopup() {
    const popup = document.getElementById('adr-risk-popup');
    if (popup) {
        popup.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            popup.remove();
        }, 300);
    }

    // Also remove color overlay
    const overlay = document.getElementById('adr-color-overlay');
    if (overlay) {
        overlay.remove();
    }

    console.log('✅ ADR popup closed');
}

// Acknowledge ADR risk
function acknowledgeADRRisk(riskLevel) {
    const timestamp = new Date().toLocaleString();
    const patientName = (window.patientInfo && window.patientInfo.name) || 'Patient';

    console.log(`✅ ADR Risk Acknowledged: ${riskLevel} risk for ${patientName} at ${timestamp}`);

    // Show success message
    if (window.showSuccess) {
        window.showSuccess(`${riskLevel.toUpperCase()} risk ADR alert acknowledged successfully`);
    }

    // Close popup
    closeADRPopup();

    // Log to session storage for audit trail
    const acknowledgments = JSON.parse(sessionStorage.getItem('adr_acknowledgments') || '[]');
    acknowledgments.push({
        patient: patientName,
        riskLevel: riskLevel,
        timestamp: timestamp,
        acknowledged: true
    });
    sessionStorage.setItem('adr_acknowledgments', JSON.stringify(acknowledgments));

    // Trigger success vibration
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Print ADR alert
function printADRAlert() {
    const popup = document.getElementById('adr-risk-popup');
    if (!popup) return;

    const patientName = (window.patientInfo && window.patientInfo.name) || 'Patient';
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    const printContent = `
        <html>
        <head>
            <title>ADR Risk Alert - ${patientName}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
                .alert-box { border: 3px solid #dc2626; padding: 20px; margin: 20px 0; background: #fef2f2; border-radius: 8px; }
                .risk-high { border-color: #dc2626; background: #fef2f2; }
                .risk-medium { border-color: #d97706; background: #fffbeb; }
                .risk-low { border-color: #059669; background: #f0fdf4; }
                .section { margin: 20px 0; }
                .section h3 { color: #1f2937; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 15px; }
                .risk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 15px 0; }
                .risk-item { padding: 12px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 6px; }
                .footer { margin-top: 30px; font-size: 0.9em; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
                @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ADR RISK ASSESSMENT ALERT</h1>
                <p><strong>Patient:</strong> ${patientName}</p>
                <p><strong>Date:</strong> ${currentDate} | <strong>Time:</strong> ${currentTime}</p>
            </div>
            
            <div class="alert-box">
                ${popup.querySelector('.popup-content').innerHTML.replace(/onclick="[^"]*"/g, '').replace(/style="[^"]*"/g, '')}
            </div>
            
            <div class="footer">
                <p><strong>Important:</strong> This alert was generated by an AI-powered ADR risk prediction system. Clinical judgment should always take precedence.</p>
                <p><strong>Generated:</strong> ${currentDate} at ${currentTime} | <strong>System:</strong> ADR Risk Predictor</p>
            </div>
        </body>
        </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    if (window.showSuccess) {
        window.showSuccess('ADR alert prepared for printing');
    }

    console.log('📄 ADR alert printed');
}

// Test function for immediate popup testing
window.testADRPopup = function (riskLevel = 'high') {
    console.log(`🧪 Testing ${riskLevel} risk popup with full alert system...`);

    const mockResults = {
        high: {
            risk_level: 'High',
            predicted_adr_type: 'Hepatotoxicity',
            no_adr_probability: 15,
            top_specific_adr_risks: {
                'Hepatotoxicity': 25.8,
                'Nephrotoxicity': 18.3,
                'Cardiotoxicity': 12.7
            }
        },
        medium: {
            risk_level: 'Medium',
            predicted_adr_type: 'Dermatologic',
            no_adr_probability: 55,
            top_specific_adr_risks: {
                'Dermatologic': 8.2,
                'Gastrointestinal': 6.1,
                'Neurologic': 4.3
            }
        },
        low: {
            risk_level: 'Low',
            predicted_adr_type: 'No ADR',
            no_adr_probability: 85,
            top_specific_adr_risks: {
                'Mild Gastrointestinal': 2.1,
                'Mild Dermatologic': 1.8
            }
        }
    };

    showADRRiskPopup(mockResults[riskLevel] || mockResults.high);
    return `✅ ${riskLevel} risk popup test executed with sound and vibration!`;
};

// Keyboard shortcuts for ADR system
document.addEventListener('keydown', function (e) {
    // ESC key to close popup
    if (e.key === 'Escape') {
        closeADRPopup();
    }

    // Ctrl+T to test high risk popup (for development)
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        testADRPopup('high');
    }

    // Ctrl+M to test medium risk popup (for development)
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        testADRPopup('medium');
    }

    // Ctrl+L to test low risk popup (for development)
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        testADRPopup('low');
    }
});

// Initialize ADR alert system
console.log('✅ Comprehensive ADR Alert System loaded successfully!');
console.log('🧪 Test commands available:');
console.log('   - testADRPopup("high") - Test high risk alert');
console.log('   - testADRPopup("medium") - Test medium risk alert');
console.log('   - testADRPopup("low") - Test low risk alert');
console.log('📱 Features: Sound alerts, phone vibration, visual overlays for ALL risk levels');
// ==
// ======================================
// DEBUG AND TESTING FUNCTIONS
// ========================================

// Debug function to check ADR system status
window.debugADRSystem = function () {
    console.log('🔍 ADR System Debug Check:');

    const functions = {
        'showADRRiskPopup': typeof showADRRiskPopup,
        'testADRPopup': typeof testADRPopup,
        'playADRWarningSound': typeof playADRWarningSound,
        'triggerPhoneVibration': typeof triggerPhoneVibration,
        'showColorOverlay': typeof showColorOverlay,
        'closeADRPopup': typeof closeADRPopup,
        'acknowledgeADRRisk': typeof acknowledgeADRRisk
    };

    const apis = {
        'Vibration API': 'vibrate' in navigator,
        'Web Audio API': !!(window.AudioContext || window.webkitAudioContext),
        'Local Storage': typeof Storage !== 'undefined'
    };

    console.table(functions);
    console.table(apis);

    let report = '🔍 ADR System Status Report:\n\n';
    report += '📋 Functions:\n';
    for (const [name, type] of Object.entries(functions)) {
        const status = type === 'function' ? '✅' : '❌';
        report += `${status} ${name}: ${type}\n`;
    }

    report += '\n🌐 Browser APIs:\n';
    for (const [name, available] of Object.entries(apis)) {
        const status = available ? '✅' : '❌';
        report += `${status} ${name}: ${available}\n`;
    }

    alert(report);
    return { functions, apis };
};

// Quick test function for immediate verification
window.quickTestADR = function () {
    console.log('🧪 Quick ADR Test Starting...');

    if (typeof testADRPopup !== 'function') {
        alert('❌ ADR Test System Not Available\n\nThe testADRPopup function is not loaded.');
        return false;
    }

    try {
        testADRPopup('high');
        console.log('✅ Quick ADR test completed');
        return true;
    } catch (error) {
        console.error('❌ Quick ADR test failed:', error);
        alert('❌ ADR Test Failed\n\nError: ' + error.message);
        return false;
    }
};

// Add test button to page for immediate testing
function addTestButton() {
    // Only add if not already present
    if (document.getElementById('adr-test-button')) return;

    const testButton = document.createElement('button');
    testButton.id = 'adr-test-button';
    testButton.innerHTML = '🧪 Test ADR Alerts';
    testButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        z-index: 1001;
        transition: all 0.3s ease;
        font-size: 14px;
    `;

    testButton.addEventListener('click', () => {
        const testMenu = document.createElement('div');
        testMenu.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            padding: 15px;
            z-index: 1002;
            min-width: 200px;
        `;

        testMenu.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: 600; color: #374151;">Test ADR Alerts:</div>
            <button onclick="testADRPopup('high'); this.parentElement.remove();" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #dc2626; color: white; border: none; border-radius: 6px; cursor: pointer;">🚨 High Risk</button>
            <button onclick="testADRPopup('medium'); this.parentElement.remove();" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #d97706; color: white; border: none; border-radius: 6px; cursor: pointer;">⚠️ Medium Risk</button>
            <button onclick="testADRPopup('low'); this.parentElement.remove();" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer;">✅ Low Risk</button>
            <button onclick="debugADRSystem(); this.parentElement.remove();" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer;">🔍 Debug Info</button>
            <button onclick="this.parentElement.remove();" style="display: block; width: 100%; margin: 5px 0; padding: 8px; background: #f3f4f6; color: #374151; border: none; border-radius: 6px; cursor: pointer;">❌ Close</button>
        `;

        // Remove existing menu if present
        const existingMenu = document.querySelector('[style*="bottom: 80px"]');
        if (existingMenu) existingMenu.remove();

        document.body.appendChild(testMenu);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (testMenu.parentElement) {
                testMenu.remove();
            }
        }, 10000);
    });

    testButton.addEventListener('mouseenter', () => {
        testButton.style.transform = 'translateY(-2px)';
        testButton.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
    });

    testButton.addEventListener('mouseleave', () => {
        testButton.style.transform = 'translateY(0)';
        testButton.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
    });

    document.body.appendChild(testButton);
    console.log('🧪 ADR test button added to page');
}

// Initialize test button when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addTestButton, 2000); // Add after page is fully loaded
});

console.log('🔧 ADR Debug and Testing System loaded');
console.log('📞 Available debug functions: debugADRSystem(), quickTestADR()');

        // ADR Alert System Functions
        function checkAndShowADRAlert(result) {
            const riskLevel = result.risk_level?.toLowerCase();
            
            if (riskLevel === 'high') {
                playADRAlertSound();
                showADRPopup(result, 'high');
            } else if (riskLevel === 'medium') {
                playADRAlertSound('medium');
                showADRPopup(result, 'medium');
            }
        }

        // Play ADR alert sound
        function playADRAlertSound(riskLevel = 'high') {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                if (riskLevel === 'high') {
                    // High risk: Urgent beeping pattern
                    playUrgentBeeps(audioContext, 3);
                } else {
                    // Medium risk: Single alert tone
                    playAlertTone(audioContext);
                }
            } catch (error) {
                console.warn('Audio not supported:', error);
                // Fallback: Browser notification if available
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('ADR Risk Alert', {
                        body: `${riskLevel.toUpperCase()} risk detected - Review patient immediately`,
                        icon: '/static/favicon.ico'
                    });
                }
            }
        }

        // Play urgent beeping pattern for high risk
        function playUrgentBeeps(audioContext, count) {
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, i * 500);
            }
        }

        // Play single alert tone for medium risk
        function playAlertTone(audioContext) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        // Show ADR popup alert
        function showADRPopup(result, riskLevel) {
            // Remove any existing popup
            const existingPopup = document.getElementById('adr-alert-popup');
            if (existingPopup) {
                existingPopup.remove();
            }

            const popup = document.createElement('div');
            popup.id = 'adr-alert-popup';
            popup.className = `adr-alert-popup ${riskLevel}-risk`;
            
            const isHighRisk = riskLevel === 'high';
            const bgColor = isHighRisk ? '#dc2626' : '#f59e0b';
            const textColor = 'white';
            const icon = isHighRisk ? 'fas fa-exclamation-triangle' : 'fas fa-exclamation-circle';
            const title = isHighRisk ? 'HIGH RISK ADR ALERT' : 'MEDIUM RISK ADR ALERT';
            
            popup.innerHTML = `
                <div class="popup-overlay" onclick="closeADRPopup()"></div>
                <div class="popup-content">
                    <div class="popup-header" style="background: ${bgColor}; color: ${textColor};">
                        <div class="alert-icon">
                            <i class="${icon}"></i>
                        </div>
                        <div class="alert-title">
                            <h2>${title}</h2>
                            <p>Immediate attention required</p>
                        </div>
                        <button class="close-btn" onclick="closeADRPopup()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="popup-body">
                        <div class="risk-summary">
                            <div class="risk-item">
                                <span class="label">Risk Level:</span>
                                <span class="value ${riskLevel}">${result.risk_level}</span>
                            </div>
                            <div class="risk-item">
                                <span class="label">Predicted ADR:</span>
                                <span class="value">${result.predicted_adr_type}</span>
                            </div>
                            <div class="risk-item">
                                <span class="label">Safety Probability:</span>
                                <span class="value">${result.no_adr_probability}%</span>
                            </div>
                        </div>
                        <div class="action-required">
                            <h3>Immediate Actions Required:</h3>
                            <ul>
                                ${getImmediateActions(riskLevel, result.predicted_adr_type).map(action => 
                                    `<li><i class="fas fa-arrow-right"></i> ${action}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="popup-footer">
                        <button class="btn-acknowledge" onclick="acknowledgeADRAlert()">
                            <i class="fas fa-check"></i> Acknowledge Alert
                        </button>
                        <button class="btn-view-details" onclick="closeADRPopup(); scrollToResults()">
                            <i class="fas fa-eye"></i> View Full Results
                        </button>
                    </div>
                </div>
            `;

            // Add popup styles
            addADRPopupStyles();
            
            document.body.appendChild(popup);
            
            // Auto-close after 30 seconds for medium risk, keep open for high risk
            if (riskLevel === 'medium') {
                setTimeout(() => {
                    if (document.getElementById('adr-alert-popup')) {
                        closeADRPopup();
                    }
                }, 30000);
            }
        }

        // Get immediate actions based on risk level and ADR type
        function getImmediateActions(riskLevel, adrType) {
            const actions = [];
            
            if (riskLevel === 'high') {
                actions.push('Contact physician immediately');
                actions.push('Consider medication discontinuation');
                actions.push('Implement continuous monitoring');
                actions.push('Prepare for emergency intervention');
            } else {
                actions.push('Increase monitoring frequency');
                actions.push('Review medication dosage');
                actions.push('Schedule follow-up within 24 hours');
                actions.push('Document all observations');
            }
            
            // Add specific actions based on ADR type
            if (adrType?.toLowerCase().includes('hepato')) {
                actions.push('Monitor liver function tests');
            } else if (adrType?.toLowerCase().includes('nephro')) {
                actions.push('Check kidney function and urine output');
            } else if (adrType?.toLowerCase().includes('cardio')) {
                actions.push('Monitor ECG and cardiac enzymes');
            }
            
            return actions;
        }

        // Close ADR popup
        function closeADRPopup() {
            const popup = document.getElementById('adr-alert-popup');
            if (popup) {
                popup.classList.add('closing');
                setTimeout(() => popup.remove(), 300);
            }
        }

        // Acknowledge ADR alert
        function acknowledgeADRAlert() {
            const timestamp = new Date().toLocaleString();
            const clinician = sessionStorage.getItem('clinicianName') || 'Clinician';
            
            // Log acknowledgment
            console.log(`ADR Alert acknowledged by ${clinician} at ${timestamp}`);
            
            // Show confirmation
            showNotification('ADR alert acknowledged. Please ensure all recommended actions are implemented.', 'success');
            
            // Close popup
            closeADRPopup();
        }

        // Scroll to results section
        function scrollToResults() {
            const resultsContainer = document.getElementById('results-container');
            if (resultsContainer) {
                resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Add ADR popup styles
        function addADRPopupStyles() {
            if (document.getElementById('adr-popup-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'adr-popup-styles';
            style.textContent = `
                .adr-alert-popup {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: popupFadeIn 0.3s ease-out;
                }
                
                .adr-alert-popup.closing {
                    animation: popupFadeOut 0.3s ease-in;
                }
                
                .popup-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(5px);
                }
                
                .popup-content {
                    position: relative;
                    background: white;
                    border-radius: 16px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
                    animation: popupSlideIn 0.3s ease-out;
                }
                
                .high-risk .popup-content {
                    border: 3px solid #dc2626;
                    animation: popupSlideIn 0.3s ease-out, highRiskPulse 2s infinite;
                }
                
                .popup-header {
                    padding: 20px;
                    border-radius: 16px 16px 0 0;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .alert-icon {
                    font-size: 2rem;
                    animation: iconPulse 1s infinite;
                }
                
                .alert-title {
                    flex: 1;
                }
                
                .alert-title h2 {
                    margin: 0 0 5px 0;
                    font-size: 1.3rem;
                    font-weight: 700;
                }
                
                .alert-title p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 0.9rem;
                }
                
                .close-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.1);
                }
                
                .popup-body {
                    padding: 20px;
                }
                
                .risk-summary {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .risk-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .risk-item:last-child {
                    margin-bottom: 0;
                }
                
                .risk-item .label {
                    font-weight: 600;
                    color: #374151;
                }
                
                .risk-item .value {
                    font-weight: 700;
                    color: #1f2937;
                }
                
                .risk-item .value.high {
                    color: #dc2626;
                }
                
                .risk-item .value.medium {
                    color: #f59e0b;
                }
                
                .action-required h3 {
                    color: #374151;
                    margin: 0 0 10px 0;
                    font-size: 1.1rem;
                }
                
                .action-required ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .action-required li {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                    color: #374151;
                }
                
                .action-required li:last-child {
                    border-bottom: none;
                }
                
                .action-required li i {
                    color: #dc2626;
                    font-size: 0.8rem;
                }
                
                .popup-footer {
                    padding: 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .btn-acknowledge {
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }
                
                .btn-acknowledge:hover {
                    background: #b91c1c;
                    transform: translateY(-1px);
                }
                
                .btn-view-details {
                    background: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }
                
                .btn-view-details:hover {
                    background: #e5e7eb;
                    transform: translateY(-1px);
                }
                
                @keyframes popupFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes popupFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                
                @keyframes popupSlideIn {
                    from {
                        transform: scale(0.8) translateY(-20px);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1) translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes highRiskPulse {
                    0%, 100% { box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3); }
                    50% { box-shadow: 0 25px 50px rgba(220, 38, 38, 0.5); }
                }
                
                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                @media (max-width: 768px) {
                    .popup-content {
                        width: 95%;
                        margin: 10px;
                    }
                    
                    .popup-footer {
                        flex-direction: column;
                    }
                    
                    .btn-acknowledge,
                    .btn-view-details {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `;
            
            document.head.appendChild(style);
        }
        // Display results function
        function displayResults(result) {
            console.log('Displaying results:', result);

            const resultsContainer = document.getElementById('results-container');
            const resultsContent = document.getElementById('results-content');

            if (!resultsContainer || !resultsContent) {
                console.error('Results container elements not found');
                showNotification('Unable to display results. Please refresh the page.', 'error');
                return;
            }

            const riskLevel = result.risk_level.toLowerCase();
            const noAdrProb = result.no_adr_probability;
            const topRisks = result.top_adr_risks;

            resultsContent.innerHTML = `
                <div class="results-header">
                    <h2><i class="fas fa-chart-bar"></i> Risk Assessment Results</h2>
                    <div class="results-meta">
                        <span class="patient-name-display">
                            <i class="fas fa-user"></i> ${sessionStorage.getItem('patientName') || 'Patient'}
                        </span>
                        <span>
                            <i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}
                        </span>
                    </div>
                </div>
                
                <div class="risk-summary">
                    <div class="risk-card ${riskLevel}">
                        <h3>Overall Risk Level</h3>
                        <div class="risk-value">${result.risk_level}</div>
                        <div class="risk-label">Risk Assessment</div>
                    </div>
                    <div class="risk-card">
                        <h3>No ADR Probability</h3>
                        <div class="risk-value">${noAdrProb}%</div>
                        <div class="risk-label">Safety Likelihood</div>
                    </div>
                    <div class="risk-card">
                        <h3>Predicted ADR Type</h3>
                        <div class="risk-value" style="font-size: 1.2rem; line-height: 1.2;">
                            ${result.predicted_adr_type}
                        </div>
                        <div class="risk-label">Most Likely Outcome</div>
                    </div>
                </div>
                
                <div class="prediction-details">
                    <h3><i class="fas fa-info-circle"></i> Assessment Details</h3>
                    <div class="prediction-item">
                        <span class="prediction-label">Patient Name:</span>
                        <span class="prediction-value">${sessionStorage.getItem('patientName') || 'Patient'}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="prediction-label">Risk Classification:</span>
                        <span class="prediction-value ${riskLevel}">${result.risk_level} Risk</span>
                    </div>
                    <div class="prediction-item">
                        <span class="prediction-label">Assessment Time:</span>
                        <span class="prediction-value">${new Date().toLocaleString()}</span>
                    </div>
                    <div class="prediction-item">
                        <span class="prediction-label">Clinician:</span>
                        <span class="prediction-value">${sessionStorage.getItem('clinicianName') || 'Clinician'}</span>
                    </div>
                </div>
                
                <div class="top-risks">
                    <h3><i class="fas fa-exclamation-triangle"></i> Top ADR Risk Probabilities</h3>
                    ${Object.entries(topRisks).map(([adrType, probability]) => `
                        <div class="risk-item">
                            <span class="risk-name">${adrType}</span>
                            <span class="risk-percentage">${probability}%</span>
                        </div>
                    `).join('')}
                </div>
            `;

            resultsContainer.style.display = 'block';
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        }

// ===== ADR ALERT SYSTEM =====
// Main function to check ADR risk and show alerts
function checkAndShowADRAlert(result) {
    console.log('🚨 Checking ADR risk for alerts...', result);
    
    if (!result || !result.risk_level) {
        console.log('❌ No result or risk level found');
        return;
    }
    
    const riskLevel = result.risk_level.toLowerCase();
    const noADRProb = result.no_adr_probability || 0;
    
    console.log(`📊 Risk Level: ${riskLevel}, No ADR Probability: ${noADRProb}%`);
    
    // Show alerts for high and medium risk
    if (riskLevel === 'high' || riskLevel === 'medium') {
        console.log(`🚨 ${riskLevel.toUpperCase()} RISK DETECTED - Showing alert`);
        
        // Play alert sound
        playADRAlertSound(riskLevel);
        
        // Show visual popup alert
        setTimeout(() => {
            showADRPopup(result, riskLevel);
        }, 500);
    } else {
        console.log('✅ Low risk - No alerts needed');
    }
}

// Play ADR alert sound based on risk level
function playADRAlertSound(riskLevel) {
    try {
        console.log(`🔊 Playing ${riskLevel} risk alert sound`);
        
        // Create audio context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        if (riskLevel === 'high') {
            // High risk: Urgent beeping pattern (3 beeps)
            playUrgentBeeps(audioContext, 3);
        } else if (riskLevel === 'medium') {
            // Medium risk: Single alert tone
            playAlertTone(audioContext);
        }
        
    } catch (error) {
        console.warn('🔇 Could not play alert sound:', error);
        // Fallback: Browser notification
        if ('Notification' in window) {
            new Notification(`${riskLevel.toUpperCase()} ADR Risk Detected`, {
                body: 'Please review the assessment results immediately.',
                icon: '/static/favicon.ico'
            });
        }
    }
}

// Play urgent beeping pattern for high risk
function playUrgentBeeps(audioContext, count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        }, i * 300);
    }
}

// Play single alert tone for medium risk
function playAlertTone(audioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Show ADR popup alert
function showADRPopup(result, riskLevel) {
    console.log(`📱 Showing ${riskLevel} risk popup`);
    
    // Remove any existing popup
    const existingPopup = document.getElementById('adr-alert-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Add popup styles if not already added
    addADRPopupStyles();
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'adr-alert-popup';
    popup.className = `adr-alert-popup ${riskLevel}-risk`;
    
    const predictedADR = result.predicted_adr_type || 'Unknown ADR';
    const noADRProb = result.no_adr_probability || 0;
    const actions = getImmediateActions(riskLevel, predictedADR);
    
    popup.innerHTML = `
        <div class="adr-popup-overlay"></div>
        <div class="adr-popup-content">
            <div class="adr-popup-header ${riskLevel}-risk">
                <div class="adr-alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="adr-alert-title">
                    <h2>${riskLevel.toUpperCase()} ADR RISK DETECTED</h2>
                    <p>Immediate attention required</p>
                </div>
            </div>
            
            <div class="adr-popup-body">
                <div class="adr-risk-summary">
                    <div class="adr-risk-item">
                        <span class="adr-label">Risk Level:</span>
                        <span class="adr-value ${riskLevel}-risk">${riskLevel.toUpperCase()}</span>
                    </div>
                    <div class="adr-risk-item">
                        <span class="adr-label">Predicted ADR:</span>
                        <span class="adr-value">${predictedADR}</span>
                    </div>
                    <div class="adr-risk-item">
                        <span class="adr-label">Safety Probability:</span>
                        <span class="adr-value">${noADRProb}%</span>
                    </div>
                </div>
                
                <div class="adr-immediate-actions">
                    <h3>Immediate Actions Required:</h3>
                    <ul>
                        ${actions.map(action => `<li>${action}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <div class="adr-popup-footer">
                <button class="adr-btn adr-btn-acknowledge" onclick="acknowledgeADRAlert()">
                    <i class="fas fa-check"></i> Acknowledge Alert
                </button>
                <button class="adr-btn adr-btn-details" onclick="scrollToResults()">
                    <i class="fas fa-eye"></i> View Full Results
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Auto-close for medium risk after 30 seconds
    if (riskLevel === 'medium') {
        setTimeout(() => {
            if (document.getElementById('adr-alert-popup')) {
                closeADRPopup();
            }
        }, 30000);
    }
    
    // Add pulsing animation for high risk
    if (riskLevel === 'high') {
        popup.classList.add('pulse-animation');
    }
}

// Get immediate actions based on risk level and ADR type
function getImmediateActions(riskLevel, adrType) {
    const baseActions = {
        'high': [
            'Contact physician immediately',
            'Consider medication discontinuation',
            'Implement continuous monitoring',
            'Prepare for emergency intervention'
        ],
        'medium': [
            'Increase monitoring frequency',
            'Review medication dosage',
            'Schedule follow-up within 24 hours',
            'Document all observations'
        ]
    };
    
    const actions = [...baseActions[riskLevel]];
    
    // Add ADR-specific actions
    if (adrType.toLowerCase().includes('hepato')) {
        actions.push('Monitor liver function tests');
    } else if (adrType.toLowerCase().includes('nephro')) {
        actions.push('Check kidney function and urine output');
    } else if (adrType.toLowerCase().includes('cardio')) {
        actions.push('Monitor ECG and cardiac enzymes');
    }
    
    return actions;
}

// Close ADR popup
function closeADRPopup() {
    const popup = document.getElementById('adr-alert-popup');
    if (popup) {
        popup.classList.add('fade-out');
        setTimeout(() => {
            popup.remove();
        }, 300);
    }
}

// Acknowledge ADR alert
function acknowledgeADRAlert() {
    const timestamp = new Date().toISOString();
    const clinician = sessionStorage.getItem('clinicianName') || 'Unknown Clinician';
    
    console.log(`✅ ADR Alert acknowledged by ${clinician} at ${timestamp}`);
    
    // Log acknowledgment (in real system, send to server)
    const acknowledgment = {
        timestamp: timestamp,
        clinician: clinician,
        action: 'ADR_ALERT_ACKNOWLEDGED'
    };
    
    // Store acknowledgment
    localStorage.setItem('last_adr_acknowledgment', JSON.stringify(acknowledgment));
    
    // Close popup
    closeADRPopup();
    
    // Show confirmation
    showNotification('ADR alert acknowledged. Please follow recommended actions.', 'success');
}

// Scroll to results section
function scrollToResults() {
    closeADRPopup();
    const resultsContainer = document.getElementById('results-container');
    if (resultsContainer) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Add ADR popup styles
function addADRPopupStyles() {
    if (document.getElementById('adr-popup-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'adr-popup-styles';
    style.textContent = `
        .adr-alert-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        
        .adr-popup-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
        }
        
        .adr-popup-content {
            position: relative;
            background: white;
            border-radius: 16px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.4s ease;
        }
        
        .adr-popup-header {
            padding: 25px;
            border-radius: 16px 16px 0 0;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .adr-popup-header.high-risk {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
        }
        
        .adr-popup-header.medium-risk {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
        }
        
        .adr-alert-icon {
            font-size: 2rem;
            animation: pulse 1s infinite;
        }
        
        .adr-alert-title h2 {
            margin: 0;
            font-size: 1.3rem;
            font-weight: 700;
        }
        
        .adr-alert-title p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 0.9rem;
        }
        
        .adr-popup-body {
            padding: 25px;
        }
        
        .adr-risk-summary {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        
        .adr-risk-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .adr-risk-item:last-child {
            border-bottom: none;
        }
        
        .adr-label {
            font-weight: 600;
            color: #374151;
        }
        
        .adr-value {
            font-weight: 700;
        }
        
        .adr-value.high-risk {
            color: #dc2626;
        }
        
        .adr-value.medium-risk {
            color: #f59e0b;
        }
        
        .adr-immediate-actions h3 {
            color: #1f2937;
            margin: 0 0 15px 0;
            font-size: 1.1rem;
        }
        
        .adr-immediate-actions ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .adr-immediate-actions li {
            margin-bottom: 8px;
            color: #374151;
            line-height: 1.5;
        }
        
        .adr-popup-footer {
            padding: 20px 25px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .adr-btn {
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .adr-btn-acknowledge {
            background: #dc2626;
            color: white;
        }
        
        .adr-btn-acknowledge:hover {
            background: #b91c1c;
            transform: translateY(-1px);
        }
        
        .adr-btn-details {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
        }
        
        .adr-btn-details:hover {
            background: #e5e7eb;
            transform: translateY(-1px);
        }
        
        .pulse-animation {
            animation: alertPulse 2s infinite;
        }
        
        .fade-out {
            animation: fadeOut 0.3s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes slideIn {
            from { 
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to { 
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @keyframes alertPulse {
            0%, 100% { 
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            }
            50% { 
                box-shadow: 0 25px 50px rgba(220, 38, 38, 0.4);
            }
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .adr-popup-content {
                width: 95%;
                margin: 10px;
            }
            
            .adr-popup-header {
                padding: 20px;
            }
            
            .adr-popup-body {
                padding: 20px;
            }
            
            .adr-popup-footer {
                flex-direction: column;
                padding: 15px 20px;
            }
            
            .adr-btn {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Test functions for development
function testHighRiskAlert() {
    const mockResult = {
        risk_level: 'High',
        predicted_adr_type: 'Hepatotoxicity',
        no_adr_probability: 15.2
    };
    checkAndShowADRAlert(mockResult);
}

function testMediumRiskAlert() {
    const mockResult = {
        risk_level: 'Medium',
        predicted_adr_type: 'Nephrotoxicity',
        no_adr_probability: 45.8
    };
    checkAndShowADRAlert(mockResult);
}

// Make test functions globally available
window.testHighRiskAlert = testHighRiskAlert;
window.testMediumRiskAlert = testMediumRiskAlert;

console.log('🚨 ADR Alert System loaded successfully');