// Supabase Edge Function for AgentProof survey submissions.
// Deploy only after SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and allowed origins are configured.

const allowedOrigins = new Set([
  "https://agentproofkr.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

type Submission = {
  sessionId: string;
  persona: "practitioner" | "leader" | "security";
  surveyVersion: string;
  scoringVersion: string;
  idempotencyKey: string;
  honeypot?: string;
  answers: Record<string, string | string[]>;
  result: {
    totalScore: number;
    resultBand: string;
    dimensionScores: Record<string, number>;
    riskFlags: string[];
  };
  consents: {
    age14OrOlder: boolean;
    surveyProcessing: boolean;
    beta: boolean;
    interview: boolean;
    pilot: boolean;
    consentVersion: string;
  };
  contacts: Array<{
    requestType: "beta" | "interview" | "pilot";
    email: string;
    company?: string;
    preferredContactPurpose?: string;
  }>;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
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

  const raw = await request.text();
  if (raw.length > 80_000) {
    return json({ ok: false, code: "PAYLOAD_TOO_LARGE" }, 413, headers);
  }

  let payload: Submission;
  try {
    payload = JSON.parse(raw) as Submission;
    validateSubmission(payload);
  } catch (error) {
    return json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid payload",
      },
      400,
      headers,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, code: "BACKEND_NOT_CONFIGURED" }, 503, headers);
  }

  const idempotency = await tableRequest(supabaseUrl, serviceRoleKey, "idempotency_keys", {
    method: "POST",
    body: [{ idempotency_key: payload.idempotencyKey, session_id: payload.sessionId }],
    prefer: "resolution=ignore-duplicates",
  });
  if (!idempotency.ok) {
    return json({ ok: false, code: "DUPLICATE_OR_STORAGE_ERROR" }, 409, headers);
  }

  const sessionExpiresAt = addMonths(new Date(), 6).toISOString();
  const session = await tableRequest(supabaseUrl, serviceRoleKey, "survey_sessions", {
    method: "POST",
    body: [
      {
        id: payload.sessionId,
        persona: payload.persona,
        survey_version: payload.surveyVersion,
        scoring_version: payload.scoringVersion,
        completed_at: new Date().toISOString(),
        expires_at: sessionExpiresAt,
        utm_source: payload.utm?.source ?? null,
        utm_medium: payload.utm?.medium ?? null,
        utm_campaign: payload.utm?.campaign ?? null,
        utm_content: payload.utm?.content ?? null,
      },
    ],
  });
  if (!session.ok) {
    return json({ ok: false, code: "SESSION_STORAGE_FAILED" }, 500, headers);
  }

  await tableRequest(supabaseUrl, serviceRoleKey, "survey_answers", {
    method: "POST",
    body: Object.entries(payload.answers).map(([question_id, answer]) => ({
      session_id: payload.sessionId,
      question_id,
      answer_json: answer,
      numeric_score: null,
    })),
  });

  await tableRequest(supabaseUrl, serviceRoleKey, "survey_results", {
    method: "POST",
    body: [
      {
        session_id: payload.sessionId,
        total_score: payload.result.totalScore,
        dimension_scores_json: payload.result.dimensionScores,
        risk_flags_json: payload.result.riskFlags,
        result_band: payload.result.resultBand,
      },
    ],
  });

  await tableRequest(supabaseUrl, serviceRoleKey, "consent_events", {
    method: "POST",
    body: [
      ["age14OrOlder", payload.consents.age14OrOlder],
      ["surveyProcessing", payload.consents.surveyProcessing],
      ["beta", payload.consents.beta],
      ["interview", payload.consents.interview],
      ["pilot", payload.consents.pilot],
    ].map(([consent_type, accepted]) => ({
      session_id: payload.sessionId,
      consent_type,
      consent_version: payload.consents.consentVersion,
      consent_text_hash: `edge:${consent_type}:${payload.consents.consentVersion}`,
      accepted,
      accepted_at: new Date().toISOString(),
    })),
  });

  return json({ ok: true, sessionId: payload.sessionId }, 201, headers);
});

function validateSubmission(payload: Submission): void {
  if (payload.honeypot) {
    throw new Error("bot submission rejected");
  }
  if (!payload.consents?.age14OrOlder) {
    throw new Error("age confirmation required");
  }
  if (!payload.consents?.surveyProcessing) {
    throw new Error("survey processing consent required");
  }
  if (!["practitioner", "leader", "security"].includes(payload.persona)) {
    throw new Error("invalid persona");
  }
  if (!payload.sessionId || !payload.idempotencyKey) {
    throw new Error("missing session or idempotency key");
  }
  for (const contact of payload.contacts ?? []) {
    if (contact.email.length > 254 || !contact.email.includes("@")) {
      throw new Error("invalid contact email");
    }
    if ((contact.company ?? "").length > 120) {
      throw new Error("company too long");
    }
  }
}

async function tableRequest(
  supabaseUrl: string,
  serviceRoleKey: string,
  table: string,
  input: { method: "POST"; body: unknown; prefer?: string },
): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: input.method,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: input.prefer ?? "return=minimal",
    },
    body: JSON.stringify(input.body),
  });
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

function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}
