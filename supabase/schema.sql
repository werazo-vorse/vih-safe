create extension if not exists "pgcrypto";

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  risk_level text not null,
  risk_score integer not null,
  age_range text not null,
  answers jsonb not null,
  domain_scores jsonb not null,
  factors jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_completions (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  score integer not null,
  total integer not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists assessments_created_at_idx
  on public.assessments (created_at desc);

create index if not exists assessments_risk_level_idx
  on public.assessments (risk_level);

create index if not exists chat_messages_created_at_idx
  on public.chat_messages (created_at desc);

create index if not exists quiz_completions_created_at_idx
  on public.quiz_completions (created_at desc);

create or replace function public.risk_distribution()
returns table(level text, count bigint)
language sql
stable
as $$
  select risk_level as level, count(*)::bigint as count
  from public.assessments
  group by risk_level
  order by risk_level;
$$;

alter table public.assessments enable row level security;
alter table public.chat_messages enable row level security;
alter table public.quiz_completions enable row level security;
