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
  bandLabel: string;
  bandMessage: string;
  watchOut: string[];
  recommendedJob: QuickDiagnosisJob;
  workspaceTitle: string;
  workspaceCta: string;
  personaValue: string;
};

type Option<T extends string> = {
  value: T;
  label: string;
};

export type QuickDiagnosisStep =
  | {
      id: "intro";
      label: "시작";
      title: string;
      helperText: string;
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
    title: "AI로 만든 답변,\n바로 보내도 될까요?",
    helperText: "3분만 체크하고 먼저 맡길 일을 찾아보세요.",
    primaryCta: "시작하기",
    trustNote: "회사명·이메일·고객정보 입력 없음",
  },
  {
    id: "persona",
    label: "입장 선택",
    question: "어떤 상황에 가까우세요?",
    options: [
      { value: "worker", label: "직접 AI를 쓰고 있어요" },
      { value: "team_lead", label: "팀원들이 쓰기 시작했어요" },
      { value: "owner", label: "대표 입장에서 고민 중이에요" },
      { value: "policy_manager", label: "개인정보가 걱정돼요" },
      { value: "grant_writer", label: "지원사업 문서를 준비 중이에요" },
    ],
  },
  {
    id: "selectedJob",
    label: "맡겨볼 일 선택",
    question: "AI로 먼저 맡겨볼 일은?",
    options: [
      { value: "customer_reply", label: "고객 문의 답변" },
      { value: "grant_doc", label: "사업계획서 문장" },
      { value: "marketing_copy", label: "마케팅 문구" },
      { value: "internal_summary", label: "회의록 요약" },
      { value: "proposal_doc", label: "제안서 문장" },
    ],
  },
  {
    id: "audience",
    label: "누가 보는지 선택",
    question: "이 결과를 누가 보나요?",
    options: [
      { value: "customer", label: "고객" },
      { value: "institution", label: "기관·심사위원" },
      { value: "executive", label: "대표·팀장" },
      { value: "internal", label: "내부 팀원" },
      { value: "unknown", label: "아직 모름" },
    ],
  },
  {
    id: "concern",
    label: "걱정되는 점 선택",
    question: "제일 걱정되는 건?",
    options: [
      { value: "privacy", label: "개인정보" },
      { value: "wrong_answer", label: "틀린 답변" },
      { value: "exaggeration", label: "과장된 표현" },
      { value: "no_policy", label: "기준 없음" },
      { value: "no_evidence", label: "설명할 기록 없음" },
      { value: "unknown_risk", label: "뭐가 위험한지 모름" },
    ],
  },
  {
    id: "review",
    label: "확인 방식 선택",
    question: "마지막에 누가 확인하나요?",
    options: [
      { value: "always", label: "항상 사람이 봐요" },
      { value: "important_only", label: "중요한 것만 봐요" },
      { value: "individual", label: "각자 알아서 봐요" },
      { value: "rarely", label: "거의 안 봐요" },
      { value: "no_standard", label: "기준이 없어요" },
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
    label: "작게 시작하기 좋은 상태",
    message:
      "작은 업무부터 써볼 수 있습니다. 밖으로 나가는 문서는 마지막에 한 번 확인하세요.",
  },
  conditional: {
    label: "조건을 두고 시작하기 좋은 상태",
    message:
      "AI를 못 쓸 상태는 아닙니다. 다만 민감한 내용은 사람이 한 번 봐야 합니다.",
  },
  needs_verification: {
    label: "확인이 더 필요한 상태",
    message:
      "바로 넓게 쓰기보다, 작은 업무에서 몇 번 써보고 확인하는 편이 좋습니다.",
  },
  hold: {
    label: "기준 정리가 먼저 필요한 상태",
    message: "지금은 어떤 일에 쓰고 누가 확인할지 먼저 정하는 게 좋습니다.",
  },
} as const satisfies Record<
  QuickDiagnosisBand,
  { label: string; message: string }
>;

const concernWatchOut = {
  privacy: "개인정보가 섞일 수 있어요",
  wrong_answer: "틀린 답변이 나갈 수 있어요",
  exaggeration: "말이 과장될 수 있어요",
  no_policy: "직원들이 참고할 기준이 부족해요",
  no_evidence: "나중에 설명할 기록이 부족해요",
  unknown_risk: "뭐가 위험한지 모르는 상태예요",
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
    bandLabel: bandCopy[band].label,
    bandMessage: bandCopy[band].message,
    watchOut: deriveWatchOutItems(answers),
    recommendedJob: answers.selectedJob,
    workspaceTitle: workspace.title,
    workspaceCta: workspace.cta,
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
