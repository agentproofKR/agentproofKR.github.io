import { expect, test } from "@playwright/test";

test("renders the simplified landing flow and routes CTAs to the unified survey", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /AI,\s*업무에 그냥 쓰면 위험합니다\./,
    }),
  ).toBeVisible();
  await expect(page.locator("#result-example")).toHaveCount(0);
  await expect(page.getByText("결과 예시 보기")).toHaveCount(0);
  await expect(page.getByText("결과는 이렇게 나옵니다")).toHaveCount(0);
  await expect(page.getByRole("navigation")).not.toContainText("결과");
  await expect(page.locator("#product")).toContainText(
    "AgentProof로 이렇게 관리합니다",
  );
  await expect(page.locator("#product")).toContainText("SAMPLE DATA");
  await expect(
    page.getByRole("img", { name: /AgentProof 업무용 AI 검증 대시보드 샘플/ }),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /AI 쓸 때,\s*가장 많이 막히는 3가지/,
    }),
  ).toBeVisible();
  await expect(page.locator("#problem + #product")).toHaveCount(1);

  const headerCta = page
    .getByRole("banner")
    .getByRole("link", { name: /무료 체크/ });
  await expect(headerCta).toHaveAttribute("href", "/survey/");
  await expect(
    page.getByRole("link", { name: "AI 업무 자가진단 시작" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "무료 체크" }).first(),
  ).toHaveAttribute("href", "/survey/");
  await expect(
    page.getByRole("button", { name: "대시보드 보기" }),
  ).toBeVisible();

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
      .filter({ hasText: "AI가 틀리면" })
      .getByRole("link", { name: /확인하기/ }),
  ).toHaveAttribute("href", "/survey/?problem=trust");
  await expect(
    page
      .locator("article")
      .filter({ hasText: "AI 도입," })
      .getByRole("link", { name: /확인하기/ }),
  ).toHaveAttribute("href", "/survey/?problem=adoption");
  await expect(
    page
      .locator("article")
      .filter({ hasText: "회사 자료," })
      .getByRole("link", { name: /확인하기/ }),
  ).toHaveAttribute("href", "/survey/?problem=security");
});

test("keeps the brand and quick check CTA fixed while moving through the page", async ({
  page,
}) => {
  await page.goto("/");

  const header = page.getByRole("banner");
  const brand = header.getByRole("link", { name: /AgentProof/ });
  const cta = header.getByRole("link", { name: /무료 체크/ });
  await expect(brand).toBeVisible();
  await expect(cta).toBeVisible();

  const before = await header.boundingBox();
  expect(before?.y).toBe(0);

  await page.getByRole("link", { name: "대시보드 보기" }).click();
  await expect(page.locator("#product")).toBeInViewport();

  const afterAnchorMove = await header.boundingBox();
  expect(afterAnchorMove?.y).toBe(0);
  await expect(brand).toBeVisible();
  await expect(cta).toBeVisible();

  await page.mouse.wheel(0, 1500);
  const afterScroll = await header.boundingBox();
  expect(afterScroll?.y).toBe(0);
  await expect(brand).toBeVisible();
  await expect(cta).toBeVisible();
});

test("keeps mobile problem cards horizontal and uses the desktop dashboard image", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1200 });
  await page.goto("/");

  const problemGrid = page.locator("#problem").locator("[data-testid='problem-grid']");
  await expect(problemGrid).toBeVisible();
  const gridMetrics = await problemGrid.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    templateColumns: getComputedStyle(element).gridTemplateColumns,
    snapType: getComputedStyle(element).scrollSnapType,
    cardCount: element.querySelectorAll("article").length,
  }));

  expect(gridMetrics.cardCount).toBe(3);
  expect(gridMetrics.scrollWidth).toBeGreaterThan(gridMetrics.clientWidth);
  expect(gridMetrics.templateColumns.split(" ").length).toBe(3);
  expect(gridMetrics.snapType).toContain("x");

  const desktopDashboard = page.locator("#product").locator("[data-testid='desktop-dashboard']");
  await expect(desktopDashboard).toBeVisible();
  await expect(
    desktopDashboard.getByRole("img", {
      name: /AgentProof 업무용 AI 검증 대시보드 샘플/,
    }),
  ).toBeVisible();
  const dashboardMetrics = await desktopDashboard.locator("..").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dashboardMetrics.scrollWidth).toBeLessThanOrEqual(dashboardMetrics.clientWidth);
  await expect(
    page.locator("[aria-label='AgentProof 모바일 제품 화면 샘플']"),
  ).toHaveCount(0);
});
