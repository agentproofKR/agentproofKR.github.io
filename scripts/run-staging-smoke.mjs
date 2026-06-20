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
  assert(html.includes("AI 준비도 진단") || html.includes("_next"), "landing HTML missing app shell");
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

await runCheck("Browser form produces mailto fallback without API calls", async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let apiCalls = 0;
  await page.route("**/api/leads", async (route) => {
    apiCalls += 1;
    await route.fulfill({ status: 500, body: "static smoke should not call API" });
  });
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto(
    `${baseUrl}/?utm_source=smoke&utm_medium=local&utm_campaign=pages&utm_content=static`,
    { waitUntil: "networkidle" },
  );
  await page.getByRole("button", { name: "우리 조직 AI 준비도 확인" }).first().click();
  await page.getByLabel("역할").selectOption("대표·임원·팀장");
  await page.getByLabel("현재 단계").selectOption("회사 도입 검토");
  await page.getByLabel("가장 걱정되는 문제").selectOption("도입 우선순위");
  await page.getByLabel("회사/팀명").fill("QA 테스트 팀");
  await page.getByLabel("업무 이메일").fill("qa+agentproof@example.com");
  await page.getByLabel("상황 설명").fill("정적 Pages smoke test입니다.");
  await page.getByLabel(/개인정보 동의/).check();
  await page.getByRole("button", { name: "신청하기" }).click();

  const statusText = await page.getByRole("status").textContent();
  const href = await page
    .getByRole("link", { name: "업무 이메일로 신청 내용 보내기" })
    .getAttribute("href");
  const eventText = JSON.stringify(await page.evaluate(() => window.dataLayer));
  await browser.close();

  assert(apiCalls === 0, `expected 0 API calls, received ${apiCalls}`);
  assert(
    statusText?.includes("GitHub Pages 정적 배포에서는 서버 저장이 연결되어 있지 않습니다."),
    "static fallback status was not shown",
  );
  assert(href?.startsWith("mailto:"), "mailto handoff link missing");
  assert(!eventText.includes("qa+agentproof@example.com"), "analytics leaked email");
  assert(!eventText.includes("QA 테스트 팀"), "analytics leaked company");
  assert(!eventText.includes("정적 Pages smoke"), "analytics leaked memo");

  return { apiCalls, handoff: "mailto", analyticsPii: false };
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
