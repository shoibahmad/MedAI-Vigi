import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { DOC_SECTIONS, KEY_FEATURES } from '@/lib/siteContent'

function Bullets({ items }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function Documentation() {
  return (
    <>
      <PageHeader
        title="Documentation"
        description="Complete guide to using the PhenoRx ADR intelligence system."
        icon={BookOpen}
      />

      <PageBody>
        <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav className="no-print lg:sticky lg:top-24 lg:self-start" aria-label="Documentation sections">
            <div className="rounded-xl border bg-card p-2">
              <ul className="space-y-0.5">
                {DOC_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="#features"
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Feature summary
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <div className="min-w-0 space-y-10">
            {DOC_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>

                {section.paragraphs?.map((p, i) => (
                  <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}

                {section.items ? <Bullets items={section.items} /> : null}

                {section.subsections?.map((sub) => (
                  <div key={sub.title} className="mt-6 rounded-xl border bg-card p-5">
                    <h3 className="text-sm font-semibold">{sub.title}</h3>
                    <Bullets items={sub.items} />
                  </div>
                ))}
              </section>
            ))}

            <section id="features" className="scroll-mt-24">
              <h2 className="text-xl font-semibold tracking-tight">Feature summary</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {KEY_FEATURES.map(({ title, body }) => (
                  <div key={title} className="rounded-lg border px-4 py-3.5">
                    <dt className="text-sm font-semibold">{title}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{body}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="flex flex-wrap gap-3 border-t pt-6">
              <Button asChild>
                <Link to="/patient-details">Start an assessment</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/api-reference">API reference</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/faqs">FAQs</Link>
              </Button>
            </section>
          </div>
        </div>
      </PageBody>
    </>
  )
}
