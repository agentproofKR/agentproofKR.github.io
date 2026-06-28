import { expect, test, type Page } from "@playwright/test";

const routeChecks = [
  "/survey/",
  "/survey/?mode=reference",
  "/survey/practitioner/",
  "/survey/leader/",
  "/survey/security/",
  "/survey/result/",
] as const;

test("quick diagnosis collects five anonymous inputs and shows numeric mini report", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    window.dataLayer = [];
  });

  await page.goto("/survey/?utm_source=linkedin&utm_campaign=adoption_report");

  await expect(
    page.getByRole("heading", { name: /AI,\s*업무에 써도 될까\?/ }),
  ).toBeVisible();
  await expect(page.getByText("무료 1분 체크")).toBeVisible();
  await expect(page.getByText("+ AI 도입 지원금")).toBeVisible();
  await expect(page.getByText("연락처 입력 없음")).toBeVisible();
  await expect(page.locator('input[type="text"], input[type="tel"]')).toHaveCount(0);

  await completeFlow(page, {
    work: /마케팅 콘텐츠/,
    monthlyVolume: /50건 이상/,
    timePerCase: /1시간 이상/,
    adoptionScope: /일부 자동화/,
    exposure: /고객·기관에 나갑니다/,
  });

  await expect(
    page.getByRole("heading", { name: /마케팅 콘텐츠부터\s*시작해보세요/ }),
  ).toBeVisible();
  await expect(
    page.getByText("외부로 나가는 결과물이므로 사람 확인 기준이 필요합니다."),
  ).toBeVisible();
  await expect(page.getByText("기대효과")).toBeVisible();
  await expect(
    page.getByText("입력한 업무량 기준으로 월 10~81시간 절감 여지를 확인합니다."),
  ).toBeVisible();
  await expect(page.getByText("AI 도입 점수")).toBeVisible();
  await expect(page.getByText("38점")).toBeVisible();
  await expect(page.getByText("예상 절감률")).toBeVisible();
  await expect(page.getByText("20~45%")).toBeVisible();
  await expect(page.getByText("월 절감 금액")).toBeVisible();
  await expect(page.getByText("30만~243만원")).toBeVisible();
  await expect(page.getByText("지원사업 검토 평균")).toBeVisible();
  await expect(page.getByText("별도 산정")).toBeVisible();
  await expect(page.getByText("도입 범위 확인 필요")).toBeVisible();
  await expect(page.getByText("권장 방식")).toBeVisible();
  await expect(
    page.getByText("정해진 기준 안에서 일부 반복 업무만 자동화하세요."),
  ).toBeVisible();
  await expect(page.getByText("사람이 봐야 하는 경우")).toBeVisible();
  await expect(page.getByText("과장 표현")).toBeVisible();
  await expect(page.getByText("가격·효과")).toBeVisible();
  await expect(page.getByText("고객 오해", { exact: true })).toBeVisible();
  await expect(page.getByText("30일 파일럿에서 볼 것")).toBeVisible();
  await expect(page.getByText("콘텐츠 10건 기준")).toBeVisible();
  await expect(page.getByText("표현 수정 비율")).toBeVisible();
  await expect(page.getByText("최종 결과물 만족도")).toBeVisible();
  await expect(page.getByText("고객 오해 가능성")).toBeVisible();
  await expect(page.getByText("지원사업 준비에 활용")).toBeVisible();
  await expect(
    page.getByText("AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다."),
  ).toBeVisible();
  await expect(
    page.getByText("익명 결과는 서비스 개선을 위해 저장될 수 있습니다."),
  ).toBeVisible();

  await expect(page.locator("body")).not.toContainText("안심 점수");
  await expect(page.locator("body")).not.toContainText("통제 진단");
  await expect(page.locator("body")).not.toContainText("자율성");
  await expect(page.locator("body")).not.toContainText("행동 로그");
  await expect(page.locator("body")).not.toContainText("드리프트");
  await expect(page.locator("body")).not.toContainText("HITL");
  await expect(page.locator("body")).not.toContainText("지원금 보장");
  await expect(page.locator("body")).not.toContainText("지원금 확정");
  await expect(page.locator("body")).not.toContainText("지원금 수령 가능");
  await expect(page.locator("body")).not.toContainText("받을 수 있는 금액");
  await expect(page.locator("body")).not.toContainText("정부지원금 확정");
  await expect(page.locator("body")).not.toContainText("최대 지원금");
  await expect(page.locator("body")).not.toContainText("정밀검증 신청");
  await expect(page.locator("body")).not.toContainText("AI 체험하기");

  await expect(page.getByRole("link", { name: "30일 파일럿 설계 받기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 저장하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 복사하기" })).toBeVisible();

  await page.getByRole("button", { name: "결과 저장하기" }).click();
  await expect(page.getByRole("status")).toHaveText("결과를 저장했습니다");
  await expect(
    page.evaluate(() => sessionStorage.getItem("agentproof-quick-diagnosis-result")),
  ).resolves.toContain("추천 업무: 마케팅 콘텐츠");

  await page.getByRole("button", { name: "결과 복사하기" }).click();
  await expect(page.getByRole("status")).toHaveText("결과를 복사했습니다");
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toContain(
    "AgentProof AI 도입 간단 점검 결과",
  );

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("adoption_mini_report");
  expect(eventText).toContain("quick_diagnosis_start");
  expect(eventText).toContain("quick_diagnosis_complete");
});

test("copy still shows a toast when the Clipboard API is unavailable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/survey/");
  await completeFlow(page, {
    work: /고객 문의 응대/,
    monthlyVolume: /10건 이하/,
    timePerCase: /10분 이하/,
    adoptionScope: /확인 후 사용/,
    exposure: /내부에서만 봅니다/,
  });
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });

  await page.getByRole("button", { name: "결과 복사하기" }).click();

  await expect(page.getByRole("status")).toHaveText("결과를 복사했습니다");
});

test("final input combinations personalize result content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const cases = [
    {
      choices: {
        work: /고객 문의 응대/,
        monthlyVolume: /10건 이하/,
        timePerCase: /10분 이하/,
        adoptionScope: /확인 후 사용/,
        exposure: /내부에서만 봅니다/,
      },
      heading: /고객 문의 응대부터\s*시작해보세요/,
      score: "75점",
      supportAverage: "약 340만원",
      supportRange: "검토 범위 120만~560만원",
      method: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
      review: ["개인정보", "환불·계약", "고객 불만"],
      pilot: ["실제 절감 시간", "처리한 문의 수", "사람이 고친 답변"],
      pilotSize: "문의 20건 기준",
    },
    {
      choices: {
        work: /사업계획서·지원사업/,
        monthlyVolume: /10~50건/,
        timePerCase: /30분 안팎/,
        adoptionScope: /초안까지 만들기/,
        exposure: /고객·기관에 나갑니다/,
      },
      heading: /사업계획서 작성부터\s*시작해보세요/,
      score: "51점",
      supportAverage: "약 860만원",
      supportRange: "검토 범위 320만~1,400만원",
      method: "AI는 초안 작성까지 사용하고, 담당자가 수정하세요.",
      review: ["성과 수치", "근거 문장", "제출 전 최종 검토"],
      pilot: ["초안 작성 시간", "근거 확인 항목", "최종 제출 가능 비율"],
      pilotSize: "문서 3~5건 기준",
    },
    {
      choices: {
        work: /아직 못 정했어요/,
        monthlyVolume: /잘 모르겠어요/,
        timePerCase: /잘 모르겠어요/,
        adoptionScope: /아직 모르겠습니다/,
        exposure: /아직 정하지 않았습니다/,
      },
      heading: /부담이 낮은 업무부터\s*정해보세요/,
      score: "57점",
      supportAverage: "약 340만원",
      supportRange: "검토 범위 120만~560만원",
      method: "먼저 작은 업무 1개에서 초안 작성부터 시작하세요.",
      review: ["개인정보", "외부 전달", "금액·계약"],
      pilot: ["효과가 큰 업무", "위험이 낮은 업무", "계속 쓸 수 있는 업무"],
      pilotSize: "작은 업무 1개 기준",
    },
  ] as const;

  for (const item of cases) {
    await page.goto("/survey/");
    await completeFlow(page, item.choices);

    await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    await expect(page.getByText(item.score)).toBeVisible();
    await expect(page.getByText(item.supportAverage)).toBeVisible();
    await expect(page.getByText(item.supportRange)).toBeVisible();
    await expect(page.getByText(item.method)).toBeVisible();
    for (const reviewPoint of item.review) {
      await expect(page.getByText(reviewPoint)).toBeVisible();
    }
    await expect(page.getByText(item.pilotSize)).toBeVisible();
    for (const pilotItem of item.pilot) {
      await expect(page.getByText(pilotItem, { exact: true })).toBeVisible();
    }
  }
});

for (const width of [320, 360, 375, 390, 430]) {
  test(`quick diagnosis has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/survey/");

    const actions = [
      async () => undefined,
      async () => page.getByRole("button", { name: "시작하기" }).click(),
      async () => {
        await page.getByRole("button", { name: /마케팅 콘텐츠/ }).click();
        await page.getByRole("button", { name: "다음" }).click();
      },
      async () => {
        await page.getByRole("button", { name: /50건 이상/ }).click();
        await page.getByRole("button", { name: "다음" }).click();
      },
      async () => {
        await page.getByRole("button", { name: /1시간 이상/ }).click();
        await page.getByRole("button", { name: "다음" }).click();
      },
      async () => {
        await page.getByRole("button", { name: /일부 자동화/ }).click();
        await page.getByRole("button", { name: "다음" }).click();
      },
      async () => {
        await page.getByRole("button", { name: /고객·기관에 나갑니다/ }).click();
        await page.getByRole("button", { name: "결과 보기" }).click();
      },
    ];

    for (const action of actions) {
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

async function completeFlow(
  page: Page,
  choices: {
    work: RegExp;
    monthlyVolume: RegExp;
    timePerCase: RegExp;
    adoptionScope: RegExp;
    exposure: RegExp;
  },
) {
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByRole("button", { name: choices.work }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: choices.monthlyVolume }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: choices.timePerCase }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: choices.adoptionScope }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: choices.exposure }).click();
  await page.getByRole("button", { name: "결과 보기" }).click();
}
