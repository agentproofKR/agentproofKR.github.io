import { z } from "zod";

import { consentVersion } from "./consent";
import { getSurveyDefinition, scoringVersion, surveyVersion } from "./questions";
import type { ContactRequestType, Persona, SurveyAnswerMap } from "./types";

export type SurveySubmissionMode =
  | { mode: "live"; endpoint: string }
  | { mode: "disabled"; message: string };

export type SurveyContactRequest = {
  requestType: ContactRequestType;
  email: string;
  company?: string;
  role?: string;
  preferredContactPurpose?: string;
  freeText?: string;
};

export type ValidSurveySubmission = {
  sessionId: string;
  persona: Persona;
  surveyVersion: string;
  scoringVersion: string;
  idempotencyKey: string;
  honeypot: string;
  answers: SurveyAnswerMap;
  result: {
    totalScore: number;
    resultBand: string;
    dimensionScores: Record<string, number>;
    riskFlags: string[];
  };
  consents: {
    age14OrOlder: boolean;
    surveyProcessing: boolean;
    beta: boolean;
    interview: boolean;
    pilot: boolean;
    consentVersion: string;
  };
  contacts: SurveyContactRequest[];
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };
};

const personaSchema = z.enum(["practitioner", "leader", "security"]);
const contactRequestSchema = z.object({
  requestType: z.enum(["beta", "interview", "pilot"]),
  email: z.string().trim().toLowerCase().email().max(254),
  company: optionalLimitedString(120),
  role: optionalLimitedString(80),
  preferredContactPurpose: optionalLimitedString(120),
  freeText: optionalLimitedString(300),
});

const submissionSchema = z.object({
  sessionId: z.string().trim().min(8).max(120),
  persona: personaSchema,
  surveyVersion: z.string().trim().min(1).default(surveyVersion),
  scoringVersion: z.string().trim().min(1).default(scoringVersion),
  idempotencyKey: z.string().trim().min(6).max(160),
  honeypot: z.string().max(120).optional().default(""),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  result: z.object({
    totalScore: z.number().min(0).max(100),
    resultBand: z.string().trim().min(1).max(60),
    dimensionScores: z.record(z.string(), z.number().min(0).max(100)),
    riskFlags: z.array(z.string().max(200)).max(12),
  }),
  consents: z.object({
    age14OrOlder: z.boolean(),
    surveyProcessing: z.boolean(),
    beta: z.boolean().default(false),
    interview: z.boolean().default(false),
    pilot: z.boolean().default(false),
    consentVersion: z.string().trim().min(1).default(consentVersion),
  }),
  contacts: z.array(contactRequestSchema).max(3).default([]),
  utm: z
    .object({
      source: optionalLimitedString(80),
      medium: optionalLimitedString(80),
      campaign: optionalLimitedString(120),
      content: optionalLimitedString(120),
    })
    .default({}),
});

export function getSurveySubmissionMode(config: {
  publicApiUrl?: string | null;
}): SurveySubmissionMode {
  const endpoint = config.publicApiUrl?.trim();
  if (!endpoint) {
    return {
      mode: "disabled",
      message: "설문 저장소가 아직 연결되지 않았습니다. 결과는 이 기기에만 표시됩니다.",
    };
  }
  return { mode: "live", endpoint };
}

export function validateSurveySubmission(input: unknown): ValidSurveySubmission {
  const parsed = submissionSchema.parse(input);

  if (parsed.honeypot.trim() !== "") {
    throw new Error("bot submission rejected");
  }
  if (!parsed.consents.age14OrOlder) {
    throw new Error("만 14세 이상 확인이 필요합니다.");
  }
  if (!parsed.consents.surveyProcessing) {
    throw new Error("필수 동의가 필요합니다.");
  }

  validateQuestionIds(parsed.persona, parsed.answers);

  return {
    ...parsed,
    honeypot: "",
    answers: sanitizeAnswers(parsed.answers),
    contacts: parsed.contacts.map((contact) => ({
      ...contact,
      company: stripTags(contact.company),
      role: stripTags(contact.role),
      preferredContactPurpose: stripTags(contact.preferredContactPurpose),
      freeText: stripTags(contact.freeText),
    })),
  };
}

export class MockSurveySubmissionStore {
  private readonly submissionsByKey = new Map<string, ValidSurveySubmission>();

  async submit(
    submission: ValidSurveySubmission,
  ): Promise<{ status: "stored" | "duplicate"; sessionId: string }> {
    const existing = this.submissionsByKey.get(submission.idempotencyKey);
    if (existing) {
      return { status: "duplicate", sessionId: existing.sessionId };
    }
    this.submissionsByKey.set(submission.idempotencyKey, submission);
    return { status: "stored", sessionId: submission.sessionId };
  }
}

function validateQuestionIds(persona: Persona, answers: SurveyAnswerMap): void {
  const definition = getSurveyDefinition(persona);
  const allowed = new Map(definition.questions.map((question) => [question.id, question]));

  for (const [questionId, answer] of Object.entries(answers)) {
    const question = allowed.get(questionId);
    if (!question) {
      throw new Error(`invalid question id: ${questionId}`);
    }

    const values = Array.isArray(answer) ? answer : [answer];
    const allowedValues = new Set(question.options.map((option) => option.value));
    for (const value of values) {
      if (!allowedValues.has(value)) {
        throw new Error(`invalid answer for question ${questionId}`);
      }
    }

    if (question.type === "multi" && question.maxSelections && values.length > question.maxSelections) {
      throw new Error(`question ${questionId} allows at most ${question.maxSelections} selections`);
    }
  }
}

function sanitizeAnswers(answers: SurveyAnswerMap): SurveyAnswerMap {
  return Object.fromEntries(
    Object.entries(answers).map(([questionId, answer]) => [
      questionId,
      Array.isArray(answer) ? answer.map(stripTagsFromValue) : stripTagsFromValue(answer),
    ]),
  );
}

function stripTagsFromValue(value: string): string {
  return value.replace(/[<>]/g, "").trim();
}

function stripTags(value: string | undefined): string | undefined {
  return value?.replace(/[<>]/g, "").trim() || undefined;
}

function optionalLimitedString(max: number) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max, `최대 ${max}자까지 입력할 수 있습니다.`).optional(),
  );
}
