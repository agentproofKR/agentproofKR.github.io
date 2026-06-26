"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SurveyHeader } from "@/components/survey/SurveyHeader";
import { trackEvent } from "@/lib/analytics";
import {
  calculateQuickDiagnosisResult,
  quickDiagnosisSteps,
  quickDiagnosisVersion,
  workspaceMap,
  type QuickDiagnosisAnswers,
  type QuickDiagnosisAudience,
  type QuickDiagnosisConcern,
  type QuickDiagnosisJob,
  type QuickDiagnosisPersona,
  type QuickDiagnosisResult,
  type QuickDiagnosisReview,
  type QuickDiagnosisStep,
} from "@/lib/survey/quickDiagnosis";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

type AnswerStepId = Exclude<QuickDiagnosisStep["id"], "intro">;
type StepValue =
  | QuickDiagnosisPersona
  | QuickDiagnosisJob
  | QuickDiagnosisAudience
  | QuickDiagnosisConcern
  | QuickDiagnosisReview;

const answerSteps = quickDiagnosisSteps.slice(1) as readonly Extract<
  QuickDiagnosisStep,
  { id: AnswerStepId }
>[];

const progressLabels = [
  "시작",
  "입장 선택",
  "맡겨볼 일 선택",
  "누가 보는지 선택",
  "걱정되는 점 선택",
  "확인 방식 선택",
  "결과",
] as const;

const resultHeadlines: Record<QuickDiagnosisResult["band"], string> = {
  ready: "작게 시작하기 좋아 보여요.",
  conditional: "작게 시작해도 됩니다.",
  needs_verification: "먼저 몇 번 써보고 판단하는 게 좋아요.",
  hold: "기준을 먼저 잡는 게 좋아 보여요.",
};

export function QuickDiagnosisPage() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuickDiagnosisAnswers>>({});
  const [completedAnswers, setCompletedAnswers] =
    useState<QuickDiagnosisAnswers | null>(null);
  const currentStep = answerSteps[currentIndex];
  const result = useMemo(
    () =>
      completedAnswers
        ? calculateQuickDiagnosisResult(completedAnswers)
        : null,
    [completedAnswers],
  );

  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_view", {
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  }, []);

  useEffect(() => {
    if (!started || completedAnswers) return;
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_step_view", {
      step: currentStep.id,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  }, [completedAnswers, currentStep.id, started]);

  const begin = () => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_start", {
      step: "intro",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    setStarted(true);
    setCurrentIndex(0);
    setAnswers({});
    setCompletedAnswers(null);
  };

  const selectOption = (stepId: AnswerStepId, value: StepValue) => {
    const nextAnswers = setAnswer(answers, stepId, value);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_option_select", {
      step: stepId,
      persona: nextAnswers.persona ?? "",
      selectedJob: nextAnswers.selectedJob ?? "",
      audience: nextAnswers.audience ?? "",
      concern: nextAnswers.concern ?? "",
      review: nextAnswers.review ?? "",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });

    if (isCompleteAnswers(nextAnswers)) {
      const nextResult = calculateQuickDiagnosisResult(nextAnswers);
      setCompletedAnswers(nextAnswers);
      trackEvent("quick_diagnosis_complete", {
        persona: nextAnswers.persona,
        selectedJob: nextAnswers.selectedJob,
        audience: nextAnswers.audience,
        concern: nextAnswers.concern,
        band: nextResult.band,
        assuranceScore: nextResult.assuranceScore,
        quickDiagnosisVersion,
        utm_source: stored.source ?? "",
        utm_campaign: stored.campaign ?? "",
      });
      return;
    }

    setAnswers(nextAnswers);
    setCurrentIndex((index) => Math.min(index + 1, answerSteps.length - 1));
  };

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  if (result && completedAnswers) {
    return (
      <>
        <SurveyHeader />
        <main className={`${styles.page} ${styles.quickPage}`}>
          <ResultView answers={completedAnswers} result={result} />
        </main>
      </>
    );
  }

  if (!started) {
    return (
      <>
        <SurveyHeader />
        <main className={`${styles.page} ${styles.quickPage}`}>
          <IntroView onBegin={begin} />
        </main>
      </>
    );
  }

  return (
    <>
      <SurveyHeader />
      <main className={`${styles.page} ${styles.quickPage}`}>
        <QuestionView
          answers={answers}
          currentIndex={currentIndex}
          currentStep={currentStep}
          onPrevious={goPrevious}
          onSelect={selectOption}
        />
      </main>
    </>
  );
}

function IntroView({ onBegin }: { onBegin: () => void }) {
  const intro = quickDiagnosisSteps[0];

  return (
    <div className={styles.quickShell}>
      <section className={styles.quickCard} aria-labelledby="quick-intro-title">
        <ProgressIndicator current={0} />
        <p className={styles.quickEyebrow}>3분 진단</p>
        <h1 id="quick-intro-title">
          {intro.title.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className={styles.quickHelperText}>{intro.helperText}</p>
        <div className={styles.quickActions}>
          <button className={styles.quickPrimaryButton} type="button" onClick={onBegin}>
            {intro.primaryCta}
          </button>
        </div>
        <p className={styles.quickTrustNote}>{intro.trustNote}</p>
      </section>
    </div>
  );
}

function QuestionView({
  answers,
  currentIndex,
  currentStep,
  onPrevious,
  onSelect,
}: {
  answers: Partial<QuickDiagnosisAnswers>;
  currentIndex: number;
  currentStep: Extract<QuickDiagnosisStep, { id: AnswerStepId }>;
  onPrevious: () => void;
  onSelect: (stepId: AnswerStepId, value: StepValue) => void;
}) {
  const selected = getSelectedValue(answers, currentStep.id);

  return (
    <div className={styles.quickShell}>
      <section className={styles.quickCard} aria-labelledby="quick-question-title">
        <ProgressIndicator current={currentIndex + 1} />
        <div className={styles.quickQuestionHeader}>
          <p className={styles.quickEyebrow}>{currentStep.label}</p>
          <h1 id="quick-question-title">{currentStep.question}</h1>
        </div>
        <div className={styles.quickOptionList}>
          {currentStep.options.map((option) => {
            const isSelected = selected === option.value;
            return (
              <button
                className={styles.quickOption}
                type="button"
                key={option.value}
                aria-pressed={isSelected}
                data-selected={isSelected ? "true" : "false"}
                onClick={() => onSelect(currentStep.id, option.value)}
              >
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.quickFooterActions}>
          <button
            className={styles.quickGhostButton}
            type="button"
            disabled={currentIndex === 0}
            onClick={onPrevious}
          >
            이전
          </button>
        </div>
      </section>
    </div>
  );
}

function ResultView({
  answers,
  result,
}: {
  answers: QuickDiagnosisAnswers;
  result: QuickDiagnosisResult;
}) {
  const workspace = workspaceMap[result.recommendedJob];

  const trackWorkspaceClick = () => {
    trackEvent("quick_diagnosis_workspace_cta_click", {
      persona: answers.persona,
      selectedJob: answers.selectedJob,
      audience: answers.audience,
      concern: answers.concern,
      band: result.band,
      assuranceScore: result.assuranceScore,
      ctaType: "workspace",
      quickDiagnosisVersion,
    });
  };

  const trackTrialClick = () => {
    trackEvent("quick_diagnosis_consult_click", {
      persona: answers.persona,
      selectedJob: answers.selectedJob,
      band: result.band,
      assuranceScore: result.assuranceScore,
      ctaType: "trial_30_days",
      quickDiagnosisVersion,
    });
  };

  return (
    <div className={styles.quickShell}>
      <section className={styles.quickResultCard} aria-labelledby="quick-result-title">
        <ProgressIndicator current={6} />
        <p className={styles.quickEyebrow}>결과</p>
        <h1 id="quick-result-title">{resultHeadlines[result.band]}</h1>
        <div className={styles.quickScoreCard}>
          <strong>{result.assuranceScore}점</strong>
          <b>{result.bandLabel}</b>
        </div>
        <p className={styles.quickResultLead}>{result.bandMessage}</p>
        <section className={styles.quickResultSection}>
          <h2>조심할 점</h2>
          <ol className={styles.quickWatchList}>
            {result.watchOut.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <section className={styles.quickRecommendation}>
          <span>먼저 해볼 일</span>
          <h2>{result.workspaceTitle}</h2>
        </section>
        <div className={styles.quickActions}>
          <Link
            className={styles.quickPrimaryLink}
            href={workspace.path}
            onClick={trackWorkspaceClick}
          >
            {result.workspaceCta}
          </Link>
          <Link
            className={styles.quickSecondaryLink}
            href={workspace.path}
            onClick={trackTrialClick}
          >
            30일 동안 써보고 판단하기
          </Link>
        </div>
        <p className={styles.quickDisclaimer}>
          간단 진단 결과입니다. 법률·보안 자문은 아닙니다.
        </p>
      </section>
      <AdvancedSurveyLinks />
    </div>
  );
}

function ProgressIndicator({ current }: { current: number }) {
  return (
    <div
      className={styles.quickProgress}
      aria-label={`진행 단계 ${current + 1}/${progressLabels.length}`}
    >
      <span className={styles.quickProgressText}>{progressLabels[current]}</span>
      <div className={styles.quickDots} aria-hidden="true">
        {progressLabels.map((label, index) => (
          <span
            key={label}
            data-active={index <= current ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  );
}

function AdvancedSurveyLinks() {
  const trackClick = (persona: "practitioner" | "leader" | "security") => {
    trackEvent("quick_diagnosis_advanced_survey_click", {
      ctaType: persona,
      quickDiagnosisVersion,
    });
  };

  return (
    <section
      className={styles.quickAdvanced}
      id="advanced-surveys"
      aria-labelledby="advanced-surveys-title"
    >
      <h2 id="advanced-surveys-title">더 자세히 보고 싶다면</h2>
      <p>3분 진단은 첫 업무를 고르는 입구입니다.</p>
      <div className={styles.quickAdvancedGrid}>
        <Link href="/survey/practitioner/" onClick={() => trackClick("practitioner")}>
          <strong>실무자 진단</strong>
          <span>답변을 쓸 때 조심할 점을 봅니다.</span>
        </Link>
        <Link href="/survey/leader/" onClick={() => trackClick("leader")}>
          <strong>대표·도입 담당자 진단</strong>
          <span>어떤 일부터 허용할지 봅니다.</span>
        </Link>
        <Link href="/survey/security/" onClick={() => trackClick("security")}>
          <strong>보안·정책 담당자 진단</strong>
          <span>개인정보와 기준을 봅니다.</span>
        </Link>
      </div>
    </section>
  );
}

function setAnswer(
  answers: Partial<QuickDiagnosisAnswers>,
  stepId: AnswerStepId,
  value: StepValue,
): Partial<QuickDiagnosisAnswers> {
  if (stepId === "persona" && isPersona(value)) {
    return { ...answers, persona: value };
  }
  if (stepId === "selectedJob" && isJob(value)) {
    return { ...answers, selectedJob: value };
  }
  if (stepId === "audience" && isAudience(value)) {
    return { ...answers, audience: value };
  }
  if (stepId === "concern" && isConcern(value)) {
    return { ...answers, concern: value };
  }
  if (stepId === "review" && isReview(value)) {
    return { ...answers, review: value };
  }
  return answers;
}

function getSelectedValue(
  answers: Partial<QuickDiagnosisAnswers>,
  stepId: AnswerStepId,
): string | undefined {
  if (stepId === "persona") return answers.persona;
  if (stepId === "selectedJob") return answers.selectedJob;
  if (stepId === "audience") return answers.audience;
  if (stepId === "concern") return answers.concern;
  return answers.review;
}

function isCompleteAnswers(
  answers: Partial<QuickDiagnosisAnswers>,
): answers is QuickDiagnosisAnswers {
  return Boolean(
    answers.persona &&
      answers.selectedJob &&
      answers.audience &&
      answers.concern &&
      answers.review,
  );
}

function isPersona(value: StepValue): value is QuickDiagnosisPersona {
  return ["worker", "team_lead", "owner", "policy_manager", "grant_writer"].includes(value);
}

function isJob(value: StepValue): value is QuickDiagnosisJob {
  return ["customer_reply", "grant_doc", "marketing_copy", "internal_summary", "proposal_doc"].includes(
    value,
  );
}

function isAudience(value: StepValue): value is QuickDiagnosisAudience {
  return ["customer", "institution", "executive", "internal", "unknown"].includes(value);
}

function isConcern(value: StepValue): value is QuickDiagnosisConcern {
  return [
    "privacy",
    "wrong_answer",
    "exaggeration",
    "no_policy",
    "no_evidence",
    "unknown_risk",
  ].includes(value);
}

function isReview(value: StepValue): value is QuickDiagnosisReview {
  return ["always", "important_only", "individual", "rarely", "no_standard"].includes(value);
}
