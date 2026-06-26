import { expect, test, type Page } from "@playwright/test";

async function answerCurrentQuestion(page: Page) {
  const question = page.getByTestId("survey-question");
  const checkbox = question.getByRole("checkbox").first();
  if ((await checkbox.count()) > 0) {
    await checkbox.check();
  } else {
    await question.getByRole("radio").first().check();
  }
  await page.getByRole("button", { name: "계속" }).click();
}

async function acceptRequiredSurveyConsents(page: Page) {
  await expect(page.getByTestId("survey-consent-step")).toBeVisible();
  await expect(page.getByTestId("survey-question")).toHaveCount(0);
  await page.getByLabel("성명").fill("김테스트");
  await page.getByLabel("연락처").fill("qa+survey@example.com");
  await page.getByRole("radio", { name: "동의합니다" }).check();
  await page.getByLabel("만 14세 이상입니다.").check();
  await page.getByLabel("답변과 결과 점수를 설문 운영에 사용하는 데 동의합니다.").check();
  await page.getByRole("button", { name: "동의하고 시작하기" }).click();
  await expect(page.getByTestId("survey-progress")).toContainText("1/");
}

async function completeSurvey(
  page: Page,
  personaPath: string,
  expectedCount: number,
) {
  await page.goto(personaPath);
  await expect(page.getByTestId("survey-shell")).toHaveAttribute(
    "data-question-count",
    String(expectedCount),
  );
  await acceptRequiredSurveyConsents(page);

  for (let index = 0; index < expectedCount; index += 1) {
    await expect(page.getByTestId("survey-progress")).toContainText(
      `${index + 1}/${expectedCount}`,
    );
    await answerCurrentQuestion(page);
  }

  await page.getByRole("button", { name: "결과 보기" }).click();
  await expect(page).toHaveURL(/\/survey\/result\/$/);
  await expect(
    page.getByRole("heading", { name: /AI 안전 체크 결과/ }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText(
    "이번 주 실행할 일을 정리했습니다",
  );
}

test("homepage CTAs route to the unified 3-minute survey", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("banner").getByRole("link", { name: /AI 활용 진단/ }),
  ).toHaveAttribute("href", "/survey/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: /AI 활용 진단/ })
    .click();
  await expect(page).toHaveURL(/\/survey\/$/);
  await expect(
    page.getByRole("heading", {
      name: /AI로 만든 답변,\s*바로 보내도 될까요\?/,
    }),
  ).toBeVisible();
});

test("quick diagnosis preserves UTM and starts without putting answers in URLs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto(
    "/survey/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ai_readiness&utm_content=leader_01",
  );

  await expect(page.getByText("3분만 체크하고 먼저 맡길 일을 찾아보세요.")).toBeVisible();
  await expect(page.getByRole("heading", { name: /역할에 맞는 점검/ })).toHaveCount(0);
  await page.getByRole("button", { name: "시작하기" }).click();
  await expect(page).toHaveURL(/\/survey\//);
  await expect(
    page.getByRole("heading", { name: "어떤 상황에 가까우세요?" }),
  ).toBeVisible();
  expect(page.url()).not.toContain("answer");
  expect(page.url()).not.toContain("email");

  const events = await page.evaluate(() => window.dataLayer);
  expect(JSON.stringify(events)).toContain("quick_diagnosis_start");
  expect(JSON.stringify(events)).toContain("ai_readiness");
});

test("survey pages keep the brand and AI diagnosis CTA fixed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 1200 });
  await page.goto("/survey/");

  const header = page.getByRole("banner");
  const brand = header.getByRole("link", { name: /AgentProof/ });
  const cta = header.getByRole("link", { name: /AI 활용 진단/ });
  await expect(brand).toBeVisible();
  await expect(cta).toBeVisible();

  const before = await header.boundingBox();
  expect(before?.y).toBe(0);

  await page.mouse.wheel(0, 1200);
  const afterScroll = await header.boundingBox();
  expect(afterScroll?.y).toBe(0);
  await expect(brand).toBeVisible();
  await expect(cta).toBeVisible();

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
});

test("completes unified survey from all legacy persona URLs and shows result without email", async ({
  page,
}) => {
  await completeSurvey(page, "/survey/practitioner/", 10);
  await page.goto("/");
  await completeSurvey(page, "/survey/leader/", 10);
  await page.goto("/");
  await completeSurvey(page, "/survey/security/", 10);
});

test("requires consent before showing the first question", async ({ page }) => {
  await page.goto("/survey/practitioner/");

  await expect(page.getByTestId("survey-consent-step")).toBeVisible();
  await expect(page.getByTestId("survey-question")).toHaveCount(0);

  await page.getByRole("button", { name: "동의하고 시작하기" }).click();
  await expect(
    page.locator('[role="alert"]').filter({ hasText: "성명을 2자 이상 입력해주세요." }),
  ).toContainText("성명을 2자 이상 입력해주세요.");

  await acceptRequiredSurveyConsents(page);
  await expect(page.getByTestId("survey-question")).toBeVisible();
});

test("does not write survey drafts to localStorage by default", async ({
  page,
}) => {
  await page.goto("/survey/practitioner/");
  await acceptRequiredSurveyConsents(page);

  await answerCurrentQuestion(page);

  const draftKeys = await page.evaluate(() =>
    Object.keys(window.localStorage).filter((key) =>
      key.startsWith("agentproof-survey-draft-"),
    ),
  );
  expect(draftKeys).toEqual([]);
});

test("stores only non-sensitive result summary in sessionStorage", async ({
  page,
}) => {
  await completeSurvey(page, "/survey/leader/", 10);

  const storageState = await page.evaluate(() => ({
    localResult: window.localStorage.getItem("agentproof-survey-result"),
    sessionResult: window.sessionStorage.getItem("agentproof-survey-result"),
  }));

  expect(storageState.localResult).toBeNull();
  expect(storageState.sessionResult).not.toBeNull();
  const parsed = JSON.parse(storageState.sessionResult ?? "{}") as Record<
    string,
    unknown
  >;
  expect(parsed).not.toHaveProperty("answers");
  expect(JSON.stringify(parsed)).not.toContain("U01");
  expect(JSON.stringify(parsed)).not.toContain("U07");
});

test("records beta, interview, and pilot actions separately without analytics PII", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await completeSurvey(page, "/survey/security/", 10);

  await page.getByRole("button", { name: "체크리스트 받기" }).click();
  await page.getByLabel("이메일").fill("qa+agentproof@example.com");
  await page.getByLabel(/초기 사용자 참여 안내/).check();
  await page.getByRole("button", { name: "체크리스트 요청하기" }).click();
  await expect(page.getByRole("status")).toContainText(
    "저장소가 꺼져 있어 전송하지 않았습니다.",
  );

  await page.getByRole("button", { name: "인터뷰하기" }).click();
  await page.getByLabel("이메일").fill("qa+interview@example.com");
  await page.getByLabel(/후속 고객 인터뷰/).check();
  await page.getByRole("button", { name: "인터뷰 신청하기" }).click();

  await page.getByRole("button", { name: "우리 회사 상담하기" }).click();
  await page.getByLabel("이메일").fill("qa+pilot@example.com");
  await page.getByLabel("회사 또는 팀명").fill("QA 테스트 팀");
  await page.getByLabel(/파일럿 상담 요청/).check();
  await page.getByRole("button", { name: "상담 요청하기" }).click();

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("beta_optin");
  expect(eventText).toContain("interview_optin");
  expect(eventText).toContain("pilot_requested");
  expect(eventText).not.toContain("qa+agentproof@example.com");
  expect(eventText).not.toContain("QA 테스트 팀");
});

test("privacy and beta terms pages expose the required contact email", async ({
  page,
}) => {
  await page.goto("/privacy/request/");
  await expect(
    page.getByRole("heading", { name: /개인정보 요청 방법/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /agentproof.ai@gmail.com/ }),
  ).toHaveAttribute("href", /mailto:agentproof\.ai@gmail\.com/);

  await page.goto("/beta-terms/");
  await expect(
    page.getByRole("heading", { name: /초기 사용자 안내/ }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("현금으로 바꾸거나");
});
