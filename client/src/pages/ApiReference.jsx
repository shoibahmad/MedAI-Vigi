import { Code2 } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { API_ENDPOINTS, API_ERRORS } from '@/lib/siteContent'
import { cn } from '@/lib/utils'

const METHOD_TONE = {
  GET: 'bg-risk-low-bg text-risk-low border-risk-low-border',
  POST: 'bg-accent text-accent-foreground border-primary/30',
}

function Code({ children }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

export default function ApiReference() {
  return (
    <>
      <PageHeader
        title="API Reference"
        description="Every endpoint the PhenoRx service exposes, with request parameters and example responses."
        icon={Code2}
      />

      <PageBody className="max-w-4xl space-y-10">
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Base URL</h2>
          <Code>http://localhost:5000</Code>
          <p className="mt-2 text-sm text-muted-foreground">
            Replace with your deployed host. The frontend calls the API on the same origin, so no
            base URL is configured in the client.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Authentication</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The API currently requires no authentication. Every endpoint is public. Before any
            production deployment handling real patient data, add authentication, authorization,
            and request auditing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Endpoints</h2>
          <div className="mt-5 space-y-6">
            {API_ENDPOINTS.map((ep) => (
              <article key={ep.path} className="rounded-xl border bg-card">
                <header className="flex flex-wrap items-center gap-3 border-b px-5 py-3.5">
                  <span
                    className={cn(
                      'rounded border px-2 py-0.5 font-mono text-xs font-bold',
                      METHOD_TONE[ep.method] || 'bg-muted',
                    )}
                  >
                    {ep.method}
                  </span>
                  <code className="font-mono text-sm font-semibold">{ep.path}</code>
                </header>

                <div className="px-5 py-4">
                  <p className="text-sm text-muted-foreground">{ep.summary}</p>

                  {ep.params.length > 0 ? (
                    <>
                      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Request body
                      </h3>
                      <div className="mt-2 overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[32rem] text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              {['Parameter', 'Type', 'Required', 'Description'].map((h) => (
                                <th key={h} className="px-3 py-2 text-left font-semibold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ep.params.map(([name, type, required, desc]) => (
                              <tr key={name} className="border-t">
                                <td className="px-3 py-2 font-mono text-xs font-medium">{name}</td>
                                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                                  {type}
                                </td>
                                <td className="px-3 py-2 text-xs">{required}</td>
                                <td className="px-3 py-2 text-muted-foreground">{desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : null}

                  <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Example response
                  </h3>
                  <Code>{ep.response}</Code>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight">Error responses</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Errors return a consistent envelope:{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {'{ "status": "error", "message": "...", "code": 404 }'}
            </code>
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[26rem] text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">Status</th>
                  <th className="px-4 py-2 text-left font-semibold">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {API_ERRORS.map(([code, meaning]) => (
                  <tr key={code} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs font-semibold">{code}</td>
                    <td className="px-4 py-2 text-muted-foreground">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PageBody>
    </>
  )
}
