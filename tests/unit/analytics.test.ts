import { describe, expect, it } from "vitest";

import { sanitizeAnalyticsPayload } from "../../lib/analytics";

describe("analytics payload hygiene", () => {
  it("removes PII-like fields before sending events", () => {
    expect(
      sanitizeAnalyticsPayload({
        lead_id: "lead_123",
        role: "대표·도입 담당자",
        focusArea: "사내 문서 검색 Agent",
        email: "qa@example.com",
        company: "QA 테스트 팀",
        memo: "민감한 메모",
        message: "민감한 메모",
        field_names: ["email"],
      }),
    ).toEqual({
      lead_id: "lead_123",
      role: "대표·도입 담당자",
      field_names: ["email"],
    });
  });
});
