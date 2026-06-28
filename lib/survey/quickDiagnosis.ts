export const quickDiagnosisVersion =
  "2026-06-AgentProof-adoption-mini-report-v2";

export type WorkType =
  | "customer_reply"
  | "grant_document"
  | "business_document"
  | "marketing_content"
  | "unknown";

export type AdoptionPurpose =
  | "save_time"
  | "first_draft"
  | "reduce_mistakes"
  | "improve_quality"
  | "find_use_case";

export type WorkNature =
  | "repetitive"
  | "important_low_frequency"
  | "external_output"
  | "internal_decision"
  | "unclear";

export type UsageScope =
  | "idea_only"
  | "draft_only"
  | "reviewed_use"
  | "partial_automation"
  | "unknown";

export type VolumeLevel = "low" | "mid" | "high";
export type SupportAdoptionScope =
  | "unknown"
  | "reviewed_use"
  | "partial_automation"
  | "direct_use";
export type ExposureLevel = "unknown" | "external" | "executive";
export type ProjectScale = "low" | "medium" | "high" | "enterprise";

export type SupportReviewAmount = {
  label: string;
  rangeLabel: string;
  averageAmount: number | null;
};

export type ResultMetricCard = {
  title: string;
  value: string;
  caption?: string;
};

export type ReferenceDiagnosisScreen = {
  id: "awareness" | "work" | "purpose" | "nature" | "scope" | "result";
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

export type AdoptionReport = {
  workLabel: string;
  purposeLabel: string;
  natureLabel: string;
  scopeLabel: string;
  headline: string;
  natureLine: string;
  expectedValueCopy: string;
  timeEstimate: string | null;
  savingRate: string;
  monthlySavingAmount: string;
  adoptionScore: {
    score: number;
    label: string;
  };
  supportReview: SupportReviewAmount;
  supportDisclaimer: string;
  metricCards: readonly ResultMetricCard[];
  valueItems: readonly [string, string, string] | null;
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
    id: "purpose",
    stageLabel: "목적",
    title: "AI로 무엇을\n얻고 싶나요?",
    subcopy: "가장 가까운 이유를 골라주세요.",
    cta: "다음",
  },
  {
    id: "nature",
    stageLabel: "성격",
    title: "이 업무는\n어떤 성격인가요?",
    subcopy: "성격에 따라 판단 기준이 달라집니다.",
    cta: "다음",
  },
  {
    id: "scope",
    stageLabel: "범위",
    title: "AI에게 어디까지\n맡길까요?",
    subcopy: "처음엔 작게 시작하는 편이 안전합니다.",
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
] as const satisfies readonly DiagnosisOption<WorkType>[];

export const adoptionPurposeOptions = [
  {
    value: "save_time",
    label: "시간을 줄이고 싶어요",
    subtitle: "반복되는 일을 빠르게",
  },
  {
    value: "first_draft",
    label: "초안을 빨리 만들고 싶어요",
    subtitle: "처음부터 쓰기 막막해서",
  },
  {
    value: "reduce_mistakes",
    label: "빠뜨린 걸 줄이고 싶어요",
    subtitle: "누락·실수를 줄이고 싶어서",
  },
  {
    value: "improve_quality",
    label: "결과물을 더 좋게 만들고 싶어요",
    subtitle: "문장·구성·표현을 다듬고 싶어서",
  },
  {
    value: "find_use_case",
    label: "어디에 쓰면 좋을지 알고 싶어요",
    subtitle: "AI 도입 방향을 못 정해서",
  },
] as const satisfies readonly DiagnosisOption<AdoptionPurpose>[];

export const workNatureOptions = [
  {
    value: "repetitive",
    label: "자주 반복됩니다",
    subtitle: "매주 또는 매월 계속 발생",
  },
  {
    value: "important_low_frequency",
    label: "가끔이지만 중요합니다",
    subtitle: "제출·보고·계약처럼 영향이 큼",
  },
  {
    value: "external_output",
    label: "고객이나 기관에 나갑니다",
    subtitle: "외부에 전달되는 결과물",
  },
  {
    value: "internal_decision",
    label: "내부 판단에 씁니다",
    subtitle: "대표·팀장·팀원이 보는 자료",
  },
  {
    value: "unclear",
    label: "아직 잘 모르겠습니다",
    subtitle: "먼저 기준을 잡고 싶음",
  },
] as const satisfies readonly DiagnosisOption<WorkNature>[];

export const usageScopeOptions = [
  {
    value: "idea_only",
    label: "아이디어만 받기",
    subtitle: "방향·구성 참고",
  },
  {
    value: "draft_only",
    label: "초안까지 만들기",
    subtitle: "사람이 고쳐서 사용",
  },
  {
    value: "reviewed_use",
    label: "확인 후 사용",
    subtitle: "담당자가 보고 사용",
  },
  {
    value: "partial_automation",
    label: "일부 자동화",
    subtitle: "정해진 기준 안에서 처리",
  },
  {
    value: "unknown",
    label: "아직 모르겠습니다",
    subtitle: "추천을 받아보고 싶음",
  },
] as const satisfies readonly DiagnosisOption<UsageScope>[];

export const workRisk = {
  customer_reply: 12,
  grant_document: 10,
  business_document: 7,
  marketing_content: 8,
  unknown: 9,
} as const satisfies Record<WorkType, number>;

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

const workHeadlines = {
  customer_reply: "고객 문의 응대부터\n시작해보세요",
  grant_document: "사업계획서 작성부터\n시작해보세요",
  business_document: "보고서·문서 작성부터\n시작해보세요",
  marketing_content: "마케팅 콘텐츠부터\n시작해보세요",
  unknown: "부담이 낮은 업무부터\n정해보세요",
} as const satisfies Record<WorkType, string>;

const natureLines = {
  repetitive: "반복성이 있어 작은 파일럿으로 효과를 보기 좋습니다.",
  important_low_frequency: "자주 하지는 않지만 결과 영향이 큰 업무입니다.",
  external_output: "외부로 나가는 결과물이므로 사람 확인 기준이 필요합니다.",
  internal_decision: "내부 의사결정에 쓰이는 만큼 근거 확인이 중요합니다.",
  unclear: "먼저 위험이 낮은 업무 1개를 정해보는 것이 좋습니다.",
} as const satisfies Record<WorkNature, string>;

const expectedValueCopy = {
  save_time: "반복 업무 시간을 줄이는 데 초점을 둡니다.",
  first_draft: "첫 초안을 빠르게 만들고 시작 부담을 줄입니다.",
  reduce_mistakes: "누락과 실수를 줄이는 기준을 만들 수 있습니다.",
  improve_quality: "문장·구성·표현을 다듬는 데 도움이 됩니다.",
  find_use_case: "어디부터 시작할지 정하는 데 도움이 됩니다.",
} as const satisfies Record<AdoptionPurpose, string>;

const monthlySavingHours = {
  customer_reply: { min: 4, max: 12 },
  grant_document: { min: 3, max: 8 },
  business_document: { min: 4, max: 12 },
  marketing_content: { min: 4, max: 10 },
  unknown: { min: 2, max: 6 },
} as const satisfies Record<WorkType, { min: number; max: number }>;

const savingRateEstimate = {
  customer_reply: "20~45%",
  grant_document: "15~35%",
  business_document: "15~40%",
  marketing_content: "20~45%",
  unknown: "10~20%",
} as const satisfies Record<WorkType, string>;

const methodCopy = {
  idea_only: "AI는 아이디어와 방향 잡기에만 사용하세요.",
  draft_only: "AI는 초안 작성까지 사용하고, 담당자가 수정하세요.",
  reviewed_use: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
  partial_automation: "정해진 기준 안에서 일부 반복 업무만 자동화하세요.",
  unknown: "먼저 작은 업무 1개에서 초안 작성부터 시작하세요.",
} as const satisfies Record<UsageScope, string>;

const reviewPoints = {
  customer_reply: ["개인정보", "환불·계약", "고객 불만"],
  grant_document: ["성과 수치", "근거 문장", "제출 전 최종 검토"],
  business_document: ["수치 근거", "외부 공유", "예산·계약 문장"],
  marketing_content: ["과장 표현", "가격·효과", "고객 오해"],
  unknown: ["개인정보", "외부 전달", "금액·계약"],
} as const satisfies Record<WorkType, readonly [string, string, string]>;

const pilotItems = {
  save_time: ["실제 절감 시간", "반복 처리 건수", "수정이 필요한 결과 비율"],
  first_draft: ["초안 작성 시간", "수정이 필요한 문장 비율", "최종 사용 가능 비율"],
  reduce_mistakes: ["누락된 항목 수", "사람이 고친 부분", "확인이 필요한 유형"],
  improve_quality: ["표현 수정 비율", "최종 결과물 만족도", "다시 사용할 수 있는 문장 유형"],
  find_use_case: ["가장 효과가 큰 업무", "위험이 낮은 업무", "계속 쓸 수 있는 업무"],
} as const satisfies Record<AdoptionPurpose, readonly [string, string, string]>;

const pilotSize = {
  customer_reply: "문의 20건 기준",
  grant_document: "문서 3~5건 기준",
  business_document: "문서 5건 기준",
  marketing_content: "콘텐츠 10건 기준",
  unknown: "작은 업무 1개 기준",
} as const satisfies Record<WorkType, string>;

const supportNote =
  "AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다.";

const supportDisclaimer =
  "예상 수치입니다. 지원사업은 공고와 기업 요건에 따라 달라집니다.";

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

export function buildAdoptionReport({
  nature,
  purpose,
  scope,
  workType,
}: {
  workType: WorkType;
  purpose: AdoptionPurpose;
  nature: WorkNature;
  scope: UsageScope;
}): AdoptionReport {
  const savingHours = monthlySavingHours[workType];
  const timeEstimate = `월 ${savingHours.min}~${savingHours.max}시간`;
  const savingRate = savingRateEstimate[workType];
  const monthlySavingAmount = formatMonthlySavingAmount(savingHours);
  const adoptionScore = getAdoptionScore({ workType, purpose, nature, scope });
  const supportReview = getSupportReviewAmount(
    getProjectScale({
      selectedWork: workType,
      volume: getEstimatedVolume(workType, nature),
      savingHoursMax: getConservativeSupportSavingHoursMax(savingHours.max),
      adoptionScope: getSupportAdoptionScope(scope),
      exposure: getExposure(nature),
    }),
  );
  const metricCards = [
    {
      title: "AI 도입 점수",
      value: `${adoptionScore.score}점`,
      caption: adoptionScore.label,
    },
    {
      title: "예상 절감률",
      value: savingRate,
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
      value: pilotSize[workType],
    },
  ] as const satisfies readonly ResultMetricCard[];

  return {
    workLabel: getOptionLabel(workOptions, workType),
    purposeLabel: getOptionLabel(adoptionPurposeOptions, purpose),
    natureLabel: getOptionLabel(workNatureOptions, nature),
    scopeLabel: getOptionLabel(usageScopeOptions, scope),
    headline: workHeadlines[workType],
    natureLine: natureLines[nature],
    expectedValueCopy: expectedValueCopy[purpose],
    timeEstimate,
    savingRate,
    monthlySavingAmount,
    adoptionScore,
    supportReview,
    supportDisclaimer,
    metricCards,
    valueItems: null,
    method: methodCopy[scope],
    reviewPoints: reviewPoints[workType],
    pilotItems: pilotItems[purpose],
    pilotSize: pilotSize[workType],
    supportNote,
  };
}

export function getProjectScale({
  selectedWork,
  volume,
  savingHoursMax,
  adoptionScope,
  exposure,
}: {
  selectedWork: WorkType;
  volume: VolumeLevel;
  savingHoursMax: number;
  adoptionScope: SupportAdoptionScope;
  exposure: ExposureLevel;
}): ProjectScale {
  let score = 0;

  if (selectedWork !== "unknown") score += 20;
  if (volume === "mid") score += 15;
  if (volume === "high") score += 25;
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
    };
  }

  const budget = projectBudgetRange[projectScale];
  const min = budget.min * supportRate.min;
  const max = budget.max * supportRate.max;
  const average = (min + max) / 2;

  return {
    label: `약 ${formatKrw(average)}`,
    rangeLabel: `검토 범위 ${formatKrwRange(min, max)}`,
    averageAmount: average,
  };
}

export function formatKrw(value: number): string {
  const rounded = Math.round(value / 10_000) * 10_000;

  if (rounded < 100_000_000) {
    return `${Math.round(rounded / 10_000).toLocaleString()}만원`;
  }

  return `${(rounded / 100_000_000).toFixed(1)}억원`;
}

function formatKrwRange(min: number, max: number): string {
  const minLabel = formatKrw(min);
  const maxLabel = formatKrw(max);

  if (minLabel.endsWith("만원") && maxLabel.endsWith("만원")) {
    return `${minLabel.slice(0, -1)}~${maxLabel}`;
  }

  return `${minLabel}~${maxLabel}`;
}

function formatMonthlySavingAmount({
  min,
  max,
}: {
  min: number;
  max: number;
}): string {
  const hourlyValue = 30_000;
  const minManwon = Math.round((min * hourlyValue) / 10_000);
  const maxManwon = Math.round((max * hourlyValue) / 10_000);

  return `${minManwon.toLocaleString()}~${maxManwon.toLocaleString()}만원`;
}

function getAdoptionScore({
  workType,
  purpose,
  nature,
  scope,
}: {
  workType: WorkType;
  purpose: AdoptionPurpose;
  nature: WorkNature;
  scope: UsageScope;
}): { score: number; label: string } {
  let score = 40;

  if (workType !== "unknown") score += 8;

  score +=
    purpose === "save_time"
      ? 10
      : purpose === "first_draft"
        ? 8
        : purpose === "reduce_mistakes"
          ? 7
          : purpose === "improve_quality"
            ? 6
            : 0;

  score +=
    nature === "repetitive"
      ? 14
      : nature === "important_low_frequency"
        ? 10
        : nature === "internal_decision"
          ? 9
          : nature === "external_output"
            ? 8
            : 0;

  score +=
    scope === "partial_automation"
      ? 10
      : scope === "reviewed_use"
        ? 8
        : scope === "draft_only"
          ? 5
          : scope === "idea_only"
            ? 2
            : 0;

  const normalized = Math.max(0, Math.min(100, score));
  const label =
    normalized >= 80
      ? "파일럿 적합"
      : normalized >= 60
        ? "조건부 시작"
        : normalized >= 50
          ? "준비 필요"
          : "업무 선정 필요";

  return { score: normalized, label };
}

function getEstimatedVolume(workType: WorkType, nature: WorkNature): VolumeLevel {
  if (workType === "unknown" || nature === "unclear") {
    return "low";
  }

  if (nature === "repetitive") {
    return "mid";
  }

  return "mid";
}

function getConservativeSupportSavingHoursMax(savingHoursMax: number): number {
  return Math.min(savingHoursMax, 11);
}

function getSupportAdoptionScope(scope: UsageScope): SupportAdoptionScope {
  if (scope === "reviewed_use" || scope === "partial_automation") {
    return scope;
  }
  if (scope === "draft_only") {
    return "direct_use";
  }
  return "unknown";
}

function getExposure(nature: WorkNature): ExposureLevel {
  if (nature === "external_output") {
    return "external";
  }
  return "unknown";
}

export function formatResultSummary(report: AdoptionReport): string {
  return [
    "AgentProof AI 도입 간단 점검 결과",
    "",
    `추천 업무: ${report.workLabel}`,
    `도입 목적: ${report.purposeLabel}`,
    `업무 성격: ${report.natureLabel}`,
    `권장 방식: ${report.method}`,
    "",
    "기대효과:",
    report.expectedValueCopy,
    "",
    `AI 도입 점수: ${report.adoptionScore.score}점 (${report.adoptionScore.label})`,
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
