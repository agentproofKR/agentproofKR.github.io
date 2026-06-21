import {
  inferIntentFromAnswers,
  inferPersonaFromAnswers,
  getSurveyDefinition as getDefinition,
  getUnifiedSurveyDefinition,
  scoringVersion,
  surveyVersion,
} from "./questions";
import type {
  DisplayRiskBand,
  Persona,
  ReadinessBand,
  SurveyAnswerMap,
  SurveyAnswerValue,
  SurveyQuestion,
  SurveyScoreResult,
} from "./types";

export type { SurveyAnswerMap };
export {
  getDefinition as getSurveyDefinition,
  getUnifiedSurveyDefinition,
  inferPersonaFromAnswers,
};

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
  const displayRiskBand = getDisplayRiskBand(effectiveBand);
  const inferredPersona = inferPersonaFromAnswers(answers);
  const inferredIntent = inferIntentFromAnswers(answers);

  return {
    persona: inferredPersona,
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
    topRisks: unique([...riskFlags, ...getDefaultRiskReviewPrompts()]).slice(0, 3),
    recommendedActions: getRecommendedActions(persona, dimensionScores, criticalWarnings),
    featureHypothesis: getFeatureHypothesis(persona, dimensionScores),
    displayRiskBand,
    inferredIntent,
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

  if (answers.U06 === "customer_contract" || answers.U06 === "personal_confidential") {
    warnings.push("회사 자료나 고객 정보가 AI에 입력될 가능성이 있습니다.");
  }

  if (answers.U07 === "rarely" || answers.U07 === "no_standard") {
    warnings.push("AI 답변을 사람 검토 없이 사용할 수 있습니다.");
  }

  if (answers.U08 === "none" || answers.U08 === "verbal" || answers.U08 === "unknown") {
    warnings.push("승인된 AI 도구 목록이나 사용정책이 명확하지 않습니다.");
  }

  return unique(warnings);
}

function getDimensionRiskFlags(dimensionScores: Record<string, number>): string[] {
  return Object.entries(dimensionScores)
    .filter(([, score]) => score < 40)
    .map(([dimension]) => `${dimension}: 기준 보완이 필요합니다.`);
}

function getDefaultRiskReviewPrompts(): string[] {
  return [
    "AI에 입력하면 안 되는 회사 자료와 고객 정보를 먼저 정하세요.",
    "AI 답변을 외부 제출 전에 사람이 확인해야 하는 업무를 정하세요.",
    "회사에서 허용하는 AI 도구와 사용 기준을 확인하세요.",
  ];
}

function getRecommendedActions(
  persona: Persona,
  dimensionScores: Record<string, number>,
  criticalWarnings: string[],
): string[] {
  return unique([
    ...(criticalWarnings.length > 0
      ? ["AI에 입력하면 안 되는 정보 5가지를 정하세요."]
      : []),
    "외부 제출 전 사람이 반드시 확인해야 하는 업무를 정하세요.",
    persona === "leader"
      ? "AI를 먼저 도입할 업무 1개와 성공 기준을 정하세요."
      : persona === "security"
        ? "회사에서 허용하는 AI 도구 목록을 만드세요."
        : "AI 답변의 근거와 출처를 확인하는 체크리스트를 만드세요.",
    "회사에서 허용하는 AI 도구 목록을 만드세요.",
  ]).slice(0, 3);
}

function getFeatureHypothesis(persona: Persona, dimensionScores: Record<string, number>): string {
  const lowest = Object.entries(dimensionScores).sort(([, a], [, b]) => a - b)[0]?.[0];

  if (persona === "practitioner") {
    return `AgentProof는 답변 근거 확인, 위험 테스트, 승인 기록으로 ${lowest ?? "답변 검토 기준"}을 보완할 수 있습니다.`;
  }
  if (persona === "leader") {
    return `AgentProof는 도입 우선순위와 사람 검토 기준을 리포트로 정리해 ${lowest ?? "사용 기준 성숙도"}을 보완할 수 있습니다.`;
  }
  return `AgentProof는 금지 정보, 허용 도구, 승인 기록 기준을 정리해 ${lowest ?? "정보 입력 위험"}을 보완할 수 있습니다.`;
}

function getDisplayRiskBand(band: ReadinessBand): DisplayRiskBand {
  if (band.label === "기준 정립 필요") {
    return "즉시 점검 필요";
  }
  if (band.label === "제한적 실험 적합") {
    return "위험";
  }
  if (band.label === "통제 기반 확대 준비") {
    return "주의";
  }
  return "낮음";
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
