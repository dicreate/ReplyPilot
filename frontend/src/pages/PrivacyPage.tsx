import { Shield } from 'lucide-react'

export function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Shield className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      </div>
      <div className="prose-sm space-y-6 text-muted-foreground">
        <section>
          <h2 className="mb-2 font-semibold text-foreground">Data We Collect</h2>
          <p>
            ReplyPilot accesses only the data granted through official Instagram OAuth: your
            business account ID, username, recent posts and comments made on them, and participants
            of comment-to-DM conversations. We never ask for your Instagram password.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-foreground">How Data Is Used</h2>
          <p>
            Processed comments are used solely to trigger keyword-based automated replies and to
            provide analytics for your account. Processed comment history is stored temporarily and
            auto-deleted after the retention period shown in the dashboard.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-foreground">Your Controls</h2>
          <p>
            You can revoke access at any time via Instagram settings (Apps and Websites), and delete
            any keyword rule from the dashboard, which stops related automation immediately.
          </p>
        </section>
        <section>
          <h2 className="mb-2 font-semibold text-foreground">Contact</h2>
          <p>Questions about your data? Reach us directly through the Instagram account you connected.</p>
        </section>
      </div>
    </main>
  )
}
