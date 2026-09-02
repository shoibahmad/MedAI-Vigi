import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { LEGACY_LINKS, LEGAL_LINKS, NAV_ITEMS } from '@/lib/navigation'

export function Footer() {
  return (
    <footer className="no-print mt-auto border-t bg-card">
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Activity className="size-5" strokeWidth={2.5} />
              </span>
              <span className="text-base font-bold tracking-tight">PhenoRx</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              AI-assisted adverse drug reaction risk prediction, pharmacogenomic profiling, and
              clinical decision support.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Clinical Tools</h3>
            <ul className="mt-3 space-y-2">
              {NAV_ITEMS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  to="/methodology"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Methodology
                </Link>
              </li>
              {LEGACY_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/research_papers"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Research Papers
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">
              For clinical decision support only.
            </strong>{' '}
            PhenoRx produces probabilistic risk estimates from a model trained on synthetic
            data. Output must be reviewed by a qualified clinician and must not be used as the sole
            basis for any diagnosis, prescription, or treatment decision.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PhenoRx. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
