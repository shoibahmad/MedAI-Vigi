import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Loader2, UsersRound } from 'lucide-react'
import { toast } from 'sonner'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { SignaturePad } from '@/components/clinical/SignaturePad'
import { useAssessment } from '@/context/AssessmentContext'
import { useSubmitCounselling } from '@/hooks/useApi'
import {
  COUNSELLING_STEPS,
  calculateComprehensionScore,
  clampStep,
  comprehensionVerdict,
  createCounsellingState,
  stepProgressPercent,
} from '@/lib/counselling'
import { getMedicationInfo } from '@/lib/dosing'
import { cn } from '@/lib/utils'

const EDUCATION_TOPICS = [
  'Purpose of the medication and expected benefit',
  'Correct dose, timing, and route of administration',
  'What to do about a missed dose',
  'Food, alcohol, and other drug interactions',
  'Storage and disposal',
]

const COMPREHENSION_CHECKS = [
  'Patient can state the name and purpose of the medication',
  'Patient can state the correct dose and schedule',
  'Patient can describe what to do if a dose is missed',
  'Patient can name at least two common side effects',
  'Patient can identify the red-flag symptoms requiring urgent care',
  'Patient knows who to contact with questions',
]

const WARNING_SIGNS = [
  'Rash, blistering, or peeling skin',
  'Yellowing of the skin or eyes',
  'Unusual bruising or bleeding',
  'Swelling of the face, lips, or tongue',
  'Severe or persistent muscle pain',
  'Reduced urine output or marked swelling of the legs',
]

const TONE_CLASS = {
  success: 'bg-risk-low-bg text-risk-low border-risk-low-border',
  warning: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  error: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
}

function StepHeader({ index }) {
  const step = COUNSELLING_STEPS[index]
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Step {index + 1} of {COUNSELLING_STEPS.length}
      </p>
      <h2 className="mt-1 text-xl font-bold tracking-tight">{step.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
    </div>
  )
}

function CheckList({ items, checked, onToggle }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item}>
          <label
            className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent"
          >
            <Checkbox
              checked={checked.includes(item)}
              onCheckedChange={(state) => onToggle(item, Boolean(state))}
              className="mt-0.5"
            />
            <span className="text-sm">{item}</span>
          </label>
        </li>
      ))}
    </ul>
  )
}

export default function Counselling() {
  const { patient, prediction, clinicianName } = useAssessment()
  const submit = useSubmitCounselling()

  const [session] = useState(createCounsellingState)
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState('Discharge Consultation')
  const [counsellor, setCounsellor] = useState(clinicianName)
  const [topicsCovered, setTopicsCovered] = useState([])
  const [adrCovered, setAdrCovered] = useState([])
  const [comprehension, setComprehension] = useState([])
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [signatures, setSignatures] = useState({ patient: null, counsellor: null })

  const info = getMedicationInfo(patient.medication_name)
  const score = useMemo(
    () => calculateComprehensionScore(comprehension.length, COMPREHENSION_CHECKS.length),
    [comprehension.length],
  )
  const verdict = comprehensionVerdict(score)

  const toggle = (setter) => (item, checked) =>
    setter((current) =>
      checked ? [...current, item] : current.filter((entry) => entry !== item),
    )

  const finish = async () => {
    if (!signatures.patient || !signatures.counsellor) {
      toast.error('Both signatures are required to complete the session')
      return
    }
    try {
      await submit.mutateAsync({
        session_type: sessionType,
        counsellor_name: counsellor,
        comprehension_notes: notes,
        patient_data: {
          ...patient,
          session_id: session.sessionId,
          comprehension_score: score,
          topics_covered: topicsCovered,
          adr_education: adrCovered,
          follow_up_date: followUpDate,
        },
      })
      toast.success('Counselling session recorded', { description: session.sessionId })
    } catch (error) {
      toast.error('Could not record the session', { description: error.message })
    }
  }

  return (
    <>
      <PageHeader
        title="Patient Counselling"
        description="Structured medication education with teach-back comprehension scoring and signed acknowledgment."
        icon={UsersRound}
      />

      <PageBody className="max-w-4xl">
        <div className="mb-6 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{patient.name}</p>
              <p className="text-xs text-muted-foreground">
                Session {session.sessionId} - {patient.medication_name}
              </p>
            </div>
            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              {stepProgressPercent(step)}% complete
            </p>
          </div>
          <Progress value={stepProgressPercent(step)} className="mt-4" />

          <ol className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {COUNSELLING_STEPS.map((s, index) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(index + 1)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium transition-colors',
                    index + 1 === step
                      ? 'text-primary'
                      : index + 1 < step
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-4 place-items-center rounded-full border text-[0.6rem]',
                      index + 1 < step
                        ? 'border-success bg-success text-white'
                        : index + 1 === step
                          ? 'border-primary'
                          : 'border-border',
                    )}
                  >
                    {index + 1 < step ? <Check className="size-2.5" /> : index + 1}
                  </span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <StepHeader index={step - 1} />

          <div className="mt-6">
            {step === 1 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="session-type">Session type</Label>
                  <Input
                    id="session-type"
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="counsellor">Counsellor</Label>
                  <Input
                    id="counsellor"
                    value={counsellor}
                    onChange={(e) => setCounsellor(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-5">
                <div className="rounded-lg border bg-muted/40 px-4 py-3">
                  <p className="text-sm font-semibold">{patient.medication_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.index_drug_dose}
                    {info ? ` ${info.unit}, ${info.frequency}` : ''}
                    {info ? ` - ${info.category}` : ''}
                  </p>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Topics covered</h3>
                  <CheckList
                    items={EDUCATION_TOPICS}
                    checked={topicsCovered}
                    onToggle={toggle(setTopicsCovered)}
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                {prediction ? (
                  <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                    <span className="font-semibold">AI-predicted risk: </span>
                    {prediction.risk_level || 'Unknown'}
                    {prediction.predicted_adr ? ` - ${prediction.predicted_adr}` : ''}
                  </div>
                ) : null}
                <div>
                  <h3 className="mb-1 text-sm font-semibold">Warning signs discussed</h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Patient advised to seek immediate medical attention if any of these occur.
                  </p>
                  <CheckList
                    items={WARNING_SIGNS}
                    checked={adrCovered}
                    onToggle={toggle(setAdrCovered)}
                  />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <CheckList
                  items={COMPREHENSION_CHECKS}
                  checked={comprehension}
                  onToggle={toggle(setComprehension)}
                />

                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3',
                    TONE_CLASS[verdict.tone],
                  )}
                >
                  <span className="text-sm font-semibold">{verdict.label}</span>
                  <span className="text-2xl font-bold tabular-nums">{score}%</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="notes">Comprehension notes</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Record any areas needing reinforcement..."
                  />
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="followup">Next follow-up appointment</Label>
                  <Input
                    id="followup"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    Monitoring intervals should follow the renal and hepatic guidance on the
                    Clinical Decision Support page for this patient.
                  </p>
                </div>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-6">
                <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm leading-relaxed">
                  I confirm that the medication, its purpose, dosing schedule, expected side
                  effects, and warning signs have been explained to me, and that I have had the
                  opportunity to ask questions.
                </p>

                <div className="grid gap-6 sm:grid-cols-2">
                  <SignaturePad
                    label="Patient signature"
                    value={signatures.patient}
                    onChange={(data) => setSignatures((s) => ({ ...s, patient: data }))}
                  />
                  <SignaturePad
                    label="Counsellor signature"
                    value={signatures.counsellor}
                    onChange={(data) => setSignatures((s) => ({ ...s, counsellor: data }))}
                  />
                </div>

                <dl className="grid gap-4 rounded-lg border bg-muted/30 px-4 py-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Topics covered</dt>
                    <dd className="text-sm font-semibold tabular-nums">
                      {topicsCovered.length}/{EDUCATION_TOPICS.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Warning signs</dt>
                    <dd className="text-sm font-semibold tabular-nums">
                      {adrCovered.length}/{WARNING_SIGNS.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-muted-foreground">Comprehension</dt>
                    <dd className="text-sm font-semibold tabular-nums">{score}%</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex items-center justify-between border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => clampStep(s - 1))}
              disabled={step === 1}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>

            {step < COUNSELLING_STEPS.length ? (
              <Button type="button" onClick={() => setStep((s) => clampStep(s + 1))}>
                Next
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={finish} disabled={submit.isPending}>
                {submit.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    Complete session
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </PageBody>
    </>
  )
}
