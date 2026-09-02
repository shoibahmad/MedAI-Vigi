import { useId } from 'react'
import { AlertTriangle, Check, TriangleAlert } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { interpretLabValue, labStateFor } from '@/lib/clinical'

const STATE_STYLES = {
  normal: {
    ring: 'border-lab-normal/40 focus-visible:border-lab-normal',
    text: 'text-lab-normal',
    chip: 'bg-lab-normal-bg text-lab-normal',
    Icon: Check,
  },
  abnormal: {
    ring: 'border-lab-abnormal/50 focus-visible:border-lab-abnormal',
    text: 'text-lab-abnormal',
    chip: 'bg-lab-abnormal-bg text-lab-abnormal',
    Icon: TriangleAlert,
  },
  critical: {
    ring: 'border-lab-critical/60 focus-visible:border-lab-critical',
    text: 'text-lab-critical',
    chip: 'bg-lab-critical-bg text-lab-critical',
    Icon: AlertTriangle,
  },
  unknown: { ring: '', text: 'text-muted-foreground', chip: '', Icon: null },
}

/**
 * A single clinical measurement.
 *
 * Replaces the ~100 hand-repeated input blocks in templates/index.html. When the
 * field name matches a marker in LAB_REFERENCE_RANGES it interprets the value
 * inline against the same bounds the server uses, so an out-of-range result is
 * visible while typing rather than after submission.
 */
export function LabInput({
  name,
  label,
  unit,
  hint,
  sex = 'M',
  error,
  register,
  value,
  step = 'any',
  interpret = true,
  ...props
}) {
  const id = useId()
  const interpretation =
    interpret && value !== '' && value != null ? interpretLabValue(name, value, sex) : null
  const state = interpretation ? labStateFor(interpretation) : 'unknown'
  const styles = STATE_STYLES[state] || STATE_STYLES.unknown
  const showFlag = interpretation && state !== 'unknown' && state !== 'normal'
  const Icon = styles.Icon

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {unit ? (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{unit}</span>
        ) : null}
      </div>

      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step}
          inputMode="decimal"
          aria-invalid={Boolean(error)}
          aria-describedby={interpretation ? `${id}-interpretation` : undefined}
          className={cn(
            'tabular-nums',
            !error && styles.ring,
            showFlag && 'pr-9',
            error && 'border-destructive focus-visible:border-destructive',
          )}
          {...(register ? register(name) : {})}
          {...props}
        />
        {showFlag && Icon ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  'absolute inset-y-0 right-2.5 grid place-items-center',
                  styles.text,
                )}
              >
                <Icon className="size-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">
                {interpretation.status} - {interpretation.severity}
              </p>
              <p className="mt-1 text-xs opacity-90">{interpretation.clinical_significance}</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : interpretation && state !== 'unknown' ? (
        <p id={`${id}-interpretation`} className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className={cn('rounded px-1.5 py-0.5 font-medium', styles.chip)}>
            {interpretation.status}
          </span>
          <span className="text-muted-foreground">Ref {interpretation.reference_range}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Grid wrapper so every lab block lines up the same way. */
export function FieldGrid({ children, className = '' }) {
  return (
    <div className={cn('grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </div>
  )
}
