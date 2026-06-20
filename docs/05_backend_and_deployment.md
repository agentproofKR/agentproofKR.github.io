# Backend And Deployment

## 현재 상태

GitHub Pages는 static hosting이다. 현재 워크스페이스에는 Supabase CLI, `SUPABASE_URL`, service-role key, access token, project ref가 없다. 따라서 production storage는 연결되지 않았고, UI는 저장소 미연결 상태를 명확히 표시한다.

## 포함된 산출물

- `supabase/migrations/202606210001_role_based_assessment.sql`
- `supabase/functions/survey-submit/index.ts`
- `scripts/provision-supabase.mjs`
- `scripts/mock-survey-backend.mjs`

## Provisioning 절차

1. Supabase Seoul region project를 생성한다.
2. MFA가 적용된 관리자 계정으로 접근한다.
3. `SUPABASE_ACCESS_TOKEN`과 `SUPABASE_PROJECT_REF`를 설정한다.
4. `npx -y pnpm@11.8.0 survey:provision:supabase`를 실행한다.
5. Edge Function URL을 확인하고 GitHub secret 또는 Pages build env에 `NEXT_PUBLIC_SURVEY_API_URL`로 등록한다.
6. production에서 테스트 제출, DB row, RLS, CORS, idempotency를 확인한다.

## Recovery

저장소 장애 시 `NEXT_PUBLIC_SURVEY_API_URL`을 비우면 live submission은 중단되고 결과는 로컬에만 표시된다. 거짓 성공 메시지를 표시하지 않는다.
