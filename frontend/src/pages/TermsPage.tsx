import { FileText } from 'lucide-react'

export function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      </div>
      <div className="prose-sm space-y-6 text-muted-foreground">
        <section>
          <h2 className="mb-2 font-semibold text-foreground">1. Service Description</h2>
          <p>
            ReplyPilot automates comment-to-DM engagement on connected Instagram business accounts
            using rules that you configure. The service acts only within access scopes you grant via
            official Instagram OAuth.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-foreground">2. Acceptable Use</h2>
          <p>
            You agree not to use ReplyPilot for spam, harassment or bulk unsolicited messaging, and
            to follow Instagram platform policies. Violation may lead to suspension of your access.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-foreground">3. Automation Disclaimer</h2>
          <p>
            Automated messages are dispatched on your behalf. You are responsible for the content of
            your keywords, funnel messages and linked URLs.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-foreground">4. Changes</h2>
          <p>
            We may update these terms as the service evolves. Continued use of ReplyPilot after an
            update constitutes acceptance of the revised terms.
          </p>
        </section>
      </div>
    </main>
  )
}
