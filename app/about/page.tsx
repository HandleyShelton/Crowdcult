export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="border-b border-line pb-4 mb-12">
        <h1 className="font-display text-6xl tracking-wider text-ink">ABOUT CROWDCULT</h1>
      </div>

      <div className="space-y-14 font-mono text-gray-400 leading-relaxed">
        <section>
          <h2 className="font-display text-3xl tracking-wider text-ink mb-4">OUR MISSION</h2>
          <p className="text-sm mb-4">
            Crowdcult exists because independent filmmakers deserve a fair deal. Streaming has transformed how people watch movies, but for independent artists, the financial reality is brutal — algorithmically-determined placement, pennies per stream, and zero relationship with their audience.
          </p>
          <p className="text-sm">
            We built a different model: a small, curated platform where every subscription dollar is explicitly tied to the artists who made the work you love. 50% of net revenue goes back to filmmakers every month, distributed pro rata by watch time.
          </p>
        </section>

        <section id="revenue-share">
          <h2 className="font-display text-3xl tracking-wider text-ink mb-6">HOW FILMMAKER PAYMENTS WORK</h2>
          <div className="space-y-4">
            {[
              { n: '01', title: 'The filmmaker pool', body: 'Every month we take 50% of net subscription revenue (gross revenue minus Stripe processing fees of ~3%) and set it aside as the filmmaker payment pool.' },
              { n: '02', title: 'Pro rata by watch time', body: 'We measure how many seconds each film was watched that month. A film with 20% of total watch time gets 20% of the filmmaker pool. This rewards films that audiences actually spend time with, not just start.' },
              { n: '03', title: 'Monthly payments', body: "Payments go out on the 15th of each month for the prior month's activity. Filmmakers can track their watch time and projected earnings in their filmmaker dashboard." },
            ].map(({ n, title, body }) => (
              <div key={n} className="border border-line bg-surface p-6 flex gap-4">
                <span className="text-accent font-display text-3xl leading-none flex-shrink-0">{n}</span>
                <div>
                  <h3 className="text-ink text-sm uppercase tracking-wider mb-2">{title}</h3>
                  <p className="text-xs leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl tracking-wider text-ink mb-4">WHAT WE CURATE</h2>
          <p className="text-sm mb-4">
            We review every film submission personally. We&apos;re looking for films with a strong directorial voice, something to say, and production quality that respects the audience&apos;s time. We don&apos;t require festival credentials, but we do require craft.
          </p>
          <p className="text-sm">
            Feature films, shorts, documentaries, and experimental work are all considered.
          </p>
        </section>

        <section>
          <h2 className="font-display text-3xl tracking-wider text-ink mb-4">CONTACT</h2>
          <div className="space-y-2 text-xs">
            <p>General inquiries, submissions, and filmmaker support:</p>
            <p>» <a href="mailto:CrowdCult@proton.me" className="text-accent hover:text-ink transition-colors">CrowdCult@proton.me</a></p>
          </div>
        </section>
      </div>
    </div>
  )
}
