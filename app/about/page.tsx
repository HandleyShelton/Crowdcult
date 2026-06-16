export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">About Crowdcult</h1>

      <div className="space-y-12 text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="mb-4">
            Crowdcult exists because independent filmmakers deserve a fair deal. Streaming has transformed how people watch movies, but for independent artists, the financial reality is brutal — algorithmically-determined placement, pennies per stream, and zero relationship with their audience.
          </p>
          <p>
            We built a different model: a small, curated platform where every subscription dollar is explicitly tied to the artists who made the work you love. 50% of net revenue goes back to filmmakers every month, distributed pro rata by watch time.
          </p>
        </section>

        <section id="revenue-share">
          <h2 className="text-2xl font-bold text-white mb-4">How Filmmaker Payments Work</h2>
          <div className="space-y-4">
            <div className="bg-surface rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-2">1. The filmmaker pool</h3>
              <p className="text-sm">
                Every month we take 50% of net subscription revenue (gross revenue minus Stripe processing fees of ~3%) and set it aside as the filmmaker payment pool.
              </p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-2">2. Pro rata by watch time</h3>
              <p className="text-sm">
                We measure how many seconds each film was watched that month. A film with 20% of total watch time gets 20% of the filmmaker pool. This rewards films that audiences actually spend time with, not just start.
              </p>
            </div>
            <div className="bg-surface rounded-xl p-6 border border-white/10">
              <h3 className="font-semibold text-white mb-2">3. Monthly payments</h3>
              <p className="text-sm">
                Payments go out on the 15th of each month for the prior month&apos;s activity. Filmmakers can track their watch time and projected earnings in their filmmaker dashboard.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">What We Curate</h2>
          <p className="mb-4">
            We review every film submission personally. We&apos;re looking for films with a strong directorial voice, something to say, and production quality that respects the audience&apos;s time. We don&apos;t require festival credentials, but we do require craft.
          </p>
          <p>
            Feature films, shorts, documentaries, and experimental work are all considered.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
          <div className="space-y-2 text-sm">
            <p>General inquiries: <a href="mailto:hello@crowdcult.com" className="text-accent hover:text-accent-hover">hello@crowdcult.com</a></p>
            <p>Film submissions: <a href="mailto:films@crowdcult.com" className="text-accent hover:text-accent-hover">films@crowdcult.com</a></p>
            <p>Filmmaker support: <a href="mailto:filmmakers@crowdcult.com" className="text-accent hover:text-accent-hover">filmmakers@crowdcult.com</a></p>
          </div>
        </section>
      </div>
    </div>
  )
}
