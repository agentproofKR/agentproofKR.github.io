# Legal Review Checklist

이 구현은 privacy-by-design 지원이며 공식 법률 자문을 대체하지 않는다.

## P0 Before Expanded Public Collection

- 운영자의 법적 표시명 확인
- 개인정보처리자 표기와 책임자 표기 검토
- Supabase 또는 실제 처리자의 위탁·국외이전 고지 검증
- beta reward terms의 표시광고·경품 규정 검토
- 만 14세 미만 제한 문구 검토

## Current fallback

`LEGAL_OPERATOR_NAME`이 없으면 공개 UI는 `AgentProof 운영자`를 사용한다. 검증된 법적 이름이 제공되면 `LEGAL_OPERATOR_NAME`으로 대체한다.
