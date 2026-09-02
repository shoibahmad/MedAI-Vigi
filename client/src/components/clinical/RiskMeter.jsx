import { AlertTriangle, CheckCircle2, ShieldAlert, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveRiskTier, riskClasses, riskScoreOf } from '@/lib/risk'

/**
 * ADR risk presented as a hero figure over a banded meter.
 *
 * Deliberately NOT the radial d3 gauge this replaces: a single ratio against a
 * limit is a meter, and a lone value is a hero number -- a gauge spends a lot of
 * pixels to say one thing, and it does not print well.
 *
 * Accessibility contract for the status palette: the moderate and high tints are
 * adjacent hues that fall below the categorical CVD separation floor, so the tier
 * is ALWAYS carried by an icon, the tier word, and the numeric score as well as by
 * color. Do not strip any of those.
 */

const TIER_ICONS = {
  low: CheckCircle2,
  moderate: TriangleAlert,
  high: ShieldAlert,
  critical: AlertTriangle,
}

const BANDS = [
  { key: 'low', label: 'Low', range: '0-24', from: 0, to: 25 },
  { key: 'moderate', label: 'Moderate', range: '25-49', from: 25, to: 50 },
  { key: 'high', label: 'High', range: '50-74', from: 50, to: 75 },
  { key: 'critical', label: 'Critical', range: '75-100', from: 75, to: 100 },
]

export function RiskMeter({ prediction, className }) {
  const tier = resolveRiskTier(prediction)
  const styles = riskClasses(tier.key)
  const Icon = TIER_ICONS[tier.key] || TriangleAlert

  const clamped = Math.max(0, Math.min(100, riskScoreOf(prediction)))
  const noAdr = Number(prediction?.no_adr_probability)

  return (
    <section
      className={cn('rounded-xl border bg-card p-6', className)}
      aria-label="Adverse drug reaction risk"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">
            Overall ADR Risk Probability
          </h2>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-6xl font-bold tabular-nums tracking-tight">
              {clamped.toFixed(1)}
            </span>
            <span className="text-2xl font-semibold text-muted-foreground">%</span>
          </p>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold',
            styles.chip,
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {tier.label} Risk
        </span>
      </div>

      <div className="mt-6">
        <div
          className="relative h-3 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuenow={Number(clamped.toFixed(1))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${clamped.toFixed(1)} percent, ${tier.label} risk`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${clamped}%`, backgroundColor: styles.fill }}
          />
        </div>

        {/* Numeric ranges are the secondary encoding the status palette requires. */}
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {BANDS.map((band) => {
            const active = band.key === tier.key
            const bandStyles = riskClasses(band.key)
            return (
              <li
                key={band.key}
                className={cn(
                  'flex items-center gap-2 text-xs',
                  active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: bandStyles.fill }}
                  aria-hidden="true"
                />
                <span>
                  {band.label}
                  <span className="ml-1 tabular-nums opacity-70">{band.range}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {prediction?.predicted_adr_type || Number.isFinite(noAdr) ? (
        <div className="mt-6 grid gap-4 border-t pt-4 sm:grid-cols-2">
          {prediction?.predicted_adr_type ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Most likely reaction</h3>
              <p className="mt-1 text-lg font-semibold">{prediction.predicted_adr_type}</p>
            </div>
          ) : null}
          {Number.isFinite(noAdr) ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Probability of no reaction
              </h3>
              <p className="mt-1 text-lg font-semibold tabular-nums">{noAdr.toFixed(2)}%</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
