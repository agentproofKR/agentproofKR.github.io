export const quickDiagnosisVersion = "2026-06-AgentProof-human-quick-diagnosis-v2";

export type QuickDiagnosisPersona =
  | "worker"
  | "team_lead"
  | "owner"
  | "policy_manager"
  | "grant_writer";

export type QuickDiagnosisJob =
  | "customer_reply"
  | "grant_doc"
  | "marketing_copy"
  | "internal_summary"
  | "proposal_doc";

export type QuickDiagnosisAudience =
  | "customer"
  | "institution"
  | "executive"
  | "internal"
  | "unknown";

export type QuickDiagnosisConcern =
  | "privacy"
  | "wrong_answer"
  | "exaggeration"
  | "no_policy"
  | "no_evidence"
  | "unknown_risk";

export type QuickDiagnosisReview =
  | "always"
  | "important_only"
  | "individual"
  | "rarely"
  | "no_standard";

export type QuickDiagnosisAnswers = {
  persona: QuickDiagnosisPersona;
  selectedJob: QuickDiagnosisJob;
  audience: QuickDiagnosisAudience;
  concern: QuickDiagnosisConcern;
  review: QuickDiagnosisReview;
};

export type QuickDiagnosisBand =
  | "ready"
  | "conditional"
  | "needs_verification"
  | "hold";

export type QuickDiagnosisResult = {
  riskScore: number;
  assuranceScore: number;
  band: QuickDiagnosisBand;
  statusPill: string;
  resultHeadline: string;
  bandLabel: string;
  bandMessage: string;
  watchOut: string[];
  recommendedJob: QuickDiagnosisJob;
  workspaceTitle: string;
  workspaceCta: string;
  valueTitle: string;
  valueText: string;
  valueBullets: string[];
  personaValue: string;
};

type Option<T extends string> = {
  value: T;
  label: string;
  subtitle: string;
};

export type QuickDiagnosisStep =
  | {
      id: "intro";
      label: "시작";
      title: string;
      helperText: string;
      previewTitle: string;
      previewItems: readonly string[];
      primaryCta: string;
      trustNote: string;
    }
  | {
      id: "persona";
      label: "입장 선택";
      question: string;
      options: readonly Option<QuickDiagnosisPersona>[];
    }
  | {
      id: "selectedJob";
      label: "확인 대상 선택";
      question: string;
      options: readonly Option<QuickDiagnosisJob>[];
    }
  | {
      id: "audience";
      label: "누가 보는지 선택";
      question: string;
      options: readonly Option<QuickDiagnosisAudience>[];
    }
  | {
      id: "concern";
      label: "걱정되는 점 선택";
      question: string;
      options: readonly Option<QuickDiagnosisConcern>[];
    }
  | {
      id: "review";
      label: "확인 방식 선택";
      question: string;
      options: readonly Option<QuickDiagnosisReview>[];
    };

export const quickDiagnosisSteps = [
  {
    id: "intro",
    label: "시작",
    title: "그대로 써도\n괜찮을까요?",
    helperText: "답변·문장·문서를 쓰기 전에\n확인할 내용만 빠르게 보여드려요.",
    previewTitle: "1분 체크",
    previewItems: ["어디에 쓰는지", "무엇이 걱정되는지", "마지막에 누가 보는지"],
    primaryCta: "바로 확인하기",
    trustNote: "회사명·이메일·고객정보는 묻지 않아요.",
  },
  {
    id: "persona",
    label: "입장 선택",
    question: "어떤 입장인가요?",
    options: [
      {
        value: "worker",
        label: "직접 쓰고 있어요",
        subtitle: "내가 쓴 문장이 괜찮은지 보고 싶어요",
      },
      {
        value: "team_lead",
        label: "팀에서 쓰고 있어요",
        subtitle: "어디까지 허용할지 정해야 해요",
      },
      {
        value: "owner",
        label: "대표·관리자예요",
        subtitle: "회사 기준을 정해야 해요",
      },
      {
        value: "policy_manager",
        label: "개인정보가 걱정돼요",
        subtitle: "고객정보나 내부자료가 신경 쓰여요",
      },
      {
        value: "grant_writer",
        label: "제출 문서가 필요해요",
        subtitle: "사업계획서나 지원사업 문서예요",
      },
    ],
  },
  {
    id: "selectedJob",
    label: "확인 대상 선택",
    question: "무엇을 확인할까요?",
    options: [
      {
        value: "customer_reply",
        label: "고객 답변",
        subtitle: "안내·상담 메시지",
      },
      {
        value: "grant_doc",
        label: "사업계획서 문장",
        subtitle: "지원사업·심사용 문장",
      },
      {
        value: "marketing_copy",
        label: "광고·홍보 문구",
        subtitle: "SNS·상세페이지 문구",
      },
      {
        value: "internal_summary",
        label: "회의록 요약",
        subtitle: "내부 공유용 정리",
      },
      {
        value: "proposal_doc",
        label: "제안서 문장",
        subtitle: "가격·조건·보장 표현",
      },
    ],
  },
  {
    id: "audience",
    label: "누가 보는지 선택",
    question: "어디에 쓰이나요?",
    options: [
      {
        value: "customer",
        label: "고객에게 보냅니다",
        subtitle: "답변·안내·상담 메시지",
      },
      {
        value: "institution",
        label: "기관에 제출합니다",
        subtitle: "지원사업·심사 문서",
      },
      {
        value: "executive",
        label: "대표·팀장에게 보고합니다",
        subtitle: "내부 의사결정 자료",
      },
      {
        value: "internal",
        label: "팀 안에서만 봅니다",
        subtitle: "내부 공유·정리용",
      },
      {
        value: "unknown",
        label: "아직 정하지 않았습니다",
        subtitle: "먼저 확인해보고 싶어요",
      },
    ],
  },
  {
    id: "concern",
    label: "걱정되는 점 선택",
    question: "무엇이 가장 걱정되나요?",
    options: [
      {
        value: "privacy",
        label: "개인정보",
        subtitle: "고객정보가 섞일 수 있어서",
      },
      {
        value: "wrong_answer",
        label: "틀린 내용",
        subtitle: "잘못 안내할 수 있어서",
      },
      {
        value: "exaggeration",
        label: "과한 표현",
        subtitle: "너무 세게 보일 수 있어서",
      },
      {
        value: "no_policy",
        label: "기준이 없음",
        subtitle: "어디까지 써도 될지 몰라서",
      },
      {
        value: "no_evidence",
        label: "남는 기록이 없음",
        subtitle: "나중에 설명하기 어려워서",
      },
      {
        value: "unknown_risk",
        label: "잘 모르겠음",
        subtitle: "무엇을 조심해야 할지 몰라서",
      },
    ],
  },
  {
    id: "review",
    label: "확인 방식 선택",
    question: "마지막 확인은 어떻게 하나요?",
    options: [
      {
        value: "always",
        label: "항상 확인합니다",
        subtitle: "쓰기 전에 사람이 봐요",
      },
      {
        value: "important_only",
        label: "중요한 것만 확인합니다",
        subtitle: "민감한 내용만 따로 봐요",
      },
      {
        value: "individual",
        label: "각자 확인합니다",
        subtitle: "정해진 방식은 없어요",
      },
      {
        value: "rarely",
        label: "거의 확인하지 않습니다",
        subtitle: "만든 사람이 바로 써요",
      },
      {
        value: "no_standard",
        label: "기준이 없습니다",
        subtitle: "아직 정해둔 게 없어요",
      },
    ],
  },
] as const satisfies readonly QuickDiagnosisStep[];

export const personaValueMap = {
  worker: "내가 쓴 문장을 쓰기 전에 확인할 수 있습니다.",
  team_lead: "팀에서 쓸 때 필요한 기준을 정리할 수 있습니다.",
  owner: "회사 기준을 정할 때 볼 내용을 확인할 수 있습니다.",
  policy_manager: "개인정보와 내부자료가 섞이는지 볼 수 있습니다.",
  grant_writer: "제출 전 과한 표현과 근거를 확인할 수 있습니다.",
} as const satisfies Record<QuickDiagnosisPersona, string>;

export const workspaceMap = {
  customer_reply: {
    title: "고객 답변",
    cta: "고객 답변 확인하기",
    path: "/workspace/?job=customer_reply",
  },
  grant_doc: {
    title: "사업계획서 문장",
    cta: "사업계획서 문장 확인하기",
    path: "/workspace/?job=grant_doc",
  },
  marketing_copy: {
    title: "광고·홍보 문구",
    cta: "광고 문구 확인하기",
    path: "/workspace/?job=marketing_copy",
  },
  internal_summary: {
    title: "회의록 요약",
    cta: "회의록 요약 확인하기",
    path: "/workspace/?job=internal_summary",
  },
  proposal_doc: {
    title: "제안서 문장",
    cta: "제안서 문장 확인하기",
    path: "/workspace/?job=proposal_doc",
  },
} as const satisfies Record<
  QuickDiagnosisJob,
  { title: string; cta: string; path: `/workspace/?job=${QuickDiagnosisJob}` }
>;

const jobRisk = {
  customer_reply: 10,
  grant_doc: 8,
  marketing_copy: 6,
  internal_summary: 3,
  proposal_doc: 9,
} as const satisfies Record<QuickDiagnosisJob, number>;

const audienceRisk = {
  customer: 18,
  institution: 16,
  executive: 10,
  internal: 4,
  unknown: 12,
} as const satisfies Record<QuickDiagnosisAudience, number>;

const concernRisk = {
  privacy: 20,
  wrong_answer: 18,
  exaggeration: 14,
  no_policy: 16,
  no_evidence: 12,
  unknown_risk: 15,
} as const satisfies Record<QuickDiagnosisConcern, number>;

const reviewRisk = {
  always: 0,
  important_only: 8,
  individual: 12,
  rarely: 18,
  no_standard: 18,
} as const satisfies Record<QuickDiagnosisReview, number>;

const bandCopy = {
  ready: {
    status: "시작 가능",
    headline: "작은 문서부터 시작해도 괜찮아 보여요.",
    label: "시작하기 좋은 상태",
    message: "내부용이거나 확인 방식이 있는 문서부터 써볼 수 있습니다.",
  },
  conditional: {
    status: "한 번 더 확인",
    headline: "그대로 쓰기 전, 한 번만 더 확인하세요.",
    label: "확인하고 쓰기 좋은 상태",
    message: "밖으로 나가는 내용은 한 번 더 보는 편이 좋습니다.",
  },
  needs_verification: {
    status: "확인 필요",
    headline: "바로 쓰기엔 확인할 부분이 있어요.",
    label: "확인이 더 필요한 상태",
    message: "작은 문서에서 몇 번 써보고, 고칠 부분을 먼저 보는 게 좋습니다.",
  },
  hold: {
    status: "기준 필요",
    headline: "쓰기 전에 기준부터 정하는 게 좋겠어요.",
    label: "기준이 먼저 필요한 상태",
    message: "어떤 일에 쓰고, 누가 마지막에 볼지 먼저 정하는 편이 좋습니다.",
  },
} as const satisfies Record<
  QuickDiagnosisBand,
  { status: string; headline: string; label: string; message: string }
>;

const concernWatchOut = {
  privacy: "개인정보가 섞였는지",
  wrong_answer: "틀린 내용은 없는지",
  exaggeration: "표현이 과하지 않은지",
  no_policy: "참고할 기준이 있는지",
  no_evidence: "나중에 설명할 기록이 남는지",
  unknown_risk: "무엇을 확인해야 할지 정해졌는지",
} as const satisfies Record<QuickDiagnosisConcern, string>;

const audienceWatchOut = {
  customer: "고객에게 보내기 전에 한 번 더 봤는지",
  institution: "제출 전 표현을 다시 봤는지",
  executive: "보고용 근거가 충분한지",
  internal: "내부 공유 범위가 맞는지",
  unknown: "어디에 쓸지 정해졌는지",
} as const satisfies Record<QuickDiagnosisAudience, string>;

const jobWatchOut = {
  customer_reply: "환불·계약 표현은 괜찮은지",
  grant_doc: "근거 없는 성과 표현은 없는지",
  marketing_copy: "과장 광고처럼 보이지 않는지",
  internal_summary: "민감정보가 들어가지 않았는지",
  proposal_doc: "가격·보장 표현은 괜찮은지",
} as const satisfies Record<QuickDiagnosisJob, string>;

const reviewWatchOut = "사람마다 다르게 확인하고 있지 않은지";

export function calculateQuickDiagnosisResult(
  answers: QuickDiagnosisAnswers,
): QuickDiagnosisResult {
  const riskScore =
    jobRisk[answers.selectedJob] +
    audienceRisk[answers.audience] +
    concernRisk[answers.concern] +
    reviewRisk[answers.review];
  const assuranceScore = clamp(100 - riskScore, 0, 100);
  const band = getQuickDiagnosisBand(assuranceScore);
  const workspace = workspaceMap[answers.selectedJob];

  return {
    riskScore,
    assuranceScore,
    band,
    statusPill: bandCopy[band].status,
    resultHeadline: bandCopy[band].headline,
    bandLabel: bandCopy[band].label,
    bandMessage: bandCopy[band].message,
    watchOut: deriveWatchOutItems(answers),
    recommendedJob: answers.selectedJob,
    workspaceTitle: workspace.title,
    workspaceCta: workspace.cta,
    valueTitle: "AgentProof에서 확인하면",
    valueText: "문장을 만들고,\n쓰기 전에 볼 내용을 같이 확인할 수 있어요.",
    valueBullets: ["어떻게 고쳤는지", "실제로 썼는지", "사람이 확인했는지"],
    personaValue: personaValueMap[answers.persona],
  };
}

export function getQuickDiagnosisBand(score: number): QuickDiagnosisBand {
  const normalized = clamp(Math.round(score), 0, 100);
  if (normalized >= 80) return "ready";
  if (normalized >= 60) return "conditional";
  if (normalized >= 40) return "needs_verification";
  return "hold";
}

export function deriveWatchOutItems(answers: QuickDiagnosisAnswers): string[] {
  const items: string[] = [];

  addUnique(items, concernWatchOut[answers.concern]);

  if (answers.concern !== "unknown_risk" && answers.audience !== "internal") {
    addUnique(items, audienceWatchOut[answers.audience]);
  }

  if (
    answers.review === "individual" ||
    answers.review === "rarely" ||
    answers.review === "no_standard"
  ) {
    addUnique(items, reviewWatchOut);
  }

  if (answers.concern === "unknown_risk") {
    addUnique(items, jobWatchOut[answers.selectedJob]);
  }

  if (items.length < 3) {
    addUnique(items, jobWatchOut[answers.selectedJob]);
  }
  if (items.length < 3 && answers.audience === "internal") {
    addUnique(items, audienceWatchOut.internal);
  }
  if (items.length < 3) {
    addUnique(items, "사람이 확인할 부분이 정해졌는지");
  }

  return items.slice(0, 3);
}

export function getWorkspaceByJob(job: string | null | undefined) {
  if (isQuickDiagnosisJob(job)) {
    return workspaceMap[job];
  }
  return workspaceMap.customer_reply;
}

export function isQuickDiagnosisJob(
  value: string | null | undefined,
): value is QuickDiagnosisJob {
  return typeof value === "string" && value in workspaceMap;
}

function addUnique(items: string[], item: string): void {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
