// Transactional email via Resend's REST API (no SDK dependency).
// Fails soft: if RESEND_API_KEY isn't set it logs and returns false, so email
// is never a hard dependency for the surrounding flow.

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

interface SendArgs {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Crowdcult <onboarding@resend.dev>'

  if (!key) {
    console.log(`[email:stub] to=${to} subject="${subject}" (set RESEND_API_KEY to send)`)
    return false
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      console.error('Resend error', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('Resend send failed', err)
    return false
  }
}

function wrap(heading: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;color:#1a1b26;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="font-size:22px;font-weight:bold;letter-spacing:1px;margin-bottom:16px;">
      <span style="color:#7c5cff;">crowd</span>cult
    </div>
    <div style="background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e5e5ef;">
      <h1 style="font-size:18px;margin:0 0 14px;">${heading}</h1>
      ${bodyHtml}
    </div>
    <p style="font-size:12px;color:#9a9aa8;margin-top:16px;">Crowdcult · independent media · 50% to filmmakers</p>
  </div></body></html>`
}

const P = (text: string) => `<p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#33343f;">${text}</p>`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function submissionReceivedEmail(name: string, title: string) {
  return {
    subject: `We received your film: ${title}`,
    html: wrap('Submission received', [
      P(`Hi ${esc(name)},`),
      P(`Thanks for submitting <strong>${esc(title)}</strong> to Crowdcult. Our team reviews every film personally — we'll be in touch with a decision soon.`),
      P(`You can track its status anytime on your account page.`),
    ].join('')),
  }
}

export function filmApprovedEmail(name: string, title: string) {
  return {
    subject: `Your film was approved: ${title}`,
    html: wrap('Your film was approved', [
      P(`Hi ${esc(name)},`),
      P(`Great news — <strong>${esc(title)}</strong> has been approved for Crowdcult. We'll prepare it for streaming and let you know the moment it goes live.`),
    ].join('')),
  }
}

export function filmRejectedEmail(name: string, title: string, reason: string) {
  return {
    subject: `Update on your submission: ${title}`,
    html: wrap('Submission update', [
      P(`Hi ${esc(name)},`),
      P(`Thank you for submitting <strong>${esc(title)}</strong>. After review, we're not able to add it to the catalog at this time.`),
      P(`<strong>Reason from our team:</strong><br/>${esc(reason)}`),
      P(`We'd welcome future submissions from you.`),
    ].join('')),
  }
}

export function filmActivatedEmail(name: string, title: string, url: string) {
  return {
    subject: `Your film is live: ${title}`,
    html: wrap('Your film is live', [
      P(`Hi ${esc(name)},`),
      P(`<strong>${esc(title)}</strong> is now live and streaming on Crowdcult. From here, your watch time accrues toward your monthly payout.`),
      P(`<a href="${esc(url)}" style="color:#7c5cff;">Watch it on Crowdcult →</a>`),
    ].join('')),
  }
}

export function payoutSentEmail(
  name: string,
  month: string,
  amountUsd: number,
  rows: { title: string; watchMinutes: number; amountUsd: number }[],
) {
  const tableRows = rows
    .map(
      r => `<tr>
        <td style="padding:6px 8px;border-top:1px solid #eee;font-size:13px;">${esc(r.title)}</td>
        <td style="padding:6px 8px;border-top:1px solid #eee;font-size:13px;text-align:right;">${r.watchMinutes} min</td>
        <td style="padding:6px 8px;border-top:1px solid #eee;font-size:13px;text-align:right;">$${r.amountUsd.toFixed(2)}</td>
      </tr>`,
    )
    .join('')
  return {
    subject: `Your Crowdcult payout for ${month}: $${amountUsd.toFixed(2)}`,
    html: wrap('Payout sent', [
      P(`Hi ${esc(name)},`),
      P(`Your payout of <strong>$${amountUsd.toFixed(2)}</strong> for ${esc(month)} is on its way to your connected bank account.`),
      `<table style="width:100%;border-collapse:collapse;margin:8px 0 12px;">
        <thead><tr>
          <th style="text-align:left;font-size:12px;color:#888;padding:0 8px 4px;">Film</th>
          <th style="text-align:right;font-size:12px;color:#888;padding:0 8px 4px;">Watch time</th>
          <th style="text-align:right;font-size:12px;color:#888;padding:0 8px 4px;">Amount</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>`,
      P(`Thank you for being part of Crowdcult.`),
    ].join('')),
  }
}
