import { BookOpen, Brain, Dna, Scale } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

/**
 * Educational content extracted from templates/index.html (~lines 7200-7850).
 * It was embedded in the data-entry form, where it bloated the page and had
 * nothing to do with entering values. It lives on its own route now.
 */

const NARANJO_QUESTIONS = [
  ['Are there previous conclusive reports on this reaction?', '+1, 0, -1'],
  ['Did the adverse event appear after the suspected drug was administered?', '+2, -1, 0'],
  ['Did the adverse reaction improve when the drug was discontinued?', '+1, 0, -1'],
  ['Did the adverse reaction reappear when the drug was readministered?', '+2, -1, 0'],
  ['Are there alternative causes that could explain the reaction?', '-1, +2, +1'],
]

const NARANJO_SCORING = [
  ['9 or more points', 'Definite ADR'],
  ['5-8 points', 'Probable ADR'],
  ['1-4 points', 'Possible ADR'],
  ['0 or fewer points', 'Doubtful ADR'],
]

const WHO_UMC = [
  [
    'Certain',
    'A clinical event with a plausible time relationship to drug administration, which cannot be explained by concurrent disease or other drugs or chemicals.',
  ],
  [
    'Probable / Likely',
    'A clinical event with a reasonable time sequence to administration of the drug, unlikely to be attributed to concurrent disease or other drugs.',
  ],
  [
    'Possible',
    'A clinical event with a reasonable time sequence to administration of the drug, but which could also be explained by concurrent disease or other drugs.',
  ],
  [
    'Unlikely',
    'A clinical event with a temporal relationship to drug administration which makes a causal relationship improbable.',
  ],
]

const ADR_CLASSES = [
  'No ADR',
  'Hepatotoxicity',
  'Nephrotoxicity',
  'Myotoxicity',
  'Bleeding / Hemorrhage',
  'Hypersensitivity',
  'Severe Cutaneous Reaction',
]

function Card({ icon: Icon, title, children }) {
  return (
    <article className="rounded-xl border bg-card">
      <header className="flex items-start gap-3 border-b px-6 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
        <h2 className="mt-1 text-base font-semibold">{title}</h2>
      </header>
      <div className="px-6 py-5">{children}</div>
    </article>
  )
}

export default function Methodology() {
  return (
    <>
      <PageHeader
        title="Methodology"
        description="How PhenoRx estimates risk, and how that relates to the established causality assessment scales."
        icon={BookOpen}
      />

      <PageBody className="max-w-4xl space-y-6">
        <Card icon={Brain} title="AI-powered predictive risk assessment">
          <p className="text-sm leading-relaxed text-muted-foreground">
            The prediction model is a histogram-based gradient boosting classifier wrapped in a
            preprocessing pipeline (standard scaling for continuous markers, one-hot encoding for
            categorical genotypes). It reads roughly 63 clinical, haematological, and
            pharmacogenomic inputs and returns a probability for each reaction class.
          </p>

          <h3 className="mt-5 text-sm font-semibold">Reaction classes</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ADR_CLASSES.map((label) => (
              <li
                key={label}
                className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium"
              >
                {label}
              </li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-semibold">Risk tiers</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The composite score maps onto four tiers: Low (below 25), Moderate (25 to 49), High
            (50 to 74), and Critical (75 and above).
          </p>

          <p className="mt-5 rounded-lg border bg-muted/40 px-4 py-3 text-sm leading-relaxed">
            <strong className="font-semibold">Important distinction. </strong>
            The scales below assess causality <em>after</em> a reaction has occurred. This system
            estimates risk <em>before</em> administration. They answer different questions and are
            complementary, not interchangeable.
          </p>
        </Card>

        <Card icon={Scale} title="Established causality assessment scales">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="naranjo">
              <AccordionTrigger>Naranjo ADR Probability Scale</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Developed by Naranjo et al. in 1981, this scale is widely used to determine the
                  likelihood that an observed adverse event is actually due to a drug rather than
                  other factors.
                </p>

                <h4 className="mt-4 text-sm font-semibold">Assessment questions</h4>
                <ol className="mt-2 space-y-2">
                  {NARANJO_QUESTIONS.map(([question, points], index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="font-semibold tabular-nums text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="flex-1">{question}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {points}
                      </span>
                    </li>
                  ))}
                </ol>

                <h4 className="mt-4 text-sm font-semibold">Scoring interpretation</h4>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  {NARANJO_SCORING.map(([range, verdict]) => (
                    <div
                      key={range}
                      className="flex items-baseline justify-between rounded-lg border bg-muted/40 px-3 py-2"
                    >
                      <dt className="text-xs text-muted-foreground">{range}</dt>
                      <dd className="text-sm font-semibold">{verdict}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="who-umc">
              <AccordionTrigger>WHO-UMC Causality Assessment</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The World Health Organization Uppsala Monitoring Centre criteria provide a
                  standardized approach for assessing the causal relationship between a drug and an
                  adverse event.
                </p>

                <dl className="mt-4 space-y-3">
                  {WHO_UMC.map(([category, description]) => (
                    <div key={category} className="rounded-lg border px-4 py-3">
                      <dt className="text-sm font-semibold">{category}</dt>
                      <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card icon={Dna} title="Pharmacogenomic rule engines">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Alongside the statistical model, three deterministic rule engines evaluate the genomic
            profile. These are lookup-based, not learned, so their output is fully explainable.
          </p>
          <dl className="mt-4 space-y-3">
            <div className="rounded-lg border px-4 py-3">
              <dt className="text-sm font-semibold">CYP450 metabolizer phenotyping</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Activity scoring across CYP2C9, CYP2D6, CYP3A4, CYP1A2, CYP2B6, and CYP2C19 to
                identify poor and ultrarapid metabolizers.
              </dd>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <dt className="text-sm font-semibold">Transporter kinetics</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                SLCO1B1, ABCB1, and ABCG2 genotypes affecting hepatic uptake and renal efflux -
                notably SLCO1B1 variants and statin myopathy risk.
              </dd>
            </div>
            <div className="rounded-lg border px-4 py-3">
              <dt className="text-sm font-semibold">HLA hypersensitivity screening</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Screens HLA-B*5701, HLA-B*5801, HLA-A*3101, and HLA-DRB1*0701 against their
                associated drugs for severe cutaneous adverse reactions and drug-induced liver
                injury.
              </dd>
            </div>
          </dl>
        </Card>

        <Card icon={BookOpen} title="Limitations">
          <ul className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
            {[
              'The model was trained on synthetic records, not a prospectively collected clinical cohort. It has not been externally validated against real patient outcomes.',
              'Predictions are probabilistic. A low risk score does not rule out a reaction, and a high score does not guarantee one.',
              'The medication reference database covers common agents only. Drugs outside it fall back to the dose recorded on the assessment.',
              'AI-generated narratives may contain errors and must be verified against primary sources before use.',
              'This system supports clinical judgment. It does not replace it.',
            ].map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </PageBody>
    </>
  )
}
