import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Brain,
  Building2,
  Calculator,
  FileText,
  HeartPulse,
  Info,
  Mail,
  MapPin,
  Network,
  Phone,
} from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { CONTACT, HOW_TO_USE, KEY_FEATURES, MISSION, TECH_STACK } from '@/lib/siteContent'

const ICONS = { Brain, Activity, Network, Calculator, HeartPulse, FileText }

export default function About() {
  return (
    <>
      <PageHeader
        title="About PhenoRx"
        description="An intelligent system for automated adverse drug reaction identification."
        icon={Info}
      />

      <PageBody className="max-w-5xl space-y-12">
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Our mission</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{MISSION}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Key features</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {KEY_FEATURES.map(({ icon, title, body }) => {
              const Icon = ICONS[icon] || Activity
              return (
                <article key={title} className="rounded-xl border bg-card p-5">
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-3.5 text-sm font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Technology stack</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TECH_STACK.map(({ name, body }) => (
              <div key={name} className="rounded-lg border px-4 py-3.5">
                <dt className="text-sm font-semibold">{name}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">How to use PhenoRx</h2>
          <ol className="mt-5 space-y-4">
            {HOW_TO_USE.map(({ title, body }, index) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <span className="hidden size-11 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground sm:grid">
              <Building2 className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Developed at Integral University</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                PhenoRx was built by Pharm.D students at {CONTACT.institution}, as a research
                project in clinical pharmacy and pharmacovigilance. It combines pharmaceutical
                domain knowledge with modern machine learning and AI.
              </p>

              <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                    <dd className="text-sm font-medium">
                      <a href={`mailto:${CONTACT.email}`} className="hover:text-primary">
                        {CONTACT.email}
                      </a>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phone</dt>
                    <dd className="text-sm font-medium">{CONTACT.phone}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      Address
                    </dt>
                    <dd className="text-sm font-medium">{CONTACT.address}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/patient-details">
              Start an assessment
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/methodology">Read the methodology</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/documentation">Documentation</Link>
          </Button>
        </section>
      </PageBody>
    </>
  )
}
