import { Scale } from 'lucide-react'
import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { LAST_UPDATED } from '@/lib/siteContent'

/**
 * Shared renderer for the three legal documents. The content lives in
 * lib/legalContent.js; this file only decides how a section is displayed.
 */
export function LegalPage({ doc }) {
  return (
    <>
      <PageHeader title={doc.title} description={`Last updated: ${LAST_UPDATED}`} icon={Scale} />

      <PageBody className="max-w-3xl">
        {doc.intro ? (
          <p className="mb-8 rounded-lg border border-primary/30 bg-accent px-5 py-4 text-sm leading-relaxed text-accent-foreground">
            <strong className="font-semibold">Important notice. </strong>
            {doc.intro}
          </p>
        ) : null}

        <div className="space-y-10">
          {doc.sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold tracking-tight">
                <span className="mr-2 tabular-nums text-muted-foreground">{index + 1}.</span>
                {section.title}
              </h2>

              {section.paragraphs?.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}

              {section.items ? (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.table ? (
                <div className="mt-4 overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        {section.table.head.map((h) => (
                          <th key={h} className="px-4 py-2.5 text-left font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, i) => (
                        <tr key={i} className="border-t">
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              className={
                                j === 0
                                  ? 'px-4 py-2.5 font-medium'
                                  : 'px-4 py-2.5 text-muted-foreground'
                              }
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {section.note ? (
                <p className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm leading-relaxed">
                  {section.note}
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </PageBody>
    </>
  )
}
