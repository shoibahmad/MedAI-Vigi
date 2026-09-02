import { useHealth } from '@/hooks/useApi'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Surfaces /health in the header.
 *
 * This matters more than it looks: MLService returns 503 when the model pickle
 * fails to load, and in that state /predict fails for every user with no visible
 * cause. Showing it up front turns a mystery into a glance.
 *
 * Response shape from routes/health.py:
 *   { status: "ok", components: { ml_model: { loaded, status }, gemini_ai: {...} } }
 */
function describe({ isPending, isError, data }) {
  if (isPending) {
    return { tone: 'bg-muted-foreground/40', label: 'Checking server status...' }
  }
  if (isError) {
    return { tone: 'bg-destructive', label: 'API unreachable or the model failed to load' }
  }

  const model = data?.components?.ml_model
  if (model?.loaded) {
    const gemini = data?.components?.gemini_ai
    return {
      tone: 'bg-success',
      label: gemini?.available
        ? 'API healthy - prediction model loaded, AI narratives available'
        : 'API healthy - prediction model loaded. AI narratives run in offline fallback.',
    }
  }

  return { tone: 'bg-warning', label: 'API reachable, but the prediction model is not loaded' }
}

export function ServerStatusDot() {
  const query = useHealth()
  const state = describe(query)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="hidden items-center gap-2 rounded-full border px-2.5 py-1 sm:inline-flex"
          role="status"
          aria-label={state.label}
        >
          <span className={cn('size-2 rounded-full', state.tone)} />
          <span className="text-xs font-medium text-muted-foreground">API</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{state.label}</TooltipContent>
    </Tooltip>
  )
}
