import { Link } from 'react-router-dom'
import { Calculator, HeartPulse, Route, Stethoscope } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { PatientContextBar } from '@/components/clinical/PatientContextBar'
import { useAssessment } from '@/context/AssessmentContext'
import {
  calculatePersonalizedDose,
  calculateRenalDoseAdjustment,
  evaluateHepaticDoseAdjustment,
  getMedicationInfo,
} from '@/lib/dosing'
import { cn } from '@/lib/utils'

const SEVERITY_TONE = {
  Normal: 'bg-risk-low-bg text-risk-low border-risk-low-border',
  Moderate: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  Caution: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  Severe: 'bg-risk-high-bg text-risk-high border-risk-high-border',
  'High Risk': 'bg-risk-high-bg text-risk-high border-risk-high-border',
  Critical: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
}

function Card({ icon: Icon, title, subtitle, badge, children }) {
  return (
    <article className="rounded-xl border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {badge ? (
          <span
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-semibold',
              SEVERITY_TONE[badge] || 'bg-muted',
            )}
          >
            {badge}
          </span>
        ) : null}
      </header>
      <div className="px-6 py-5">{children}</div>
    </article>
  )
}

function Stat({ label, value, unit }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span> : null}
      </p>
    </div>
  )
}

export default function ClinicalDecisionSupport() {
  const { patient } = useAssessment()

  const drug = patient.medication_name
  const info = getMedicationInfo(drug)
  const recordedDose = Number(patient.index_drug_dose)
  const standardDose = info?.standardDose ?? (Number.isFinite(recordedDose) ? recordedDose : 0)

  const renal = calculateRenalDoseAdjustment(drug, standardDose, Number(patient.egfr))
  const hepatic = evaluateHepaticDoseAdjustment(
    drug,
    Number(patient.ast_alt),
    Number(patient.bilirubin),
    Number(patient.albumin),
  )
  const personalized = calculatePersonalizedDose(drug, standardDose, patient)

  const qtRisk = patient.qt_prolonging_flag === 1 || patient.cardiac_disease === 1

  return (
    <>
      <PageHeader
        title="Clinical Decision Support"
        description="Automated dosing, organ-impairment adjustment, and monitoring protocols derived from the current assessment."
        icon={Stethoscope}
      />

      <PageBody className="max-w-5xl">
        <PatientContextBar className="mb-6" />

        {!info ? (
          <Alert className="mb-6">
            <AlertTitle>No dosing reference for this drug</AlertTitle>
            <AlertDescription>
              {drug
                ? `${drug} is not in the medication reference database, so the standard dose recorded on the assessment is used as the baseline.`
                : 'Select an index drug on the assessment page to get dosing guidance.'}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <Card
            icon={Calculator}
            title="Personalized dosing"
            subtitle={info ? `${drug} - ${info.category}` : drug || 'No drug selected'}
          >
            <div className="grid grid-cols-2 gap-6">
              <Stat label="Standard dose" value={personalized.standardDose} unit={info?.unit} />
              <Stat label="Adjusted dose" value={personalized.adjustedDose} unit={info?.unit} />
            </div>
            {personalized.reductionPercent > 0 ? (
              <p className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <span className="font-semibold">
                  {personalized.reductionPercent}% reduction.{' '}
                </span>
                {personalized.reasoning}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{personalized.reasoning}</p>
            )}
            {info ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Standard frequency: {info.frequency}
              </p>
            ) : null}
          </Card>

          <Card
            icon={HeartPulse}
            title="Renal adjustment"
            subtitle={`eGFR ${patient.egfr} mL/min/1.73m2`}
            badge={renal.severity}
          >
            <div className="grid grid-cols-2 gap-6">
              <Stat label="Adjusted dose" value={renal.adjustedDose} unit={info?.unit} />
              <Stat label="Reduction" value={`${renal.reductionPercent}%`} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {renal.recommendation}
            </p>
          </Card>

          <Card
            icon={Stethoscope}
            title="Hepatic adjustment"
            subtitle={`AST/ALT ${patient.ast_alt} U/L, bilirubin ${patient.bilirubin} mg/dL, albumin ${patient.albumin} g/dL`}
            badge={hepatic.status}
          >
            <Stat label="Recommended reduction" value={`${hepatic.reductionPercent}%`} />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {hepatic.guidance}
            </p>
          </Card>

          <Card
            icon={Route}
            title="Monitoring pathway"
            subtitle="Derived from the recorded risk profile"
          >
            <ul className="space-y-3 text-sm">
              {[
                renal.severity !== 'Normal' &&
                  'Renal panel (creatinine, eGFR) at baseline, day 3, then weekly until stable.',
                hepatic.adjustmentRequired &&
                  'Liver function tests weekly for the first month, then monthly.',
                qtRisk && 'Baseline ECG and electrolytes; repeat ECG after any dose increase.',
                patient.prior_adr_history === 1 &&
                  'Documented prior ADR - review the previous reaction before first dose.',
                patient.polypharmacy_flag === 1 &&
                  'Polypharmacy present - run a full interaction check before dispensing.',
                patient.hla_risk_allele_flag === 1 &&
                  'HLA risk allele recorded - screen for severe cutaneous reaction risk before initiation.',
                'Patient counselling on expected effects and red-flag symptoms before discharge.',
              ]
                .filter(Boolean)
                .map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/drug-interactions">Check interactions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/patient-counselling">Start counselling</Link>
          </Button>
        </div>
      </PageBody>
    </>
  )
}
