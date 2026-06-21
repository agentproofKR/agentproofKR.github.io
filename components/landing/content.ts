export const leadConsentVersion = "2026-06-20";
export const landingVariant = process.env.NEXT_PUBLIC_LANDING_VARIANT ?? "v5.1";

export const roleOptions = ["실무자", "대표·도입 담당자", "보안·정책 담당자", "기타"] as const;
export type RoleOption = (typeof roleOptions)[number];

export const stageOptions = [
  "개인·팀에서 AI 사용 중",
  "조직 도입 검토 중",
  "파일럿 운영 중",
  "정책·보안 기준 수립 중",
] as const;

export const problemOptions = [
  "AI 답을 어디까지 믿고 써야 할지 모르겠다",
  "어떤 업무부터 도입해야 할지 모르겠다",
  "개인정보·권한·승인 기준이 없다",
  "도입 효과와 위험을 설명할 자료가 없다",
  "기타",
] as const;
export type ProblemOption = (typeof problemOptions)[number];

export const followupOptions = ["역할별 체크리스트", "예시 결과 요약", "파일럿 상담"] as const;
export type FollowupOption = (typeof followupOptions)[number];

export const followupEventByOption = {
  "역할별 체크리스트": "followup_checklist",
  "예시 결과 요약": "followup_sample_report",
  "파일럿 상담": "followup_pilot",
} as const;

export const productTabs = [
  {
    id: "evidence",
    number: "01",
    title: "답변 근거",
    body: "답변과 함께 출처와 문서 버전을 확인합니다.",
  },
  {
    id: "risk",
    number: "02",
    title: "위험 테스트",
    body: "오답·정책·권한 위험을 반복 테스트합니다.",
  },
  {
    id: "approval",
    number: "03",
    title: "승인 기록",
    body: "검토·승인·변경 이력을 기록합니다.",
  },
] as const;

export const roleProblemCards = [
  {
    index: "01 · EMPLOYEE",
    role: "실무자",
    placement: "role_employee",
    surveyPath: "/survey/practitioner/",
    problem: "AI 답을 믿고 써도 될까요?",
    outcome: "근거 확인 · 업무 사용 가이드",
    defaultProblem: "AI 답을 어디까지 믿고 써야 할지 모르겠다",
  },
  {
    index: "02 · BUSINESS",
    role: "대표·도입 담당자",
    placement: "role_business",
    surveyPath: "/survey/leader/",
    problem: "어떤 업무부터 시작해야 할까요?",
    outcome: "도입 우선순위 · 준비도 진단",
    defaultProblem: "어떤 업무부터 도입해야 할지 모르겠다",
  },
  {
    index: "03 · SECURITY",
    role: "보안·정책 담당자",
    placement: "role_security",
    surveyPath: "/survey/security/",
    problem: "무엇을 막고 기록해야 할까요?",
    outcome: "사용정책 · 권한·기록 점검",
    defaultProblem: "개인정보·권한·승인 기준이 없다",
  },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "업무 1개 선택",
    body: "반복 질문이나 문서 검색 업무를 고릅니다.",
  },
  {
    number: "02",
    title: "검증",
    body: "정확성·근거·정책·권한을 확인합니다.",
  },
  {
    number: "03",
    title: "결과",
    body: "리포트와 다음 도입 기준을 정리합니다.",
  },
] as const;

export const pilotDeliverables = [
  { number: "01", title: "업무별 위험 지도" },
  { number: "02", title: "역할별 실행 기준" },
  { number: "03", title: "자가진단 결과 요약" },
] as const;
