import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const textSourceRoots = ["app", "components", "lib"];
const publicAssetRoot = "public";
const publicDocs = ["README.md"];
const buildOutputRoot = "out";
const threePageSourceFiles = [
  "app/survey/page.tsx",
  "components/survey/SurveyHub.tsx",
  "app/privacy/page.tsx",
  "app/privacy/request/page.tsx",
  "app/beta-terms/page.tsx",
];

const prohibitedPatterns = [
  { label: "Private beta", pattern: /Private beta/i },
  { label: "MVP preview", pattern: /MVP preview/i },
  { label: "SAMPLE DATA", pattern: /SAMPLE DATA/i },
  { label: "CUSTOMER HYPOTHESES", pattern: /CUSTOMER HYPOTHESES/i },
  { label: "FIRST MVP", pattern: /FIRST MVP/i },
  { label: "FIXED SCOPE", pattern: /FIXED SCOPE/i },
  { label: "MVP 검증 리포트", pattern: /MVP 검증 리포트/i },
  { label: "Founding Researcher", pattern: /Founding Researcher/i },
  { label: "MVP", pattern: /MVP/i },
];

const readmeOutdatedPatterns = [
  { label: "V4.1 README status", pattern: /V4\.1/i },
  { label: "mailto fallback", pattern: /mailto/i },
  {
    label: "no production database",
    pattern: /no production database|production database.*없|운영 DB.*없/i,
  },
];

const threePageProhibitedPatterns = [
  { label: "역할별 AI 준비도 정밀진단", pattern: /역할별 AI 준비도 정밀진단/i },
  { label: "유효한 설문 완료자", pattern: /유효한 설문 완료자/i },
  { label: "제품 적합도", pattern: /제품 적합도/i },
  { label: "정당한 참여자", pattern: /정당한 참여자/i },
  { label: "리워드 자격", pattern: /리워드 자격/i },
  { label: "선택 안내 조건", pattern: /선택 안내 조건/i },
  { label: "수용 인원", pattern: /수용 인원/i },
  { label: "허용 사용처", pattern: /허용 사용처/i },
  { label: "PRIVACY REQUEST", pattern: /PRIVACY REQUEST/i },
];

const technicalTermExplanations = [
  {
    label: "unexplained UTM",
    term: "UTM",
    explanation: /어떤 SNS 글을 통해 들어왔는지 알 수 있는 표시/,
  },
  {
    label: "unexplained RLS",
    term: "RLS",
    explanation: /허가되지 않은 사람이 데이터를 보지 못하도록 막는 설정/,
  },
  {
    label: "unexplained CORS",
    term: "CORS",
    explanation: /허용된 사이트에서만 설문을 보낼 수 있게 하는 설정/,
  },
];

describe("customer-facing release copy", () => {
  it("does not contain prohibited V5 release terms in source strings or public asset names", () => {
    const matches = [
      ...collectTextFiles(textSourceRoots).flatMap(scanFile),
      ...threePageSourceFiles.flatMap(scanThreePageFile),
      ...collectPublicAssetNames(publicAssetRoot),
      ...publicDocs.flatMap(scanFile),
    ];

    expect(matches).toEqual([]);
  });

  it("does not leave stale V4.1 or mailto-only deployment claims in README", () => {
    const body = readFileSync(join(process.cwd(), "README.md"), "utf8");
    const matches = readmeOutdatedPatterns
      .filter(({ pattern }) => pattern.test(body))
      .map(({ label }) => `README.md: ${label}`);

    expect(matches).toEqual([]);
  });

  it("does not contain prohibited V5 release terms in the static export output when out exists", () => {
    if (!existsSync(join(process.cwd(), buildOutputRoot))) {
      return;
    }

    const matches = [
      ...collectTextFiles([buildOutputRoot]).flatMap(scanFile),
      ...collectTextFiles([buildOutputRoot])
        .filter(isThreePageBuildOutput)
        .flatMap(scanThreePageFile),
      ...collectPublicAssetNames(buildOutputRoot),
    ];

    expect(matches).toEqual([]);
  });
});

function scanFile(file: string): string[] {
  const body = readFileSync(join(process.cwd(), file), "utf8");
  return prohibitedPatterns
    .filter(({ pattern }) => pattern.test(body))
    .map(({ label }) => `${file}: ${label}`);
}

function scanThreePageFile(file: string): string[] {
  const body = readFileSync(join(process.cwd(), file), "utf8");
  const exactMatches = threePageProhibitedPatterns
    .filter(({ pattern }) => pattern.test(body))
    .map(({ label }) => `${file}: ${label}`);
  const technicalMatches = technicalTermExplanations
    .filter(
      ({ term, explanation }) => body.includes(term) && !explanation.test(body),
    )
    .map(({ label }) => `${file}: ${label}`);

  return [...exactMatches, ...technicalMatches];
}

function collectTextFiles(roots: string[]): string[] {
  return roots
    .flatMap((root) => walk(root))
    .filter((file) =>
      /\.(?:css|html|js|json|md|mjs|ts|tsx|txt|xml)$/.test(file),
    );
}

function collectPublicAssetNames(root: string): string[] {
  return walk(root).flatMap((file) =>
    prohibitedPatterns
      .filter(({ pattern }) => pattern.test(file))
      .map(({ label }) => `${file}: public asset path contains ${label}`),
  );
}

function isThreePageBuildOutput(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  if (!normalized.startsWith("out/")) return false;
  if (
    normalized.startsWith("out/survey/practitioner/") ||
    normalized.startsWith("out/survey/leader/") ||
    normalized.startsWith("out/survey/security/") ||
    normalized.startsWith("out/survey/result/") ||
    normalized.startsWith("out/_next/")
  ) {
    return false;
  }
  return (
    normalized.startsWith("out/survey/") ||
    normalized.startsWith("out/privacy/") ||
    normalized.startsWith("out/beta-terms/")
  );
}

function walk(path: string): string[] {
  const absolute = join(process.cwd(), path);
  if (!existsSync(absolute)) return [];
  const entry = readdirSync(absolute, { withFileTypes: true });
  return entry.flatMap((dirent) => {
    const child = join(path, dirent.name);
    if (dirent.isDirectory()) return walk(child);
    return relative(process.cwd(), join(process.cwd(), child)).replace(
      /\\/g,
      "/",
    );
  });
}
