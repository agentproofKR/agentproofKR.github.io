export const quickDiagnosisVersion =
  "2026-06-AgentProof-four-page-adoption-report-v1";

export type WorkType =
  | "customer_reply"
  | "grant_document"
  | "business_document"
  | "marketing_content"
  | "unknown";

export type EffortVolume = "low" | "mid" | "high" | "unknown";
export type EffortTime = "short" | "medium" | "long" | "unknown";
export type ExposureScope = "external" | "executive" | "internal";

export type AdoptionInputState = {
  volume: EffortVolume;
  time: EffortTime;
  exposure: ExposureScope;
};

export type PartialAdoptionInputState = {
  volume: EffortVolume | null;
  time: EffortTime | null;
  exposure: ExposureScope | null;
};

export type AdoptionEffectResult = {
  monthlyHoursMin: number;
  monthlyHoursMax: number;
  savingHoursMin: number;
  savingHoursMax: number;
  monthlyHoursRange: string;
  savingHoursRange: string;
  estimateLabel: "예상 범위";
  exposureLabel: string;
};

export type MiniReport = {
  headline: string;
  method: string;
  reviewPoints: readonly [string, string, string];
  pilotItems: readonly [string, string, string];
  pilotSize: string;
  supportNote: string;
};

export type EffortQuestionGroup =
  | {
      id: "volume";
      label: string;
      options: readonly { value: EffortVolume; label: string }[];
    }
  | {
      id: "time";
      label: string;
      options: readonly { value: EffortTime; label: string }[];
    }
  | {
      id: "exposure";
      label: string;
      options: readonly { value: ExposureScope; label: string }[];
    };

export type ReferenceDiagnosisScreen = {
  id: "awareness" | "work" | "calculator" | "report";
  stageLabel: string;
  title: string;
  subcopy?: string;
  pill?: string;
  trustNote?: string;
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
    id: "calculator",
    stageLabel: "계산",
    title: "효과를 계산해볼게요",
    subcopy: "대략 골라도 괜찮아요",
    cta: "결과 보기",
  },
  {
    id: "report",
    stageLabel: "리포트",
    title: "AI 도입 간단 리포트",
    cta: "30일 파일럿 설계 받기",
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

export const effortQuestionGroups = [
  {
    id: "volume",
    label: "한 달에 몇 건 정도인가요?",
    options: [
      { value: "low", label: "10건 이하" },
      { value: "mid", label: "10~50건" },
      { value: "high", label: "50건 이상" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
  {
    id: "time",
    label: "한 건에 얼마나 걸리나요?",
    options: [
      { value: "short", label: "10분 이하" },
      { value: "medium", label: "30분 안팎" },
      { value: "long", label: "1시간 이상" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
  },
  {
    id: "exposure",
    label: "결과가 어디로 나가나요?",
    options: [
      { value: "external", label: "고객·기관" },
      { value: "executive", label: "대표·팀장" },
      { value: "internal", label: "내부용" },
    ],
  },
] as const satisfies readonly EffortQuestionGroup[];

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

const volumeMap = {
  low: { min: 1, max: 10 },
  mid: { min: 10, max: 50 },
  high: { min: 50, max: 120 },
  unknown: { min: 10, max: 30 },
} as const satisfies Record<EffortVolume, { min: number; max: number }>;

const timeMap = {
  short: { min: 5, max: 10 },
  medium: { min: 20, max: 40 },
  long: { min: 60, max: 90 },
  unknown: { min: 15, max: 30 },
} as const satisfies Record<EffortTime, { min: number; max: number }>;

const savingsRate = {
  customer_reply: { min: 0.25, max: 0.45 },
  grant_document: { min: 0.2, max: 0.35 },
  business_document: { min: 0.2, max: 0.4 },
  marketing_content: { min: 0.25, max: 0.45 },
  unknown: { min: 0.15, max: 0.3 },
} as const satisfies Record<WorkType, { min: number; max: number }>;

const exposureLabels = {
  external: "고객·기관 전달",
  executive: "대표·팀장 보고",
  internal: "내부 참고",
} as const satisfies Record<ExposureScope, string>;

const miniReportCopy = {
  customer_reply: {
    headline: "고객 문의 응대부터\n시작해보세요",
    reviewPoints: ["개인정보", "환불·계약", "고객 불만"],
    pilotSize: "문의 20건 기준",
  },
  grant_document: {
    headline: "사업계획서 작성부터\n시작해보세요",
    reviewPoints: ["성과 수치", "근거 문장", "제출 전 최종 검토"],
    pilotSize: "문서 3~5건 기준",
  },
  business_document: {
    headline: "보고서·문서 작성부터\n시작해보세요",
    reviewPoints: ["수치 근거", "외부 공유", "예산·계약 문장"],
    pilotSize: "문서 5건 기준",
  },
  marketing_content: {
    headline: "마케팅 콘텐츠부터\n시작해보세요",
    reviewPoints: ["과장 표현", "가격·효과", "고객 오해"],
    pilotSize: "콘텐츠 10건 기준",
  },
  unknown: {
    headline: "부담이 낮은 업무부터\n정해보세요",
    reviewPoints: ["개인정보", "외부 전달", "금액·계약"],
    pilotSize: "작은 업무 1개 기준",
  },
} as const satisfies Record<
  WorkType,
  {
    headline: string;
    reviewPoints: readonly [string, string, string];
    pilotSize: string;
  }
>;

const pilotItems = [
  "실제 절감 시간",
  "수정 필요한 결과 비율",
  "사람이 봐야 하는 유형",
] as const satisfies readonly [string, string, string];

export function calculateAdoptionEffect(
  workType: WorkType,
  input: AdoptionInputState,
): AdoptionEffectResult {
  const volume = volumeMap[input.volume];
  const time = timeMap[input.time];
  const rate = savingsRate[workType];
  const monthlyHoursMin = (volume.min * time.min) / 60;
  const monthlyHoursMax = (volume.max * time.max) / 60;
  const savingHoursMin = monthlyHoursMin * rate.min;
  const savingHoursMax = monthlyHoursMax * rate.max;

  return {
    monthlyHoursMin,
    monthlyHoursMax,
    savingHoursMin,
    savingHoursMax,
    monthlyHoursRange: formatEstimatedHours(monthlyHoursMin, monthlyHoursMax),
    savingHoursRange: formatEstimatedHours(savingHoursMin, savingHoursMax),
    estimateLabel: "예상 범위",
    exposureLabel: exposureLabels[input.exposure],
  };
}

export function buildMiniReport(workType: WorkType): MiniReport {
  const copy = miniReportCopy[workType];

  return {
    headline: copy.headline,
    method:
      workType === "unknown"
        ? "작은 업무 1개 선택 → 초안 작성 → 담당자 확인"
        : "AI 초안 작성 → 담당자 확인",
    reviewPoints: copy.reviewPoints,
    pilotItems,
    pilotSize: copy.pilotSize,
    supportNote: "AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다.",
  };
}

export function formatResultSummary(
  workLabel: string,
  effect: AdoptionEffectResult,
  report: MiniReport,
): string {
  return [
    "AgentProof AI 도입 간단 점검 결과",
    "",
    `추천 업무: ${workLabel}`,
    `예상 업무량: ${formatMonthlyEstimate(effect.monthlyHoursRange)}`,
    `예상 절감: ${formatMonthlyEstimate(effect.savingHoursRange)}`,
    "",
    "권장 방식:",
    report.method,
    "",
    "사람이 봐야 하는 경우:",
    "",
    ...report.reviewPoints.map((item) => `* ${item}`),
    "",
    "30일 파일럿에서 확인할 것:",
    "",
    ...report.pilotItems.map((item) => `* ${item}`),
    "",
    "지원사업 준비 자료로 활용할 수 있습니다.",
  ].join("\n");
}

export function formatMonthlyEstimate(range: string): string {
  return range.includes("시간") ? `월 ${range}` : `월 ${range}시간`;
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

function formatEstimatedHours(min: number, max: number): string {
  const roundedMax = Math.max(Math.round(max), Math.ceil(min), 1);

  if (roundedMax <= 3) {
    return "1~3";
  }
  if (roundedMax <= 12) {
    return "4~12";
  }
  return "15시간 이상";
}

function isLegacyWorkspaceAlias(
  value: string | null | undefined,
): value is keyof typeof legacyWorkspaceAliases {
  return typeof value === "string" && value in legacyWorkspaceAliases;
}
