create extension if not exists pgcrypto;

create table if not exists public.survey_sessions (
  id uuid primary key default gen_random_uuid(),
  persona text not null check (persona in ('practitioner', 'leader', 'security')),
  survey_version text not null,
  scoring_version text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.survey_sessions(id) on delete cascade,
  question_id text not null,
  answer_json jsonb not null,
  numeric_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_results (
  session_id uuid primary key references public.survey_sessions(id) on delete cascade,
  total_score integer not null check (total_score between 0 and 100),
  dimension_scores_json jsonb not null,
  risk_flags_json jsonb not null,
  result_band text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.survey_sessions(id) on delete cascade,
  encrypted_email text not null,
  optional_company text,
  request_type text not null check (request_type in ('beta', 'interview', 'pilot')),
  preferred_contact_purpose text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.survey_sessions(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  consent_text_hash text not null,
  accepted boolean not null,
  accepted_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.survey_sessions(id) on delete set null,
  event_name text not null,
  persona text,
  survey_version text,
  non_sensitive_properties_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.deletion_audit_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid,
  request_type text not null,
  deleted_table text not null,
  deleted_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limit_keys (
  key_hash text primary key,
  request_count integer not null default 1,
  window_started_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.idempotency_keys (
  idempotency_key text primary key,
  session_id uuid not null references public.survey_sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists survey_sessions_completed_at_idx on public.survey_sessions (completed_at desc);
create index if not exists survey_sessions_expires_at_idx on public.survey_sessions (expires_at);
create index if not exists survey_answers_session_id_idx on public.survey_answers (session_id);
create index if not exists contact_requests_expires_at_idx on public.contact_requests (expires_at);
create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);

alter table public.survey_sessions enable row level security;
alter table public.survey_answers enable row level security;
alter table public.survey_results enable row level security;
alter table public.contact_requests enable row level security;
alter table public.consent_events enable row level security;
alter table public.analytics_events enable row level security;
alter table public.deletion_audit_events enable row level security;
alter table public.rate_limit_keys enable row level security;
alter table public.idempotency_keys enable row level security;

drop policy if exists "service_role_only_sessions" on public.survey_sessions;
drop policy if exists "service_role_only_answers" on public.survey_answers;
drop policy if exists "service_role_only_results" on public.survey_results;
drop policy if exists "service_role_only_contacts" on public.contact_requests;
drop policy if exists "service_role_only_consents" on public.consent_events;
drop policy if exists "service_role_only_analytics" on public.analytics_events;
drop policy if exists "service_role_only_deletion_audit" on public.deletion_audit_events;
drop policy if exists "service_role_only_rate_limit" on public.rate_limit_keys;
drop policy if exists "service_role_only_idempotency" on public.idempotency_keys;

create policy "service_role_only_sessions" on public.survey_sessions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_answers" on public.survey_answers
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_results" on public.survey_results
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_contacts" on public.contact_requests
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_consents" on public.consent_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_analytics" on public.analytics_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_deletion_audit" on public.deletion_audit_events
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_rate_limit" on public.rate_limit_keys
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service_role_only_idempotency" on public.idempotency_keys
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function public.delete_expired_agentproof_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_sessions integer;
  deleted_contacts integer;
begin
  delete from public.contact_requests where expires_at < now();
  get diagnostics deleted_contacts = row_count;

  delete from public.survey_sessions where expires_at < now();
  get diagnostics deleted_sessions = row_count;

  insert into public.deletion_audit_events (request_type, deleted_table, deleted_count)
  values
    ('retention', 'contact_requests', deleted_contacts),
    ('retention', 'survey_sessions', deleted_sessions);
end;
$$;
