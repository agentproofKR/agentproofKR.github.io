export type Persona = "practitioner" | "leader" | "security";

export type QuestionType = "single" | "multi" | "scale" | "yes_no";

export type SurveyAnswerValue = string | string[];
export type SurveyAnswerMap = Record<string, SurveyAnswerValue>;

export type SurveyOption = {
  value: string;
  label: string;
  score?: number | null;
};

export type SurveyQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  options: readonly SurveyOption[];
  scored: boolean;
  dimension?: string;
  maxSelections?: number;
  helpText?: string;
};

export type SurveyDefinition = {
  persona: Persona;
  title: string;
  description: string;
  questionCount: number;
  estimatedMinutes: string;
  dimensions: readonly string[];
  questions: readonly SurveyQuestion[];
};

export type ReadinessBand = {
  min: number;
  max: number;
  label: "기준 정립 필요" | "제한적 실험 적합" | "통제 기반 확대 준비" | "운영 고도화 단계";
  summary: string;
};

export type SurveyScoreResult = {
  persona: Persona;
  surveyVersion: string;
  scoringVersion: string;
  totalScore: number;
  band: ReadinessBand;
  effectiveBand: ReadinessBand;
  dimensionScores: Record<string, number>;
  riskFlags: string[];
  criticalWarnings: string[];
  informationGapQuestionIds: string[];
  excludedQuestionIds: string[];
  topRisks: string[];
  recommendedActions: string[];
  featureHypothesis: string;
};

export type ConsentState = {
  age14OrOlder: boolean;
  surveyProcessing: boolean;
  beta: boolean;
  interview: boolean;
  pilot: boolean;
};

export type ContactRequestType = "beta" | "interview" | "pilot";
