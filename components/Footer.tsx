import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black border-t-[3px] border-accent mt-16">
      {/* Marquee strip */}
      <div className="border-b border-red-900 overflow-hidden py-1.5 bg-accent/5">
        <div className="marquee-inner text-xs font-mono text-red-700 tracking-widest select-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="mx-8">★ CROWDCULT ★ INDEPENDENT CINEMA ★ 50% TO FILMMAKERS ★ REAL FILMS ★ REAL PEOPLE</span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-display text-4xl mb-3 tracking-wider">
              <span className="text-accent">CROWD</span><span className="text-white">CULT</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed font-mono">
              Independent cinema for people who believe storytelling matters.<br />
              50% of every subscription goes directly to the filmmakers.
            </p>
          </div>

          <div>
            <h3 className="text-white font-mono text-xs uppercase tracking-widest mb-4 border-b border-red-900 pb-2">{'// PLATFORM'}</h3>
            <div className="flex flex-col gap-2 text-xs font-mono text-gray-500">
              <FooterLink href="/browse">» Browse Films</FooterLink>
              <FooterLink href="/subscribe">» Subscribe</FooterLink>
              <FooterLink href="/about">» About Us</FooterLink>
            </div>
          </div>

          <div>
            <h3 className="text-white font-mono text-xs uppercase tracking-widest mb-4 border-b border-red-900 pb-2">{'// FILMMAKERS'}</h3>
            <div className="flex flex-col gap-2 text-xs font-mono text-gray-500">
              <FooterLink href="/submit">» Submit Your Film</FooterLink>
              <FooterLink href="/about#revenue-share">» Revenue Share Model</FooterLink>
              <a href="mailto:hello@crowdcult.com" className="hover:text-white transition-colors">» Contact Us</a>
            </div>
          </div>
        </div>

        <div className="border-t border-red-900/50 mt-8 pt-6 text-xs font-mono text-gray-700 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} CROWDCULT. ALL RIGHTS RESERVED.</span>
          <span className="text-red-900">BUILT FOR INDEPENDENT CINEMA_</span>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="hover:text-white transition-colors">
      {children}
    </Link>
  )
}
