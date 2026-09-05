import { Link } from 'react-router-dom'
import { CircleHelp, Mail, MapPin, Phone } from 'lucide-react'

import { PageBody, PageHeader } from '@/components/layout/AppShell'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CONTACT, FAQ_GROUPS } from '@/lib/siteContent'

export default function Faqs() {
  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        description="Answers to common questions about PhenoRx."
        icon={CircleHelp}
      />

      <PageBody className="max-w-3xl space-y-10">
        {FAQ_GROUPS.map((group, groupIndex) => (
          <section key={group.title}>
            <h2 className="text-lg font-semibold tracking-tight">{group.title}</h2>
            <Accordion type="single" collapsible className="mt-3 w-full">
              {group.items.map((item, i) => (
                <AccordionItem key={item.q} value={`${groupIndex}-${i}`}>
                  <AccordionTrigger className="text-left text-sm font-medium">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}

        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Still have questions?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get in touch, or read the{' '}
            <Link to="/documentation" className="font-medium text-primary hover:underline">
              documentation
            </Link>{' '}
            and{' '}
            <Link to="/api-reference" className="font-medium text-primary hover:underline">
              API reference
            </Link>
            .
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-2.5">
              <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd className="text-sm font-medium">
                  <a href={`mailto:${CONTACT.email}`} className="hover:text-primary">
                    {CONTACT.email}
                  </a>
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Phone</dt>
                <dd className="text-sm font-medium">{CONTACT.phone}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Address</dt>
                <dd className="text-sm font-medium">{CONTACT.address}</dd>
              </div>
            </div>
          </dl>
        </section>
      </PageBody>
    </>
  )
}
