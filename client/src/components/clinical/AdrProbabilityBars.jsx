import { cn } from '@/lib/utils'

/**
 * Predicted probability per ADR class.
 *
 * The job here is magnitude comparison across ~7 classes, not identity, so this is
 * a sequential single-hue bar set -- not seven categorical colors. Every bar is
 * direct-labeled with its value, so color carries emphasis only and the ranking is
 * readable in grayscale and in print.
 */
export function AdrProbabilityBars({ probabilities, className, max = 8 }) {
  const entries = Object.entries(probabilities || {})
    .map(([label, value]) => {
      const n = Number(value)
      return { label, value: n <= 1 ? n * 100 : n }
    })
    .filter((d) => Number.isFinite(d.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, max)

  if (entries.length === 0) return null

  const peak = Math.max(...entries.map((d) => d.value), 1)

  return (
    <div className={cn('space-y-3', className)}>
      {entries.map(({ label, value }, index) => (
        <div key={label} className="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-sm text-muted-foreground" title={label}>
            {label}
          </span>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${Math.max((value / peak) * 100, value > 0 ? 2 : 0)}%`,
                // Sequential: the leading class sits at full strength, the rest step
                // back in opacity of the same hue rather than taking new hues.
                backgroundColor: 'var(--primary)',
                opacity: Math.max(1 - index * 0.13, 0.35),
              }}
            />
          </div>

          <span className="w-14 text-right text-sm font-medium tabular-nums">
            {value.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
