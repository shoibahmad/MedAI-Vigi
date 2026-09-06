import { AlertTriangle, CheckCircle2, ShieldAlert, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'
import { resolveRiskTier, riskClasses, riskScoreOf } from '@/lib/risk'

/**
 * Risk headline for the AI column.
 *
 * The score itself comes from the classifier, not the language model, so the
 * wording is deliberately "interpreting" rather than presenting this as a second,
 * independent estimate. It is repeated here so the narrative below never has to
 * be read against the other column to know what risk it is discussing.
 */

const TIER_ICONS = {
  low: CheckCircle2,
  moderate: TriangleAlert,
  high: ShieldAlert,
  critical: AlertTriangle,
}

export function AiRiskBanner({ prediction, className }) {
  if (!prediction) return null

  const tier = resolveRiskTier(prediction)
  const styles = riskClasses(tier.key)
  const Icon = TIER_ICONS[tier.key] || TriangleAlert

  const score = Math.max(0, Math.min(100, riskScoreOf(prediction)))
  const noAdr = Number(prediction.no_adr_probability)

  return (
    <section
      className={cn('overflow-hidden rounded-lg border', styles.border, styles.bg, className)}
      aria-label="Risk being interpreted by the AI analysis"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-lg bg-card',
              styles.text,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              ADR risk probability
            </p>
            <p className="flex items-baseline gap-1.5">
              <span className={cn('text-3xl font-bold tabular-nums', styles.text)}>
                {score.toFixed(1)}
              </span>
              <span className={cn('text-base font-semibold', styles.text)}>%</span>
              <span
                className={cn(
                  'ml-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
                  styles.chip,
                )}
              >
                {tier.label}
              </span>
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-right">
          {prediction.predicted_adr_type ? (
            <div>
              <dt className="text-xs text-muted-foreground">Most likely</dt>
              <dd className="text-sm font-semibold">{prediction.predicted_adr_type}</dd>
            </div>
          ) : null}
          {Number.isFinite(noAdr) ? (
            <div>
              <dt className="text-xs text-muted-foreground">No reaction</dt>
              <dd className="text-sm font-semibold tabular-nums">{noAdr.toFixed(2)}%</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {/* Meter repeats the score visually, which reads faster than the figure. */}
      <div className="h-1.5 w-full bg-card/60">
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${score}%`, backgroundColor: styles.fill }}
        />
      </div>

      <p className="bg-card/50 px-4 py-2 text-xs text-muted-foreground">
        The analysis below interprets this score. It is produced by the classifier, not the
        language model.
      </p>
    </section>
  )
}
