# AgentProof Landing V4.1

AgentProof V4.1 랜딩페이지의 GitHub Pages 정적 배포 후보입니다. 최종 목표 URL은
`https://agentproofkr.github.io/`이며, 루트 배포를 위해 `basePath`와 `assetPrefix`를
사용하지 않습니다.

## 문서

- `docs/01_랜딩페이지_설계문서.md` — 제품, 화면, 카피, 상호작용 기준
- `docs/02_개발계획문서.md` — 기술 스택, 작업 티켓, 배포 계획
- `docs/03_검수과정문서.md` — 기능·시각·접근성·보안 검수
- `docs/04_다음버전_개선계획.md` — V4.2 실험과 V5 로드맵
- `docs/05_시각검수_기준.md` — PC·모바일 캡처 비교 기준
- `AGENTS.md` — Codex 실행 규칙

## 로컬 실행

```bash
npx -y pnpm@11.8.0 install
npx -y pnpm@11.8.0 dev
```

## 환경 변수

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_LANDING_VARIANT=v4.1
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

GitHub Pages에는 자체 서버 런타임이 없으므로 `/api/leads`는 제공하지 않습니다. 과거 리드 폼은
클라이언트 검증 뒤 `agentproof.ai@gmail.com`로 보내는 `mailto:` fallback을 사용합니다.
역할별 설문 저장은 `NEXT_PUBLIC_SURVEY_API_URL`이 Supabase Edge Function으로 설정된 경우에만
외부 함수로 전송합니다. 저장소가 연결되지 않은 상태에서는 저장 성공 메시지를 표시하지 않고,
결과 요약만 현재 브라우저 세션에 표시합니다.

## 검증

```bash
npx -y pnpm@11.8.0 lint
npx -y pnpm@11.8.0 typecheck
npx -y pnpm@11.8.0 test
npx -y pnpm@11.8.0 test:e2e
npx -y pnpm@11.8.0 build
```

정적 빌드 결과는 `out/`에 생성됩니다. 로컬 production 후보는 다음처럼 확인합니다.

```bash
npx -y pnpm@11.8.0 build
npx -y pnpm@11.8.0 start -- --hostname 127.0.0.1 --port 3101
npx -y pnpm@11.8.0 staging:smoke
```

QA 증거 패키지는 다음 명령으로 생성합니다.

```bash
npx -y pnpm@11.8.0 qa:artifacts
```

production build 기준으로 캡처하려면 먼저 `build`를 실행한 뒤 PowerShell에서
`$env:QA_SERVER_MODE='production'`을 설정하고 같은 명령을 실행합니다.

외부 production URL이 있으면 smoke를 실제 URL에 대해 실행합니다.

```bash
$env:STAGING_BASE_URL='https://agentproofkr.github.io'
npx -y pnpm@11.8.0 staging:smoke
```

## 배포 설정

GitHub Pages 배포는 `.github/workflows/deploy-pages.yml`에서 `main` push와
`workflow_dispatch`로 실행됩니다. 빌드 산출물은 `./out`이며, Pages Source는
GitHub Actions로 설정되어야 합니다.

production smoke에서는 실제 도메인 HTTPS 접속, CSS/JS 로드, PC·모바일 렌더링,
CTA·역할별 설문 진입, analytics PII 미노출을 확인합니다. Supabase 설문 저장, RLS,
QA 데이터 삭제는 `verify:production:supabase`에서 별도로 검증합니다.
