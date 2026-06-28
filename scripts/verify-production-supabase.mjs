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
const managedQuickSessionIds = new Set();
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
    "quick_diagnosis_submissions",
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
      `contact_requests?session_id=eq.${payload.sessionId}&select=encrypted_email,encrypted_name,encrypted_contact,optional_company,request_type`,
    );
    const consentEventsAfterContacts = await countRows(`consent_events?session_id=eq.${payload.sessionId}&select=id`);
    evidence.submissions[persona].contactRequests = contacts.length;
    evidence.submissions[persona].contactTypes = contacts.map((row) => row.request_type).sort();
    evidence.submissions[persona].consentEventsAfterContacts = consentEventsAfterContacts;
    evidence.submissions[persona].rawEmailContactRowsAfterContacts = contacts.filter((row) =>
      JSON.stringify(row).includes("@") || JSON.stringify(row).includes("QA Tester"),
    ).length;

    const replay = await postFunction(payload, productionOrigin);
    evidence.security[`${persona}ReplayStatus`] = replay.status;
  }

  const quickPayload = buildQuickDiagnosisPayload();
  managedQuickSessionIds.add(quickPayload.sessionId);
  managedIdempotencyKeys.add(quickPayload.idempotencyKey);
  const quickResponse = await postFunction(quickPayload, productionOrigin);
  assert(quickResponse.status === 201, `quick diagnosis submission failed: ${quickResponse.status}`);
  evidence.submissions.quickDiagnosis = await verifyStoredQuickDiagnosis(quickPayload);

  const quickReplay = await postFunction(quickPayload, productionOrigin);
  evidence.security.quickDiagnosisReplayStatus = quickReplay.status;
  evidence.security.quickDiagnosisReplayBody = await safeJsonObject(quickReplay);

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
  const expiredQuickSessionId = crypto.randomUUID();
  managedQuickSessionIds.add(expiredQuickSessionId);
  await insertRows("quick_diagnosis_submissions", [
    {
      session_id: expiredQuickSessionId,
      quick_diagnosis_version: "2026-06-AgentProof-quick-diagnosis-storage-v1",
      work_type: "customer_reply",
      monthly_volume: "low",
      time_per_case: "short",
      adoption_scope: "reviewed_use",
      exposure: "internal",
      selections_json: {
        workType: "customer_reply",
        monthlyVolume: "low",
        timePerCase: "short",
        adoptionScope: "reviewed_use",
        exposure: "internal",
      },
      result_json: {
        aiAdoptionScore: 75,
        resultBand: "조건부 시작",
        savingRateMin: 0.1,
        savingRateMax: 0.25,
        savingHoursMin: 0.0083,
        savingHoursMax: 0.4167,
        savingMoneyMin: 250,
        savingMoneyMax: 12500,
        supportReviewAverage: 3400000,
        supportReviewMin: 1200000,
        supportReviewMax: 5600000,
        projectScale: "low",
        hourlyCost: 30000,
      },
      ai_adoption_score: 75,
      result_band: "조건부 시작",
      saving_rate_min: 0.1,
      saving_rate_max: 0.25,
      saving_hours_min: 0.0083,
      saving_hours_max: 0.4167,
      saving_money_min: 250,
      saving_money_max: 12500,
      support_review_average: 3400000,
      support_review_min: 1200000,
      support_review_max: 5600000,
      project_scale: "low",
      hourly_cost: 30000,
      utm_source: "agentproof_qa",
      utm_medium: "release_verification",
      utm_campaign: "retention",
      utm_content: qaPrefix,
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
  evidence.retention.expiredQuickDiagnosisRowsRemaining = await countRows(
    `quick_diagnosis_submissions?session_id=eq.${expiredQuickSessionId}&select=id`,
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
    assert(item.requiredConsentRows >= 3, `${persona}: missing required consent rows`);
    assert(item.contactRequests === 4, `${persona}: expected survey follow-up plus three separate contact requests`);
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
  const quick = evidence.submissions.quickDiagnosis;
  assert(quick?.rows === 1, "quick diagnosis row was not stored");
  assert(quick.numericFieldsStored === true, "quick diagnosis numeric fields were not stored");
  assert(quick.workType === "marketing_content", "quick diagnosis work_type mismatch");
  assert(quick.monthlyVolume === "high", "quick diagnosis monthly_volume mismatch");
  assert(quick.timePerCase === "long", "quick diagnosis time_per_case mismatch");
  assert(quick.adoptionScope === "partial_automation", "quick diagnosis adoption_scope mismatch");
  assert(quick.exposure === "external", "quick diagnosis exposure mismatch");
  assert(quick.aiAdoptionScore === 38, "quick diagnosis score mismatch");
  assert(quick.resultBand === "업무 선정 필요", "quick diagnosis band mismatch");
  assert(quick.analyticsRows === 1, "quick diagnosis analytics event missing");

  assert(evidence.security.anonKeyRetrieved, "Could not retrieve anon key for RLS verification");
  assert(evidence.security.anonRead?.rowCount === 0, "Anonymous direct read returned rows");
  assert(evidence.security.anonWriteRejected === true, "Anonymous direct write was not rejected");
  assert(personas.every((persona) => evidence.security[`${persona}ReplayStatus`] === 409), "Replay rejection failed");
  assert(evidence.security.quickDiagnosisReplayStatus === 200, "Quick diagnosis duplicate did not return 200");
  assert(
    evidence.security.quickDiagnosisReplayBody?.status === "duplicate",
    "Quick diagnosis duplicate status mismatch",
  );
  assert(evidence.security.honeypotStatus === 400, "Honeypot rejection failed");
  assert(evidence.security.invalidQuestionStatus === 400, "Invalid question rejection failed");
  assert(evidence.security.invalidAnswerStatus === 400, "Invalid answer rejection failed");
  assert(evidence.security.oversizedPayloadStatus === 413, "Oversized payload rejection failed");
  assert(evidence.security.corsRejectedStatus === 403, "CORS rejection failed");
  assert(evidence.security.rateLimitStatus === 429, "Rate limiting did not trigger");
  assert(evidence.retention.rpcStatus >= 200 && evidence.retention.rpcStatus < 300, "Retention RPC failed");
  assert(evidence.retention.expiredSessionRowsRemaining === 0, "Expired session was not deleted");
  assert(evidence.retention.expiredContactRowsRemaining === 0, "Expired contact was not deleted");
  assert(evidence.retention.expiredQuickDiagnosisRowsRemaining === 0, "Expired quick diagnosis was not deleted");
  assert(evidence.cleanup.remainingSessions === 0, "QA sessions not deleted");
  assert(evidence.cleanup.remainingQuickDiagnosisRows === 0, "QA quick diagnosis rows not deleted");
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
      personalInfoCollection: true,
      beta: false,
      interview: false,
      pilot: false,
      consentVersion: "2026-06-21",
      consentTextHashes: {
        age14OrOlder: "qa-hash-age",
        surveyProcessing: "qa-hash-survey",
        personalInfoCollection: "qa-hash-personal-info",
        beta: "qa-hash-beta",
        interview: "qa-hash-interview",
        pilot: "qa-hash-pilot",
      },
    },
    contacts: [
      {
        requestType: "survey_followup",
        name: "QA Tester",
        contact: `${qaPrefix}+${persona}-survey@example.invalid`,
        preferredContactPurpose: "AI safety check result follow-up",
      },
    ],
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

function buildQuickDiagnosisPayload() {
  return {
    kind: "quick_diagnosis",
    sessionId: crypto.randomUUID(),
    idempotencyKey: crypto.randomUUID(),
    quickDiagnosisVersion: "2026-06-AgentProof-quick-diagnosis-storage-v1",
    honeypot: "",
    selections: {
      workType: "marketing_content",
      monthlyVolume: "high",
      timePerCase: "long",
      adoptionScope: "partial_automation",
      exposure: "external",
    },
    result: {
      aiAdoptionScore: 38,
      resultBand: "업무 선정 필요",
      savingRateMin: 0.2,
      savingRateMax: 0.45,
      savingHoursMin: 10,
      savingHoursMax: 81,
      savingMoneyMin: 300000,
      savingMoneyMax: 2430000,
      supportReviewAverage: null,
      supportReviewMin: null,
      supportReviewMax: null,
      projectScale: "enterprise",
      hourlyCost: 30000,
    },
    utm: {
      source: "agentproof_qa",
      medium: "release_verification",
      campaign: "quick_diagnosis_storage",
      content: qaPrefix,
    },
  };
}

async function verifyStoredSurvey(payload) {
  const sessionRows = await selectRows(`survey_sessions?id=eq.${payload.sessionId}&select=*`);
  const answerRows = await selectRows(`survey_answers?session_id=eq.${payload.sessionId}&select=question_id,answer_json`);
  const resultRows = await selectRows(`survey_results?session_id=eq.${payload.sessionId}&select=*`);
  const consentRows = await selectRows(`consent_events?session_id=eq.${payload.sessionId}&select=*`);
  const rawContacts = await selectRows(
    `contact_requests?session_id=eq.${payload.sessionId}&select=encrypted_email,encrypted_name,encrypted_contact,optional_company,request_type`,
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
      (row) => ["age14OrOlder", "surveyProcessing", "personalInfoCollection"].includes(row.consent_type) && row.accepted === true,
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
    rawEmailContactRows: rawContacts.filter((row) =>
      JSON.stringify(row).includes("@") || JSON.stringify(row).includes("QA Tester"),
    ).length,
    analyticsRowsWithPii: analyticsText.includes("@") || analyticsText.includes("QA redacted") ? 1 : 0,
  };
}

async function verifyStoredQuickDiagnosis(payload) {
  const rows = await selectRows(
    `quick_diagnosis_submissions?session_id=eq.${payload.sessionId}&select=*`,
  );
  const analyticsRows = await selectRows(
    `analytics_events?event_name=eq.quick_diagnosis_completed&survey_version=eq.${payload.quickDiagnosisVersion}&select=event_name,non_sensitive_properties_json`,
  );
  const matchingAnalyticsRows = analyticsRows.filter(
    (row) => row.non_sensitive_properties_json?.quick_session_id === payload.sessionId,
  );
  const row = rows[0] ?? {};
  return {
    rows: rows.length,
    workType: row.work_type,
    monthlyVolume: row.monthly_volume,
    timePerCase: row.time_per_case,
    adoptionScope: row.adoption_scope,
    exposure: row.exposure,
    aiAdoptionScore: row.ai_adoption_score,
    resultBand: row.result_band,
    savingRateMin: Number(row.saving_rate_min),
    savingRateMax: Number(row.saving_rate_max),
    savingHoursMin: Number(row.saving_hours_min),
    savingHoursMax: Number(row.saving_hours_max),
    savingMoneyMin: row.saving_money_min,
    savingMoneyMax: row.saving_money_max,
    supportReviewAverage: row.support_review_average,
    supportReviewMin: row.support_review_min,
    supportReviewMax: row.support_review_max,
    projectScale: row.project_scale,
    hourlyCost: row.hourly_cost,
    analyticsRows: matchingAnalyticsRows.length,
    numericFieldsStored:
      typeof row.ai_adoption_score === "number" &&
      Number.isFinite(Number(row.saving_rate_min)) &&
      Number.isFinite(Number(row.saving_rate_max)) &&
      Number.isFinite(Number(row.saving_hours_min)) &&
      Number.isFinite(Number(row.saving_hours_max)) &&
      typeof row.saving_money_min === "number" &&
      typeof row.saving_money_max === "number" &&
      typeof row.hourly_cost === "number",
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
  const staleQuickSessions = await selectRows("quick_diagnosis_submissions?utm_source=eq.agentproof_qa&select=session_id");
  for (const row of staleQuickSessions) {
    managedQuickSessionIds.add(row.session_id);
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
  for (const sessionId of managedQuickSessionIds) {
    await deleteRows("analytics_events", `non_sensitive_properties_json->>quick_session_id=eq.${sessionId}`);
    await deleteRows("quick_diagnosis_submissions", `session_id=eq.${sessionId}`);
    await insertRows("deletion_audit_events", [
      {
        session_id: sessionId,
        request_type: "qa_cleanup",
        deleted_table: "quick_diagnosis_submissions",
        deleted_count: 1,
      },
    ]);
  }
  for (const idempotencyKey of managedIdempotencyKeys) {
    await deleteRows("idempotency_keys", `idempotency_key=eq.${encodeURIComponent(idempotencyKey)}`);
  }

  evidence.cleanup.remainingSessions = 0;
  evidence.cleanup.remainingQuickDiagnosisRows = 0;
  evidence.cleanup.remainingAnalytics = 0;
  evidence.cleanup.remainingIdempotencyKeys = 0;
  for (const sessionId of managedSessionIds) {
    evidence.cleanup.remainingSessions += await countRows(`survey_sessions?id=eq.${sessionId}&select=id`);
    evidence.cleanup.remainingAnalytics += await countRows(`analytics_events?session_id=eq.${sessionId}&select=id`);
  }
  for (const sessionId of managedQuickSessionIds) {
    evidence.cleanup.remainingQuickDiagnosisRows += await countRows(
      `quick_diagnosis_submissions?session_id=eq.${sessionId}&select=id`,
    );
    evidence.cleanup.remainingAnalytics += await countRows(
      `analytics_events?non_sensitive_properties_json->>quick_session_id=eq.${sessionId}&select=id`,
    );
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

async function safeJsonObject(response) {
  try {
    const body = await response.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : {};
  } catch {
    return {};
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
