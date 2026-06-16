# Crowdcult — Setup Guide

Complete setup guide for running Crowdcult locally and deploying to production.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Stripe](https://stripe.com) account
- A [Mux](https://mux.com) account
- A [Vercel](https://vercel.com) account (for deployment)
- Stripe CLI (for local webhook testing)

---

## Step 1 — Clone and install

```bash
cd crowdcult
npm install
cp .env.local.example .env.local
```

---

## Step 2 — Supabase project + schema

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Name it `crowdcult`, choose a region, set a database password
3. Wait for provisioning (~2 minutes)
4. In the Supabase dashboard, go to **SQL Editor**
5. Paste the contents of `supabase/schema.sql` and click **Run**
6. Go to **Settings → API**
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`
7. Go to **Storage → New bucket**
   - Create a bucket named `film-assets`
   - Set it to **Public** (so poster images are publicly accessible)

Paste these into your `.env.local`.

---

## Step 3 — Stripe product and price

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Products → Add product**
2. Name: `Crowdcult Monthly`
3. Pricing: **Recurring**, `$4.99`, **Monthly**
4. Click **Save product**
5. Copy the **Price ID** (starts with `price_...`) → `STRIPE_PRICE_ID`
6. Go to **Developers → API keys**
   - Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Copy **Secret key** → `STRIPE_SECRET_KEY`

---

## Step 4 — Mux API keys

1. Go to [dashboard.mux.com](https://dashboard.mux.com) → **Settings → API Access Tokens**
2. Click **Generate new token**
   - Mux Video: **Full Access**
   - Mux Data: **Read**
3. Copy **Token ID** → `MUX_TOKEN_ID`
4. Copy **Token Secret** → `MUX_TOKEN_SECRET`

### Mux Signing Keys (for signed playback)

1. In Mux Dashboard → **Settings → Signing Keys**
2. Click **Generate new key pair**
3. Download the private key (PEM file)
4. Copy the **Key ID** → `MUX_SIGNING_KEY_ID`
5. Base64-encode the private key:
   ```bash
   base64 -i private-key.pem | tr -d '\n'
   ```
   Paste the result → `MUX_SIGNING_PRIVATE_KEY`

---

## Step 5 — Stripe webhook (local development)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (scoop)
scoop install stripe

stripe login
```

In a separate terminal, start the webhook listener:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the **webhook signing secret** (starts with `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

---

## Step 6 — Mux webhook (local development)

Mux webhooks need a public URL. Use [ngrok](https://ngrok.com) or [localtunnel](https://localtunnel.me):

```bash
npx localtunnel --port 3000
# or
ngrok http 3000
```

1. Copy the public URL (e.g. `https://abc123.ngrok.io`)
2. Go to Mux Dashboard → **Settings → Webhooks → Add webhook endpoint**
3. URL: `https://your-tunnel-url.ngrok.io/api/webhooks/mux`
4. Events to subscribe: **video.asset.ready**
5. Copy the **Signing Secret** → `MUX_WEBHOOK_SECRET`

---

## Step 7 — Set admin email

In `.env.local`:

```
ADMIN_EMAIL=your@email.com
```

You can add multiple admins:

```
ADMIN_EMAIL=admin1@example.com,admin2@example.com
```

---

## Step 8 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Sign up with the admin email address — you'll have access to `/admin`.

---

## Step 9 — First film upload (end to end)

1. Log in as admin → go to `/admin`
2. Click the **Upload** tab
3. Fill in all the film details
4. Select a video file (MP4/MOV/MKV)
5. Optionally upload a custom poster image
6. Click **Upload Film**
7. The video uploads directly to Mux (progress bar shows)
8. Mux processes the video — this takes 1–5 minutes depending on length
9. When done, Mux fires the `video.asset.ready` webhook
10. Your local Mux webhook listener (via ngrok/localtunnel) receives it
11. The film record in Supabase updates with `status: 'ready'` and the Mux playback ID
12. The film now appears in `/browse` for subscribers

---

## Step 10 — Deploy to Vercel

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Framework: **Next.js** (auto-detected)
4. Add all environment variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` ← update this after step below
   - `STRIPE_PRICE_ID`
   - `MUX_TOKEN_ID`
   - `MUX_TOKEN_SECRET`
   - `MUX_SIGNING_KEY_ID`
   - `MUX_SIGNING_PRIVATE_KEY`
   - `MUX_WEBHOOK_SECRET` ← update this after step below
   - `NEXT_PUBLIC_APP_URL` ← set to your Vercel URL (e.g. `https://crowdcult.vercel.app`)
   - `ADMIN_EMAIL`
5. Deploy

### Update Stripe webhook for production

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
3. Events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the new **Signing Secret** → update `STRIPE_WEBHOOK_SECRET` in Vercel env vars
5. Redeploy

### Update Mux webhook for production

1. Mux Dashboard → **Settings → Webhooks → Edit** your existing webhook (or add new)
2. URL: `https://your-vercel-url.vercel.app/api/webhooks/mux`
3. Copy new **Signing Secret** → update `MUX_WEBHOOK_SECRET` in Vercel env vars

---

## Supabase Auth Email Configuration

For production, configure Supabase Auth email templates:

1. Supabase Dashboard → **Authentication → Email Templates**
2. Update the **Confirm signup** template with your branding
3. Under **Authentication → URL Configuration**, add your Vercel URL to **Redirect URLs**

---

## Tally Form (Filmmaker Submissions)

1. Create an account at [tally.so](https://tally.so)
2. Create a new form with fields: Film title, Director name, Contact email, Film description, Vimeo/Drive link, Genre, Runtime, Festival history
3. Click **Share → Embed** and copy the iframe code
4. Replace the placeholder `<div>` in `app/submit/page.tsx` with the Tally embed:
   ```tsx
   <iframe
     src="https://tally.so/embed/YOUR_FORM_ID"
     width="100%"
     height="800"
     frameBorder="0"
     title="Film submission"
   />
   ```

---

## Architecture Notes

- **Video storage**: Mux (not Supabase) — videos are uploaded directly from the browser to Mux
- **Poster images**: Supabase Storage (`film-assets` bucket)
- **Auth**: Supabase Auth (email/password)
- **Subscriptions**: Stripe Checkout + webhooks update `users.is_subscribed`
- **Watch tracking**: Every 30s the player reports elapsed watch time to `/api/watch-event`
- **Payout calculation**: Done on-demand in `/api/admin/payouts` using live watch_events data
- **Kill switch**: Stored in `platform_settings` table, checked server-side on page load
- **Signed playback**: Mux playback tokens are signed server-side using RSA private key; 1-hour TTL

---

## Mux Free Tier Limits

| Resource | Free Tier Limit |
|---|---|
| Stored assets | 10 videos |
| Delivery minutes | 100,000 min/month |
| Storage minutes | 200 hours |

The admin Usage tab shows estimated delivery minutes (calculated from watch_events) and warns at 80% / hard-stops at 90k minutes if the toggle is enabled.
