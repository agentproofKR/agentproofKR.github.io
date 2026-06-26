export const quickDiagnosisVersion =
  "2026-06-AgentProof-reference-six-screen-v1";

export type WorkType =
  | "customer_reply"
  | "document_generation"
  | "recommendation"
  | "payment_refund_review";

export type AutonomyLevel = "high" | "medium" | "low";

export type ControlState = {
  autonomy: AutonomyLevel;
  behaviorLogging: boolean;
  humanReview: boolean;
  driftMonitoring: boolean;
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
  analysisText?: string;
  riskTitle?: string;
  alertTitle?: string;
  cta: string;
};

export const referenceDiagnosisScreens = [
  {
    id: "awareness",
    stageLabel: "시작",
    title: "당신의 AI,\n믿어도 되나요?",
    subcopy: "도입 전 · 무료 3초 진단",
    pill: "+ 받을 수 있는 지원금",
    cta: "무료 진단 시작",
  },
  {
    id: "work",
    stageLabel: "업무",
    title: "어떤 업무에\nAI를 도입하나요?",
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
    cta: "정밀 검증 신청",
  },
  {
    id: "validation",
    stageLabel: "전환",
    title: "정밀 검증 신청",
    cta: "신청 보내기",
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
  { value: "customer_reply", label: "고객 문의 응대" },
  { value: "document_generation", label: "문서 자동 작성" },
  { value: "recommendation", label: "상품·콘텐츠 추천" },
  { value: "payment_refund_review", label: "결제·환불 심사" },
] as const satisfies readonly { value: WorkType; label: string }[];

export const workspaceMap = {
  customer_reply: {
    title: "고객 문의 응대",
    cta: "고객 문의 응대 확인하기",
    path: "/workspace/?job=customer_reply",
  },
  document_generation: {
    title: "문서 자동 작성",
    cta: "문서 자동 작성 확인하기",
    path: "/workspace/?job=document_generation",
  },
  recommendation: {
    title: "상품·콘텐츠 추천",
    cta: "추천 업무 확인하기",
    path: "/workspace/?job=recommendation",
  },
  payment_refund_review: {
    title: "결제·환불 심사",
    cta: "결제·환불 심사 확인하기",
    path: "/workspace/?job=payment_refund_review",
  },
} as const satisfies Record<
  WorkType,
  { title: string; cta: string; path: `/workspace/?job=${WorkType}` }
>;

const legacyWorkspaceAliases = {
  grant_doc: "document_generation",
  marketing_copy: "recommendation",
  internal_summary: "document_generation",
  proposal_doc: "document_generation",
} as const satisfies Record<string, WorkType>;

const defaultControlState = {
  customer_reply: {
    autonomy: "high",
    behaviorLogging: true,
    humanReview: false,
    driftMonitoring: true,
  },
  document_generation: {
    autonomy: "medium",
    behaviorLogging: true,
    humanReview: true,
    driftMonitoring: false,
  },
  recommendation: {
    autonomy: "medium",
    behaviorLogging: true,
    humanReview: false,
    driftMonitoring: true,
  },
  payment_refund_review: {
    autonomy: "high",
    behaviorLogging: false,
    humanReview: false,
    driftMonitoring: false,
  },
} as const satisfies Record<WorkType, ControlState>;

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

export function calculateAssuranceResult(
  workType: WorkType,
  controls: ControlState,
): AssuranceResult {
  let score = 100;

  if (controls.autonomy === "high") score -= 18;
  if (!controls.behaviorLogging) score -= 18;
  if (!controls.humanReview) score -= 22;
  if (!controls.driftMonitoring) score -= 12;

  if (workType === "payment_refund_review") score -= 10;
  if (workType === "customer_reply") score -= 8;
  if (workType === "document_generation") score -= 5;
  if (workType === "recommendation") score -= 6;

  const normalizedScore = clamp(score, 0, 100);
  const band = getAssuranceBand(normalizedScore);

  return {
    score: normalizedScore,
    band,
    bandLabel: bandLabels[band],
    riskLine: getRiskLine(workType, controls),
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

function getRiskLine(workType: WorkType, controls: ControlState): string {
  if (workType === "payment_refund_review" && !controls.humanReview) {
    return "사람 검토 없이 환불 자동 승인";
  }
  if (workType === "recommendation" && !controls.behaviorLogging) {
    return "행동 로그 없이 추천 기준 변경";
  }
  if (workType === "customer_reply" && !controls.humanReview) {
    return "사람 검토 없이 고객 답변 발송";
  }
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
