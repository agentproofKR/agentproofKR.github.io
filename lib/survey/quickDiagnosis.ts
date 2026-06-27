export const quickDiagnosisVersion =
  "2026-06-AgentProof-reference-six-screen-v1";

export type WorkType =
  | "customer_reply"
  | "grant_document"
  | "business_document"
  | "marketing_content"
  | "unknown";

export type AutonomyLevel = "high" | "medium" | "low";

export type ControlState = {
  autonomy: AutonomyLevel;
  behaviorLogging: boolean;
  humanReview: boolean;
  driftMonitoring: boolean;
  riskLine: string;
};

export type AssuranceBand =
  | "go"
  | "conditional"
  | "needs_verification"
  | "hold";

export type AssuranceResult = {
  score: number;
  band: AssuranceBand;
  bandLabel: string;
  riskLine: string;
  dailyLeakageEstimate: string;
  subsidyEstimate: string;
};

export type ReferenceDiagnosisScreen = {
  id:
    | "awareness"
    | "work"
    | "controls"
    | "score"
    | "validation"
    | "monitoring";
  stageLabel: string;
  title: string;
  subcopy?: string;
  pill?: string;
  trustNote?: string;
  analysisText?: string;
  riskTitle?: string;
  alertTitle?: string;
  cta: string;
};

export const referenceDiagnosisScreens = [
  {
    id: "awareness",
    stageLabel: "시작",
    title: "AI,\n업무에 써도 될까?",
    subcopy: "무료 1분 체크",
    pill: "+ AI 도입 지원금",
    cta: "시작하기",
    trustNote: "연락처 입력 없음",
  },
  {
    id: "work",
    stageLabel: "업무",
    title: "어떤 업무에\nAI를 쓸까요?",
    subcopy: "업무마다 확인할 기준이 달라요.",
    cta: "다음",
  },
  {
    id: "controls",
    stageLabel: "진단",
    title: "통제 상태 진단",
    analysisText: "AI 분석 중 · 평균 3초",
    cta: "안심 점수 보기",
  },
  {
    id: "score",
    stageLabel: "리포트",
    title: "안심 점수",
    riskTitle: "가장 위험한 한 줄",
    cta: "30일 업무 검증 문의하기",
  },
  {
    id: "validation",
    stageLabel: "전환",
    title: "30일 업무 검증 문의",
    cta: "문의 보내기",
  },
  {
    id: "monitoring",
    stageLabel: "모니터링",
    title: "모니터링",
    subcopy: "최근 8주 · 도입 후 상시 점검됨",
    alertTitle: "드리프트 감지",
    cta: "리포트 공유",
  },
] as const satisfies readonly ReferenceDiagnosisScreen[];

export const workOptions = [
  { value: "customer_reply", label: "고객 문의 응대", subtitle: "답변·상담·CS" },
  {
    value: "grant_document",
    label: "사업계획서·지원사업",
    subtitle: "제출 문서·신청서",
  },
  {
    value: "business_document",
    label: "보고서·문서 작성",
    subtitle: "기획서·내부 문서",
  },
  {
    value: "marketing_content",
    label: "마케팅 콘텐츠",
    subtitle: "SNS·블로그·상세페이지",
  },
  { value: "unknown", label: "아직 못 정했어요", subtitle: "추천을 받아볼게요" },
] as const satisfies readonly {
  value: WorkType;
  label: string;
  subtitle: string;
}[];

export const workspaceMap = {
  customer_reply: {
    title: "고객 문의 응대",
    cta: "고객 문의 응대 확인하기",
    path: "/workspace/?job=customer_reply",
  },
  grant_document: {
    title: "사업계획서·지원사업",
    cta: "사업계획서·지원사업 확인하기",
    path: "/workspace/?job=grant_document",
  },
  business_document: {
    title: "보고서·문서 작성",
    cta: "보고서·문서 작성 확인하기",
    path: "/workspace/?job=business_document",
  },
  marketing_content: {
    title: "마케팅 콘텐츠",
    cta: "마케팅 콘텐츠 확인하기",
    path: "/workspace/?job=marketing_content",
  },
  unknown: {
    title: "추천 업무",
    cta: "추천 업무 확인하기",
    path: "/workspace/?job=unknown",
  },
} as const satisfies Record<
  WorkType,
  { title: string; cta: string; path: `/workspace/?job=${WorkType}` }
>;

const legacyWorkspaceAliases = {
  document_generation: "business_document",
  recommendation: "marketing_content",
  payment_refund_review: "customer_reply",
  grant_doc: "grant_document",
  marketing_copy: "marketing_content",
  internal_summary: "business_document",
  proposal_doc: "business_document",
} as const satisfies Record<string, WorkType>;

const defaultControlState = {
  customer_reply: {
    autonomy: "high",
    behaviorLogging: true,
    humanReview: false,
    driftMonitoring: true,
    riskLine: "사람 확인 없이 고객 답변 발송",
  },
  grant_document: {
    autonomy: "medium",
    behaviorLogging: false,
    humanReview: true,
    driftMonitoring: false,
    riskLine: "근거 확인 없이 제출 문서 작성",
  },
  business_document: {
    autonomy: "medium",
    behaviorLogging: true,
    humanReview: true,
    driftMonitoring: false,
    riskLine: "근거 부족한 보고 문장 사용",
  },
  marketing_content: {
    autonomy: "medium",
    behaviorLogging: true,
    humanReview: false,
    driftMonitoring: true,
    riskLine: "과장 표현이 외부에 노출",
  },
  unknown: {
    autonomy: "medium",
    behaviorLogging: false,
    humanReview: false,
    driftMonitoring: false,
    riskLine: "AI 사용 업무와 확인 기준이 불명확",
  },
} as const satisfies Record<WorkType, ControlState>;

const workRisk = {
  customer_reply: 12,
  grant_document: 10,
  business_document: 7,
  marketing_content: 8,
  unknown: 9,
} as const satisfies Record<WorkType, number>;

const adoptionScopeTitles = {
  customer_reply: "고객 답변에\nAI를 어디까지 쓸까요?",
  grant_document: "제출 문서에\nAI를 어디까지 쓸까요?",
  business_document: "문서 작성에\nAI를 어디까지 쓸까요?",
  marketing_content: "마케팅 콘텐츠에\nAI를 어디까지 쓸까요?",
  unknown: "먼저 어느 범위부터\n시작해볼까요?",
} as const satisfies Record<WorkType, string>;

const autonomyLabels = {
  high: "높음",
  medium: "보통",
  low: "낮음",
} as const satisfies Record<AutonomyLevel, string>;

export function getDefaultControlState(workType: WorkType): ControlState {
  return { ...defaultControlState[workType] };
}

export function getAutonomyLabel(autonomy: AutonomyLevel): string {
  return autonomyLabels[autonomy];
}

export function getAdoptionScopeTitle(workType: WorkType): string {
  return adoptionScopeTitles[workType];
}

export function calculateAssuranceResult(
  workType: WorkType,
  controls: ControlState,
): AssuranceResult {
  let score = 100;

  if (controls.autonomy === "high") score -= 18;
  if (!controls.behaviorLogging) score -= 18;
  if (!controls.humanReview) score -= 22;
  if (!controls.driftMonitoring) score -= 12;

  score -= workRisk[workType];

  const normalizedScore = clamp(score, 0, 100);
  const band = getAssuranceBand(normalizedScore);

  return {
    score: normalizedScore,
    band,
    bandLabel: bandLabels[band],
    riskLine: getRiskLine(controls),
    dailyLeakageEstimate: "₩180만",
    subsidyEstimate: "~₩3,000만",
  };
}

export function getWorkspaceByJob(job: string | null | undefined) {
  const workType = normalizeWorkType(job);
  return workspaceMap[workType];
}

export function isWorkType(value: string | null | undefined): value is WorkType {
  return typeof value === "string" && value in workspaceMap;
}

export function normalizeWorkType(value: string | null | undefined): WorkType {
  if (isWorkType(value)) return value;
  if (isLegacyWorkspaceAlias(value)) {
    return legacyWorkspaceAliases[value];
  }
  return "customer_reply";
}

function isLegacyWorkspaceAlias(
  value: string | null | undefined,
): value is keyof typeof legacyWorkspaceAliases {
  return typeof value === "string" && value in legacyWorkspaceAliases;
}

function getAssuranceBand(score: number): AssuranceBand {
  if (score >= 80) return "go";
  if (score >= 60) return "conditional";
  if (score >= 40) return "needs_verification";
  return "hold";
}

const bandLabels = {
  go: "즉시 GO",
  conditional: "조건부 GO",
  needs_verification: "검증 필요",
  hold: "도입 보류",
} as const satisfies Record<AssuranceBand, string>;

function getRiskLine(controls: ControlState): string {
  if (controls.riskLine) return controls.riskLine;
  if (!controls.driftMonitoring) {
    return "드리프트 감시 없이 성능 하락 누적";
  }
  if (!controls.behaviorLogging) {
    return "행동 로그 없이 의사결정 실행";
  }
  if (controls.autonomy === "high") {
    return "높은 자율성 범위에서 기준 미확인";
  }
  return "현재 통제 상태 유지 필요";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
