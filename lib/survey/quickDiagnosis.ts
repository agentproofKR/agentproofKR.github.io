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
  humanSummary: string;
  goodNews: string;
  watchOut: string[];
  recommendedJob: QuickDiagnosisJob;
  workspaceTitle: string;
  workspaceCta: string;
  workspaceHint: string;
  personaValue: string;
};

type Option<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

export type QuickDiagnosisStep =
  | {
      id: "intro";
      label: "지금 상황";
      title: string;
      body: string[];
      primaryCta: string;
      trustNote: string;
      secondaryCta: string;
    }
  | {
      id: "persona";
      label: "내 입장";
      question: string;
      options: readonly Option<QuickDiagnosisPersona>[];
    }
  | {
      id: "selectedJob";
      label: "해보고 싶은 일";
      question: string;
      helperText: string;
      options: readonly Option<QuickDiagnosisJob>[];
    }
  | {
      id: "audience";
      label: "누가 보나요?";
      question: string;
      helperText: string;
      options: readonly Option<QuickDiagnosisAudience>[];
    }
  | {
      id: "concern";
      label: "걱정되는 점";
      question: string;
      helperText: string;
      options: readonly Option<QuickDiagnosisConcern>[];
    }
  | {
      id: "review";
      label: "추천 결과";
      question: string;
      helperText: string;
      options: readonly Option<QuickDiagnosisReview>[];
    };

export const quickDiagnosisSteps = [
  {
    id: "intro",
    label: "지금 상황",
    title: "AI로 만든 답변,\n그냥 보내도 될까요?",
    body: [
      "요즘은 ChatGPT로 답변도 쓰고, 문서도 만들고, 사업계획서 문장도 다듬습니다.",
      "그런데 막상 보내려면 한 번 멈칫하게 됩니다.",
      "이 표현 괜찮을까? 개인정보가 들어간 건 아닐까? 대표나 팀장이 봐도 괜찮을까?",
      "3분만 체크해보세요. 어떤 일부터 AI로 맡겨도 될지 바로 알려드릴게요.",
    ],
    primaryCta: "3분 진단 시작하기",
    trustNote: "회사명, 이메일, 고객정보는 입력하지 않습니다.",
    secondaryCta: "더 자세한 역할별 진단 보기",
  },
  {
    id: "persona",
    label: "내 입장",
    question: "지금 어떤 상황에 가까우세요?",
    options: [
      { value: "worker", label: "제가 직접 AI로 일을 해보고 있어요" },
      { value: "team_lead", label: "팀원들이 AI를 쓰기 시작했어요" },
      { value: "owner", label: "대표 입장에서 허용해도 될지 고민 중이에요" },
      { value: "policy_manager", label: "개인정보나 보안이 걱정돼요" },
      { value: "grant_writer", label: "지원사업 문서를 준비하고 있어요" },
    ],
  },
  {
    id: "selectedJob",
    label: "해보고 싶은 일",
    question: "AI로 먼저 맡겨보고 싶은 일은 뭔가요?",
    helperText: "처음부터 큰 업무를 맡기기보다, 반복되는 일 하나부터 보는 게 좋습니다.",
    options: [
      {
        value: "customer_reply",
        label: "고객 문의 답변",
        hint: "고객에게 나가는 답변이라면, 환불·계약·개인정보 표현을 특히 봐야 합니다.",
      },
      {
        value: "grant_doc",
        label: "사업계획서·지원사업 문장",
        hint: "제출 문서는 빠르게 쓰는 것보다, 과장이나 근거 부족을 줄이는 게 중요합니다.",
      },
      {
        value: "marketing_copy",
        label: "마케팅/SNS 문구",
        hint: "마케팅 문구는 좋아 보여도, 과장이나 오해 소지가 생길 수 있습니다.",
      },
      {
        value: "internal_summary",
        label: "보고서·회의록 요약",
        hint: "요약 업무는 시작하기 좋지만, 민감정보나 공유 범위는 확인해야 합니다.",
      },
      {
        value: "proposal_doc",
        label: "제안서·견적 문장",
        hint: "제안서나 견적 문장은 가격·계약·보장 표현이 조심스럽습니다.",
      },
    ],
  },
  {
    id: "audience",
    label: "누가 보나요?",
    question: "그 결과를 누가 보게 되나요?",
    helperText: "밖으로 나가는 문서일수록, 표현 하나를 더 조심해야 합니다.",
    options: [
      { value: "customer", label: "고객에게 보낼 수 있어요" },
      { value: "institution", label: "기관이나 심사위원에게 제출할 수 있어요" },
      { value: "executive", label: "대표나 팀장에게 보고할 수 있어요" },
      { value: "internal", label: "내부 팀원끼리만 봐요" },
      { value: "unknown", label: "아직 잘 모르겠어요" },
    ],
  },
  {
    id: "concern",
    label: "걱정되는 점",
    question: "AI를 쓸 때 제일 걱정되는 건 뭔가요?",
    helperText: "처음엔 다들 여기서 막힙니다. 괜찮습니다.",
    options: [
      { value: "privacy", label: "개인정보나 고객정보가 들어갈까 봐 걱정돼요" },
      { value: "wrong_answer", label: "틀린 답변을 보낼까 봐 걱정돼요" },
      { value: "exaggeration", label: "말이 과장될까 봐 걱정돼요" },
      { value: "no_policy", label: "직원들이 어디까지 써도 되는지 기준이 없어요" },
      { value: "no_evidence", label: "나중에 대표나 팀장에게 설명할 근거가 없어요" },
      { value: "unknown_risk", label: "사실 뭐가 위험한지도 잘 모르겠어요" },
    ],
  },
  {
    id: "review",
    label: "추천 결과",
    question: "마지막에는 누가 확인하나요?",
    helperText: "AgentProof는 이 확인 과정을 나중에 설명할 수 있게 남기는 쪽에 가깝습니다.",
    options: [
      { value: "always", label: "항상 사람이 확인해요" },
      { value: "important_only", label: "중요한 것만 확인해요" },
      { value: "individual", label: "각자 알아서 봐요" },
      { value: "rarely", label: "거의 확인하지 않아요" },
      { value: "no_standard", label: "정해진 기준이 없어요" },
    ],
  },
] as const satisfies readonly QuickDiagnosisStep[];

export const personaValueMap = {
  worker: "오늘 바로 쓸 때, 어떤 문장을 조심해야 하는지 확인할 수 있습니다.",
  team_lead: "팀원이 만든 AI 답변을 어디까지 허용할지 기준을 잡는 데 도움이 됩니다.",
  owner: "직원들이 AI를 쓰는 걸 막기보다, 어떤 일부터 허용할지 판단할 수 있습니다.",
  policy_manager: "개인정보, 외부 발송, 사람 확인이 필요한 일을 구분하는 데 도움이 됩니다.",
  grant_writer: "제출 전 과장 표현이나 근거 부족 문장을 먼저 확인할 수 있습니다.",
} as const satisfies Record<QuickDiagnosisPersona, string>;

export const workspaceMap = {
  customer_reply: {
    title: "고객 문의 답변",
    cta: "고객답변 1건 체험하기",
    hint: "AI 답변을 만들고, 환불·계약·개인정보 표현을 확인합니다.",
    path: "/workspace/?job=customer_reply",
  },
  grant_doc: {
    title: "사업계획서·지원사업 문장",
    cta: "사업계획서 문장 검수해보기",
    hint: "과장 표현과 근거 부족 문장을 먼저 확인합니다.",
    path: "/workspace/?job=grant_doc",
  },
  marketing_copy: {
    title: "마케팅/SNS 문구",
    cta: "마케팅 문구 검수해보기",
    hint: "과장 표현과 고객 오해 가능성을 확인합니다.",
    path: "/workspace/?job=marketing_copy",
  },
  internal_summary: {
    title: "보고서·회의록 요약",
    cta: "업무요약 AI 체험하기",
    hint: "공유 전 민감정보와 출처를 확인합니다.",
    path: "/workspace/?job=internal_summary",
  },
  proposal_doc: {
    title: "제안서·견적 문장",
    cta: "제안서 문장 검수해보기",
    hint: "가격·계약·보장 표현을 확인합니다.",
    path: "/workspace/?job=proposal_doc",
  },
} as const satisfies Record<
  QuickDiagnosisJob,
  { title: string; cta: string; hint: string; path: `/workspace/?job=${QuickDiagnosisJob}` }
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
      "작은 업무부터 시작하기 좋은 상태입니다. 그래도 밖으로 나가는 문서는 마지막에 한 번 확인하는 편이 좋습니다.",
    summary: "먼저 작은 업무부터 써볼 수 있습니다.",
  },
  conditional: {
    label: "조건을 두고 시작하기 좋은 상태",
    message:
      "AI를 아예 못 쓸 상태는 아닙니다. 다만 고객에게 나가거나 민감한 내용이 섞이는 일은 확인 기준이 필요합니다.",
    summary: "작게 시작하되, 보내기 전 확인할 부분을 먼저 정하면 좋습니다.",
  },
  needs_verification: {
    label: "먼저 확인이 더 필요한 상태",
    message:
      "바로 크게 쓰기보다는, 작은 업무에서 몇 번 써보며 확인할 부분을 먼저 보는 게 좋습니다.",
    summary: "바로 넓게 쓰기보다, 한 가지 업무에서 먼저 확인해보세요.",
  },
  hold: {
    label: "기준 정리가 먼저 필요한 상태",
    message:
      "지금은 AI를 바로 넓게 쓰기보다, 어떤 일에 쓰고 누가 확인할지 기준을 먼저 잡는 게 좋습니다.",
    summary: "먼저 기준을 잡고, 작은 업무부터 다시 보는 편이 좋습니다.",
  },
} as const satisfies Record<
  QuickDiagnosisBand,
  { label: string; message: string; summary: string }
>;

const concernWatchOut = {
  privacy: "개인정보나 고객정보가 섞일 수 있습니다.",
  wrong_answer: "틀린 답변이 고객에게 나갈 수 있습니다.",
  exaggeration: "과장되거나 근거가 부족한 문장이 나올 수 있습니다.",
  no_policy: "직원들이 어디까지 써도 되는지 기준이 부족합니다.",
  no_evidence: "대표나 팀장에게 설명할 기록이 부족합니다.",
  unknown_risk: "무엇이 위험한지 모르는 상태 자체가 조심할 부분입니다.",
} as const satisfies Record<QuickDiagnosisConcern, string>;

const audienceWatchOut = {
  customer: "고객에게 보내기 전 확인 기준이 필요합니다.",
  institution: "제출 전 과장·근거·표현을 확인해야 합니다.",
  executive: "보고용 문서는 출처와 근거가 중요합니다.",
  internal: "내부 자료라도 공유 범위를 먼저 확인하는 편이 좋습니다.",
  unknown: "누가 보게 될지 정해지지 않으면 확인 기준도 흔들릴 수 있습니다.",
} as const satisfies Record<QuickDiagnosisAudience, string>;

const jobWatchOut = {
  customer_reply: "환불·계약·보상 표현을 조심해야 합니다.",
  grant_doc: "지원사업 문서는 근거 없는 성과 표현을 조심해야 합니다.",
  marketing_copy: "마케팅 문구는 과장 광고처럼 보이지 않게 확인해야 합니다.",
  internal_summary: "내부 요약도 민감정보와 공유 범위를 확인해야 합니다.",
  proposal_doc: "제안서·견적 문장은 가격·계약·보장 표현을 조심해야 합니다.",
} as const satisfies Record<QuickDiagnosisJob, string>;

const reviewWatchOut =
  "사람마다 확인 방식이 달라질 수 있습니다.";

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
    humanSummary: bandCopy[band].summary,
    goodNews: getGoodNews(answers.selectedJob, band),
    watchOut: deriveWatchOutItems(answers),
    recommendedJob: answers.selectedJob,
    workspaceTitle: workspace.title,
    workspaceCta: workspace.cta,
    workspaceHint: workspace.hint,
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
    addUnique(items, "보내기 전에 사람이 한 번 볼 답변을 정해두면 좋습니다.");
  }

  return items.slice(0, 3);
}

export function getWorkspaceByJob(job: string | null | undefined) {
  if (isQuickDiagnosisJob(job)) {
    return workspaceMap[job];
  }
  return workspaceMap.customer_reply;
}

export function isQuickDiagnosisJob(value: string | null | undefined): value is QuickDiagnosisJob {
  return typeof value === "string" && value in workspaceMap;
}

function getGoodNews(job: QuickDiagnosisJob, band: QuickDiagnosisBand): string {
  const prefix =
    band === "hold"
      ? "그래도 처음부터 전부 멈출 필요는 없습니다."
      : "먼저 해볼 만한 일이 있습니다.";
  return `${prefix} ${workspaceMap[job].title}처럼 범위가 분명한 일부터 작게 시작해보세요.`;
}

function addUnique(items: string[], item: string): void {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
