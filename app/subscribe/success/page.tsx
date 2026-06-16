import Link from 'next/link'

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">You&apos;re subscribed!</h1>
        <p className="text-gray-400 mb-2 leading-relaxed">
          Welcome to Crowdcult. Your subscription is now active.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          50% of your subscription will go directly to the filmmakers you watch. Thank you for supporting independent cinema.
        </p>
        <Link
          href="/browse"
          className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Start Watching
        </Link>
      </div>
    </div>
  )
}
