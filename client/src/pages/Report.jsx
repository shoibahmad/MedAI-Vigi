import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileText, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { RiskMeter } from '@/components/clinical/RiskMeter'
import { AdrProbabilityBars } from '@/components/clinical/AdrProbabilityBars'
import { PharmacogenomicsPanel } from '@/components/clinical/PharmacogenomicsPanel'
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
const PRIORITY_TONE = {
  Critical: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
  High: 'bg-risk-high-bg text-risk-high border-risk-high-border',
  Medium: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  Low: 'bg-risk-low-bg text-risk-low border-risk-low-border',
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

/** Renders the Gemini markdown response without pulling in a markdown library. */
function NarrativeBlock({ text }) {
  const blocks = String(text).split(/\n{2,}/)
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const heading = block.match(/^#{2,4}\s+(.*)$/m)
        if (heading) {
          return (
            <h3 key={index} className="pt-2 text-base font-semibold">
              {heading[1]}
            </h3>
          )
        }
        if (/^[-*]\s+/m.test(block)) {
          const items = block.split('\n').filter((l) => /^[-*]\s+/.test(l))
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-5">
              {items.map((item, i) => (
                <li key={i}>{item.replace(/^[-*]\s+/, '')}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {block}
          </p>
        )
      })}
    </div>
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

  // All three run against Gemini. They are independent, so fire them together
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

  const handleExport = async () => {
    setExporting(true)
    try {
      // Loaded lazily: the bundle is large and only needed on export.
      const { default: html2pdf } = await import('html2pdf.js')
      await html2pdf()
        .set({
          margin: 12,
          filename: `ADR-Report-${patient.patient_id || 'patient'}.pdf`,
          image: { type: 'jpeg', quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(printRef.current)
        .save()
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

          <Section title="ADR Risk Assessment">
            <RiskMeter prediction={prediction} className="border-0 p-0" />
          </Section>

          {prediction.top_specific_adr_risks || prediction.all_class_probabilities ? (
            <Section title="Specific ADR Type Predictions">
              <AdrProbabilityBars
                probabilities={
                  prediction.top_specific_adr_risks || prediction.all_class_probabilities
                }
              />
            </Section>
          ) : null}

          <Section title="AI-Powered Clinical Analysis">
            {generate.isPending ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : report ? (
              <NarrativeBlock text={report} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No narrative generated yet. Use the Generate narrative action above.
              </p>
            )}
          </Section>

          {prediction.pharmacogenomics ? (
            <Section title="Pharmacogenomic Profile">
              <PharmacogenomicsPanel
                pharmacogenomics={prediction.pharmacogenomics}
                className="border-0 p-0"
              />
            </Section>
          ) : null}

          {Array.isArray(prediction.major_contributing_factors) &&
          prediction.major_contributing_factors.length > 0 ? (
            <Section title="Major Contributing Factors">
              <ul className="space-y-3 text-sm">
                {prediction.major_contributing_factors.map((factor, index) => (
                  <li key={index}>
                    <span className="font-semibold">{factor.factor}</span>
                    {factor.value ? (
                      <span className="ml-2 tabular-nums text-muted-foreground">
                        {factor.value}
                      </span>
                    ) : null}
                    {factor.description ? (
                      <p className="text-muted-foreground">{factor.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {organBreakdown ? (
            <Section title="Organ System Analysis">
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(organBreakdown).map(([system, data]) => {
                  if (!data || typeof data !== 'object') return null
                  const score = Number(data.risk_score) || 0
                  const tone = riskClasses(riskTierFromScore(score).key)
                  return (
                    <div key={system} className="rounded-lg border p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold capitalize">
                          {system.replace(/_/g, ' ')}
                        </h3>
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
            </Section>
          ) : null}

          {strategies.length > 0 ? (
            <Section title="Clinical Recommendations">
              <ul className="space-y-3">
                {strategies.map((item, index) => (
                  <li key={index} className="flex gap-3">
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
            </Section>
          ) : null}

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
