import { expect, test } from "@playwright/test";

const routeChecks = [
  "/survey/",
  "/survey/?mode=reference",
  "/survey/practitioner/",
  "/survey/leader/",
  "/survey/security/",
  "/survey/result/",
] as const;

test("survey flow collects work, purpose, nature, scope and shows a mini adoption report", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    window.dataLayer = [];
  });

  await page.goto("/survey/?utm_source=linkedin&utm_campaign=adoption_report");

  await expect(
    page.getByRole("heading", {
      name: /AI,\s*업무에 써도 될까\?/,
    }),
  ).toBeVisible();
  await expect(page.getByText("무료 1분 체크")).toBeVisible();
  await expect(page.getByText("+ AI 도입 지원금")).toBeVisible();
  await expect(page.getByText("연락처 입력 없음")).toBeVisible();
  await expect(page.locator('input[type="text"], input[type="tel"]')).toHaveCount(0);

  await page.getByRole("button", { name: "시작하기" }).click();
  await expect(
    page.getByRole("heading", { name: /어떤 업무에\s*AI를 쓸까요\?/ }),
  ).toBeVisible();
  await expect(page.getByText("가장 먼저 확인할 업무를 골라주세요.")).toBeVisible();
  await expect(page.locator("[data-reference-option]")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();
  await page.getByRole("button", { name: /고객 문의 응대/ }).click();
  await expect(page.getByRole("button", { name: "다음" })).toBeEnabled();

  await page.getByRole("button", { name: "다음" }).click();
  await expect(
    page.getByRole("heading", { name: /AI로 무엇을\s*얻고 싶나요\?/ }),
  ).toBeVisible();
  await expect(page.getByText("가장 가까운 이유를 골라주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();
  await page.getByRole("button", { name: /시간을 줄이고 싶어요/ }).click();
  await expect(page.getByRole("button", { name: "다음" })).toBeEnabled();

  await page.getByRole("button", { name: "다음" }).click();
  await expect(
    page.getByRole("heading", { name: /이 업무는\s*어떤 성격인가요\?/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();
  await page.getByRole("button", { name: /자주 반복됩니다/ }).click();
  await expect(page.getByRole("button", { name: "다음" })).toBeEnabled();

  await page.getByRole("button", { name: "다음" }).click();
  await expect(
    page.getByRole("heading", { name: /AI에게 어디까지\s*맡길까요\?/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 보기" })).toBeDisabled();
  await page.getByRole("button", { name: /확인 후 사용/ }).click();
  await expect(page.getByRole("button", { name: "결과 보기" })).toBeEnabled();

  await page.getByRole("button", { name: "결과 보기" }).click();
  await expect(
    page.getByRole("heading", { name: /고객 문의 응대부터\s*시작해보세요/ }),
  ).toBeVisible();
  await expect(
    page.getByText("반복성이 있어 작은 파일럿으로 효과를 보기 좋습니다."),
  ).toBeVisible();
  await expect(page.getByText("기대효과")).toBeVisible();
  await expect(page.getByText("반복 업무 시간을 줄이는 데 초점을 둡니다.")).toBeVisible();
  await expect(page.getByText("AI 도입 점수")).toBeVisible();
  await expect(page.getByText("예상 절감률")).toBeVisible();
  await expect(page.getByText("20~45%")).toBeVisible();
  await expect(page.getByText("예상 절감 시간")).toBeVisible();
  await expect(page.getByText("월 4~12시간")).toBeVisible();
  await expect(page.getByText("월 절감 금액")).toBeVisible();
  await expect(page.getByText("12~36만원")).toBeVisible();
  await expect(page.getByText("지원사업 검토 평균")).toBeVisible();
  await expect(page.getByText("약 860만원")).toBeVisible();
  await expect(page.getByText("검토 범위 320만~1,400만원")).toBeVisible();
  await expect(page.getByText("예상 수치입니다. 지원사업은 공고와 기업 요건에 따라 달라집니다.")).toBeVisible();
  await expect(page.getByText("권장 방식")).toBeVisible();
  await expect(page.getByText("AI 결과를 담당자가 확인한 뒤 사용하세요.")).toBeVisible();
  await expect(page.getByText("사람이 봐야 하는 경우")).toBeVisible();
  await expect(page.getByText("개인정보")).toBeVisible();
  await expect(page.getByText("환불·계약")).toBeVisible();
  await expect(page.getByText("고객 불만")).toBeVisible();
  await expect(page.getByText("30일 파일럿에서 볼 것")).toBeVisible();
  await expect(page.getByText("문의 20건 기준")).toBeVisible();
  await expect(page.getByText("실제 절감 시간")).toBeVisible();
  await expect(page.getByText("반복 처리 건수")).toBeVisible();
  await expect(page.getByText("수정이 필요한 결과 비율")).toBeVisible();
  await expect(page.getByText("지원사업 준비에 활용")).toBeVisible();
  await expect(
    page.getByText("AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다."),
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
  await expect(page.locator("body")).not.toContainText("최대 2억 원");
  await expect(page.locator("body")).not.toContainText("정부지원금 확정");
  await expect(page.locator("body")).not.toContainText("최대 지원금");
  await expect(page.locator("body")).not.toContainText("지원금 수령 가능");
  await expect(page.locator("body")).not.toContainText("추천 업무 체험 준비 중");
  await expect(page.locator("body")).not.toContainText("정밀검증 신청");
  await expect(page.locator("body")).not.toContainText("AI 체험하기");
  await expect(page.getByRole("link", { name: "30일 파일럿 설계 받기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 저장하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 복사하기" })).toBeVisible();

  await page.getByRole("button", { name: "결과 저장하기" }).click();
  await expect(page.getByRole("status")).toHaveText("결과를 저장했습니다");
  await expect(
    page.evaluate(() => sessionStorage.getItem("agentproof-quick-diagnosis-result")),
  ).resolves.toContain("추천 업무: 고객 문의 응대");

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
    purpose: /시간을 줄이고 싶어요/,
    nature: /자주 반복됩니다/,
    scope: /확인 후 사용/,
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

test("five QA scenarios personalize the result content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const cases = [
    {
      choices: {
        work: /고객 문의 응대/,
        purpose: /시간을 줄이고 싶어요/,
        nature: /자주 반복됩니다/,
        scope: /확인 후 사용/,
      },
      heading: /고객 문의 응대부터\s*시작해보세요/,
      expectedValue: "반복 업무 시간을 줄이는 데 초점을 둡니다.",
      supportAverage: "약 860만원",
      supportRange: "검토 범위 320만~1,400만원",
      method: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
      review: ["개인정보", "환불·계약", "고객 불만"],
      pilot: ["실제 절감 시간", "반복 처리 건수", "수정이 필요한 결과 비율"],
      pilotSize: "문의 20건 기준",
    },
    {
      choices: {
        work: /사업계획서·지원사업/,
        purpose: /초안을 빨리 만들고 싶어요/,
        nature: /가끔이지만 중요합니다/,
        scope: /초안까지 만들기/,
      },
      heading: /사업계획서 작성부터\s*시작해보세요/,
      expectedValue: "첫 초안을 빠르게 만들고 시작 부담을 줄입니다.",
      supportAverage: "약 860만원",
      supportRange: "검토 범위 320만~1,400만원",
      method: "AI는 초안 작성까지 사용하고, 담당자가 수정하세요.",
      review: ["성과 수치", "근거 문장", "제출 전 최종 검토"],
      pilot: ["초안 작성 시간", "수정이 필요한 문장 비율", "최종 사용 가능 비율"],
      pilotSize: "문서 3~5건 기준",
    },
    {
      choices: {
        work: /보고서·문서 작성/,
        purpose: /빠뜨린 걸 줄이고 싶어요/,
        nature: /내부 판단에 씁니다/,
        scope: /확인 후 사용/,
      },
      heading: /보고서·문서 작성부터\s*시작해보세요/,
      expectedValue: "누락과 실수를 줄이는 기준을 만들 수 있습니다.",
      supportAverage: "약 860만원",
      supportRange: "검토 범위 320만~1,400만원",
      method: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
      review: ["수치 근거", "외부 공유", "예산·계약 문장"],
      pilot: ["누락된 항목 수", "사람이 고친 부분", "확인이 필요한 유형"],
      pilotSize: "문서 5건 기준",
    },
    {
      choices: {
        work: /마케팅 콘텐츠/,
        purpose: /결과물을 더 좋게 만들고 싶어요/,
        nature: /고객이나 기관에 나갑니다/,
        scope: /초안까지 만들기/,
      },
      heading: /마케팅 콘텐츠부터\s*시작해보세요/,
      expectedValue: "문장·구성·표현을 다듬는 데 도움이 됩니다.",
      supportAverage: "약 2,150만원",
      supportRange: "검토 범위 800만~3,500만원",
      method: "AI는 초안 작성까지 사용하고, 담당자가 수정하세요.",
      review: ["과장 표현", "가격·효과", "고객 오해"],
      pilot: ["표현 수정 비율", "최종 결과물 만족도", "다시 사용할 수 있는 문장 유형"],
      pilotSize: "콘텐츠 10건 기준",
    },
    {
      choices: {
        work: /아직 못 정했어요/,
        purpose: /어디에 쓰면 좋을지 알고 싶어요/,
        nature: /아직 잘 모르겠습니다/,
        scope: /아직 모르겠습니다/,
      },
      heading: /부담이 낮은 업무부터\s*정해보세요/,
      expectedValue: "어디부터 시작할지 정하는 데 도움이 됩니다.",
      supportAverage: "약 340만원",
      supportRange: "검토 범위 120만~560만원",
      method: "먼저 작은 업무 1개에서 초안 작성부터 시작하세요.",
      review: ["개인정보", "외부 전달", "금액·계약"],
      pilot: ["가장 효과가 큰 업무", "위험이 낮은 업무", "계속 쓸 수 있는 업무"],
      pilotSize: "작은 업무 1개 기준",
    },
  ] as const;

  for (const item of cases) {
    await page.goto("/survey/");
    await completeFlow(page, item.choices);

    await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    await expect(page.getByText(item.expectedValue)).toBeVisible();
    await expect(page.getByText("지원사업 검토 평균")).toBeVisible();
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
  test(`six-screen diagnosis has no horizontal overflow at ${width}px`, async ({
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
        await page.getByRole("button", { name: /결과물을 더 좋게 만들고 싶어요/ }).click();
        await page.getByRole("button", { name: "다음" }).click();
      },
      async () => {
        await page.getByRole("button", { name: /고객이나 기관에 나갑니다/ }).click();
        await page.getByRole("button", { name: "다음" }).click();
      },
      async () => {
        await page.getByRole("button", { name: /초안까지 만들기/ }).click();
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
  page: import("@playwright/test").Page,
  choices: {
    work: RegExp;
    purpose: RegExp;
    nature: RegExp;
    scope: RegExp;
  },
) {
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByRole("button", { name: choices.work }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: choices.purpose }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: choices.nature }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: choices.scope }).click();
  await page.getByRole("button", { name: "결과 보기" }).click();
}
