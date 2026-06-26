import { expect, test } from "@playwright/test";

const scenarioA = [
  "직접 쓰고 있어요",
  "고객 문의 답변",
  "고객에게 보냅니다",
  "개인정보",
  "기준이 없습니다",
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
  await expect(page.getByText(/3분이면 먼저 맡길 일과\s*조심할 점이 나옵니다\./)).toBeVisible();
  await expect(page.getByText("오늘 확인할 것")).toBeVisible();
  await expect(page.getByText("먼저 해볼 일")).toBeVisible();
  await expect(page.getByText("조심할 표현")).toBeVisible();
  await expect(page.getByText("마지막 확인 방식")).toBeVisible();
  await expect(page.getByText("회사명·이메일·고객정보 입력 없음")).toBeVisible();
  await expect(page.getByText("요즘은 ChatGPT")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "더 자세히 보고 싶다면" })).toHaveCount(0);
  await expect(page.getByText("3분 진단")).toHaveCount(0);
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(page.locator('input[type="email"], input[type="text"]')).toHaveCount(0);

  await page.getByRole("button", { name: "시작하기" }).click();
  await expect(page.getByRole("heading", { name: "지금 상황은?" })).toBeVisible();
  await expect(page.getByText("내가 만든 답변이 괜찮은지 보고 싶어요")).toBeVisible();
  await expect(page.getByText("입장 선택")).toHaveCount(0);
  const optionHeights = await page.locator("[data-quick-option]").evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
  );
  expect(Math.max(...optionHeights)).toBeLessThanOrEqual(86);

  for (const label of scenarioA) {
    await page.getByRole("button", { name: label }).click();
  }

  await expect(page.getByText("기준 먼저")).toBeVisible();
  await expect(page.getByRole("heading", { name: "쓰기 전에 기준부터 잡는 게 좋습니다." })).toBeVisible();
  await expect(page.getByText("34점")).toBeVisible();
  await expect(page.getByText("기준 정리가 먼저 필요한 상태")).toBeVisible();
  await expect(page.getByText("개인정보가 섞일 수 있어요")).toBeVisible();
  await expect(page.getByText("고객에게 보내기 전 확인이 필요해요")).toBeVisible();
  await expect(page.getByText("확인 방식이 사람마다 달라질 수 있어요")).toBeVisible();
  await expect(page.getByText("AgentProof에서 시작하면")).toBeVisible();
  await expect(page.getByText("답변 만들기와 보내기 전 확인을 같이 할 수 있습니다.")).toBeVisible();
  await expect(page.getByText("어떻게 고쳤는지")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 해보기" })).toBeVisible();
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
      name: /선택한 일부터\s*작게 써볼 수 있게 준비 중입니다\./,
    }),
  ).toBeVisible();
  await expect(page.getByText("선택한 일", { exact: true })).toBeVisible();
  await expect(page.getByText("고객 문의 답변")).toBeVisible();
  await expect(page.getByText("실제로 썼는지 남기기")).toBeVisible();
  await expect(page.getByText("보내기 전 확인할 부분 보기")).toHaveCount(0);
});

test("quick diagnosis keeps detailed survey links below the result", async ({ page }) => {
  await page.goto("/survey/");
  await expect(page.getByRole("link", { name: "실무자 진단" })).toHaveCount(0);

  await page.getByRole("button", { name: "시작하기" }).click();
  await expect(page.getByRole("heading", { name: "지금 상황은?" })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "지금 상황은?" })).toBeVisible();
    const stepMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(stepMetrics.scrollWidth).toBeLessThanOrEqual(stepMetrics.clientWidth);
  });
}

test("workspace placeholder keeps every job CTA route useful", async ({ page }) => {
  const jobs = [
    ["customer_reply", "고객 문의 답변"],
    ["grant_doc", "사업계획서 문장"],
    ["marketing_copy", "마케팅 문구"],
    ["internal_summary", "회의록 요약"],
    ["proposal_doc", "제안서 문장"],
  ] as const;

  for (const [job, title] of jobs) {
    await page.goto(`/workspace/?job=${job}`);
    await expect(page.getByRole("heading", { name: /선택한 일부터/ })).toBeVisible();
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByText("AI 초안 만들기")).toBeVisible();
    await expect(page.getByText("보내기 전 확인하기")).toBeVisible();
    await expect(page.getByText("더 나은 표현으로 고치기")).toBeVisible();
    await expect(page.getByText("실제로 썼는지 남기기")).toBeVisible();
  }
});
