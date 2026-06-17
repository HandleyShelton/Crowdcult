import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FilmCard from '@/components/FilmCard'
import Marquee from '@/components/Marquee'

export default async function LandingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let isSubscribed = false
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_subscribed')
      .eq('id', user.id)
      .single()
    isSubscribed = profile?.is_subscribed ?? false
  }

  const { data: films } = await supabase
    .from('films')
    .select('id, title, director, year, runtime_minutes, thumbnail_url, mux_playback_id, genre, festival_laurels')
    .eq('status', 'ready')
    .order('created_at', { ascending: false })
    .limit(isSubscribed ? 18 : 6)

  // Subscribed members land straight in the films.
  if (isSubscribed) {
    return <MemberHome films={films ?? []} />
  }

  return <MarketingHome films={films ?? []} loggedIn={!!user} />
}

/* ---------- Subscribed member view ---------- */

function MemberHome({ films }: { films: FilmRow[] }) {
  return (
    <div>
      <Marquee
        items={['welcome back', 'now streaming', 'independent media', 'support the makers', 'new films weekly']}
        color="text-accent"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="font-display text-4xl sm:text-5xl text-ink">
            <span className="text-muted">~/</span>films<span className="cursor" aria-hidden />
          </h1>
          <Link href="/browse" className="font-mono text-xs text-accent hover:text-ink lowercase tracking-widest transition-colors">
            view all →
          </Link>
        </div>

        {films.length === 0 ? (
          <div className="border border-line rounded-lg bg-surface p-10 text-center">
            <p className="font-mono text-sm text-muted lowercase tracking-widest">{'// no films yet — check back soon'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {films.map(film => <FilmCard key={film.id} film={film} />)}
          </div>
        )}
      </section>

      <Marquee
        items={['drama', 'documentary', 'experimental', 'shorts', 'horror', 'sci-fi', 'comedy']}
        color="text-cyan"
        reverse
        speed={36}
      />
    </div>
  )
}

/* ---------- Marketing / not-subscribed view ---------- */

function MarketingHome({ films, loggedIn }: { films: FilmRow[]; loggedIn: boolean }) {
  return (
    <div>
      <Marquee
        items={['independent media', '50% to filmmakers', 'no algorithms', 'real films', 'real people', '$4.99 / month']}
        color="text-accent"
      />

      {/* Hero */}
      <section className="scanlines relative min-h-[78vh] flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 border border-line bg-surface/60 text-accent font-mono text-xs px-4 py-1.5 mb-8 rounded-full lowercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            independent media platform
          </div>

          <h1 className="font-display text-[clamp(3rem,12vw,7rem)] leading-[0.95] text-ink mb-2">
            media that<br />
            <span className="text-accent">pays its makers</span>
            <span className="cursor" aria-hidden />
          </h1>

          <p className="font-mono text-base sm:text-lg text-ink max-w-xl mx-auto mt-6 lowercase tracking-wide">
            join the cult <span className="text-accent">—</span> support independent media
          </p>

          <p className="font-mono text-xs sm:text-sm text-muted max-w-xl mx-auto mt-3 mb-10 leading-relaxed">
            <span className="text-green">$</span> 50% of every subscription goes straight back to the
            filmmakers. watch films that matter.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center font-mono">
            <Link
              href={loggedIn ? '/subscribe' : '/signup'}
              className="bg-accent hover:bg-accent-hover text-background rounded-md px-10 py-3 text-sm lowercase tracking-widest font-bold transition-colors glow"
            >
              start watching — $4.99/mo
            </Link>
            <Link
              href="/about"
              className="border border-line hover:border-muted text-ink rounded-md px-10 py-3 text-sm lowercase tracking-widest transition-colors"
            >
              learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Featured films (locked) */}
      {films.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="font-display text-3xl sm:text-4xl text-ink mb-8">
            <span className="text-muted">~/</span>featured
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {films.map(film => <FilmCard key={film.id} film={film} locked />)}
          </div>
        </section>
      )}

      <Marquee
        items={['subscribe to unlock', 'cancel anytime', 'watch on any device', 'no ads', 'curated weekly']}
        color="text-cyan"
        reverse
        speed={34}
      />

      {/* Pricing / subscription */}
      <section className="py-20" id="pricing">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl sm:text-5xl text-ink mb-2">simple pricing</h2>
          <p className="font-mono text-xs text-muted lowercase tracking-widest mb-12">
            one plan · unlimited films · cancel anytime
          </p>
          <div className="border border-line rounded-xl bg-surface p-8 max-w-sm mx-auto glow">
            <div className="font-display text-6xl text-accent mb-1">$4.99</div>
            <div className="font-mono text-xs text-muted lowercase tracking-widest mb-8">per month</div>
            <ul className="text-left space-y-3 mb-8">
              {[
                'unlimited access to all films',
                '50% of your sub goes to filmmakers',
                'new films added regularly',
                'cancel anytime, no questions asked',
                'watch on any device',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 font-mono text-xs text-ink/80">
                  <span className="text-green flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href={loggedIn ? '/subscribe' : '/signup'}
              className="block w-full bg-accent hover:bg-accent-hover text-background rounded-md py-3 font-mono text-sm lowercase tracking-widest font-bold transition-colors"
            >
              start watching →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="how-it-works">
        <h2 className="font-display text-4xl sm:text-5xl text-ink text-center mb-14">how it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <HowColumn
            title="for viewers"
            color="text-cyan"
            steps={[
              { n: '01', t: 'subscribe for $4.99/month', d: 'unlimited access to the full catalog of independent films.' },
              { n: '02', t: 'discover real stories', d: 'browse by genre, director, festival recognition — no algorithm-driven garbage.' },
              { n: '03', t: 'watch anything, anytime', d: 'high-quality streaming on any device. your viewing fairly compensates filmmakers.' },
            ]}
          />
          <HowColumn
            title="for filmmakers"
            color="text-pink"
            cta
            steps={[
              { n: '01', t: 'submit your film', d: 'fill out our submission form. we review every film personally.' },
              { n: '02', t: 'we host and stream it', d: 'we handle all the technical infrastructure — you focus on making films.' },
              { n: '03', t: 'earn 50% monthly', d: '50% of net subscription revenue is distributed pro rata by watch time.' },
            ]}
          />
        </div>
      </section>

      <Marquee
        items={['crowdcult', 'independent media', 'made with care', 'for the love of film']}
        color="text-accent"
      />
    </div>
  )
}

function HowColumn({
  title, color, steps, cta,
}: {
  title: string
  color: string
  steps: { n: string; t: string; d: string }[]
  cta?: boolean
}) {
  return (
    <div>
      <h3 className={`font-mono text-xs uppercase tracking-[0.25em] mb-6 border-b border-line pb-2 ${color}`}>
        {title}
      </h3>
      <div className="space-y-7">
        {steps.map(({ n, t, d }) => (
          <div key={n} className="flex gap-4">
            <div className={`font-display text-2xl w-10 flex-shrink-0 ${color}`}>{n}</div>
            <div>
              <h4 className="font-mono text-sm text-ink mb-1 lowercase tracking-wide">{t}</h4>
              <p className="text-muted text-xs leading-relaxed font-mono">{d}</p>
            </div>
          </div>
        ))}
      </div>
      {cta && (
        <div className="mt-8">
          <Link
            href="/submit"
            className="inline-block border border-pink/40 text-pink hover:bg-pink hover:text-background rounded-md px-6 py-3 font-mono text-xs lowercase tracking-widest transition-colors"
          >
            submit your film →
          </Link>
        </div>
      )}
    </div>
  )
}

interface FilmRow {
  id: string
  title: string
  director: string
  year: number
  runtime_minutes: number
  thumbnail_url: string | null
  mux_playback_id: string | null
  genre: string | null
  festival_laurels: string | null
}
