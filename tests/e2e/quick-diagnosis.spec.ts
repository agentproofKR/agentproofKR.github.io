import { expect, test } from "@playwright/test";

const scenarioA = [
  "직접 쓰고 있어요",
  "고객 답변",
  "고객에게 보냅니다",
  "개인정보",
  "기준이 없습니다",
] as const;

const forbiddenVisiblePhrases = [
  "답변 보내기 전",
  "해볼 일",
  "걸리는 부분",
  "걸리는 표현",
  "AI에게 맡길 일",
  "AI 활용 진단",
  "업무용 AI",
  "AI 업무 실행 플랫폼",
  "사용 가능성 검증",
  "위험 체크 자동화",
  "사람 검토 기준",
  "수정 기록",
  "사용 여부",
  "AI 거버넌스",
  "정밀검증 리포트",
  "통제 진단",
  "고도화",
  "도입 가능성",
  "확장 여부",
  "안전 보장",
  "법률 검토 완료",
  "보안 인증 완료",
  "자동 승인",
  "무조건 사용 가능",
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
      name: /그대로 써도\s*괜찮을까요\?/,
    }),
  ).toBeVisible();
  await expect(page.getByText(/답변·문장·문서를 쓰기 전에\s*확인할 내용만 빠르게 보여드려요\./)).toBeVisible();
  await expect(page.getByText("1분 체크")).toBeVisible();
  await expect(page.getByText("어디에 쓰는지")).toBeVisible();
  await expect(page.getByText("무엇이 걱정되는지")).toBeVisible();
  await expect(page.getByText("마지막에 누가 보는지")).toBeVisible();
  await expect(page.getByText("회사명·이메일·고객정보는 묻지 않아요.")).toBeVisible();
  await expect(page.getByText("요즘은 ChatGPT")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "더 자세히 보고 싶다면" })).toHaveCount(0);
  await expect(page.getByText("3분 진단")).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "무료 체크" })).toBeVisible();
  await expect(page.getByRole("progressbar")).toBeVisible();
  await expect(page.locator("textarea")).toHaveCount(0);
  await expect(page.locator('input[type="email"], input[type="text"]')).toHaveCount(0);

  await page.getByRole("button", { name: "바로 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "어떤 입장인가요?" })).toBeVisible();
  await expect(page.getByText("내가 쓴 문장이 괜찮은지 보고 싶어요")).toBeVisible();
  await expect(page.getByText("입장 선택")).toHaveCount(0);
  const optionHeights = await page.locator("[data-quick-option]").evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
  );
  expect(Math.max(...optionHeights)).toBeLessThanOrEqual(78);

  for (const label of scenarioA) {
    await page.getByRole("button", { name: label }).click();
  }

  await expect(page.getByText("기준 필요")).toBeVisible();
  await expect(page.getByRole("heading", { name: "쓰기 전에 기준부터 정하는 게 좋겠어요." })).toBeVisible();
  await expect(page.getByText("34점")).toBeVisible();
  await expect(page.getByText("기준이 먼저 필요한 상태")).toBeVisible();
  await expect(page.getByText("먼저 확인할 내용")).toBeVisible();
  await expect(page.getByText("확인하면 좋은 부분")).toBeVisible();
  await expect(page.getByText("개인정보가 섞였는지")).toBeVisible();
  await expect(page.getByText("고객에게 보내기 전에 한 번 더 봤는지")).toBeVisible();
  await expect(page.getByText("사람마다 다르게 확인하고 있지 않은지")).toBeVisible();
  await expect(page.getByText("AgentProof에서 확인하면")).toBeVisible();
  await expect(page.getByText(/문장을 만들고,\s*쓰기 전에 볼 내용을 같이 확인할 수 있어요\./)).toBeVisible();
  await expect(page.getByText("어떻게 고쳤는지")).toBeVisible();
  await expect(page.getByText("사람이 확인했는지")).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 해보기" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "더 자세히 보고 싶다면" })).toBeVisible();

  const resultOrder = await page.locator("main").evaluate((node) => {
    const text = node.textContent ?? "";
    return {
      primaryCta: text.indexOf("고객 답변 확인하기"),
      valueSection: text.indexOf("AgentProof에서 확인하면"),
      advancedSection: text.indexOf("더 자세히 보고 싶다면"),
    };
  });
  expect(resultOrder.primaryCta).toBeGreaterThan(-1);
  expect(resultOrder.valueSection).toBeGreaterThan(resultOrder.primaryCta);
  expect(resultOrder.advancedSection).toBeGreaterThan(resultOrder.valueSection);

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("quick_diagnosis_complete");
  expect(eventText).toContain("human_quick_diagnosis");
  expect(eventText).not.toContain("email");
  expect(eventText).not.toContain("company");
  expect(eventText).not.toContain("memo");

  const visibleText = await page.locator("body").innerText();
  for (const phrase of forbiddenVisiblePhrases) {
    expect(visibleText).not.toContain(phrase);
  }

  await page.getByRole("link", { name: "고객 답변 확인하기" }).click();
  await expect(page).toHaveURL(/\/workspace\/\?job=customer_reply$/);
  await expect(
    page.getByRole("heading", {
      name: /고객 답변,\s*먼저 하나만 확인해보세요\./,
    }),
  ).toBeVisible();
  await expect(page.getByText("초안 만들기")).toBeVisible();
  await expect(page.getByText("빠르게 시작해요")).toBeVisible();
  await expect(page.getByText("쓰기 전 확인")).toBeVisible();
  await expect(page.getByText("볼 내용을 정리해요")).toBeVisible();
  await expect(page.getByText("기록 남기기")).toBeVisible();
  await expect(page.getByText("나중에 설명하기 쉽게")).toBeVisible();
  await expect(page.getByRole("link", { name: "파일럿 문의하기" })).toBeVisible();
  await expect(page.getByRole("link", { name: "무료 체크로 돌아가기" })).toBeVisible();

  const workspaceVisibleText = await page.locator("body").innerText();
  for (const phrase of forbiddenVisiblePhrases) {
    expect(workspaceVisibleText).not.toContain(phrase);
  }
});

test("quick diagnosis keeps detailed survey links below the result", async ({ page }) => {
  await page.goto("/survey/");
  await expect(page.getByRole("link", { name: "실무자 체크" })).toHaveCount(0);

  await page.getByRole("button", { name: "바로 확인하기" }).click();
  await expect(page.getByRole("heading", { name: "어떤 입장인가요?" })).toBeVisible();
  for (const label of scenarioA) {
    await page.getByRole("button", { name: label }).click();
  }

  await expect(page.getByText("간단 체크는 첫 문서와 답변을 고르는 입구입니다.")).toBeVisible();
  await expect(page.getByRole("link", { name: "실무자 체크" })).toHaveAttribute(
    "href",
    "/survey/practitioner/",
  );
  await expect(page.getByRole("link", { name: "대표·도입 담당자 체크" })).toHaveAttribute(
    "href",
    "/survey/leader/",
  );
  await expect(page.getByRole("link", { name: "보안·정책 담당자 체크" })).toHaveAttribute(
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
    await page.getByRole("button", { name: "바로 확인하기" }).click();
    await expect(page.getByRole("heading", { name: "어떤 입장인가요?" })).toBeVisible();
    const stepMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(stepMetrics.scrollWidth).toBeLessThanOrEqual(stepMetrics.clientWidth);
  });
}

test("workspace placeholder keeps every job CTA route useful", async ({ page }) => {
  const jobs = [
    ["customer_reply", "고객 답변"],
    ["grant_doc", "사업계획서 문장"],
    ["marketing_copy", "광고·홍보 문구"],
    ["internal_summary", "회의록 요약"],
    ["proposal_doc", "제안서 문장"],
  ] as const;

  for (const [job, title] of jobs) {
    await page.goto(`/workspace/?job=${job}`);
    await expect(
      page.getByRole("heading", { name: new RegExp(`${title},\\s*먼저 하나만 확인해보세요\\.`) }),
    ).toBeVisible();
    await expect(page.getByText("초안 만들기")).toBeVisible();
    await expect(page.getByText("쓰기 전 확인")).toBeVisible();
    await expect(page.getByText("기록 남기기")).toBeVisible();
  }
});
