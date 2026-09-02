/**
 * Counselling Session State & Navigation Module
 * Manages multi-step workflow progress, session timers, and step validation.
 */

export const CounsellingState = {
    currentStep: 1,
    totalSteps: 6,
    sessionStartTime: null,
    sessionId: null,
    patientData: {},
    predictionData: {},
    formData: {},
    signatures: {
        patient: null,
        counsellor: null
    }
};

export function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `CSL-${timestamp}-${random}`.toUpperCase();
}

export function initializeSession() {
    CounsellingState.sessionStartTime = new Date();
    CounsellingState.sessionId = generateSessionId();

    const sessionIdEl = document.getElementById('counselling-session-id');
    if (sessionIdEl) sessionIdEl.textContent = CounsellingState.sessionId;

    const clinicianName = sessionStorage.getItem('clinicianName');
    const counsellorInput = document.getElementById('counsellor-name');
    if (clinicianName && counsellorInput) {
        counsellorInput.value = clinicianName;
    }
}

export function navigateStep(direction) {
    const newStep = CounsellingState.currentStep + direction;
    if (newStep < 1 || newStep > CounsellingState.totalSteps) return;

    // Hide all steps
    document.querySelectorAll('.counselling-step').forEach(el => {
        el.classList.add('d-none');
    });

    // Show target step
    const targetEl = document.getElementById(`counselling-step-${newStep}`);
    if (targetEl) targetEl.classList.remove('d-none');

    CounsellingState.currentStep = newStep;

    // Update progress bar
    const progressPercent = Math.round((newStep / CounsellingState.totalSteps) * 100);
    const progressBar = document.getElementById('counselling-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
        progressBar.setAttribute('aria-valuenow', progressPercent);
    }
}
