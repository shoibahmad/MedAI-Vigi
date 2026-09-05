import { BookMarked, Building2, Calendar, Users } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { RESEARCH_PAPERS } from '@/lib/siteContent'

export default function ResearchPapers() {
  return (
    <>
      <PageHeader
        title="Research Papers"
        description="Academic research and publications behind PhenoRx."
        icon={BookMarked}
      />

      <PageBody className="max-w-4xl space-y-6">
        {RESEARCH_PAPERS.map((paper) => (
          <article key={paper.title} className="rounded-xl border bg-card p-6">
            <span className="inline-flex rounded-full border bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
              {paper.type}
            </span>

            <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight">
              {paper.title}
            </h2>

            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                <dd>{paper.authors}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <dd className="tabular-nums">{paper.year}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                <dd>{paper.venue}</dd>
              </div>
            </dl>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Abstract
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{paper.abstract}</p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {paper.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </article>
        ))}

        <p className="rounded-lg border bg-muted/40 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          These papers describe work carried out as an academic research project. The prediction
          model was trained on synthetic data and has not been externally validated against a
          prospective clinical cohort.
        </p>
      </PageBody>
    </>
  )
}
