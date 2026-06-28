create table if not exists public.quick_diagnosis_submissions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique,

  quick_diagnosis_version text not null,

  work_type text not null,
  monthly_volume text not null,
  time_per_case text not null,
  adoption_scope text not null,
  exposure text not null,

  selections_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,

  ai_adoption_score integer not null check (ai_adoption_score between 0 and 100),
  result_band text not null,

  saving_rate_min numeric not null,
  saving_rate_max numeric not null,

  saving_hours_min numeric not null,
  saving_hours_max numeric not null,

  saving_money_min integer not null,
  saving_money_max integer not null,

  support_review_average integer,
  support_review_min integer,
  support_review_max integer,
  project_scale text not null,

  hourly_cost integer not null default 30000,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,

  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

alter table public.quick_diagnosis_submissions
  add constraint quick_diagnosis_work_type_check
  check (work_type in ('customer_reply', 'grant_document', 'business_document', 'marketing_content', 'unknown'));

alter table public.quick_diagnosis_submissions
  add constraint quick_diagnosis_monthly_volume_check
  check (monthly_volume in ('low', 'mid', 'high', 'unknown'));

alter table public.quick_diagnosis_submissions
  add constraint quick_diagnosis_time_per_case_check
  check (time_per_case in ('short', 'medium', 'long', 'unknown'));

alter table public.quick_diagnosis_submissions
  add constraint quick_diagnosis_adoption_scope_check
  check (adoption_scope in ('draft_only', 'reviewed_use', 'partial_automation', 'direct_use', 'unknown'));

alter table public.quick_diagnosis_submissions
  add constraint quick_diagnosis_exposure_check
  check (exposure in ('external', 'executive', 'internal', 'unknown'));

alter table public.quick_diagnosis_submissions
  add constraint quick_diagnosis_project_scale_check
  check (project_scale in ('low', 'medium', 'high', 'enterprise'));

create index if not exists quick_diagnosis_created_at_idx
  on public.quick_diagnosis_submissions (created_at desc);

create index if not exists quick_diagnosis_work_type_idx
  on public.quick_diagnosis_submissions (work_type);

create index if not exists quick_diagnosis_result_band_idx
  on public.quick_diagnosis_submissions (result_band);

create index if not exists quick_diagnosis_project_scale_idx
  on public.quick_diagnosis_submissions (project_scale);

alter table public.quick_diagnosis_submissions enable row level security;

drop policy if exists "service_role_only_quick_diagnosis"
  on public.quick_diagnosis_submissions;

create policy "service_role_only_quick_diagnosis"
  on public.quick_diagnosis_submissions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

alter table public.contact_requests
  drop constraint if exists contact_requests_request_type_check;

alter table public.contact_requests
  add constraint contact_requests_request_type_check
  check (request_type in ('survey_followup', 'beta', 'interview', 'pilot'));

create or replace function public.delete_expired_agentproof_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_sessions integer;
  deleted_contacts integer;
  deleted_quick_diagnosis integer;
begin
  delete from public.quick_diagnosis_submissions where expires_at < now();
  get diagnostics deleted_quick_diagnosis = row_count;

  delete from public.contact_requests where expires_at < now();
  get diagnostics deleted_contacts = row_count;

  delete from public.survey_sessions where expires_at < now();
  get diagnostics deleted_sessions = row_count;

  insert into public.deletion_audit_events (request_type, deleted_table, deleted_count)
  values
    ('retention', 'quick_diagnosis_submissions', deleted_quick_diagnosis),
    ('retention', 'contact_requests', deleted_contacts),
    ('retention', 'survey_sessions', deleted_sessions);
end;
$$;

revoke all on function public.delete_expired_agentproof_data() from public, anon, authenticated;
grant execute on function public.delete_expired_agentproof_data() to service_role;

create or replace function public.agentproof_rls_status()
returns table(table_name text, relrowsecurity boolean)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select c.relname::text as table_name, c.relrowsecurity
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in (
      'survey_sessions',
      'survey_answers',
      'survey_results',
      'quick_diagnosis_submissions',
      'contact_requests',
      'consent_events',
      'analytics_events',
      'deletion_audit_events',
      'rate_limit_keys',
      'idempotency_keys'
    )
  order by c.relname;
$$;

revoke all on function public.agentproof_rls_status() from public, anon, authenticated;
grant execute on function public.agentproof_rls_status() to service_role;
