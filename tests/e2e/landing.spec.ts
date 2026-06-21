import { expect, test } from "@playwright/test";

test("renders the V6 landing baseline and routes CTAs to the unified survey", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /회사에서 AI 쓰고 있는데,\s*어디까지 믿어도 될까요\?/,
    }),
  ).toBeVisible();
  await expect(page.locator("#product")).toContainText(
    "결과 예시 · AI 업무 위험도",
  );
  await expect(page.locator("#product")).toContainText("SAMPLE DATA");
  await expect(
    page.getByRole("img", { name: /AgentProof 업무용 AI 검증 대시보드 샘플/ }),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /AI를 쓰기 시작하면,\s*이런 문제가 먼저 생깁니다/,
    }),
  ).toBeVisible();

  const headerCta = page
    .getByRole("banner")
    .getByRole("link", { name: /3분 점검/ });
  await expect(headerCta).toHaveAttribute("href", "/survey/");
  await expect(
    page.getByRole("link", { name: "AI 업무 자가점검 시작" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "무료로 AI 업무 위험도 확인하기" }).first(),
  ).toHaveAttribute("href", "/survey/");

  const events = await page.evaluate(() => window.dataLayer);
  expect(JSON.stringify(events)).toContain("page_view");
});

test("links each landing problem card to the unified survey with problem intent", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page
      .locator("article")
      .filter({ hasText: "AI 답변을 믿어도 될지 모르겠어요" })
      .getByRole("link", { name: /이 문제로 점검하기/ }),
  ).toHaveAttribute("href", "/survey/?problem=trust");
  await expect(
    page
      .locator("article")
      .filter({ hasText: "어떤 업무부터 도입해야 할지 모르겠어요" })
      .getByRole("link", { name: /이 문제로 점검하기/ }),
  ).toHaveAttribute("href", "/survey/?problem=adoption");
  await expect(
    page
      .locator("article")
      .filter({ hasText: "보안·개인정보·승인 기준이 없어요" })
      .getByRole("link", { name: /이 문제로 점검하기/ }),
  ).toHaveAttribute("href", "/survey/?problem=security");
});
