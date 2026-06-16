export default function MaintenancePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-3">Temporarily Unavailable</h1>
        <p className="text-gray-400 mb-2 leading-relaxed">
          Crowdcult is temporarily offline for maintenance. We&apos;ll be back shortly.
        </p>
        <p className="text-gray-500 text-sm">
          If you have questions, email us at{' '}
          <a href="mailto:hello@crowdcult.com" className="text-accent">hello@crowdcult.com</a>
        </p>
      </div>
    </div>
  )
}
