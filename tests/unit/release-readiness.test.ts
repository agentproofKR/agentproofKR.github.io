import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("release readiness contract", () => {
  it("exposes the required verification scripts", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts).toMatchObject({
      lint: expect.any(String),
      typecheck: expect.any(String),
      test: expect.any(String),
      "test:content": expect.any(String),
      "test:e2e": expect.any(String),
      "test:security": expect.any(String),
      build: expect.any(String),
    });
  });

  it("renders a plain-language overseas processing disclosure table on privacy", () => {
    const privacyPage = readFileSync(
      join(process.cwd(), "app", "privacy", "page.tsx"),
      "utf8",
    );

    for (const column of [
      "어떤 회사인가요",
      "어떤 정보를 처리하나요",
      "왜 필요한가요",
      "어디에서 처리될 수 있나요",
      "얼마나 보관하나요",
      "원하지 않으면 어떻게 하나요",
    ]) {
      expect(privacyPage).toContain(column);
    }

    expect(privacyPage).toContain("docs/privacy-provider-evidence.md");
  });

  it("generates the production DOM audit artifacts named in the release gate", () => {
    const contentScript = readFileSync(
      join(process.cwd(), "scripts", "generate-content-artifacts.mjs"),
      "utf8",
    );

    expect(contentScript).toContain("production-dom-string-inventory.csv");
    expect(contentScript).toContain("production-prohibited-terms.json");
    expect(contentScript).toContain("production-copy-review.md");
  });

  it("does not document a fake fallback operator identity", () => {
    const checklist = readFileSync(
      join(process.cwd(), "docs", "07_legal_review_checklist.md"),
      "utf8",
    );

    expect(checklist).not.toContain("AgentProof 운영자");
    expect(checklist).toContain("임의 표시명");
  });
});
