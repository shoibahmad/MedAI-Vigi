/**
 * Patient Counselling System - Main Entrypoint
 * Orchestrates multi-step counselling workflow, comprehension verification, and digital signatures.
 */

import { CounsellingState, initializeSession, navigateStep } from './counselling/session.js';
import { initializeSignaturePad } from './counselling/signatures.js';
import { calculateComprehensionScore, submitCounsellingRecord } from './counselling/content.js';

export {
    CounsellingState,
    initializeSession,
    navigateStep,
    initializeSignaturePad,
    calculateComprehensionScore,
    submitCounsellingRecord
};

document.addEventListener('DOMContentLoaded', () => {
    initializeSession();
    initializeSignaturePad('patient-signature-pad', 'clear-patient-sig', 'patient');
    initializeSignaturePad('counsellor-signature-pad', 'clear-counsellor-sig', 'counsellor');

    // Navigation buttons
    document.querySelectorAll('[data-counsel-nav]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dir = parseInt(e.currentTarget.getAttribute('data-counsel-nav'), 10);
            navigateStep(dir);
        });
    });

    // Comprehension checkboxes
    document.querySelectorAll('.comprehension-check').forEach(cb => {
        cb.addEventListener('change', calculateComprehensionScore);
    });

    // Final submit
    const submitBtn = document.getElementById('submit-counselling-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            try {
                await submitCounsellingRecord();
                alert("Counselling session recorded successfully.");
            } catch (err) {
                console.error("Counselling submission error:", err);
                alert("Failed to submit counselling record.");
            }
        });
    }
});
