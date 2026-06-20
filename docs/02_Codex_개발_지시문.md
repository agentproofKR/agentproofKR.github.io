# AgentProof V5.0 Codex 개발 지시문

`docs/01_V5_서비스급_랜딩페이지_설계.md`와 아래 기준 이미지를 소스 오브 트루스로 사용한다.

1. `agentproof_v5_desktop_full.png`
2. `agentproof_v5_mobile_full.png`
3. `agentproof_mvp_dashboard_agentproof.png`
4. `agentproof_v5_service_landing.html`

충돌 시 전체 레이아웃과 카피는 데스크톱·모바일 캡처가 우선이고, 상호작용·데이터·접근성은 설계문서가 우선이다.

## 구현 범위

- Next.js App Router + TypeScript strict
- CSS Modules 또는 동급의 명시적 스타일 구조
- 랜딩페이지 전 섹션
- 데스크톱 제품 이미지 또는 HTML 재현
- 모바일 전용 대시보드
- 제품 가치 탭
- 리드 모달과 폼
- `POST /api/leads`
- Zod 검증, UTM 보존, honeypot, rate limit, 중복 제출 방지
- mock 저장소와 Supabase 어댑터
- SEO, OG, sitemap, robots
- 접근성·성능·분석 이벤트

## 금지

- 확정 카피 임의 변경
- Agent Assurance 사용
- 실명 사용
- 가짜 실적·고객 로고·인증 추가
- 모바일에서 데스크톱 대시보드 단순 축소
- 실제 저장 전 성공 이벤트 발생

## 완료 명령

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

1440px와 390px full-page 캡처, 기준 이미지 대비 diff, 접근성 결과, 테스트 로그를 `artifacts/qa/`에 저장한다.
