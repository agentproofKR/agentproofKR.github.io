import { describe, expect, it } from "vitest";

import {
  buildMiniReport,
  calculateAdoptionEffect,
  effortQuestionGroups,
  formatResultSummary,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  workOptions,
  type AdoptionInputState,
  type WorkType,
} from "../../lib/survey/quickDiagnosis";

describe("four-page quick diagnosis content", () => {
  it("keeps the flow to the approved four-page structure", () => {
    expect(referenceDiagnosisScreens.map((screen) => screen.id)).toEqual([
      "awareness",
      "work",
      "calculator",
      "report",
    ]);
    expect(referenceDiagnosisScreens.map((screen) => screen.stageLabel)).toEqual([
      "시작",
      "업무",
      "계산",
      "리포트",
    ]);
  });

  it("keeps PAGE1 and PAGE2 buyer-facing copy stable", () => {
    expect(referenceDiagnosisScreens[0]).toMatchObject({
      title: "AI,\n업무에 써도 될까?",
      subcopy: "무료 1분 체크",
      pill: "+ AI 도입 지원금",
      cta: "시작하기",
      trustNote: "연락처 입력 없음",
    });
    expect(referenceDiagnosisScreens[1]).toMatchObject({
      title: "어떤 업무에\nAI를 쓸까요?",
      subcopy: "업무마다 확인할 기준이 달라요.",
      cta: "다음",
    });
  });

  it("uses compact PAGE3 effort inputs instead of abstract AI policy questions", () => {
    expect(referenceDiagnosisScreens[2]).toMatchObject({
      title: "효과를 계산해볼게요",
      subcopy: "대략 골라도 괜찮아요",
      cta: "결과 보기",
    });
    expect(effortQuestionGroups.map((group) => group.label)).toEqual([
      "한 달에 몇 건 정도인가요?",
      "한 건에 얼마나 걸리나요?",
      "결과가 어디로 나가나요?",
    ]);
    expect(effortQuestionGroups.flatMap((group) => group.options.map((option) => option.label))).toEqual([
      "10건 이하",
      "10~50건",
      "50건 이상",
      "잘 모르겠어요",
      "10분 이하",
      "30분 안팎",
      "1시간 이상",
      "잘 모르겠어요",
      "고객·기관",
      "대표·팀장",
      "내부용",
    ]);
    expect(JSON.stringify(effortQuestionGroups)).not.toContain("통제 상태");
    expect(JSON.stringify(effortQuestionGroups)).not.toContain("자율성");
    expect(JSON.stringify(effortQuestionGroups)).not.toContain("로그");
    expect(JSON.stringify(effortQuestionGroups)).not.toContain("드리프트");
  });

  it("offers the five buyer-facing work options with stable keys", () => {
    expect(workOptions).toEqual([
      { value: "customer_reply", label: "고객 문의 응대", subtitle: "답변·상담·CS" },
      {
        value: "grant_document",
        label: "사업계획서·지원사업",
        subtitle: "제출 문서·신청서",
      },
      {
        value: "business_document",
        label: "보고서·문서 작성",
        subtitle: "기획서·내부 문서",
      },
      {
        value: "marketing_content",
        label: "마케팅 콘텐츠",
        subtitle: "SNS·블로그·상세페이지",
      },
      { value: "unknown", label: "아직 못 정했어요", subtitle: "추천을 받아볼게요" },
    ]);
  });
});

describe("adoption effect calculation", () => {
  it.each([
    [
      "customer_reply",
      { volume: "low", time: "short", exposure: "internal" },
      {
        monthlyHoursMin: 0.08,
        monthlyHoursMax: 1.67,
        savingHoursMin: 0.02,
        savingHoursMax: 0.75,
        monthlyHoursRange: "1~3",
        savingHoursRange: "1~3",
      },
    ],
    [
      "grant_document",
      { volume: "mid", time: "medium", exposure: "external" },
      {
        monthlyHoursMin: 3.33,
        monthlyHoursMax: 33.33,
        savingHoursMin: 0.67,
        savingHoursMax: 11.67,
        monthlyHoursRange: "15시간 이상",
        savingHoursRange: "4~12",
      },
    ],
    [
      "marketing_content",
      { volume: "high", time: "long", exposure: "external" },
      {
        monthlyHoursMin: 50,
        monthlyHoursMax: 180,
        savingHoursMin: 12.5,
        savingHoursMax: 81,
        monthlyHoursRange: "15시간 이상",
        savingHoursRange: "15시간 이상",
      },
    ],
    [
      "unknown",
      { volume: "unknown", time: "unknown", exposure: "executive" },
      {
        monthlyHoursMin: 2.5,
        monthlyHoursMax: 15,
        savingHoursMin: 0.375,
        savingHoursMax: 4.5,
        monthlyHoursRange: "15시간 이상",
        savingHoursRange: "4~12",
      },
    ],
  ] satisfies [
    WorkType,
    AdoptionInputState,
    {
      monthlyHoursMin: number;
      monthlyHoursMax: number;
      savingHoursMin: number;
      savingHoursMax: number;
      monthlyHoursRange: string;
      savingHoursRange: string;
    },
  ][])(
    "calculates readable estimated ranges for %s",
    (workType, input, expected) => {
      const result = calculateAdoptionEffect(workType, input);

      expect(result.monthlyHoursMin).toBeCloseTo(expected.monthlyHoursMin, 2);
      expect(result.monthlyHoursMax).toBeCloseTo(expected.monthlyHoursMax, 2);
      expect(result.savingHoursMin).toBeCloseTo(expected.savingHoursMin, 2);
      expect(result.savingHoursMax).toBeCloseTo(expected.savingHoursMax, 2);
      expect(result.monthlyHoursRange).toBe(expected.monthlyHoursRange);
      expect(result.savingHoursRange).toBe(expected.savingHoursRange);
      expect(result.estimateLabel).toBe("예상 범위");
    },
  );
});

describe("PAGE4 mini report", () => {
  it.each([
    ["customer_reply", "고객 문의 응대부터\n시작해보세요", ["개인정보", "환불·계약", "고객 불만"], "문의 20건 기준"],
    ["grant_document", "사업계획서 작성부터\n시작해보세요", ["성과 수치", "근거 문장", "제출 전 최종 검토"], "문서 3~5건 기준"],
    ["business_document", "보고서·문서 작성부터\n시작해보세요", ["수치 근거", "외부 공유", "예산·계약 문장"], "문서 5건 기준"],
    ["marketing_content", "마케팅 콘텐츠부터\n시작해보세요", ["과장 표현", "가격·효과", "고객 오해"], "콘텐츠 10건 기준"],
    ["unknown", "부담이 낮은 업무부터\n정해보세요", ["개인정보", "외부 전달", "금액·계약"], "작은 업무 1개 기준"],
  ] satisfies [WorkType, string, string[], string][])(
    "builds the requested compact report for %s",
    (workType, headline, reviewPoints, pilotSize) => {
      const report = buildMiniReport(workType);

      expect(report.headline).toBe(headline);
      expect(report.reviewPoints).toEqual(reviewPoints);
      expect(report.pilotSize).toBe(pilotSize);
      expect(report.pilotItems).toEqual([
        "실제 절감 시간",
        "수정 필요한 결과 비율",
        "사람이 봐야 하는 유형",
      ]);
      expect(report.supportNote).toBe(
        "AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다.",
      );
      expect(report.supportNote).not.toMatch(/보장|확정|최대 지원금|수령 가능/);
      expect(report.method).toBe(
        workType === "unknown"
          ? "작은 업무 1개 선택 → 초안 작성 → 담당자 확인"
          : "AI 초안 작성 → 담당자 확인",
      );
    },
  );

  it("formats the exact copy-to-clipboard summary without funding promises", () => {
    const effect = calculateAdoptionEffect("customer_reply", {
      volume: "low",
      time: "short",
      exposure: "internal",
    });
    const report = buildMiniReport("customer_reply");

    expect(formatResultSummary("고객 문의 응대", effect, report)).toBe(
      [
        "AgentProof AI 도입 간단 점검 결과",
        "",
        "추천 업무: 고객 문의 응대",
        "예상 업무량: 월 1~3시간",
        "예상 절감: 월 1~3시간",
        "",
        "권장 방식:",
        "AI 초안 작성 → 담당자 확인",
        "",
        "사람이 봐야 하는 경우:",
        "",
        "* 개인정보",
        "* 환불·계약",
        "* 고객 불만",
        "",
        "30일 파일럿에서 확인할 것:",
        "",
        "* 실제 절감 시간",
        "* 수정 필요한 결과 비율",
        "* 사람이 봐야 하는 유형",
        "",
        "지원사업 준비 자료로 활용할 수 있습니다.",
      ].join("\n"),
    );
    expect(formatResultSummary("고객 문의 응대", effect, report)).not.toMatch(
      /지원금 보장|받을 수 있는 금액|정부지원금 확정|최대 지원금|지원금 수령 가능/,
    );
  });

  it("uses the updated quick diagnosis version", () => {
    expect(quickDiagnosisVersion).toBe(
      "2026-06-AgentProof-four-page-adoption-report-v1",
    );
  });
});
