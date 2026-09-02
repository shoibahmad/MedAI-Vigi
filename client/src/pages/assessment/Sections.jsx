import {
  Dna,
  FlaskConical,
  HeartPulse,
  Pill,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormSection, SubSection } from '@/components/clinical/SectionRail'
import { FieldGrid, LabInput } from '@/components/clinical/LabInput'
import { MedicationListBuilder } from '@/components/clinical/MedicationListBuilder'
import { bmiCategory } from '@/lib/clinical'
import { MEDICATION_DATABASE, MEDICATION_NAMES } from '@/lib/dosing'
import {
  COMORBIDITY_FIELDS,
  CYP_LABELS,
  CYP_OPTIONS,
  ETHNICITY_OPTIONS,
  HLA_OPTIONS,
  RISK_FLAG_FIELDS,
  SEX_OPTIONS,
  TRANSPORTER_LABELS,
  TRANSPORTER_OPTIONS,
} from '@/lib/schemas'

/** Plain (non-interpreted) numeric field, for values with no reference range. */
function NumField({ name, label, unit, hint, register, error, step = 'any' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={name}>{label}</Label>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
      <Input
        id={name}
        type="number"
        step={step}
        inputMode="decimal"
        className="tabular-nums"
        aria-invalid={Boolean(error)}
        {...register(name)}
      />
      {error ? (
        <p className="text-xs font-medium text-destructive">{error.message}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function SelectField({ name, label, options, value, onChange, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={name} className="w-full">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

/** 0|1 flag rendered as a checkbox row. */
function FlagField({ name, label, hint, checked, onChange }) {
  return (
    <label
      htmlFor={name}
      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
    >
      <Checkbox
        id={name}
        checked={checked === 1}
        onCheckedChange={(state) => onChange(state ? 1 : 0)}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  )
}

export function DemographicsSection({ register, errors, values, setValue }) {
  return (
    <FormSection
      id="demographics"
      title="Demographics"
      description="Age and sex select the laboratory reference intervals used across this form."
      icon={UserRound}
    >
      <div className="space-y-6">
        <FieldGrid>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Patient name</Label>
            <Input id="name" {...register('name')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="patient_id">Patient ID</Label>
            <Input id="patient_id" {...register('patient_id')} />
          </div>
          <NumField name="age" label="Age" unit="years" register={register} error={errors.age} />

          <SelectField
            name="sex"
            label="Sex"
            options={SEX_OPTIONS.map((o) => o.value)}
            value={values.sex}
            onChange={(v) => setValue('sex', v, { shouldValidate: true })}
          />
          <SelectField
            name="ethnicity"
            label="Ethnicity"
            options={ETHNICITY_OPTIONS}
            value={values.ethnicity}
            onChange={(v) => setValue('ethnicity', v, { shouldValidate: true })}
          />
        </FieldGrid>

        <SubSection title="Anthropometrics">
          <FieldGrid>
            <NumField
              name="height"
              label="Height"
              unit="cm"
              register={register}
              error={errors.height}
            />
            <NumField
              name="weight"
              label="Weight"
              unit="kg"
              register={register}
              error={errors.weight}
            />
            <div className="flex flex-col gap-1.5">
              <Label>Body mass index</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3">
                <span className="text-sm font-semibold tabular-nums">{values.bmi ?? '--'}</span>
                {values.bmi ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {bmiCategory(Number(values.bmi))}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">Auto-calculated</p>
            </div>
          </FieldGrid>
        </SubSection>
      </div>
    </FormSection>
  )
}

export function LaboratorySection({ register, errors, values }) {
  const sex = values.sex || 'M'
  const lab = (name, label, unit, extra = {}) => (
    <LabInput
      key={name}
      name={name}
      label={label}
      unit={unit}
      sex={sex}
      register={register}
      value={values[name]}
      error={errors[name]?.message}
      {...extra}
    />
  )

  return (
    <FormSection
      id="laboratory"
      title="Laboratory Values"
      description="Values are checked against the same reference ranges the server uses, so out-of-range results flag as you type."
      icon={FlaskConical}
    >
      <div className="space-y-8">
        <SubSection title="Renal function">
          <FieldGrid>
            {lab('creatinine', 'Serum creatinine', 'mg/dL')}
            {lab('egfr', 'Estimated GFR', 'mL/min/1.73m2', {
              hint: 'Auto-calculated from creatinine, age and sex (CKD-EPI 2021)',
            })}
          </FieldGrid>
        </SubSection>

        <SubSection title="Hepatic panel">
          <FieldGrid>
            {lab('ast_alt', 'AST / ALT', 'U/L')}
            {lab('bilirubin', 'Total bilirubin', 'mg/dL')}
            {lab('albumin', 'Serum albumin', 'g/dL')}
          </FieldGrid>
        </SubSection>

        <SubSection title="Complete blood count">
          <FieldGrid>
            <NumField
              name="hemoglobin"
              label="Haemoglobin"
              unit="g/dL"
              register={register}
              error={errors.hemoglobin}
            />
            <NumField
              name="hematocrit"
              label="Haematocrit"
              unit="%"
              register={register}
              error={errors.hematocrit}
            />
            <NumField
              name="wbc_count"
              label="WBC count"
              unit="cells/uL"
              register={register}
              error={errors.wbc_count}
            />
            <NumField
              name="platelet_count"
              label="Platelet count"
              unit="cells/uL"
              register={register}
              error={errors.platelet_count}
            />
            <NumField
              name="rbc_count"
              label="RBC count"
              unit="M/uL"
              register={register}
              error={errors.rbc_count}
            />
          </FieldGrid>
        </SubSection>

        <SubSection title="Differential count">
          <FieldGrid>
            {[
              ['neutrophils', 'Neutrophils'],
              ['lymphocytes', 'Lymphocytes'],
              ['monocytes', 'Monocytes'],
              ['eosinophils', 'Eosinophils'],
              ['basophils', 'Basophils'],
            ].map(([name, label]) => (
              <NumField
                key={name}
                name={name}
                label={label}
                unit="%"
                register={register}
                error={errors[name]}
              />
            ))}
          </FieldGrid>
        </SubSection>

        <SubSection title="Red cell indices">
          <FieldGrid>
            {[
              ['mcv', 'MCV', 'fL'],
              ['mch', 'MCH', 'pg'],
              ['mchc', 'MCHC', 'g/dL'],
              ['rdw', 'RDW', '%'],
            ].map(([name, label, unit]) => (
              <NumField
                key={name}
                name={name}
                label={label}
                unit={unit}
                register={register}
                error={errors[name]}
              />
            ))}
          </FieldGrid>
        </SubSection>

        <SubSection title="Vitals and haemodynamics">
          <FieldGrid>
            {[
              ['bp_systolic', 'Systolic BP', 'mmHg'],
              ['bp_diastolic', 'Diastolic BP', 'mmHg'],
              ['heart_rate', 'Heart rate', 'bpm'],
              ['temperature', 'Temperature', 'degC'],
            ].map(([name, label, unit]) => (
              <NumField
                key={name}
                name={name}
                label={label}
                unit={unit}
                register={register}
                error={errors[name]}
              />
            ))}
          </FieldGrid>
        </SubSection>
      </div>
    </FormSection>
  )
}

export function ComorbiditiesSection({ values, setValue }) {
  return (
    <FormSection
      id="comorbidities"
      title="Comorbidities"
      description="Existing conditions that alter drug clearance or raise baseline reaction risk."
      icon={HeartPulse}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMORBIDITY_FIELDS.map(({ name, label }) => (
          <FlagField
            key={name}
            name={name}
            label={label}
            checked={values[name]}
            onChange={(v) => setValue(name, v, { shouldValidate: true })}
          />
        ))}
      </div>
    </FormSection>
  )
}

export function MedicationSection({ register, errors, values, setValue }) {
  const selected = MEDICATION_DATABASE[values.medication_name]

  return (
    <FormSection
      id="medication"
      title="Medication"
      description="The index drug under assessment, plus every concomitant agent."
      icon={Pill}
    >
      <div className="space-y-6">
        <FieldGrid>
          <SelectField
            name="medication_name"
            label="Index drug"
            options={MEDICATION_NAMES}
            value={values.medication_name}
            onChange={(v) => {
              setValue('medication_name', v, { shouldValidate: true })
              const info = MEDICATION_DATABASE[v]
              if (info) setValue('index_drug_dose', info.standardDose, { shouldValidate: true })
            }}
            hint={selected ? `${selected.category} - ${selected.frequency}` : undefined}
          />
          <NumField
            name="index_drug_dose"
            label="Dose"
            unit={selected?.unit || 'mg'}
            register={register}
            error={errors.index_drug_dose}
          />
          <NumField
            name="time_since_start_days"
            label="Days since start"
            unit="days"
            register={register}
            error={errors.time_since_start_days}
          />
        </FieldGrid>

        <SubSection title="Concomitant medications">
          <MedicationListBuilder
            value={values.all_medications || []}
            indexDrug={values.medication_name}
            onChange={(list) => {
              setValue('all_medications', list, { shouldValidate: true })
              setValue('external_drugs_list', list, { shouldValidate: true })
              setValue('concomitant_drugs_count', list.length, { shouldValidate: true })
              // Mirrors compute_derived_metrics in schemas.py so the UI agrees with
              // the payload the server will build.
              setValue('polypharmacy_flag', list.length >= 5 ? 1 : 0, { shouldValidate: true })
            }}
          />
        </SubSection>
      </div>
    </FormSection>
  )
}

export function PharmacogenomicsSection({ values, setValue }) {
  const toggleAllele = (field, allele, checked) => {
    const current = values[field] || []
    const next = checked ? [...current, allele] : current.filter((a) => a !== allele)
    setValue(field, next, { shouldValidate: true })
    // Any screened risk allele present sets the flag the model reads.
    const anyAllele = ['hla_a_typing', 'hla_b_typing', 'hla_drb1_typing'].some((f) =>
      f === field ? next.length > 0 : (values[f] || []).length > 0,
    )
    setValue('hla_risk_allele_flag', anyAllele ? 1 : 0, { shouldValidate: true })
  }

  return (
    <FormSection
      id="pharmacogenomics"
      title="Pharmacogenomics"
      description="Metabolizer phenotypes, transporter genotypes, and HLA alleles associated with severe reactions."
      icon={Dna}
    >
      <div className="space-y-8">
        <SubSection title="Cytochrome P450 metabolizer phenotype">
          <FieldGrid>
            {Object.keys(CYP_OPTIONS).map((field) => (
              <SelectField
                key={field}
                name={field}
                label={CYP_LABELS[field]}
                options={CYP_OPTIONS[field]}
                value={values[field]}
                onChange={(v) => setValue(field, v, { shouldValidate: true })}
              />
            ))}
          </FieldGrid>
        </SubSection>

        <SubSection title="Drug transporters">
          <FieldGrid>
            {Object.keys(TRANSPORTER_OPTIONS).map((field) => (
              <SelectField
                key={field}
                name={field}
                label={TRANSPORTER_LABELS[field]}
                options={TRANSPORTER_OPTIONS[field]}
                value={values[field]}
                onChange={(v) => setValue(field, v, { shouldValidate: true })}
              />
            ))}
          </FieldGrid>
        </SubSection>

        <SubSection title="HLA risk alleles">
          <p className="text-sm text-muted-foreground">
            Only alleles the screening engine recognises are listed. Selecting any of them sets
            the HLA risk flag automatically.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(HLA_OPTIONS).flatMap(([field, alleles]) =>
              alleles.map((allele) => (
                <FlagField
                  key={allele}
                  name={allele}
                  label={allele}
                  checked={(values[field] || []).includes(allele) ? 1 : 0}
                  onChange={(v) => toggleAllele(field, allele, v === 1)}
                />
              )),
            )}
          </div>
        </SubSection>
      </div>
    </FormSection>
  )
}

export function AdditionalSection({ register, errors, values, setValue }) {
  return (
    <FormSection
      id="additional"
      title="Additional Clinical Data"
      description="Risk modifiers and cumulative exposure metrics."
      icon={SlidersHorizontal}
    >
      <div className="space-y-8">
        <SubSection title="Risk flags">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {RISK_FLAG_FIELDS.map(({ name, label, hint }) => (
              <FlagField
                key={name}
                name={name}
                label={label}
                hint={hint}
                checked={values[name]}
                onChange={(v) => setValue(name, v, { shouldValidate: true })}
              />
            ))}
          </div>
        </SubSection>

        <SubSection title="Exposure metrics">
          <FieldGrid>
            <NumField
              name="cumulative_dose_mg"
              label="Cumulative dose"
              unit="mg"
              register={register}
              error={errors.cumulative_dose_mg}
            />
            <NumField
              name="dose_density_mg_day"
              label="Dose density"
              unit="mg/day"
              register={register}
              error={errors.dose_density_mg_day}
            />
            <NumField
              name="concomitant_drugs_count"
              label="Concomitant drug count"
              register={register}
              error={errors.concomitant_drugs_count}
              hint="Set automatically from the medication list"
            />
          </FieldGrid>
        </SubSection>
      </div>
    </FormSection>
  )
}
