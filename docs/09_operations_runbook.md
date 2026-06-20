# Operations Runbook

## Update questions

Edit `lib/survey/questions.ts`, bump `surveyVersion`, update `docs/02_question_bank_and_scoring.md`, then run unit and e2e tests.

## Update scoring

Edit `lib/survey/scoring.ts`, bump `scoringVersion`, add or update unit tests for every changed rule.

## Export permitted data

Export aggregate statistics and session-level non-sensitive fields only. Do not export raw email with answers in the same file.

## Process deletion requests

1. Verify request scope with minimum necessary data.
2. Delete contact rows and session-linked raw answer rows.
3. Record deletion audit without retaining deleted content.
4. Confirm completion by email.

## Run retention deletion

Run `public.delete_expired_agentproof_data()` from a privileged Supabase context after production storage is configured.

## Identify duplicate or abusive submissions

Use idempotency keys, rate-limit key hashes, honeypot rejection, and timestamp clustering. Do not retain raw IP addresses.

## Revoke beta consent

Delete or expire `contact_requests` rows where `request_type = 'beta'` and record a deletion audit event.

## Rotate credentials

Rotate Supabase service-role key and Edge Function secrets from the provider console, then update GitHub secrets and redeploy.

## Recover from failed submissions

If production submissions fail, clear `NEXT_PUBLIC_SURVEY_API_URL` to disable live submission, redeploy, and display local-result-only mode until the endpoint is verified.
