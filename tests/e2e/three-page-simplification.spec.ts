import { expect, test } from "@playwright/test";

const targetRoutes = ["/survey/", "/privacy/", "/beta-terms/"] as const;

const removedPhrases = [
  "역할별 AI 준비도 정밀진단",
  "유효한 설문 완료자",
  "제품 적합도",
  "정당한 참여자",
  "리워드 자격",
  "선택 안내 조건",
  "PRIVACY REQUEST",
] as const;

const unexplainedTechnicalTerms = ["UTM", "RLS", "CORS"] as const;
const technicalExplanations = {
  UTM: "어떤 SNS 글을 통해 들어왔는지 알 수 있는 표시",
  RLS: "허가되지 않은 사람이 데이터를 보지 못하도록 막는 설정",
  CORS: "허용된 사이트에서만 설문을 보낼 수 있게 하는 설정",
} as const;

test.describe("three-page simplification", () => {
  for (const route of targetRoutes) {
    test(`${route} returns 200`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response?.status()).toBe(200);
    });
  }

  test("survey page uses the approved unified 3-minute survey copy", async ({
    page,
  }) => {
    await page.goto("/survey/");

    await expect(page.getByText("3분 AI 안전 체크")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /우리 팀 AI 사용,\s*안전할까요\?/,
      }),
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "10문항으로 확인합니다.",
    );
    await expect(page.locator("body")).toContainText(
      "이메일 없이 결과를 볼 수 있어요.",
    );

    await expect(
      page.getByRole("link", { name: "시작하기" }),
    ).toHaveAttribute("href", "/survey/practitioner/");

    await expect(page.getByRole("heading", { name: /역할/ })).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText("결과물");
    await expect(page.locator("main")).toContainText("약 3분");
  });

  test("privacy page separates plain summary from detailed legal disclosures", async ({
    page,
  }) => {
    await page.goto("/privacy/");

    await expect(
      page.getByRole("heading", { level: 1, name: "개인정보 안내" }),
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "이름 안 받아요. 전화번호 안 받아요. 회사 기밀 안 받아요.",
    );
    await expect(page.locator("body")).toContainText(
      "이메일은 원할 때만 입력합니다.",
    );

    const summaryCards = page.getByTestId("privacy-summary-card");
    await expect(summaryCards).toHaveCount(5);
    await expect(
      page.getByRole("link", { name: "개인정보 요청 방법 보기" }),
    ).toHaveAttribute("href", "/privacy/request/");
    await expect(
      page.getByRole("link", { name: /agentproof\.ai@gmail\.com/ }),
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { level: 2, name: "자세한 내용 보기" }),
    ).toBeVisible();
    const details = page.locator("details");
    await expect(details).toHaveCount(15);
    await expect(page.locator("summary")).toHaveCount(15);

    await page.getByText("처리업무 위탁").click();
    await expect(page.locator("body")).toContainText("GitHub");
    await expect(page.locator("body")).toContainText("Supabase");
    await expect(page.locator("body")).toContainText("ap-northeast-2");

    await page.getByText("자세한 보안조치").click();
    await expect(page.locator("body")).toContainText(
      "허가되지 않은 사람이 데이터를 보지 못하도록 막는 설정",
    );
    await expect(page.locator("body")).toContainText(
      "허용된 사이트에서만 설문을 보낼 수 있게 하는 설정",
    );
  });

  test("privacy request page avoids implementation labels and keeps operator contact consistent", async ({
    page,
  }) => {
    await page.goto("/privacy/request/");

    await expect(page.getByText("PRIVACY REQUEST")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 1, name: "개인정보 요청 방법" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /agentproof\.ai@gmail\.com/ }),
    ).toHaveAttribute("href", /mailto:agentproof\.ai@gmail\.com/);
    await expect(page.locator("body")).not.toContainText("agentproofKR");
  });

  test("beta terms page uses the approved plain-language participation copy", async ({
    page,
  }) => {
    await page.goto("/beta-terms/");

    await expect(
      page.getByRole("heading", { level: 1, name: "초기 사용자 안내" }),
    ).toBeVisible();
    await expect(page.locator("body")).toContainText(
      "설문 결과와 체크리스트는 바로 볼 수 있습니다.",
    );
    await expect(page.locator("body")).toContainText(
      "참여는 어떻게 정해지나요?",
    );
    await expect(page.locator("body")).toContainText(
      "설문 답변, 점수, 구매 의향에 따라 다르게 대우하지 않습니다.",
    );
    await expect(page.locator("body")).not.toContainText("크레딧");
    await expect(page.locator("body")).not.toContainText("수용 인원");
    await expect(
      page.getByRole("link", { name: /agentproof\.ai@gmail\.com/ }),
    ).toBeVisible();
  });

  test("removed phrases and unexplained technical terms are absent from the three rendered pages", async ({
    page,
  }) => {
    for (const route of targetRoutes) {
      await page.goto(route);
      const bodyText = await page.locator("body").textContent();

      for (const phrase of removedPhrases) {
        expect(bodyText).not.toContain(phrase);
      }

      for (const term of unexplainedTechnicalTerms) {
        if (bodyText?.includes(term)) {
          expect(bodyText).toContain(technicalExplanations[term]);
        }
      }
    }
  });

  test("legal disclosure content is preserved in detailed privacy sections", async ({
    page,
  }) => {
    await page.goto("/privacy/");

    for (const summaryName of [
      "개인정보처리자",
      "수집 목적",
      "수집 항목",
      "수집 방법",
      "보관 기간",
      "삭제 방법",
      "제3자 제공",
      "처리업무 위탁",
      "국외 처리와 이전",
      "자동수집 정보",
      "자세한 보안조치",
      "이용자 권리",
      "만 14세 미만 이용 제한",
      "구제기관",
      "시행일과 변경 이력",
    ]) {
      await page.getByText(summaryName, { exact: true }).click();
    }

    const body = page.locator("body");
    await expect(body).toContainText("6개월");
    await expect(body).toContainText("12개월");
    await expect(body).toContainText("90일");
    await expect(body).toContainText("1년");
    await expect(body).toContainText("제3자에게 판매하거나 제공하지 않습니다");
    await expect(body).toContainText("GitHub Pages");
    await expect(body).toContainText("Supabase");
    await expect(body).toContainText("만 14세");
  });

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
  ]) {
    test(`target pages have no horizontal overflow at ${viewport.width}px`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);

      for (const route of targetRoutes) {
        await page.goto(route);
        const metrics = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));

        expect(metrics.scrollWidth, route).toBeLessThanOrEqual(
          metrics.clientWidth,
        );
      }
    });
  }
});
