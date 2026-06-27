import { describe, expect, it } from "vitest";

import {
  calculateAssuranceResult,
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
      title: "당신의 AI,\n믿어도 되나요?",
      subcopy: "도입 전 · 무료 3초 진단",
      pill: "+ 받을 수 있는 지원금",
      cta: "무료 진단 시작",
    });
    expect(referenceDiagnosisScreens[1]).toMatchObject({
      title: "어떤 업무에\nAI를 도입하나요?",
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

  it("offers the four buyer-facing work options with stable keys", () => {
    expect(workOptions).toEqual([
      { value: "customer_reply", label: "고객 문의 응대" },
      { value: "document_generation", label: "문서 자동 작성" },
      { value: "recommendation", label: "상품·콘텐츠 추천" },
      { value: "payment_refund_review", label: "결제·환불 심사" },
    ]);
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
      },
    ],
    [
      "document_generation",
      {
        autonomy: "medium",
        behaviorLogging: true,
        humanReview: true,
        driftMonitoring: false,
      },
    ],
    [
      "recommendation",
      {
        autonomy: "medium",
        behaviorLogging: true,
        humanReview: false,
        driftMonitoring: true,
      },
    ],
    [
      "payment_refund_review",
      {
        autonomy: "high",
        behaviorLogging: false,
        humanReview: false,
        driftMonitoring: false,
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
  it("calculates the reference 64 point conditional GO case deterministically", () => {
    const result = calculateAssuranceResult("recommendation", {
      autonomy: "medium",
      behaviorLogging: false,
      humanReview: true,
      driftMonitoring: false,
    });

    expect(result).toMatchObject({
      score: 64,
      band: "conditional",
      bandLabel: "조건부 GO",
      dailyLeakageEstimate: "₩180만",
      subsidyEstimate: "~₩3,000만",
    });
  });

  it("uses the strongest payment refund risk line when review is missing", () => {
    const result = calculateAssuranceResult(
      "payment_refund_review",
      getDefaultControlState("payment_refund_review"),
    );

    expect(result.score).toBe(20);
    expect(result.band).toBe("hold");
    expect(result.bandLabel).toBe("도입 보류");
    expect(result.riskLine).toBe("사람 검토 없이 환불 자동 승인");
  });

  it("keeps low-risk document generation in immediate GO when controls are present", () => {
    const result = calculateAssuranceResult(
      "document_generation",
      getDefaultControlState("document_generation"),
    );

    expect(result.score).toBe(83);
    expect(result.band).toBe("go");
    expect(result.bandLabel).toBe("즉시 GO");
  });

  it("uses the reference scoring version", () => {
    expect(quickDiagnosisVersion).toBe(
      "2026-06-AgentProof-reference-six-screen-v1",
    );
  });
});
