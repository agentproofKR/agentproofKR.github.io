# AgentProof Role-Based Assessment Implementation Plan

> For agentic workers: this plan is executed on `main` because the release brief explicitly requires pushing to `main` for GitHub Pages. Preserve the existing landing visual baseline, keep Korean UI copy, and do not claim production storage success unless Supabase credentials and deployment are verified.

## Goal

Replace the current single lead modal with a static-export compatible, role-based AgentProof AI readiness assessment for 실무자, 대표·도입 담당자, and 보안·정책 담당자, with deterministic scoring, privacy-by-design consent, mock-testable backend adapters, documentation, visual QA, and GitHub Pages deployment.

## Current Findings

- Framework: Next.js App Router, React, TypeScript strict, CSS Modules, static export via `output: "export"`.
- Production: `https://agentproofkr.github.io/` and `/privacy/` return HTTP 200 and match the current V5.1 static landing.
- Deployment: `.github/workflows/deploy-pages.yml` deploys `out/` to GitHub Pages on `main`.
- Backend: Supabase CLI and Supabase environment variables are not present in this workspace. GitHub CLI is authenticated for push/workflow inspection.
- Existing behavior: the current modal uses a `mailto:` fallback and must be replaced by full survey routes. Server storage cannot be truthfully claimed until Supabase project credentials are supplied.

## Implementation Tasks

### Task 1: Preserve Landing Baseline And Route CTAs

Files:
- Modify `components/landing/LandingPage.tsx`
- Modify `components/layout/Header.tsx`
- Modify `components/layout/Footer.tsx`
- Modify `components/landing/content.ts`
- Modify `app/layout.tsx`, `app/sitemap.ts`
- Keep `styles/landing.module.css` visual hierarchy unless route links require small button changes.

Steps:
- Replace modal-opening CTAs with links to `/survey/`.
- Link persona cards to `/survey/practitioner/`, `/survey/leader/`, and `/survey/security/`.
- Replace the legacy contact address with `agentproof.ai@gmail.com`.
- Keep the existing dashboard preview and `SAMPLE DATA` labeling.
- Update metadata to the role-based readiness assessment copy without adding invented claims.

### Task 2: Add Typed Survey Domain

Files:
- Create `lib/legal.ts`
- Create `lib/survey/types.ts`
- Create `lib/survey/questions.ts`
- Create `lib/survey/scoring.ts`
- Create `lib/survey/consent.ts`
- Create `lib/survey/retention.ts`
- Create `lib/survey/submission.ts`

Steps:
- Encode the six common questions and persona-specific questions exactly from the UTF-8 brief.
- Define answer types: single choice, multi-select with explicit limits, scale, yes/partial/no/unknown, and budget.
- Version survey and scoring rules.
- Implement deterministic scoring, reverse scoring, information-gap flags, not-applicable denominator exclusion, critical warning overrides, result bands, top risks, recommended actions, and AgentProof feature hypotheses.
- Keep segmentation questions unscored.

### Task 3: Build Static Survey UI

Files:
- Create `components/survey/SurveyHub.tsx`
- Create `components/survey/SurveyFlow.tsx`
- Create `components/survey/SurveyResult.tsx`
- Create `styles/survey.module.css`
- Create `app/survey/page.tsx`
- Create `app/survey/[persona]/page.tsx`
- Create `app/survey/result/page.tsx`

Steps:
- Implement `/survey/` role hub with purpose, 7-10 minute estimate, participation benefits, privacy summary, and start links.
- Implement one-question-per-screen survey flow for all viewports, which satisfies the mobile requirement and stays under the desktop maximum.
- Add progress such as `8/24`, estimated remaining time, Previous/Continue controls, focus movement, validation errors, local draft saving, and confirmation screen.
- Never put answers, email, company name, or free text in URLs.
- Store result locally for `/survey/result/` without forcing email.
- Display backend storage disabled state clearly when no production survey API is configured.

### Task 4: Privacy, Consent, Reward, And Legal Pages

Files:
- Replace `app/privacy/page.tsx`
- Create `app/privacy/request/page.tsx`
- Create `app/beta-terms/page.tsx`
- Create docs listed in the release brief.

Steps:
- Add full Korean privacy policy sections.
- Add separate required age confirmation and survey-processing consent.
- Keep beta, interview, and pilot consents separate and unchecked.
- Add Founding Researcher terms without guaranteeing beta selection, cash value, or favorable-answer dependency.
- Use `AgentProof 운영자` when `LEGAL_OPERATOR_NAME` is missing and document a P0 legal review item.

### Task 5: Backend Adapter And Provisioning Artifacts

Files:
- Create `supabase/migrations/202606210001_role_based_assessment.sql`
- Create `supabase/functions/survey-submit/index.ts`
- Create `scripts/provision-supabase.mjs`
- Create `scripts/mock-survey-backend.mjs`
- Update `.env.example`

Steps:
- Provide schema for sessions, answers, results, contact requests, consent events, analytics events, deletion audit, and rate-limit keys.
- Include RLS, no public reads, no direct anonymous table writes, and retention helpers.
- Implement Edge Function validation, strict CORS, honeypot, idempotency key, duplicate handling, rate-limit key hashing, and PII-safe logging.
- Provide local mock backend for tests and operator rehearsal.
- Do not deploy Supabase artifacts unless credentials and CLI are available.

### Task 6: Automated Tests

Files:
- Add unit tests for scoring, consent gating, retention calculations, UTM behavior, analytics sanitization, submission validation, duplicate idempotency, input sanitization, and role branching.
- Replace/update Playwright tests for landing CTA routes, all persona completions, result without email, optional consent refusal, required consent blocking, local draft resume, validation errors, keyboard flow, mobile completion, privacy pages, and PII hygiene.

Steps:
- Write failing tests before production code changes.
- Run targeted tests to confirm red.
- Implement minimal code until tests pass.
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.

### Task 7: Visual QA And Deployment

Files:
- Update `scripts/generate-qa-artifacts.mjs` if needed.
- Save screenshots/logs under `artifacts/qa/local/`, `artifacts/qa/production/`, `artifacts/qa/diffs/`, and `artifacts/qa/logs/`.
- Update `.github/workflows/deploy-pages.yml` to run e2e after installing Playwright browsers.

Steps:
- Capture desktop 1440px and mobile 390px states for homepage, survey hub, persona start/mid screens, consent, result, beta opt-in, validation error, privacy, and beta terms.
- Check 320, 360, 768, 1024, 1280, and 1440px for horizontal overflow.
- Build static output.
- Commit, push to `main`, watch GitHub Actions, and verify production routes.
- Mark production submission/storage as blocked if Supabase credentials remain unavailable.

## Gate Matrix

- G0 repository and production inspected: in progress.
- G1 all three surveys implemented: pending.
- G2 scoring and results tested: pending.
- G3 privacy, consent, reward terms, and retention implemented: pending.
- G4 backend security and deletion behavior verified: blocked for hosted verification until Supabase credentials exist; local mock and static artifacts are achievable.
- G5 accessibility and responsive QA passed: pending.
- G6 GitHub Pages deployment succeeded: pending.
- G7 production submission and result verified: result UI is achievable; production storage is blocked until Supabase credentials exist.
- G8 production PC/mobile screenshots generated: pending after deployment.
- G9 final QA report completed: pending.
