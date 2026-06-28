export const quickDiagnosisVersion =
  "2026-06-AgentProof-quick-diagnosis-storage-v1";

export type QuickWorkType =
  | "customer_reply"
  | "grant_document"
  | "business_document"
  | "marketing_content"
  | "unknown";
export type WorkType = QuickWorkType;

export type MonthlyVolume = "low" | "mid" | "high" | "unknown";
export type TimePerCase = "short" | "medium" | "long" | "unknown";
export type AdoptionScope =
  | "draft_only"
  | "reviewed_use"
  | "partial_automation"
  | "direct_use"
  | "unknown";
export type UsageScope = AdoptionScope;
export type Exposure = "external" | "executive" | "internal" | "unknown";
export type ProjectScale = "low" | "medium" | "high" | "enterprise";

export type SupportReviewAmount = {
  label: string;
  rangeLabel: string;
  averageAmount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
};

export type ResultMetricCard = {
  title: string;
  value: string;
  caption?: string;
};

export type ReferenceDiagnosisScreen = {
  id:
    | "awareness"
    | "work"
    | "monthly_volume"
    | "time_per_case"
    | "adoption_scope"
    | "exposure"
    | "result";
  stageLabel: string;
  title: string;
  subcopy?: string;
  pill?: string;
  trustNote?: string;
  cta: string;
};

export type DiagnosisOption<TValue extends string> = {
  value: TValue;
  label: string;
  subtitle: string;
};

export type AdoptionReportInput = {
  workType: QuickWorkType;
  monthlyVolume: MonthlyVolume;
  timePerCase: TimePerCase;
  adoptionScope: AdoptionScope;
  exposure: Exposure;
};

export type AdoptionReport = AdoptionReportInput & {
  workLabel: string;
  monthlyVolumeLabel: string;
  timePerCaseLabel: string;
  adoptionScopeLabel: string;
  exposureLabel: string;
  headline: string;
  natureLine: string;
  expectedValueCopy: string;
  timeEstimate: string;
  savingRate: string;
  monthlySavingAmount: string;
  adoptionScore: {
    score: number;
    label: string;
  };
  aiAdoptionScore: number;
  resultBand: string;
  savingRateMin: number;
  savingRateMax: number;
  savingHoursMin: number;
  savingHoursMax: number;
  savingMoneyMin: number;
  savingMoneyMax: number;
  supportReviewAverage: number | null;
  supportReviewMin: number | null;
  supportReviewMax: number | null;
  projectScale: ProjectScale;
  hourlyCost: number;
  supportReview: SupportReviewAmount;
  supportDisclaimer: string;
  metricCards: readonly ResultMetricCard[];
  method: string;
  reviewPoints: readonly [string, string, string];
  pilotItems: readonly [string, string, string];
  pilotSize: string;
  supportNote: string;
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
    subcopy: "가장 먼저 확인할 업무를 골라주세요.",
    cta: "다음",
  },
  {
    id: "monthly_volume",
    stageLabel: "건수",
    title: "한 달에\n몇 건인가요?",
    subcopy: "대략 골라도 괜찮아요.",
    cta: "다음",
  },
  {
    id: "time_per_case",
    stageLabel: "시간",
    title: "한 건에\n얼마나 걸리나요?",
    subcopy: "평소 기준으로 골라주세요.",
    cta: "다음",
  },
  {
    id: "adoption_scope",
    stageLabel: "범위",
    title: "AI에게 어디까지\n맡길까요?",
    subcopy: "처음엔 작게 시작하는 편이 안전합니다.",
    cta: "다음",
  },
  {
    id: "exposure",
    stageLabel: "전달",
    title: "결과는 어디에\n쓰이나요?",
    subcopy: "나가는 곳에 따라 확인 기준이 달라요.",
    cta: "결과 보기",
  },
  {
    id: "result",
    stageLabel: "결과",
    title: "AI 도입 간단 점검 결과",
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
] as const satisfies readonly DiagnosisOption<QuickWorkType>[];

export const monthlyVolumeOptions = [
  { value: "low", label: "10건 이하", subtitle: "작게 시험" },
  { value: "mid", label: "10~50건", subtitle: "반복 업무" },
  { value: "high", label: "50건 이상", subtitle: "효과 확인" },
  { value: "unknown", label: "잘 모르겠어요", subtitle: "추천 기준으로" },
] as const satisfies readonly DiagnosisOption<MonthlyVolume>[];

export const timePerCaseOptions = [
  { value: "short", label: "10분 이하", subtitle: "짧은 처리" },
  { value: "medium", label: "30분 안팎", subtitle: "조금 걸림" },
  { value: "long", label: "1시간 이상", subtitle: "작성·검토 필요" },
  { value: "unknown", label: "잘 모르겠어요", subtitle: "대략 계산" },
] as const satisfies readonly DiagnosisOption<TimePerCase>[];

export const adoptionScopeOptions = [
  { value: "draft_only", label: "초안까지 만들기", subtitle: "사람이 고쳐서 사용" },
  { value: "reviewed_use", label: "확인 후 사용", subtitle: "담당자가 보고 사용" },
  {
    value: "partial_automation",
    label: "일부 자동화",
    subtitle: "정해진 기준 안에서 처리",
  },
  { value: "direct_use", label: "바로 사용", subtitle: "낮은 위험 업무만" },
  { value: "unknown", label: "아직 모르겠습니다", subtitle: "추천을 받아보고 싶음" },
] as const satisfies readonly DiagnosisOption<AdoptionScope>[];

export const usageScopeOptions = adoptionScopeOptions;

export const exposureOptions = [
  { value: "external", label: "고객·기관에 나갑니다", subtitle: "외부 전달" },
  { value: "executive", label: "대표·팀장에게 보고합니다", subtitle: "의사결정 자료" },
  { value: "internal", label: "내부에서만 봅니다", subtitle: "팀 공유·정리" },
  { value: "unknown", label: "아직 정하지 않았습니다", subtitle: "먼저 확인" },
] as const satisfies readonly DiagnosisOption<Exposure>[];

export const workRisk = {
  customer_reply: 12,
  grant_document: 10,
  business_document: 7,
  marketing_content: 8,
  unknown: 9,
} as const satisfies Record<QuickWorkType, number>;

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
  QuickWorkType,
  { title: string; cta: string; path: `/workspace/?job=${QuickWorkType}` }
>;

const legacyWorkspaceAliases = {
  document_generation: "business_document",
  recommendation: "marketing_content",
  payment_refund_review: "customer_reply",
  grant_doc: "grant_document",
  marketing_copy: "marketing_content",
  internal_summary: "business_document",
  proposal_doc: "business_document",
} as const satisfies Record<string, QuickWorkType>;

const workHeadlines = {
  customer_reply: "고객 문의 응대부터\n시작해보세요",
  grant_document: "사업계획서 작성부터\n시작해보세요",
  business_document: "보고서·문서 작성부터\n시작해보세요",
  marketing_content: "마케팅 콘텐츠부터\n시작해보세요",
  unknown: "부담이 낮은 업무부터\n정해보세요",
} as const satisfies Record<QuickWorkType, string>;

const exposureLines = {
  external: "외부로 나가는 결과물이므로 사람 확인 기준이 필요합니다.",
  executive: "보고용 자료라 근거 확인이 중요합니다.",
  internal: "내부 업무부터 작게 시작하기 좋습니다.",
  unknown: "먼저 결과가 쓰일 곳을 정하는 편이 좋습니다.",
} as const satisfies Record<Exposure, string>;

const methodCopy = {
  draft_only: "AI는 초안 작성까지 사용하고, 담당자가 수정하세요.",
  reviewed_use: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
  partial_automation: "정해진 기준 안에서 일부 반복 업무만 자동화하세요.",
  direct_use: "낮은 위험 업무에서만 바로 사용하세요.",
  unknown: "먼저 작은 업무 1개에서 초안 작성부터 시작하세요.",
} as const satisfies Record<AdoptionScope, string>;

const reviewPoints = {
  customer_reply: ["개인정보", "환불·계약", "고객 불만"],
  grant_document: ["성과 수치", "근거 문장", "제출 전 최종 검토"],
  business_document: ["수치 근거", "외부 공유", "예산·계약 문장"],
  marketing_content: ["과장 표현", "가격·효과", "고객 오해"],
  unknown: ["개인정보", "외부 전달", "금액·계약"],
} as const satisfies Record<QuickWorkType, readonly [string, string, string]>;

const pilotItems = {
  customer_reply: ["실제 절감 시간", "처리한 문의 수", "사람이 고친 답변"],
  grant_document: ["초안 작성 시간", "근거 확인 항목", "최종 제출 가능 비율"],
  business_document: ["작성 시간", "수치 근거 확인", "다시 쓸 수 있는 문장"],
  marketing_content: ["표현 수정 비율", "최종 결과물 만족도", "고객 오해 가능성"],
  unknown: ["효과가 큰 업무", "위험이 낮은 업무", "계속 쓸 수 있는 업무"],
} as const satisfies Record<QuickWorkType, readonly [string, string, string]>;

const pilotSize = {
  customer_reply: "문의 20건 기준",
  grant_document: "문서 3~5건 기준",
  business_document: "문서 5건 기준",
  marketing_content: "콘텐츠 10건 기준",
  unknown: "작은 업무 1개 기준",
} as const satisfies Record<QuickWorkType, string>;

const supportNote =
  "AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다.";

const supportDisclaimer =
  "예상 수치입니다. 지원사업은 공고와 기업 요건에 따라 달라집니다.";

export const defaultHourlyCost = 30_000;

const savingsRate = {
  customer_reply: { min: 0.1, max: 0.25 },
  grant_document: { min: 0.15, max: 0.35 },
  business_document: { min: 0.15, max: 0.4 },
  marketing_content: { min: 0.2, max: 0.45 },
  unknown: { min: 0.1, max: 0.2 },
} as const satisfies Record<QuickWorkType, { min: number; max: number }>;

const volumeMap = {
  low: { min: 1, max: 10 },
  mid: { min: 10, max: 50 },
  high: { min: 50, max: 120 },
  unknown: { min: 10, max: 30 },
} as const satisfies Record<MonthlyVolume, { min: number; max: number }>;

const timeMap = {
  short: { min: 5, max: 10 },
  medium: { min: 20, max: 40 },
  long: { min: 60, max: 90 },
  unknown: { min: 15, max: 30 },
} as const satisfies Record<TimePerCase, { min: number; max: number }>;

const projectBudgetRange = {
  low: { min: 3_000_000, max: 8_000_000 },
  medium: { min: 8_000_000, max: 20_000_000 },
  high: { min: 20_000_000, max: 50_000_000 },
  enterprise: null,
} as const satisfies Record<
  ProjectScale,
  { min: number; max: number } | null
>;

const supportRate = {
  min: 0.4,
  max: 0.7,
} as const;

const volumeRisk = {
  low: 2,
  mid: 6,
  high: 10,
  unknown: 8,
} as const satisfies Record<MonthlyVolume, number>;

const timeRisk = {
  short: 2,
  medium: 5,
  long: 8,
  unknown: 6,
} as const satisfies Record<TimePerCase, number>;

const adoptionScopeRisk = {
  draft_only: 4,
  reviewed_use: 6,
  partial_automation: 12,
  direct_use: 18,
  unknown: 10,
} as const satisfies Record<AdoptionScope, number>;

const exposureRisk = {
  external: 24,
  executive: 12,
  internal: 3,
  unknown: 10,
} as const satisfies Record<Exposure, number>;

export function buildAdoptionReport(input: AdoptionReportInput): AdoptionReport {
  const volume = volumeMap[input.monthlyVolume];
  const time = timeMap[input.timePerCase];
  const rate = savingsRate[input.workType];
  const monthlyHoursMin = (volume.min * time.min) / 60;
  const monthlyHoursMax = (volume.max * time.max) / 60;
  const rawSavingHoursMin = monthlyHoursMin * rate.min;
  const rawSavingHoursMax = monthlyHoursMax * rate.max;
  const savingHoursMin = round4(rawSavingHoursMin);
  const savingHoursMax = round4(rawSavingHoursMax);
  const savingMoneyMin = Math.round(rawSavingHoursMin * defaultHourlyCost);
  const savingMoneyMax = Math.round(rawSavingHoursMax * defaultHourlyCost);
  const projectScale = getProjectScale({
    workType: input.workType,
    monthlyVolume: input.monthlyVolume,
    savingHoursMax,
    adoptionScope: input.adoptionScope,
    exposure: input.exposure,
  });
  const supportReview = getSupportReviewAmount(projectScale);
  const adoptionScore = getAdoptionScore(input);
  const timeEstimate = formatSavingHours(savingHoursMin, savingHoursMax);
  const savingRateLabel = `${formatPercent(rate.min)}~${formatPercent(rate.max)}%`;
  const monthlySavingAmount = formatKrwRange(savingMoneyMin, savingMoneyMax);
  const expectedValueCopy = `입력한 업무량 기준으로 ${timeEstimate} 절감 여지를 확인합니다.`;
  const metricCards = [
    {
      title: "AI 도입 점수",
      value: `${adoptionScore.score}점`,
      caption: adoptionScore.label,
    },
    {
      title: "예상 절감률",
      value: savingRateLabel,
    },
    {
      title: "예상 절감 시간",
      value: timeEstimate,
    },
    {
      title: "월 절감 금액",
      value: monthlySavingAmount,
    },
    {
      title: "지원사업 검토 평균",
      value: supportReview.label,
      caption: supportReview.rangeLabel,
    },
    {
      title: "30일 파일럿",
      value: pilotSize[input.workType],
    },
  ] as const satisfies readonly ResultMetricCard[];

  return {
    ...input,
    workLabel: getOptionLabel(workOptions, input.workType),
    monthlyVolumeLabel: getOptionLabel(monthlyVolumeOptions, input.monthlyVolume),
    timePerCaseLabel: getOptionLabel(timePerCaseOptions, input.timePerCase),
    adoptionScopeLabel: getOptionLabel(adoptionScopeOptions, input.adoptionScope),
    exposureLabel: getOptionLabel(exposureOptions, input.exposure),
    headline: workHeadlines[input.workType],
    natureLine: exposureLines[input.exposure],
    expectedValueCopy,
    timeEstimate,
    savingRate: savingRateLabel,
    monthlySavingAmount,
    adoptionScore,
    aiAdoptionScore: adoptionScore.score,
    resultBand: adoptionScore.label,
    savingRateMin: rate.min,
    savingRateMax: rate.max,
    savingHoursMin,
    savingHoursMax,
    savingMoneyMin,
    savingMoneyMax,
    supportReviewAverage: supportReview.averageAmount,
    supportReviewMin: supportReview.minAmount,
    supportReviewMax: supportReview.maxAmount,
    projectScale,
    hourlyCost: defaultHourlyCost,
    supportReview,
    supportDisclaimer,
    metricCards,
    method: methodCopy[input.adoptionScope],
    reviewPoints: reviewPoints[input.workType],
    pilotItems: pilotItems[input.workType],
    pilotSize: pilotSize[input.workType],
    supportNote,
  };
}

export function getProjectScale({
  adoptionScope,
  exposure,
  monthlyVolume,
  savingHoursMax,
  workType,
}: {
  workType: QuickWorkType;
  monthlyVolume: MonthlyVolume;
  savingHoursMax: number;
  adoptionScope: AdoptionScope;
  exposure: Exposure;
}): ProjectScale {
  let score = 0;

  if (workType !== "unknown") score += 20;
  if (monthlyVolume === "mid") score += 15;
  if (monthlyVolume === "high") score += 25;
  if (savingHoursMax >= 3) score += 15;
  if (savingHoursMax >= 12) score += 25;
  if (adoptionScope === "reviewed_use") score += 10;
  if (adoptionScope === "partial_automation") score += 20;
  if (adoptionScope === "direct_use") score += 10;
  if (exposure === "external") score += 10;
  if (exposure === "executive") score += 5;

  if (score < 35) return "low";
  if (score < 65) return "medium";
  if (score < 90) return "high";
  return "enterprise";
}

export function getSupportReviewAmount(
  projectScale: ProjectScale,
): SupportReviewAmount {
  if (projectScale === "enterprise") {
    return {
      label: "별도 산정",
      rangeLabel: "도입 범위 확인 필요",
      averageAmount: null,
      minAmount: null,
      maxAmount: null,
    };
  }

  const budget = projectBudgetRange[projectScale];
  const min = Math.round(budget.min * supportRate.min);
  const max = Math.round(budget.max * supportRate.max);
  const average = Math.round((min + max) / 2);

  return {
    label: `약 ${formatKrw(average)}`,
    rangeLabel: `검토 범위 ${formatKrwRange(min, max)}`,
    averageAmount: average,
    minAmount: min,
    maxAmount: max,
  };
}

export function formatKrw(value: number): string {
  const rounded = Math.round(value / 10_000) * 10_000;

  if (rounded > 0 && rounded < 10_000) {
    return "1만원 미만";
  }
  if (rounded < 100_000_000) {
    return `${Math.round(rounded / 10_000).toLocaleString()}만원`;
  }

  return `${(rounded / 100_000_000).toFixed(1)}억원`;
}

export function formatResultSummary(report: AdoptionReport): string {
  return [
    "AgentProof AI 도입 간단 점검 결과",
    "",
    `추천 업무: ${report.workLabel}`,
    `월 처리량: ${report.monthlyVolumeLabel}`,
    `건당 소요시간: ${report.timePerCaseLabel}`,
    `사용 범위: ${report.adoptionScopeLabel}`,
    `결과 사용처: ${report.exposureLabel}`,
    `권장 방식: ${report.method}`,
    "",
    "기대효과:",
    report.expectedValueCopy,
    "",
    `AI 도입 점수: ${report.aiAdoptionScore}점 (${report.resultBand})`,
    `예상 절감률: ${report.savingRate}`,
    `예상 절감 시간: ${report.timeEstimate}`,
    `월 절감 금액: ${report.monthlySavingAmount}`,
    `지원사업 검토 평균: ${report.supportReview.label}`,
    report.supportReview.rangeLabel,
    `30일 파일럿: ${report.pilotSize}`,
    "",
    "사람이 봐야 하는 경우:",
    "",
    ...report.reviewPoints.map((item) => `- ${item}`),
    "",
    "30일 파일럿에서 확인할 것:",
    "",
    ...report.pilotItems.map((item) => `- ${item}`),
    "",
    "지원사업 준비 자료로 활용할 수 있습니다.",
    report.supportDisclaimer,
  ].join("\n");
}

export function getWorkspaceByJob(job: string | null | undefined) {
  const workType = normalizeWorkType(job);
  return workspaceMap[workType];
}

export function isWorkType(value: string | null | undefined): value is QuickWorkType {
  return typeof value === "string" && value in workspaceMap;
}

export function normalizeWorkType(value: string | null | undefined): QuickWorkType {
  if (isWorkType(value)) return value;
  if (isLegacyWorkspaceAlias(value)) {
    return legacyWorkspaceAliases[value];
  }
  return "customer_reply";
}

function getAdoptionScore({
  adoptionScope,
  exposure,
  monthlyVolume,
  timePerCase,
  workType,
}: AdoptionReportInput): { score: number; label: string } {
  const risk =
    workRisk[workType] +
    volumeRisk[monthlyVolume] +
    timeRisk[timePerCase] +
    adoptionScopeRisk[adoptionScope] +
    exposureRisk[exposure];
  const score = Math.max(0, Math.min(100, Math.round(100 - risk)));
  const label =
    score >= 80
      ? "파일럿 적합"
      : score >= 65
        ? "조건부 시작"
        : score >= 50
          ? "확인 필요"
          : "업무 선정 필요";

  return { score, label };
}

function formatSavingHours(min: number, max: number): string {
  if (max < 1) {
    return "월 1시간 미만";
  }
  return `월 ${formatHour(min)}~${formatHour(max)}시간`;
}

function formatHour(value: number): string {
  if (value < 1) return "1";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatPercent(value: number): string {
  return String(Math.round(value * 100));
}

function formatKrwRange(min: number, max: number): string {
  const minLabel = formatKrw(min);
  const maxLabel = formatKrw(max);

  if (minLabel.endsWith("만원") && maxLabel.endsWith("만원")) {
    return `${minLabel.slice(0, -2)}만~${maxLabel}`;
  }

  return `${minLabel}~${maxLabel}`;
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

function getOptionLabel<TValue extends string>(
  options: readonly DiagnosisOption<TValue>[],
  value: TValue,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function isLegacyWorkspaceAlias(
  value: string | null | undefined,
): value is keyof typeof legacyWorkspaceAliases {
  return typeof value === "string" && value in legacyWorkspaceAliases;
}
