import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, RefreshCw, UserRound } from 'lucide-react'
import { toast } from 'sonner'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormSection } from '@/components/clinical/SectionRail'
import { useAssessment } from '@/context/AssessmentContext'
import { patientSchema, SEX_OPTIONS, ETHNICITY_OPTIONS } from '@/lib/schemas'
import { bmiCategory, calculateBMI, calculateEGFR } from '@/lib/clinical'

// Only the demographic slice of the full patient schema is collected here; the
// clinical markers come later on /assessment.
const detailsSchema = patientSchema.pick({
  name: true,
  patient_id: true,
  age: true,
  sex: true,
  ethnicity: true,
  height: true,
  weight: true,
})

function generateMRN() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6)
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5)
  return 'MRN-' + stamp + rand
}

function ageInterpretation(age) {
  if (age == null || Number.isNaN(age)) return null
  if (age < 18) return 'Paediatric - weight-based dosing and paediatric reference ranges apply.'
  if (age >= 75)
    return 'Advanced geriatric - expect reduced clearance; dose reduction is usually indicated.'
  if (age >= 65) return 'Geriatric - increased ADR susceptibility; monitor renal clearance.'
  return 'Adult - standard reference ranges apply.'
}

export default function PatientDetails() {
  const navigate = useNavigate()
  const { patient, setPatient, clinicianName, setClinician } = useAssessment()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: patient.name === 'Patient' ? '' : patient.name,
      patient_id: patient.patient_id === 'PT-UNKNOWN' ? generateMRN() : patient.patient_id,
      age: patient.age,
      sex: patient.sex,
      ethnicity: patient.ethnicity,
      height: patient.height,
      weight: patient.weight,
    },
  })

  const height = watch('height')
  const weight = watch('weight')
  const age = watch('age')
  const sex = watch('sex')

  const bmi = calculateBMI(Number(height), Number(weight))
  // Recomputed here because creatinine is already known from a previous session if
  // the clinician came back to edit demographics.
  const egfr = calculateEGFR(patient.creatinine, Number(age), sex)

  const onSubmit = (values) => {
    setPatient({
      ...values,
      name: values.name?.trim() || 'Patient',
      bmi: bmi ?? patient.bmi,
      ...(egfr != null ? { egfr } : {}),
    })
    toast.success('Patient details saved', {
      description: 'Continue to the clinical assessment.',
    })
    navigate('/assessment')
  }

  return (
    <>
      <PageHeader
        title="Patient Details"
        description="Demographics and anthropometrics. These select the laboratory reference ranges, drive the eGFR estimate, and inform every dosing adjustment downstream."
        icon={UserRound}
      />

      <PageBody className="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormSection
            id="identity"
            title="Identity"
            description="Used to label the assessment and the generated report."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Patient name</Label>
                <Input id="name" placeholder="e.g. Harold Wilson" {...register('name')} />
                {errors.name ? (
                  <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="patient_id">Patient ID</Label>
                <div className="flex gap-2">
                  <Input id="patient_id" {...register('patient_id')} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Regenerate patient ID"
                    onClick={() => setValue('patient_id', generateMRN())}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
                {errors.patient_id ? (
                  <p className="text-xs font-medium text-destructive">
                    {errors.patient_id.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="clinician">Attending clinician</Label>
                <Input
                  id="clinician"
                  value={clinicianName}
                  onChange={(event) => setClinician(event.target.value)}
                  placeholder="e.g. Dr. A. Rahman"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            id="demographics"
            title="Demographics"
            description="Age and sex select the correct laboratory reference intervals."
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="age">Age (years)</Label>
                <Input
                  id="age"
                  type="number"
                  inputMode="numeric"
                  className="tabular-nums"
                  aria-invalid={Boolean(errors.age)}
                  {...register('age')}
                />
                {errors.age ? (
                  <p className="text-xs font-medium text-destructive">{errors.age.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sex">Sex</Label>
                <Select
                  value={sex}
                  onValueChange={(v) => setValue('sex', v, { shouldValidate: true })}
                >
                  <SelectTrigger id="sex" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEX_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ethnicity">Ethnicity</Label>
                <Select
                  value={watch('ethnicity')}
                  onValueChange={(v) => setValue('ethnicity', v, { shouldValidate: true })}
                >
                  <SelectTrigger id="ethnicity" className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETHNICITY_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {ageInterpretation(Number(age)) ? (
              <p className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {ageInterpretation(Number(age))}
              </p>
            ) : null}
          </FormSection>

          <FormSection
            id="anthropometrics"
            title="Anthropometrics"
            description="BMI is calculated automatically and submitted with the assessment."
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="any"
                  className="tabular-nums"
                  aria-invalid={Boolean(errors.height)}
                  {...register('height')}
                />
                {errors.height ? (
                  <p className="text-xs font-medium text-destructive">{errors.height.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="any"
                  className="tabular-nums"
                  aria-invalid={Boolean(errors.weight)}
                  {...register('weight')}
                />
                {errors.weight ? (
                  <p className="text-xs font-medium text-destructive">{errors.weight.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Body mass index</Label>
                <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3">
                  <span className="text-sm font-semibold tabular-nums">
                    {bmi != null ? bmi : '--'}
                  </span>
                  {bmi != null ? (
                    <span className="ml-2 text-xs text-muted-foreground">{bmiCategory(bmi)}</span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">Calculated from height and weight</p>
              </div>
            </div>

            {egfr != null ? (
              <p className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Estimated GFR from the recorded creatinine is{' '}
                <strong className="font-semibold text-foreground tabular-nums">{egfr}</strong>{' '}
                mL/min/1.73m2 (CKD-EPI 2021). Refine it on the assessment page.
              </p>
            ) : null}
          </FormSection>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="submit" size="lg">
              Continue to assessment
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      </PageBody>
    </>
  )
}
