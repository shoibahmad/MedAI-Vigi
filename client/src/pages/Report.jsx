import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cpu, Download, FileText, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { RiskMeter } from '@/components/clinical/RiskMeter'
import { AdrProbabilityBars } from '@/components/clinical/AdrProbabilityBars'
import { PharmacogenomicsPanel } from '@/components/clinical/PharmacogenomicsPanel'
import { AnalysisOverlay } from '@/components/clinical/AnalysisOverlay'
import { Markdown } from '@/components/clinical/Markdown'
import { AiRiskBanner } from '@/components/clinical/AiRiskBanner'
import { withLegacyColors } from '@/lib/legacyColor'
import { useAssessment } from '@/context/AssessmentContext'
import {
  useDetailedAnalysis,
  useGenerateReport,
  useMitigationStrategies,
} from '@/hooks/useApi'
import { COMORBIDITY_FIELDS } from '@/lib/schemas'
import { interpretLabValue } from '@/lib/clinical'
import { riskClasses, riskTierFromScore } from '@/lib/risk'
import { cn } from '@/lib/utils'

const CLINICAL_PARAMETERS = [
  ['creatinine', 'Serum creatinine', 'mg/dL'],
  ['egfr', 'Estimated GFR', 'mL/min/1.73m2'],
  ['ast_alt', 'AST / ALT', 'U/L'],
  ['bilirubin', 'Total bilirubin', 'mg/dL'],
  ['albumin', 'Serum albumin', 'g/dL'],
  ['hemoglobin', 'Haemoglobin', 'g/dL'],
  ['platelet_count', 'Platelet count', 'cells/uL'],
  ['wbc_count', 'WBC count', 'cells/uL'],
]

// Mitigation priorities reuse the validated risk status palette.
const PRIORITY_BORDER = {
  Critical: 'border-l-risk-critical bg-risk-critical-bg/40',
  High: 'border-l-risk-high bg-risk-high-bg/40',
  Medium: 'border-l-risk-moderate bg-risk-moderate-bg/40',
  Low: 'border-l-risk-low bg-risk-low-bg/40',
}

const PRIORITY_TONE = {
  Critical: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
  High: 'bg-risk-high-bg text-risk-high border-risk-high-border',
  Medium: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  Low: 'bg-risk-low-bg text-risk-low border-risk-low-border',
}

/**
 * Header for one side of the comparison. `source` distinguishes the
 * deterministic model output from the generated narrative, and `generated`
 * shows when the model fell back to the rule-based path.
 */
function ColumnHeader({ icon: Icon, title, source, generated }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{source}</p>
        </div>
      </div>
      {generated !== undefined ? (
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-xs font-medium',
            generated
              ? 'border-primary/30 bg-accent text-accent-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {generated ? 'AI generated' : 'Rule-based fallback'}
        </span>
      ) : null}
    </div>
  )
}

function SubHeading({ children }) {
  return (
    <h4 className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </h4>
  )
}

function Section({ title, children }) {
  return (
    <section className="border-t px-6 py-5 first:border-t-0">
      <h2 className="text-sm font-bold uppercase tracking-wide text-primary">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function InfoGrid({ rows }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold">{value ?? '--'}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function Report() {
  const { patient, prediction, report, setReport, clinicianName } = useAssessment()
  const generate = useGenerateReport()
  const mitigation = useMitigationStrategies()
  const organs = useDetailedAnalysis()
  const printRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  const body = {
    patient_data: patient,
    prediction_result: prediction,
    patient_name: patient.name,
    patient_id: patient.patient_id,
    clinician_name: clinicianName,
  }

  // All three run against the LLM. They are independent, so fire them together
  // rather than serially - each one blocks a Flask worker for several seconds.
  const handleGenerate = async () => {
    const [narrative, plan, breakdown] = await Promise.allSettled([
      generate.mutateAsync(body),
      mitigation.mutateAsync(body),
      organs.mutateAsync(body),
    ])

    if (narrative.status === 'fulfilled') {
      setReport(narrative.value.report || narrative.value)
    }

    const failed = [narrative, plan, breakdown].filter((r) => r.status === 'rejected')
    if (failed.length === 0) {
      toast.success('Clinical analysis generated')
    } else if (failed.length === 3) {
      toast.error('Analysis failed', { description: failed[0].reason?.message })
    } else {
      toast.warning('Partial analysis', {
        description: `${failed.length} of 3 sections could not be generated.`,
      })
    }
  }

  const strategies = mitigation.data?.mitigation_strategies || []
  const organBreakdown = organs.data?.organ_system_breakdown || null
  const pending = generate.isPending || mitigation.isPending || organs.isPending
  const hasAiOutput = Boolean(report) || strategies.length > 0 || Boolean(organBreakdown)
  // Both AI endpoints report whether the model answered or the rule-based path ran.
  const aiGenerated =
    mitigation.data?.ai_generated === true || organs.data?.ai_generated === true

  const handleExport = async () => {
    setExporting(true)
    try {
      // Loaded lazily: the bundle is large and only needed on export.
      const { default: html2pdf } = await import('html2pdf.js')

      // html2canvas cannot parse oklab()/oklch(), which is what the browser
      // resolves Tailwind's opacity modifiers to. Swap them for rgb() during the
      // capture and restore afterwards.
      await withLegacyColors(printRef.current, () =>
        html2pdf()
          .set({
            margin: 12,
            filename: `ADR-Report-${patient.patient_id || 'patient'}.pdf`,
            image: { type: 'jpeg', quality: 0.97 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          })
          .from(printRef.current)
          .save(),
      )
      toast.success('Report exported')
    } catch (error) {
      toast.error('PDF export failed', { description: error.message })
    } finally {
      setExporting(false)
    }
  }

  if (!prediction) {
    return (
      <>
        <PageHeader title="Medical Report" icon={FileText} />
        <PageBody className="max-w-3xl">
          <Alert>
            <AlertTitle>No assessment to report on</AlertTitle>
            <AlertDescription>
              Run a risk assessment first, then return here to generate the clinical narrative.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-6">
            <Link to="/assessment">Go to assessment</Link>
          </Button>
        </PageBody>
      </>
    )
  }

  const comorbidities = COMORBIDITY_FIELDS.filter((f) => patient[f.name] === 1).map((f) => f.label)

  return (
    <>
      <AnalysisOverlay open={pending} />

      <PageHeader
        title="Medical Report"
        description="Adverse drug reaction risk assessment report, ready for the patient record."
        icon={FileText}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={pending} variant="outline">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {report ? 'Regenerate' : 'Generate'} analysis
                </>
              )}
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export PDF
            </Button>
          </div>
        }
      />

      <PageBody className="max-w-5xl">
        <article ref={printRef} className="overflow-hidden rounded-xl border bg-card">
          <header className="border-b bg-muted/30 px-6 py-6 text-center">
            <h1 className="text-lg font-bold uppercase tracking-wide">
              Adverse Drug Reaction Risk Assessment Report
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Comprehensive clinical analysis and recommendations
            </p>
          </header>

          <Section title="Patient Information">
            <InfoGrid
              rows={[
                ['Name', patient.name],
                ['Patient ID', patient.patient_id],
                ['Age', `${patient.age} years`],
                ['Sex', patient.sex === 'F' ? 'Female' : 'Male'],
                ['Ethnicity', patient.ethnicity],
                ['BMI', patient.bmi],
                ['Clinician', clinicianName],
                ['Report date', new Date().toLocaleDateString()],
              ]}
            />
          </Section>

          <Section title="Clinical Parameters">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-semibold">Parameter</th>
                    <th className="pb-2 font-semibold">Value</th>
                    <th className="pb-2 font-semibold">Unit</th>
                    <th className="pb-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {CLINICAL_PARAMETERS.map(([key, label, unit]) => {
                    const interp = interpretLabValue(key, patient[key], patient.sex)
                    return (
                      <tr key={key} className="border-b last:border-0">
                        <td className="py-2">{label}</td>
                        <td className="py-2 font-medium tabular-nums">{patient[key] ?? '--'}</td>
                        <td className="py-2 text-muted-foreground">{unit}</td>
                        <td className="py-2">
                          {interp.status === 'Unknown' ? (
                            <span className="text-muted-foreground">--</span>
                          ) : (
                            <span
                              className={
                                interp.status === 'Normal'
                                  ? 'font-medium text-lab-normal'
                                  : interp.severity === 'Severe'
                                    ? 'font-medium text-lab-critical'
                                    : 'font-medium text-lab-abnormal'
                              }
                            >
                              {interp.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Medication Details">
            <InfoGrid
              rows={[
                ['Index drug', patient.medication_name],
                ['Dose', patient.index_drug_dose],
                ['Days since start', patient.time_since_start_days],
                ['Concomitant drugs', patient.concomitant_drugs_count],
                [
                  'Polypharmacy',
                  patient.polypharmacy_flag === 1 ? 'Yes' : 'No',
                ],
                ['Prior ADR history', patient.prior_adr_history === 1 ? 'Yes' : 'No'],
              ]}
            />
            {patient.all_medications?.length > 0 ? (
              <p className="mt-4 text-sm">
                <span className="font-medium">Concomitant medications: </span>
                {patient.all_medications.join(', ')}
              </p>
            ) : null}
          </Section>

          <Section title="Comorbidities and Medical History">
            {comorbidities.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {comorbidities.map((label) => (
                  <li
                    key={label}
                    className="rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium"
                  >
                    {label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No comorbidities recorded.</p>
            )}
          </Section>

          {/*
            Model output and generated output sit side by side so the two can be
            compared directly: the left column is deterministic (classifier plus
            pharmacogenomic rule engines), the right is generated. They stack on
            narrow screens and in print, where two columns would be unreadable.
          */}
          <section className="border-t px-6 py-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-primary">Analysis</h2>

            <div className="mt-4 grid gap-x-8 gap-y-10 lg:grid-cols-2 print:grid-cols-1">
              {/* ------------------------------------------------ Model */}
              <div className="min-w-0 lg:border-r lg:pr-8 print:border-r-0 print:pr-0">
                <ColumnHeader
                  icon={Cpu}
                  title="Model analysis"
                  source="Gradient-boosted classifier and rule engines"
                />

                <div className="mt-5">
                  <RiskMeter prediction={prediction} className="border-0 p-0" />
                </div>

                {prediction.top_specific_adr_risks || prediction.all_class_probabilities ? (
                  <>
                    <SubHeading>Predicted reaction classes</SubHeading>
                    <div className="mt-3">
                      <AdrProbabilityBars
                        probabilities={
                          prediction.top_specific_adr_risks || prediction.all_class_probabilities
                        }
                      />
                    </div>
                  </>
                ) : null}

                {Array.isArray(prediction.major_contributing_factors) &&
                prediction.major_contributing_factors.length > 0 ? (
                  <>
                    <SubHeading>Major contributing factors</SubHeading>
                    <ul className="mt-3 space-y-3 text-sm">
                      {prediction.major_contributing_factors.map((factor, index) => (
                        <li key={index}>
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-semibold">{factor.factor}</span>
                            {factor.value ? (
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {factor.value}
                              </span>
                            ) : null}
                          </div>
                          {factor.description ? (
                            <p className="text-muted-foreground">{factor.description}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}

                {prediction.pharmacogenomics ? (
                  <>
                    <SubHeading>Pharmacogenomic profile</SubHeading>
                    <div className="mt-3">
                      <PharmacogenomicsPanel
                        pharmacogenomics={prediction.pharmacogenomics}
                        className="border-0 p-0"
                      />
                    </div>
                  </>
                ) : null}
              </div>

              {/* -------------------------------------------------- LLM */}
              <div className="min-w-0">
                <ColumnHeader
                  icon={Sparkles}
                  title="NVIDIA Nemotron analysis"
                  source="Generated from the model output and clinical values"
                  generated={hasAiOutput ? aiGenerated : undefined}
                />

                <AiRiskBanner prediction={prediction} className="mt-5" />

                {!hasAiOutput && !pending ? (
                  <div className="mt-5 rounded-lg border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No AI analysis yet.
                    </p>
                    <Button onClick={handleGenerate} size="sm" className="mt-3">
                      <Sparkles className="size-4" />
                      Generate analysis
                    </Button>
                  </div>
                ) : null}

                {pending ? (
                  <div className="mt-5 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-10/12" />
                  </div>
                ) : null}

                {report ? (
                  <>
                    <SubHeading>Clinical narrative</SubHeading>
                    <div className="mt-3 rounded-lg border bg-muted/20 px-5 py-4">
                      <Markdown className="max-w-prose">{report}</Markdown>
                    </div>
                  </>
                ) : null}

                {organBreakdown ? (
                  <>
                    <SubHeading>Organ system analysis</SubHeading>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {Object.entries(organBreakdown).map(([system, data]) => {
                        if (!data || typeof data !== 'object') return null
                        const score = Number(data.risk_score) || 0
                        const tone = riskClasses(riskTierFromScore(score).key)
                        return (
                          <div
                            key={system}
                            className={cn(
                              'rounded-lg border border-l-[3px] p-4',
                              tone.border,
                              tone.bg,
                            )}
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h5 className="text-sm font-semibold capitalize">
                                {system.replace(/_/g, ' ')}
                              </h5>
                              <span
                                className={cn(
                                  'rounded-full border px-2 py-0.5 text-xs font-semibold',
                                  tone.chip,
                                )}
                              >
                                {data.status} - {score}
                              </span>
                            </div>
                            {data.findings ? (
                              <p className="mt-2 text-sm text-muted-foreground">{data.findings}</p>
                            ) : null}
                            {data.monitoring ? (
                              <p className="mt-1.5 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Monitoring: </span>
                                {data.monitoring}
                              </p>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : null}

                {strategies.length > 0 ? (
                  <>
                    <SubHeading>Clinical recommendations</SubHeading>
                    <ul className="mt-3 space-y-3">
                      {strategies.map((item, index) => (
                        <li
                          key={index}
                          className={cn(
                            'flex gap-3 rounded-lg border border-l-[3px] px-3 py-2.5',
                            PRIORITY_BORDER[item.priority] || 'border-l-border',
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold',
                              PRIORITY_TONE[item.priority] || 'bg-muted',
                            )}
                          >
                            {item.priority}
                          </span>
                          <span className="text-sm">
                            <span className="font-semibold">{item.action}</span>
                            {item.rationale ? (
                              <span className="block text-muted-foreground">{item.rationale}</span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          <footer className="border-t bg-muted/30 px-6 py-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Generated by PhenoRx for clinical decision support only. Risk estimates are
              probabilistic and derived from a model trained on synthetic data. This report must be
              reviewed by a qualified clinician and must not be the sole basis for any treatment
              decision.
            </p>
          </footer>
        </article>
      </PageBody>
    </>
  )
}
