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
  test(`has no horizontal overflow at ${viewport.width}px`, async ({
    page,
  }) => {
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
  const results = await new AxeBuilder({ page })
    .exclude("#__next-route-announcer__")
    .analyze();

  expect(results.violations).toEqual([]);
});

test("keyboard users can start the survey and move through the first question", async ({
  page,
}) => {
  await page.goto("/");
  const opener = page
    .getByRole("banner")
    .getByRole("link", { name: /AI 활용 진단/ });
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/survey\/$/);

  const start = page.getByRole("link", { name: "시작하기" });
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/survey\/practitioner\/$/);

  await expect(page.getByTestId("survey-consent-step")).toBeVisible();
  await page.getByLabel("성명").focus();
  await page.keyboard.type("김테스트");
  await page.getByLabel("연락처").focus();
  await page.keyboard.type("qa+keyboard@example.com");
  await page.getByRole("radio", { name: "동의합니다" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "동의합니다" })).toBeChecked();
  await page.getByTestId("age-consent").focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("age-consent")).toBeChecked();
  await page.getByTestId("survey-processing-consent").focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("survey-processing-consent")).toBeChecked();
  await page.getByRole("button", { name: "동의하고 시작하기" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("survey-progress")).toContainText("1/10");

  await page.getByTestId("survey-question").getByRole("radio").first().focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "계속" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("survey-progress")).toContainText("2/10");
});
