"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { trackEvent } from "@/lib/analytics";
import {
  calculateAssuranceResult,
  getAutonomyLabel,
  getDefaultControlState,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
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
    <main className={`${styles.page} ${styles.referencePage}`}>
      <div className={styles.referenceShell}>
        <section className={styles.referenceCard} aria-labelledby="reference-title">
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
        <LegacySurveyLinks />
      </div>
    </main>
  );
}

function CardTopBar({ screenIndex }: { screenIndex: ScreenIndex }) {
  const screen = referenceDiagnosisScreens[screenIndex];

  return (
    <div className={styles.referenceTopBar}>
      <Link className={styles.referenceBrand} href="/" aria-label="AgentProof 홈">
        <Image
          src="/agentproof-logo-mark.png"
          width={786}
          height={891}
          alt=""
          aria-hidden="true"
          priority
        />
        <Image
          src="/agentproof-logo-wordmark.png"
          width={1064}
          height={217}
          alt="AgentProof"
          priority
        />
      </Link>
      <span>{screen.stageLabel}</span>
    </div>
  );
}

function AwarenessScreen({ onStart }: { onStart: () => void }) {
  const screen = referenceDiagnosisScreens[0];

  return (
    <div className={styles.referenceScreen}>
      <div className={styles.referenceHeroIcon} data-testid="reference-check-icon">
        <span aria-hidden="true">✓</span>
      </div>
      <h1 id="reference-title">
        {screen.title.split("\n").map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      <p className={styles.referenceSubcopy}>{screen.subcopy}</p>
      <p className={styles.referenceSupportPill}>{screen.pill}</p>
      <button className={styles.referencePrimaryButton} type="button" onClick={onStart}>
        {screen.cta}
      </button>
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
  onBack,
  onNext,
}: {
  result: AssuranceResult;
  onBack: () => void;
  onNext: () => void;
}) {
  const screen = referenceDiagnosisScreens[3];

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
      <ReferenceActions onBack={onBack}>
        <button className={styles.referencePrimaryButton} type="button" onClick={onNext}>
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
        <span>정밀 검증 · 업무당</span>
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

function LegacySurveyLinks() {
  return (
    <section
      className={styles.referenceLegacy}
      id="legacy-surveys"
      aria-labelledby="legacy-surveys-title"
    >
      <a href="#legacy-surveys" className={styles.referenceLegacyAnchor}>
        기존 역할별 진단 보기
      </a>
      <h2 id="legacy-surveys-title">역할별 진단</h2>
      <div>
        <Link href="/survey/practitioner/">실무자 진단</Link>
        <Link href="/survey/leader/">대표·도입 담당자 진단</Link>
        <Link href="/survey/security/">보안·정책 담당자 진단</Link>
      </div>
    </section>
  );
}
