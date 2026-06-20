# QA Plan

## Required Commands

```bash
npx -y pnpm@11.8.0 install
npx -y pnpm@11.8.0 lint
npx -y pnpm@11.8.0 typecheck
npx -y pnpm@11.8.0 test
npx -y pnpm@11.8.0 test:e2e
npx -y pnpm@11.8.0 build
```

## Browser QA

Capture local and production screenshots under:

- `artifacts/qa/local/`
- `artifacts/qa/production/`
- `artifacts/qa/diffs/`
- `artifacts/qa/logs/`

Required states: homepage CTA, survey hub, persona start, persona mid-survey, consent, result, beta opt-in, validation error, privacy, beta terms.

Required widths: 320, 360, 390, 768, 1024, 1280, 1440.

## Release blockers

- horizontal scroll at 320px+
- clipped question or hidden consent text
- inaccessible error state
- missing `SAMPLE DATA`
- email/company/free text in analytics payloads
- success storage message before real storage succeeds
- production storage claim without Supabase proof
