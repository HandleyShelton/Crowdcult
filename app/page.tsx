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
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a0000] opacity-90"
          aria-hidden
        />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #e50914 0, #e50914 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} aria-hidden />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block bg-accent/20 border border-accent/30 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            Independent Cinema Platform
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Cinema that<br />
            <span className="text-accent">pays its makers.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Independent cinema. Real filmmakers. <strong className="text-white">50% goes back to the artists.</strong>
            <br />Watch films that matter. Support the people who made them.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isSubscribed ? (
              <Link
                href="/browse"
                className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                Browse Films
              </Link>
            ) : (
              <>
                <Link
                  href="/subscribe"
                  className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Start Watching — $4.99/mo
                </Link>
                <Link
                  href="/about"
                  className="border border-white/30 hover:border-white/60 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Films Preview */}
      {films && films.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Films</h2>
            {isSubscribed && (
              <Link href="/browse" className="text-accent hover:text-accent-hover text-sm font-medium">
                View All →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {films.map(film => (
              <FilmCard key={film.id} film={film} locked={!isSubscribed} />
            ))}
          </div>
          {!isSubscribed && (
            <div className="text-center mt-8">
              <p className="text-gray-400 mb-4">Subscribe to unlock all films</p>
              <Link
                href="/subscribe"
                className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Subscribe for $4.99/month
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Pricing Section */}
      <section className="bg-surface py-20" id="pricing">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Simple, honest pricing</h2>
          <p className="text-gray-400 mb-12 text-lg">One plan. Unlimited films. Cancel anytime.</p>
          <div className="bg-surface-2 border border-white/10 rounded-2xl p-8 max-w-sm mx-auto">
            <div className="text-5xl font-bold mb-1">$4.99</div>
            <div className="text-gray-400 mb-6">per month</div>
            <ul className="text-left space-y-3 mb-8 text-sm">
              {[
                'Unlimited access to all films',
                '50% of your subscription goes to filmmakers',
                'New films added regularly',
                'Cancel anytime, no questions asked',
                'Watch on any device',
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-gray-300">
                  <svg className="w-5 h-5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/subscribe"
              className="block w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg font-semibold transition-colors text-center"
            >
              Start Watching
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20" id="how-it-works">
        <h2 className="text-4xl font-bold text-center mb-16">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* For Viewers */}
          <div>
            <h3 className="text-xl font-bold text-accent mb-6 uppercase tracking-wider text-sm">For Viewers</h3>
            <div className="space-y-8">
              {[
                { step: '01', title: 'Subscribe for $4.99/month', desc: 'Unlimited access to the full catalog of independent films.' },
                { step: '02', title: 'Discover real stories', desc: 'Browse films by genre, director, festival recognition — no algorithm-driven garbage.' },
                { step: '03', title: 'Watch anything, anytime', desc: 'High-quality streaming on any device. Your viewing is tracked to fairly compensate filmmakers.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="text-accent font-mono text-sm font-bold w-8 flex-shrink-0 pt-1">{step}</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* For Filmmakers */}
          <div>
            <h3 className="text-xl font-bold text-accent mb-6 uppercase tracking-wider text-sm">For Filmmakers</h3>
            <div className="space-y-8">
              {[
                { step: '01', title: 'Submit your film', desc: 'Fill out our submission form. We review every film personally.' },
                { step: '02', title: 'We host and stream it', desc: 'We handle all the technical infrastructure — you focus on making films.' },
                { step: '03', title: 'Earn 50% monthly', desc: 'Every month, 50% of net subscription revenue is distributed pro rata by watch time across all films.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="text-accent font-mono text-sm font-bold w-8 flex-shrink-0 pt-1">{step}</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href="/submit"
                className="inline-block border border-accent text-accent hover:bg-accent hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Submit Your Film →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
