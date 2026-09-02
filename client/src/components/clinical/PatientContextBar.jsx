import { Clock, IdCard, Stethoscope, User } from 'lucide-react'
import { useAssessment } from '@/context/AssessmentContext'
import { cn } from '@/lib/utils'

function ContextCard({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold" title={value}>
          {value}
        </p>
      </div>
    </div>
  )
}

/**
 * Persistent patient/clinician/session strip.
 * Replaces the header info cards in templates/index.html:5208-5241, but reads from
 * AssessmentContext so it stays correct across every clinical page.
 */
export function PatientContextBar({ className }) {
  const { patient, clinicianName, startedAt } = useAssessment()

  const started = startedAt ? new Date(startedAt) : null
  const startedLabel = started
    ? started.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Not started'

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>
      <ContextCard icon={User} label="Patient" value={patient?.name || 'Unnamed patient'} />
      <ContextCard icon={IdCard} label="Patient ID" value={patient?.patient_id || 'Unassigned'} />
      <ContextCard icon={Stethoscope} label="Clinician" value={clinicianName || 'Unassigned'} />
      <ContextCard icon={Clock} label="Assessment started" value={startedLabel} />
    </div>
  )
}
