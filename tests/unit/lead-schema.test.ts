import { describe, expect, it } from "vitest";

import { parseLeadInput } from "../../components/lead/leadSchema";

const validLead = {
  role: "대표·도입 담당자",
  stage: "조직 도입 검토 중",
  problem: "어떤 업무부터 도입해야 할지 모르겠다",
  followup: "결과 예시 요약",
  email: "QA+AgentProof@Example.COM",
  focusArea: "  사내 문서 검색 Agent의 답변 근거와 권한을 검증하고 싶습니다.  ",
  consent: true,
  consentVersion: "2026-06-20",
  utm: {
    source: "linkedin",
    medium: "social",
    campaign: "launch",
    content: "founder-post-01",
  },
  landingVariant: "v5.1",
  honeypot: "",
};

describe("lead schema", () => {
  it("normalizes valid lead input before handoff", () => {
    const parsed = parseLeadInput(validLead);

    expect(parsed.email).toBe("qa+agentproof@example.com");
    expect(parsed.problem).toBe("어떤 업무부터 도입해야 할지 모르겠다");
    expect(parsed.followup).toBe("결과 예시 요약");
    expect(parsed.focusArea).toBe(
      "사내 문서 검색 Agent의 답변 근거와 권한을 검증하고 싶습니다.",
    );
    expect(parsed.utm.content).toBe("founder-post-01");
  });

  it("allows an omitted focus area but rejects forged select values and long focus text", () => {
    expect(parseLeadInput({ ...validLead, focusArea: "" }).focusArea).toBeUndefined();

    expect(() =>
      parseLeadInput({
        ...validLead,
        role: "관리자",
        problem: "없는 문제",
        followup: "영업 연락",
        focusArea: "가".repeat(1001),
      }),
    ).toThrow();
  });

  it("requires consent and valid business email format", () => {
    expect(() =>
      parseLeadInput({
        ...validLead,
        email: "not-an-email",
        consent: false,
      }),
    ).toThrow();
  });
});
