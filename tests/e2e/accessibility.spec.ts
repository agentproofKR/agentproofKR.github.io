import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 320, height: 568 },
]) {
  test(`has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  });
}

test("passes core automated accessibility checks", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).exclude("#__next-route-announcer__").analyze();

  expect(results.violations).toEqual([]);
});

test("keyboard users can start the survey and move through the first question", async ({ page }) => {
  await page.goto("/");
  const opener = page.getByRole("banner").getByRole("link", { name: /역할별 AI 준비도/ });
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/survey\/$/);

  const practitioner = page.getByRole("link", { name: /실무자 진단 시작/ });
  await practitioner.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/survey\/practitioner\/$/);
  await expect(page.getByTestId("survey-progress")).toContainText("1/24");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "계속" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("survey-progress")).toContainText("2/24");
});
