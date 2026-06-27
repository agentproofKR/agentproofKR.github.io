"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Header } from "@/components/layout/Header";
import { trackEvent } from "@/lib/analytics";
import {
  calculateAssuranceResult,
  getAutonomyLabel,
  getDefaultControlState,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  workspaceMap,
  workOptions,
  type AssuranceResult,
  type ControlState,
  type WorkType,
} from "@/lib/survey/quickDiagnosis";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

type ScreenIndex = 0 | 1 | 2 | 3 | 4 | 5;
type TimingOption = "즉시" | "1개월" | "검토 중";

const timingOptions: readonly TimingOption[] = ["즉시", "1개월", "검토 중"];

export function QuickDiagnosisPage() {
  const [screenIndex, setScreenIndex] = useState<ScreenIndex>(0);
  const [selectedWork, setSelectedWork] = useState<WorkType>("customer_reply");
  const [controlState, setControlState] = useState<ControlState>(
    getDefaultControlState("customer_reply"),
  );
  const [decisionMaker, setDecisionMaker] = useState("");
  const [contact, setContact] = useState("");
  const [timing, setTiming] = useState<TimingOption>("즉시");
  const result = useMemo(
    () => calculateAssuranceResult(selectedWork, controlState),
    [controlState, selectedWork],
  );

  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_view", {
      mode: "reference",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  }, []);

  const goToScreen = (nextIndex: ScreenIndex) => {
    setScreenIndex(nextIndex);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_step_view", {
      mode: "reference",
      step: referenceDiagnosisScreens[nextIndex].id,
      selectedWork,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  };

  const start = () => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_start", {
      mode: "reference",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    goToScreen(1);
  };

  const chooseWork = (workType: WorkType) => {
    setSelectedWork(workType);
    setControlState(getDefaultControlState(workType));
    trackEvent("quick_diagnosis_option_select", {
      mode: "reference",
      selectedWork: workType,
      quickDiagnosisVersion,
    });
  };

  const showScore = () => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_complete", {
      mode: "reference",
      selectedWork,
      score: result.score,
      band: result.band,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    goToScreen(3);
  };

  const submitValidation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    trackEvent("quick_diagnosis_validation_submit", {
      mode: "reference",
      selectedWork,
      timing,
      score: result.score,
      band: result.band,
      quickDiagnosisVersion,
    });
    goToScreen(5);
  };

  const shareReport = () => {
    trackEvent("quick_diagnosis_report_share_click", {
      mode: "reference",
      selectedWork,
      score: result.score,
      quickDiagnosisVersion,
    });
  };

  return (
    <>
      <Header
        ctaHref="/survey/"
        homeHref="/"
        navBaseHref="/"
        onNavClick={(target) => trackEvent("nav_anchor_click", { target })}
      />
      <main id="top" className={`${styles.page} ${styles.referencePage}`}>
        <div className={styles.referenceShell}>
          <section
            className={`${styles.referenceCard} ${
              screenIndex === 0 ? styles.referenceIntroCard : ""
            }`}
            aria-labelledby="reference-title"
          >
            <CardTopBar screenIndex={screenIndex} />
            {screenIndex === 0 ? <AwarenessScreen onStart={start} /> : null}
            {screenIndex === 1 ? (
              <WorkScreen
                selectedWork={selectedWork}
                onSelect={chooseWork}
                onNext={() => goToScreen(2)}
                onBack={() => goToScreen(0)}
              />
            ) : null}
            {screenIndex === 2 ? (
              <ControlScreen
                controlState={controlState}
                selectedWork={selectedWork}
                onBack={() => goToScreen(1)}
                onChange={setControlState}
                onNext={showScore}
              />
            ) : null}
            {screenIndex === 3 ? (
              <ScoreScreen
                result={result}
                selectedWork={selectedWork}
                onBack={() => goToScreen(2)}
                onNext={() => goToScreen(4)}
              />
            ) : null}
            {screenIndex === 4 ? (
              <ValidationScreen
                contact={contact}
                decisionMaker={decisionMaker}
                timing={timing}
                onBack={() => goToScreen(3)}
                onContactChange={setContact}
                onDecisionMakerChange={setDecisionMaker}
                onSubmit={submitValidation}
                onTimingChange={setTiming}
              />
            ) : null}
            {screenIndex === 5 ? (
              <MonitoringScreen onBack={() => goToScreen(4)} onShare={shareReport} />
            ) : null}
          </section>
          <NextStepSection
            selectedWork={selectedWork}
            onValidationRequest={() => goToScreen(4)}
          />
        </div>
      </main>
    </>
  );
}

function CardTopBar({ screenIndex }: { screenIndex: ScreenIndex }) {
  const screen = referenceDiagnosisScreens[screenIndex];

  return (
    <div className={styles.referenceTopBar}>
      <span>{screen.stageLabel}</span>
    </div>
  );
}

function AwarenessScreen({ onStart }: { onStart: () => void }) {
  const screen = referenceDiagnosisScreens[0];

  return (
    <div className={`${styles.referenceScreen} ${styles.referenceIntroScreen}`}>
      <div className={styles.referenceHeroIcon} data-testid="reference-check-icon">
        <span aria-hidden="true">✓</span>
      </div>
      <h1 id="reference-title">
        {screen.title.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      {screen.subcopy ? (
        <p className={styles.referenceSubcopy}>
          {screen.subcopy.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      ) : null}
      {screen.pill ? <p className={styles.referenceSupportPill}>{screen.pill}</p> : null}
      {screen.previewTitle && screen.previewItems ? (
        <div className={styles.referencePreviewBox}>
          <p>{screen.previewTitle}</p>
          <ul>
            {screen.previewItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <button className={styles.referencePrimaryButton} type="button" onClick={onStart}>
        {screen.cta}
      </button>
      {screen.trustNote ? (
        <p className={styles.referenceTrustNote}>{screen.trustNote}</p>
      ) : null}
    </div>
  );
}

function WorkScreen({
  selectedWork,
  onBack,
  onNext,
  onSelect,
}: {
  selectedWork: WorkType;
  onBack: () => void;
  onNext: () => void;
  onSelect: (workType: WorkType) => void;
}) {
  const screen = referenceDiagnosisScreens[1];

  return (
    <div className={styles.referenceScreen}>
      <h1 id="reference-title">
        {screen.title.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      <div className={styles.referenceOptionList}>
        {workOptions.map((option) => {
          const selected = option.value === selectedWork;
          return (
            <button
              aria-pressed={selected}
              className={styles.referenceOption}
              data-reference-option="true"
              data-selected={selected ? "true" : "false"}
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
            >
              <span>{option.label}</span>
              <b aria-hidden="true">{selected ? "✓" : "›"}</b>
            </button>
          );
        })}
      </div>
      <ReferenceActions onBack={onBack}>
        <button className={styles.referencePrimaryButton} type="button" onClick={onNext}>
          {screen.cta}
        </button>
      </ReferenceActions>
    </div>
  );
}

function ControlScreen({
  controlState,
  selectedWork,
  onBack,
  onChange,
  onNext,
}: {
  controlState: ControlState;
  selectedWork: WorkType;
  onBack: () => void;
  onChange: (controlState: ControlState) => void;
  onNext: () => void;
}) {
  const screen = referenceDiagnosisScreens[2];
  const workLabel =
    workOptions.find((option) => option.value === selectedWork)?.label ?? "";

  return (
    <div className={styles.referenceScreen}>
      <h1 id="reference-title">{screen.title}</h1>
      <p className={styles.referenceSelectedWork}>업무 · {workLabel}</p>
      <div className={styles.referenceControlList}>
        <div className={styles.referenceControlRow}>
          <span>자율성 범위</span>
          <strong>{getAutonomyLabel(controlState.autonomy)}</strong>
        </div>
        <ControlToggle
          checked={controlState.behaviorLogging}
          label="행동 로그 수집"
          onChange={(checked) =>
            onChange({ ...controlState, behaviorLogging: checked })
          }
        />
        <ControlToggle
          checked={controlState.humanReview}
          label="사람 검토(HITL)"
          onChange={(checked) => onChange({ ...controlState, humanReview: checked })}
        />
        <ControlToggle
          checked={controlState.driftMonitoring}
          label="드리프트 감시"
          onChange={(checked) =>
            onChange({ ...controlState, driftMonitoring: checked })
          }
        />
      </div>
      <div className={styles.referenceAnalysis}>
        <span>{screen.analysisText}</span>
        <div
          className={styles.referenceAnalysisBar}
          role="progressbar"
          aria-label="AI 분석 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={72}
        >
          <i />
        </div>
      </div>
      <ReferenceActions onBack={onBack}>
        <button className={styles.referencePrimaryButton} type="button" onClick={onNext}>
          {screen.cta}
        </button>
      </ReferenceActions>
    </div>
  );
}

function ControlToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={styles.referenceControlRow}
      role="switch"
      type="button"
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <i data-checked={checked ? "true" : "false"} aria-hidden="true">
        <b />
      </i>
    </button>
  );
}

function ScoreScreen({
  result,
  selectedWork,
  onBack,
  onNext,
}: {
  result: AssuranceResult;
  selectedWork: WorkType;
  onBack: () => void;
  onNext: () => void;
}) {
  const screen = referenceDiagnosisScreens[3];
  const workspace = workspaceMap[selectedWork];
  const reviewAdvice = getHumanReviewAdvice(selectedWork);

  const trackWorkspaceClick = () => {
    trackEvent("quick_diagnosis_workspace_cta_click", {
      mode: "reference",
      selectedWork,
      score: result.score,
      ctaType: "score_primary",
      quickDiagnosisVersion,
    });
  };

  const requestValidation = () => {
    trackEvent("quick_diagnosis_consult_click", {
      mode: "reference",
      selectedWork,
      score: result.score,
      ctaType: "score_secondary",
      quickDiagnosisVersion,
    });
    onNext();
  };

  return (
    <div className={styles.referenceScreen}>
      <h1 id="reference-title">{screen.title}</h1>
      <div
        className={styles.referenceScoreGauge}
        style={{ "--score": result.score } as CSSProperties}
      >
        <strong>{result.score} / 100</strong>
      </div>
      <p className={styles.referenceBand}>{result.bandLabel}</p>
      <section className={styles.referenceRiskBox}>
        <span>{screen.riskTitle}</span>
        <strong>{result.riskLine}</strong>
      </section>
      <div className={styles.referenceMetrics}>
        <div>
          <span>일 누수</span>
          <strong>{result.dailyLeakageEstimate}</strong>
        </div>
        <div>
          <span>지원금</span>
          <strong>{result.subsidyEstimate}</strong>
        </div>
      </div>
      <div className={styles.referenceResultSummary}>
        <section>
          <span>먼저 시험해볼 업무</span>
          <strong>{workspace.title}</strong>
        </section>
        <section>
          <span>사람이 봐야 할 경우</span>
          <strong>{reviewAdvice}</strong>
        </section>
      </div>
      <ReferenceActions onBack={onBack}>
        <Link
          className={styles.referencePrimaryButton}
          href={workspace.path}
          onClick={trackWorkspaceClick}
        >
          추천 업무 체험하기
        </Link>
        <button
          className={`${styles.referencePrimaryButton} ${styles.referenceSecondaryButton}`}
          type="button"
          onClick={requestValidation}
        >
          {screen.cta}
        </button>
      </ReferenceActions>
    </div>
  );
}

function ValidationScreen({
  contact,
  decisionMaker,
  timing,
  onBack,
  onContactChange,
  onDecisionMakerChange,
  onSubmit,
  onTimingChange,
}: {
  contact: string;
  decisionMaker: string;
  timing: TimingOption;
  onBack: () => void;
  onContactChange: (value: string) => void;
  onDecisionMakerChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTimingChange: (value: TimingOption) => void;
}) {
  const screen = referenceDiagnosisScreens[4];

  return (
    <form className={styles.referenceScreen} onSubmit={onSubmit}>
      <h1 id="reference-title">{screen.title}</h1>
      <label className={styles.referenceField}>
        <span>담당자 · 결재자</span>
        <input
          autoComplete="name"
          name="decisionMaker"
          placeholder="김대표 · 구매 결정권자"
          type="text"
          value={decisionMaker}
          onChange={(event) => onDecisionMakerChange(event.target.value)}
        />
      </label>
      <label className={styles.referenceField}>
        <span>연락처</span>
        <input
          autoComplete="tel"
          inputMode="tel"
          name="contact"
          placeholder="010--"
          type="tel"
          value={contact}
          onChange={(event) => onContactChange(event.target.value)}
        />
      </label>
      <div className={styles.referenceTiming} role="group" aria-label="도입 시점">
        <span>도입 시점</span>
        <div>
          {timingOptions.map((option) => (
            <button
              aria-pressed={timing === option}
              key={option}
              type="button"
              onClick={() => onTimingChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.referencePriceBox}>
        <span>30일 업무 검증 · 업무당</span>
        <strong>₩50–150만 / 건</strong>
      </div>
      <ReferenceActions onBack={onBack}>
        <button className={styles.referencePrimaryButton} type="submit">
          {screen.cta}
        </button>
      </ReferenceActions>
    </form>
  );
}

function MonitoringScreen({
  onBack,
  onShare,
}: {
  onBack: () => void;
  onShare: () => void;
}) {
  const screen = referenceDiagnosisScreens[5];

  return (
    <div className={styles.referenceScreen}>
      <h1 id="reference-title">{screen.title}</h1>
      <p className={styles.referenceSubcopy}>{screen.subcopy}</p>
      <div
        className={styles.referenceChart}
        data-testid="reference-monitoring-chart"
        aria-label="최근 8주 안심 점수 추이"
      >
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <polyline points="8,86 48,72 88,78 128,52 168,58 208,40 248,34 272,28" />
          <circle cx="272" cy="28" r="6" />
        </svg>
      </div>
      <section className={styles.referenceAlertCard}>
        <strong>{screen.alertTitle}</strong>
        <span>권장 대비 -6점 · 재진단 권장</span>
      </section>
      <ul className={styles.referenceChecklist}>
        <li>재진단 예약됨 (D-2)</li>
        <li>규제 체크 통과 (AI 기본법)</li>
      </ul>
      <ReferenceActions onBack={onBack}>
        <button
          className={styles.referencePrimaryButton}
          type="button"
          onClick={onShare}
        >
          {screen.cta}
        </button>
      </ReferenceActions>
    </div>
  );
}

function ReferenceActions({
  children,
  onBack,
}: {
  children: ReactNode;
  onBack: () => void;
}) {
  return (
    <div className={styles.referenceActions}>
      {children}
      <button className={styles.referenceBackButton} type="button" onClick={onBack}>
        이전
      </button>
    </div>
  );
}

function NextStepSection({
  selectedWork,
  onValidationRequest,
}: {
  selectedWork: WorkType;
  onValidationRequest: () => void;
}) {
  const workspace = workspaceMap[selectedWork];

  const requestValidation = () => {
    trackEvent("quick_diagnosis_consult_click", {
      mode: "reference",
      selectedWork,
      ctaType: "next_steps",
      quickDiagnosisVersion,
    });
    onValidationRequest();
  };

  return (
    <section
      className={styles.referenceNextSteps}
      id="next-steps"
      aria-labelledby="next-steps-title"
    >
      <h2 id="next-steps-title">다음 단계</h2>
      <div className={styles.referenceNextStepGrid}>
        <Link
          className={styles.referenceNextStepCard}
          href={workspace.path}
          onClick={() =>
            trackEvent("quick_diagnosis_workspace_cta_click", {
              mode: "reference",
              selectedWork,
              ctaType: "next_steps",
              quickDiagnosisVersion,
            })
          }
        >
          <strong>추천 업무 체험하기</strong>
          <span>진단 결과에 맞는 업무를 1회 써봅니다.</span>
          <i aria-hidden="true">체험하기</i>
        </Link>
        <button
          className={styles.referenceNextStepCard}
          type="button"
          onClick={requestValidation}
        >
          <strong>30일 업무 검증 문의하기</strong>
          <span>실제 사용 기록으로 도입 여부를 판단합니다.</span>
          <i aria-hidden="true">문의하기</i>
        </button>
        <a className={styles.referenceNextStepCard} href="#ai-policy-sample">
          <strong>AI 사용 기준 샘플 보기</strong>
          <span>직원들이 어디까지 AI를 써도 되는지 기준을 확인합니다.</span>
          <i aria-hidden="true">샘플 보기</i>
        </a>
      </div>
      <details className={styles.referencePolicySample} id="ai-policy-sample">
        <summary>AI 사용 기준 샘플</summary>
        <ul>
          <li>고객에게 나가는 문장은 사람이 확인합니다.</li>
          <li>개인정보가 들어간 자료는 입력하지 않습니다.</li>
          <li>가격·환불·보장 표현은 기록을 남깁니다.</li>
        </ul>
      </details>
      <div className={styles.referenceRoleLinks}>
        <span>역할별로 더 자세히 보고 싶다면</span>
        <div>
          <Link href="/survey/practitioner/">실무자</Link>
          <Link href="/survey/leader/">대표·도입 담당자</Link>
          <Link href="/survey/security/">보안·정책 담당자</Link>
        </div>
      </div>
    </section>
  );
}

function getHumanReviewAdvice(workType: WorkType): string {
  if (workType === "payment_refund_review") {
    return "결제·환불 결정 전에는 사람이 확인해야 합니다.";
  }
  if (workType === "customer_reply") {
    return "고객에게 보내기 전 마지막 확인이 필요합니다.";
  }
  if (workType === "document_generation") {
    return "제출 문서는 근거와 표현을 다시 봐야 합니다.";
  }
  return "추천 기준이 바뀌면 사람이 한 번 봐야 합니다.";
}
