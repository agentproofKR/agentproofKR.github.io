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
type PersonalInfo = {
  name: string;
  contact: string;
  consentChoice: "" | "agree" | "disagree";
};

const emptyConsents: ConsentState = {
  age14OrOlder: false,
  surveyProcessing: false,
  personalInfoCollection: false,
  beta: false,
  interview: false,
  pilot: false,
};

const emptyPersonalInfo: PersonalInfo = {
  name: "",
  contact: "",
  consentChoice: "",
};

export function SurveyFlow({ persona, legalOperatorName }: SurveyFlowProps) {
  const definition = useMemo(() => getSurveyDefinition(persona), [persona]);
  const draftKey = `agentproof-survey-draft-${persona}`;
  const initialDraft = useMemo(() => readDraft(draftKey), [draftKey]);
  const [currentIndex, setCurrentIndex] = useState(initialDraft.currentIndex);
  const [answers, setAnswers] = useState<SurveyAnswerMap>(initialDraft.answers);
  const [consents, setConsents] = useState<ConsentState>(initialDraft.consents);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(emptyPersonalInfo);
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
    const personalInfoCheck = validatePersonalInfo(personalInfo);
    if (!personalInfoCheck.ok) {
      setError(personalInfoCheck.message);
      return;
    }

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
      contacts: [
        {
          requestType: "survey_followup",
          name: personalInfo.name,
          contact: personalInfo.contact,
          preferredContactPurpose: "AI 안전 체크 결과 안내 및 후속 연락",
        },
      ],
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
            개인정보 수집 및 이용에 동의해주세요
          </h1>
          <p className={styles.lead}>
            AI 안전 체크 결과 안내를 위해 성명과 연락처를 받습니다.
            <br />
            회사 기밀이나 실제 업무 자료는 입력하지 마세요.
          </p>
          <PersonalInfoPanel
            personalInfo={personalInfo}
            onPersonalInfoChange={setPersonalInfo}
            consents={consents}
            onConsentChange={setConsents}
          />
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
            답변을 바탕으로 결과를 계산합니다
          </h1>
          <p className={styles.lead}>
            입력한 답변으로 위험 신호와 다음 할 일을 정리합니다.
            <br />
            이메일 입력 없이 바로 확인할 수 있습니다.
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

function PersonalInfoPanel({
  personalInfo,
  onPersonalInfoChange,
  consents,
  onConsentChange,
}: {
  personalInfo: PersonalInfo;
  onPersonalInfoChange: (value: PersonalInfo) => void;
  consents: ConsentState;
  onConsentChange: (value: ConsentState) => void;
}) {
  const setPersonalInfo = (key: keyof PersonalInfo, value: string) => {
    onPersonalInfoChange({ ...personalInfo, [key]: value });
  };
  const setConsent = (key: keyof ConsentState, value: boolean) => {
    onConsentChange({ ...consents, [key]: value });
  };
  const setPersonalConsent = (value: "agree" | "disagree") => {
    onPersonalInfoChange({ ...personalInfo, consentChoice: value });
    onConsentChange({ ...consents, personalInfoCollection: value === "agree" });
  };

  return (
    <div className={styles.consentPanel}>
      <div className={styles.personalInfoGrid}>
        <label>
          <span>성명</span>
          <input
            type="text"
            value={personalInfo.name}
            maxLength={50}
            autoComplete="name"
            onChange={(event) => setPersonalInfo("name", event.currentTarget.value)}
          />
        </label>
        <label>
          <span>연락처</span>
          <input
            type="text"
            value={personalInfo.contact}
            maxLength={80}
            autoComplete="email tel"
            placeholder="이메일 또는 전화번호"
            onChange={(event) => setPersonalInfo("contact", event.currentTarget.value)}
          />
        </label>
      </div>
      <section className={styles.privacyConsentBox} aria-labelledby="personal-info-consent-title">
        <h2 id="personal-info-consent-title">개인정보 수집 및 이용 동의</h2>
        <p>
          AgentProof는 개인정보보호법 제15조에 따라 AI 안전 체크 결과 안내와 후속 연락을 위해
          개인정보 수집 및 이용 동의를 받고 있습니다. 수집한 개인정보는 아래 목적 외 다른
          용도로 이용하지 않습니다. 귀하는 동의하지 않을 권리가 있습니다. 다만, 동의하지
          않을 경우 AI 안전 체크 참여와 결과 안내가 제한됩니다.
        </p>
        <dl>
          <div>
            <dt>개인정보 수집 항목</dt>
            <dd>성명, 연락처</dd>
          </div>
          <div>
            <dt>개인정보 이용 목적</dt>
            <dd>AI 안전 체크 결과 안내 및 후속 연락</dd>
          </div>
          <div>
            <dt>개인정보 보유 및 이용 기간</dt>
            <dd>수집 후 2개월</dd>
          </div>
        </dl>
        <div className={styles.radioGroup} role="radiogroup" aria-label="개인정보 수집 및 이용 동의">
          <label>
            <input
              type="radio"
              name="personalInfoCollection"
              value="agree"
              checked={personalInfo.consentChoice === "agree"}
              onChange={() => setPersonalConsent("agree")}
            />
            <span>동의합니다</span>
          </label>
          <label>
            <input
              type="radio"
              name="personalInfoCollection"
              value="disagree"
              checked={personalInfo.consentChoice === "disagree"}
              onChange={() => setPersonalConsent("disagree")}
            />
            <span>동의하지 않습니다</span>
          </label>
        </div>
      </section>
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
        <span>답변과 결과 점수를 설문 운영에 사용하는 데 동의합니다.</span>
      </label>
      <p>
        회사 기밀, 고객명, 실제 업무 문서 내용은 입력하지 마세요.
      </p>
    </div>
  );
}

function StorageNotice({ mode }: { mode: SurveySubmissionMode }) {
  if (mode.mode === "live") {
    return <p className={styles.infoBox}>결과 계산을 위해 답변과 점수만 저장합니다.</p>;
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

function validatePersonalInfo(personalInfo: PersonalInfo): { ok: true } | { ok: false; message: string } {
  const name = personalInfo.name.trim();
  const contact = personalInfo.contact.trim();
  if (name.length < 2) {
    return { ok: false, message: "성명을 2자 이상 입력해주세요." };
  }
  if (contact.length < 5) {
    return { ok: false, message: "연락처를 입력해주세요." };
  }
  if (/[<>]/.test(name) || /[<>]/.test(contact)) {
    return { ok: false, message: "성명과 연락처에는 꺾쇠괄호를 입력할 수 없습니다." };
  }
  if (personalInfo.consentChoice !== "agree") {
    return { ok: false, message: "개인정보 수집 및 이용에 동의해야 시작할 수 있습니다." };
  }
  return { ok: true };
}
