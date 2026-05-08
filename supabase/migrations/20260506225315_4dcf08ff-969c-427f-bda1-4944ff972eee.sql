create table public.entries (
  id bigint primary key,
  ts bigint not null,
  day_key text not null,
  parts jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index entries_ts_idx on public.entries (ts desc);
create index entries_day_key_idx on public.entries (day_key);

create table public.app_config (
  id int primary key default 1,
  password_hash text,
  session_secret text not null,
  created_at timestamptz not null default now(),
  constraint app_config_singleton check (id = 1)
);

alter table public.entries enable row level security;
alter table public.app_config enable row level security;

-- Public read of entries (the / feed is public)
create policy "entries are publicly readable"
  on public.entries for select
  to anon, authenticated
  using (true);

-- No client-side writes; all mutations go through server functions using the service role.
-- app_config has no public policies — only the service role can read/write it.