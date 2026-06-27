import { describe, expect, it } from "vitest";

import {
  calculateAssuranceResult,
  getAdoptionScopeTitle,
  getDefaultControlState,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  workOptions,
  type ControlState,
  type WorkType,
} from "../../lib/survey/quickDiagnosis";

describe("reference six-screen diagnosis content", () => {
  it("uses the requested six-stage reference structure", () => {
    expect(referenceDiagnosisScreens.map((screen) => screen.id)).toEqual([
      "awareness",
      "work",
      "controls",
      "score",
      "validation",
      "monitoring",
    ]);
    expect(referenceDiagnosisScreens.map((screen) => screen.stageLabel)).toEqual([
      "시작",
      "업무",
      "진단",
      "리포트",
      "전환",
      "모니터링",
    ]);
  });

  it("keeps the reference baseline copy for each screen", () => {
    expect(referenceDiagnosisScreens[0]).toMatchObject({
      title: "AI,\n업무에 써도 될까?",
      subcopy: "무료 1분 체크",
      pill: "+ AI 도입 지원금",
      cta: "시작하기",
      trustNote: "연락처 입력 없음",
    });
    expect(referenceDiagnosisScreens[0]).not.toHaveProperty("previewTitle");
    expect(referenceDiagnosisScreens[0]).not.toHaveProperty("previewItems");
    expect(referenceDiagnosisScreens[1]).toMatchObject({
      title: "어떤 업무에\nAI를 쓸까요?",
      subcopy: "업무마다 확인할 기준이 달라요.",
      cta: "다음",
    });
    expect(referenceDiagnosisScreens[2]).toMatchObject({
      title: "통제 상태 진단",
      analysisText: "AI 분석 중 · 평균 3초",
      cta: "안심 점수 보기",
    });
    expect(referenceDiagnosisScreens[3]).toMatchObject({
      title: "안심 점수",
      riskTitle: "가장 위험한 한 줄",
      cta: "30일 업무 검증 문의하기",
    });
    expect(referenceDiagnosisScreens[4]).toMatchObject({
      title: "30일 업무 검증 문의",
      cta: "문의 보내기",
    });
    expect(referenceDiagnosisScreens[5]).toMatchObject({
      title: "모니터링",
      subcopy: "최근 8주 · 도입 후 상시 점검됨",
      alertTitle: "드리프트 감지",
      cta: "리포트 공유",
    });
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

  it("personalizes the adoption scope title from the selected work", () => {
    expect(getAdoptionScopeTitle("customer_reply")).toBe(
      "고객 답변에\nAI를 어디까지 쓸까요?",
    );
    expect(getAdoptionScopeTitle("grant_document")).toBe(
      "제출 문서에\nAI를 어디까지 쓸까요?",
    );
    expect(getAdoptionScopeTitle("business_document")).toBe(
      "문서 작성에\nAI를 어디까지 쓸까요?",
    );
    expect(getAdoptionScopeTitle("marketing_content")).toBe(
      "마케팅 콘텐츠에\nAI를 어디까지 쓸까요?",
    );
    expect(getAdoptionScopeTitle("unknown")).toBe(
      "먼저 어느 범위부터\n시작해볼까요?",
    );
  });
});

describe("reference control defaults", () => {
  it.each([
    [
      "customer_reply",
      {
        autonomy: "high",
        behaviorLogging: true,
        humanReview: false,
        driftMonitoring: true,
        riskLine: "사람 확인 없이 고객 답변 발송",
      },
    ],
    [
      "grant_document",
      {
        autonomy: "medium",
        behaviorLogging: false,
        humanReview: true,
        driftMonitoring: false,
        riskLine: "근거 확인 없이 제출 문서 작성",
      },
    ],
    [
      "business_document",
      {
        autonomy: "medium",
        behaviorLogging: true,
        humanReview: true,
        driftMonitoring: false,
        riskLine: "근거 부족한 보고 문장 사용",
      },
    ],
    [
      "marketing_content",
      {
        autonomy: "medium",
        behaviorLogging: true,
        humanReview: false,
        driftMonitoring: true,
        riskLine: "과장 표현이 외부에 노출",
      },
    ],
    [
      "unknown",
      {
        autonomy: "medium",
        behaviorLogging: false,
        humanReview: false,
        driftMonitoring: false,
        riskLine: "AI 사용 업무와 확인 기준이 불명확",
      },
    ],
  ] satisfies [WorkType, ControlState][])(
    "returns the requested default control state for %s",
    (workType, expected) => {
      expect(getDefaultControlState(workType)).toEqual(expected);
    },
  );
});

describe("reference assurance scoring", () => {
  it("calculates the requested work-risk weights deterministically", () => {
    const result = calculateAssuranceResult("marketing_content", {
      autonomy: "medium",
      behaviorLogging: false,
      humanReview: true,
      driftMonitoring: false,
      riskLine: "과장 표현이 외부에 노출",
    });

    expect(result).toMatchObject({
      score: 62,
      band: "conditional",
      bandLabel: "조건부 GO",
      riskLine: "과장 표현이 외부에 노출",
      dailyLeakageEstimate: "₩180만",
      subsidyEstimate: "~₩3,000만",
    });
  });

  it("uses the unknown-work risk line when the work is not selected", () => {
    const result = calculateAssuranceResult("unknown", getDefaultControlState("unknown"));

    expect(result.score).toBe(39);
    expect(result.band).toBe("hold");
    expect(result.bandLabel).toBe("도입 보류");
    expect(result.riskLine).toBe("AI 사용 업무와 확인 기준이 불명확");
  });

  it("keeps low-risk business documents in immediate GO when controls are present", () => {
    const result = calculateAssuranceResult(
      "business_document",
      getDefaultControlState("business_document"),
    );

    expect(result.score).toBe(81);
    expect(result.band).toBe("go");
    expect(result.bandLabel).toBe("즉시 GO");
  });

  it("uses the reference scoring version", () => {
    expect(quickDiagnosisVersion).toBe(
      "2026-06-AgentProof-reference-six-screen-v1",
    );
  });
});
