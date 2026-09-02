import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, User } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAssessment } from '@/context/AssessmentContext'
import { useChat } from '@/hooks/useApi'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'What are the main ADR risks for this patient?',
  'Which monitoring tests should I order first?',
  'Explain the pharmacogenomic findings in plain language.',
  'What alternatives exist if this drug is contraindicated?',
]

const GREETING = {
  role: 'assistant',
  content:
    'I can answer questions about this patient assessment - risk drivers, monitoring, pharmacogenomics, and alternatives. What would you like to know?',
}

export default function Chatbot() {
  const { patient, prediction } = useAssessment()
  const chat = useChat()
  const [messages, setMessages] = useState([GREETING])
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  // The /api/chat endpoint is stateless, so the transcript lives here and the
  // patient context is re-sent with every turn.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, chat.isPending])

  const send = async (text) => {
    const message = (text ?? draft).trim()
    if (!message || chat.isPending) return

    setMessages((current) => [...current, { role: 'user', content: message }])
    setDraft('')

    try {
      const result = await chat.mutateAsync({
        message,
        context: { patient_data: patient, prediction_result: prediction },
      })
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: result.response || result.message || result.reply },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: `I could not answer that: ${error.message}`, error: true },
      ])
    }
  }

  return (
    <>
      <PageHeader
        title="Clinical Assistant"
        description="Ask questions about the current assessment. Answers are AI-generated and must be verified before acting on them."
        icon={Bot}
      />

      <PageBody className="max-w-3xl">
        <div className="flex h-[min(70vh,42rem)] flex-col overflow-hidden rounded-xl border bg-card">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              return (
                <div
                  key={index}
                  className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
                >
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full',
                      isUser ? 'bg-muted' : 'bg-accent text-accent-foreground',
                    )}
                  >
                    {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
                  </span>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : message.error
                          ? 'border border-destructive/30 bg-destructive/5 text-foreground'
                          : 'bg-muted',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              )
            })}

            {chat.isPending ? (
              <div className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Bot className="size-4" />
                </span>
                <div className="rounded-2xl bg-muted px-4 py-2.5">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            ) : null}
          </div>

          {messages.length === 1 ? (
            <div className="border-t px-5 py-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <form
            className="flex items-end gap-2 border-t p-4"
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
          >
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send()
                }
              }}
              rows={1}
              placeholder="Ask about risk drivers, monitoring, or alternatives..."
              className="max-h-32 min-h-10 resize-none"
              maxLength={2000}
            />
            <Button type="submit" size="icon" disabled={!draft.trim() || chat.isPending}>
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Responses are generated by a language model and may be incomplete or incorrect. Verify
          against primary sources before acting.
        </p>
      </PageBody>
    </>
  )
}
