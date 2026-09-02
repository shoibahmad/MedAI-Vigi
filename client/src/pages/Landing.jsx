import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Brain,
  ClipboardList,
  Dna,
  FlaskConical,
  Network,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

const CAPABILITIES = [
  {
    icon: Brain,
    title: 'ADR risk prediction',
    body: 'A gradient-boosted classifier scores seven adverse reaction classes from 60+ clinical, haematological, and genomic inputs.',
  },
  {
    icon: Dna,
    title: 'Pharmacogenomic profiling',
    body: 'CYP450 metabolizer phenotyping, SLCO1B1/ABCB1/ABCG2 transporter kinetics, and HLA screening for severe cutaneous reactions.',
  },
  {
    icon: Network,
    title: 'Drug interaction analysis',
    body: 'Multi-drug conflict detection with severity classification and clinically viable alternative suggestions.',
  },
  {
    icon: FlaskConical,
    title: 'Personalized dosing',
    body: 'Dose titration by renal eGFR, hepatic transaminases, age, and CYP2C9 phenotype, with monitoring intervals.',
  },
  {
    icon: Stethoscope,
    title: 'Decision support',
    body: 'Renal, hepatic, and cardiac pathways with monitoring protocols drawn from the assessed patient profile.',
  },
  {
    icon: ShieldCheck,
    title: 'Counselling workflow',
    body: 'Six-step medication education with teach-back comprehension scoring and dual digital signature capture.',
  },
]

const ADR_CLASSES = [
  'Hepatotoxicity',
  'Nephrotoxicity',
  'Myotoxicity',
  'Bleeding / Hemorrhage',
  'Hypersensitivity',
  'Severe Cutaneous Reaction',
]

export default function Landing() {
  return (
    <>
      <section className="border-b bg-card">
        <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Clinical Decision Support
              </span>

              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Predict adverse drug reactions{' '}
                <span className="text-primary">before they happen</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                PhenoRx combines a machine-learning risk model with pharmacogenomic rule
                engines and AI-generated clinical narratives to help clinicians identify
                medication risk at the point of prescribing.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/patient-details">
                    Start an assessment
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/methodology">How it works</Link>
                </Button>
              </div>

              <p className="mt-6 max-w-xl text-xs leading-relaxed text-muted-foreground">
                For clinical decision support only. Output is probabilistic and must be reviewed
                by a qualified clinician.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-6 sm:p-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Reaction classes predicted
              </h2>
              <ul className="mt-4 space-y-2.5">
                {ADR_CLASSES.map((label) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="font-medium">{label}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-6">
                <div>
                  <p className="text-2xl font-bold tabular-nums">60+</p>
                  <p className="text-xs text-muted-foreground">Clinical inputs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">6</p>
                  <p className="text-xs text-muted-foreground">CYP enzymes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">4</p>
                  <p className="text-xs text-muted-foreground">Risk tiers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Platform capabilities</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every module reads from a single patient assessment, so a value entered once carries
          through prediction, dosing, interactions, and counselling.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl border bg-card p-6">
              <span className="grid size-11 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="hidden size-12 place-items-center rounded-xl bg-accent text-accent-foreground sm:grid">
              <ClipboardList className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Ready to assess a patient?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Begin with demographics, or load a demo profile to explore the workflow.
              </p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link to="/patient-details">
              Begin assessment
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
