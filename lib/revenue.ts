import { stripe } from '@/lib/stripe'

// Accurate monthly subscription revenue from PAID INVOICES — not raw charges.
// Charges include one-off / test-blueprint payments that aren't subscription
// income; invoices are the canonical record of what subscribers actually paid.
// Returns gross (amount paid), Stripe fees, and net (gross - fees). Payouts use
// NET so filmmakers get 50% of what the platform keeps, matching the about page.
export async function getMonthlyRevenue(
  year: number,
  month1to12: number,
): Promise<{ grossCents: number; feeCents: number; netCents: number }> {
  const gte = Math.floor(Date.UTC(year, month1to12 - 1, 1) / 1000)
  const lt = Math.floor(Date.UTC(year, month1to12, 1) / 1000)

  let grossCents = 0
  let feeCents = 0
  let startingAfter: string | undefined

  try {
    // Paginate paid invoices in the window (cap at 20 pages = 2000 invoices).
    for (let i = 0; i < 20; i++) {
      const page = await stripe.invoices.list({
        status: 'paid',
        created: { gte, lt },
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.charge.balance_transaction'],
      })

      for (const inv of page.data) {
        grossCents += inv.amount_paid ?? 0
        const charge = inv.charge
        if (charge && typeof charge !== 'string') {
          const bt = charge.balance_transaction
          if (bt && typeof bt !== 'string') feeCents += bt.fee ?? 0
        }
      }

      if (!page.has_more || page.data.length === 0) break
      startingAfter = page.data[page.data.length - 1].id
    }
  } catch (err) {
    console.error('getMonthlyRevenue error:', err)
  }

  return { grossCents, feeCents, netCents: grossCents - feeCents }
}
