# Privacy Provider Evidence

- Last updated: 2026-06-21
- Production site: https://agentproofkr.github.io/
- Scope: `/privacy/`, `/privacy/request/`, `/beta-terms/`, role-based survey submission, optional beta/interview/pilot contact requests

This file records evidence used for the public privacy disclosure. It is not legal advice and does not invent legal bases, provider countries, or operator identity.

## Local And Repository Configuration Evidence

| Item | Evidence | Result |
|---|---|---|
| GitHub repository variables | `gh variable list --repo agentproofKR/agentproofKR.github.io --json name,value` | `LEGAL_OPERATOR_NAME`, `SUPABASE_URL`, `SUPABASE_PROJECT_REF`, and `NEXT_PUBLIC_SURVEY_API_URL` are configured. |
| Legal operator value | `gh variable get LEGAL_OPERATOR_NAME` was checked by length and SHA-256 prefix only. | Present. Raw value intentionally not repeated in this file. |
| Public survey API | `NEXT_PUBLIC_SURVEY_API_URL` starts with `https://` and points to a Supabase Functions URL. | Configured. |
| Supabase project ref | `SUPABASE_PROJECT_REF` is present and matches the Supabase host prefix pattern. | Configured. |
| Supabase region evidence | Latest `artifacts/qa/final-production/logs/supabase-release-*/production-storage-verification.json` artifact | Supabase Management API returns `project.region = ap-northeast-2` and `status = ACTIVE_HEALTHY` in the release verification artifact. |
| Submission cleanup evidence | same artifact | Synthetic QA sessions, analytics rows, and idempotency keys were deleted; remaining counts were `0`. |

Fresh production verification must be rerun after each deployment. The current workflow is `.github/workflows/supabase-release.yml`, which writes `production-storage-verification.json`.

## Provider Fact Table

| Provider | Official entity or source | Data categories processed by AgentProof use | Purpose | Transfer timing and method | Location facts verified | Retention or deletion | Contact/refusal |
|---|---|---|---|---|---|---|---|
| GitHub, Inc. | GitHub Pages and GitHub privacy/subprocessor docs | Static HTML/CSS/JS/images and visitor technical data such as IP address security logs | Host and deliver the public static site | On every page visit over HTTPS through GitHub Pages | GitHub Pages docs say visitor IP addresses are logged and stored for security. GitHub subprocessor docs list infrastructure/CDN subprocessors with United States processing locations. | AgentProof does not control GitHub security-log retention. | Users can avoid GitHub Pages processing only by not visiting the public site. AgentProof privacy requests go to `agentproof.ai@gmail.com`; GitHub privacy questions use GitHub's published privacy channels. |
| Supabase, Inc. | Supabase privacy, DPA, regions, and Edge Functions docs; actual project verification artifact | Survey session IDs, role/persona, answers, result summary, consent records, UTM values, optional encrypted email and optional company for contact requests, non-sensitive analytics events | Store survey results, prove consent, prevent duplicate or abusive submissions, and handle optional contact requests | When the user submits a survey or optional contact request, the browser posts JSON to the Supabase Edge Function URL | Actual Postgres project region is `ap-northeast-2` (Seoul). Supabase docs say each project is deployed to one primary region. Supabase Edge Functions are globally distributed and execute close to users by default; this deployment does not force a specific function region in client calls. | AgentProof migration and verifier enforce 6 months for survey source data, 90 days for interview contact, 12 months for pilot contact, and 12 months or beta end plus 90 days for beta contact. Synthetic QA records are deleted by verification. | Required survey processing consent is needed for stored survey submission. Optional beta/interview/pilot contact can be refused or withdrawn through `agentproof.ai@gmail.com`. Supabase privacy inquiries use `privacy@supabase.com`. |

## Official Sources Checked

- GitHub Pages documentation, "What is GitHub Pages?": https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub General Privacy Statement: https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement
- GitHub Subprocessors: https://docs.github.com/en/site-policy/privacy-policies/github-subprocessors
- Supabase Privacy Policy: https://supabase.com/privacy
- Supabase DPA page: https://supabase.com/legal/dpa
- Supabase regions documentation: https://supabase.com/docs/guides/platform/regions
- Supabase Edge Functions documentation: https://supabase.com/docs/guides/functions
- Supabase regional invocation documentation: https://supabase.com/docs/guides/functions/regional-invocations
- Supabase contact page: https://supabase.com/contact-us

## Known Boundaries

- No legal basis is listed in the public privacy table because this pass did not produce a verified legal-basis opinion.
- GitHub's exact per-request security-log retention period was not verified from the public docs checked here, so the public page states that AgentProof does not control that period.
- Supabase Edge Function execution can be regionally invoked, but the current public browser submission path does not set an `x-region` header or `forceFunctionRegion` query parameter.
- Fresh post-deploy evidence is required before marking the current release complete.
