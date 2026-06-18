-- Monthly watch-time tracking (run once in the Supabase SQL editor).
-- Attributes watch time to the month it actually happened and keys rows per
-- (user, film, month) so payouts are correctly attributed and a single account
-- can't accumulate watch time across months on one row.

ALTER TABLE public.watch_events ADD COLUMN IF NOT EXISTS month TEXT;

-- Backfill existing rows from their first-watch timestamp.
UPDATE public.watch_events SET month = to_char(created_at, 'YYYY-MM') WHERE month IS NULL;

-- Swap the uniqueness from (user, film) to (user, film, month).
ALTER TABLE public.watch_events DROP CONSTRAINT IF EXISTS watch_events_user_id_film_id_key;
ALTER TABLE public.watch_events
  ADD CONSTRAINT watch_events_user_film_month_key UNIQUE (user_id, film_id, month);

ALTER TABLE public.watch_events ALTER COLUMN month SET NOT NULL;
