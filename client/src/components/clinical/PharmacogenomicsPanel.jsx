import { cn } from '@/lib/utils'

/**
 * Renders the `pharmacogenomics` block of a /predict response.
 *
 * Shape (from services/pharmacogenomics/*):
 *   cyp_metabolism.individual_enzymes[NAME] = { genotype, activity_score, risk_level, clinical_impact }
 *   cyp_metabolism.composite_metabolism_score
 *   transporter_profile / hla_screening where present
 */

const RISK_TONE = {
  Low: 'bg-risk-low-bg text-risk-low border-risk-low-border',
  Moderate: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  Intermediate: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  High: 'bg-risk-high-bg text-risk-high border-risk-high-border',
  Critical: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
}

function RiskChip({ level }) {
  if (!level) return null
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold',
        RISK_TONE[level] || 'bg-muted',
      )}
    >
      {level}
    </span>
  )
}

function EnzymeRow({ name, data }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 border-b py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {name}
          <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
            {data.genotype}
          </span>
        </p>
        {data.clinical_impact ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {data.clinical_impact}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {typeof data.activity_score === 'number' ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            {data.activity_score.toFixed(2)}
          </span>
        ) : null}
        <RiskChip level={data.risk_level} />
      </div>
    </li>
  )
}

export function PharmacogenomicsPanel({ pharmacogenomics, className }) {
  if (!pharmacogenomics) return null

  const cyp = pharmacogenomics.cyp_metabolism
  const enzymes = cyp?.individual_enzymes || {}
  const transporters =
    pharmacogenomics.transporter_profile?.individual_transporters ||
    pharmacogenomics.transporter_profile ||
    null
  const hla = pharmacogenomics.hla_screening || pharmacogenomics.hla || null

  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Pharmacogenomic profile</h3>
        {typeof cyp?.composite_metabolism_score === 'number' ? (
          <p className="text-xs text-muted-foreground">
            Composite metabolism score{' '}
            <span className="font-semibold tabular-nums text-foreground">
              {cyp.composite_metabolism_score}
            </span>
          </p>
        ) : null}
      </div>

      {cyp?.overall_risk ? (
        <p className="mt-3 rounded-lg border bg-muted/40 px-4 py-2.5 text-sm">
          {cyp.overall_risk}
        </p>
      ) : null}

      {Object.keys(enzymes).length > 0 ? (
        <ul className="mt-4">
          {Object.entries(enzymes).map(([name, data]) => (
            <EnzymeRow key={name} name={name} data={data} />
          ))}
        </ul>
      ) : null}

      {transporters && typeof transporters === 'object' ? (
        <div className="mt-5 border-t pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Transporters
          </h4>
          <ul className="mt-2">
            {Object.entries(transporters)
              .filter(([, data]) => data && typeof data === 'object' && 'genotype' in data)
              .map(([name, data]) => (
                <EnzymeRow key={name} name={name} data={data} />
              ))}
          </ul>
        </div>
      ) : null}

      {hla && Array.isArray(hla.risk_alleles_detected) && hla.risk_alleles_detected.length > 0 ? (
        <div className="mt-5 border-t pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            HLA risk alleles detected
          </h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {hla.risk_alleles_detected.map((allele) => (
              <li
                key={typeof allele === 'string' ? allele : allele.allele}
                className="rounded-full border border-risk-critical-border bg-risk-critical-bg px-2.5 py-1 text-xs font-semibold text-risk-critical"
              >
                {typeof allele === 'string' ? allele : allele.allele}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
