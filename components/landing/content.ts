export const leadConsentVersion = "2026-06-20";
export const landingVariant = process.env.NEXT_PUBLIC_LANDING_VARIANT ?? "v5.1";

export const roleOptions = ["실무자", "대표·도입 담당자", "보안·정책 담당자", "기타"] as const;
export type RoleOption = (typeof roleOptions)[number];

export const stageOptions = [
  "개인·팀에서 AI 사용 중",
  "조직 도입 검토 중",
  "파일럿 운영 중",
  "정책·보안 기준 마련 중",
] as const;

export const problemOptions = [
  "AI 답을 어디까지 믿고 써야 할지 모르겠다",
  "어떤 업무부터 도입해야 할지 모르겠다",
  "개인정보·권한·승인 기준이 없다",
  "도입 효과와 위험을 설명할 자료가 없다",
  "기타",
] as const;
export type ProblemOption = (typeof problemOptions)[number];

export const followupOptions = ["체크리스트 받기", "결과 예시 요약", "우리 회사 상담"] as const;
export type FollowupOption = (typeof followupOptions)[number];

export const followupEventByOption = {
  "체크리스트 받기": "followup_checklist",
  "결과 예시 요약": "followup_sample_report",
  "우리 회사 상담": "followup_pilot",
} as const;

export const productTabs = [
  {
    id: "evidence",
    number: "01",
    title: "답변 근거",
    body: "출처 없는 답은 걸러냅니다.",
  },
  {
    id: "risk",
    number: "02",
    title: "위험 테스트",
    body: "오답·기밀·권한 문제를 찾습니다.",
  },
  {
    id: "approval",
    number: "03",
    title: "승인 기록",
    body: "누가 확인했는지 남깁니다.",
  },
] as const;

export const roleProblemCards = [
  {
    index: "01",
    role: "AI가 틀리면\n누가 책임지죠?",
    placement: "problem_trust",
    surveyPath: "/survey/?problem=trust",
    problem: "오답·출처·보고서 오류",
    outcome: "믿어도 되는 답인지 확인",
    defaultProblem: "trust",
  },
  {
    index: "02",
    role: "AI 도입,\n어디부터 하죠?",
    placement: "problem_adoption",
    surveyPath: "/survey/?problem=adoption",
    problem: "업무·비용·우선순위",
    outcome: "먼저 바꿀 업무 찾기",
    defaultProblem: "adoption",
  },
  {
    index: "03",
    role: "회사 자료,\n넣어도 되나요?",
    placement: "problem_security",
    surveyPath: "/survey/?problem=security",
    problem: "보안·개인정보·승인 기준",
    outcome: "입력 금지 기준 정하기",
    defaultProblem: "security",
  },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "답하기",
    body: "10문항만 선택합니다.",
  },
  {
    number: "02",
    title: "보기",
    body: "위험과 할 일을 바로 봅니다.",
  },
  {
    number: "03",
    title: "받기",
    body: "원하면 체크리스트를 받습니다.",
  },
] as const;

export const pilotDeliverables = [
  { number: "01", title: "업무별 위험 지도" },
  { number: "02", title: "할 일 실행 기준" },
  { number: "03", title: "자가진단 결과 요약" },
] as const;
