"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { canSubmitSurvey, consentTextHashes, consentVersion } from "@/lib/survey/consent";
import { getSurveyDefinition, inferPersonaFromAnswers } from "@/lib/survey/questions";
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
  legalOperatorName: string | null;
};

type DraftState = {
  currentIndex: number;
  answers: SurveyAnswerMap;
  consents: ConsentState;
};

type SurveyPhase = "consent" | "questions" | "confirm";

const emptyConsents: ConsentState = {
  age14OrOlder: false,
  surveyProcessing: false,
  beta: false,
  interview: false,
  pilot: false,
};

export function SurveyFlow({ persona, legalOperatorName }: SurveyFlowProps) {
  const definition = useMemo(() => getSurveyDefinition(persona), [persona]);
  const draftKey = `agentproof-survey-draft-${persona}`;
  const initialDraft = useMemo(() => readDraft(draftKey), [draftKey]);
  const [currentIndex, setCurrentIndex] = useState(initialDraft.currentIndex);
  const [answers, setAnswers] = useState<SurveyAnswerMap>(initialDraft.answers);
  const [consents, setConsents] = useState<ConsentState>(initialDraft.consents);
  const [phase, setPhase] = useState<SurveyPhase>("consent");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const currentQuestion = definition.questions[currentIndex];
  const submissionMode = getSurveySubmissionMode({
    publicApiUrl: process.env.NEXT_PUBLIC_SURVEY_API_URL,
    legalOperatorName,
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

    trackEvent("survey_core_started", {
      entry_persona: persona,
      survey_version: "2026-06-21",
      question_count: definition.questionCount,
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

  const beginSurvey = () => {
    const consentCheck = canSubmitSurvey(consents);
    if (!consentCheck.ok) {
      setError(`필수 동의: ${consentCheck.message}`);
      return;
    }

    setPhase("questions");
    setError("");
  };

  const goNext = () => {
    if (!isAnswered(currentQuestion, answers[currentQuestion.id])) {
      setError("답변을 선택해주세요.");
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
    if (phase === "questions" && currentIndex === 0) {
      setPhase("consent");
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

    const inferredPersona = inferPersonaFromAnswers(answers);
    const result = scoreSurvey(inferredPersona, answers);
    const stored = getStoredUtm(window.sessionStorage);
    const sessionId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const submission = validateSurveySubmission({
      sessionId,
      persona: inferredPersona,
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
        persona: inferredPersona,
        result,
        submissionMode,
        completedAt: new Date().toISOString(),
      }),
    );
    window.localStorage.removeItem(draftKey);
    trackEvent("survey_completed", {
      persona: inferredPersona,
      survey_version: result.surveyVersion,
      question_count: definition.questionCount,
      completion_time_band: "under_3_min",
      result_band: result.displayRiskBand,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    window.location.assign("/survey/result/");
  };

  if (phase === "consent") {
    return (
      <main
        className={styles.page}
        data-testid="survey-shell"
        data-question-count={definition.questionCount}
      >
        <section
          className={styles.surveyPanel}
          data-testid="survey-consent-step"
          aria-labelledby="consent-title"
        >
          <Link className={styles.backLink} href="/survey/">
            설문 소개로 돌아가기
          </Link>
          <p className={styles.eyebrow}>3분 AI 안전 체크</p>
          <h1 id="consent-title" ref={headingRef} tabIndex={-1}>
            결과를 보여주기 위한 확인입니다
          </h1>
          <p className={styles.lead}>
            이름, 전화번호, 회사 기밀은 묻지 않습니다.
            <br />
            이메일은 마지막에만 선택합니다.
          </p>
          <ConsentPanel consents={consents} onChange={setConsents} />
          <StorageNotice mode={submissionMode} />
          <p className={styles.policyLink}>
            <Link href="/privacy/">자세한 개인정보 안내 보기</Link>
          </p>
          {error ? (
            <p className={styles.errorBox} role="alert">
              {error}
            </p>
          ) : null}
          <div className={styles.actions}>
            <button
              className={styles.primaryButton}
              type="button"
              data-testid="survey-consent-continue"
              onClick={beginSurvey}
            >
              동의하고 시작하기
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "confirm") {
    return (
      <main
        className={styles.page}
        data-testid="survey-shell"
        data-question-count={definition.questionCount}
      >
        <section className={styles.surveyPanel} aria-labelledby="confirm-title">
          <Link className={styles.backLink} href="/survey/">
            설문 소개로 돌아가기
          </Link>
          <p className={styles.eyebrow}>제출 전 확인</p>
          <h1 id="confirm-title" ref={headingRef} tabIndex={-1}>
            이제 결과를 볼까요?
          </h1>
          <p className={styles.lead}>
            결과는 바로 계산됩니다. 설문 답변은 URL에 담기지 않고, 이메일도 묻지 않습니다.
          </p>
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
              {isSubmitting ? "저장 중" : "결과 보기"}
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
          설문 소개로 돌아가기
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
        <span>답변을 결과 계산에 사용하는 데 동의합니다.</span>
      </label>
      <p>
        수집 항목은 설문 답변, 결과 점수, 제출 시각, UTM입니다. 이름, 전화번호,
        회사명, 고객명, 회사 기밀은 묻지 않습니다. 설문 답변은 6개월 보관합니다.
      </p>
    </div>
  );
}

function StorageNotice({ mode }: { mode: SurveySubmissionMode }) {
  if (mode.mode === "live") {
    return <p className={styles.infoBox}>설문 저장소가 연결되어 있으며 제출 후 저장됩니다.</p>;
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
