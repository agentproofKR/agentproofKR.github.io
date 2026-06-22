alter table public.contact_requests
  add column if not exists encrypted_name text,
  add column if not exists encrypted_contact text;

alter table public.contact_requests
  drop constraint if exists contact_requests_request_type_check;

alter table public.contact_requests
  add constraint contact_requests_request_type_check
  check (request_type in ('survey_followup', 'beta', 'interview', 'pilot'));
