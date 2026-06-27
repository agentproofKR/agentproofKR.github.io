import { expect, test } from "@playwright/test";

const routeChecks = [
  "/survey/",
  "/survey/?mode=reference",
  "/survey/practitioner/",
  "/survey/leader/",
  "/survey/security/",
  "/survey/result/",
] as const;

test("reference diagnosis follows the six-screen buyer flow without early contact fields", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.dataLayer = [];
  });

  await page.goto("/survey/?utm_source=linkedin&utm_campaign=reference_flow");

  await expect(
    page.getByRole("heading", {
      name: /AI,\s*업무에 써도 될까\?/,
    }),
  ).toBeVisible();
  await expect(page.getByText("무료 1분 체크")).toBeVisible();
  await expect(page.getByText("+ AI 도입 지원금")).toBeVisible();
  await expect(page.getByText("연락처 입력 없음")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("당신의 AI");
  await expect(page.locator("body")).not.toContainText("도입 전 · 무료 3초 진단");
  await expect(page.locator("body")).not.toContainText("받을 수 있는 AI 도입 지원금");
  await expect(page.locator("body")).not.toContainText("먼저 써볼 업무");
  await expect(page.locator("body")).not.toContainText("사람이 확인해야 할 부분");
  await expect(page.locator("body")).not.toContainText("진단 후 바로 확인할 수 있는 것");
  await expect(page.locator("body")).not.toContainText("결과 미리보기");
  await expect(
    page.locator('section[aria-labelledby="reference-title"] li'),
  ).toHaveCount(0);
  await expect(page.getByText("시작", { exact: true })).toBeVisible();
  await expect(page.getByTestId("reference-check-icon")).toBeVisible();
  await expect(page.locator('input[type="text"], input[type="tel"]')).toHaveCount(0);

  await page.getByRole("button", { name: "시작하기" }).click();
  await expect(
    page.getByRole("heading", { name: /어떤 업무에\s*AI를 써볼까요\?/ }),
  ).toBeVisible();
  const secondScreenLayout = await page.evaluate(() => {
    const header = document.querySelector("header")?.getBoundingClientRect();
    const card = document
      .querySelector('section[aria-labelledby="reference-title"]')
      ?.getBoundingClientRect();
    return {
      cardTop: Math.round(card?.top ?? 0),
      headerBottom: Math.round(header?.bottom ?? 0),
    };
  });
  expect(secondScreenLayout.cardTop).toBeGreaterThanOrEqual(
    secondScreenLayout.headerBottom,
  );
  await expect(page.getByText("업무마다 확인할 기준이 달라요")).toBeVisible();
  await expect(page.getByText("업무", { exact: true })).toBeVisible();
  await expect(page.locator("[data-reference-option]")).toHaveCount(5);
  await expect(page.getByRole("button", { name: /고객 문의 응대/ })).toBeVisible();
  await expect(page.getByText("답변·상담·CS")).toBeVisible();
  await expect(page.getByRole("button", { name: /사업계획서·지원사업/ })).toBeVisible();
  await expect(page.getByText("제출 문서·신청서")).toBeVisible();
  await expect(page.getByRole("button", { name: /보고서·문서 작성/ })).toBeVisible();
  await expect(page.getByText("기획서·내부 문서")).toBeVisible();
  await expect(page.getByRole("button", { name: /마케팅 콘텐츠/ })).toBeVisible();
  await expect(page.getByText("SNS·블로그·상세페이지")).toBeVisible();
  await expect(page.getByRole("button", { name: /아직 못 정했어요/ })).toBeVisible();
  await expect(page.getByText("추천을 받아볼게요")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("문서 자동 작성");
  await expect(page.locator("body")).not.toContainText("상품·콘텐츠 추천");
  await expect(page.locator("body")).not.toContainText("결제·환불 심사");
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();

  await page.getByRole("button", { name: /마케팅 콘텐츠/ }).click();
  await expect(page.getByRole("button", { name: /마케팅 콘텐츠/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "다음" })).toBeEnabled();
  const optionHeights = await page
    .locator("[data-reference-option]")
    .evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
    );
  expect(Math.max(...optionHeights)).toBeLessThanOrEqual(78);

  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByRole("heading", { name: "통제 상태 진단" })).toBeVisible();
  await expect(page.getByText("업무 · 마케팅 콘텐츠")).toBeVisible();
  await expect(page.getByText("자율성 범위")).toBeVisible();
  await expect(page.getByText("보통")).toBeVisible();
  await expect(page.getByText("AI 분석 중 · 평균 3초")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "AI 분석 진행률" })).toBeVisible();
  await expect(page.locator('input[type="text"], input[type="tel"]')).toHaveCount(0);

  await page.getByRole("switch", { name: "행동 로그 수집" }).click();
  await page.getByRole("switch", { name: "사람 검토(HITL)" }).click();
  await page.getByRole("switch", { name: "드리프트 감시" }).click();
  await page.getByRole("button", { name: "안심 점수 보기" }).click();

  await expect(page.getByRole("heading", { name: "안심 점수" })).toBeVisible();
  await expect(page.getByText("62 / 100")).toBeVisible();
  await expect(page.getByText("조건부 GO")).toBeVisible();
  await expect(page.getByText("가장 위험한 한 줄")).toBeVisible();
  await expect(page.getByText("과장 표현이 외부에 노출")).toBeVisible();
  await expect(page.getByText("일 누수")).toBeVisible();
  await expect(page.getByText("₩180만")).toBeVisible();
  await expect(page.getByText("지원금")).toBeVisible();
  await expect(page.getByText("~₩3,000만")).toBeVisible();

  await expect(page.getByText("먼저 시험해볼 업무")).toBeVisible();
  await expect(page.getByText("사람이 봐야 할 경우")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "추천 업무 체험하기", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "30일 업무 검증 문의하기", exact: true }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "30일 업무 검증 문의하기", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "30일 업무 검증 문의" })).toBeVisible();
  await expect(page.getByLabel("담당자 · 결재자")).toHaveAttribute(
    "placeholder",
    "김대표 · 구매 결정권자",
  );
  await expect(page.getByLabel("연락처")).toHaveAttribute("placeholder", "010--");
  await page.getByLabel("담당자 · 결재자").fill("김대표");
  await page.getByLabel("연락처").fill("010-1234-5678");
  await page.getByRole("button", { name: "1개월" }).click();
  await expect(page.getByText("30일 업무 검증 · 업무당")).toBeVisible();
  await expect(page.getByText("₩50–150만 / 건")).toBeVisible();

  await page.getByRole("button", { name: "문의 보내기" }).click();
  await expect(page.getByRole("heading", { name: "모니터링" })).toBeVisible();
  await expect(page.getByText("최근 8주 · 도입 후 상시 점검됨")).toBeVisible();
  await expect(page.getByTestId("reference-monitoring-chart")).toBeVisible();
  await expect(page.getByText("드리프트 감지")).toBeVisible();
  await expect(page.getByText("권장 대비 -6점 · 재진단 권장")).toBeVisible();
  await expect(page.getByText("재진단 예약됨 (D-2)")).toBeVisible();
  await expect(page.getByText("규제 체크 통과 (AI 기본법)")).toBeVisible();
  await expect(page.getByRole("button", { name: "리포트 공유" })).toBeVisible();

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("reference_flow");
  expect(eventText).toContain("quick_diagnosis_start");
  expect(eventText).toContain("quick_diagnosis_complete");
  expect(eventText).not.toContain("010-1234-5678");
  expect(eventText).not.toContain("김대표");
});

test("reference diagnosis prioritizes next-step actions over role-based links", async ({
  page,
}) => {
  await page.goto("/survey/");

  await expect(page.getByRole("heading", { name: "다음 단계" })).toBeVisible();
  await expect(page.getByText("진단 결과에 맞는 업무를 1회 써봅니다.")).toBeVisible();
  await expect(
    page.getByText("실제 사용 기록으로 도입 여부를 판단합니다."),
  ).toBeVisible();
  await expect(
    page.getByText("직원들이 어디까지 AI를 써도 되는지 기준을 확인합니다."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /추천 업무 체험하기/ })).toHaveAttribute(
    "href",
    "/workspace/?job=customer_reply",
  );
  await expect(page.getByRole("button", { name: /30일 업무 검증 문의하기/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /AI 사용 기준 샘플 보기/ })).toHaveAttribute(
    "href",
    "#ai-policy-sample",
  );

  await expect(page.getByText("기존 역할별 진단 보기")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "역할별 진단" })).toHaveCount(0);
  await expect(page.getByText("역할별로 더 자세히 보고 싶다면")).toBeVisible();
  await expect(page.getByRole("link", { name: "실무자", exact: true })).toHaveAttribute(
    "href",
    "/survey/practitioner/",
  );
  await expect(
    page.getByRole("link", { name: "대표·도입 담당자", exact: true }),
  ).toHaveAttribute(
    "href",
    "/survey/leader/",
  );
  await expect(
    page.getByRole("link", { name: "보안·정책 담당자", exact: true }),
  ).toHaveAttribute(
    "href",
    "/survey/security/",
  );
});

for (const width of [360, 375, 390, 430]) {
  test(`reference diagnosis has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/survey/");

    for (const action of [
      async () => undefined,
      async () => page.getByRole("button", { name: "시작하기" }).click(),
      async () => {
        await page.getByRole("button", { name: /마케팅 콘텐츠/ }).click();
        await page.getByRole("button", { name: "다음" }).click();
      },
      async () => page.getByRole("button", { name: "안심 점수 보기" }).click(),
    ]) {
      await action();
      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    }
  });
}

test("reference and preserved survey routes return successfully", async ({ page }) => {
  for (const route of routeChecks) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
  }
});
