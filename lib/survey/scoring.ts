import {
  getSurveyDefinition as getDefinition,
  scoringVersion,
  surveyVersion,
} from "./questions";
import type {
  Persona,
  ReadinessBand,
  SurveyAnswerMap,
  SurveyAnswerValue,
  SurveyQuestion,
  SurveyScoreResult,
} from "./types";

export type { SurveyAnswerMap };
export { getDefinition as getSurveyDefinition };

const readinessBands: readonly ReadinessBand[] = [
  {
    min: 0,
    max: 39,
    label: "기준 정립 필요",
    summary: "AI 활용 전 기본 기준과 책임 구조를 먼저 정리해야 합니다.",
  },
  {
    min: 40,
    max: 59,
    label: "제한적 실험 적합",
    summary: "작은 범위의 실험은 가능하지만 검토와 기록 기준이 필요합니다.",
  },
  {
    min: 60,
    max: 79,
    label: "통제 기반 확대 준비",
    summary: "통제 기준을 갖춘 상태에서 일부 업무 확장을 검토할 수 있습니다.",
  },
  {
    min: 80,
    max: 100,
    label: "운영 고도화 단계",
    summary: "정기 점검과 책임 구조를 바탕으로 운영 고도화를 검토할 수 있습니다.",
  },
];

export function getReadinessBand(score: number): ReadinessBand {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  return (
    readinessBands.find((band) => normalized >= band.min && normalized <= band.max) ??
    readinessBands[0]
  );
}

export function scoreSurvey(persona: Persona, answers: SurveyAnswerMap): SurveyScoreResult {
  const definition = getDefinition(persona);
  const dimensionTotals = new Map<string, { score: number; max: number }>();
  const informationGapQuestionIds: string[] = [];
  const excludedQuestionIds: string[] = [];

  for (const dimension of definition.dimensions) {
    dimensionTotals.set(dimension, { score: 0, max: 0 });
  }

  for (const question of definition.questions) {
    if (!question.scored || !question.dimension) {
      continue;
    }

    const answer = answers[question.id];
    const scored = scoreAnswer(question, answer);

    if (scored.kind === "missing") {
      continue;
    }
    if (scored.kind === "excluded") {
      excludedQuestionIds.push(question.id);
      continue;
    }
    if (scored.hasInformationGap) {
      informationGapQuestionIds.push(question.id);
    }

    const totals = dimensionTotals.get(question.dimension) ?? { score: 0, max: 0 };
    totals.score += scored.score;
    totals.max += 4;
    dimensionTotals.set(question.dimension, totals);
  }

  const dimensionScores = Object.fromEntries(
    [...dimensionTotals.entries()].map(([dimension, totals]) => [
      dimension,
      totals.max === 0 ? 0 : Math.round((totals.score / totals.max) * 100),
    ]),
  );
  const dimensionsWithScores = [...dimensionTotals.values()]
    .filter((totals) => totals.max > 0)
    .map((totals) => Math.round((totals.score / totals.max) * 100));
  const totalScore =
    dimensionsWithScores.length === 0
      ? 0
      : Math.round(
          dimensionsWithScores.reduce((sum, score) => sum + score, 0) / dimensionsWithScores.length,
        );
  const criticalWarnings = getCriticalWarnings(persona, answers);
  const riskFlags = [
    ...criticalWarnings,
    ...(informationGapQuestionIds.length > 0
      ? ["정보 공백: 모름 응답이 있어 추가 확인이 필요합니다."]
      : []),
    ...getDimensionRiskFlags(dimensionScores),
  ];
  const band = getReadinessBand(totalScore);
  const effectiveBand = criticalWarnings.length > 0 ? readinessBands[0] : band;

  return {
    persona,
    surveyVersion,
    scoringVersion,
    totalScore,
    band,
    effectiveBand,
    dimensionScores,
    riskFlags: unique(riskFlags).slice(0, 6),
    criticalWarnings,
    informationGapQuestionIds,
    excludedQuestionIds,
    topRisks: unique(riskFlags).slice(0, 3),
    recommendedActions: getRecommendedActions(persona, dimensionScores, criticalWarnings),
    featureHypothesis: getFeatureHypothesis(persona, dimensionScores),
  };
}

type AnswerScore =
  | { kind: "missing" }
  | { kind: "excluded" }
  | { kind: "scored"; score: number; hasInformationGap: boolean };

function scoreAnswer(question: SurveyQuestion, answer: SurveyAnswerValue | undefined): AnswerScore {
  if (answer === undefined || answer === "" || (Array.isArray(answer) && answer.length === 0)) {
    return { kind: "missing" };
  }

  const values = Array.isArray(answer) ? answer : [answer];
  if (values.every((value) => value === "not_applicable" || value === "prefer_not")) {
    return { kind: "excluded" };
  }

  const scoreValues = values
    .filter((value) => value !== "not_applicable" && value !== "prefer_not")
    .map((value) => question.options.find((option) => option.value === value)?.score)
    .filter((score): score is number => typeof score === "number");

  if (scoreValues.length === 0) {
    return { kind: "missing" };
  }

  return {
    kind: "scored",
    score: Math.min(...scoreValues),
    hasInformationGap: values.includes("unknown"),
  };
}

function getCriticalWarnings(persona: Persona, answers: SurveyAnswerMap): string[] {
  const warnings: string[] = [];
  const p11 = asArray(answers.P11);
  const c05 = asArray(answers.C05);

  if (
    persona === "practitioner" &&
    (p11.includes("personal_data") || p11.includes("confidential")) &&
    (answers.P09 === "no" || answers.P10 === "personal" || c05.includes("gen_ai"))
  ) {
    warnings.push("소비자용 AI에 개인정보 또는 기밀정보를 입력할 수 있습니다.");
  }

  if (answers.P16 === "none" || answers.L19 === "no") {
    warnings.push("외부 제출물이 사람 검토 없이 사용될 수 있습니다.");
  }

  if (answers.S08 === "none" || answers.S10 === "none" || answers.P09 === "no") {
    warnings.push("승인된 AI 목록 또는 사용정책이 없습니다.");
  }

  if (answers.S22 === "no") {
    warnings.push("행동 수행 Agent에 사람 승인 절차가 없습니다.");
  }

  if (answers.P18 === "none" || answers.S16 === "none") {
    warnings.push("질문·답변·행동 로그가 없습니다.");
  }

  if (answers.S19 === "unknown") {
    warnings.push("공급자의 모델 학습 또는 국외 이전 상태를 알 수 없습니다.");
  }

  return unique(warnings);
}

function getDimensionRiskFlags(dimensionScores: Record<string, number>): string[] {
  return Object.entries(dimensionScores)
    .filter(([, score]) => score < 40)
    .map(([dimension]) => `${dimension}: 기준 보완이 필요합니다.`);
}

function getRecommendedActions(
  persona: Persona,
  dimensionScores: Record<string, number>,
  criticalWarnings: string[],
): string[] {
  const lowestDimensions = Object.entries(dimensionScores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 2)
    .map(([dimension]) => `${dimension} 기준을 먼저 문서화하세요.`);
  const personaAction =
    persona === "practitioner"
      ? "외부 제출 전 사람 검토와 출처 확인 체크리스트를 적용하세요."
      : persona === "leader"
        ? "파일럿 범위, 통과 기준, 종료 조건을 한 페이지로 정리하세요."
        : "승인 도구 목록, 금지정보, 로그 보유 기간을 우선 확정하세요.";

  return unique([
    ...(criticalWarnings.length > 0 ? ["중요 경고 항목은 파일럿 전에 차단 기준으로 전환하세요."] : []),
    ...lowestDimensions,
    personaAction,
  ]).slice(0, 3);
}

function getFeatureHypothesis(persona: Persona, dimensionScores: Record<string, number>): string {
  const lowest = Object.entries(dimensionScores).sort(([, a], [, b]) => a - b)[0]?.[0];

  if (persona === "practitioner") {
    return `AgentProof는 ${lowest ?? "답변 신뢰성"}을 보완하는 업무별 안전 사용 체크리스트를 우선 제공해야 합니다.`;
  }
  if (persona === "leader") {
    return `AgentProof는 ${lowest ?? "업무 우선순위"}을 설명하는 도입 우선순위 리포트를 우선 제공해야 합니다.`;
  }
  return `AgentProof는 ${lowest ?? "정책 성숙도"}을 보완하는 AI 사용정책 스타터 체크리스트를 우선 제공해야 합니다.`;
}

function asArray(value: SurveyAnswerValue | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
