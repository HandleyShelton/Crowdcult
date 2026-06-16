export default function SubmitPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Submit Your Film</h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">
          We&apos;re looking for independent films with a strong point of view. Every submission is reviewed by a human being.
        </p>
      </div>

      {/* Revenue share explainer */}
      <div className="bg-accent/10 border border-accent/20 rounded-2xl p-8 mb-10">
        <h2 className="text-xl font-bold mb-4 text-accent">How Revenue Share Works</h2>
        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            <strong className="text-white">50% of net subscription revenue</strong> is distributed to filmmakers every month.
            Net revenue = gross subscription revenue minus payment processing fees (typically ~3%).
          </p>
          <p>
            Your share is calculated <strong className="text-white">pro rata by watch time</strong>: if your film accounts for 20% of all minutes watched that month, you receive 20% of the filmmaker pool.
          </p>
          <p>
            Payments are issued on the <strong className="text-white">15th of each month</strong> for the prior month&apos;s watch data, via bank transfer or PayPal (your choice at onboarding).
          </p>
          <div className="bg-surface-2 rounded-lg p-4 mt-4 font-mono text-xs">
            <div className="text-gray-500 mb-2">Example calculation:</div>
            <div>Monthly subscribers: 200 × $4.99 = $998.00 gross</div>
            <div>Processing fees (3%): −$29.94</div>
            <div>Net revenue: $968.06</div>
            <div>Filmmaker pool (50%): <span className="text-accent">$484.03</span></div>
            <div className="mt-2">Your film watch share: 15%</div>
            <div>Your payout: <span className="text-green-400">$72.60</span></div>
          </div>
        </div>
      </div>

      {/* Tally embed placeholder */}
      <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Film Submission Form</h2>
          <p className="text-gray-400 text-sm mt-1">
            Tell us about your film. We review every submission within 2–4 weeks.
          </p>
        </div>
        {/*
          REPLACE THIS DIV WITH YOUR TALLY EMBED CODE:
          <iframe src="https://tally.so/embed/YOUR_FORM_ID" width="100%" height="800" frameBorder="0" title="Film submission" />
        */}
        <div className="p-8 text-center text-gray-500">
          <div className="bg-surface-2 rounded-xl p-12 border border-dashed border-white/20">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="font-medium text-gray-400 mb-2">Tally Form Embed Placeholder</p>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Replace this section in <code className="text-gray-500">app/submit/page.tsx</code> with your Tally embed iframe.
              Create your form at <strong className="text-gray-500">tally.so</strong> and copy the embed code.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500 text-center">
        Questions? Email us at{' '}
        <a href="mailto:films@crowdcult.com" className="text-accent hover:text-accent-hover">
          films@crowdcult.com
        </a>
      </div>
    </div>
  )
}
