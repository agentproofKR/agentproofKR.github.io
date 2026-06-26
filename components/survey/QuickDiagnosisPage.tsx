"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
  "입장",
  "확인 대상",
  "사용처",
  "걱정",
  "마지막 확인",
  "결과",
] as const;

const autoAdvanceDelayMs = 210;

export function QuickDiagnosisPage() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuickDiagnosisAnswers>>({});
  const [completedAnswers, setCompletedAnswers] =
    useState<QuickDiagnosisAnswers | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    stepId: AnswerStepId;
    value: StepValue;
  } | null>(null);
  const autoAdvanceTimer = useRef<number | null>(null);
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

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        window.clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

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
    setPendingSelection(null);
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

  const queueOption = (stepId: AnswerStepId, value: StepValue) => {
    if (pendingSelection) return;
    setPendingSelection({ stepId, value });
    autoAdvanceTimer.current = window.setTimeout(() => {
      setPendingSelection(null);
      selectOption(stepId, value);
    }, autoAdvanceDelayMs);
  };

  const goPrevious = () => {
    if (autoAdvanceTimer.current) {
      window.clearTimeout(autoAdvanceTimer.current);
    }
    setPendingSelection(null);
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const restart = () => {
    if (autoAdvanceTimer.current) {
      window.clearTimeout(autoAdvanceTimer.current);
    }
    setAnswers({});
    setCompletedAnswers(null);
    setPendingSelection(null);
    setStarted(false);
    setCurrentIndex(0);
    trackEvent("quick_diagnosis_restart", {
      quickDiagnosisVersion,
    });
  };

  if (result && completedAnswers) {
    return (
      <>
        <SurveyHeader />
        <main className={`${styles.page} ${styles.quickPage}`}>
          <ResultView
            answers={completedAnswers}
            result={result}
            onRestart={restart}
          />
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
          pendingValue={
            pendingSelection?.stepId === currentStep.id
              ? pendingSelection.value
              : undefined
          }
          onPrevious={goPrevious}
          onSelect={queueOption}
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
        <h1 id="quick-intro-title">
          {intro.title.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className={styles.quickHelperText}>
          {intro.helperText.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <div className={styles.quickPreviewCard}>
          <span>{intro.previewTitle}</span>
          <ul>
            {intro.previewItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
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
  pendingValue,
  onPrevious,
  onSelect,
}: {
  answers: Partial<QuickDiagnosisAnswers>;
  currentIndex: number;
  currentStep: Extract<QuickDiagnosisStep, { id: AnswerStepId }>;
  pendingValue?: StepValue;
  onPrevious: () => void;
  onSelect: (stepId: AnswerStepId, value: StepValue) => void;
}) {
  const selected = pendingValue ?? getSelectedValue(answers, currentStep.id);
  const isPending = Boolean(pendingValue);

  return (
    <div className={styles.quickShell}>
      <section className={styles.quickCard} aria-labelledby="quick-question-title">
        <ProgressIndicator current={currentIndex + 1} />
        <div className={styles.quickQuestionHeader}>
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
                data-quick-option="true"
                data-selected={isSelected ? "true" : "false"}
                disabled={isPending}
                onClick={() => onSelect(currentStep.id, option.value)}
              >
                <span>{option.label}</span>
                <small>{option.subtitle}</small>
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
  onRestart,
}: {
  answers: QuickDiagnosisAnswers;
  result: QuickDiagnosisResult;
  onRestart: () => void;
}) {
  const workspace = workspaceMap[result.recommendedJob];
  const displayScore = useCountUp(result.assuranceScore);

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

  const trackPilotClick = () => {
    trackEvent("quick_diagnosis_consult_click", {
      persona: answers.persona,
      selectedJob: answers.selectedJob,
      band: result.band,
      assuranceScore: result.assuranceScore,
      ctaType: "pilot",
      quickDiagnosisVersion,
    });
  };

  return (
    <div className={styles.quickShell}>
      <section className={styles.quickResultCard} aria-labelledby="quick-result-title">
        <ProgressIndicator current={6} />
        <p className={styles.quickStatusPill}>{result.statusPill}</p>
        <h1 id="quick-result-title">{result.resultHeadline}</h1>
        <div className={styles.quickResultSummary}>
          <div className={styles.quickScoreCard}>
            <strong>{displayScore}점</strong>
            <b>· {result.bandLabel}</b>
          </div>
          <section className={styles.quickRecommendation}>
            <span>먼저 확인할 내용</span>
            <h2>{result.workspaceTitle}</h2>
          </section>
        </div>
        <section className={styles.quickResultSection}>
          <h2>확인하면 좋은 부분</h2>
          <ol className={styles.quickWatchList}>
            {result.watchOut.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
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
            href="mailto:agentproof.ai@gmail.com?subject=AgentProof%20%ED%8C%8C%EC%9D%BC%EB%9F%BF%20%EB%AC%B8%EC%9D%98"
            onClick={trackPilotClick}
          >
            파일럿 문의하기
          </Link>
        </div>
        <p className={styles.quickDisclaimer}>
          간단 체크 결과입니다. 법률·보안 자문은 아닙니다.
        </p>
        <section className={styles.quickValueCard}>
          <h2>{result.valueTitle}</h2>
          <p>
            {result.valueText.split("\n").map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
          <ul>
            {result.valueBullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <div className={styles.quickFooterActions}>
          <button className={styles.quickGhostButton} type="button" onClick={onRestart}>
            다시 해보기
          </button>
        </div>
      </section>
      <AdvancedSurveyLinks />
    </div>
  );
}

function ProgressIndicator({ current }: { current: number }) {
  const progress = Math.round(((current + 1) / progressLabels.length) * 100);

  return (
    <div
      className={styles.quickProgress}
      aria-label={`진행 단계 ${current + 1}/${progressLabels.length}`}
    >
      <div
        className={styles.quickProgressTrack}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={progressLabels.length}
        aria-valuenow={current + 1}
      >
        <span style={{ inlineSize: `${progress}%` }} />
      </div>
      <span className={styles.quickProgressCount}>{current + 1}/{progressLabels.length}</span>
    </div>
  );
}

function useCountUp(target: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 520;
    const startedAt = performance.now();
    let frameId = 0;

    const tick = (time: number) => {
      const progress = Math.min((time - startedAt) / duration, 1);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [target]);

  return value;
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
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
      <p>간단 체크는 첫 문서와 답변을 고르는 입구입니다.</p>
      <div className={styles.quickAdvancedGrid}>
        <Link href="/survey/practitioner/" onClick={() => trackClick("practitioner")}>
          <strong>실무자 체크</strong>
          <span>실제로 쓸 때 볼 내용을 확인합니다.</span>
        </Link>
        <Link href="/survey/leader/" onClick={() => trackClick("leader")}>
          <strong>대표·도입 담당자 체크</strong>
          <span>회사 기준을 정할 때 볼 내용을 확인합니다.</span>
        </Link>
        <Link href="/survey/security/" onClick={() => trackClick("security")}>
          <strong>보안·정책 담당자 체크</strong>
          <span>개인정보와 확인 기준을 점검합니다.</span>
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
