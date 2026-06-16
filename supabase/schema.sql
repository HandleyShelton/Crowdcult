-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (mirrors Supabase auth.users with extra fields)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_subscribed BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Films table
CREATE TABLE public.films (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  director TEXT NOT NULL,
  director_bio TEXT,
  year INT,
  runtime_minutes INT,
  thumbnail_url TEXT,
  mux_asset_id TEXT,
  mux_playback_id TEXT,
  genre TEXT,
  festival_laurels TEXT,
  status TEXT DEFAULT 'processing', -- 'processing' | 'ready'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch events table
CREATE TABLE public.watch_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  film_id UUID NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  watched_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, film_id)
);

-- Filmmaker payouts table
CREATE TABLE public.filmmaker_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  film_id UUID NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g. "2026-06"
  total_watch_seconds INT DEFAULT 0,
  payout_amount DECIMAL(10, 2) DEFAULT 0,
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(film_id, month)
);

-- Platform settings (for kill switch and other runtime config)
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO public.platform_settings (key, value) VALUES ('platform_enabled', 'true');

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- Revoke public execute access — this function should only fire via the trigger
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.films ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filmmaker_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Users: can only read/write own row
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Films: anyone can read ready films (subscription check is app-level)
CREATE POLICY "Anyone can view ready films" ON public.films
  FOR SELECT USING (status = 'ready');

-- Watch events: users can read/write their own
CREATE POLICY "Users can manage own watch events" ON public.watch_events
  FOR ALL USING (auth.uid() = user_id);

-- Platform settings: readable by all (auth check is app-level)
CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
  FOR SELECT USING (true);

-- Filmmaker payouts: no direct public access — all reads/writes go through
-- admin API routes that use the service role, which bypasses RLS entirely.
CREATE POLICY "No public access to payouts" ON public.filmmaker_payouts
  FOR ALL USING (false);

-- Service role bypasses RLS for admin operations
