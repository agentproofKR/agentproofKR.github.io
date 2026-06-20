import { describe, expect, it } from "vitest";

import { createLeadMailtoHref } from "../../lib/staticLeadFallback";

const lead = {
  role: "대표·도입 담당자",
  stage: "조직 도입 검토 중",
  problem: "어떤 업무부터 도입해야 할지 모르겠다",
  followup: "MVP 샘플 리포트",
  email: "qa+agentproof@example.com",
  focusArea: "사내 문서 검색 Agent의 답변 근거와 권한을 검증하고 싶습니다.",
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
} as const;

describe("static lead fallback", () => {
  it("builds a mailto handoff containing the validated lead fields", () => {
    const href = createLeadMailtoHref(lead, "contact@agentproof.kr");

    expect(href).toMatch(/^mailto:contact%40agentproof\.kr\?/);
    expect(decodeURIComponent(href)).toContain("역할: 대표·도입 담당자");
    expect(decodeURIComponent(href)).toContain(
      "가장 가까운 문제: 어떤 업무부터 도입해야 할지 모르겠다",
    );
    expect(decodeURIComponent(href)).toContain("업무 이메일: qa+agentproof@example.com");
    expect(decodeURIComponent(href)).toContain("UTM content: founder-post-01");
  });

  it("does not include the honeypot field in the outgoing mail body", () => {
    const href = createLeadMailtoHref({ ...lead, honeypot: "filled" }, "contact@agentproof.kr");

    expect(decodeURIComponent(href)).not.toContain("honeypot");
    expect(decodeURIComponent(href)).not.toContain("filled");
  });
});
