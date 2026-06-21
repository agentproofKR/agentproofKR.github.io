import { existsSync, readdirSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const root = process.cwd();
const artifactsDir = resolve(root, "artifacts", "content");
const productionDir = resolve(artifactsDir, "production-html");

const publicRoutes = [
  "/",
  "/survey/",
  "/survey/practitioner/",
  "/survey/leader/",
  "/survey/security/",
  "/survey/result/",
  "/privacy/",
  "/privacy/request/",
  "/beta-terms/",
];

const sourceTextRoots = ["app", "components", "lib"];
const publicDocs = ["README.md"];
const publicAssetRoot = "public";
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
  { label: "AI ASSURANCE", pattern: /AI ASSURANCE/i },
  { label: "MVP", pattern: /MVP/i },
];

const readmeOutdatedPatterns = [
  { label: "V4.1 README status", pattern: /V4\.1/i },
  { label: "mailto fallback", pattern: /mailto/i },
  { label: "no production database", pattern: /no production database|production database.*없|운영 DB.*없/i },
];

await mkdir(artifactsDir, { recursive: true });

const sourceFiles = [...collectTextFiles(sourceTextRoots), ...publicDocs];
const sourceMatches = [
  ...sourceFiles.flatMap((file) => scanTextFile(file, "source")),
  ...scanAssetNames(publicAssetRoot, "source"),
  ...scanReadmeFreshness(),
];

const outMatches = existsSync(resolve(root, buildOutputRoot))
  ? [
      ...collectTextFiles([buildOutputRoot]).flatMap((file) => scanTextFile(file, "out")),
      ...scanAssetNames(buildOutputRoot, "out"),
    ]
  : [];

const productionBaseUrl = readProductionBaseUrl();
const productionScan = productionBaseUrl
  ? await scanProduction(productionBaseUrl)
  : { baseUrl: null, routes: [], assets: [], matches: [], skipped: true };

const allMatches = [...sourceMatches, ...outMatches, ...productionScan.matches];

await writeJson("prohibited-term-report.json", {
  generatedAt: new Date().toISOString(),
  prohibitedTerms: prohibitedPatterns.map((term) => term.label),
  scopes: {
    source: sourceFiles.length,
    out: existsSync(resolve(root, buildOutputRoot)) ? "scanned" : "missing",
    production: productionBaseUrl ?? "not-requested",
  },
  matches: allMatches,
  passed: allMatches.length === 0,
});

await writeJson("production-html-scan.json", productionScan);

await writeFile(
  resolve(artifactsDir, "user-facing-string-inventory.csv"),
  [
    ["route", "component", "current copy", "revised copy", "reason", "status"].join(","),
    ...sourceFiles.flatMap((file) =>
      extractUserFacingStringsFromFile(file).map((copy) =>
        [
          inferRoute(file),
          file,
          copy,
          "",
          hasProhibited(copy) ? "prohibited-term" : "inventory",
          hasProhibited(copy) ? "needs-change" : "accepted",
        ]
          .map(csv)
          .join(","),
      ),
    ),
  ].join("\n"),
  "utf8",
);

await writeFile(
  resolve(artifactsDir, "copy-change-report.md"),
  `# AgentProof Copy Change Report

- Generated at: ${new Date().toISOString()}
- Source files scanned: ${sourceFiles.length}
- Static export scan: ${existsSync(resolve(root, buildOutputRoot)) ? "enabled" : "skipped; out/ not present"}
- Production scan: ${productionBaseUrl ?? "not requested"}
- Prohibited term matches: ${allMatches.length}

## Scanner Change

The scanner now checks source UI strings, public README copy, public asset paths, static export output in \`out/\`, and live production HTML/assets when \`CONTENT_SCAN_BASE_URL\` or \`--production-base-url\` is provided.
`,
  "utf8",
);

await writeFile(
  resolve(artifactsDir, "rendered-copy-report.md"),
  `# Rendered Copy QA

- Generated at: ${new Date().toISOString()}
- Result: ${allMatches.length === 0 ? "PASS" : "FAIL"}

${allMatches.length === 0 ? "No prohibited terms were found in scanned customer-facing surfaces." : renderMatches(allMatches)}
`,
  "utf8",
);

if (process.argv.includes("--check") && allMatches.length > 0) {
  process.exitCode = 1;
}

async function scanProduction(baseUrl) {
  await mkdir(productionDir, { recursive: true });
  const cacheBust = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const routes = [];
  const assetPaths = new Set();
  const matches = [];

  for (const route of publicRoutes) {
    const url = `${trimSlash(baseUrl)}${route}?content_audit=${cacheBust}`;
    const body = await fetchText(url);
    const file = join(productionDir, route === "/" ? "root.html" : `${route.replace(/^\/|\/$/g, "").replace(/\//g, "__")}.html`);
    await writeFile(file, body.text, "utf8");
    const routeMatches = [
      ...statusMatches(body.status, "production", route),
      ...scanText(body.text, "production", route),
    ];
    matches.push(...routeMatches);
    routes.push({
      route,
      url,
      status: body.status,
      bytes: Buffer.byteLength(body.text),
      matches: routeMatches,
    });

    for (const assetPath of extractAssetPaths(body.text)) {
      assetPaths.add(assetPath);
    }
  }

  const assets = [];
  for (const assetPath of assetPaths) {
    const url = `${trimSlash(baseUrl)}${assetPath}?content_audit=${cacheBust}`;
    const body = await fetchText(url);
    const assetMatches = isTextAsset(assetPath, body.contentType)
      ? [
          ...statusMatches(body.status, "production-asset", assetPath),
          ...scanText(body.text, "production-asset", assetPath),
        ]
      : statusMatches(body.status, "production-asset", assetPath);
    matches.push(...assetMatches);
    assets.push({
      path: assetPath,
      status: body.status,
      contentType: body.contentType,
      bytes: Buffer.byteLength(body.text),
      matches: assetMatches,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes,
    assets,
    matches,
    passed: matches.length === 0,
  };
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache, no-store, max-age=0",
      pragma: "no-cache",
      "user-agent": "AgentProof-content-audit/1.0",
    },
  });
  return {
    status: response.status,
    contentType: response.headers.get("content-type") || "",
    text: await response.text(),
  };
}

function scanTextFile(file, scope) {
  const body = existsSync(resolve(root, file)) ? readFileSyncUtf8(file) : "";
  return scanText(body, scope, file);
}

function scanText(body, scope, file) {
  return prohibitedPatterns
    .filter(({ pattern }) => pattern.test(body))
    .map(({ label }) => ({
      scope,
      file,
      term: label,
      status: "fail",
    }));
}

function statusMatches(status, scope, file) {
  if (status === 200) return [];
  return [
    {
      scope,
      file,
      term: `HTTP ${status}`,
      status: "fail",
    },
  ];
}

function scanReadmeFreshness() {
  const body = readFileSyncUtf8("README.md");
  return readmeOutdatedPatterns
    .filter(({ pattern }) => pattern.test(body))
    .map(({ label }) => ({
      scope: "source",
      file: "README.md",
      term: label,
      status: "fail",
    }));
}

function scanAssetNames(rootPath, scope) {
  return walk(rootPath).flatMap((file) =>
    prohibitedPatterns
      .filter(({ pattern }) => pattern.test(file))
      .map(({ label }) => ({
        scope,
        file,
        term: `asset path contains ${label}`,
        status: "fail",
      })),
  );
}

function extractAssetPaths(html) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith("/_next/") || value.startsWith("/agentproof") || value.startsWith("/og-"));
}

function isTextAsset(assetPath, contentType) {
  return (
    /\.(?:css|html|js|json|mjs|txt|xml)$/.test(assetPath) ||
    /javascript|json|text|css|html|xml/.test(contentType)
  );
}

function collectTextFiles(roots) {
  return roots
    .flatMap((entry) => walk(entry))
    .filter((file) => /\.(?:css|html|js|json|md|mjs|ts|tsx|txt|xml)$/.test(file));
}

function walk(entry) {
  const absolute = resolve(root, entry);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((dirent) => {
    const child = join(entry, dirent.name);
    if (dirent.isDirectory()) return walk(child);
    return relative(root, resolve(root, child)).replace(/\\/g, "/");
  });
}

function extractUserFacingStringsFromFile(file) {
  const body = readFileSyncUtf8(file);
  const matches = [...body.matchAll(/["'`]([^"'`]*[\u3131-\uD79D][^"'`]*)["'`]/g)];
  return [...new Set(matches.map((match) => match[1].replace(/\s+/g, " ").trim()))].filter(
    (value) => value.length > 0 && !value.startsWith("@/"),
  );
}

function hasProhibited(value) {
  return prohibitedPatterns.some(({ pattern }) => pattern.test(value));
}

function inferRoute(file) {
  if (file.includes("privacy/request")) return "/privacy/request/";
  if (file.includes("privacy/page")) return "/privacy/";
  if (file.includes("beta-terms")) return "/beta-terms/";
  if (file.includes("survey")) return "/survey/";
  if (file === "README.md") return "README";
  return "/";
}

function readProductionBaseUrl() {
  const arg = process.argv.find((item) => item.startsWith("--production-base-url="));
  return arg?.split("=")[1] || process.env.CONTENT_SCAN_BASE_URL || process.env.PRODUCTION_BASE_URL || null;
}

function trimSlash(value) {
  return value.replace(/\/$/, "");
}

function readFileSyncUtf8(file) {
  return readFileSync(resolve(root, file), "utf8");
}

function csv(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function renderMatches(matches) {
  return matches.map((match) => `- ${match.scope}:${match.file}: ${match.term}`).join("\n");
}

async function writeJson(file, payload) {
  await writeFile(resolve(artifactsDir, file), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}
