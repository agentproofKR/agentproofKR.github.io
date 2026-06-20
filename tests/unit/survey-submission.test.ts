import { describe, expect, it } from "vitest";

import { sanitizeAnalyticsPayload } from "../../lib/analytics";
import {
  MockSurveySubmissionStore,
  getSurveySubmissionMode,
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
});
