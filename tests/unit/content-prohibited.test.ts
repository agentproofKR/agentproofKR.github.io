import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const sourceFiles = [
  "app/beta-terms/page.tsx",
  "components/layout/Footer.tsx",
  "components/layout/Header.tsx",
  "components/landing/LandingPage.tsx",
  "components/landing/content.ts",
  "components/lead/LeadForm.tsx",
  "components/survey/SurveyHub.tsx",
  "components/survey/SurveyResult.tsx",
  "lib/survey/consent.ts",
  "lib/legal.ts",
];

const prohibitedTerms = [
  "Private beta",
  "MVP",
  "CUSTOMER HYPOTHESES",
  "FIRST MVP",
  "FIXED SCOPE",
  "AI READINESS ASSESSMENT",
  "Founding Researcher",
  "총점",
  "5개 차원 점수",
  "상위 위험",
  "권장 액션",
  "AgentProof 운영자",
  "체험 크레딧",
  "sha256:survey-processing-2026-06-21-agentproof",
];

describe("user-facing source copy", () => {
  it("does not contain prohibited V5 release terms in rendered UI modules", () => {
    const matches = sourceFiles.flatMap((file) => {
      const body = readFileSync(join(process.cwd(), file), "utf8");
      return prohibitedTerms
        .filter((term) => body.includes(term))
        .map((term) => `${relative(process.cwd(), file)}: ${term}`);
    });

    expect(matches).toEqual([]);
  });
});
