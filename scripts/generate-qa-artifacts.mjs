import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const root = process.cwd();
const projectRoot = resolve(root, "..");
const artifactsDir = resolve(root, "artifacts", "qa");
let baseUrl = process.env.QA_BASE_URL ?? "";
const serverLog = resolve(artifactsDir, "qa-dev-server.log");
const sourcePaths = resolveSourcePaths();

await mkdir(artifactsDir, { recursive: true });

const logs = [];
let server = null;

try {
  if (!baseUrl) {
    const serverMode = process.env.QA_SERVER_MODE;
    baseUrl = serverMode === "production" ? null : await findReusableServer();
    if (!baseUrl) {
      const port = await findAvailablePort([3100, 3101, 3102, 3103, 3104]);
      baseUrl = `http://127.0.0.1:${port}`;
      const serverScript = serverMode === "production" ? "start" : "dev";
      server = spawnServerProcess({
        script: serverScript,
        port,
      });
      server.stdout.on("data", (chunk) => logs.push(chunk.toString()));
      server.stderr.on("data", (chunk) => logs.push(chunk.toString()));
    }
  }

  await waitForServer(`${baseUrl}/`);
  await writeFile(serverLog, logs.join(""), "utf8");

  const browser = await chromium.launch();
  const context = await browser.newContext({
    reducedMotion: "reduce",
    colorScheme: "light",
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.dataLayer = [];
  });

  const captures = [];
  const desktopPath = resolve(artifactsDir, "pc-full-1440.png");
  const mobilePath = resolve(artifactsDir, "mobile-full-390.png");

  await captureFullPage(page, { width: 1440, height: 1000 }, desktopPath);
  captures.push({ name: "pc-full-1440", path: desktopPath });
  await captureSections(page, "pc");

  await captureFullPage(page, { width: 390, height: 844 }, mobilePath);
  captures.push({ name: "mobile-full-390", path: mobilePath });
  await captureSections(page, "mobile");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(visualBaselineUrl(), { waitUntil: "networkidle" });
  await addStableCaptureStyles(page);
  await page.getByRole("button", { name: "내 과제 3분 진단" }).click();
  await page.locator('[role="dialog"]').screenshot({
    path: resolve(artifactsDir, "modal-default-pc.png"),
  });
  await page.getByRole("button", { name: "진단 제출" }).click();
  await page.locator('[role="dialog"]').screenshot({
    path: resolve(artifactsDir, "modal-error-pc.png"),
  });

  const axeResults = await new AxeBuilder({ page }).exclude("#__next-route-announcer__").analyze();
  await writeFile(
    resolve(artifactsDir, "accessibility-results.json"),
    JSON.stringify(
      {
        violations: axeResults.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
          help: violation.help,
          nodeDetails: violation.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
          })),
        })),
      },
      null,
      2,
    ),
    "utf8",
  );

  const desktopDiff = await compareImages({
    actualPath: desktopPath,
    expectedPath: sourcePaths.desktopReference,
    diffPath: resolve(artifactsDir, "pc-diff-1440.png"),
  });
  const mobileDiff = await compareImages({
    actualPath: mobilePath,
    expectedPath: sourcePaths.mobileReference,
    diffPath: resolve(artifactsDir, "mobile-diff-390.png"),
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    missingAuthoritativeVisualBaseline: {
      docs05: !sourcePaths.docs05,
      visualBaselineReadme: !sourcePaths.visualBaselineReadme,
      captureManifest: !sourcePaths.captureManifest,
    },
    sourcePaths,
    comparisons: {
      desktop: desktopDiff,
      mobile: mobileDiff,
    },
    accessibilityViolations: axeResults.violations.length,
    captures: captures.map((capture) => capture.path),
  };
  await writeFile(
    resolve(artifactsDir, "qa-summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );
  await writeFile(resolve(artifactsDir, "qa-summary.md"), renderMarkdownSummary(summary), "utf8");

  await browser.close();
} finally {
  terminateProcessTree(server);
  await writeFile(serverLog, logs.join(""), "utf8");
}

async function captureFullPage(page, viewport, path) {
  await page.setViewportSize(viewport);
  await page.goto(visualBaselineUrl(), { waitUntil: "networkidle" });
  await addStableCaptureStyles(page);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path, fullPage: true });
}

async function captureSections(page, prefix) {
  for (const [name, selector] of [
    ["hero", "main > section:first-child"],
    ["product", "#product"],
    ["roles", "#roles"],
    ["process", "#process"],
  ]) {
    const locator = page.locator(selector).first();
    await locator.screenshot({ path: resolve(artifactsDir, `${prefix}-${name}.png`) });
  }
}

async function addStableCaptureStyles(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal,
      [data-nextjs-dev-tools-button],
      [data-nextjs-dev-tools-root],
      [data-nextjs-toast],
      [data-nextjs-dialog-overlay] {
        display: none !important;
        visibility: hidden !important;
      }
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

async function compareImages({ actualPath, expectedPath, diffPath }) {
  const actual = PNG.sync.read(await readFile(actualPath));
  const expected = PNG.sync.read(await readFile(expectedPath));
  const width = Math.max(actual.width, expected.width);
  const height = Math.max(actual.height, expected.height);
  const normalizedActual = normalizePng(actual, width, height);
  const normalizedExpected = normalizePng(expected, width, height);
  const diff = new PNG({ width, height });
  const mismatchedPixels = pixelmatch(
    normalizedExpected.data,
    normalizedActual.data,
    diff.data,
    width,
    height,
    { threshold: 0.1, includeAA: false },
  );
  await writeFile(diffPath, PNG.sync.write(diff));
  return {
    actual: { width: actual.width, height: actual.height },
    expected: { width: expected.width, height: expected.height },
    canvas: { width, height },
    mismatchedPixels,
    diffPixelRatio: mismatchedPixels / (width * height),
    threshold0015Pass: mismatchedPixels / (width * height) <= 0.015,
    diffPath,
  };
}

function normalizePng(source, width, height) {
  const target = new PNG({ width, height, fill: true });
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceIndex = (source.width * y + x) << 2;
      const targetIndex = (width * y + x) << 2;
      target.data[targetIndex] = source.data[sourceIndex];
      target.data[targetIndex + 1] = source.data[sourceIndex + 1];
      target.data[targetIndex + 2] = source.data[sourceIndex + 2];
      target.data[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }
  return target;
}

async function waitForServer(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 120000) {
    if (await isServerReady(url)) {
      return;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
  }
  throw new Error(`Server did not become ready: ${url}`);
}

async function findAvailablePort(ports) {
  for (const port of ports) {
    if (!(await isServerReady(`http://127.0.0.1:${port}/`))) {
      return port;
    }
  }
  throw new Error(`No available QA port found: ${ports.join(", ")}`);
}

async function findReusableServer() {
  for (const candidate of ["http://127.0.0.1:3000", "http://localhost:3000"]) {
    if (await isAgentProofLanding(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function isServerReady(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function isAgentProofLanding(base) {
  try {
    const response = await fetch(`${base}/`);
    if (!response.ok) {
      return false;
    }
    const html = await response.text();
    return html.includes("AgentProof") && (html.includes("3분 진단") || html.includes("업무 AI"));
  } catch {
    return false;
  }
}

function renderMarkdownSummary(summary) {
  const missingInputs = Object.entries(summary.missingAuthoritativeVisualBaseline)
    .map(([key, isMissing]) => `- ${key}: ${isMissing ? "missing" : "found"}`)
    .join("\n");

  return `# AgentProof Landing QA Summary

- Generated at: ${summary.generatedAt}
- Base URL: ${summary.baseUrl}
- Accessibility violations: ${summary.accessibilityViolations}

## Visual Diff

| Target | Actual | Expected | Diff ratio | <= 0.015 |
|---|---:|---:|---:|---|
| PC 1440 | ${summary.comparisons.desktop.actual.width}x${summary.comparisons.desktop.actual.height} | ${summary.comparisons.desktop.expected.width}x${summary.comparisons.desktop.expected.height} | ${summary.comparisons.desktop.diffPixelRatio.toFixed(6)} | ${summary.comparisons.desktop.threshold0015Pass} |
| Mobile 390 | ${summary.comparisons.mobile.actual.width}x${summary.comparisons.mobile.actual.height} | ${summary.comparisons.mobile.expected.width}x${summary.comparisons.mobile.expected.height} | ${summary.comparisons.mobile.diffPixelRatio.toFixed(6)} | ${summary.comparisons.mobile.threshold0015Pass} |

## Missing Inputs

${missingInputs}
`;
}

function resolveSourcePaths() {
  const candidates = [root, projectRoot];
  return {
    docs05: firstExisting(
      candidates.map((candidate) => resolve(candidate, "docs", "05_시각검수_기준.md")),
    ),
    visualBaselineReadme: firstExisting(
      candidates.map((candidate) =>
        resolve(candidate, "reference", "visual-baseline", "README.md"),
      ),
    ),
    captureManifest: firstExisting(
      candidates.map((candidate) =>
        resolve(candidate, "reference", "visual-baseline", "capture-manifest.json"),
      ),
    ),
    desktopReference:
      firstExisting(
        candidates.map((candidate) =>
          resolve(candidate, "reference", "visual-baseline", "v5-service", "pc-full-1440.png"),
        ),
      ) ?? resolve(root, "reference", "agentproof_v4_target_desktop.png"),
    mobileReference:
      firstExisting(
        candidates.map((candidate) =>
          resolve(
            candidate,
            "reference",
            "visual-baseline",
            "v5-service",
            "mobile-full-390.png",
          ),
        ),
      ) ?? resolve(root, "reference", "agentproof_v4_target_mobile.png"),
  };
}

function firstExisting(paths) {
  return paths.find((path) => existsSync(path)) ?? null;
}

function visualBaselineUrl() {
  const url = new URL(baseUrl);
  url.searchParams.set("visualBaseline", "1");
  return url.toString();
}

function spawnServerProcess({ script, port }) {
  if (script === "start") {
    const args = [
      "scripts/serve-static.mjs",
      "out",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ];
    if (process.platform === "win32") {
      return spawn("cmd.exe", ["/d", "/s", "/c", "node", ...args], {
        cwd: root,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    }
    return spawn("node", args, {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  const args = ["-y", "pnpm@11.8.0", script, "--hostname", "127.0.0.1", "--port", String(port)];
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/d", "/s", "/c", "npx", ...args], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  }
  return spawn("npx", args, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function terminateProcessTree(childProcess) {
  if (!childProcess?.pid) {
    return;
  }
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(childProcess.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }
  childProcess.kill("SIGTERM");
}
