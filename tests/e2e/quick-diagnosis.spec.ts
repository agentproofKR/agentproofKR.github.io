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
    page.getByRole("heading", { name: /당신의 AI,\s*믿어도 되나요\?/ }),
  ).toBeVisible();
  await expect(page.getByText("도입 전 · 무료 3초 진단")).toBeVisible();
  await expect(page.getByText("+ 받을 수 있는 지원금")).toBeVisible();
  await expect(page.getByText("시작", { exact: true })).toBeVisible();
  await expect(page.getByTestId("reference-check-icon")).toBeVisible();
  await expect(page.locator('input[type="text"], input[type="tel"]')).toHaveCount(0);

  await page.getByRole("button", { name: "무료 진단 시작" }).click();
  await expect(
    page.getByRole("heading", { name: /어떤 업무에\s*AI를 도입하나요\?/ }),
  ).toBeVisible();
  await expect(page.getByText("업무", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "고객 문의 응대" })).toBeVisible();
  await expect(page.getByRole("button", { name: "문서 자동 작성" })).toBeVisible();
  await expect(page.getByRole("button", { name: "상품·콘텐츠 추천" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결제·환불 심사" })).toBeVisible();

  await page.getByRole("button", { name: "상품·콘텐츠 추천" }).click();
  await expect(page.getByRole("button", { name: "상품·콘텐츠 추천" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const optionHeights = await page
    .locator("[data-reference-option]")
    .evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
    );
  expect(Math.max(...optionHeights)).toBeLessThanOrEqual(64);

  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByRole("heading", { name: "통제 상태 진단" })).toBeVisible();
  await expect(page.getByText("업무 · 상품·콘텐츠 추천")).toBeVisible();
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
  await expect(page.getByText("64 / 100")).toBeVisible();
  await expect(page.getByText("조건부 GO")).toBeVisible();
  await expect(page.getByText("가장 위험한 한 줄")).toBeVisible();
  await expect(page.getByText("행동 로그 없이 추천 기준 변경")).toBeVisible();
  await expect(page.getByText("일 누수")).toBeVisible();
  await expect(page.getByText("₩180만")).toBeVisible();
  await expect(page.getByText("지원금")).toBeVisible();
  await expect(page.getByText("~₩3,000만")).toBeVisible();

  await page.getByRole("button", { name: "정밀 검증 신청" }).click();
  await expect(page.getByRole("heading", { name: "정밀 검증 신청" })).toBeVisible();
  await expect(page.getByLabel("담당자 · 결재자")).toHaveAttribute(
    "placeholder",
    "김대표 · 구매 결정권자",
  );
  await expect(page.getByLabel("연락처")).toHaveAttribute("placeholder", "010--");
  await page.getByLabel("담당자 · 결재자").fill("김대표");
  await page.getByLabel("연락처").fill("010-1234-5678");
  await page.getByRole("button", { name: "1개월" }).click();
  await expect(page.getByText("정밀 검증 · 업무당")).toBeVisible();
  await expect(page.getByText("₩50–150만 / 건")).toBeVisible();

  await page.getByRole("button", { name: "신청 보내기" }).click();
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

test("reference diagnosis keeps detailed survey links secondary below the phone", async ({
  page,
}) => {
  await page.goto("/survey/");

  const advanced = page.getByRole("link", { name: "기존 역할별 진단 보기" });
  await expect(advanced).toBeVisible();
  await expect(advanced).toHaveAttribute("href", "#legacy-surveys");
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
  test(`reference diagnosis has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/survey/");

    for (const action of [
      async () => undefined,
      async () => page.getByRole("button", { name: "무료 진단 시작" }).click(),
      async () => {
        await page.getByRole("button", { name: "결제·환불 심사" }).click();
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
