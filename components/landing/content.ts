export const leadConsentVersion = "2026-06-18";
export const landingVariant = process.env.NEXT_PUBLIC_LANDING_VARIANT ?? "v4.1";

export const roleOptions = [
  "실무자·직장인",
  "대표·임원·팀장",
  "AI 도입 담당자",
  "보안·개인정보·감사 담당자",
  "AI 구축·개발·컨설팅 담당자",
] as const;

export const stageOptions = [
  "개인 사용 중",
  "회사 도입 검토",
  "부서 파일럿 준비",
  "사용정책 수립",
  "고객사 납품·검수 준비",
] as const;

export const concernOptions = [
  "회사자료·기밀 입력 기준",
  "AI 답변 오류와 검토 책임",
  "개인정보·보안",
  "내부 설득자료",
  "로그·승인·감사",
  "도입 우선순위",
] as const;

export const roleCards = [
  {
    number: "01",
    title: "실무자",
    body: "어떤 업무를 AI에 맡겨도 되는지, 결과를 어디까지 확인해야 하는지 명확해집니다.",
  },
  {
    number: "02",
    title: "대표·도입 담당자",
    body: "효과가 큰 업무부터 도입하고, 비용·위험·내부 승인 근거를 한 번에 봅니다.",
  },
  {
    number: "03",
    title: "보안·정책 담당자",
    body: "허용 도구, 금지 데이터, 사람 검토와 기록 기준을 업무 단위로 정합니다.",
  },
] as const;

export const decisionSteps = [
  { label: "발견", title: "현재 쓰는 AI와 업무" },
  { label: "기회", title: "자동화·지원 가능 업무" },
  { label: "위험", title: "정보·정확성·책임" },
  { label: "기준", title: "허용·검토·기록 원칙" },
  { label: "실행", title: "도입 우선순위와 가이드" },
] as const;

export const processSteps = [
  {
    number: "01",
    title: "사용 현황 파악",
    body: "누가 어떤 AI를 어떤 업무에 쓰거나 도입하려는지 확인합니다.",
  },
  {
    number: "02",
    title: "업무별 진단",
    body: "기대효과와 정확성·정보보호·책임 위험을 함께 판단합니다.",
  },
  {
    number: "03",
    title: "실행 기준 정리",
    body: "도입 우선순위, 허용 범위와 사람 검토 기준을 제공합니다.",
  },
] as const;
