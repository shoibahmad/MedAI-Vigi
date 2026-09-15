import { useEffect, useRef, useState } from 'react'
import { Activity } from 'lucide-react'

import { SPLASH_DURATION_MS, markSplashSeen } from '@/lib/onboarding'

/**
 * Entry splash.
 *
 * Shown once per browser session rather than on every navigation. A fixed delay
 * on each page load would punish a clinician who refreshes mid-assessment, and
 * client-side routing means "opening a page" after the first load involves no
 * load at all. Skippable, and skipped entirely for reduced-motion users.
 */

export function SplashScreen({ onDone, duration = SPLASH_DURATION_MS }) {
  const [progress, setProgress] = useState(0)
  // Kept in a ref so a skip and the timer completing cannot both fire onDone.
  const finished = useRef(false)

  useEffect(() => {
    const finish = () => {
      if (finished.current) return
      finished.current = true
      markSplashSeen()
      onDone()
    }

    const started = performance.now()
    let frame = 0

    const tick = () => {
      const elapsed = performance.now() - started
      setProgress(Math.min(100, (elapsed / duration) * 100))
      if (elapsed < duration) {
        frame = requestAnimationFrame(tick)
      } else {
        finish()
      }
    }
    frame = requestAnimationFrame(tick)

    const onKey = (event) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') finish()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKey)
    }
  }, [duration, onDone])

  const skip = () => {
    if (finished.current) return
    finished.current = true
    markSplashSeen()
    onDone()
  }

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-background"
      role="status"
      aria-live="polite"
      aria-label="Loading PhenoRx"
    >
      <div className="flex w-full max-w-sm flex-col items-center px-6 text-center">
        <span className="grid size-20 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Activity className="size-10 animate-pulse" strokeWidth={2.5} />
        </span>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">PhenoRx</h1>
        <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Pharmacogenomic ADR Risk
        </p>

        <div
          className="mt-8 h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-6 max-w-xs text-xs leading-relaxed text-muted-foreground">
          For clinical decision support only. Output is probabilistic and must be reviewed by a
          qualified clinician.
        </p>

        <button
          type="button"
          onClick={skip}
          className="mt-6 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
