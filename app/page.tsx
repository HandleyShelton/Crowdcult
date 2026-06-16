import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import FilmCard from '@/components/FilmCard'

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
    .limit(6)

  return (
    <div>
      {/* Hero */}
      <section className="scanlines relative min-h-[88vh] flex flex-col items-center justify-center overflow-hidden bg-black">
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#e50914 1px, transparent 1px), linear-gradient(90deg, #e50914 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-block border border-accent text-accent font-mono text-xs px-4 py-1 mb-8 uppercase tracking-widest">
            ★ INDEPENDENT CINEMA PLATFORM ★
          </div>

          {/* Main headline */}
          <h1 className="font-display text-[clamp(4rem,16vw,10rem)] leading-none tracking-wider mb-2 text-white">
            CINEMA<br />
            <span className="text-accent">THAT PAYS</span><br />
            ITS MAKERS
            <span className="cursor" aria-hidden />
          </h1>

          <div className="border-t border-b border-red-900 py-4 my-8 font-mono text-sm text-gray-400 max-w-xl mx-auto">
            50% OF EVERY SUBSCRIPTION → FILMMAKERS &nbsp;|&nbsp; $4.99 / MONTH
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center font-mono">
            {isSubscribed ? (
              <Link
                href="/browse"
                className="bg-accent hover:bg-accent-hover text-white px-10 py-3 text-sm uppercase tracking-widest transition-colors"
              >
                [ BROWSE FILMS ]
              </Link>
            ) : (
              <>
                <Link
                  href="/subscribe"
                  className="bg-accent hover:bg-accent-hover text-white px-10 py-3 text-sm uppercase tracking-widest transition-colors"
                >
                  START WATCHING — $4.99/MO
                </Link>
                <Link
                  href="/about"
                  className="border border-white/30 hover:border-white/70 text-white px-10 py-3 text-sm uppercase tracking-widest transition-colors"
                >
                  LEARN MORE
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom border accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent" />
      </section>

      {/* Featured Films */}
      {films && films.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-baseline justify-between mb-8 border-b border-red-900 pb-3">
            <h2 className="font-display text-4xl tracking-wider text-white">
              {'// FEATURED FILMS'}
            </h2>
            {isSubscribed && (
              <Link href="/browse" className="font-mono text-xs text-accent hover:text-white uppercase tracking-widest transition-colors">
                VIEW ALL »
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {films.map(film => (
              <FilmCard key={film.id} film={film} locked={!isSubscribed} />
            ))}
          </div>
          {!isSubscribed && (
            <div className="text-center mt-10 border border-red-900 p-8 bg-surface">
              <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-4">
                {'// SUBSCRIBER ACCESS REQUIRED'}
              </p>
              <Link
                href="/subscribe"
                className="bg-accent hover:bg-accent-hover text-white px-8 py-3 font-mono text-sm uppercase tracking-widest transition-colors"
              >
                SUBSCRIBE FOR $4.99/MONTH
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Pricing */}
      <section className="bg-surface py-20 border-t border-b border-red-900" id="pricing">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-5xl tracking-wider mb-2 text-white">{'// SIMPLE PRICING'}</h2>
          <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-12">ONE PLAN · UNLIMITED FILMS · CANCEL ANYTIME</p>
          <div className="border border-red-900 p-8 max-w-sm mx-auto bg-black">
            <div className="font-display text-7xl text-accent mb-1">$4.99</div>
            <div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-8">PER MONTH</div>
            <ul className="text-left space-y-3 mb-8">
              {[
                'Unlimited access to all films',
                '50% of your sub goes to filmmakers',
                'New films added regularly',
                'Cancel anytime, no questions asked',
                'Watch on any device',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 font-mono text-xs text-gray-400">
                  <span className="text-accent flex-shrink-0">»</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/subscribe"
              className="block w-full bg-accent hover:bg-accent-hover text-white py-3 font-mono text-sm uppercase tracking-widest transition-colors text-center"
            >
              START WATCHING →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="how-it-works">
        <h2 className="font-display text-5xl tracking-wider text-center mb-2">{'// HOW IT WORKS'}</h2>
        <div className="font-mono text-xs text-gray-600 text-center uppercase tracking-widest mb-14">
          ─────────────────────────────────
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* For Viewers */}
          <div>
            <h3 className="font-mono text-xs text-accent uppercase tracking-widest mb-6 border-b border-red-900 pb-2">
              FOR VIEWERS
            </h3>
            <div className="space-y-8">
              {[
                { step: '01', title: 'Subscribe for $4.99/month', desc: 'Unlimited access to the full catalog of independent films.' },
                { step: '02', title: 'Discover real stories', desc: 'Browse films by genre, director, festival recognition — no algorithm-driven garbage.' },
                { step: '03', title: 'Watch anything, anytime', desc: 'High-quality streaming on any device. Your viewing fairly compensates filmmakers.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="text-accent font-mono text-lg font-bold w-10 flex-shrink-0">{step}</div>
                  <div>
                    <h4 className="font-mono text-sm text-white mb-1 uppercase tracking-wide">{title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed font-mono">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* For Filmmakers */}
          <div>
            <h3 className="font-mono text-xs text-accent uppercase tracking-widest mb-6 border-b border-red-900 pb-2">
              FOR FILMMAKERS
            </h3>
            <div className="space-y-8">
              {[
                { step: '01', title: 'Submit your film', desc: 'Fill out our submission form. We review every film personally.' },
                { step: '02', title: 'We host and stream it', desc: 'We handle all the technical infrastructure — you focus on making films.' },
                { step: '03', title: 'Earn 50% monthly', desc: 'Every month, 50% of net subscription revenue is distributed pro rata by watch time.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="text-accent font-mono text-lg font-bold w-10 flex-shrink-0">{step}</div>
                  <div>
                    <h4 className="font-mono text-sm text-white mb-1 uppercase tracking-wide">{title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed font-mono">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/submit"
                className="inline-block border border-accent text-accent hover:bg-accent hover:text-white px-6 py-3 font-mono text-xs uppercase tracking-widest transition-colors"
              >
                SUBMIT YOUR FILM »
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
