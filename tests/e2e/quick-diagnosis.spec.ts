import { expect, test } from "@playwright/test";

const scenarioA = [
  "제가 직접 AI로 일을 해보고 있어요",
  "고객 문의 답변",
  "고객에게 보낼 수 있어요",
  "개인정보나 고객정보가 들어갈까 봐 걱정돼요",
  "정해진 기준이 없어요",
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
      name: /AI로 만든 답변,\s*그냥 보내도 될까요\?/,
    }),
  ).toBeVisible();
  await expect(page.getByText("회사명, 이메일, 고객정보는 입력하지 않습니다.")).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(page.locator('input[type="email"], input[type="text"]')).toHaveCount(0);

  await page.getByRole("button", { name: "3분 진단 시작하기" }).click();
  for (const label of scenarioA) {
    await page.getByRole("button", { name: label }).click();
  }

  await expect(page.getByRole("heading", { name: /기준부터 잡아도 됩니다/ })).toBeVisible();
  await expect(page.getByText("34점")).toBeVisible();
  await expect(page.getByText("개인정보나 고객정보가 섞일 수 있습니다.")).toBeVisible();
  await expect(page.getByText("고객에게 보내기 전 확인 기준이 필요합니다.")).toBeVisible();
  await expect(page.getByText("사람마다 확인 방식이 달라질 수 있습니다.")).toBeVisible();
  await expect(page.getByText("오늘 바로 쓸 때, 어떤 문장을 조심해야 하는지")).toBeVisible();

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
      name: "선택한 업무부터 작게 써볼 수 있게 준비 중입니다.",
    }),
  ).toBeVisible();
  await expect(page.getByText("선택한 업무: 고객 문의 답변")).toBeVisible();
});

test("quick diagnosis keeps detailed survey links available", async ({ page }) => {
  await page.goto("/survey/");

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

    await page.getByRole("button", { name: "3분 진단 시작하기" }).click();
    const stepMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(stepMetrics.scrollWidth).toBeLessThanOrEqual(stepMetrics.clientWidth);
  });
}
