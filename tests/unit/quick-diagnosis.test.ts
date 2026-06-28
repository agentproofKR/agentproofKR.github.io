import { describe, expect, it } from "vitest";

import {
  adoptionScopeOptions,
  buildAdoptionReport,
  exposureOptions,
  formatKrw,
  formatResultSummary,
  getProjectScale,
  getSupportReviewAmount,
  monthlyVolumeOptions,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  timePerCaseOptions,
  workOptions,
  workRisk,
  type AdoptionScope,
  type Exposure,
  type MonthlyVolume,
  type QuickWorkType,
  type TimePerCase,
} from "../../lib/survey/quickDiagnosis";

describe("quick diagnosis final five-input flow", () => {
  it("uses hook + work, volume, time, scope, exposure + result", () => {
    expect(referenceDiagnosisScreens.map((screen) => screen.id)).toEqual([
      "awareness",
      "work",
      "monthly_volume",
      "time_per_case",
      "adoption_scope",
      "exposure",
      "result",
    ]);
    expect(referenceDiagnosisScreens.map((screen) => screen.stageLabel)).toEqual([
      "시작",
      "업무",
      "건수",
      "시간",
      "범위",
      "전달",
      "결과",
    ]);
  });

  it("keeps the accepted hook and work-selection copy", () => {
    expect(referenceDiagnosisScreens[0]).toMatchObject({
      title: "AI,\n업무에 써도 될까?",
      subcopy: "무료 1분 체크",
      pill: "+ AI 도입 지원금",
      cta: "시작하기",
      trustNote: "연락처 입력 없음",
    });
    expect(referenceDiagnosisScreens[1]).toMatchObject({
      title: "어떤 업무에\nAI를 쓸까요?",
      subcopy: "가장 먼저 확인할 업무를 골라주세요.",
      cta: "다음",
    });
  });

  it("offers the final five work options and risk weights", () => {
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
    expect(workRisk).toEqual({
      customer_reply: 12,
      grant_document: 10,
      business_document: 7,
      marketing_content: 8,
      unknown: 9,
    });
  });

  it("uses final volume, time, adoption scope, and exposure option sets", () => {
    expect(monthlyVolumeOptions.map((option) => option.value)).toEqual([
      "low",
      "mid",
      "high",
      "unknown",
    ]);
    expect(timePerCaseOptions.map((option) => option.value)).toEqual([
      "short",
      "medium",
      "long",
      "unknown",
    ]);
    expect(adoptionScopeOptions.map((option) => option.value)).toEqual([
      "draft_only",
      "reviewed_use",
      "partial_automation",
      "direct_use",
      "unknown",
    ]);
    expect(exposureOptions.map((option) => option.value)).toEqual([
      "external",
      "executive",
      "internal",
      "unknown",
    ]);

    const visibleCopy = JSON.stringify({
      referenceDiagnosisScreens,
      monthlyVolumeOptions,
      timePerCaseOptions,
      adoptionScopeOptions,
      exposureOptions,
    });
    expect(visibleCopy).not.toMatch(/통제 진단|자율성|행동 로그|드리프트|HITL/);
  });
});

describe("quick diagnosis numeric report model", () => {
  it("formats conservative support review amount examples", () => {
    expect(formatKrw(3_400_000)).toBe("340만원");
    expect(formatKrw(8_600_000)).toBe("860만원");
    expect(formatKrw(21_500_000)).toBe("2,150만원");

    expect(getSupportReviewAmount("low")).toMatchObject({
      label: "약 340만원",
      rangeLabel: "검토 범위 120만~560만원",
      averageAmount: 3_400_000,
      minAmount: 1_200_000,
      maxAmount: 5_600_000,
    });
    expect(getSupportReviewAmount("enterprise")).toMatchObject({
      label: "별도 산정",
      rangeLabel: "도입 범위 확인 필요",
      averageAmount: null,
      minAmount: null,
      maxAmount: null,
    });
  });

  it("estimates project scale from selected work, volume, saving, adoption scope, and exposure", () => {
    expect(
      getProjectScale({
        workType: "unknown",
        monthlyVolume: "low",
        savingHoursMax: 2,
        adoptionScope: "unknown",
        exposure: "unknown",
      }),
    ).toBe("low");
    expect(
      getProjectScale({
        workType: "business_document",
        monthlyVolume: "mid",
        savingHoursMax: 11,
        adoptionScope: "reviewed_use",
        exposure: "internal",
      }),
    ).toBe("medium");
    expect(
      getProjectScale({
        workType: "grant_document",
        monthlyVolume: "mid",
        savingHoursMax: 11,
        adoptionScope: "partial_automation",
        exposure: "external",
      }),
    ).toBe("high");
    expect(
      getProjectScale({
        workType: "customer_reply",
        monthlyVolume: "high",
        savingHoursMax: 12,
        adoptionScope: "partial_automation",
        exposure: "external",
      }),
    ).toBe("enterprise");
  });

  it.each([
    {
      input: {
        workType: "customer_reply",
        monthlyVolume: "low",
        timePerCase: "short",
        adoptionScope: "reviewed_use",
        exposure: "internal",
      },
      expected: {
        headline: "고객 문의 응대부터\n시작해보세요",
        method: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
        reviewPoints: ["개인정보", "환불·계약", "고객 불만"],
        pilotSize: "문의 20건 기준",
        aiAdoptionScore: 75,
        resultBand: "조건부 시작",
        savingRateMin: 0.1,
        savingRateMax: 0.25,
        savingHoursMin: 0.0083,
        savingHoursMax: 0.4167,
        savingMoneyMin: 250,
        savingMoneyMax: 12_500,
        projectScale: "low",
        supportReviewAverage: 3_400_000,
      },
    },
    {
      input: {
        workType: "marketing_content",
        monthlyVolume: "high",
        timePerCase: "long",
        adoptionScope: "partial_automation",
        exposure: "external",
      },
      expected: {
        headline: "마케팅 콘텐츠부터\n시작해보세요",
        method: "정해진 기준 안에서 일부 반복 업무만 자동화하세요.",
        reviewPoints: ["과장 표현", "가격·효과", "고객 오해"],
        pilotSize: "콘텐츠 10건 기준",
        aiAdoptionScore: 38,
        resultBand: "업무 선정 필요",
        savingRateMin: 0.2,
        savingRateMax: 0.45,
        savingHoursMin: 10,
        savingHoursMax: 81,
        savingMoneyMin: 300_000,
        savingMoneyMax: 2_430_000,
        projectScale: "enterprise",
        supportReviewAverage: null,
      },
    },
  ] satisfies {
    input: {
      workType: QuickWorkType;
      monthlyVolume: MonthlyVolume;
      timePerCase: TimePerCase;
      adoptionScope: AdoptionScope;
      exposure: Exposure;
    };
    expected: {
      headline: string;
      method: string;
      reviewPoints: string[];
      pilotSize: string;
      aiAdoptionScore: number;
      resultBand: string;
      savingRateMin: number;
      savingRateMax: number;
      savingHoursMin: number;
      savingHoursMax: number;
      savingMoneyMin: number;
      savingMoneyMax: number;
      projectScale: string;
      supportReviewAverage: number | null;
    };
  }[])("builds raw numeric report values for $input.workType", ({ input, expected }) => {
    const report = buildAdoptionReport(input);

    expect(report.headline).toBe(expected.headline);
    expect(report.method).toBe(expected.method);
    expect(report.reviewPoints).toEqual(expected.reviewPoints);
    expect(report.pilotSize).toBe(expected.pilotSize);
    expect(report.aiAdoptionScore).toBe(expected.aiAdoptionScore);
    expect(report.resultBand).toBe(expected.resultBand);
    expect(report.savingRateMin).toBe(expected.savingRateMin);
    expect(report.savingRateMax).toBe(expected.savingRateMax);
    expect(report.savingHoursMin).toBeCloseTo(expected.savingHoursMin, 4);
    expect(report.savingHoursMax).toBeCloseTo(expected.savingHoursMax, 4);
    expect(report.savingMoneyMin).toBe(expected.savingMoneyMin);
    expect(report.savingMoneyMax).toBe(expected.savingMoneyMax);
    expect(report.projectScale).toBe(expected.projectScale);
    expect(report.supportReviewAverage).toBe(expected.supportReviewAverage);
    expect(report.hourlyCost).toBe(30_000);
    expect(report.metricCards.map((card) => card.title)).toEqual([
      "AI 도입 점수",
      "예상 절감률",
      "예상 절감 시간",
      "월 절감 금액",
      "지원사업 검토 평균",
      "30일 파일럿",
    ]);
  });

  it("formats the copy-to-clipboard summary without using display strings as storage", () => {
    const report = buildAdoptionReport({
      workType: "customer_reply",
      monthlyVolume: "low",
      timePerCase: "short",
      adoptionScope: "reviewed_use",
      exposure: "internal",
    });

    expect(formatResultSummary(report)).toContain("추천 업무: 고객 문의 응대");
    expect(formatResultSummary(report)).toContain("월 처리량: 10건 이하");
    expect(formatResultSummary(report)).toContain("건당 소요시간: 10분 이하");
    expect(formatResultSummary(report)).toContain("사용 범위: 확인 후 사용");
    expect(formatResultSummary(report)).toContain("결과 사용처: 내부에서만 봅니다");
    expect(formatResultSummary(report)).toContain("AI 도입 점수: 75점 (조건부 시작)");
    expect(formatResultSummary(report)).not.toMatch(
      /지원금 보장|받을 수 있는 금액|정부지원금 확정|최대 지원금|지원금 수령 가능|선정 보장/,
    );
  });

  it("uses the updated quick diagnosis version", () => {
    expect(quickDiagnosisVersion).toBe(
      "2026-06-AgentProof-quick-diagnosis-storage-v1",
    );
  });
});
