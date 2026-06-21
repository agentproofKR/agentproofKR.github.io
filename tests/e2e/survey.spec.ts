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
  await page.getByLabel("만 14세 이상입니다.").check();
  await page.getByLabel(/고객조사 및 서비스 개발을 위한/).check();
  await page.getByRole("button", { name: "동의하고 3분 점검 시작" }).click();
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

  await page.getByRole("button", { name: "결과 확인" }).click();
  await expect(page).toHaveURL(/\/survey\/result\/$/);
  await expect(
    page.getByRole("heading", { name: /AI 업무 위험도/ }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText(
    "이메일 입력 없이 기본 결과 확인 가능",
  );
}

test("homepage CTAs route to the unified 3-minute survey", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("banner").getByRole("link", { name: /3분 점검/ }),
  ).toHaveAttribute("href", "/survey/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: /3분 점검/ })
    .click();
  await expect(page).toHaveURL(/\/survey\/$/);
  await expect(
    page.getByRole("heading", { name: "3분 안에 AI 업무 위험도를 확인합니다" }),
  ).toBeVisible();
});

test("survey hub preserves UTM and starts unified survey without putting answers in URLs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto(
    "/survey/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ai_readiness&utm_content=leader_01",
  );

  await expect(page.getByText(/약 3분이 걸리며/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /역할에 맞는 점검/ })).toHaveCount(0);
  await page.getByRole("link", { name: "3분 점검 시작" }).click();
  await expect(page).toHaveURL(/\/survey\/practitioner\/$/);
  expect(page.url()).not.toContain("answer");
  expect(page.url()).not.toContain("email");

  const events = await page.evaluate(() => window.dataLayer);
  expect(JSON.stringify(events)).toContain("survey_start_click");
  expect(JSON.stringify(events)).toContain("ai_readiness");
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

  await page.getByRole("button", { name: "동의하고 3분 점검 시작" }).click();
  await expect(
    page.locator('[role="alert"]').filter({ hasText: "필수 동의" }),
  ).toContainText("필수 동의");

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

  await page.getByRole("button", { name: "체크리스트 이메일로 받기" }).click();
  await page.getByLabel("이메일").fill("qa+agentproof@example.com");
  await page.getByLabel(/초기 사용자 참여 안내/).check();
  await page.getByRole("button", { name: "체크리스트 요청 기록" }).click();
  await expect(page.getByRole("status")).toContainText(
    "저장소가 연결되면 별도 기록됩니다",
  );

  await page.getByRole("button", { name: "20분 인터뷰 참여하기" }).click();
  await page.getByLabel("이메일").fill("qa+interview@example.com");
  await page.getByLabel(/후속 고객 인터뷰/).check();
  await page.getByRole("button", { name: "인터뷰 신청 기록" }).click();

  await page
    .getByRole("button", { name: "우리 회사 AI 사용 기준 상담하기" })
    .click();
  await page.getByLabel("이메일").fill("qa+pilot@example.com");
  await page.getByLabel("회사 또는 팀명").fill("QA 테스트 팀");
  await page.getByLabel(/파일럿 상담 요청/).check();
  await page.getByRole("button", { name: "상담 요청 기록" }).click();

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
    page.getByRole("heading", { name: /초기 사용자 참여 안내/ }),
  ).toBeVisible();
  await expect(page.locator("body")).toContainText("현금으로 바꾸거나");
});
