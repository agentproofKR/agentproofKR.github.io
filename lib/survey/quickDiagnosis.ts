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
      label: "맡겨볼 일 선택";
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
    title: "AI로 만든 답변,\n그냥 보내도 될까요?",
    helperText: "3분이면 먼저 맡길 일과\n조심할 점이 나옵니다.",
    previewTitle: "오늘 확인할 것",
    previewItems: ["먼저 해볼 일", "조심할 표현", "마지막 확인 방식"],
    primaryCta: "시작하기",
    trustNote: "회사명·이메일·고객정보 입력 없음",
  },
  {
    id: "persona",
    label: "입장 선택",
    question: "지금 상황은?",
    options: [
      {
        value: "worker",
        label: "직접 쓰고 있어요",
        subtitle: "내가 만든 답변이 괜찮은지 보고 싶어요",
      },
      {
        value: "team_lead",
        label: "팀원들이 쓰기 시작했어요",
        subtitle: "어디까지 허용할지 고민돼요",
      },
      {
        value: "owner",
        label: "대표 입장에서 보고 있어요",
        subtitle: "막을지, 허용할지 판단해야 해요",
      },
      {
        value: "policy_manager",
        label: "개인정보가 걱정돼요",
        subtitle: "고객정보나 내부자료가 신경 쓰여요",
      },
      {
        value: "grant_writer",
        label: "제출 문서를 준비 중이에요",
        subtitle: "사업계획서나 지원사업 문서가 필요해요",
      },
    ],
  },
  {
    id: "selectedJob",
    label: "맡겨볼 일 선택",
    question: "AI에게 먼저 맡길 일은?",
    options: [
      {
        value: "customer_reply",
        label: "고객 문의 답변",
        subtitle: "보내기 전 표현 확인",
      },
      {
        value: "grant_doc",
        label: "사업계획서 문장",
        subtitle: "과장·근거 확인",
      },
      {
        value: "marketing_copy",
        label: "마케팅 문구",
        subtitle: "오해·과장 확인",
      },
      {
        value: "internal_summary",
        label: "회의록 요약",
        subtitle: "공유 범위 확인",
      },
      {
        value: "proposal_doc",
        label: "제안서 문장",
        subtitle: "가격·보장 표현 확인",
      },
    ],
  },
  {
    id: "audience",
    label: "누가 보는지 선택",
    question: "이 결과는 어디까지 나가나요?",
    options: [
      {
        value: "customer",
        label: "고객에게 보냅니다",
        subtitle: "답변·안내·상담 메시지",
      },
      {
        value: "institution",
        label: "기관에 제출합니다",
        subtitle: "지원사업·심사·공식 문서",
      },
      {
        value: "executive",
        label: "대표나 팀장에게 보고합니다",
        subtitle: "내부 의사결정 자료",
      },
      {
        value: "internal",
        label: "내부에서만 봅니다",
        subtitle: "팀 공유·정리용",
      },
      {
        value: "unknown",
        label: "아직 모르겠습니다",
        subtitle: "일단 써보고 정하려고요",
      },
    ],
  },
  {
    id: "concern",
    label: "걱정되는 점 선택",
    question: "가장 찝찝한 건?",
    options: [
      {
        value: "privacy",
        label: "개인정보",
        subtitle: "고객정보가 섞일까 봐",
      },
      {
        value: "wrong_answer",
        label: "틀린 답변",
        subtitle: "잘못된 말을 보낼까 봐",
      },
      {
        value: "exaggeration",
        label: "과장된 표현",
        subtitle: "너무 세게 말할까 봐",
      },
      {
        value: "no_policy",
        label: "기준 없음",
        subtitle: "어디까지 써도 되는지 몰라서",
      },
      {
        value: "no_evidence",
        label: "남는 기록 없음",
        subtitle: "나중에 설명하기 어려워서",
      },
      {
        value: "unknown_risk",
        label: "잘 모르겠음",
        subtitle: "뭐가 위험한지도 애매해서",
      },
    ],
  },
  {
    id: "review",
    label: "확인 방식 선택",
    question: "마지막 확인은?",
    options: [
      {
        value: "always",
        label: "항상 사람이 봅니다",
        subtitle: "보내기 전 확인해요",
      },
      {
        value: "important_only",
        label: "중요한 것만 봅니다",
        subtitle: "민감한 건 따로 봐요",
      },
      {
        value: "individual",
        label: "각자 알아서 봅니다",
        subtitle: "정해진 방식은 없어요",
      },
      {
        value: "rarely",
        label: "거의 안 봅니다",
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
  worker: "오늘 바로 쓸 때, 어떤 문장을 조심해야 하는지 확인할 수 있습니다.",
  team_lead: "팀원이 만든 답변을 어디까지 볼지 기준을 잡는 데 도움이 됩니다.",
  owner: "어떤 일부터 허용할지 작게 판단할 수 있습니다.",
  policy_manager: "개인정보와 외부 발송이 섞이는 일을 먼저 나눠볼 수 있습니다.",
  grant_writer: "제출 전 과장 표현이나 근거 부족 문장을 먼저 확인할 수 있습니다.",
} as const satisfies Record<QuickDiagnosisPersona, string>;

export const workspaceMap = {
  customer_reply: {
    title: "고객 문의 답변",
    cta: "고객답변 1건 체험하기",
    path: "/workspace/?job=customer_reply",
  },
  grant_doc: {
    title: "사업계획서 문장",
    cta: "사업계획서 문장 검수해보기",
    path: "/workspace/?job=grant_doc",
  },
  marketing_copy: {
    title: "마케팅 문구",
    cta: "마케팅 문구 검수해보기",
    path: "/workspace/?job=marketing_copy",
  },
  internal_summary: {
    title: "회의록 요약",
    cta: "업무요약 AI 체험하기",
    path: "/workspace/?job=internal_summary",
  },
  proposal_doc: {
    title: "제안서 문장",
    cta: "제안서 문장 검수해보기",
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
    headline: "작은 일부터 시작하기 좋아 보여요.",
    label: "작게 시작하기 좋은 상태",
    message: "내부용이거나 확인 방식이 있는 업무부터 써볼 수 있습니다.",
  },
  conditional: {
    status: "조건부 시작",
    headline: "작게 시작해도 됩니다. 보내기 전 확인만 꼭 하세요.",
    label: "조건을 두고 시작하기 좋은 상태",
    message:
      "AI를 못 쓸 상태는 아닙니다. 다만 밖으로 나가는 내용은 한 번 더 보는 편이 좋습니다.",
  },
  needs_verification: {
    status: "먼저 확인",
    headline: "바로 넓게 쓰기엔 아직 이릅니다.",
    label: "확인이 더 필요한 상태",
    message:
      "작은 업무에서 몇 번 써보고, 어떤 부분을 고쳐야 하는지 먼저 보는 게 좋습니다.",
  },
  hold: {
    status: "기준 먼저",
    headline: "쓰기 전에 기준부터 잡는 게 좋습니다.",
    label: "기준 정리가 먼저 필요한 상태",
    message: "어떤 일에 쓰고, 누가 마지막에 볼지 먼저 정하는 편이 좋습니다.",
  },
} as const satisfies Record<
  QuickDiagnosisBand,
  { status: string; headline: string; label: string; message: string }
>;

const concernWatchOut = {
  privacy: "개인정보가 섞일 수 있어요",
  wrong_answer: "틀린 답변이 나갈 수 있어요",
  exaggeration: "말이 과장될 수 있어요",
  no_policy: "참고할 기준이 부족해요",
  no_evidence: "나중에 설명할 기록이 부족해요",
  unknown_risk: "뭐가 위험한지 애매한 상태예요",
} as const satisfies Record<QuickDiagnosisConcern, string>;

const audienceWatchOut = {
  customer: "고객에게 보내기 전 확인이 필요해요",
  institution: "제출 전 표현을 한 번 더 봐야 해요",
  executive: "보고용 문서는 근거가 중요해요",
  internal: "내부 공유 범위를 먼저 정해야 해요",
  unknown: "누가 볼지 모르면 확인 기준도 흔들려요",
} as const satisfies Record<QuickDiagnosisAudience, string>;

const jobWatchOut = {
  customer_reply: "환불·계약 표현을 조심해야 해요",
  grant_doc: "근거 없는 성과 표현을 조심해야 해요",
  marketing_copy: "과장 광고처럼 보일 수 있어요",
  internal_summary: "민감정보가 섞일 수 있어요",
  proposal_doc: "가격·보장 표현을 조심해야 해요",
} as const satisfies Record<QuickDiagnosisJob, string>;

const reviewWatchOut = "확인 방식이 사람마다 달라질 수 있어요";

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
    valueTitle: "AgentProof에서 시작하면",
    valueText: "답변 만들기와 보내기 전 확인을 같이 할 수 있습니다.",
    valueBullets: ["어떻게 고쳤는지", "실제로 썼는지", "사람이 봤는지"],
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
    addUnique(items, "사람이 한 번 볼 일을 정해두면 좋아요");
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
