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
    index: "01",
    role: "AI 답변을 믿어도 될지 모르겠어요",
    placement: "problem_trust",
    surveyPath: "/survey/?problem=trust",
    problem: "오답, 출처 부족, 보고서 오류가 걱정되는 경우",
    outcome: "이 문제로 점검하기",
    defaultProblem: "trust",
  },
  {
    index: "02",
    role: "어떤 업무부터 도입해야 할지 모르겠어요",
    placement: "problem_adoption",
    surveyPath: "/survey/?problem=adoption",
    problem: "효과, 비용, 우선순위, 파일럿 범위가 고민인 경우",
    outcome: "이 문제로 점검하기",
    defaultProblem: "adoption",
  },
  {
    index: "03",
    role: "보안·개인정보·승인 기준이 없어요",
    placement: "problem_security",
    surveyPath: "/survey/?problem=security",
    problem: "회사 자료 입력, 미승인 AI 사용, 책임 소재가 걱정되는 경우",
    outcome: "이 문제로 점검하기",
    defaultProblem: "security",
  },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "3분 점검",
    body: "AI 사용 상황과 가장 불안한 점을 선택합니다.",
  },
  {
    number: "02",
    title: "결과 확인",
    body: "위험도, 먼저 볼 문제, 이번 주 할 일을 확인합니다.",
  },
  {
    number: "03",
    title: "선택 참여",
    body: "원하면 체크리스트, 인터뷰, 파일럿 상담을 신청합니다.",
  },
] as const;

export const pilotDeliverables = [
  { number: "01", title: "업무별 위험 지도" },
  { number: "02", title: "역할별 실행 기준" },
  { number: "03", title: "자가진단 결과 요약" },
] as const;
