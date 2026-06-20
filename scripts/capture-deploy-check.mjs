import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const root = process.cwd();
const baseUrl = (process.env.QA_BASE_URL ?? "http://127.0.0.1:3101").replace(/\/$/, "");
const artifactsDir = resolve(root, "artifacts", "deploy-check");

await mkdir(artifactsDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ colorScheme: "light", reducedMotion: "reduce" });

const desktopPath = resolve(artifactsDir, "local-pc-1440.png");
const mobilePath = resolve(artifactsDir, "local-mobile-390.png");

await capture(page, { width: 1440, height: 1000 }, desktopPath);
await capture(page, { width: 390, height: 844 }, mobilePath);

const desktopDiff = await compareImages({
  actualPath: desktopPath,
  expectedPath: resolve(root, "reference", "visual-baseline", "pc", "00_pc_full_1440x3159.png"),
  diffPath: resolve(artifactsDir, "local-pc-diff-1440.png"),
});
const mobileDiff = await compareImages({
  actualPath: mobilePath,
  expectedPath: resolve(
    root,
    "reference",
    "visual-baseline",
    "mobile",
    "00_mobile_full_390x3759.png",
  ),
  diffPath: resolve(artifactsDir, "local-mobile-diff-390.png"),
});

const overflow = [];
for (const width of [390, 360, 320]) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  overflow.push(
    await page.evaluate((viewportWidth) => {
      const rootElement = document.documentElement;
      return {
        viewportWidth,
        clientWidth: rootElement.clientWidth,
        scrollWidth: rootElement.scrollWidth,
        passed: rootElement.scrollWidth <= rootElement.clientWidth + 1,
      };
    }, width),
  );
}

await browser.close();

const summary = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  captures: {
    desktop: desktopPath,
    mobile: mobilePath,
  },
  comparisons: {
    desktop: desktopDiff,
    mobile: mobileDiff,
  },
  overflow,
  passed:
    desktopDiff.diffPixelRatio <= 0.015 &&
    mobileDiff.diffPixelRatio <= 0.015 &&
    overflow.every((result) => result.passed),
};

await writeFile(
  resolve(artifactsDir, "deploy-check-summary.json"),
  JSON.stringify(summary, null, 2),
  "utf8",
);
await writeFile(resolve(artifactsDir, "deploy-check-summary.md"), renderMarkdown(summary), "utf8");

if (!summary.passed) {
  process.exitCode = 1;
}

async function capture(targetPage, viewport, path) {
  await targetPage.setViewportSize(viewport);
  await targetPage.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await targetPage.addStyleTag({
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
  await targetPage.evaluate(() => document.fonts.ready);
  await targetPage.screenshot({ path, fullPage: true });
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
    mismatchedPixels,
    diffPixelRatio: mismatchedPixels / (width * height),
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

function renderMarkdown(summary) {
  const overflowRows = summary.overflow
    .map(
      (result) =>
        `| ${result.viewportWidth} | ${result.clientWidth} | ${result.scrollWidth} | ${result.passed} |`,
    )
    .join("\n");

  return `# AgentProof Deploy Check

- Generated at: ${summary.generatedAt}
- Base URL: ${summary.baseUrl}
- Passed: ${summary.passed}

## Visual Diff

| Target | Actual | Expected | Diff ratio | <= 0.015 |
|---|---:|---:|---:|---|
| PC 1440 | ${summary.comparisons.desktop.actual.width}x${summary.comparisons.desktop.actual.height} | ${summary.comparisons.desktop.expected.width}x${summary.comparisons.desktop.expected.height} | ${summary.comparisons.desktop.diffPixelRatio.toFixed(6)} | ${summary.comparisons.desktop.diffPixelRatio <= 0.015} |
| Mobile 390 | ${summary.comparisons.mobile.actual.width}x${summary.comparisons.mobile.actual.height} | ${summary.comparisons.mobile.expected.width}x${summary.comparisons.mobile.expected.height} | ${summary.comparisons.mobile.diffPixelRatio.toFixed(6)} | ${summary.comparisons.mobile.diffPixelRatio <= 0.015} |

## Horizontal Overflow

| Viewport | Client width | Scroll width | Passed |
|---:|---:|---:|---|
${overflowRows}
`;
}
