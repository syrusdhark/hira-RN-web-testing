-- Optional: AI usage logging for production API (tokens, cost).
-- Run this migration if you use cost monitoring (Phase 4).

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tokens_used int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  provider text not null check (provider in ('anthropic', 'openrouter')),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_logs_user_id_created_at
  on public.ai_usage_logs (user_id, created_at);

alter table public.ai_usage_logs enable row level security;

create policy "Users can read own ai_usage_logs"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Service role can insert ai_usage_logs"
  on public.ai_usage_logs for insert
  with check (auth.uid() = user_id);
