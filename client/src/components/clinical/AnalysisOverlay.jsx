import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Full-screen blocking overlay for long-running analyses.
 *
 * The model calls take tens of seconds, so this does three things a plain
 * button spinner does not: it centres the feedback in the viewport, it cycles
 * through the phases so the wait reads as progress rather than a hang, and it
 * locks body scroll so the page cannot be moved while work is in flight.
 */

const DEFAULT_STEPS = [
  'Preparing the clinical payload...',
  'Running the prediction model...',
  'Evaluating pharmacogenomic profile...',
  'Generating the clinical narrative...',
  'Compiling recommendations...',
]

/**
 * Inner card. Mounted only while the overlay is open, so the step index resets
 * on close without an effect writing state back to zero.
 */
function OverlayCard({ title, steps, note }) {
  const [index, setIndex] = useState(0)

  // Lock scrolling for as long as this card is mounted.
  //
  // Setting overflow:hidden on <body> alone is not enough: the scrolling element
  // here is <html>, so programmatic scrolls still go through. It has to be set on
  // documentElement as well. The scrollbar width is compensated, otherwise hiding
  // overflow reflows the page sideways the moment the overlay opens.
  useEffect(() => {
    const { body, documentElement: html } = document
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPadding: body.style.paddingRight,
      htmlOverflow: html.style.overflow,
    }
    const scrollbar = window.innerWidth - html.clientWidth

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    return () => {
      html.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.bodyOverflow
      body.style.paddingRight = previous.bodyPadding
    }
  }, [])

  // Advance the running text. Holds on the final step rather than looping, so it
  // never suggests the work restarted.
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i < steps.length - 1 ? i + 1 : i))
    }, 3500)
    return () => clearInterval(id)
  }, [steps.length])

  return (
    <div className="mx-4 w-full max-w-sm rounded-xl border bg-card p-8 text-center shadow-lg">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent">
        <Loader2 className="size-7 animate-spin text-primary" />
      </span>

      <h2 className="mt-5 text-lg font-semibold tracking-tight">{title}</h2>

      {/* Fixed height so the card does not jump as messages change length. */}
      <div className="mt-2 flex h-10 items-center justify-center">
        <p
          key={index}
          className="animate-in fade-in slide-in-from-bottom-1 text-sm text-muted-foreground duration-500"
          role="status"
          aria-live="polite"
        >
          {steps[index]}
        </p>
      </div>

      <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
        {steps.map((step, i) => (
          <span
            key={step}
            className={cn(
              'h-1 rounded-full transition-all duration-500',
              i === index ? 'w-6 bg-primary' : i < index ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted',
            )}
          />
        ))}
      </div>

      {note ? <p className="mt-5 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  )
}

export function AnalysisOverlay({
  open,
  title = 'Running analysis',
  steps = DEFAULT_STEPS,
  note = 'This can take up to a minute. Please keep this tab open.',
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={title}
    >
      <OverlayCard title={title} steps={steps} note={note} />
    </div>
  )
}
