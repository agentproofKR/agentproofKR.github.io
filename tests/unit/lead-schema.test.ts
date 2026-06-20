import { describe, expect, it } from "vitest";

import { parseLeadInput } from "../../components/lead/leadSchema";

const validLead = {
  role: "대표·임원·팀장",
  stage: "회사 도입 검토",
  concern: "도입 우선순위",
  company: "  QA 테스트 팀  ",
  email: "QA+AgentProof@Example.COM",
  memo: "  보고서 작성과 고객응대 업무부터 파일럿을 검토 중입니다.  ",
  consent: true,
  consentVersion: "2026-06-18",
  utm: {
    source: "linkedin",
    medium: "social",
    campaign: "launch",
    content: "founder-post-01",
  },
  landingVariant: "v4.1",
  honeypot: "",
};

describe("lead schema", () => {
  it("normalizes valid lead input before storage", () => {
    const parsed = parseLeadInput(validLead);

    expect(parsed.company).toBe("QA 테스트 팀");
    expect(parsed.email).toBe("qa+agentproof@example.com");
    expect(parsed.memo).toBe("보고서 작성과 고객응대 업무부터 파일럿을 검토 중입니다.");
    expect(parsed.utm.content).toBe("founder-post-01");
  });

  it("rejects unknown select values and long memo", () => {
    expect(() =>
      parseLeadInput({
        ...validLead,
        role: "관리자",
        memo: "가".repeat(1001),
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
