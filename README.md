# AgentProof Landing V5

AgentProof의 공개 랜딩페이지와 역할별 AI 자가점검입니다.
운영 URL은 `https://agentproofkr.github.io/`이며, GitHub Pages 정적 프런트엔드와
Supabase Edge Function 기반 설문 저장 경로로 운영됩니다.

## 현재 운영 구조

- 프런트엔드: Next.js 정적 export, GitHub Pages 루트 배포
- 설문 제출: `NEXT_PUBLIC_SURVEY_API_URL`에 설정된 Supabase Edge Function으로만 전송
- 데이터 저장: Supabase Postgres, 프로젝트 리전 `ap-northeast-2`
- 선택 연락 요청: 설문 결과 화면의 베타, 인터뷰, 파일럿 동의별로 분리 저장
- 공개 연락처: `agentproof.ai@gmail.com`
- 운영자 표시명: GitHub repository variable `LEGAL_OPERATOR_NAME`
- 배포 식별자: `/version.json`

GitHub Pages에는 서버 라우트가 없으므로 `/api/leads`는 운영 API가 아닙니다.
설문 저장, 동의 기록, 선택 연락 요청은 Edge Function을 통해서만 처리됩니다.
개인정보 열람, 수정, 삭제, 동의 철회 같은 권리 요청만 공개 연락처 이메일로 접수합니다.

## 개인정보와 동의 흐름

설문은 역할 선택 뒤 목적과 개인정보 요약을 먼저 안내하고, 만 14세 이상 확인과
필수 개인정보 수집·이용 동의를 받은 다음 질문을 시작합니다.

기본 동작은 다음과 같습니다.

- 이메일 입력 없이 결과 확인 가능
- 답변 원문, 동의 상태, 이메일, 회사명은 기본적으로 브라우저 localStorage에 저장하지 않음
- 결과 화면에는 민감하지 않은 요약만 sessionStorage에 임시 저장
- 베타 참여, 인터뷰, 파일럿 상담은 각각 별도 선택 동의로 처리
- analytics payload는 허용된 비식별 필드만 전송
- 설문 저장 성공 전에는 저장 성공 메시지를 표시하지 않음

`LEGAL_OPERATOR_NAME`이 비어 있으면 공개 UI에 임의 이름을 표시하지 않아야 하며,
운영 데이터 수집은 release gate에서 차단되어야 합니다.

## 운영 검증

로컬에서는 다음 명령을 사용합니다.

```bash
npx -y pnpm@11.8.0 install
npx -y pnpm@11.8.0 lint
npx -y pnpm@11.8.0 typecheck
npx -y pnpm@11.8.0 test
npx -y pnpm@11.8.0 test:content
npx -y pnpm@11.8.0 test:e2e
npx -y pnpm@11.8.0 test:security
npx -y pnpm@11.8.0 build
```

운영 HTML까지 포함한 콘텐츠 검사는 배포 뒤 실행합니다.

```bash
$env:CONTENT_SCAN_BASE_URL='https://agentproofkr.github.io'
npx -y pnpm@11.8.0 test:content
```

Supabase 운영 저장 경로는 GitHub Actions의 `Supabase Release Verification`
workflow에서 검증합니다. 이 workflow는 마이그레이션, Edge Function 배포,
서버 재계산, RLS, CORS, replay 차단, rate limit, QA 데이터 삭제를 확인하고
`production-storage-verification` artifact를 남깁니다.

## 배포

`main` 브랜치 push 또는 수동 실행으로 `.github/workflows/deploy-pages.yml`이 동작합니다.
빌드 시 `scripts/write-version.mjs`가 `public/version.json`을 생성하고, Pages artifact에 포함합니다.
`/version.json`에는 commit SHA, build timestamp, privacy policy version, survey version만 들어갑니다.
secret, 이메일, 회사명, 설문 답변은 포함하지 않습니다.

## 환경 변수와 저장소 변수

GitHub repository variables:

- `NEXT_PUBLIC_SURVEY_API_URL`
- `LEGAL_OPERATOR_NAME`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_URL`

GitHub secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`

secret 값은 클라이언트 번들, 문서, 스크린샷, 로그에 노출하지 않습니다.
