import { describe, expect, it } from "vitest";

import {
  adoptionPurposeOptions,
  buildAdoptionReport,
  formatResultSummary,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  usageScopeOptions,
  workNatureOptions,
  workOptions,
  workRisk,
  type AdoptionPurpose,
  type UsageScope,
  type WorkNature,
  type WorkType,
} from "../../lib/survey/quickDiagnosis";

describe("AI adoption mini-report flow content", () => {
  it("uses PAGE1 + four simple choice steps + result", () => {
    expect(referenceDiagnosisScreens.map((screen) => screen.id)).toEqual([
      "awareness",
      "work",
      "purpose",
      "nature",
      "scope",
      "result",
    ]);
    expect(referenceDiagnosisScreens.map((screen) => screen.stageLabel)).toEqual([
      "시작",
      "업무",
      "목적",
      "성격",
      "범위",
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

  it("offers the five practical work options with stable keys", () => {
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

  it("uses purpose, nature, and usage scope instead of technical controls", () => {
    expect(referenceDiagnosisScreens[2]).toMatchObject({
      title: "AI로 무엇을\n얻고 싶나요?",
      subcopy: "가장 가까운 이유를 골라주세요.",
      cta: "다음",
    });
    expect(referenceDiagnosisScreens[3]).toMatchObject({
      title: "이 업무는\n어떤 성격인가요?",
      subcopy: "성격에 따라 판단 기준이 달라집니다.",
      cta: "다음",
    });
    expect(referenceDiagnosisScreens[4]).toMatchObject({
      title: "AI에게 어디까지\n맡길까요?",
      subcopy: "처음엔 작게 시작하는 편이 안전합니다.",
      cta: "결과 보기",
    });
    expect(adoptionPurposeOptions.map((option) => option.value)).toEqual([
      "save_time",
      "first_draft",
      "reduce_mistakes",
      "improve_quality",
      "find_use_case",
    ]);
    expect(workNatureOptions.map((option) => option.value)).toEqual([
      "repetitive",
      "important_low_frequency",
      "external_output",
      "internal_decision",
      "unclear",
    ]);
    expect(usageScopeOptions.map((option) => option.value)).toEqual([
      "idea_only",
      "draft_only",
      "reviewed_use",
      "partial_automation",
      "unknown",
    ]);

    const visibleCopy = JSON.stringify({
      referenceDiagnosisScreens,
      adoptionPurposeOptions,
      workNatureOptions,
      usageScopeOptions,
    });
    expect(visibleCopy).not.toMatch(/통제 진단|자율성|행동 로그|드리프트|HITL/);
  });
});

describe("adoption mini-report logic", () => {
  it.each([
    {
      input: {
        workType: "customer_reply",
        purpose: "save_time",
        nature: "repetitive",
        scope: "reviewed_use",
      },
      expected: {
        headline: "고객 문의 응대부터\n시작해보세요",
        expectedValueCopy: "반복 업무 시간을 줄이는 데 초점을 둡니다.",
        method: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
        reviewPoints: ["개인정보", "환불·계약", "고객 불만"],
        pilotItems: ["실제 절감 시간", "반복 처리 건수", "수정이 필요한 결과 비율"],
        pilotSize: "문의 20건 기준",
        timeEstimate: "월 4~12시간",
      },
    },
    {
      input: {
        workType: "grant_document",
        purpose: "first_draft",
        nature: "important_low_frequency",
        scope: "draft_only",
      },
      expected: {
        headline: "사업계획서 작성부터\n시작해보세요",
        expectedValueCopy: "첫 초안을 빠르게 만들고 시작 부담을 줄입니다.",
        method: "AI는 초안 작성까지 사용하고, 담당자가 수정하세요.",
        reviewPoints: ["성과 수치", "근거 문장", "제출 전 최종 검토"],
        pilotItems: ["초안 작성 시간", "수정이 필요한 문장 비율", "최종 사용 가능 비율"],
        pilotSize: "문서 3~5건 기준",
        timeEstimate: null,
      },
    },
    {
      input: {
        workType: "business_document",
        purpose: "reduce_mistakes",
        nature: "internal_decision",
        scope: "reviewed_use",
      },
      expected: {
        headline: "보고서·문서 작성부터\n시작해보세요",
        expectedValueCopy: "누락과 실수를 줄이는 기준을 만들 수 있습니다.",
        method: "AI 결과를 담당자가 확인한 뒤 사용하세요.",
        reviewPoints: ["수치 근거", "외부 공유", "예산·계약 문장"],
        pilotItems: ["누락된 항목 수", "사람이 고친 부분", "확인이 필요한 유형"],
        pilotSize: "문서 5건 기준",
        timeEstimate: null,
      },
    },
    {
      input: {
        workType: "marketing_content",
        purpose: "improve_quality",
        nature: "external_output",
        scope: "draft_only",
      },
      expected: {
        headline: "마케팅 콘텐츠부터\n시작해보세요",
        expectedValueCopy: "문장·구성·표현을 다듬는 데 도움이 됩니다.",
        method: "AI는 초안 작성까지 사용하고, 담당자가 수정하세요.",
        reviewPoints: ["과장 표현", "가격·효과", "고객 오해"],
        pilotItems: ["표현 수정 비율", "최종 결과물 만족도", "다시 사용할 수 있는 문장 유형"],
        pilotSize: "콘텐츠 10건 기준",
        timeEstimate: null,
      },
    },
    {
      input: {
        workType: "unknown",
        purpose: "find_use_case",
        nature: "unclear",
        scope: "unknown",
      },
      expected: {
        headline: "부담이 낮은 업무부터\n정해보세요",
        expectedValueCopy: "어디부터 시작할지 정하는 데 도움이 됩니다.",
        method: "먼저 작은 업무 1개에서 초안 작성부터 시작하세요.",
        reviewPoints: ["개인정보", "외부 전달", "금액·계약"],
        pilotItems: ["가장 효과가 큰 업무", "위험이 낮은 업무", "계속 쓸 수 있는 업무"],
        pilotSize: "작은 업무 1개 기준",
        timeEstimate: null,
      },
    },
  ] satisfies {
    input: {
      workType: WorkType;
      purpose: AdoptionPurpose;
      nature: WorkNature;
      scope: UsageScope;
    };
    expected: {
      headline: string;
      expectedValueCopy: string;
      method: string;
      reviewPoints: string[];
      pilotItems: string[];
      pilotSize: string;
      timeEstimate: string | null;
    };
  }[])("builds the requested report for $input.workType", ({ input, expected }) => {
    const report = buildAdoptionReport(input);

    expect(report.headline).toBe(expected.headline);
    expect(report.expectedValueCopy).toBe(expected.expectedValueCopy);
    expect(report.method).toBe(expected.method);
    expect(report.reviewPoints).toEqual(expected.reviewPoints);
    expect(report.pilotItems).toEqual(expected.pilotItems);
    expect(report.pilotSize).toBe(expected.pilotSize);
    expect(report.timeEstimate).toBe(expected.timeEstimate);
    expect(report.supportNote).toBe(
      "AI 도입 필요성, 적용 업무, 검증 계획을 정리할 수 있습니다.",
    );
    expect(report.supportNote).not.toMatch(
      /지원금 보장|받을 수 있는 금액|정부지원금 확정|최대 지원금|지원금 수령 가능|선정 보장/,
    );
  });

  it("formats the copy-to-clipboard summary in the requested structure", () => {
    const report = buildAdoptionReport({
      workType: "customer_reply",
      purpose: "save_time",
      nature: "repetitive",
      scope: "reviewed_use",
    });

    expect(formatResultSummary(report)).toBe(
      [
        "AgentProof AI 도입 간단 점검 결과",
        "",
        "추천 업무: 고객 문의 응대",
        "도입 목적: 시간을 줄이고 싶어요",
        "업무 성격: 자주 반복됩니다",
        "권장 방식: AI 결과를 담당자가 확인한 뒤 사용하세요.",
        "",
        "기대효과:",
        "반복 업무 시간을 줄이는 데 초점을 둡니다.",
        "",
        "사람이 봐야 하는 경우:",
        "",
        "- 개인정보",
        "- 환불·계약",
        "- 고객 불만",
        "",
        "30일 파일럿에서 확인할 것:",
        "",
        "- 실제 절감 시간",
        "- 반복 처리 건수",
        "- 수정이 필요한 결과 비율",
        "",
        "지원사업 준비 자료로 활용할 수 있습니다.",
      ].join("\n"),
    );
    expect(formatResultSummary(report)).not.toMatch(
      /지원금 보장|받을 수 있는 금액|정부지원금 확정|최대 지원금|지원금 수령 가능|선정 보장/,
    );
  });

  it("uses the updated quick diagnosis version", () => {
    expect(quickDiagnosisVersion).toBe(
      "2026-06-AgentProof-adoption-mini-report-v2",
    );
  });
});
