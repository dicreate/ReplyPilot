import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Instagram,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Tags,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstagramOAuth, buildInstagramOAuthUrl } from '@/features/auth/useInstagramOAuth'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Smart Automation',
    text: 'Automatically respond to comments with personalized messages based on keywords you define.',
  },
  {
    icon: Zap,
    title: 'Instant DM Responses',
    text: 'Send direct messages instantly when specific keywords are mentioned in your post comments.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    text: 'Track your engagement metrics, response rates, and automation performance in real-time.',
  },
  {
    icon: Tags,
    title: 'Keyword Management',
    text: 'Create and manage unlimited keyword-response pairs with dynamic placeholders.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    text: 'Built with enterprise-grade security and reliability. Your data is always protected.',
  },
  {
    icon: Clock,
    title: '24/7 Monitoring',
    text: 'Continuous monitoring of your posts ensures no engagement opportunity is missed.',
  },
] as const

const STEPS = [
  {
    title: 'Connect Instagram',
    text: 'Securely connect your Instagram account using official Instagram OAuth.',
  },
  {
    title: 'Set Keywords',
    text: 'Define keywords, build visual funnels and create personalized response messages for each trigger.',
  },
  {
    title: 'Automate & Grow',
    text: 'Sit back and watch as your engagement increases with automated responses.',
  },
] as const

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
}

export function LandingPage() {
  const { handleLogin, loading } = useInstagramOAuth()

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_70%_10%,hsl(var(--color-primary)/0.12),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <motion.p
              {...fadeUp}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <Instagram className="size-3.5 text-primary" />
              Official Instagram automation
            </motion.p>
            <motion.h1
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.05 }}
              className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl"
            >
              Automate Your Instagram <span className="text-gradient">Engagement</span>
            </motion.h1>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="mt-5 max-w-xl text-lg text-muted-foreground"
            >
              Transform your Instagram presence with intelligent DM automation. Respond to comments
              instantly with personalized messages and build visual funnels that convert —
              effortlessly.
            </motion.p>
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button size="lg" onClick={handleLogin} disabled={loading} className="gap-2">
                {loading ? (
                  <>
                    <span
                      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      aria-hidden="true"
                    />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Instagram className="size-5" aria-hidden="true" />
                    Get Started Free
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </motion.div>
            <motion.dl
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
              className="mt-10 grid max-w-md grid-cols-3 gap-6"
            >
              {[
                ['10K+', 'Messages Automated'],
                ['500+', 'Happy Users'],
                ['24/7', 'Automation'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-2xl font-bold">{value}</dd>
                  <dd className="mt-1 text-xs text-muted-foreground">{label}</dd>
                </div>
              ))}
            </motion.dl>
          </div>

          {/* Phone mockup */}
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.2 }}>
            <div className="mx-auto max-w-sm rounded-[2.5rem] border bg-card p-3 shadow-custom">
              <div className="overflow-hidden rounded-[2rem] border bg-background">
                <div className="flex items-center gap-2 border-b px-4 py-3">
                  <div className="bg-brand-gradient size-8 rounded-full" aria-hidden="true" />
                  <span className="text-sm font-semibold">your_brand</span>
                </div>
                <div className="bg-brand-gradient aspect-square w-full opacity-80" aria-hidden="true" />
                <div className="space-y-2 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">follower1:</span> Love this!{' '}
                    <span aria-hidden="true">😍</span>
                  </p>
                  <div className="flex items-start gap-2 rounded-xl bg-muted px-3 py-2">
                    <div>
                      <p className="text-muted-foreground">
                        <span className="font-semibold text-foreground">your_brand:</span> Thank you!
                        Check your DMs <span aria-hidden="true">💌</span>
                      </p>
                    </div>
                    <span className="bg-brand-gradient ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                      AUTO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Powerful Features for Instagram Growth
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to automate your Instagram engagement and build meaningful
              connections with your audience.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: 0.06 * i, ease: 'easeOut' }}
                className="group rounded-2xl border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How It Works</h2>
            <p className="mt-4 text-muted-foreground">
              Get started in minutes with our simple 3-step process
            </p>
          </motion.div>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map(({ title, text }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: 0.08 * i, ease: 'easeOut' }}
                className="relative rounded-2xl border bg-card p-6"
              >
                <span
                  className="bg-brand-gradient mb-4 inline-flex size-9 items-center justify-center rounded-xl font-bold text-white"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            {...fadeUp}
            className="bg-brand-gradient rounded-3xl px-8 py-16 text-center text-white shadow-custom"
          >
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to Automate Your Instagram?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/85">
              Join thousands of creators and businesses who are already growing their Instagram
              presence with automation.
            </p>
            <a
              href={buildInstagramOAuthUrl()}
              onClick={(e) => {
                e.preventDefault()
                handleLogin()
              }}
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-6 font-semibold text-gray-900 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Check className="size-4" aria-hidden="true" />
              Start Free Today
            </a>
            <p className="mt-4 text-sm text-white/75">
              No credit card required • Free forever plan available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
            ReplyPilot
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-foreground">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground">
              Terms
            </a>
          </div>
          <p>© 2026 ReplyPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
