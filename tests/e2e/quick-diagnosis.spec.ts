import { expect, test } from "@playwright/test";

const scenarioA = [
  "직접 AI를 쓰고 있어요",
  "고객 문의 답변",
  "고객",
  "개인정보",
  "기준이 없어요",
] as const;

test("quick diagnosis completes without PII and routes to the selected workspace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.dataLayer = [];
  });

  await page.goto(
    "/survey/?utm_source=linkedin&utm_campaign=human_quick_diagnosis",
  );

  await expect(
    page.getByRole("heading", {
      name: /AI로 만든 답변,\s*바로 보내도 될까요\?/,
    }),
  ).toBeVisible();
  await expect(page.getByText("3분만 체크하고 먼저 맡길 일을 찾아보세요.")).toBeVisible();
  await expect(page.getByText("회사명·이메일·고객정보 입력 없음")).toBeVisible();
  await expect(page.getByText("요즘은 ChatGPT")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "더 자세히 보고 싶다면" })).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(page.locator('input[type="email"], input[type="text"]')).toHaveCount(0);

  await page.getByRole("button", { name: "시작하기" }).click();
  for (const label of scenarioA) {
    await page.getByRole("button", { name: label }).click();
  }

  await expect(page.getByRole("heading", { name: "기준을 먼저 잡는 게 좋아 보여요." })).toBeVisible();
  await expect(page.getByText("34점")).toBeVisible();
  await expect(page.getByText("개인정보가 섞일 수 있어요")).toBeVisible();
  await expect(page.getByText("고객에게 보내기 전 확인이 필요해요")).toBeVisible();
  await expect(page.getByText("확인 방식이 사람마다 달라질 수 있어요")).toBeVisible();
  await expect(page.getByRole("heading", { name: "더 자세히 보고 싶다면" })).toBeVisible();

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("quick_diagnosis_complete");
  expect(eventText).toContain("human_quick_diagnosis");
  expect(eventText).not.toContain("email");
  expect(eventText).not.toContain("company");
  expect(eventText).not.toContain("memo");

  await page.getByRole("link", { name: "고객답변 1건 체험하기" }).click();
  await expect(page).toHaveURL(/\/workspace\/\?job=customer_reply$/);
  await expect(
    page.getByRole("heading", {
      name: "선택한 일부터 작게 써볼 수 있게 준비 중입니다.",
    }),
  ).toBeVisible();
  await expect(page.getByText("선택한 일: 고객 문의 답변")).toBeVisible();
  await expect(page.getByText("보내기 전 확인할 부분 보기")).toHaveCount(0);
});

test("quick diagnosis keeps detailed survey links below the result", async ({ page }) => {
  await page.goto("/survey/");
  await expect(page.getByRole("link", { name: "실무자 진단" })).toHaveCount(0);

  await page.getByRole("button", { name: "시작하기" }).click();
  for (const label of scenarioA) {
    await page.getByRole("button", { name: label }).click();
  }

  await expect(page.getByRole("link", { name: "실무자 진단" })).toHaveAttribute(
    "href",
    "/survey/practitioner/",
  );
  await expect(page.getByRole("link", { name: "대표·도입 담당자 진단" })).toHaveAttribute(
    "href",
    "/survey/leader/",
  );
  await expect(page.getByRole("link", { name: "보안·정책 담당자 진단" })).toHaveAttribute(
    "href",
    "/survey/security/",
  );
});

for (const width of [360, 375, 390, 430]) {
  test(`quick diagnosis has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/survey/");

    const introMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(introMetrics.scrollWidth).toBeLessThanOrEqual(introMetrics.clientWidth);
    await page.getByRole("button", { name: "시작하기" }).click();
    const stepMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(stepMetrics.scrollWidth).toBeLessThanOrEqual(stepMetrics.clientWidth);
  });
}
