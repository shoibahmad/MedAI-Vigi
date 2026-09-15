/**
 * Risk tier helpers.
 * Thresholds mirror MLService.predict in services/ml_service.py:
 *   Critical >= 75, High >= 50, Moderate >= 25, otherwise Low.
 */

export const RISK_TIERS = {
  Low: { key: 'low', label: 'Low', min: 0 },
  Moderate: { key: 'moderate', label: 'Moderate', min: 25 },
  High: { key: 'high', label: 'High', min: 50 },
  Critical: { key: 'critical', label: 'Critical', min: 75 },
}

export function riskTierFromScore(score) {
  const n = Number(score)
  if (Number.isNaN(n)) return RISK_TIERS.Low
  if (n >= 75) return RISK_TIERS.Critical
  if (n >= 50) return RISK_TIERS.High
  if (n >= 25) return RISK_TIERS.Moderate
  return RISK_TIERS.Low
}

/**
 * The /predict response names the score `overall_adr_risk` (0-100) and the tier
 * `risk_level`. Prefer the server's own tier string; fall back to deriving it.
 */
export function riskScoreOf(prediction) {
  const raw = prediction?.overall_adr_risk
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

export function resolveRiskTier(prediction) {
  const level = prediction?.risk_level
  if (level && RISK_TIERS[level]) return RISK_TIERS[level]
  return riskTierFromScore(riskScoreOf(prediction))
}

const TIER_CLASSES = {
  low: {
    text: 'text-risk-low',
    bg: 'bg-risk-low-bg',
    border: 'border-risk-low-border',
    chip: 'bg-risk-low-bg text-risk-low border-risk-low-border',
    fill: 'var(--risk-low)',
  },
  moderate: {
    text: 'text-risk-moderate',
    bg: 'bg-risk-moderate-bg',
    border: 'border-risk-moderate-border',
    chip: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
    fill: 'var(--risk-moderate)',
  },
  high: {
    text: 'text-risk-high',
    bg: 'bg-risk-high-bg',
    border: 'border-risk-high-border',
    chip: 'bg-risk-high-bg text-risk-high border-risk-high-border',
    fill: 'var(--risk-high)',
  },
  critical: {
    text: 'text-risk-critical',
    bg: 'bg-risk-critical-bg',
    border: 'border-risk-critical-border',
    chip: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
    fill: 'var(--risk-critical)',
  },
}

export function riskClasses(tierKey) {
  return TIER_CLASSES[tierKey] || TIER_CLASSES.low
}
