import { expect, test } from "@playwright/test";

test("renders the complete landing structure and opens the shared lead modal", async ({ page }) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /AI를 업무에 쓸 때,\s*무엇을 맡기고 무엇을 지킬지\./,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("AgentProof AI 업무 도입 진단 샘플 화면")).toContainText(
    "SAMPLE DATA",
  );
  await expect(page.getByLabel("AgentProof AI 업무 도입 진단 샘플 화면")).toContainText(
    "확인된 위험",
  );
  await expect(page.getByLabel("AgentProof AI 업무 도입 진단 샘플 화면")).toContainText(
    "비식별화 + 승인된 도구 사용 + 검토 책임 지정",
  );
  await expect(page.locator("#roles")).toContainText("같은 AI를 봐도");
  await expect(page.locator("#process")).toContainText("AI를 막기보다");

  await page.getByRole("button", { name: "우리 조직 AI 준비도 확인" }).first().click();
  await expect(page.getByRole("dialog", { name: "AI 준비도 진단 신청" })).toBeVisible();
  await expect(page.getByLabel("역할")).toBeFocused();
  await expect(page.locator("body")).toHaveClass(/modal-open/);

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "AI 준비도 진단 신청" })).toBeHidden();
});

test("prepares a static mailto handoff for a valid lead and keeps PII out of analytics", async ({
  page,
}) => {
  let apiCalls = 0;
  await page.route("**/api/leads", async (route) => {
    apiCalls += 1;
    await route.fulfill({ status: 500, body: "static export should not call API" });
  });
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto(
    "/?utm_source=linkedin&utm_medium=social&utm_campaign=launch&utm_content=founder-post-01",
  );

  await page.getByRole("button", { name: "우리 조직 AI 준비도 확인" }).first().click();
  await page.getByLabel("역할").selectOption("대표·임원·팀장");
  await page.getByLabel("현재 단계").selectOption("회사 도입 검토");
  await page.getByLabel("가장 걱정되는 문제").selectOption("도입 우선순위");
  await page.getByLabel("회사/팀명").fill("QA 테스트 팀");
  await page.getByLabel("업무 이메일").fill("qa+agentproof@example.com");
  await page
    .getByLabel("상황 설명")
    .fill("보고서 작성과 고객응대 업무부터 파일럿을 검토 중입니다.");
  await page.getByLabel(/개인정보 동의/).check();

  await page.getByRole("button", { name: "신청하기" }).click();
  await expect(page.getByRole("status")).toContainText(
    "GitHub Pages 정적 배포에서는 서버 저장이 연결되어 있지 않습니다.",
  );
  const mailto = page.getByRole("link", { name: "업무 이메일로 신청 내용 보내기" });
  await expect(mailto).toBeVisible();
  const href = await mailto.getAttribute("href");
  expect(href).toContain("mailto:");
  expect(decodeURIComponent(href ?? "")).toContain("회사/팀명: QA 테스트 팀");
  expect(decodeURIComponent(href ?? "")).toContain("UTM content: founder-post-01");
  expect(apiCalls).toBe(0);

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("founder-post-01");
  expect(eventText).not.toContain("lead_form_success");
  expect(eventText).not.toContain("qa+agentproof@example.com");
  expect(eventText).not.toContain("QA 테스트 팀");
  expect(eventText).not.toContain("보고서 작성");
});

test("shows validation errors without calling the API", async ({ page }) => {
  let apiCalls = 0;
  await page.route("**/api/leads", async (route) => {
    apiCalls += 1;
    await route.fulfill({ status: 500, body: "should not be called" });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "AI 준비도 진단" }).click();
  await page.getByRole("button", { name: "신청하기" }).click();

  await expect(page.getByText("역할을 선택해주세요.")).toBeVisible();
  expect(apiCalls).toBe(0);
});
