import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const artifactsDir = resolve(root, "artifacts", "content");

const sourceFiles = [
  "app/beta-terms/page.tsx",
  "app/privacy/page.tsx",
  "app/privacy/request/page.tsx",
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

await mkdir(artifactsDir, { recursive: true });

const sourceBodies = await Promise.all(
  sourceFiles.map(async (file) => ({
    file,
    body: await readFile(resolve(root, file), "utf8"),
  })),
);

const prohibitedMatches = sourceBodies.flatMap(({ file, body }) =>
  prohibitedTerms
    .filter((term) => body.includes(term))
    .map((term) => ({
      file,
      term,
      status: "fail",
    })),
);

const stringRows = sourceBodies.flatMap(({ file, body }) =>
  extractUserFacingStrings(body).map((copy) => ({
    route: inferRoute(file),
    component: file,
    currentCopy: copy,
    revisedCopy: "",
    reason: prohibitedTerms.some((term) => copy.includes(term))
      ? "prohibited-term"
      : "inventory",
    status: prohibitedTerms.some((term) => copy.includes(term)) ? "needs-change" : "accepted",
  })),
);

await writeFile(
  resolve(artifactsDir, "prohibited-term-report.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      prohibitedTerms,
      matches: prohibitedMatches,
      passed: prohibitedMatches.length === 0,
    },
    null,
    2,
  ),
  "utf8",
);

await writeFile(
  resolve(artifactsDir, "user-facing-string-inventory.csv"),
  [
    ["route", "component", "current copy", "revised copy", "reason", "status"].join(","),
    ...stringRows.map((row) =>
      [
        row.route,
        row.component,
        row.currentCopy,
        row.revisedCopy,
        row.reason,
        row.status,
      ]
        .map(csv)
        .join(","),
    ),
  ].join("\n"),
  "utf8",
);

await writeFile(
  resolve(artifactsDir, "copy-change-report.md"),
  `# AgentProof Copy Change Report

- Generated at: ${new Date().toISOString()}
- Prohibited term matches: ${prohibitedMatches.length}
- Scope: rendered UI modules and legal/survey helpers, not internal planning docs.

## Applied Direction

- Replaced internal launch terms with plain Korean customer-facing labels.
- Removed score-forward result headings in favor of state, dimensions, risks, and next actions.
- Removed placeholder consent hash strings from rendered/source-facing consent logic.
- Avoided rendering an invented legal operator name when \`LEGAL_OPERATOR_NAME\` is missing.
`,
  "utf8",
);

await writeFile(
  resolve(artifactsDir, "rendered-copy-report.md"),
  `# Rendered Copy QA

- Generated at: ${new Date().toISOString()}
- Source files scanned: ${sourceFiles.length}
- Prohibited term scan: ${prohibitedMatches.length === 0 ? "PASS" : "FAIL"}

${prohibitedMatches.length === 0 ? "No prohibited terms were found in scanned UI modules." : renderMatches(prohibitedMatches)}
`,
  "utf8",
);

if (process.argv.includes("--check") && prohibitedMatches.length > 0) {
  process.exitCode = 1;
}

function extractUserFacingStrings(body) {
  const matches = [...body.matchAll(/["'`]([^"'`]*[\u3131-\uD79D][^"'`]*)["'`]/g)];
  return [...new Set(matches.map((match) => match[1].replace(/\s+/g, " ").trim()))].filter(
    (value) => value.length > 0 && !value.startsWith("@/"),
  );
}

function inferRoute(file) {
  if (file.includes("privacy/request")) return "/privacy/request/";
  if (file.includes("privacy/page")) return "/privacy/";
  if (file.includes("beta-terms")) return "/beta-terms/";
  if (file.includes("survey")) return "/survey/";
  return "/";
}

function csv(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function renderMatches(matches) {
  return matches.map((match) => `- ${match.file}: ${match.term}`).join("\n");
}
