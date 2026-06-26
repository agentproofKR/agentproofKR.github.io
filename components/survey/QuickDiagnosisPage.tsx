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

const stepLabels = quickDiagnosisSteps.map((step) => step.label);

const resultHeadlines: Record<QuickDiagnosisResult["band"], string> = {
  ready: "작게 시작해도 됩니다.",
  conditional: "작게 시작해도 됩니다.\n다만, 보내기 전 확인은 필요해 보여요.",
  needs_verification: "먼저 확인해보고\n작게 시작하는 게 좋습니다.",
  hold: "기준부터 잡아도 됩니다.\n그다음 작게 시작해보세요.",
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
    if (completedAnswers) return;
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_step_view", {
      step: currentStep.id,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  }, [completedAnswers, currentStep.id]);

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
    if (completedAnswers) {
      setCompletedAnswers(null);
      setCurrentIndex(answerSteps.length - 1);
      return;
    }
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const restart = () => {
    setAnswers({});
    setCompletedAnswers(null);
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
            onPrevious={goPrevious}
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
        <p className={styles.quickEyebrow}>3분 무료 진단</p>
        <h1 id="quick-intro-title">
          {intro.title.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <div className={styles.quickIntroBody}>
          {intro.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className={styles.quickActions}>
          <button className={styles.quickPrimaryButton} type="button" onClick={onBegin}>
            {intro.primaryCta}
          </button>
          <a className={styles.quickSecondaryLink} href="#advanced-surveys">
            {intro.secondaryCta}
          </a>
        </div>
        <p className={styles.quickTrustNote}>{intro.trustNote}</p>
      </section>
      <AdvancedSurveyLinks />
      <PrivacyMiniNotice />
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
          {"helperText" in currentStep ? (
            <p className={styles.quickHelperText}>{currentStep.helperText}</p>
          ) : null}
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
                {option.hint ? <small>{option.hint}</small> : null}
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
      <PrivacyMiniNotice />
    </div>
  );
}

function ResultView({
  answers,
  result,
  onPrevious,
  onRestart,
}: {
  answers: QuickDiagnosisAnswers;
  result: QuickDiagnosisResult;
  onPrevious: () => void;
  onRestart: () => void;
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

  const trackConsultClick = () => {
    trackEvent("quick_diagnosis_consult_click", {
      persona: answers.persona,
      selectedJob: answers.selectedJob,
      band: result.band,
      assuranceScore: result.assuranceScore,
      ctaType: "consult",
      quickDiagnosisVersion,
    });
  };

  return (
    <div className={styles.quickShell}>
      <section className={styles.quickResultCard} aria-labelledby="quick-result-title">
        <ProgressIndicator current={5} />
        <p className={styles.quickEyebrow}>추천 결과</p>
        <h1 id="quick-result-title">
          {resultHeadlines[result.band].split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <div className={styles.quickScoreCard}>
          <span>AI 업무 점검 결과</span>
          <strong>{result.assuranceScore}점</strong>
          <b>{result.bandLabel}</b>
        </div>
        <p className={styles.quickResultLead}>{result.bandMessage}</p>
        <section className={styles.quickResultSection}>
          <h2>좋은 소식</h2>
          <p>{result.goodNews}</p>
        </section>
        <section className={styles.quickResultSection}>
          <h2>주의할 점</h2>
          <ol className={styles.quickWatchList}>
            {result.watchOut.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <section className={styles.quickRecommendation}>
          <span>먼저 해볼 일</span>
          <h2>{result.workspaceTitle} 초안</h2>
          <p>{result.workspaceHint}</p>
        </section>
        <section className={styles.quickResultSection}>
          <h2>AgentProof가 도와주는 방식</h2>
          <p>
            AgentProof에서 답변을 만들면, 보내기 전에 확인할 부분을 같이 보여줍니다.
            고친 내용과 실제로 썼는지도 남길 수 있어, 나중에 팀장이나 대표에게
            설명하기 쉽습니다.
          </p>
          <p>{result.personaValue}</p>
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
            onClick={trackConsultClick}
          >
            30일 동안 써보고 판단하기
          </Link>
          <a className={styles.quickTextLink} href="#advanced-surveys">
            더 자세한 역할별 진단 보기
          </a>
        </div>
        <p className={styles.quickDisclaimer}>
          이 결과는 입력한 선택지를 바탕으로 한 간단 진단입니다. 법률·보안 자문이나
          안전 보장을 의미하지 않습니다.
        </p>
        <div className={styles.quickFooterActions}>
          <button className={styles.quickGhostButton} type="button" onClick={onPrevious}>
            이전 답변 보기
          </button>
          <button className={styles.quickGhostButton} type="button" onClick={onRestart}>
            다시 진단하기
          </button>
        </div>
      </section>
      <AdvancedSurveyLinks />
    </div>
  );
}

function ProgressIndicator({ current }: { current: number }) {
  return (
    <div className={styles.quickProgress} aria-label={`진행 단계 ${current + 1}/6`}>
      <span className={styles.quickProgressText}>{stepLabels[current]}</span>
      <div className={styles.quickDots} aria-hidden="true">
        {stepLabels.map((label, index) => (
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
      <h2 id="advanced-surveys-title">더 자세히 점검하고 싶다면</h2>
      <p>
        3분 진단은 첫 업무를 고르는 입구입니다. 역할별로 더 깊게 보고 싶다면
        아래 진단을 이어서 진행하세요.
      </p>
      <div className={styles.quickAdvancedGrid}>
        <Link href="/survey/practitioner/" onClick={() => trackClick("practitioner")}>
          <strong>실무자 진단</strong>
          <span>AI 답변을 실제 업무에 쓸 때 조심할 점을 확인합니다.</span>
        </Link>
        <Link href="/survey/leader/" onClick={() => trackClick("leader")}>
          <strong>대표·도입 담당자 진단</strong>
          <span>우리 회사가 어떤 일부터 AI를 허용할지 판단합니다.</span>
        </Link>
        <Link href="/survey/security/" onClick={() => trackClick("security")}>
          <strong>보안·정책 담당자 진단</strong>
          <span>개인정보, 기록, 확인 기준, 사용 원칙을 점검합니다.</span>
        </Link>
      </div>
    </section>
  );
}

function PrivacyMiniNotice() {
  return (
    <p className={styles.quickPrivacyNotice}>
      이 진단은 회사명, 이메일, 고객정보 입력 없이 진행할 수 있습니다. 상담 신청은
      결과 확인 후 선택 사항입니다.
    </p>
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
