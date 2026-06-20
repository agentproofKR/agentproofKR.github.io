import { describe, expect, it } from "vitest";

import { createLeadMailtoHref } from "../../lib/staticLeadFallback";

const lead = {
  role: "대표·임원·팀장",
  stage: "회사 도입 검토",
  concern: "도입 우선순위",
  company: "QA 테스트 팀",
  email: "qa+agentproof@example.com",
  memo: "보고서 작성과 고객응대 업무부터 파일럿을 검토 중입니다.",
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
} as const;

describe("static lead fallback", () => {
  it("builds a mailto handoff containing the validated lead fields", () => {
    const href = createLeadMailtoHref(lead, "contact@agentproof.kr");

    expect(href).toMatch(/^mailto:contact%40agentproof\.kr\?/);
    expect(decodeURIComponent(href)).toContain("회사/팀명: QA 테스트 팀");
    expect(decodeURIComponent(href)).toContain("업무 이메일: qa+agentproof@example.com");
    expect(decodeURIComponent(href)).toContain("UTM content: founder-post-01");
  });

  it("does not include the honeypot field in the outgoing mail body", () => {
    const href = createLeadMailtoHref({ ...lead, honeypot: "filled" }, "contact@agentproof.kr");

    expect(decodeURIComponent(href)).not.toContain("honeypot");
    expect(decodeURIComponent(href)).not.toContain("filled");
  });
});
