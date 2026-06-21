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
  result: {
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

const commonIds = ["C01", "C02", "C03", "C04", "C05", "C06"];
const allowedQuestionIds: Record<Persona, Set<string>> = {
  practitioner: new Set([...commonIds, ...rangeIds("P", 7, 24)]),
  leader: new Set([...commonIds, ...rangeIds("L", 7, 25)]),
  security: new Set([...commonIds, ...rangeIds("S", 7, 26)]),
};

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
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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

  await tableRequest(supabaseUrl, serviceRoleKey, "idempotency_keys", {
    method: "POST",
    body: [{ idempotency_key: payload.idempotencyKey, session_id: payload.sessionId }],
  });

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
      total_score: payload.result.totalScore,
      dimension_scores_json: payload.result.dimensionScores,
      risk_flags_json: payload.result.riskFlags,
      result_band: payload.result.resultBand,
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
        result_band: payload.result.resultBand,
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
  if (!payload.surveyVersion || !payload.scoringVersion || !payload.consents.consentVersion) {
    throw new Error("MISSING_VERSION");
  }
  if (!payload.idempotencyKey || payload.idempotencyKey.length > 160) {
    throw new Error("INVALID_IDEMPOTENCY_KEY");
  }
  if (payload.result.totalScore < 0 || payload.result.totalScore > 100) {
    throw new Error("INVALID_SCORE");
  }

  const allowed = allowedQuestionIds[payload.persona];
  for (const [questionId, answer] of Object.entries(payload.answers ?? {})) {
    if (!allowed.has(questionId)) {
      throw new Error("INVALID_QUESTION_ID");
    }
    const values = Array.isArray(answer) ? answer : [answer];
    for (const value of values) {
      if (typeof value !== "string" || value.length > 160 || /[<>]/.test(value)) {
        throw new Error("INVALID_ANSWER");
      }
    }
  }
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
  const secret = Deno.env.get("CONTACT_ENCRYPTION_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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
