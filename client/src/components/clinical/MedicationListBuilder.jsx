import { useState } from 'react'
import { Pill, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MEDICATION_DATABASE, MEDICATION_NAMES } from '@/lib/dosing'

/**
 * Concomitant medication list.
 *
 * Feeds three fields the model reads: all_medications, external_drugs_list, and
 * concomitant_drugs_count -- which in turn drives the polypharmacy flag once it
 * reaches 5 (schemas.py compute_derived_metrics).
 */
export function MedicationListBuilder({ value = [], onChange, indexDrug }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const name = draft.trim()
    if (!name) return
    if (value.some((m) => m.toLowerCase() === name.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, name])
    setDraft('')
  }

  const remove = (name) => onChange(value.filter((m) => m !== name))

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="concomitant-drug" className="text-sm font-medium">
            Add concomitant medication
          </Label>
          <Input
            id="concomitant-drug"
            list="medication-options"
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
          <datalist id="medication-options">
            {MEDICATION_NAMES.map((name) => (
              <option key={name} value={name}>
                {MEDICATION_DATABASE[name].category}
              </option>
            ))}
          </datalist>
        </div>
        <Button type="button" onClick={add} disabled={!draft.trim()}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((name) => {
            const info = MEDICATION_DATABASE[name]
            return (
              <li
                key={name}
                className="inline-flex items-center gap-2 rounded-full border bg-muted/50 py-1 pl-3 pr-1.5 text-sm"
              >
                <Pill className="size-3.5 text-muted-foreground" />
                <span className="font-medium">{name}</span>
                {info ? (
                  <span className="text-xs text-muted-foreground">{info.category}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(name)}
                  aria-label={`Remove ${name}`}
                  className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="size-3" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          No concomitant medications recorded.
          {indexDrug ? ` Index drug is ${indexDrug}.` : ''}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length} concomitant medication{value.length === 1 ? '' : 's'}
        {value.length >= 5 ? ' - polypharmacy flag will be set automatically.' : ''}
      </p>
    </div>
  )
}
