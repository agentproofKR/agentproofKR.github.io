import { expect, test } from "@playwright/test";

test("renders the landing baseline and routes CTAs to the role-based survey", async ({ page }) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /업무 AI,\s*어디까지 맡겨도 될까요\?/,
    }),
  ).toBeVisible();
  await expect(page.locator("#product")).toContainText("MVP preview · 문서·규정 검색 Agent");
  await expect(page.locator("#product")).toContainText("SAMPLE DATA");
  await expect(
    page.getByRole("img", { name: /AgentProof 업무용 AI 검증 대시보드 샘플/ }),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", { level: 2, name: /어디에서 가장\s*막히시나요\?/ }),
  ).toBeVisible();

  const headerCta = page.getByRole("banner").getByRole("link", { name: /역할별 AI 준비도/ });
  await expect(headerCta).toHaveAttribute("href", "/survey/");
  await expect(page.getByRole("link", { name: "역할별 AI 준비도 정밀진단" })).toHaveAttribute(
    "href",
    "/survey/",
  );

  const events = await page.evaluate(() => window.dataLayer);
  expect(JSON.stringify(events)).toContain("page_view");
});

test("links each landing role card to the matching persona survey", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.locator("article").filter({ hasText: "실무자" }).getByRole("link", { name: /이 문제 선택/ }),
  ).toHaveAttribute("href", "/survey/practitioner/");
  await expect(
    page
      .locator("article")
      .filter({ hasText: "대표·도입 담당자" })
      .getByRole("link", { name: /이 문제 선택/ }),
  ).toHaveAttribute("href", "/survey/leader/");
  await expect(
    page
      .locator("article")
      .filter({ hasText: "보안·정책 담당자" })
      .getByRole("link", { name: /이 문제 선택/ }),
  ).toHaveAttribute("href", "/survey/security/");
});
