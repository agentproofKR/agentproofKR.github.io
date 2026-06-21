"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { canSubmitSurvey, consentTextHashes, consentVersion } from "@/lib/survey/consent";
import { getSurveyDefinition } from "@/lib/survey/questions";
import { scoreSurvey } from "@/lib/survey/scoring";
import {
  getSurveySubmissionMode,
  submitSurveyToEndpoint,
  type SurveySubmissionMode,
  validateSurveySubmission,
} from "@/lib/survey/submission";
import type { ConsentState, Persona, SurveyAnswerMap, SurveyQuestion } from "@/lib/survey/types";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

type SurveyFlowProps = {
  persona: Persona;
};

type DraftState = {
  currentIndex: number;
  answers: SurveyAnswerMap;
  consents: ConsentState;
};

const emptyConsents: ConsentState = {
  age14OrOlder: false,
  surveyProcessing: false,
  beta: false,
  interview: false,
  pilot: false,
};

export function SurveyFlow({ persona }: SurveyFlowProps) {
  const definition = useMemo(() => getSurveyDefinition(persona), [persona]);
  const draftKey = `agentproof-survey-draft-${persona}`;
  const initialDraft = useMemo(() => readDraft(draftKey), [draftKey]);
  const [currentIndex, setCurrentIndex] = useState(initialDraft.currentIndex);
  const [answers, setAnswers] = useState<SurveyAnswerMap>(initialDraft.answers);
  const [consents, setConsents] = useState<ConsentState>(initialDraft.consents);
  const [phase, setPhase] = useState<"questions" | "confirm">("questions");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const currentQuestion = definition.questions[currentIndex];
  const submissionMode = getSurveySubmissionMode({
    publicApiUrl: process.env.NEXT_PUBLIC_SURVEY_API_URL,
  });

  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("survey_started", {
      persona,
      survey_version: "2026-06-21",
      question_count: definition.questionCount,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });

  }, [definition.questionCount, persona]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [currentIndex, phase]);

  const updateSingleAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setError("");
  };

  const updateMultiAnswer = (question: SurveyQuestion, value: string, checked: boolean) => {
    setAnswers((current) => {
      const existing = Array.isArray(current[question.id]) ? (current[question.id] as string[]) : [];
      const next = checked
        ? [...existing, value].slice(0, question.maxSelections ?? existing.length + 1)
        : existing.filter((item) => item !== value);
      return { ...current, [question.id]: next };
    });
    setError("");
  };

  const goNext = () => {
    if (!isAnswered(currentQuestion, answers[currentQuestion.id])) {
      setError("응답을 선택해주세요.");
      return;
    }

    if (currentIndex + 1 >= definition.questions.length) {
      setPhase("confirm");
      setError("");
      return;
    }

    setCurrentIndex((index) => index + 1);
    setError("");
  };

  const goPrevious = () => {
    if (phase === "confirm") {
      setPhase("questions");
      setError("");
      return;
    }
    setCurrentIndex((index) => Math.max(0, index - 1));
    setError("");
  };

  const submitForResult = async () => {
    const consentCheck = canSubmitSurvey(consents);
    if (!consentCheck.ok) {
      setError(`필수 동의: ${consentCheck.message}`);
      return;
    }

    const result = scoreSurvey(persona, answers);
    const stored = getStoredUtm(window.sessionStorage);
    const sessionId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const submission = validateSurveySubmission({
      sessionId,
      persona,
      surveyVersion: result.surveyVersion,
      scoringVersion: result.scoringVersion,
      idempotencyKey,
      honeypot: "",
      answers,
      result: {
        totalScore: result.totalScore,
        resultBand: result.effectiveBand.label,
        dimensionScores: result.dimensionScores,
        riskFlags: result.riskFlags,
      },
      consents: { ...consents, consentVersion, consentTextHashes },
      contacts: [],
      utm: stored,
    });

    if (submissionMode.mode === "live") {
      setIsSubmitting(true);
      const storageResult = await submitSurveyToEndpoint(submissionMode.endpoint, submission);
      setIsSubmitting(false);
      if (!storageResult.ok) {
        setError(storageResult.message);
        return;
      }
    }

    window.localStorage.removeItem("agentproof-survey-result");
    window.sessionStorage.setItem(
      "agentproof-survey-result",
      JSON.stringify({
        sessionId,
        persona,
        result,
        submissionMode,
        completedAt: new Date().toISOString(),
      }),
    );
    window.localStorage.removeItem(draftKey);
    trackEvent("survey_completed", {
      persona,
      survey_version: result.surveyVersion,
      question_count: definition.questionCount,
      completion_time_band: "7_10_min",
      result_band: result.effectiveBand.label,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    window.location.assign("/survey/result/");
  };

  if (phase === "confirm") {
    return (
      <main
        className={styles.page}
        data-testid="survey-shell"
        data-question-count={definition.questionCount}
      >
        <section className={styles.surveyPanel} aria-labelledby="confirm-title">
          <Link className={styles.backLink} href="/survey/">
            역할 다시 선택
          </Link>
          <p className={styles.eyebrow}>CONFIRMATION</p>
          <h1 id="confirm-title" ref={headingRef} tabIndex={-1}>
            제출 전 확인
          </h1>
          <p className={styles.lead}>
            결과는 즉시 계산되며, 이메일 입력 없이 기본 결과 확인 가능. 설문 답변은 URL에
            포함되지 않습니다.
          </p>
          <ConsentPanel consents={consents} onChange={setConsents} />
          <StorageNotice mode={submissionMode} />
          {error ? (
            <p className={styles.errorBox} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button className={styles.secondaryButton} type="button" onClick={goPrevious}>
              이전
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              data-testid="survey-result-submit"
              disabled={isSubmitting}
              onClick={submitForResult}
            >
              {isSubmitting ? "저장 중" : "결과 확인"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main
      className={styles.page}
      data-testid="survey-shell"
      data-question-count={definition.questionCount}
    >
      <section className={styles.surveyPanel} aria-labelledby="question-title">
        <Link className={styles.backLink} href="/survey/">
          역할 다시 선택
        </Link>
        <div className={styles.progressRow}>
          <span data-testid="survey-progress">
            {currentIndex + 1}/{definition.questionCount}
          </span>
          <span>{remainingMinutes(definition.questionCount, currentIndex)}분 남음</span>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ inlineSize: `${((currentIndex + 1) / definition.questionCount) * 100}%` }} />
        </div>
        <p className={styles.eyebrow}>{definition.title}</p>
        <fieldset className={styles.questionBox} data-testid="survey-question">
          <legend>
            <h1 id="question-title" ref={headingRef} tabIndex={-1}>
              {currentQuestion.text}
            </h1>
          </legend>
          {currentQuestion.helpText ? <p>{currentQuestion.helpText}</p> : null}
          <div className={styles.optionList}>
            {currentQuestion.options.map((option) => {
              const answer = answers[currentQuestion.id];
              const checked = Array.isArray(answer)
                ? answer.includes(option.value)
                : answer === option.value;
              const inputId = `${currentQuestion.id}-${option.value}`;
              return (
                <label className={styles.option} key={option.value} htmlFor={inputId}>
                  <input
                    id={inputId}
                    type={currentQuestion.type === "multi" ? "checkbox" : "radio"}
                    name={currentQuestion.id}
                    value={option.value}
                    checked={checked}
                    onChange={(event) => {
                      if (currentQuestion.type === "multi") {
                        updateMultiAnswer(currentQuestion, option.value, event.currentTarget.checked);
                      } else {
                        updateSingleAnswer(currentQuestion.id, option.value);
                      }
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          {currentQuestion.maxSelections ? (
            <p className={styles.fieldHint}>최대 {currentQuestion.maxSelections}개까지 선택할 수 있습니다.</p>
          ) : null}
        </fieldset>
        {error ? (
          <p className={styles.errorBox} role="alert">
            {error}
          </p>
        ) : null}
        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={goPrevious}
            disabled={currentIndex === 0}
          >
            이전
          </button>
          <button
            className={styles.primaryButton}
            type="button"
            data-testid="survey-continue"
            onClick={goNext}
          >
            계속
          </button>
        </div>
      </section>
    </main>
  );
}

function ConsentPanel({
  consents,
  onChange,
}: {
  consents: ConsentState;
  onChange: (value: ConsentState) => void;
}) {
  const setConsent = (key: keyof ConsentState, value: boolean) => {
    onChange({ ...consents, [key]: value });
  };

  return (
    <div className={styles.consentPanel}>
      <label>
        <input
          type="checkbox"
          data-testid="age-consent"
          checked={consents.age14OrOlder}
          onChange={(event) => setConsent("age14OrOlder", event.currentTarget.checked)}
        />
        <span>만 14세 이상입니다.</span>
      </label>
      <label>
        <input
          type="checkbox"
          data-testid="survey-processing-consent"
          checked={consents.surveyProcessing}
          onChange={(event) => setConsent("surveyProcessing", event.currentTarget.checked)}
        />
        <span>
          [필수] AgentProof 고객조사 및 서비스 개발을 위한 개인정보 수집·이용 동의
        </span>
      </label>
      <p>
        수집 항목은 역할, 조직 규모, 업종, AI 활용·도입 단계, 설문 응답, 세션 식별자,
        제출 시각, UTM입니다. 보유 기간은 제출일로부터 6개월입니다.
      </p>
    </div>
  );
}

function StorageNotice({ mode }: { mode: SurveySubmissionMode }) {
  if (mode.mode === "live") {
    return <p className={styles.successBox}>설문 저장소가 연결되어 있습니다.</p>;
  }
  return <p className={styles.warningBox}>{mode.message}</p>;
}

function isAnswered(question: SurveyQuestion, answer: string | string[] | undefined): boolean {
  if (Array.isArray(answer)) {
    return answer.length > 0 && (!question.maxSelections || answer.length <= question.maxSelections);
  }
  return typeof answer === "string" && answer.length > 0;
}

function remainingMinutes(total: number, currentIndex: number): number {
  return Math.max(1, Math.ceil((total - currentIndex - 1) * 0.35));
}

function readDraft(draftKey: string): DraftState {
  if (typeof window === "undefined") {
    return { currentIndex: 0, answers: {}, consents: emptyConsents };
  }

  window.localStorage.removeItem(draftKey);
  return { currentIndex: 0, answers: {}, consents: emptyConsents };
}
