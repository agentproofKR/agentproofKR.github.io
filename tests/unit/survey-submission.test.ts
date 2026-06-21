import { afterEach, describe, expect, it, vi } from "vitest";

import { sanitizeAnalyticsPayload } from "../../lib/analytics";
import {
  MockSurveySubmissionStore,
  getSurveySubmissionMode,
  submitContactRequestToEndpoint,
  submitSurveyToEndpoint,
  validateSurveySubmission,
} from "../../lib/survey/submission";

const basePayload = {
  sessionId: "session_test_001",
  persona: "leader",
  surveyVersion: "2026-06-21",
  scoringVersion: "2026-06-21",
  idempotencyKey: "idem-001",
  honeypot: "",
  answers: {
    C01: "executive",
    C02: "51_300",
    C03: "it_software",
    C04: "pilot",
    C05: ["gen_ai"],
    C06: "time_saving",
    L07: "operations",
    L08: ["documents"],
    L22: "range_review",
  },
  result: {
    totalScore: 64,
    resultBand: "통제 기반 확대 준비",
    dimensionScores: {
      "도입 목적 명확성": 75,
      "업무 우선순위": 50,
      "데이터·프로세스 준비": 60,
      "위험관리": 70,
      "파일럿 실행 준비도": 65,
    },
    riskFlags: [],
  },
  consents: {
    age14OrOlder: true,
    surveyProcessing: true,
    beta: false,
    interview: false,
    pilot: false,
    consentVersion: "2026-06-21",
  },
  contacts: [],
  utm: {
    source: "linkedin",
    campaign: "ai_readiness",
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("survey submission validation", () => {
  it("accepts a valid allow-listed survey payload", () => {
    const parsed = validateSurveySubmission(basePayload);

    expect(parsed.persona).toBe("leader");
    expect(parsed.answers.L22).toBe("range_review");
    expect(parsed.consents.age14OrOlder).toBe(true);
  });

  it("rejects missing required consent, honeypot, invalid question IDs, and oversized free text", () => {
    expect(() =>
      validateSurveySubmission({
        ...basePayload,
        consents: { ...basePayload.consents, age14OrOlder: false },
      }),
    ).toThrow(/만 14세/);

    expect(() => validateSurveySubmission({ ...basePayload, honeypot: "filled" })).toThrow(
      /bot/i,
    );

    expect(() =>
      validateSurveySubmission({
        ...basePayload,
        answers: { ...basePayload.answers, X999: "forged" },
      }),
    ).toThrow(/question/i);

    expect(() =>
      validateSurveySubmission({
        ...basePayload,
        contacts: [
          {
            requestType: "interview",
            email: "qa@example.com",
            freeText: "가".repeat(301),
          },
        ],
      }),
    ).toThrow(/300/);
  });

  it("deduplicates replayed idempotency keys in the mock adapter", async () => {
    const store = new MockSurveySubmissionStore();
    const first = await store.submit(validateSurveySubmission(basePayload));
    const second = await store.submit(validateSurveySubmission(basePayload));

    expect(first.status).toBe("stored");
    expect(second.status).toBe("duplicate");
    expect(first.sessionId).toBe(second.sessionId);
  });

  it("disables live storage when no public endpoint is configured", () => {
    expect(getSurveySubmissionMode({ publicApiUrl: undefined })).toEqual({
      mode: "disabled",
      message: "설문 저장소가 아직 연결되지 않았습니다. 결과는 이 기기에만 표시됩니다.",
    });
  });

  it("keeps forbidden fields out of analytics payloads", () => {
    expect(
      sanitizeAnalyticsPayload({
        event: "pilot_requested",
        persona: "leader",
        email: "qa@example.com",
        company: "QA 팀",
        freeText: "민감한 메모",
        individualAnswer: "비밀",
        result_band: "통제 기반 확대 준비",
      }),
    ).toEqual({
      event: "pilot_requested",
      persona: "leader",
      result_band: "통제 기반 확대 준비",
    });
  });

  it("posts a validated survey payload to the configured live endpoint", async () => {
    const submission = validateSurveySubmission(basePayload);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, sessionId: submission.sessionId }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await submitSurveyToEndpoint("https://example.supabase.co/functions/v1/survey-submit", submission);

    expect(result).toEqual({ ok: true, status: "stored", sessionId: submission.sessionId });
    const [, request] = fetchMock.mock.calls[0];
    expect(request?.method).toBe("POST");
    expect(JSON.parse(String(request?.body))).toMatchObject({
      kind: "survey",
      sessionId: submission.sessionId,
    });
  });

  it("posts contact requests to the live endpoint and blocks honeypot submissions locally", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, sessionId: "session_test_001" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await submitContactRequestToEndpoint("https://example.supabase.co/functions/v1/survey-submit", {
      kind: "contact_request",
      sessionId: "session_test_001",
      idempotencyKey: "contact-idem-001",
      persona: "leader",
      consentVersion: "2026-06-21",
      consentTextHash: "sha256:test",
      requestType: "pilot",
      email: "qa@example.com",
      company: "QA Team",
      preferredContactPurpose: "pilot",
      honeypot: "",
    });

    expect(result).toEqual({ ok: true, status: "contact_stored", sessionId: "session_test_001" });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      kind: "contact_request",
      requestType: "pilot",
      email: "qa@example.com",
    });

    const blocked = await submitContactRequestToEndpoint("https://example.supabase.co/functions/v1/survey-submit", {
      kind: "contact_request",
      sessionId: "session_test_001",
      idempotencyKey: "contact-idem-002",
      persona: "leader",
      consentVersion: "2026-06-21",
      consentTextHash: "sha256:test",
      requestType: "beta",
      email: "qa@example.com",
      honeypot: "bot",
    });

    expect(blocked).toMatchObject({ ok: false, code: "HONEYPOT" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
