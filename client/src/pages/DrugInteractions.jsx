import { useState } from 'react'
import { Loader2, Network, Plus, Search, ShieldAlert, X } from 'lucide-react'
import { toast } from 'sonner'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useAssessment } from '@/context/AssessmentContext'
import { useDrugInteractions } from '@/hooks/useApi'
import { MEDICATION_DATABASE, MEDICATION_NAMES } from '@/lib/dosing'
import { AnalysisOverlay } from '@/components/clinical/AnalysisOverlay'
import { cn } from '@/lib/utils'

const SEVERITY_STYLES = {
  critical: 'bg-risk-critical-bg text-risk-critical border-risk-critical-border',
  major: 'bg-risk-high-bg text-risk-high border-risk-high-border',
  high: 'bg-risk-high-bg text-risk-high border-risk-high-border',
  moderate: 'bg-risk-moderate-bg text-risk-moderate border-risk-moderate-border',
  minor: 'bg-risk-low-bg text-risk-low border-risk-low-border',
  low: 'bg-risk-low-bg text-risk-low border-risk-low-border',
}

function severityClass(severity) {
  return SEVERITY_STYLES[String(severity || '').toLowerCase()] || 'bg-muted text-foreground'
}

export default function DrugInteractions() {
  const { patient } = useAssessment()
  const analyse = useDrugInteractions()

  const seeded = [patient.medication_name, ...(patient.all_medications || [])].filter(Boolean)
  const [drugs, setDrugs] = useState([...new Set(seeded)])
  const [draft, setDraft] = useState('')

  const add = () => {
    const name = draft.trim()
    if (!name) return
    if (drugs.some((d) => d.toLowerCase() === name.toLowerCase())) {
      setDraft('')
      return
    }
    setDrugs([...drugs, name])
    setDraft('')
  }

  const run = async () => {
    if (drugs.length < 2) {
      toast.error('Add at least two drugs to check for interactions')
      return
    }
    try {
      await analyse.mutateAsync({ drugs, patient_data: patient })
    } catch (error) {
      toast.error('Interaction analysis failed', { description: error.message })
    }
  }

  const result = analyse.data
  const interactions =
    result?.interactions || result?.conflicts || result?.drug_interactions || []

  return (
    <>
      <AnalysisOverlay
        open={analyse.isPending}
        title="Analysing interactions"
        steps={[
          'Resolving the medication list...',
          'Checking pairwise interactions...',
          'Classifying severity...',
          'Drafting management guidance...',
        ]}
      />

      <PageHeader
        title="Drug Interaction Checker"
        description="Multi-drug conflict analysis with severity classification and alternative suggestions."
        icon={Network}
      />

      <PageBody className="max-w-5xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="drug-input">Add a drug to the regimen</Label>
              <Input
                id="drug-input"
                list="interaction-drug-options"
                value={draft}
                placeholder="Start typing a drug name..."
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    add()
                  }
                }}
                className="mt-1.5"
              />
              <datalist id="interaction-drug-options">
                {MEDICATION_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {MEDICATION_DATABASE[name].category}
                  </option>
                ))}
              </datalist>
            </div>
            <Button type="button" onClick={add} disabled={!draft.trim()} variant="outline">
              <Plus className="size-4" />
              Add
            </Button>
          </div>

          {drugs.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {drugs.map((name) => (
                <li
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full border bg-muted/50 py-1 pl-3 pr-1.5 text-sm"
                >
                  <span className="font-medium">{name}</span>
                  <button
                    type="button"
                    onClick={() => setDrugs(drugs.filter((d) => d !== name))}
                    aria-label={`Remove ${name}`}
                    className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No drugs added yet. Add at least two to run an analysis.
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {drugs.length} drug{drugs.length === 1 ? '' : 's'} in regimen
            </p>
            <Button onClick={run} disabled={analyse.isPending || drugs.length < 2}>
              {analyse.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Analyse interactions
                </>
              )}
            </Button>
          </div>
        </div>

        {analyse.isPending ? (
          <div className="mt-6 space-y-3 rounded-xl border bg-card p-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : null}

        {analyse.isError ? (
          <Alert variant="destructive" className="mt-6">
            <AlertTitle>Analysis failed</AlertTitle>
            <AlertDescription>{analyse.error?.message}</AlertDescription>
          </Alert>
        ) : null}

        {result ? (
          <div className="mt-6 space-y-4">
            {interactions.length > 0 ? (
              interactions.map((item, index) => (
                <article key={index} className="rounded-xl border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-base font-semibold">
                      {item.drugs?.join(' + ') || item.pair || `Interaction ${index + 1}`}
                    </h2>
                    {item.severity ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                          severityClass(item.severity),
                        )}
                      >
                        <ShieldAlert className="size-3.5" />
                        {item.severity}
                      </span>
                    ) : null}
                  </div>
                  {item.description || item.mechanism ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description || item.mechanism}
                    </p>
                  ) : null}
                  {item.recommendation || item.management ? (
                    <p className="mt-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                      <span className="font-medium">Management: </span>
                      {item.recommendation || item.management}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <Alert>
                <AlertTitle>No known interactions detected</AlertTitle>
                <AlertDescription>
                  The analysis found no documented conflicts among these agents. This is not a
                  guarantee of safety - continue standard monitoring.
                </AlertDescription>
              </Alert>
            )}

            {result.analysis || result.summary ? (
              <article className="rounded-xl border bg-card p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-primary">
                  AI clinical analysis
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {result.analysis || result.summary}
                </p>
              </article>
            ) : null}
          </div>
        ) : null}
      </PageBody>
    </>
  )
}
