/**
 * Patient counselling session logic.
 *
 * Ported from static/js/counselling/session.js and counselling/content.js.
 * The DOM halves (navigateStep, initializeSession, the querySelector-based score
 * reader) are dropped -- React owns step navigation and checkbox state now, so only
 * the pure rules survive here.
 *
 * Pure module: no imports, no aliases, so node:test can import it directly.
 */

export const COUNSELLING_TOTAL_STEPS = 6

/** The 6 steps found in templates/patient_counselling.html:111-751. */
export const COUNSELLING_STEPS = [
  { id: 'setup', title: 'Session Setup', description: 'Configure the counselling session parameters' },
  {
    id: 'education',
    title: 'Medication Education',
    description: 'Drug-specific education and administration guidance',
  },
  {
    id: 'adr',
    title: 'ADR Awareness & Reporting',
    description: 'Side effects education and escalation criteria',
  },
  {
    id: 'comprehension',
    title: 'Comprehension Assessment',
    description: 'Teach-Back method to verify patient understanding',
  },
  {
    id: 'followup',
    title: 'Follow-Up Planning',
    description: 'Schedule monitoring and next appointments',
  },
  {
    id: 'consent',
    title: 'Consent & Documentation',
    description: 'Digital acknowledgment and session completion',
  },
]

export function generateSessionId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `CSL-${timestamp}-${random}`.toUpperCase()
}

export function createCounsellingState() {
  return {
    currentStep: 1,
    totalSteps: COUNSELLING_TOTAL_STEPS,
    sessionId: generateSessionId(),
    sessionStartTime: new Date().toISOString(),
    signatures: { patient: null, counsellor: null },
  }
}

/** Percentage of comprehension checkboxes ticked. Mirrors calculateComprehensionScore. */
export function calculateComprehensionScore(checkedCount, totalCount) {
  const total = totalCount || 1
  return Math.round((checkedCount / total) * 100)
}

/** The old UI turned green at >= 80%; keep that threshold. */
export function comprehensionVerdict(score) {
  if (score >= 80) {
    return { level: 'adequate', label: 'Adequate comprehension', tone: 'success' }
  }
  if (score >= 50) {
    return { level: 'partial', label: 'Partial comprehension - reinforce key topics', tone: 'warning' }
  }
  return { level: 'inadequate', label: 'Inadequate comprehension - repeat counselling', tone: 'error' }
}

export function clampStep(step, total = COUNSELLING_TOTAL_STEPS) {
  return Math.min(Math.max(step, 1), total)
}

export function stepProgressPercent(step, total = COUNSELLING_TOTAL_STEPS) {
  return Math.round((clampStep(step, total) / total) * 100)
}
