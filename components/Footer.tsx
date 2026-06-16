import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-white/10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-2xl font-bold mb-3">
              <span className="text-accent">Crowd</span>cult
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Independent cinema for people who believe storytelling matters. 50% of every subscription goes directly back to the filmmakers.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Platform</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link href="/browse" className="hover:text-white transition-colors">Browse Films</Link>
              <Link href="/subscribe" className="hover:text-white transition-colors">Subscribe</Link>
              <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Filmmakers</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-400">
              <Link href="/submit" className="hover:text-white transition-colors">Submit Your Film</Link>
              <Link href="/about#revenue-share" className="hover:text-white transition-colors">Revenue Share Model</Link>
              <a href="mailto:hello@crowdcult.com" className="hover:text-white transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-sm text-gray-600 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Crowdcult. All rights reserved.</span>
          <span>Built for independent cinema.</span>
        </div>
      </div>
    </footer>
  )
}
