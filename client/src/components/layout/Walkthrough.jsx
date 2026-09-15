import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ClipboardList,
  FileText,
  Network,
  UserRound,
  UsersRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { markWalkthroughSeen } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

/**
 * First-run product tour.
 *
 * Remembered in localStorage rather than sessionStorage: a tour that reappears
 * every session is an irritation, not an onboarding. It can be reopened from the
 * footer, so dismissing it is never final.
 */

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Welcome to PhenoRx',
    body: 'PhenoRx predicts adverse drug reaction risk before a medicine is given, by combining a machine-learning model with pharmacogenomic rule engines and an AI clinical narrative.',
    detail: 'This tour takes about a minute. You can skip it at any point.',
  },
  {
    icon: UserRound,
    title: '1. Patient details',
    body: 'Start with demographics. Age and sex select the laboratory reference intervals used everywhere else, and BMI and eGFR are calculated for you.',
    to: '/patient-details',
  },
  {
    icon: ClipboardList,
    title: '2. Clinical assessment',
    body: 'Enter labs, comorbidities, pharmacogenomics and the drug regimen. Sections can be filled in any order, and values are checked against the same bounds the model enforces, so out-of-range results flag as you type.',
    detail: 'In a hurry? Use "Load a demo patient" to populate all 60+ fields at once.',
    to: '/assessment',
  },
  {
    icon: FileText,
    title: '3. Report',
    body: 'The report puts the model output and the AI analysis side by side, so you can read the risk score, reaction classes and pharmacogenomic profile against the generated narrative and mitigation plan.',
    detail: 'Export it as a PDF when you are done.',
    to: '/report',
  },
  {
    icon: Network,
    title: '4. Interactions and dosing',
    body: 'Check the regimen for conflicts with severity classification, and review renal, hepatic and CYP-adjusted dosing with monitoring intervals on the decision support page.',
    to: '/drug-interactions',
  },
  {
    icon: UsersRound,
    title: '5. Counselling',
    body: 'Work through six structured steps of medication education, with teach-back comprehension scoring and signed acknowledgment from both patient and counsellor.',
    to: '/patient-counselling',
  },
  {
    icon: Bot,
    title: 'Ask the assistant',
    body: 'The clinical assistant answers questions about the current assessment — risk drivers, monitoring, alternatives — using the patient context you have entered.',
    detail: 'Every AI output is probabilistic and must be verified by a qualified clinician.',
    to: '/chatbot',
  },
]

/**
 * Inner dialog. Mounted only while the tour is open, so the step index resets on
 * close without an effect writing state back to zero.
 */
function TourDialog({ onClose }) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  const finish = useCallback(
    (destination) => {
      markWalkthroughSeen()
      onClose()
      if (destination) navigate(destination)
    },
    [navigate, onClose],
  )

  // Lock scrolling while the tour is up, matching the analysis overlay. <html>
  // needs it too: body alone leaves the page scrollable.
  useEffect(() => {
    const { body, documentElement: html } = document
    const previous = { html: html.style.overflow, body: body.style.overflow }
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous.html
      body.style.overflow = previous.body
    }
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') finish()
      if (event.key === 'ArrowRight') setStep((s) => Math.min(s + 1, STEPS.length - 1))
      if (event.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border bg-card shadow-xl">
        <div className="p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 id="walkthrough-title" className="text-lg font-bold tracking-tight">
                {current.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.body}</p>
              {current.detail ? (
                <p className="mt-3 rounded-lg border bg-muted/40 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
                  {current.detail}
                </p>
              ) : null}
            </div>
          </div>

          {/* Progress dots double as direct navigation. */}
          <div className="mt-7 flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                aria-current={i === step ? 'step' : undefined}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted hover:bg-muted-foreground/40',
                )}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => finish()}>
            Skip
          </Button>

          <div className="flex items-center gap-2">
            <span className="mr-1 text-xs tabular-nums text-muted-foreground">
              {step + 1} / {STEPS.length}
            </span>
            {step > 0 ? (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : null}
            {isLast ? (
              <Button size="sm" onClick={() => finish('/patient-details')}>
                <Check className="size-4" />
                Start an assessment
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(step + 1)}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Walkthrough({ open, onClose }) {
  if (!open) return null
  return <TourDialog onClose={onClose} />
}
