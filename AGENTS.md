# AGENTS.md — AgentProof Landing V4.1

Codex는 작업을 시작하기 전에 아래 문서를 순서대로 읽는다.

1. `docs/01_랜딩페이지_설계문서.md`
2. `docs/02_개발계획문서.md`
3. `docs/03_검수과정문서.md`
4. `docs/04_다음버전_개선계획.md`
5. `docs/05_시각검수_기준.md`

## Source of truth

충돌 시 우선순위:

1. `reference/agentproof_v4_target_desktop.png`와 `reference/agentproof_v4_target_mobile.png`의 카피·레이아웃
2. `reference/visual-baseline/README.md`와 구간별 캡처
3. 설계문서의 기능·데이터 요구사항
4. 기존 HTML 또는 상호작용 프로토타입

최종 캡처와 문서·기존 HTML이 다르면 캡처가 우선이다. HTML은 상호작용 참고용이며 카피의 최종 기준이 아니다.

## 반드시 지킬 것

- 한국어 UI를 유지한다.
- 확정 카피를 임의 변경하지 않는다.
- 가짜 고객 로고, 후기, 인증, 성과 수치를 만들지 않는다.
- 진단 화면에 `SAMPLE DATA`를 명시한다.
- 실제 저장 성공 전 성공 메시지를 표시하지 않는다.
- 이메일, 회사명, memo를 analytics에 보내지 않는다.
- secret을 클라이언트 번들에 노출하지 않는다.
- TypeScript strict를 유지하고 불필요한 `any`를 사용하지 않는다.
- 모든 CTA와 모달을 키보드로 사용할 수 있게 한다.
- 320px 이상에서 가로 스크롤이 생기지 않게 한다.
- 기능 변경에는 테스트를 함께 추가한다.

## 작업 순서

`AP-LP-001`부터 개발계획의 티켓 순서로 진행한다. 한 번에 큰 재작성보다 작고 검증 가능한 커밋을 만든다.

## 완료 전 실행

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

실패한 명령이 있으면 완료로 보고하지 않는다.

## 보고 형식

작업 완료 시 다음을 요약한다.

- 구현한 티켓
- 변경 파일
- 실행한 테스트와 결과
- 남은 이슈
- 스크린샷 또는 staging URL
