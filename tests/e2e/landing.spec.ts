import { expect, test } from "@playwright/test";

test("renders the V5.1 discovery landing and opens role-card diagnosis modal", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.dataLayer = [];
  });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /업무 AI,\s*어디까지 맡겨도 될까요\?/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "3분 진단" }),
  ).toBeVisible();
  await expect(page.locator("#product")).toContainText("MVP preview · 문서·규정 검색 Agent");
  await expect(page.locator("#product")).toContainText("SAMPLE DATA");
  await expect(
    page.getByRole("img", { name: /AgentProof 업무용 AI 검증 대시보드 샘플/ }),
  ).toBeAttached();
  await expect(page.locator("body")).not.toContainText("Agent Assurance");
  await expect(
    page.getByRole("heading", { level: 2, name: /어디에서 가장\s*막히시나요\?/ }),
  ).toBeVisible();
  await expect(page.locator("#roles")).toContainText("AI 답을 믿고 써도 될까요?");
  await expect(page.locator("#roles")).not.toContainText("세 팀이 같은 화면에서");
  await expect(page.locator("#roles")).not.toContainText("업무·문서·Agent");
  await expect(
    page.getByRole("heading", { level: 2, name: /첫 파일럿은\s*문서·규정 검색부터\./ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: /지금 가장 필요한 서비스를\s*알려주세요\./,
    }),
  ).toBeVisible();

  await page.getByRole("tab", { name: /위험 테스트/ }).click();
  await expect(page.locator('[aria-live="polite"]')).toContainText("오답");

  await page
    .locator("article")
    .filter({ hasText: "대표·도입 담당자" })
    .getByRole("button", { name: /이 문제 선택/ })
    .click();
  await expect(page.getByRole("dialog", { name: "3분 AI 도입 과제 진단" })).toBeVisible();
  await expect(page.getByLabel("나는")).toHaveValue("대표·도입 담당자");
  await expect(page.getByLabel("현재 단계")).toBeFocused();
  await expect(page.locator("body")).toHaveClass(/modal-open/);
  const events = await page.evaluate(() => window.dataLayer);
  expect(JSON.stringify(events)).toContain("role_problem_click");
  expect(JSON.stringify(events)).toContain("diagnosis_start");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "3분 AI 도입 과제 진단" })).toBeHidden();
});

test("prepares a static mailto handoff and keeps PII out of analytics", async ({ page }) => {
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

  await page.getByRole("button", { name: "내 과제 3분 진단" }).click();
  await page.getByLabel("나는").selectOption("대표·도입 담당자");
  await page.getByLabel("현재 단계").selectOption("조직 도입 검토 중");
  await page.getByLabel("가장 가까운 문제").selectOption("어떤 업무부터 도입해야 할지 모르겠다");
  await page.getByLabel("원하는 다음 단계").selectOption("MVP 샘플 리포트");
  await page.getByLabel("업무 이메일").fill("qa+agentproof@example.com");
  await page
    .getByLabel(/적용하고 싶은 업무/)
    .fill("사내 문서 검색 Agent의 답변 근거와 권한을 검증하고 싶습니다.");
  await page.getByLabel(/개인정보 수집·이용/).check();

  await page.getByRole("button", { name: "진단 제출" }).click();
  await expect(page.getByRole("status")).toContainText(
    "GitHub Pages 정적 배포에서는 서버 저장이 연결되어 있지 않습니다.",
  );
  const mailto = page.getByRole("link", { name: "업무 이메일로 신청 내용 보내기" });
  await expect(mailto).toBeVisible();
  const href = decodeURIComponent((await mailto.getAttribute("href")) ?? "");
  expect(href).toContain("mailto:");
  expect(href).toContain("역할: 대표·도입 담당자");
  expect(href).toContain("적용하고 싶은 업무: 사내 문서 검색 Agent");
  expect(href).toContain("UTM content: founder-post-01");
  expect(apiCalls).toBe(0);

  const events = await page.evaluate(() => window.dataLayer);
  const eventText = JSON.stringify(events);
  expect(eventText).toContain("diagnosis_submit");
  expect(eventText).toContain("followup_sample_report");
  expect(eventText).toContain("lead_static_handoff");
  expect(eventText).toContain("founder-post-01");
  expect(eventText).not.toContain("lead_form_success");
  expect(eventText).not.toContain("qa+agentproof@example.com");
  expect(eventText).not.toContain("사내 문서 검색");
});

test("preselects the matching role and problem from every role card", async ({ page }) => {
  await page.goto("/");

  for (const item of [
    {
      role: "실무자",
      problem: "AI 답을 어디까지 믿고 써야 할지 모르겠다",
    },
    {
      role: "대표·도입 담당자",
      problem: "어떤 업무부터 도입해야 할지 모르겠다",
    },
    {
      role: "보안·정책 담당자",
      problem: "개인정보·권한·승인 기준이 없다",
    },
  ]) {
    await page
      .locator("article")
      .filter({ hasText: item.role })
      .getByRole("button", { name: /이 문제 선택/ })
      .click();
    await expect(page.getByRole("dialog", { name: "3분 AI 도입 과제 진단" })).toBeVisible();
    await expect(page.getByLabel("나는")).toHaveValue(item.role);
    await expect(page.getByLabel("가장 가까운 문제")).toHaveValue(item.problem);
    await page.getByRole("button", { name: "닫기" }).click();
  }
});

test("shows validation errors without calling the API", async ({ page }) => {
  let apiCalls = 0;
  await page.route("**/api/leads", async (route) => {
    apiCalls += 1;
    await route.fulfill({ status: 500, body: "should not be called" });
  });
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: "3분 진단" }).click();
  await page.getByRole("button", { name: "진단 제출" }).click();

  await expect(page.getByText("담당 역할을 선택해주세요.")).toBeVisible();
  expect(apiCalls).toBe(0);
});
