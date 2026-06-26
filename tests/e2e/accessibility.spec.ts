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

  const start = page.getByRole("button", { name: "시작하기" });
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/survey\/$/);
  await expect(
    page.getByRole("heading", { name: "지금 상황은?" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "직접 쓰고 있어요" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "먼저 해볼 일은?" }),
  ).toBeVisible();
});
