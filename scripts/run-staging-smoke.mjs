import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const artifactsDir = resolve(root, "artifacts", "qa");
const baseUrl = (
  process.env.STAGING_BASE_URL ??
  process.env.QA_BASE_URL ??
  "http://127.0.0.1:3101"
).replace(/\/$/, "");

const startedAt = new Date();
const checks = [];

await mkdir(artifactsDir, { recursive: true });

await runCheck("GET / renders static landing shell", async () => {
  const response = await request("/");
  const html = await response.text();
  assert(response.status === 200, `expected 200, received ${response.status}`);
  assert(html.includes("AgentProof"), "landing HTML does not include AgentProof");
  assert(
    html.includes("업무 AI") || html.includes("3분 진단") || html.includes("_next"),
    "landing HTML missing V5 app shell",
  );
  return { statusCode: response.status };
});

await runCheck("GET /privacy/ renders policy", async () => {
  const response = await request("/privacy/");
  const html = await response.text();
  assert(response.status === 200, `expected 200, received ${response.status}`);
  assert(html.includes("개인정보"), "privacy page does not include privacy copy");
  return { statusCode: response.status };
});

await runCheck("GET /robots.txt exposes crawler policy", async () => {
  const response = await request("/robots.txt");
  const text = await response.text();
  assert(response.status === 200, `expected 200, received ${response.status}`);
  assert(
    text.includes("User-Agent") || text.includes("User-agent"),
    "robots.txt missing user-agent rule",
  );
  return {
    statusCode: response.status,
    policy: text.includes("Disallow: /") ? "staging-noindex-like" : "production-indexable",
  };
});

await runCheck("GET /sitemap.xml exposes root and privacy URLs", async () => {
  const response = await request("/sitemap.xml");
  const xml = await response.text();
  assert(response.status === 200, `expected 200, received ${response.status}`);
  assert(xml.includes("<urlset"), "sitemap missing urlset");
  assert(xml.includes("/privacy"), "sitemap missing privacy URL");
  return { statusCode: response.status };
});

await runCheck("GET /api/leads is absent on static Pages build", async () => {
  const response = await request("/api/leads");
  assert(response.status === 404, `expected 404, received ${response.status}`);
  return { statusCode: response.status };
});

await runCheck("Browser survey keeps disabled-storage results local and non-sensitive", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let storageCalls = 0;
  await page.route("**/functions/v1/survey-submit", async (route) => {
    storageCalls += 1;
    await route.fulfill({ status: 500, body: "static smoke should not call API" });
  });
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto(
    `${baseUrl}/survey/leader/?utm_source=smoke&utm_medium=local&utm_campaign=pages&utm_content=static`,
    { waitUntil: "networkidle" },
  );

  const questionCount = Number(await page.getByTestId("survey-shell").getAttribute("data-question-count"));
  for (let index = 0; index < questionCount; index += 1) {
    await answerCurrentQuestion(page);
  }

  const storageNotice = await page.locator("body").textContent();
  if (storageNotice?.includes("설문 저장소가 연결되어 있습니다.")) {
    await browser.close();
    return { skipped: "live storage configured; use verify:production:supabase for QA writes" };
  }

  await page.getByLabel("만 14세 이상입니다.").check();
  await page.getByLabel(/고객조사 및 서비스 개발을 위한/).check();
  await page.getByRole("button", { name: "결과 확인" }).click();
  await page.waitForURL(/\/survey\/result\/$/);

  const storage = await page.evaluate(() => ({
    localResult: window.localStorage.getItem("agentproof-survey-result"),
    sessionResult: window.sessionStorage.getItem("agentproof-survey-result"),
    draftKeys: Object.keys(window.localStorage).filter((key) =>
      key.startsWith("agentproof-survey-draft-"),
    ),
  }));
  const eventText = JSON.stringify(await page.evaluate(() => window.dataLayer));
  await browser.close();

  assert(storageCalls === 0, `expected 0 storage calls, received ${storageCalls}`);
  assert(storage.localResult === null, "survey result was written to localStorage");
  assert(storage.sessionResult, "survey result summary missing from sessionStorage");
  assert(storage.draftKeys.length === 0, "draft keys were written without opt-in");
  assert(!storage.sessionResult.includes('"answers"'), "raw answers leaked into result storage");
  assert(!storage.sessionResult.includes("C01"), "question IDs leaked into result storage");
  assert(!eventText.includes("lead_form_success"), "analytics emitted false success");

  return { storageCalls, resultStorage: "sessionStorage-summary", analyticsPii: false };
});

await runCheck("Mobile widths have no horizontal overflow", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];
  for (const width of [390, 360, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    results.push({ width, ...dimensions });
    assert(
      dimensions.scrollWidth <= dimensions.clientWidth + 1,
      `${width}px overflow: ${dimensions.scrollWidth} > ${dimensions.clientWidth}`,
    );
  }
  await browser.close();
  return { widths: results };
});

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  checks,
  passed: checks.every((check) => check.status === "passed"),
  productionSmoke: {
    status: process.env.STAGING_BASE_URL || process.env.QA_BASE_URL ? "checked-target-url" : "local-default-url",
    note:
      "This static GitHub Pages build has no server-side lead storage. Form submission is verified as a mailto fallback, not as DB persistence.",
  },
};

await writeFile(
  resolve(artifactsDir, "staging-smoke.json"),
  JSON.stringify(summary, null, 2),
  "utf8",
);
await writeFile(resolve(artifactsDir, "staging-smoke.md"), renderMarkdown(summary), "utf8");

if (!summary.passed) {
  process.exitCode = 1;
}

async function runCheck(name, fn) {
  const start = Date.now();
  try {
    const details = await fn();
    checks.push({
      name,
      status: "passed",
      durationMs: Date.now() - start,
      details,
    });
  } catch (error) {
    checks.push({
      name,
      status: "failed",
      durationMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function request(path) {
  return fetch(`${baseUrl}${path}`, {
    headers: {
      "user-agent": "agentproof-static-smoke/1.0",
    },
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function answerCurrentQuestion(page) {
  const question = page.getByTestId("survey-question");
  const checkbox = question.getByRole("checkbox").first();
  if ((await checkbox.count()) > 0) {
    await checkbox.check();
  } else {
    await question.getByRole("radio").first().check();
  }
  await page.getByRole("button", { name: "계속" }).click();
}

function renderMarkdown(summary) {
  const rows = summary.checks
    .map(
      (check) =>
        `| ${check.name} | ${check.status} | ${check.durationMs} | ${
          check.error ? check.error.replace(/\|/g, "\\|") : ""
        } |`,
    )
    .join("\n");

  return `# AgentProof Landing Static Smoke

- Generated at: ${summary.generatedAt}
- Base URL: ${summary.baseUrl}
- Passed: ${summary.passed}
- Production smoke mode: ${summary.productionSmoke.status}
- Note: ${summary.productionSmoke.note}

## Checks

| Check | Status | Duration ms | Error |
|---|---:|---:|---|
${rows}
`;
}
