-- Filmmaker account system + payouts overhaul (ADDITIVE — safe to run once).
-- Run this in the Supabase SQL editor.

-- 1. users: filmmaker flag, profile, and Stripe Connect linkage.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_filmmaker BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS connect_payouts_enabled BOOLEAN DEFAULT FALSE;

-- 2. film_submissions: link to the filmmaker account + extra review fields.
ALTER TABLE public.film_submissions
  ADD COLUMN IF NOT EXISTS filmmaker_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS co_directors TEXT,
  ADD COLUMN IF NOT EXISTS content_warnings TEXT,
  ADD COLUMN IF NOT EXISTS poster_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS film_id UUID REFERENCES public.films(id) ON DELETE SET NULL;

-- 3. films: link to filmmaker + originating submission + activation flag.
ALTER TABLE public.films
  ADD COLUMN IF NOT EXISTS filmmaker_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES public.film_submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- 4. Backfill: keep the CURRENT live catalog visible (new flag defaults false).
UPDATE public.films SET is_active = TRUE WHERE status = 'ready';

-- 5. Gate the public films read policy on activation as well as readiness.
DROP POLICY IF EXISTS "Anyone can view ready films" ON public.films;
CREATE POLICY "Anyone can view ready films" ON public.films
  FOR SELECT USING (status = 'ready' AND is_active = TRUE);
