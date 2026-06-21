import { describe, expect, it } from "vitest";

import {
  inferPersonaFromAnswers,
  getReadinessBand,
  getSurveyDefinition,
  getUnifiedSurveyDefinition,
  scoreSurvey,
  type SurveyAnswerMap,
} from "../../lib/survey/scoring";

describe("unified survey question definitions", () => {
  it("uses one 10-question core survey for every visible entry point", () => {
    const unified = getUnifiedSurveyDefinition();

    expect(unified.questions).toHaveLength(10);
    expect(getSurveyDefinition("practitioner").questions).toHaveLength(10);
    expect(getSurveyDefinition("leader").questions).toHaveLength(10);
    expect(getSurveyDefinition("security").questions).toHaveLength(10);
    expect(unified.estimatedMinutes).toBe("약 3분");
  });

  it("infers persona from situation and concern answers", () => {
    expect(inferPersonaFromAnswers({ U01: "direct_user" })).toBe("practitioner");
    expect(inferPersonaFromAnswers({ U01: "adoption_owner" })).toBe("leader");
    expect(inferPersonaFromAnswers({ U01: "security_owner" })).toBe("security");
    expect(inferPersonaFromAnswers({ U05: "effect_cost" })).toBe("leader");
    expect(inferPersonaFromAnswers({ U05: "data_leak" })).toBe("security");
    expect(inferPersonaFromAnswers({ U05: "wrong_answer" })).toBe("practitioner");
  });

  it("keeps segmentation questions out of scoring", () => {
    const unified = getUnifiedSurveyDefinition();
    const segmentationIds = ["U01", "U02", "U03", "U04", "U09", "U10"];

    expect(
      unified.questions
        .filter((question) => segmentationIds.includes(question.id))
        .every((question) => question.scored === false),
    ).toBe(true);
  });
});

describe("deterministic survey scoring", () => {
  it("normalizes maturity scores by dimension and excludes not-applicable answers", () => {
    const answers: SurveyAnswerMap = {
      U01: "direct_user",
      U02: "51_300",
      U03: ["gen_ai", "copilot"],
      U04: ["documents", "research"],
      U05: "source_check",
      U06: "public_only",
      U07: "important_only",
      U08: "partial",
      U09: "checklist",
      U10: "result_only",
    };

    const result = scoreSurvey("practitioner", answers);

    expect(result.totalScore).toBeGreaterThanOrEqual(60);
    expect(result.dimensionScores["정보 입력 위험"]).toBeGreaterThanOrEqual(75);
    expect(result.displayRiskBand).toBe("주의");
    expect(result.inferredIntent).toBe("trust");
  });

  it("scores 모름 as zero and creates an information-gap flag", () => {
    const result = scoreSurvey("security", {
      U01: "unclear",
      U05: "unknown_usage",
      U06: "unknown",
      U07: "unknown",
      U08: "unknown",
    });

    expect(result.totalScore).toBe(0);
    expect(result.informationGapQuestionIds).toEqual(
      expect.arrayContaining(["U06", "U07", "U08"]),
    );
    expect(result.riskFlags).toContain("정보 공백: 모름 응답이 있어 추가 확인이 필요합니다.");
    expect(result.displayRiskBand).toBe("즉시 점검 필요");
  });

  it("reverse-scores unsafe behavior and raises critical warnings", () => {
    const result = scoreSurvey("practitioner", {
      U01: "direct_user",
      U05: "data_leak",
      U06: "personal_confidential",
      U07: "rarely",
      U08: "none",
    });

    expect(result.criticalWarnings).toEqual(
      expect.arrayContaining([
        "회사 자료나 고객 정보가 AI에 입력될 가능성이 있습니다.",
        "AI 답변을 사람 검토 없이 사용할 수 있습니다.",
        "승인된 AI 도구 목록이나 사용정책이 명확하지 않습니다.",
      ]),
    );
    expect(result.effectiveBand.label).toBe("기준 정립 필요");
    expect(result.displayRiskBand).toBe("즉시 점검 필요");
  });

  it("always returns three visible risk review prompts for the report", () => {
    const result = scoreSurvey("practitioner", {
      U01: "direct_user",
      U05: "source_check",
      U06: "public_only",
      U07: "always",
      U08: "clear",
    });

    expect(result.topRisks).toHaveLength(3);
    expect(result.topRisks.every((risk) => risk.length > 0)).toBe(true);
  });

  it("maps all readiness bands", () => {
    expect(getReadinessBand(0).label).toBe("기준 정립 필요");
    expect(getReadinessBand(39).label).toBe("기준 정립 필요");
    expect(getReadinessBand(40).label).toBe("제한적 실험 적합");
    expect(getReadinessBand(60).label).toBe("통제 기반 확대 준비");
    expect(getReadinessBand(80).label).toBe("운영 고도화 단계");
    expect(getReadinessBand(100).label).toBe("운영 고도화 단계");
  });
});
