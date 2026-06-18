import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Crowdcult',
}

const UPDATED = 'June 18, 2026'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="border-b border-line pb-4 mb-3">
        <h1 className="font-display text-5xl tracking-[0.04em] text-ink">privacy policy</h1>
      </div>
      <p className="font-mono text-xs text-muted mb-12">Last updated: {UPDATED}</p>

      <div className="space-y-10 font-mono text-sm text-gray-400 leading-relaxed">
        <Section n="1" title="What we collect">
          <ul className="space-y-1.5 mt-2">
            <Li><strong className="text-ink">Account info</strong> — your email, and for filmmakers, your name and contact email.</Li>
            <Li><strong className="text-ink">Viewing activity</strong> — which films you watch and for how long, used to operate the service and calculate filmmaker payouts.</Li>
            <Li><strong className="text-ink">Payment info</strong> — handled by Stripe. We never see or store your full card or bank details.</Li>
            <Li><strong className="text-ink">Filmmaker payout info</strong> — identity and bank details are collected directly by Stripe Connect during onboarding.</Li>
          </ul>
        </Section>

        <Section n="2" title="How we use it">
          To provide and secure the Service, process subscriptions, calculate and send filmmaker payouts,
          send transactional emails (e.g. submission and payout notifications), and comply with the law.
        </Section>

        <Section n="3" title="Service providers we share with">
          We use trusted third parties to run Crowdcult, and share only what’s needed:
          <ul className="space-y-1.5 mt-2">
            <Li><strong className="text-ink">Stripe</strong> — payments and filmmaker payouts.</Li>
            <Li><strong className="text-ink">Supabase</strong> — authentication and database.</Li>
            <Li><strong className="text-ink">Mux</strong> — video hosting and streaming.</Li>
            <Li><strong className="text-ink">Vercel</strong> — application hosting.</Li>
            <Li><strong className="text-ink">Resend</strong> — transactional email delivery.</Li>
          </ul>
          We do not sell your personal information.
        </Section>

        <Section n="4" title="Cookies">
          We use essential cookies to keep you signed in. We don’t use advertising trackers.
        </Section>

        <Section n="5" title="Data retention & deletion">
          We keep your data while your account is active. You can delete your account anytime from your
          account page, which removes your profile and associated data; some records may be retained where
          required for legal, tax, or accounting purposes.
        </Section>

        <Section n="6" title="Your rights">
          Depending on where you live, you may have rights to access, correct, or delete your personal data.
          Contact us to make a request.
        </Section>

        <Section n="7" title="Children">
          Crowdcult is not directed to children under 13, and you must be 18 or older to subscribe or
          receive payouts.
        </Section>

        <Section n="8" title="Changes">
          We may update this policy; the “last updated” date above reflects the latest version.
        </Section>

        <Section n="9" title="Contact">
          Privacy questions or requests? Email{' '}
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
      <div>{children}</div>
    </section>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-accent flex-shrink-0">»</span>
      <span>{children}</span>
    </li>
  )
}
