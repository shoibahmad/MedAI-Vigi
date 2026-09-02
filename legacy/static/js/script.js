/**
 * MedAI-VIGI Clinical Assistant - Main Orchestration Script
 * Modular coordinator integrating navigation, form validation, dosing, risk analytics, and reports.
 */

import { initializeNavigation } from './modules/navigation.js';
import { setupBMICalculation, extractFormData, loadSampleData } from './modules/form.js';
import { renderRiskResults } from './modules/risk_chart.js';
import { fetchClinicalReport, displayFormattedReport } from './modules/report.js';
import { checkDrugInteractions, renderInteractionAlerts } from './modules/interactions.js';

// Global application state
window.currentPatientData = {};
window.currentPredictionResult = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log('MedAI-VIGI UI Initializing...');

    // 1. Initialize Navigation
    initializeNavigation();

    // 2. Setup Form & BMI Listeners
    setupBMICalculation();

    // 3. Bind Form Submission
    const form = document.getElementById('adr-form');
    const resultsContainer = document.getElementById('results-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const generateReportBtn = document.getElementById('generate-report');
    const reportContainer = document.getElementById('report-container');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = extractFormData(form);
            window.currentPatientData = payload;

            if (loadingOverlay) loadingOverlay.classList.remove('d-none');

            try {
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`Inference error ${response.status}`);
                const result = await response.json();
                window.currentPredictionResult = result;

                if (resultsContainer) {
                    resultsContainer.classList.remove('d-none');
                    renderRiskResults(resultsContainer, result);
                    resultsContainer.scrollIntoView({ behavior: 'smooth' });
                }

                if (generateReportBtn) {
                    generateReportBtn.disabled = false;
                }
            } catch (err) {
                console.error("Prediction request failed:", err);
                alert("Failed to calculate ADR risk. Please verify input values.");
            } finally {
                if (loadingOverlay) loadingOverlay.classList.add('d-none');
            }
        });
    }

    // 4. Bind Report Generation
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', async () => {
            if (!window.currentPatientData || !window.currentPredictionResult) return;

            generateReportBtn.disabled = true;
            generateReportBtn.innerHTML = '<span class="spinner-border spinner-border-sm mr-2"></span>Generating AI Report...';

            try {
                const report = await fetchClinicalReport(window.currentPatientData, window.currentPredictionResult);
                if (reportContainer) {
                    reportContainer.classList.remove('d-none');
                    displayFormattedReport(reportContainer, report);
                    reportContainer.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                console.error("Report generation failed:", err);
                alert("Could not generate clinical report.");
            } finally {
                generateReportBtn.disabled = false;
                generateReportBtn.innerHTML = '<i class="fas fa-file-medical-alt mr-2"></i>Generate Comprehensive Report';
            }
        });
    }

    // 5. Sample Data Preset Buttons
    document.querySelectorAll('[data-sample]').forEach(button => {
        button.addEventListener('click', async (e) => {
            const sampleType = e.currentTarget.getAttribute('data-sample');
            await loadSampleData(sampleType);
        });
    });

    // 6. Clear Form Handler
    const clearBtn = document.getElementById('clear-form');
    if (clearBtn && form) {
        clearBtn.addEventListener('click', () => {
            form.reset();
            if (resultsContainer) resultsContainer.classList.add('d-none');
            if (reportContainer) reportContainer.classList.add('d-none');
            window.currentPatientData = {};
            window.currentPredictionResult = {};
        });
    }
});