export default function MaintenancePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="font-display text-7xl text-accent mb-4 tracking-wider">!</div>
        <h1 className="font-display text-4xl tracking-wider text-ink mb-3">TEMPORARILY UNAVAILABLE</h1>
        <p className="font-mono text-xs text-gray-400 mb-2 leading-relaxed uppercase tracking-wider">
          Crowdcult is temporarily offline for maintenance. We&apos;ll be back shortly.
        </p>
        <p className="font-mono text-xs text-gray-600 mt-4">
          Questions?{' '}
          <a href="mailto:hello@crowdcult.com" className="text-accent hover:text-ink transition-colors">
            hello@crowdcult.com
          </a>
        </p>
      </div>
    </div>
  )
}
