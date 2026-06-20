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

async function completeSurvey(page: Page, personaPath: string, expectedCount: number) {
  await page.goto(personaPath);
  await expect(page.getByTestId("survey-shell")).toHaveAttribute(
    "data-question-count",
    String(expectedCount),
  );

  for (let index = 0; index < expectedCount; index += 1) {
    await expect(page.getByTestId("survey-progress")).toContainText(`${index + 1}/${expectedCount}`);
    await answerCurrentQuestion(page);
  }

  await page.getByLabel("만 14세 이상입니다.").check();
  await page.getByLabel(/고객조사 및 서비스 개발을 위한/).check();
  await page.getByRole("button", { name: "결과 확인" }).click();
  await expect(page).toHaveURL(/\/survey\/result\/$/);
  await expect(page.getByRole("heading", { name: /AI 준비도 결과/ })).toBeVisible();
  await expect(page.locator("body")).toContainText("이메일 입력 없이 기본 결과 확인 가능");
}

test("homepage CTAs route to the role-based survey instead of opening the old modal", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("banner").getByRole("link", { name: /역할별 AI 준비도/ })).toHaveAttribute(
    "href",
    "/survey/",
  );
  await page.getByRole("banner").getByRole("link", { name: /역할별 AI 준비도/ }).click();
  await expect(page).toHaveURL(/\/survey\/$/);
  await expect(page.getByRole("heading", { name: "역할별 AI 준비도 정밀진단" })).toBeVisible();
});

test("survey hub preserves UTM and links each persona without putting answers in URLs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto(
    "/survey/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=ai_readiness&utm_content=leader_01",
  );

  await expect(page.getByText(/약 7–10분 동안/)).toBeVisible();
  await page.getByRole("link", { name: /대표·도입 담당자 진단 시작/ }).click();
  await expect(page).toHaveURL(/\/survey\/leader\/$/);
  expect(page.url()).not.toContain("answer");
  expect(page.url()).not.toContain("email");

  const events = await page.evaluate(() => window.dataLayer);
  expect(JSON.stringify(events)).toContain("persona_selected");
  expect(JSON.stringify(events)).toContain("ai_readiness");
});

test("completes all persona surveys and shows result without email", async ({ page }) => {
  await completeSurvey(page, "/survey/practitioner/", 24);
  await page.goto("/");
  await completeSurvey(page, "/survey/leader/", 25);
  await page.goto("/");
  await completeSurvey(page, "/survey/security/", 26);
});

test("blocks submission until required consents are checked", async ({ page }) => {
  await page.goto("/survey/practitioner/");
  const count = Number(await page.getByTestId("survey-shell").getAttribute("data-question-count"));

  for (let index = 0; index < count; index += 1) {
    await answerCurrentQuestion(page);
  }

  await page.getByRole("button", { name: "결과 확인" }).click();
  await expect(page.locator('[role="alert"]').filter({ hasText: "필수 동의" })).toContainText(
    "필수 동의",
  );
});

test("records beta, interview, and pilot actions separately without analytics PII", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await completeSurvey(page, "/survey/security/", 26);

  await page.getByRole("button", { name: "베타테스터 우선 신청" }).click();
  await page.getByLabel("이메일").fill("qa+agentproof@example.com");
  await page.getByLabel(/베타테스트 및 참여 리워드/).check();
  await page.getByRole("button", { name: "베타 신청 기록" }).click();
  await expect(page.getByRole("status")).toContainText("저장소가 연결되면 별도 기록됩니다");

  await page.getByRole("button", { name: "20분 고객 인터뷰 참여" }).click();
  await page.getByLabel("이메일").fill("qa+interview@example.com");
  await page.getByLabel(/후속 고객 인터뷰/).check();
  await page.getByRole("button", { name: "인터뷰 신청 기록" }).click();

  await page.getByRole("button", { name: "우리 조직 파일럿 상담 신청" }).click();
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

test("privacy and beta terms pages expose the required contact email", async ({ page }) => {
  await page.goto("/privacy/request/");
  await expect(page.getByRole("heading", { name: /권리 행사 요청/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /agentproof.ai@gmail.com/ })).toHaveAttribute(
    "href",
    /mailto:agentproof\.ai@gmail\.com/,
  );

  await page.goto("/beta-terms/");
  await expect(page.getByRole("heading", { name: /Founding Researcher/ })).toBeVisible();
  await expect(page.locator("body")).toContainText("현금 가치가 없습니다");
});
