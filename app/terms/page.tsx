import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Crowdcult',
}

const UPDATED = 'June 18, 2026'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="border-b border-line pb-4 mb-3">
        <h1 className="font-display text-5xl tracking-[0.04em] text-ink">terms of service</h1>
      </div>
      <p className="font-mono text-xs text-muted mb-12">Last updated: {UPDATED}</p>

      <div className="space-y-10 font-mono text-sm text-gray-400 leading-relaxed">
        <Section n="1" title="Acceptance">
          By creating an account or using Crowdcult (the “Service”), you agree to these Terms. If you
          don’t agree, don’t use the Service.
        </Section>

        <Section n="2" title="The service">
          Crowdcult is a subscription platform for streaming independent films. Filmmakers may submit
          work for review; if accepted and activated, their films stream to subscribers and earn a share
          of revenue based on watch time (see Section 6).
        </Section>

        <Section n="3" title="Accounts">
          You must provide accurate information and keep your login secure. You’re responsible for activity
          under your account. You must be at least 18 years old, or the age of majority where you live, to
          subscribe or receive payouts.
        </Section>

        <Section n="4" title="Subscriptions & billing">
          Subscriptions are billed monthly at the price shown at checkout, through our payment processor
          (Stripe). Your subscription renews automatically until cancelled. You can cancel anytime from your
          account page; cancellation stops future charges and ends access. Except where required by law,
          payments are non-refundable.
        </Section>

        <Section n="5" title="Filmmaker submissions & content">
          You may only submit work you own or have the rights to distribute. By submitting, you grant
          Crowdcult a non-exclusive license to review, host, transcode, display, and stream the work on the
          Service while it is active. You retain ownership of your film. We may decline, remove, or
          deactivate any submission at our discretion, including for legal, quality, or policy reasons.
        </Section>

        <Section n="6" title="Filmmaker payouts">
          For active films, 50% of net subscription revenue (gross revenue minus payment-processing fees)
          is distributed to filmmakers each month, pro rata by share of total watch time. Payouts are made
          through Stripe Connect to filmmakers who have completed onboarding and connected a bank account.
          You are responsible for any taxes on amounts you receive. We may withhold or adjust payouts for
          fraud, chargebacks, or errors.
        </Section>

        <Section n="7" title="Acceptable use">
          Don’t misuse the Service: no unauthorized access, scraping, redistribution of films, attempts to
          circumvent the paywall, or uploading content that is unlawful or infringes others’ rights.
        </Section>

        <Section n="8" title="Termination">
          You may stop using the Service at any time and delete your account from your account page. We may
          suspend or terminate access for violations of these Terms.
        </Section>

        <Section n="9" title="Disclaimers & liability">
          The Service is provided “as is,” without warranties of any kind. To the maximum extent permitted
          by law, Crowdcult is not liable for indirect, incidental, or consequential damages, and our total
          liability is limited to the amount you paid us in the prior 12 months.
        </Section>

        <Section n="10" title="Changes">
          We may update these Terms. Material changes will be reflected by the “last updated” date above.
          Continued use after changes means you accept them.
        </Section>

        <Section n="11" title="Contact">
          Questions about these Terms? Email{' '}
          <a href="mailto:CrowdCult@proton.me" className="text-accent hover:text-ink transition-colors">
            CrowdCult@proton.me
          </a>.
        </Section>
      </div>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-ink text-base mb-2 lowercase tracking-wide">
        <span className="text-accent mr-2">{n}.</span>{title}
      </h2>
      <p>{children}</p>
    </section>
  )
}
