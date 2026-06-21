import { describe, expect, it } from "vitest";

import {
  getReadinessBand,
  getSurveyDefinition,
  scoreSurvey,
  type SurveyAnswerMap,
} from "../../lib/survey/scoring";

describe("role-based survey question definitions", () => {
  it("keeps the required question counts by persona", () => {
    expect(getSurveyDefinition("practitioner").questions).toHaveLength(24);
    expect(getSurveyDefinition("leader").questions).toHaveLength(25);
    expect(getSurveyDefinition("security").questions).toHaveLength(26);
  });

  it("keeps common segmentation questions out of scoring", () => {
    const practitioner = getSurveyDefinition("practitioner");
    const leader = getSurveyDefinition("leader");
    const segmentationIds = ["C01", "C02", "C03", "C04", "C05", "C06", "P07", "L22", "L23"];

    for (const id of segmentationIds) {
      const question =
        practitioner.questions.find((candidate) => candidate.id === id) ??
        leader.questions.find((candidate) => candidate.id === id);
      expect(question?.scored).toBe(false);
    }
  });
});

describe("deterministic survey scoring", () => {
  it("normalizes maturity scores by dimension and excludes not-applicable answers", () => {
    const answers: SurveyAnswerMap = {
      C04: "formal_some",
      P07: "mostly",
      P09: "established",
      P13: "not_applicable",
      P14: "mostly",
      P15: "partial",
      P16: "established",
      P17: "mostly",
      P18: "mostly",
      P19: "partial",
      P20: "mostly",
      P21: "none",
      P22: "mostly",
    };

    const result = scoreSurvey("practitioner", answers);

    expect(result.totalScore).toBeGreaterThanOrEqual(60);
    expect(result.dimensionScores["정책 인지도"]).toBeGreaterThanOrEqual(25);
    expect(result.informationGapQuestionIds).not.toContain("P13");
    expect(result.excludedQuestionIds).toContain("P13");
  });

  it("scores 모름 as zero and creates an information-gap flag", () => {
    const result = scoreSurvey("security", {
      C04: "unknown",
      S07: "unknown",
      S08: "unknown",
      S10: "unknown",
      S16: "unknown",
      S19: "unknown",
    });

    expect(result.totalScore).toBe(0);
    expect(result.informationGapQuestionIds).toEqual(
      expect.arrayContaining(["S07", "S08", "S10", "S16", "S19"]),
    );
    expect(result.informationGapQuestionIds).not.toContain("C04");
    expect(result.riskFlags).toContain("정보 공백: 모름 응답이 있어 추가 확인이 필요합니다.");
  });

  it("reverse-scores unsafe behavior and raises critical warnings", () => {
    const result = scoreSurvey("practitioner", {
      C04: "team",
      P09: "none",
      P11: ["personal_data", "confidential"],
      P16: "none",
      P18: "none",
    });

    expect(result.criticalWarnings).toEqual(
      expect.arrayContaining([
        "소비자용 AI에 개인정보 또는 기밀정보를 입력할 수 있습니다.",
        "외부 제출물이 사람 검토 없이 사용될 수 있습니다.",
        "질문·답변·행동 로그가 없습니다.",
      ]),
    );
    expect(result.effectiveBand.label).toBe("기준 정립 필요");
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
