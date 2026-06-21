const functionName = "survey-submit";
const allowedOrigins = new Set([
  "https://agentproofkr.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

type Persona = "practitioner" | "leader" | "security";
type RequestType = "beta" | "interview" | "pilot";
type AnswerValue = string | string[];

type SurveyPayload = {
  kind?: "survey";
  sessionId: string;
  persona: Persona;
  surveyVersion: string;
  scoringVersion: string;
  idempotencyKey: string;
  honeypot?: string;
  answers: Record<string, AnswerValue>;
  result?: {
    totalScore: number;
    resultBand: string;
    dimensionScores: Record<string, number>;
    riskFlags: string[];
  };
  consents: {
    age14OrOlder: boolean;
    surveyProcessing: boolean;
    beta?: boolean;
    interview?: boolean;
    pilot?: boolean;
    consentVersion: string;
    consentTextHashes?: Record<string, string>;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
};

type ContactPayload = {
  kind: "contact_request";
  sessionId: string;
  idempotencyKey: string;
  persona: Persona;
  consentVersion: string;
  consentTextHash: string;
  requestType: RequestType;
  email: string;
  company?: string;
  role?: string;
  preferredContactPurpose?: string;
  honeypot?: string;
};

const unifiedIds = rangeIds("U", 1, 10);
const commonIds = ["C01", "C02", "C03", "C04", "C05", "C06"];
const allowedQuestionIds: Record<Persona, Set<string>> = {
  practitioner: new Set([...unifiedIds, ...commonIds, ...rangeIds("P", 7, 24)]),
  leader: new Set([...unifiedIds, ...commonIds, ...rangeIds("L", 7, 25)]),
  security: new Set([...unifiedIds, ...commonIds, ...rangeIds("S", 7, 26)]),
};

type QuestionRule = {
  options: Record<string, number | null>;
  dimension?: string;
  scored?: boolean;
  multi?: boolean;
  maxSelections?: number;
};

const surveyVersion = "2026-06-21";
const scoringVersion = "2026-06-21";

const unscored = nullOptions;
const maturity = scoreOptions({
  none: 0,
  planning: 1,
  partial: 2,
  mostly: 3,
  established: 4,
  unknown: 0,
  not_applicable: null,
});
const yesPartialNo = scoreOptions({
  yes: 4,
  partial: 2,
  no: 0,
  unknown: 0,
  not_applicable: null,
});
const reverseIncident = scoreOptions({ yes: 0, partial: 1, no: 4, unknown: 0 });
const account = scoreOptions({ company: 4, mixed: 2, personal: 0, unknown: 0 });
const infoType = scoreOptions({
  public: 4,
  internal_general: 2,
  customer_contract: 1,
  personal_data: 0,
  confidential: 0,
  unknown: 0,
});

const commonRules: Record<string, QuestionRule> = {
  C01: rule(unscored(["practitioner", "executive", "ai_dx", "security_policy", "other"])),
  C02: rule(unscored(["1_10", "11_50", "51_300", "301_1000", "1001_plus", "prefer_not"])),
  C03: rule(
    unscored([
      "it_software",
      "professional_services",
      "manufacturing",
      "finance_insurance",
      "commerce",
      "education",
      "public_nonprofit",
      "healthcare",
      "media_content",
      "other",
      "prefer_not",
    ]),
  ),
  C04: rule(unscored(["none", "personal", "team", "pilot", "formal_some", "companywide", "unknown"])),
  C05: rule(
    unscored([
      "gen_ai",
      "copilot",
      "internal_chatbot",
      "rag",
      "agent_automation",
      "coding",
      "media_generation",
      "none",
      "other",
    ]),
    { multi: true, maxSelections: 4 },
  ),
  C06: rule(
    unscored([
      "time_saving",
      "quality",
      "cost",
      "customer_experience",
      "decision_support",
      "risk_management",
      "new_service",
      "unclear",
    ]),
  ),
};

const workflow = unscored([
  "documents",
  "research",
  "customer_support",
  "internal_search",
  "code_data",
  "external_action",
  "other",
]);
const barrier = unscored(["security", "accuracy", "budget", "ownership", "data", "change", "unknown"]);
const support = unscored(["checklist", "policy_template", "priority_report", "risk_review", "pilot_plan", "unknown"]);
const unifiedRules: Record<string, QuestionRule> = {
  U01: rule(unscored(["direct_user", "adoption_owner", "security_owner", "unclear"])),
  U02: rule(unscored(["1_10", "11_50", "51_300", "301_1000", "1001_plus", "prefer_not"])),
  U03: rule(commonRules.C05.options, { multi: true, maxSelections: 4 }),
  U04: rule(workflow, { multi: true, maxSelections: 3 }),
  U05: rule(
    scoreOptions({
      wrong_answer: 1,
      source_check: 1,
      data_leak: 0,
      approval_gap: 0,
      where_to_start: 1,
      effect_cost: 1,
      unknown_usage: 0,
    }),
  ),
  U06: rule(
    scoreOptions({
      none: 4,
      public_only: 4,
      internal_general: 2,
      customer_contract: 1,
      personal_confidential: 0,
      unknown: 0,
    }),
    { scored: true, dimension: "정보 입력 위험" },
  ),
  U07: rule(
    scoreOptions({
      always: 4,
      important_only: 2,
      rarely: 0,
      no_standard: 0,
      unknown: 0,
    }),
    { scored: true, dimension: "답변 검토 기준" },
  ),
  U08: rule(
    scoreOptions({
      clear: 4,
      partial: 2,
      verbal: 1,
      none: 0,
      unknown: 0,
    }),
    { scored: true, dimension: "사용 기준 성숙도" },
  ),
  U09: rule(support),
  U10: rule(unscored(["result_only", "checklist", "interview", "pilot", "later"])),
};

const questionRules: Record<Persona, Record<string, QuestionRule>> = {
  practitioner: {
    ...unifiedRules,
    ...commonRules,
    P07: rule(unscored(["none", "monthly", "weekly", "several_weekly", "daily", "unknown"])),
    P08: rule(workflow, { multi: true, maxSelections: 3 }),
    P09: rule(yesPartialNo, { scored: true, dimension: "정책 인지도" }),
    P10: rule(account, { scored: true, dimension: "정보보호" }),
    P11: rule(infoType, { scored: true, dimension: "정보보호", multi: true, maxSelections: 3 }),
    P12: rule(yesPartialNo, { scored: true, dimension: "정보보호" }),
    P13: rule(maturity, { scored: true, dimension: "정책 인지도" }),
    P14: rule(maturity, { scored: true, dimension: "답변 신뢰성" }),
    P15: rule(maturity, { scored: true, dimension: "답변 신뢰성" }),
    P16: rule(maturity, { scored: true, dimension: "안전한 활용 준비도" }),
    P17: rule(maturity, { scored: true, dimension: "답변 신뢰성" }),
    P18: rule(maturity, { scored: true, dimension: "안전한 활용 준비도" }),
    P19: rule(maturity, { scored: true, dimension: "안전한 활용 준비도" }),
    P20: rule(maturity, { scored: true, dimension: "정책 인지도" }),
    P21: rule(reverseIncident, { scored: true, dimension: "답변 신뢰성" }),
    P22: rule(maturity, { scored: true, dimension: "업무 적합성" }),
    P23: rule(barrier, { multi: true, maxSelections: 2 }),
    P24: rule(support),
  },
  leader: {
    ...unifiedRules,
    ...commonRules,
    L07: rule(unscored(["operations", "sales_cs", "hr", "finance", "product_it", "companywide", "unknown"])),
    L08: rule(workflow, { multi: true, maxSelections: 3 }),
    L09: rule(maturity, { scored: true, dimension: "업무 우선순위" }),
    L10: rule(maturity, { scored: true, dimension: "도입 목적 명확성" }),
    L11: rule(commonRules.C06.options, { multi: true, maxSelections: 3 }),
    L12: rule(yesPartialNo, { scored: true, dimension: "도입 목적 명확성" }),
    L13: rule(yesPartialNo, { scored: true, dimension: "위험관리" }),
    L14: rule(maturity, { scored: true, dimension: "데이터·프로세스 준비" }),
    L15: rule(maturity, { scored: true, dimension: "데이터·프로세스 준비" }),
    L16: rule(maturity, { scored: true, dimension: "파일럿 실행 준비도" }),
    L17: rule(maturity, { scored: true, dimension: "파일럿 실행 준비도" }),
    L18: rule(maturity, { scored: true, dimension: "위험관리" }),
    L19: rule(yesPartialNo, { scored: true, dimension: "위험관리" }),
    L20: rule(maturity, { scored: true, dimension: "위험관리" }),
    L21: rule(maturity, { scored: true, dimension: "파일럿 실행 준비도" }),
    L22: rule(unscored(["none", "under_1m", "1m_3m", "3m_10m", "10m_plus", "range_review", "prefer_not"])),
    L23: rule(unscored(["within_1m", "within_3m", "within_6m", "this_year", "not_decided", "unknown"])),
    L24: rule(barrier, { multi: true, maxSelections: 2 }),
    L25: rule(support),
  },
  security: {
    ...unifiedRules,
    ...commonRules,
    ...Object.fromEntries(
      rangeIds("S", 7, 21).map((id) => [
        id,
        rule(maturity, { scored: true, dimension: securityDimensionFor(id) }),
      ]),
    ),
    S22: rule(yesPartialNo, { scored: true, dimension: "데이터·접근통제" }),
    S23: rule(maturity, { scored: true, dimension: "공급자·사고대응" }),
    S24: rule(maturity, { scored: true, dimension: "정책 성숙도" }),
    S25: rule(maturity, { scored: true, dimension: "정책 성숙도" }),
    S26: rule(support),
  },
};

const dimensionsByPersona: Record<Persona, string[]> = {
  practitioner: ["정보 입력 위험", "답변 검토 기준", "사용 기준 성숙도"],
  leader: ["정보 입력 위험", "답변 검토 기준", "사용 기준 성숙도"],
  security: ["정보 입력 위험", "답변 검토 기준", "사용 기준 성숙도"],
};

const readinessBands = [
  { min: 0, max: 39, label: "기준 정립 필요" },
  { min: 40, max: 59, label: "제한적 실험 적합" },
  { min: 60, max: 79, label: "통제 기반 확대 준비" },
  { min: 80, max: 100, label: "운영 고도화 단계" },
];

Deno.serve(async (request) => {
  const origin = request.headers.get("origin") ?? "";
  const headers = corsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    return json({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, headers);
  }
  if (!allowedOrigins.has(origin)) {
    return json({ ok: false, code: "CORS_REJECTED" }, 403, headers);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, code: "BACKEND_NOT_CONFIGURED" }, 503, headers);
  }

  const rateLimit = await applyRateLimit(supabaseUrl, serviceRoleKey, request);
  if (!rateLimit.ok) {
    return json({ ok: false, code: "RATE_LIMITED" }, 429, headers);
  }

  const raw = await request.text();
  if (raw.length > 80_000) {
    return json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413, headers);
  }

  let payload: SurveyPayload | ContactPayload;
  try {
    payload = JSON.parse(raw) as SurveyPayload | ContactPayload;
    if ((payload as { honeypot?: string }).honeypot) {
      throw new Error("HONEYPOT");
    }
  } catch (error) {
    const code = error instanceof Error && error.message === "HONEYPOT" ? "HONEYPOT" : "INVALID_JSON";
    return json({ ok: false, code }, 400, headers);
  }

  try {
    if (payload.kind === "contact_request") {
      return await handleContactRequest(payload, supabaseUrl, serviceRoleKey, headers);
    }
    return await handleSurvey(payload as SurveyPayload, supabaseUrl, serviceRoleKey, headers);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const status = statusForCode(message);
    return json({ ok: false, code: message }, status, headers);
  }
});

async function handleSurvey(
  payload: SurveyPayload,
  supabaseUrl: string,
  serviceRoleKey: string,
  headers: HeadersInit,
): Promise<Response> {
  validateSurveyPayload(payload);
  const serverResult = computeServerResult(payload);
  await rejectDuplicateIdempotency(supabaseUrl, serviceRoleKey, payload.idempotencyKey);

  const completedAt = new Date();
  const sessionExpiresAt = addMonths(completedAt, 6).toISOString();
  const sessionInsert = await tableRequest(supabaseUrl, serviceRoleKey, "survey_sessions", {
    method: "POST",
    body: [
      {
        id: payload.sessionId,
        persona: payload.persona,
        survey_version: payload.surveyVersion,
        scoring_version: payload.scoringVersion,
        completed_at: completedAt.toISOString(),
        expires_at: sessionExpiresAt,
        utm_source: normalizeText(payload.utm?.source, 80),
        utm_medium: normalizeText(payload.utm?.medium, 80),
        utm_campaign: normalizeText(payload.utm?.campaign, 120),
        utm_content: normalizeText(payload.utm?.content, 120),
      },
    ],
  });
  if (!sessionInsert.ok) {
    throw new Error("SESSION_STORAGE_FAILED");
  }

  await checkedTableRequest(supabaseUrl, serviceRoleKey, "idempotency_keys", [
    { idempotency_key: payload.idempotencyKey, session_id: payload.sessionId },
  ]);

  const answers = Object.entries(payload.answers).map(([question_id, answer]) => ({
    session_id: payload.sessionId,
    question_id,
    answer_json: answer,
    numeric_score: null,
  }));
  if (answers.length > 0) {
    await checkedTableRequest(supabaseUrl, serviceRoleKey, "survey_answers", answers);
  }

  await checkedTableRequest(supabaseUrl, serviceRoleKey, "survey_results", [
    {
      session_id: payload.sessionId,
      total_score: serverResult.totalScore,
      dimension_scores_json: serverResult.dimensionScores,
      risk_flags_json: serverResult.riskFlags,
      result_band: serverResult.resultBand,
    },
  ]);

  const hashes = payload.consents.consentTextHashes ?? {};
  await checkedTableRequest(
    supabaseUrl,
    serviceRoleKey,
    "consent_events",
    [
      ["age14OrOlder", payload.consents.age14OrOlder],
      ["surveyProcessing", payload.consents.surveyProcessing],
      ["beta", payload.consents.beta === true],
      ["interview", payload.consents.interview === true],
      ["pilot", payload.consents.pilot === true],
    ].map(([consent_type, accepted]) => ({
      session_id: payload.sessionId,
      consent_type,
      consent_version: payload.consents.consentVersion,
      consent_text_hash: hashes[String(consent_type)] ?? `edge:${functionName}:${consent_type}`,
      accepted,
      accepted_at: completedAt.toISOString(),
    })),
  );

  await checkedTableRequest(supabaseUrl, serviceRoleKey, "analytics_events", [
    {
      session_id: payload.sessionId,
      event_name: "survey_completed",
      persona: payload.persona,
      survey_version: payload.surveyVersion,
      non_sensitive_properties_json: {
        result_band: serverResult.resultBand,
        question_count: Object.keys(payload.answers).length,
      },
    },
  ]);

  return json({ ok: true, sessionId: payload.sessionId, status: "stored" }, 201, headers);
}

async function handleContactRequest(
  payload: ContactPayload,
  supabaseUrl: string,
  serviceRoleKey: string,
  headers: HeadersInit,
): Promise<Response> {
  validateContactPayload(payload);
  await rejectDuplicateIdempotency(supabaseUrl, serviceRoleKey, payload.idempotencyKey);

  const encryptedEmail = await encryptEmail(payload.email);
  await checkedTableRequest(supabaseUrl, serviceRoleKey, "contact_requests", [
    {
      session_id: payload.sessionId,
      encrypted_email: encryptedEmail,
      optional_company: normalizeText(payload.company, 120),
      request_type: payload.requestType,
      preferred_contact_purpose: normalizeText(payload.preferredContactPurpose, 120),
      expires_at: contactExpiry(payload.requestType).toISOString(),
    },
  ]);
  await checkedTableRequest(supabaseUrl, serviceRoleKey, "idempotency_keys", [
    { idempotency_key: payload.idempotencyKey, session_id: payload.sessionId },
  ]);
  await checkedTableRequest(supabaseUrl, serviceRoleKey, "consent_events", [
    {
      session_id: payload.sessionId,
      consent_type: payload.requestType,
      consent_version: payload.consentVersion,
      consent_text_hash: payload.consentTextHash,
      accepted: true,
      accepted_at: new Date().toISOString(),
    },
  ]);
  await checkedTableRequest(supabaseUrl, serviceRoleKey, "analytics_events", [
    {
      session_id: payload.sessionId,
      event_name:
        payload.requestType === "beta"
          ? "beta_optin"
          : payload.requestType === "interview"
            ? "interview_optin"
            : "pilot_requested",
      persona: payload.persona,
      survey_version: null,
      non_sensitive_properties_json: { request_type: payload.requestType },
    },
  ]);

  return json({ ok: true, sessionId: payload.sessionId, status: "contact_stored" }, 201, headers);
}

function validateSurveyPayload(payload: SurveyPayload): void {
  if (!isUuid(payload.sessionId)) throw new Error("INVALID_SESSION_ID");
  if (!isPersona(payload.persona)) throw new Error("INVALID_PERSONA");
  if (!payload.consents?.age14OrOlder) throw new Error("MISSING_AGE_CONSENT");
  if (!payload.consents?.surveyProcessing) throw new Error("MISSING_SURVEY_CONSENT");
  if (payload.surveyVersion !== surveyVersion || payload.scoringVersion !== scoringVersion) {
    throw new Error("UNKNOWN_SURVEY_VERSION");
  }
  if (!payload.consents.consentVersion) throw new Error("MISSING_VERSION");
  if (!payload.idempotencyKey || payload.idempotencyKey.length > 160) {
    throw new Error("INVALID_IDEMPOTENCY_KEY");
  }

  const allowed = allowedQuestionIds[payload.persona];
  const rules = questionRules[payload.persona];
  for (const questionId of unifiedIds) {
    if (payload.answers?.[questionId] === undefined) {
      throw new Error("MISSING_REQUIRED_ANSWER");
    }
  }
  for (const [questionId, answer] of Object.entries(payload.answers ?? {})) {
    if (!allowed.has(questionId)) {
      throw new Error("INVALID_QUESTION_ID");
    }
    const question = rules[questionId];
    const values = Array.isArray(answer) ? answer : [answer];
    if (question.multi !== true && Array.isArray(answer)) {
      throw new Error("INVALID_ANSWER_TYPE");
    }
    if (question.multi === true && !Array.isArray(answer)) {
      throw new Error("INVALID_ANSWER_TYPE");
    }
    if (question.maxSelections && values.length > question.maxSelections) {
      throw new Error("INVALID_MULTI_SELECT_LIMIT");
    }
    for (const value of values) {
      if (typeof value !== "string" || value.length > 160 || /[<>]/.test(value)) {
        throw new Error("INVALID_ANSWER");
      }
      if (!(value in question.options)) {
        throw new Error("INVALID_ANSWER");
      }
    }
  }
}

function computeServerResult(payload: SurveyPayload): {
  totalScore: number;
  resultBand: string;
  dimensionScores: Record<string, number>;
  riskFlags: string[];
} {
  const rules = questionRules[payload.persona];
  const totals = new Map(dimensionsByPersona[payload.persona].map((dimension) => [dimension, { score: 0, max: 0 }]));
  const informationGaps: string[] = [];

  for (const [questionId, rule] of Object.entries(rules)) {
    if (!rule.scored || !rule.dimension) continue;
    const answer = payload.answers[questionId];
    const values = Array.isArray(answer) ? answer : [answer];
    if (values.every((value) => value === "not_applicable" || value === "prefer_not")) continue;

    const scores = values
      .filter((value) => value !== "not_applicable" && value !== "prefer_not")
      .map((value) => rule.options[value])
      .filter((score): score is number => typeof score === "number");
    if (scores.length === 0) continue;
    if (values.includes("unknown")) informationGaps.push(questionId);

    const total = totals.get(rule.dimension) ?? { score: 0, max: 0 };
    total.score += Math.min(...scores);
    total.max += 4;
    totals.set(rule.dimension, total);
  }

  const dimensionScores = Object.fromEntries(
    [...totals.entries()].map(([dimension, total]) => [
      dimension,
      total.max === 0 ? 0 : Math.round((total.score / total.max) * 100),
    ]),
  );
  const scores = [...totals.values()].filter((total) => total.max > 0).map((total) => Math.round((total.score / total.max) * 100));
  const totalScore = scores.length === 0 ? 0 : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const criticalWarnings = criticalWarningsFor(payload);
  const riskFlags = unique([
    ...criticalWarnings,
    ...(informationGaps.length > 0 ? ["정보 공백: 모름 응답이 있어 추가 확인이 필요합니다."] : []),
    ...Object.entries(dimensionScores)
      .filter(([, score]) => score < 40)
      .map(([dimension]) => `${dimension}: 기준 보완이 필요합니다.`),
    ...defaultRiskReviewPrompts(),
  ]).slice(0, 6);
  const band = criticalWarnings.length > 0 ? readinessBands[0] : readinessBandFor(totalScore);

  return { totalScore, resultBand: displayRiskBandFor(band.label), dimensionScores, riskFlags };
}

function criticalWarningsFor(payload: SurveyPayload): string[] {
  const answers = payload.answers;
  const warnings: string[] = [];

  if (answers.U06 === "customer_contract" || answers.U06 === "personal_confidential") {
    warnings.push("회사 자료나 고객 정보가 AI에 입력될 가능성이 있습니다.");
  }
  if (answers.U07 === "rarely" || answers.U07 === "no_standard") {
    warnings.push("AI 답변을 사람 검토 없이 사용할 수 있습니다.");
  }
  if (answers.U08 === "none" || answers.U08 === "verbal" || answers.U08 === "unknown") {
    warnings.push("승인된 AI 도구 목록이나 사용정책이 명확하지 않습니다.");
  }

  return unique(warnings);
}

function defaultRiskReviewPrompts(): string[] {
  return [
    "AI에 입력하면 안 되는 회사 자료와 고객 정보를 먼저 정하세요.",
    "AI 답변을 외부 제출 전에 사람이 확인해야 하는 업무를 정하세요.",
    "회사에서 허용하는 AI 도구와 사용 기준을 확인하세요.",
  ];
}

function readinessBandFor(score: number): { min: number; max: number; label: string } {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  return readinessBands.find((band) => normalized >= band.min && normalized <= band.max) ?? readinessBands[0];
}

function displayRiskBandFor(label: string): string {
  if (label === "기준 정립 필요") return "즉시 점검 필요";
  if (label === "제한적 실험 적합") return "위험";
  if (label === "통제 기반 확대 준비") return "주의";
  return "낮음";
}

function validateContactPayload(payload: ContactPayload): void {
  if (!isUuid(payload.sessionId)) throw new Error("INVALID_SESSION_ID");
  if (!isPersona(payload.persona)) throw new Error("INVALID_PERSONA");
  if (!["beta", "interview", "pilot"].includes(payload.requestType)) {
    throw new Error("INVALID_REQUEST_TYPE");
  }
  if (!payload.idempotencyKey || payload.idempotencyKey.length > 160) {
    throw new Error("INVALID_IDEMPOTENCY_KEY");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) || payload.email.length > 254) {
    throw new Error("INVALID_EMAIL");
  }
  if ((payload.company ?? "").length > 120 || (payload.preferredContactPurpose ?? "").length > 120) {
    throw new Error("INVALID_CONTACT_LENGTH");
  }
}

async function rejectDuplicateIdempotency(
  supabaseUrl: string,
  serviceRoleKey: string,
  idempotencyKey: string,
): Promise<void> {
  const key = encodeURIComponent(idempotencyKey);
  const existing = await fetch(`${supabaseUrl}/rest/v1/idempotency_keys?idempotency_key=eq.${key}&select=session_id`, {
    headers: restHeaders(serviceRoleKey),
  });
  if (!existing.ok) throw new Error("IDEMPOTENCY_CHECK_FAILED");
  const rows = (await existing.json()) as unknown[];
  if (rows.length > 0) throw new Error("DUPLICATE_IDEMPOTENCY_KEY");
}

async function applyRateLimit(
  supabaseUrl: string,
  serviceRoleKey: string,
  request: Request,
): Promise<{ ok: boolean }> {
  const keyMaterial =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const keyHash = await sha256Hex(`agentproof:${keyMaterial}`);
  const now = new Date();
  const windowMinutes = 10;
  const maxRequests = 30;
  const existing = await fetch(`${supabaseUrl}/rest/v1/rate_limit_keys?key_hash=eq.${keyHash}&select=*`, {
    headers: restHeaders(serviceRoleKey),
  });
  if (!existing.ok) return { ok: false };
  const rows = (await existing.json()) as Array<{ request_count: number; window_started_at: string }>;
  const windowStartedAt = rows[0] ? new Date(rows[0].window_started_at) : now;
  const isFreshWindow = now.getTime() - windowStartedAt.getTime() < windowMinutes * 60_000;
  const count = isFreshWindow ? rows[0]?.request_count ?? 0 : 0;
  if (count >= maxRequests) return { ok: false };

  const body = {
    key_hash: keyHash,
    request_count: count + 1,
    window_started_at: isFreshWindow ? windowStartedAt.toISOString() : now.toISOString(),
    expires_at: new Date(now.getTime() + windowMinutes * 60_000).toISOString(),
  };
  const result =
    rows.length > 0
      ? await fetch(`${supabaseUrl}/rest/v1/rate_limit_keys?key_hash=eq.${keyHash}`, {
          method: "PATCH",
          headers: restHeaders(serviceRoleKey),
          body: JSON.stringify(body),
        })
      : await fetch(`${supabaseUrl}/rest/v1/rate_limit_keys`, {
          method: "POST",
          headers: restHeaders(serviceRoleKey),
          body: JSON.stringify([body]),
        });
  return { ok: result.ok };
}

async function checkedTableRequest(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
  body: unknown,
): Promise<void> {
  const result = await tableRequest(supabaseUrl, serviceRoleKey, table, { method: "POST", body });
  if (!result.ok) {
    throw new Error(`${table.toUpperCase()}_STORAGE_FAILED`);
  }
}

async function tableRequest(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
  input: { method: "POST"; body: unknown },
): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: input.method,
    headers: restHeaders(serviceRoleKey),
    body: JSON.stringify(input.body),
  });
}

function restHeaders(serviceRoleKey: string): HeadersInit {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    prefer: "return=minimal",
  };
}

async function encryptEmail(email: string): Promise<string> {
  const secret = Deno.env.get("CONTACT_ENCRYPTION_KEY") ?? getServiceRoleKey();
  if (!secret) throw new Error("EMAIL_ENCRYPTION_NOT_CONFIGURED");
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.slice(0, 64).padEnd(32, "0")),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(email.trim().toLowerCase()),
  );
  return `aesgcm:${base64(salt)}:${base64(iv)}:${base64(new Uint8Array(ciphertext))}`;
}

function getServiceRoleKey(): string | undefined {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return undefined;

  try {
    const parsed = JSON.parse(secretKeys) as Record<string, unknown>;
    const defaultKey = parsed.default;
    if (typeof defaultKey === "string" && defaultKey.length > 0) return defaultKey;
    return Object.values(parsed).find((value): value is string => typeof value === "string" && value.length > 0);
  } catch {
    return undefined;
  }
}

async function sha256Hex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "access-control-allow-origin": allowedOrigins.has(origin) ? origin : "null",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-agentproof-idempotency-key",
    "vary": "Origin",
  };
}

function json(body: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json; charset=utf-8" },
  });
}

function statusForCode(code: string): number {
  if (code === "DUPLICATE_IDEMPOTENCY_KEY") return 409;
  if (code === "PAYLOAD_TOO_LARGE") return 413;
  if (code === "RATE_LIMITED") return 429;
  if (code === "IDEMPOTENCY_CHECK_FAILED") return 500;
  if (code.includes("STORAGE_FAILED")) return 500;
  return 400;
}

function rangeIds(prefix: string, start: number, end: number): string[] {
  return Array.from({ length: end - start + 1 }, (_, index) => `${prefix}${String(index + start).padStart(2, "0")}`);
}

function nullOptions(values: string[]): Record<string, null> {
  return Object.fromEntries(values.map((value) => [value, null]));
}

function scoreOptions(values: Record<string, number | null>): Record<string, number | null> {
  return values;
}

function rule(
  options: Record<string, number | null>,
  extras: Omit<QuestionRule, "options"> = {},
): QuestionRule {
  return { options, ...extras };
}

function securityDimensionFor(questionId: string): string {
  if (["S07", "S08", "S09"].includes(questionId)) return "AI 사용 현황";
  if (["S10", "S11", "S12"].includes(questionId)) return "정책 성숙도";
  if (["S13", "S14", "S15"].includes(questionId)) return "데이터·접근통제";
  if (["S16", "S17", "S20", "S21"].includes(questionId)) return "검증·모니터링";
  return "공급자·사고대응";
}

function isPersona(value: string): value is Persona {
  return value === "practitioner" || value === "leader" || value === "security";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function contactExpiry(type: RequestType): Date {
  const now = new Date();
  if (type === "interview") return addDays(now, 90);
  if (type === "pilot") return addMonths(now, 12);
  return addMonths(now, 12);
}

function normalizeText(value: string | undefined, max: number): string | null {
  if (!value) return null;
  return value.replace(/[<>]/g, "").trim().slice(0, max) || null;
}

function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
