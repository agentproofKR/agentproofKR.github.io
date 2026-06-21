import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const baseUrl = trimSlash(process.env.FINAL_QA_BASE_URL ?? "https://agentproofkr.github.io");
const expectedOperatorName = process.env.LEGAL_OPERATOR_NAME ?? "";
const artifactsDir = resolve(root, "artifacts", "qa", "final-production");
const logsDir = resolve(artifactsDir, "logs");
const securityDir = resolve(artifactsDir, "security");

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

const responsiveWidths = [1440, 1280, 1024, 768, 390, 360, 320];
const secretMarkers = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_DB_PASSWORD",
  "CONTACT_ENCRYPTION_KEY",
  "service_role",
  "BEGIN PRIVATE KEY",
];

const screenshotTargets = [
  { name: "homepage-desktop", route: "/", viewport: { width: 1440, height: 1000 } },
  { name: "homepage-mobile", route: "/", viewport: { width: 390, height: 844 } },
  { name: "practitioner-start", route: "/survey/practitioner/", viewport: { width: 1440, height: 1000 } },
  { name: "leader-start", route: "/survey/leader/", viewport: { width: 1440, height: 1000 } },
  { name: "security-start", route: "/survey/security/", viewport: { width: 1440, height: 1000 } },
  { name: "consent-page-mobile", route: "/survey/practitioner/", viewport: { width: 390, height: 844 } },
  { name: "result-page", route: "/survey/result/", viewport: { width: 1440, height: 1000 } },
  { name: "privacy-summary", route: "/privacy/", viewport: { width: 1440, height: 1000 } },
  { name: "privacy-details-mobile", route: "/privacy/", viewport: { width: 390, height: 844 } },
  { name: "rights-request", route: "/privacy/request/", viewport: { width: 1440, height: 1000 } },
  { name: "beta-terms", route: "/beta-terms/", viewport: { width: 1440, height: 1000 } },
];

const socialRoutes = [
  { persona: "practitioner", route: "/survey/practitioner/" },
  { persona: "leader", route: "/survey/leader/" },
  { persona: "security", route: "/survey/security/" },
];

await mkdir(artifactsDir, { recursive: true });
await mkdir(logsDir, { recursive: true });
await mkdir(securityDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  colorScheme: "light",
  reducedMotion: "reduce",
});
await context.addInitScript((storedResult) => {
  window.sessionStorage.setItem("agentproof-survey-result", storedResult);
}, JSON.stringify(buildSyntheticStoredResult()));

const diagnostics = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  screenshots: [],
  responsive: [],
  metadata: [],
  consoleErrors: [],
  requestFailures: [],
  failedResponses: [],
  piiUrlViolations: [],
};

for (const target of screenshotTargets) {
  const page = await newQaPage(context, diagnostics);
  await page.setViewportSize(target.viewport);
  await gotoRoute(page, target.route);
  await addStableCaptureStyles(page);
  const screenshotPath = resolve(artifactsDir, `${target.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  diagnostics.screenshots.push({
    name: target.name,
    route: target.route,
    viewport: target.viewport,
    path: screenshotPath,
  });
  diagnostics.piiUrlViolations.push(...findPiiUrlViolations(page.url(), target.route));
  await page.close();
}

for (const route of publicRoutes) {
  for (const width of responsiveWidths) {
    const page = await newQaPage(context, diagnostics);
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1000 });
    await gotoRoute(page, route);
    await addStableCaptureStyles(page);
    const result = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 ||
        document.body.scrollWidth > document.documentElement.clientWidth + 1,
    }));
    diagnostics.responsive.push({ route, width, ...result });
    diagnostics.piiUrlViolations.push(...findPiiUrlViolations(page.url(), route));
    await page.close();
  }
}

for (const socialRoute of socialRoutes) {
  const page = await newQaPage(context, diagnostics);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await gotoRoute(page, socialRoute.route);
  const metadata = await extractMetadata(page, socialRoute);
  diagnostics.metadata.push(metadata);
  await page.close();

  const previewPage = await context.newPage();
  await previewPage.setViewportSize({ width: 1200, height: 760 });
  await previewPage.setContent(renderSocialPreview(metadata), { waitUntil: "networkidle" });
  const previewPath = resolve(artifactsDir, `social-preview-${socialRoute.persona}.png`);
  await previewPage.screenshot({ path: previewPath, fullPage: true });
  diagnostics.screenshots.push({
    name: `social-preview-${socialRoute.persona}`,
    route: socialRoute.route,
    viewport: { width: 1200, height: 760 },
    path: previewPath,
  });
  await previewPage.close();
}

const security = await scanProductionSecurity();
const operatorVerification = await verifyOperatorName();
const summary = {
  generatedAt: diagnostics.generatedAt,
  baseUrl,
  counts: {
    screenshots: diagnostics.screenshots.length,
    responsiveChecks: diagnostics.responsive.length,
    socialMetadataChecks: diagnostics.metadata.length,
    consoleErrors: diagnostics.consoleErrors.length,
    requestFailures: diagnostics.requestFailures.length,
    failedResponses: diagnostics.failedResponses.length,
    piiUrlViolations: diagnostics.piiUrlViolations.length,
    horizontalOverflow: diagnostics.responsive.filter((item) => item.hasHorizontalOverflow).length,
    secretMatches: security.matches.length,
  },
  passed:
    diagnostics.consoleErrors.length === 0 &&
    diagnostics.requestFailures.length === 0 &&
    diagnostics.failedResponses.length === 0 &&
    diagnostics.piiUrlViolations.length === 0 &&
    diagnostics.responsive.every((item) => !item.hasHorizontalOverflow) &&
    diagnostics.metadata.every((item) => item.passed) &&
    security.matches.length === 0 &&
    operatorVerification.passed,
  screenshotDir: artifactsDir,
  logDir: logsDir,
  securityDir,
  noLiveSurveySubmissionMade: true,
  storageProofBoundary:
    "This browser QA script does not submit a live survey; Supabase live write/delete proof is produced by the release verification workflow.",
};

await writeJson(resolve(logsDir, "final-production-browser-check.json"), {
  ...diagnostics,
  operatorVerification,
  summary,
});
await writeJson(resolve(securityDir, "client-security-check.json"), security);
await writeJson(resolve(logsDir, "social-metadata-check.json"), diagnostics.metadata);
await writeFile(resolve(artifactsDir, "final-production-summary.md"), renderSummary(summary), "utf8");

await browser.close();

if (!summary.passed) {
  process.exitCode = 1;
}

async function newQaPage(currentContext, diagnosticsTarget) {
  const page = await currentContext.newPage();
  page.on("console", (message) => {
    if (message.type() === "error" && !isIgnoredConsoleError(message.text())) {
      diagnosticsTarget.consoleErrors.push({
        text: message.text(),
        location: message.location(),
      });
    }
  });
  page.on("requestfailed", (request) => {
    if (isIgnoredRequestFailure(request)) {
      return;
    }
    diagnosticsTarget.requestFailures.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText ?? "unknown",
    });
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400 && response.url().startsWith(baseUrl)) {
      diagnosticsTarget.failedResponses.push({
        url: response.url(),
        status,
      });
    }
  });
  return page;
}

async function gotoRoute(page, route) {
  const url = new URL(route, `${baseUrl}/`);
  url.searchParams.set("qa_cache_bust", `${Date.now()}`);
  await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
}

async function addStableCaptureStyles(page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

async function extractMetadata(page, socialRoute) {
  const metadata = await page.evaluate(() => {
    const getMeta = (selector) => document.querySelector(selector)?.getAttribute("content") ?? "";
    return {
      title: document.title,
      description: getMeta('meta[name="description"]'),
      ogTitle: getMeta('meta[property="og:title"]'),
      ogDescription: getMeta('meta[property="og:description"]'),
      ogImage: getMeta('meta[property="og:image"]'),
      ogUrl: getMeta('meta[property="og:url"]'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    };
  });
  const expectedPath = socialRoute.route;
  const passed =
    Boolean(metadata.title) &&
    Boolean(metadata.description) &&
    Boolean(metadata.ogTitle) &&
    Boolean(metadata.ogDescription) &&
    metadata.ogImage.includes("og-agentproof.png") &&
    metadata.canonical.endsWith(expectedPath) &&
    metadata.ogUrl.endsWith(expectedPath);
  return {
    persona: socialRoute.persona,
    route: socialRoute.route,
    ...metadata,
    passed,
  };
}

async function scanProductionSecurity() {
  const routes = [];
  const scripts = new Set();
  const matches = [];

  for (const route of publicRoutes) {
    const url = new URL(route, `${baseUrl}/`);
    url.searchParams.set("security_cache_bust", `${Date.now()}`);
    const response = await fetch(url);
    const text = await response.text();
    routes.push({ route, status: response.status, bytes: text.length });
    matches.push(...scanTextForSecrets(text, `html:${route}`));
    for (const match of text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
      scripts.add(new URL(match[1], baseUrl).toString());
    }
  }

  const scriptResults = [];
  for (const scriptUrl of scripts) {
    const response = await fetch(scriptUrl);
    const text = await response.text();
    scriptResults.push({ url: scriptUrl, status: response.status, bytes: text.length });
    matches.push(...scanTextForSecrets(text, `script:${new URL(scriptUrl).pathname}`));
  }

  return {
    generatedAt: new Date().toISOString(),
    baseUrl,
    routes,
    scripts: scriptResults,
    secretMarkers,
    matches,
    passed: matches.length === 0,
  };
}

async function verifyOperatorName() {
  if (!expectedOperatorName) {
    return {
      passed: false,
      expectedProvided: false,
      note: "LEGAL_OPERATOR_NAME was not provided to the QA script.",
    };
  }
  const privacyText = await fetchText("/privacy/");
  const requestText = await fetchText("/privacy/request/");
  const containsPrivacy = privacyText.includes(expectedOperatorName);
  const containsRequest = requestText.includes(expectedOperatorName);
  return {
    passed: containsPrivacy && containsRequest,
    expectedProvided: true,
    valueLength: expectedOperatorName.length,
    valueSha256Prefix: createHash("sha256").update(expectedOperatorName).digest("hex").slice(0, 12),
    privacyPageContainsExpected: containsPrivacy,
    rightsRequestPageContainsExpected: containsRequest,
  };
}

async function fetchText(route) {
  const url = new URL(route, `${baseUrl}/`);
  url.searchParams.set("operator_cache_bust", `${Date.now()}`);
  const response = await fetch(url);
  return response.text();
}

function scanTextForSecrets(text, location) {
  return secretMarkers
    .filter((marker) => text.includes(marker))
    .map((marker) => ({
      location,
      marker,
    }));
}

function isIgnoredConsoleError(text) {
  return text.includes("static.cloudflareinsights.com/beacon.min.js");
}

function isIgnoredRequestFailure(request) {
  const failure = request.failure()?.errorText ?? "";
  if (request.url().includes("static.cloudflareinsights.com/beacon.min.js")) {
    return true;
  }
  return request.method() === "HEAD" && failure === "net::ERR_ABORTED";
}

function findPiiUrlViolations(url, route) {
  const decoded = decodeURIComponent(url);
  return ["email", "company", "memo", "answer", "qa+"]
    .filter((marker) => decoded.toLowerCase().includes(marker))
    .map((marker) => ({ route, url, marker }));
}

function renderSocialPreview(metadata) {
  return `<!doctype html>
  <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>Social preview ${escapeHtml(metadata.persona)}</title>
      <style>
        body {
          margin: 0;
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f6f3ed;
          font-family: Arial, "Malgun Gothic", sans-serif;
          color: #111827;
        }
        .card {
          width: 960px;
          border: 1px solid #d5d8d3;
          background: #ffffff;
          box-shadow: 0 18px 60px rgba(17, 24, 39, 0.12);
        }
        img {
          width: 100%;
          aspect-ratio: 1200 / 630;
          object-fit: cover;
          display: block;
        }
        .content {
          padding: 28px;
        }
        .url {
          color: #47615c;
          font-size: 18px;
          margin-bottom: 10px;
        }
        h1 {
          font-size: 32px;
          line-height: 1.25;
          margin: 0 0 12px;
          letter-spacing: 0;
        }
        p {
          font-size: 20px;
          line-height: 1.5;
          margin: 0;
          color: #4b5563;
        }
      </style>
    </head>
    <body>
      <article class="card" aria-label="social preview">
        <img src="${escapeHtml(metadata.ogImage)}" alt="" />
        <div class="content">
          <div class="url">${escapeHtml(metadata.canonical)}</div>
          <h1>${escapeHtml(metadata.ogTitle)}</h1>
          <p>${escapeHtml(metadata.ogDescription)}</p>
        </div>
      </article>
    </body>
  </html>`;
}

function buildSyntheticStoredResult() {
  const band = {
    min: 60,
    max: 79,
    label: "통제 기반 확대 준비",
    summary: "통제 기준을 갖춘 상태에서 일부 업무 확장을 검토할 수 있습니다.",
  };
  return {
    sessionId: "qa-synthetic-result-only",
    persona: "leader",
    completedAt: new Date().toISOString(),
    submissionMode: {
      mode: "disabled",
      message:
        "QA 화면 캡처용 예시 결과입니다. 이 캡처 과정에서는 운영 저장소에 설문을 제출하지 않았습니다.",
    },
    result: {
      persona: "leader",
      surveyVersion: "2026-06-21",
      scoringVersion: "2026-06-21",
      totalScore: 72,
      band,
      effectiveBand: band,
      dimensionScores: {
        "AI 사용 현황": 75,
        "개인정보·보안 통제": 70,
        "책임·승인 구조": 68,
      },
      riskFlags: ["역할별 승인 기준과 기록 방식이 더 명확해야 합니다."],
      criticalWarnings: [],
      informationGapQuestionIds: [],
      excludedQuestionIds: [],
      topRisks: ["민감정보 입력 기준을 문서로 남겨야 합니다."],
      recommendedActions: [
        "이번 주에 AI 사용 업무와 금지 업무를 분리합니다.",
        "개인정보 입력 금지 기준을 팀 안내문에 추가합니다.",
        "외부 제출 전 검토 책임자를 지정합니다.",
      ],
      featureHypothesis:
        "AgentProof는 업무별 AI 사용 기준과 승인 기록을 정리하는 데 도움을 줄 수 있습니다.",
    },
  };
}

function renderSummary(summary) {
  return `# Final Production QA Summary

- Generated at: ${summary.generatedAt}
- Base URL: ${summary.baseUrl}
- Screenshots: ${summary.counts.screenshots}
- Responsive checks: ${summary.counts.responsiveChecks}
- Social metadata checks: ${summary.counts.socialMetadataChecks}
- Console errors: ${summary.counts.consoleErrors}
- Request failures: ${summary.counts.requestFailures}
- Failed production responses: ${summary.counts.failedResponses}
- PII URL violations: ${summary.counts.piiUrlViolations}
- Horizontal overflow findings: ${summary.counts.horizontalOverflow}
- Client secret marker matches: ${summary.counts.secretMatches}
- Result: ${summary.passed ? "PASS" : "FAIL"}

${summary.storageProofBoundary}
`;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function trimSlash(value) {
  return value.replace(/\/+$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
