import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const textSourceRoots = ["app", "components", "lib"];
const publicAssetRoot = "public";
const publicDocs = ["README.md"];
const buildOutputRoot = "out";

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
  { label: "no production database", pattern: /no production database|production database.*없|운영 DB.*없/i },
];

describe("customer-facing release copy", () => {
  it("does not contain prohibited V5 release terms in source strings or public asset names", () => {
    const matches = [
      ...collectTextFiles(textSourceRoots).flatMap(scanFile),
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

function collectTextFiles(roots: string[]): string[] {
  return roots.flatMap((root) => walk(root)).filter((file) => /\.(?:css|html|js|json|md|mjs|ts|tsx|txt|xml)$/.test(file));
}

function collectPublicAssetNames(root: string): string[] {
  return walk(root).flatMap((file) =>
    prohibitedPatterns
      .filter(({ pattern }) => pattern.test(file))
      .map(({ label }) => `${file}: public asset path contains ${label}`),
  );
}

function walk(path: string): string[] {
  const absolute = join(process.cwd(), path);
  if (!existsSync(absolute)) return [];
  const entry = readdirSync(absolute, { withFileTypes: true });
  return entry.flatMap((dirent) => {
    const child = join(path, dirent.name);
    if (dirent.isDirectory()) return walk(child);
    return relative(process.cwd(), join(process.cwd(), child)).replace(/\\/g, "/");
  });
}
