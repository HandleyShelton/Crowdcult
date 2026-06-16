import Link from 'next/link'

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-7xl text-accent mb-4 tracking-wider">OK!</div>
        <h1 className="font-display text-4xl tracking-wider text-white mb-3">YOU&apos;RE SUBSCRIBED</h1>
        <p className="font-mono text-xs text-gray-400 mb-2 leading-relaxed uppercase tracking-wider">
          Welcome to Crowdcult. Your subscription is now active.
        </p>
        <p className="font-mono text-xs text-gray-600 mb-10 leading-relaxed">
          50% of your subscription goes directly to the filmmakers you watch.
          Thank you for supporting independent cinema.
        </p>
        <Link
          href="/browse"
          className="bg-accent hover:bg-accent-hover text-white px-10 py-3 font-mono text-sm uppercase tracking-widest transition-colors"
        >
          START WATCHING →
        </Link>
      </div>
    </div>
  )
}
