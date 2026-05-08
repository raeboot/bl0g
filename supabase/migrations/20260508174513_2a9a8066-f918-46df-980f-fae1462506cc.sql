
CREATE TABLE public.app_config (
  id integer PRIMARY KEY,
  password_hash text,
  session_secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.entries (
  id bigint PRIMARY KEY,
  ts bigint NOT NULL,
  day_key text NOT NULL,
  parts jsonb NOT NULL DEFAULT '[]'::jsonb,
  tag_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX entries_ts_idx ON public.entries (ts DESC);
CREATE INDEX entries_day_key_idx ON public.entries (day_key);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Allow public read of entries (the feed is public)
CREATE POLICY "entries_public_read" ON public.entries FOR SELECT USING (true);
