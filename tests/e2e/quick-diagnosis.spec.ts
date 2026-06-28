import { expect, test } from "@playwright/test";

const routeChecks = [
  "/survey/",
  "/survey/?mode=reference",
  "/survey/practitioner/",
  "/survey/leader/",
  "/survey/security/",
  "/survey/result/",
] as const;

test("survey PAGE3 collects compact effort inputs and PAGE4 shows a mini adoption report", async ({
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
  await expect(page.locator("[data-reference-option]")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "다음" })).toBeDisabled();
  await page.getByRole("button", { name: /고객 문의 응대/ }).click();
  await expect(page.getByRole("button", { name: "다음" })).toBeEnabled();

  await page.getByRole("button", { name: "다음" }).click();
  await expect(page.getByRole("heading", { name: "효과를 계산해볼게요" })).toBeVisible();
  await expect(page.getByText("대략 골라도 괜찮아요")).toBeVisible();
  await expect(page.getByText("한 달에 몇 건 정도인가요?")).toBeVisible();
  await expect(page.getByText("한 건에 얼마나 걸리나요?")).toBeVisible();
  await expect(page.getByText("결과가 어디로 나가나요?")).toBeVisible();
  await expect(page.getByText("통제 상태")).toHaveCount(0);
  await expect(page.getByText("자율성")).toHaveCount(0);
  await expect(page.getByText("로그")).toHaveCount(0);
  await expect(page.getByText("드리프트")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "결과 보기" })).toBeDisabled();

  await page.getByRole("button", { name: "10건 이하" }).click();
  await expect(page.getByRole("button", { name: "결과 보기" })).toBeDisabled();
  await page.getByRole("button", { name: "10분 이하" }).click();
  await expect(page.getByRole("button", { name: "결과 보기" })).toBeDisabled();
  await page.getByRole("button", { name: "내부용" }).click();
  await expect(page.getByRole("button", { name: "결과 보기" })).toBeEnabled();

  await page.getByRole("button", { name: "결과 보기" }).click();
  await expect(
    page.getByRole("heading", { name: /고객 문의 응대부터\s*시작해보세요/ }),
  ).toBeVisible();
  await expect(page.getByText("예상 효과")).toBeVisible();
  await expect(page.getByText("예상 범위", { exact: true })).toHaveCount(2);
  await expect(page.getByText("예상 업무량")).toBeVisible();
  await expect(page.getByText("월 1~3시간")).toHaveCount(2);
  await expect(page.getByText("줄일 수 있는 시간")).toBeVisible();
  await expect(
    page.getByText("입력한 빈도와 소요시간 기준 예상 범위입니다."),
  ).toBeVisible();
  await expect(page.getByText("권장 방식")).toBeVisible();
  await expect(page.getByText("AI 초안 작성 → 담당자 확인")).toBeVisible();
  await expect(page.getByText("사람이 봐야 하는 경우")).toBeVisible();
  await expect(page.getByText("개인정보")).toBeVisible();
  await expect(page.getByText("환불·계약")).toBeVisible();
  await expect(page.getByText("고객 불만")).toBeVisible();
  await expect(page.getByText("30일 파일럿에서 볼 것")).toBeVisible();
  await expect(page.getByText("문의 20건 기준")).toBeVisible();
  await expect(page.getByText("실제 절감 시간")).toBeVisible();
  await expect(page.getByText("수정 필요한 결과 비율")).toBeVisible();
  await expect(page.getByText("사람이 봐야 하는 유형")).toBeVisible();
  await expect(page.getByText("지원사업 준비에 활용")).toBeVisible();
  await expect(
    page.getByText("AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다."),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText("안심 점수");
  await expect(page.locator("body")).not.toContainText("지원금 보장");
  await expect(page.locator("body")).not.toContainText("받을 수 있는 금액");
  await expect(page.locator("body")).not.toContainText("정부지원금 확정");
  await expect(page.locator("body")).not.toContainText("최대 지원금");
  await expect(page.locator("body")).not.toContainText("지원금 수령 가능");
  await expect(page.locator("body")).not.toContainText("추천 업무 체험 준비 중");
  await expect(page.locator("body")).not.toContainText("정밀검증 신청");
  await expect(page.locator("body")).not.toContainText("AI 체험하기");
  await expect(page.getByRole("link", { name: "30일 파일럿 설계 받기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "결과 저장하기" })).toBeVisible();

  await page.getByRole("button", { name: "결과 저장하기" }).click();
  await expect(page.getByRole("status")).toHaveText("결과를 복사했습니다");
  await expect(
    page.evaluate(() => navigator.clipboard.readText()),
  ).resolves.toContain("AgentProof AI 도입 간단 점검 결과");

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("adoption_report");
  expect(eventText).toContain("quick_diagnosis_start");
  expect(eventText).toContain("quick_diagnosis_complete");
});

test("result save still shows a toast when the Clipboard API is unavailable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/survey/");
  await page.getByRole("button", { name: "시작하기" }).click();
  await page.getByRole("button", { name: /고객 문의 응대/ }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "10건 이하" }).click();
  await page.getByRole("button", { name: "10분 이하" }).click();
  await page.getByRole("button", { name: "내부용" }).click();
  await page.getByRole("button", { name: "결과 보기" }).click();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
  });

  await page.getByRole("button", { name: "결과 저장하기" }).click();

  await expect(page.getByRole("status")).toHaveText("결과를 복사했습니다");
});

test("selected work personalizes the PAGE4 recommendation and review points", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/survey/");

  const cases = [
    {
      option: /고객 문의 응대/,
      heading: /고객 문의 응대부터\s*시작해보세요/,
      review: ["개인정보", "환불·계약", "고객 불만"],
      pilotSize: "문의 20건 기준",
      method: "AI 초안 작성 → 담당자 확인",
    },
    {
      option: /사업계획서·지원사업/,
      heading: /사업계획서 작성부터\s*시작해보세요/,
      review: ["성과 수치", "근거 문장", "제출 전 최종 검토"],
      pilotSize: "문서 3~5건 기준",
      method: "AI 초안 작성 → 담당자 확인",
    },
    {
      option: /보고서·문서 작성/,
      heading: /보고서·문서 작성부터\s*시작해보세요/,
      review: ["수치 근거", "외부 공유", "예산·계약 문장"],
      pilotSize: "문서 5건 기준",
      method: "AI 초안 작성 → 담당자 확인",
    },
    {
      option: /마케팅 콘텐츠/,
      heading: /마케팅 콘텐츠부터\s*시작해보세요/,
      review: ["과장 표현", "가격·효과", "고객 오해"],
      pilotSize: "콘텐츠 10건 기준",
      method: "AI 초안 작성 → 담당자 확인",
    },
    {
      option: /아직 못 정했어요/,
      heading: /부담이 낮은 업무부터\s*정해보세요/,
      review: ["개인정보", "외부 전달", "금액·계약"],
      pilotSize: "작은 업무 1개 기준",
      method: "작은 업무 1개 선택 → 초안 작성 → 담당자 확인",
    },
  ] as const;

  for (const item of cases) {
    await page.goto("/survey/");
    await page.getByRole("button", { name: "시작하기" }).click();
    await page.getByRole("button", { name: item.option }).click();
    await page.getByRole("button", { name: "다음" }).click();
    await page.getByRole("button", { name: "10~50건" }).click();
    await page.getByRole("button", { name: "30분 안팎" }).click();
    await page.getByRole("button", { name: "고객·기관" }).click();
    await page.getByRole("button", { name: "결과 보기" }).click();

    await expect(page.getByRole("heading", { name: item.heading })).toBeVisible();
    for (const reviewPoint of item.review) {
      await expect(page.getByText(reviewPoint)).toBeVisible();
    }
    await expect(page.getByText(item.pilotSize)).toBeVisible();
    await expect(page.getByText(item.method)).toBeVisible();
  }
});

for (const width of [320, 360, 375, 390, 430]) {
  test(`four-page diagnosis has no horizontal overflow at ${width}px`, async ({
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
        await page.getByRole("button", { name: "50건 이상" }).click();
        await page.getByRole("button", { name: "1시간 이상" }).click();
        await page.getByRole("button", { name: "고객·기관" }).click();
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
