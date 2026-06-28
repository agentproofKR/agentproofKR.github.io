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

test("keyboard users can start the survey and move through the quick flow", async ({
  page,
}) => {
  await page.goto("/");
  const opener = page
    .getByRole("banner")
    .getByRole("link", { name: /무료 체크/ });
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/survey\/$/);

  const start = page.getByRole("button", { name: "시작하기" });
  await start.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/survey\/$/);
  await expect(
    page.getByRole("heading", { name: /어떤 업무에\s*AI를 쓸까요\?/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: /고객 문의 응대/ }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "다음" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: /한 달에\s*몇 건인가요\?/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: /10건 이하/ }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "다음" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /10분 이하/ }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "다음" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /확인 후 사용/ }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "다음" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /내부에서만 봅니다/ }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "결과 보기" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: /고객 문의 응대부터\s*시작해보세요/ }),
  ).toBeVisible();
});
