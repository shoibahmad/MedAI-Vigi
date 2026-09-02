/**
 * Counselling Content & Form Submission Module
 * Computes patient comprehension scores and submits verified assessment payloads to /api/counselling/submit.
 */

import { CounsellingState } from './session.js';

export function calculateComprehensionScore() {
    const checkboxes = document.querySelectorAll('.comprehension-check:checked');
    const total = document.querySelectorAll('.comprehension-check').length || 1;
    const score = Math.round((checkboxes.length / total) * 100);

    const scoreDisplay = document.getElementById('comprehension-score-display');
    if (scoreDisplay) {
        scoreDisplay.textContent = `${score}%`;
        scoreDisplay.className = score >= 80 ? 'text-success font-weight-bold' : 'text-warning font-weight-bold';
    }
    return score;
}

export async function submitCounsellingRecord() {
    const payload = {
        session_id: CounsellingState.sessionId,
        patient_name: document.getElementById('counselling-patient-name')?.value || "Patient",
        counsellor_name: document.getElementById('counsellor-name')?.value || "Clinician",
        comprehension_score: calculateComprehensionScore(),
        signatures: CounsellingState.signatures,
        completed_at: new Date().toISOString()
    };

    const response = await fetch('/api/counselling/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Submission failed with status ${response.status}`);
    }
    return await response.json();
}
