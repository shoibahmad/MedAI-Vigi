import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Sticky section navigation for the long assessment form.
 *
 * The form stays one scrolling page on purpose -- clinicians fill it out of order
 * and jump back to a single lab value -- so this rail supplies the orientation a
 * wizard would have given, without imposing a linear path.
 */
export function SectionRail({ sections, completion = {}, errors = {}, className }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId(visible[0].target.id)
      },
      // Top-weighted band so the active item tracks what the reader is reading,
      // not whatever happens to be centred.
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 },
    )

    for (const section of sections) {
      const el = document.getElementById(section.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  const done = sections.filter((s) => completion[s.id]).length

  return (
    <nav className={cn('no-print', className)} aria-label="Assessment sections">
      <div className="rounded-xl border bg-card p-2">
        <ul className="space-y-0.5">
          {sections.map((section) => {
            const isActive = section.id === activeId
            const isComplete = Boolean(completion[section.id])
            const hasError = Boolean(errors[section.id])

            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent font-semibold text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full border text-[0.6rem] font-bold',
                      hasError
                        ? 'border-destructive bg-destructive text-destructive-foreground'
                        : isComplete
                          ? 'border-success bg-success text-white'
                          : 'border-border',
                    )}
                  >
                    {hasError ? '!' : isComplete ? <Check className="size-3" /> : null}
                  </span>
                  <span className="truncate">{section.label}</span>
                </a>
              </li>
            )
          })}
        </ul>

        <div className="mt-2 border-t px-3 pt-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {done}/{sections.length}
            </span>{' '}
            sections complete
          </p>
        </div>
      </div>
    </nav>
  )
}

/** Anchor target + heading for one section of the form. */
export function FormSection({ id, title, description, icon: Icon, children, actions }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-4" />
            </span>
          ) : null}
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {actions}
      </header>
      <div className="p-6">{children}</div>
    </section>
  )
}

/** Labelled group inside a section, e.g. "Complete Blood Count" within Laboratory Values. */
export function SubSection({ title, children, className }) {
  return (
    <div className={cn('space-y-4', className)}>
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  )
}
