import Link from 'next/link'
import Marquee from '@/components/Marquee'

export default function Footer() {
  return (
    <footer className="mt-16">
      <Marquee
        items={['crowdcult', 'independent media', '50% to filmmakers', 'real films', 'real people', 'no algorithms']}
        color="text-accent"
        speed={32}
      />

      <div className="bg-background border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green/80" />
                </span>
                <span className="font-display text-2xl tracking-wide">
                  <span className="text-accent">crowd</span><span className="text-ink">cult</span>
                </span>
              </div>
              <p className="text-muted text-xs leading-relaxed font-mono">
                independent media for people who believe storytelling matters.
                50% of every subscription goes directly to the filmmakers.
              </p>
            </div>

            <div>
              <h3 className="text-ink font-mono text-xs lowercase tracking-widest mb-4 border-b border-line pb-2">~/platform</h3>
              <div className="flex flex-col gap-2 text-xs font-mono text-muted">
                <FooterLink href="/browse">browse films</FooterLink>
                <FooterLink href="/subscribe">subscribe</FooterLink>
                <FooterLink href="/about">about us</FooterLink>
              </div>
            </div>

            <div>
              <h3 className="text-ink font-mono text-xs lowercase tracking-widest mb-4 border-b border-line pb-2">~/filmmakers</h3>
              <div className="flex flex-col gap-2 text-xs font-mono text-muted">
                <FooterLink href="/submit">submit your film</FooterLink>
                <FooterLink href="/about#revenue-share">revenue share model</FooterLink>
                <a href="mailto:CrowdCult@proton.me" className="hover:text-ink transition-colors">contact us</a>
              </div>
            </div>
          </div>

          <div className="border-t border-line mt-8 pt-6 text-xs font-mono text-muted/70 flex flex-col sm:flex-row justify-between gap-2 lowercase tracking-wide">
            <span>© {new Date().getFullYear()} crowdcult. all rights reserved.</span>
            <span className="text-accent/60">built for independent media<span className="cursor" aria-hidden /></span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-ink transition-colors">
      {children}
    </Link>
  )
}
