import { describe, expect, it } from "vitest";

import { sanitizeAnalyticsPayload } from "../../lib/analytics";

describe("analytics payload hygiene", () => {
  it("keeps only approved non-PII analytics fields", () => {
    expect(
      sanitizeAnalyticsPayload({
        persona: "leader",
        survey_version: "2026-06-21",
        scoring_version: "2026-06-21",
        utm_source: "linkedin",
        utm_medium: "organic_social",
        utm_campaign: "ai_readiness",
        utm_content: "leader_01",
        question_count: 25,
        completion_time_band: "7_10_min",
        result_band: "통제 기반 확대 준비",
        lead_id: "lead_123",
        role: "대표·도입 담당자",
        focusArea: "사내 문서 검색 Agent",
        email: "qa@example.com",
        company: "QA 테스트 팀",
        memo: "민감한 메모",
        message: "민감한 메모",
        raw_answer: "비밀",
        free_text: "민감한 메모",
        field_names: ["email"],
      }),
    ).toEqual({
      persona: "leader",
      survey_version: "2026-06-21",
      scoring_version: "2026-06-21",
      utm_source: "linkedin",
      utm_medium: "organic_social",
      utm_campaign: "ai_readiness",
      utm_content: "leader_01",
      question_count: 25,
      completion_time_band: "7_10_min",
      result_band: "통제 기반 확대 준비",
    });
  });
});
