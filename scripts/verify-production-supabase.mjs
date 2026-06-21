import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_PROJECT_REF",
  "NEXT_PUBLIC_SURVEY_API_URL",
];

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(", ")}`);
}

const supabaseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const functionUrl = process.env.NEXT_PUBLIC_SURVEY_API_URL;
const productionOrigin = process.env.PRODUCTION_ORIGIN ?? "https://agentproof.ain99.net";
const qaPrefix = `qa-${Date.now()}`;
const personas = ["practitioner", "leader", "security"];
const managedSessionIds = new Set();
const managedIdempotencyKeys = new Set();
let cleanupAttempted = false;

const evidence = {
  ok: false,
  generatedAt: new Date().toISOString(),
  functionUrlConfigured: functionUrl.endsWith("/functions/v1/survey-submit"),
  project: {},
  migration: { tables: {}, rls: {} },
  submissions: {},
  security: {},
  retention: {},
  cleanup: {},
};

let failure;
try {
  await runVerification();
  await cleanupQaRecords();
  assertEvidence();
  evidence.ok = true;
} catch (error) {
  failure = error;
  evidence.error = {
    message: error instanceof Error ? error.message : String(error),
  };
} finally {
  if (!cleanupAttempted) {
    try {
      await cleanupQaRecords();
    } catch (cleanupError) {
      evidence.cleanup.error = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      failure ??= cleanupError;
    }
  }
  await writeEvidenceFile();
}

if (failure) {
  throw failure;
}

console.log(JSON.stringify({ ok: true, evidence: "artifacts/qa/logs/production-storage-verification.json" }));

async function runVerification() {
  evidence.project = await fetchProjectInfo();

  const tables = [
    "survey_sessions",
    "survey_answers",
    "survey_results",
    "contact_requests",
    "consent_events",
    "analytics_events",
    "deletion_audit_events",
    "rate_limit_keys",
    "idempotency_keys",
  ];

  const rlsStatus = await fetchRlsStatus();
  for (const table of tables) {
    evidence.migration.tables[table] = await tableExists(table);
    evidence.migration.rls[table] = rlsStatus[table] === true;
  }

  const anonKey = await fetchAnonKey();
  evidence.security.anonKeyRetrieved = Boolean(anonKey);
  evidence.security.noApiKeyReadStatus = (
    await fetch(`${supabaseUrl}/rest/v1/survey_sessions?select=id&limit=1`)
  ).status;
  if (anonKey) {
    const anonRead = await fetch(`${supabaseUrl}/rest/v1/survey_sessions?select=id&limit=1`, {
      headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
    });
    const anonReadRows = anonRead.ok ? await safeJsonArray(anonRead) : [];
    evidence.security.anonRead = { status: anonRead.status, rowCount: anonReadRows.length };
    const anonWrite = await fetch(`${supabaseUrl}/rest/v1/survey_sessions`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        authorization: `Bearer ${anonKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([{ id: crypto.randomUUID(), persona: "leader" }]),
    });
    evidence.security.anonWriteRejected = !anonWrite.ok;
    evidence.security.anonWriteStatus = anonWrite.status;
  }

  for (const persona of personas) {
    const payload = buildSurveyPayload(persona);
    managedSessionIds.add(payload.sessionId);
    managedIdempotencyKeys.add(payload.idempotencyKey);

    const response = await postFunction(payload, productionOrigin);
    assert(response.status === 201, `${persona} survey submission failed: ${response.status}`);

    evidence.submissions[persona] = await verifyStoredSurvey(payload);

    for (const requestType of ["beta", "interview", "pilot"]) {
      const contactPayload = buildContactPayload(payload, requestType);
      managedIdempotencyKeys.add(contactPayload.idempotencyKey);
      const contactResponse = await postFunction(contactPayload, productionOrigin);
      assert(contactResponse.status === 201, `${persona} ${requestType} contact failed: ${contactResponse.status}`);
    }

    const contacts = await selectRows(
      `contact_requests?session_id=eq.${payload.sessionId}&select=encrypted_email,optional_company,request_type`,
    );
    const consentEventsAfterContacts = await countRows(`consent_events?session_id=eq.${payload.sessionId}&select=id`);
    evidence.submissions[persona].contactRequests = contacts.length;
    evidence.submissions[persona].contactTypes = contacts.map((row) => row.request_type).sort();
    evidence.submissions[persona].consentEventsAfterContacts = consentEventsAfterContacts;
    evidence.submissions[persona].rawEmailContactRowsAfterContacts = contacts.filter((row) =>
      String(row.encrypted_email ?? "").includes("@"),
    ).length;

    const replay = await postFunction(payload, productionOrigin);
    evidence.security[`${persona}ReplayStatus`] = replay.status;
  }

  evidence.security.honeypotStatus = (
    await postFunction({ ...buildSurveyPayload("leader"), honeypot: "filled" }, productionOrigin)
  ).status;
  evidence.security.invalidQuestionStatus = (
    await postFunction(
      {
        ...buildSurveyPayload("leader"),
        idempotencyKey: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        answers: { X999: "forged" },
      },
      productionOrigin,
    )
  ).status;
  evidence.security.invalidAnswerStatus = (
    await postFunction(
      {
        ...buildSurveyPayload("leader"),
        idempotencyKey: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        answers: { ...personaAnswers("leader", commonAnswers("leader")), U01: "<script>" },
      },
      productionOrigin,
    )
  ).status;
  evidence.security.oversizedPayloadStatus = (
    await fetch(functionUrl, {
      method: "POST",
      headers: { origin: productionOrigin, "content-type": "application/json" },
      body: JSON.stringify({ fill: "x".repeat(90_000) }),
    })
  ).status;
  evidence.security.corsRejectedStatus = (await postFunction(buildSurveyPayload("leader"), "https://evil.example")).status;
  evidence.security.rateLimitStatus = await triggerRateLimit();

  const expiredSessionId = crypto.randomUUID();
  managedSessionIds.add(expiredSessionId);
  await insertRows("survey_sessions", [
    {
      id: expiredSessionId,
      persona: "leader",
      survey_version: "2026-06-21",
      scoring_version: "2026-06-21",
      completed_at: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      utm_source: "agentproof_qa",
      utm_medium: "release_verification",
      utm_campaign: "retention",
      utm_content: qaPrefix,
    },
  ]);
  await insertRows("contact_requests", [
    {
      session_id: expiredSessionId,
      encrypted_email: "qa-expired-redacted",
      request_type: "beta",
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const retentionRpc = await fetch(`${supabaseUrl}/rest/v1/rpc/delete_expired_agentproof_data`, {
    method: "POST",
    headers: serviceHeaders(),
    body: "{}",
  });
  evidence.retention.rpcStatus = retentionRpc.status;
  evidence.retention.expiredSessionRowsRemaining = await countRows(`survey_sessions?id=eq.${expiredSessionId}&select=id`);
  evidence.retention.expiredContactRowsRemaining = await countRows(
    `contact_requests?session_id=eq.${expiredSessionId}&select=id`,
  );
}

function assertEvidence() {
  assert(evidence.functionUrlConfigured, "Survey API URL is not the survey-submit function URL");
  assert(evidence.project.managementStatus === 200, "Supabase project metadata lookup failed");
  assert(Boolean(evidence.project.region), "Supabase project region was not returned");
  assert(Object.values(evidence.migration.tables).every(Boolean), "Not all tables exist");
  assert(Object.values(evidence.migration.rls).every(Boolean), "Not all tables have RLS enabled");

  for (const persona of personas) {
    const item = evidence.submissions[persona];
    assert(item.sessionRows === 1, `${persona}: missing session row`);
    assert(item.answerRows === 10, `${persona}: expected 10 unified answer rows`);
    assert(item.questionIds.every((id) => /^U\d{2}$/.test(id)), `${persona}: non-unified question IDs stored`);
    assert(item.resultRows === 1, `${persona}: missing result row`);
    assert(item.requiredConsentRows >= 2, `${persona}: missing required consent rows`);
    assert(item.contactRequests === 3, `${persona}: expected three separate contact requests`);
    assert(item.answerRowsWithEmail === 0, `${persona}: email leaked into answers`);
    assert(item.rawEmailContactRows === 0, `${persona}: raw email stored before contact verification`);
    assert(item.rawEmailContactRowsAfterContacts === 0, `${persona}: raw email stored in contact table`);
    assert(item.analyticsRowsWithPii === 0, `${persona}: analytics rows contain PII-like content`);
    assert(item.utmSource === "agentproof_qa", `${persona}: UTM source not stored`);
    assert(item.clientScoreIgnored === true, `${persona}: client-supplied score was stored`);
    assert(item.clientBandIgnored === true, `${persona}: client-supplied band was stored`);
    assert(item.clientRiskIgnored === true, `${persona}: client-supplied risk flag was stored`);
    assert(item.riskFlagCount > 0, `${persona}: critical risk flags were not stored`);
  }

  assert(evidence.security.anonKeyRetrieved, "Could not retrieve anon key for RLS verification");
  assert(evidence.security.anonRead?.rowCount === 0, "Anonymous direct read returned rows");
  assert(evidence.security.anonWriteRejected === true, "Anonymous direct write was not rejected");
  assert(personas.every((persona) => evidence.security[`${persona}ReplayStatus`] === 409), "Replay rejection failed");
  assert(evidence.security.honeypotStatus === 400, "Honeypot rejection failed");
  assert(evidence.security.invalidQuestionStatus === 400, "Invalid question rejection failed");
  assert(evidence.security.invalidAnswerStatus === 400, "Invalid answer rejection failed");
  assert(evidence.security.oversizedPayloadStatus === 413, "Oversized payload rejection failed");
  assert(evidence.security.corsRejectedStatus === 403, "CORS rejection failed");
  assert(evidence.security.rateLimitStatus === 429, "Rate limiting did not trigger");
  assert(evidence.retention.rpcStatus >= 200 && evidence.retention.rpcStatus < 300, "Retention RPC failed");
  assert(evidence.retention.expiredSessionRowsRemaining === 0, "Expired session was not deleted");
  assert(evidence.retention.expiredContactRowsRemaining === 0, "Expired contact was not deleted");
  assert(evidence.cleanup.remainingSessions === 0, "QA sessions not deleted");
  assert(evidence.cleanup.remainingAnalytics === 0, "QA analytics rows not deleted");
  assert(evidence.cleanup.remainingIdempotencyKeys === 0, "QA idempotency keys not deleted");
}

function buildSurveyPayload(persona) {
  const sessionId = crypto.randomUUID();
  return {
    kind: "survey",
    sessionId,
    persona,
    surveyVersion: "2026-06-21",
    scoringVersion: "2026-06-21",
    idempotencyKey: crypto.randomUUID(),
    honeypot: "",
    answers: personaAnswers(persona, commonAnswers(persona)),
    result: {
      totalScore: 100,
      resultBand: "forged-client-band",
      dimensionScores: { forged: 100 },
      riskFlags: ["forged-client-risk"],
    },
    consents: {
      age14OrOlder: true,
      surveyProcessing: true,
      beta: false,
      interview: false,
      pilot: false,
      consentVersion: "2026-06-21",
      consentTextHashes: {
        age14OrOlder: "qa-hash-age",
        surveyProcessing: "qa-hash-survey",
        beta: "qa-hash-beta",
        interview: "qa-hash-interview",
        pilot: "qa-hash-pilot",
      },
    },
    contacts: [],
    utm: {
      source: "agentproof_qa",
      medium: "release_verification",
      campaign: "g4_g9_storage",
      content: `${persona}_${qaPrefix}`,
    },
  };
}

function commonAnswers(persona) {
  return {
    U01: persona === "security" ? "security_owner" : persona === "leader" ? "adoption_owner" : "direct_user",
    U02: "51_300",
    U03: ["gen_ai", "copilot"],
    U04: ["documents", "research"],
    U05: persona === "security" ? "data_leak" : persona === "leader" ? "effect_cost" : "wrong_answer",
    U06: "personal_confidential",
    U07: "rarely",
    U08: "none",
    U09: persona === "security" ? "risk_review" : persona === "leader" ? "priority_report" : "checklist",
    U10: persona === "leader" ? "pilot" : persona === "security" ? "interview" : "checklist",
  };
}

function personaAnswers(persona, answers) {
  return answers;
}

function buildContactPayload(surveyPayload, requestType) {
  return {
    kind: "contact_request",
    sessionId: surveyPayload.sessionId,
    idempotencyKey: crypto.randomUUID(),
    persona: surveyPayload.persona,
    consentVersion: "2026-06-21",
    consentTextHash: `qa-contact-hash-${requestType}`,
    requestType,
    email: `${qaPrefix}+${surveyPayload.persona}-${requestType}@example.invalid`,
    company: requestType === "pilot" ? "QA redacted team" : undefined,
    role: surveyPayload.persona,
    preferredContactPurpose: requestType,
    honeypot: "",
  };
}

async function verifyStoredSurvey(payload) {
  const sessionRows = await selectRows(`survey_sessions?id=eq.${payload.sessionId}&select=*`);
  const answerRows = await selectRows(`survey_answers?session_id=eq.${payload.sessionId}&select=question_id,answer_json`);
  const resultRows = await selectRows(`survey_results?session_id=eq.${payload.sessionId}&select=*`);
  const consentRows = await selectRows(`consent_events?session_id=eq.${payload.sessionId}&select=*`);
  const rawContacts = await selectRows(
    `contact_requests?session_id=eq.${payload.sessionId}&select=encrypted_email,optional_company,request_type`,
  );
  const analyticsRows = await selectRows(
    `analytics_events?session_id=eq.${payload.sessionId}&select=event_name,non_sensitive_properties_json`,
  );
  const answerText = JSON.stringify(answerRows);
  const analyticsText = JSON.stringify(analyticsRows);
  const result = resultRows[0] ?? {};
  const riskFlags = Array.isArray(result.risk_flags_json) ? result.risk_flags_json : [];

  return {
    sessionRows: sessionRows.length,
    answerRows: answerRows.length,
    questionIds: answerRows.map((row) => row.question_id).sort(),
    resultRows: resultRows.length,
    requiredConsentRows: consentRows.filter(
      (row) => ["age14OrOlder", "surveyProcessing"].includes(row.consent_type) && row.accepted === true,
    ).length,
    consentHashRows: consentRows.filter((row) => String(row.consent_text_hash ?? "").length > 0).length,
    surveyVersion: sessionRows[0]?.survey_version,
    scoringVersion: sessionRows[0]?.scoring_version,
    resultScore: result.total_score,
    clientScoreIgnored: result.total_score !== payload.result.totalScore,
    clientBandIgnored: result.result_band !== payload.result.resultBand,
    clientRiskIgnored: !riskFlags.includes("forged-client-risk"),
    resultBand: result.result_band,
    riskFlagCount: riskFlags.length,
    utmSource: sessionRows[0]?.utm_source,
    answerRowsWithEmail: answerText.includes("@") ? 1 : 0,
    rawEmailContactRows: rawContacts.filter((row) => String(row.encrypted_email ?? "").includes("@")).length,
    analyticsRowsWithPii: analyticsText.includes("@") || analyticsText.includes("QA redacted") ? 1 : 0,
  };
}

async function postFunction(body, origin) {
  return fetch(functionUrl, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function triggerRateLimit() {
  let lastStatus = 0;
  for (let index = 0; index < 40; index += 1) {
    const response = await postFunction(
      {
        ...buildSurveyPayload("leader"),
        idempotencyKey: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        answers: { X999: "forged" },
      },
      productionOrigin,
    );
    lastStatus = response.status;
    if (lastStatus === 429) return lastStatus;
  }
  return lastStatus;
}

async function tableExists(table) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=0`, { headers: serviceHeaders() });
  return response.ok;
}

async function fetchRlsStatus() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/agentproof_rls_status`, {
    method: "POST",
    headers: serviceHeaders(),
    body: "{}",
  });
  if (!response.ok) {
    throw new Error(`rls status rpc failed: ${response.status}`);
  }
  const rows = await response.json();
  return Object.fromEntries(rows.map((row) => [row.table_name, row.relrowsecurity === true]));
}

async function fetchProjectInfo() {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    return { managementStatus: response.status };
  }
  const project = await response.json();
  return {
    managementStatus: response.status,
    region: project.region ?? project.database?.region ?? project.database_region ?? null,
    status: project.status ?? null,
  };
}

async function fetchAnonKey() {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const keys = await response.json();
  const anon = keys.find((item) => item.name === "anon" || item.name === "anon key");
  return anon?.api_key ?? anon?.key ?? null;
}

async function selectRows(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { headers: serviceHeaders() });
  if (!response.ok) throw new Error(`select failed: ${path} ${response.status}`);
  return response.json();
}

async function countRows(path) {
  return (await selectRows(path)).length;
}

async function insertRows(table, rows) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: serviceHeaders(),
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`insert failed: ${table} ${response.status}`);
}

async function deleteRows(table, filter) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: serviceHeaders(),
  });
  if (!response.ok) throw new Error(`delete failed: ${table} ${response.status}`);
}

async function cleanupQaRecords() {
  cleanupAttempted = true;
  const staleQaSessions = await selectRows("survey_sessions?utm_source=eq.agentproof_qa&select=id");
  for (const row of staleQaSessions) {
    managedSessionIds.add(row.id);
  }

  for (const sessionId of managedSessionIds) {
    await deleteRows("analytics_events", `session_id=eq.${sessionId}`);
    await deleteRows("survey_sessions", `id=eq.${sessionId}`);
    await insertRows("deletion_audit_events", [
      {
        session_id: sessionId,
        request_type: "qa_cleanup",
        deleted_table: "survey_sessions",
        deleted_count: 1,
      },
    ]);
  }
  for (const idempotencyKey of managedIdempotencyKeys) {
    await deleteRows("idempotency_keys", `idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`);
  }

  evidence.cleanup.remainingSessions = 0;
  evidence.cleanup.remainingAnalytics = 0;
  evidence.cleanup.remainingIdempotencyKeys = 0;
  for (const sessionId of managedSessionIds) {
    evidence.cleanup.remainingSessions += await countRows(`survey_sessions?id=eq.${sessionId}&select=id`);
    evidence.cleanup.remainingAnalytics += await countRows(`analytics_events?session_id=eq.${sessionId}&select=id`);
  }
  for (const idempotencyKey of managedIdempotencyKeys) {
    evidence.cleanup.remainingIdempotencyKeys += await countRows(
      `idempotency_keys?idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&select=idempotency_key`,
    );
  }
  evidence.cleanup.qaDeletionAuditEvents = await countRows(`deletion_audit_events?request_type=eq.qa_cleanup&select=id`);
}

function serviceHeaders() {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    prefer: "return=representation",
  };
}

async function safeJsonArray(response) {
  try {
    const body = await response.json();
    return Array.isArray(body) ? body : [];
  } catch {
    return [];
  }
}

async function writeEvidenceFile() {
  await mkdir(join(process.cwd(), "artifacts", "qa", "logs"), { recursive: true });
  await writeFile(
    join(process.cwd(), "artifacts", "qa", "logs", "production-storage-verification.json"),
    JSON.stringify(redactEvidence(evidence), null, 2),
  );
}

function redactEvidence(input) {
  return JSON.parse(
    JSON.stringify(input).replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[redacted-email]"),
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
