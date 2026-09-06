import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClipboardList, FlaskConical, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SectionRail } from '@/components/clinical/SectionRail'
import { PatientContextBar } from '@/components/clinical/PatientContextBar'
import { RiskMeter } from '@/components/clinical/RiskMeter'
import { AdrProbabilityBars } from '@/components/clinical/AdrProbabilityBars'
import { PharmacogenomicsPanel } from '@/components/clinical/PharmacogenomicsPanel'
import { AnalysisOverlay } from '@/components/clinical/AnalysisOverlay'
import { useAssessment } from '@/context/AssessmentContext'
import { usePredict, useSampleData } from '@/hooks/useApi'
import { patientSchema, ASSESSMENT_SECTIONS } from '@/lib/schemas'
import { calculateBMI, calculateEGFR } from '@/lib/clinical'
import { riskClasses } from '@/lib/risk'
import { cn } from '@/lib/utils'
import {
  AdditionalSection,
  ComorbiditiesSection,
  DemographicsSection,
  LaboratorySection,
  MedicationSection,
  PharmacogenomicsSection,
} from '@/pages/assessment/Sections'

/**
 * Demo profiles offered by the Quick Start selector.
 * These keys must exist in routes/predict.py sample_data -- before the Phase 4 fix
 * the server silently returned the same elderly patient for every unknown key.
 */
const SAMPLE_GROUPS = [
  {
    label: 'Risk categories',
    options: [
      { value: 'high_risk', label: 'High risk - elderly, multiple comorbidities' },
      { value: 'medium_risk', label: 'Medium risk - middle-aged with diabetes' },
      { value: 'low_risk', label: 'Low risk - young healthy adult' },
    ],
  },
  {
    label: 'Specific conditions',
    options: [
      { value: 'liver_disease', label: 'Hepatic impairment' },
      { value: 'cardiac_patient', label: 'Heart failure with arrhythmia' },
      { value: 'renal_impairment', label: 'Chronic kidney disease' },
    ],
  },
  {
    label: 'Special populations',
    options: [
      { value: 'elderly_polypharmacy', label: 'Elderly frail - polypharmacy' },
      { value: 'healthy_adult', label: 'Healthy adult - minimal risk' },
    ],
  },
]

/** Which schema fields belong to which section, for rail completion and error badges. */
const SECTION_FIELDS = {
  demographics: ['name', 'patient_id', 'age', 'sex', 'ethnicity', 'height', 'weight', 'bmi'],
  laboratory: [
    'creatinine', 'egfr', 'ast_alt', 'bilirubin', 'albumin',
    'hemoglobin', 'hematocrit', 'wbc_count', 'platelet_count', 'rbc_count',
    'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils',
    'mcv', 'mch', 'mchc', 'rdw',
    'bp_systolic', 'bp_diastolic', 'heart_rate', 'temperature',
  ],
  comorbidities: [
    'diabetes', 'liver_disease', 'ckd', 'cardiac_disease',
    'hypertension', 'respiratory_disease', 'neurological_disease', 'autoimmune_disease',
  ],
  medication: [
    'medication_name', 'index_drug_dose', 'time_since_start_days', 'concomitant_drugs_count',
  ],
  pharmacogenomics: [
    'cyp2c9', 'cyp2d6', 'cyp3a4', 'cyp1a2', 'cyp2b6', 'cyp2c19',
    'slco1b1_genotype', 'abcb1_genotype', 'abcg2_genotype',
  ],
  additional: [
    'cyp_inhibitors_flag', 'qt_prolonging_flag', 'hla_risk_allele_flag', 'inpatient_flag',
    'prior_adr_history', 'polypharmacy_flag', 'high_risk_drug_flag',
    'cumulative_dose_mg', 'dose_density_mg_day',
  ],
}

export default function Assessment() {
  const navigate = useNavigate()
  const { patient, prediction, setPatient, setPrediction } = useAssessment()
  const predict = usePredict()
  const loadSample = useSampleData()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: patient,
    mode: 'onBlur',
  })

  const values = watch()

  // BMI and eGFR are derived, never typed. Recompute whenever their inputs move.
  const bmi = calculateBMI(Number(values.height), Number(values.weight))
  const egfr = calculateEGFR(values.creatinine, Number(values.age), values.sex)

  useEffect(() => {
    if (bmi != null && bmi !== Number(values.bmi)) {
      setValue('bmi', bmi, { shouldValidate: false })
    }
  }, [bmi, values.bmi, setValue])

  useEffect(() => {
    if (egfr != null && egfr !== Number(values.egfr)) {
      setValue('egfr', egfr, { shouldValidate: false })
    }
  }, [egfr, values.egfr, setValue])

  const completion = useMemo(() => {
    const result = {}
    for (const [section, fields] of Object.entries(SECTION_FIELDS)) {
      result[section] = fields.every((field) => {
        const v = values[field]
        return v !== undefined && v !== null && v !== ''
      })
    }
    return result
  }, [values])

  const sectionErrors = useMemo(() => {
    const result = {}
    for (const [section, fields] of Object.entries(SECTION_FIELDS)) {
      result[section] = fields.some((field) => Boolean(errors[field]))
    }
    return result
  }, [errors])

  const handleLoadSample = async (sampleType) => {
    try {
      const data = await loadSample.mutateAsync(sampleType)
      const merged = { ...patient, ...data }
      reset(merged)
      setPatient(data)
      toast.success('Demo profile loaded', { description: data.name || sampleType })
    } catch (error) {
      toast.error('Could not load the demo profile', { description: error.message })
    }
  }

  const onSubmit = async (formValues) => {
    setPatient(formValues)
    try {
      const result = await predict.mutateAsync(formValues)
      setPrediction(result)
      toast.success('Risk assessment complete')
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (error) {
      toast.error('Prediction failed', { description: error.message })
    }
  }

  const onInvalid = () => {
    toast.error('Some values are out of range', {
      description: 'Fields flagged in red need correcting before the model can run.',
    })
  }

  const sectionProps = { register, errors, values, setValue }

  return (
    <>
      <AnalysisOverlay
        open={predict.isPending}
        title="Predicting ADR risk"
        steps={[
          'Validating clinical values...',
          'Building the feature vector...',
          'Running the classifier...',
          'Scoring pharmacogenomic profile...',
        ]}
        note="The model is scoring seven reaction classes."
      />

      <PageHeader
        title="Clinical Assessment"
        description="Complete the sections in any order. Values are validated against the same bounds the model enforces."
        icon={ClipboardList}
        actions={
          <div className="w-full sm:w-72">
            <Select onValueChange={handleLoadSample} disabled={loadSample.isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Load a demo patient..." />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_GROUPS.map((group) => (
                  <SelectGroup key={group.label}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <PageBody>
        <PatientContextBar className="mb-6" />

        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionRail
              sections={ASSESSMENT_SECTIONS}
              completion={completion}
              errors={sectionErrors}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-w-0 space-y-6">
            <DemographicsSection {...sectionProps} />
            <LaboratorySection {...sectionProps} />
            <ComorbiditiesSection {...sectionProps} />
            <MedicationSection {...sectionProps} />
            <PharmacogenomicsSection {...sectionProps} />
            <AdditionalSection {...sectionProps} />

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">
                Unfilled fields fall back to their clinical defaults.
              </p>
              <Button type="submit" size="lg" disabled={predict.isPending}>
                {predict.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Running model...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Predict ADR risk
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {predict.isError ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Prediction failed</AlertTitle>
            <AlertDescription>
              {predict.error?.code === 'MODEL_NOT_READY'
                ? 'The server is running but the prediction model is not loaded. Check the API health indicator in the header.'
                : predict.error?.message}
            </AlertDescription>
          </Alert>
        ) : null}

        {prediction ? (
          <section id="results" className="mt-10 scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <FlaskConical className="size-4" />
              </span>
              <h2 className="text-xl font-bold tracking-tight">Assessment results</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <RiskMeter prediction={prediction} />

              {prediction.top_specific_adr_risks || prediction.all_class_probabilities ? (
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Predicted reaction classes
                  </h3>
                  <AdrProbabilityBars
                    className="mt-5"
                    probabilities={
                      prediction.top_specific_adr_risks || prediction.all_class_probabilities
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {Array.isArray(prediction.major_contributing_factors) &&
              prediction.major_contributing_factors.length > 0 ? (
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Major contributing factors
                  </h3>
                  <ul className="mt-4 space-y-4">
                    {prediction.major_contributing_factors.map((factor, index) => (
                      <li key={index} className="border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold">{factor.factor}</p>
                          {factor.risk_contribution ? (
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-xs font-semibold',
                                riskClasses(String(factor.risk_contribution).toLowerCase()).chip,
                              )}
                            >
                              {factor.risk_contribution}
                            </span>
                          ) : null}
                        </div>
                        {factor.value ? (
                          <p className="mt-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                            {factor.value}
                          </p>
                        ) : null}
                        {factor.description ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {factor.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <PharmacogenomicsPanel pharmacogenomics={prediction.pharmacogenomics} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/report')}>
                Generate clinical report
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/drug-interactions')}>
                Check drug interactions
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/clinical-decision-support')}
              >
                Decision support
              </Button>
            </div>
          </section>
        ) : null}
      </PageBody>
    </>
  )
}
