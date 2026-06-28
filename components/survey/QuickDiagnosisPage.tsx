"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { trackEvent } from "@/lib/analytics";
import {
  buildMiniReport,
  calculateAdoptionEffect,
  effortQuestionGroups,
  formatMonthlyEstimate,
  formatResultSummary,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  workOptions,
  type AdoptionEffectResult,
  type EffortQuestionGroup,
  type ExposureScope,
  type MiniReport,
  type PartialAdoptionInputState,
  type WorkType,
} from "@/lib/survey/quickDiagnosis";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

type ScreenIndex = 0 | 1 | 2 | 3;
type EffortValue = NonNullable<PartialAdoptionInputState[keyof PartialAdoptionInputState]>;

const defaultEffortInput: PartialAdoptionInputState = {
  volume: null,
  time: null,
  exposure: null,
};

export function QuickDiagnosisPage() {
  const [screenIndex, setScreenIndex] = useState<ScreenIndex>(0);
  const [selectedWork, setSelectedWork] = useState<WorkType | null>(null);
  const [effortInput, setEffortInput] =
    useState<PartialAdoptionInputState>(defaultEffortInput);
  const [copyStatus, setCopyStatus] = useState("");
  const activeWork = selectedWork ?? "unknown";
  const completeEffortInput = getCompleteEffortInput(effortInput);
  const effect = useMemo(
    () =>
      calculateAdoptionEffect(
        activeWork,
        completeEffortInput ?? {
          volume: "unknown",
          time: "unknown",
          exposure: "internal",
        },
      ),
    [activeWork, completeEffortInput],
  );
  const report = useMemo(() => buildMiniReport(activeWork), [activeWork]);
  const workLabel =
    workOptions.find((option) => option.value === activeWork)?.label ?? "추천 업무";

  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_view", {
      mode: "adoption_report",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  }, []);

  const goToScreen = (nextIndex: ScreenIndex) => {
    setScreenIndex(nextIndex);
    setCopyStatus("");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_step_view", {
      mode: "adoption_report",
      step: referenceDiagnosisScreens[nextIndex].id,
      selectedWork: activeWork,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  };

  const start = () => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_start", {
      mode: "adoption_report",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    goToScreen(1);
  };

  const chooseWork = (workType: WorkType) => {
    setSelectedWork(workType);
    setEffortInput(defaultEffortInput);
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_report",
      selectedWork: workType,
      quickDiagnosisVersion,
    });
  };

  const selectEffort = (groupId: EffortQuestionGroup["id"], value: EffortValue) => {
    setEffortInput((current) => ({
      ...current,
      [groupId]: value,
    }));
  };

  const showReport = () => {
    if (!completeEffortInput) return;
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_complete", {
      mode: "adoption_report",
      selectedWork: activeWork,
      volume: completeEffortInput.volume,
      time: completeEffortInput.time,
      exposure: completeEffortInput.exposure,
      monthlyHoursRange: effect.monthlyHoursRange,
      savingHoursRange: effect.savingHoursRange,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    goToScreen(3);
  };

  const requestPilot = () => {
    trackEvent("quick_diagnosis_pilot_cta_click", {
      mode: "adoption_report",
      selectedWork: activeWork,
      quickDiagnosisVersion,
    });
  };

  const copyResult = async () => {
    const summary = formatResultSummary(workLabel, effect, report);
    await writeClipboardText(summary);
    setCopyStatus("결과를 복사했습니다");
    trackEvent("quick_diagnosis_result_copy", {
      mode: "adoption_report",
      selectedWork: activeWork,
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
              <CalculatorScreen
                effortInput={effortInput}
                selectedWorkLabel={workLabel}
                onBack={() => goToScreen(1)}
                onNext={showReport}
                onSelect={selectEffort}
              />
            ) : null}
            {screenIndex === 3 ? (
              <ReportScreen
                copyStatus={copyStatus}
                effect={effect}
                report={report}
                selectedWork={activeWork}
                selectedWorkLabel={workLabel}
                onBack={() => goToScreen(2)}
                onCopy={copyResult}
                onPilotClick={requestPilot}
              />
            ) : null}
          </section>
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
  selectedWork: WorkType | null;
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
      {screen.subcopy ? (
        <p className={styles.referenceQuestionHelper}>{screen.subcopy}</p>
      ) : null}
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
              <span className={styles.referenceOptionCopy}>
                <span>{option.label}</span>
                <small>{option.subtitle}</small>
              </span>
              <b aria-hidden="true">{selected ? "✓" : "›"}</b>
            </button>
          );
        })}
      </div>
      <ReferenceActions onBack={onBack}>
        <button
          className={styles.referencePrimaryButton}
          disabled={selectedWork === null}
          type="button"
          onClick={onNext}
        >
          {screen.cta}
        </button>
      </ReferenceActions>
    </div>
  );
}

function CalculatorScreen({
  effortInput,
  selectedWorkLabel,
  onBack,
  onNext,
  onSelect,
}: {
  effortInput: PartialAdoptionInputState;
  selectedWorkLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSelect: (groupId: EffortQuestionGroup["id"], value: EffortValue) => void;
}) {
  const screen = referenceDiagnosisScreens[2];
  const canContinue = getCompleteEffortInput(effortInput) !== null;

  return (
    <div className={styles.referenceScreen}>
      <h1 id="reference-title">{screen.title}</h1>
      {screen.subcopy ? (
        <p className={styles.referenceQuestionHelper}>{screen.subcopy}</p>
      ) : null}
      <p className={styles.referenceSelectedWork}>업무 · {selectedWorkLabel}</p>
      <div className={styles.referenceCalculator}>
        {effortQuestionGroups.map((group) => (
          <EffortQuestionBlock
            group={group}
            key={group.id}
            selectedValue={effortInput[group.id]}
            onSelect={onSelect}
          />
        ))}
      </div>
      <ReferenceActions onBack={onBack}>
        <button
          className={styles.referencePrimaryButton}
          disabled={!canContinue}
          type="button"
          onClick={onNext}
        >
          {screen.cta}
        </button>
      </ReferenceActions>
    </div>
  );
}

function EffortQuestionBlock({
  group,
  selectedValue,
  onSelect,
}: {
  group: EffortQuestionGroup;
  selectedValue: EffortValue | null;
  onSelect: (groupId: EffortQuestionGroup["id"], value: EffortValue) => void;
}) {
  return (
    <fieldset className={styles.referenceEffortGroup}>
      <legend>{group.label}</legend>
      <div className={styles.referencePillGroup}>
        {group.options.map((option) => {
          const selected = option.value === selectedValue;
          return (
            <button
              aria-pressed={selected}
              className={styles.referencePillButton}
              data-selected={selected ? "true" : "false"}
              key={option.value}
              type="button"
              onClick={() => onSelect(group.id, option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function ReportScreen({
  copyStatus,
  effect,
  report,
  selectedWork,
  selectedWorkLabel,
  onBack,
  onCopy,
  onPilotClick,
}: {
  copyStatus: string;
  effect: AdoptionEffectResult;
  report: MiniReport;
  selectedWork: WorkType;
  selectedWorkLabel: string;
  onBack: () => void;
  onCopy: () => Promise<void>;
  onPilotClick: () => void;
}) {
  const screen = referenceDiagnosisScreens[3];
  const pilotHref = `mailto:agentproof.ai@gmail.com?subject=${encodeURIComponent(
    "30일 파일럿 설계 요청",
  )}`;

  return (
    <div className={`${styles.referenceScreen} ${styles.referenceReportScreen}`}>
      <section className={styles.referenceReportHero} aria-labelledby="reference-title">
        <span>{selectedWorkLabel}</span>
        <h1 id="reference-title">
          {report.headline.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
      </section>

      <ReportCard title="예상 효과">
        <div className={styles.referenceEffectGrid}>
          <MetricBlock
            label="예상 업무량"
            range={effect.monthlyHoursRange}
            estimateLabel={effect.estimateLabel}
          />
          <MetricBlock
            label="줄일 수 있는 시간"
            range={effect.savingHoursRange}
            estimateLabel={effect.estimateLabel}
          />
        </div>
        <p className={styles.referenceReportNote}>
          입력한 빈도와 소요시간 기준 예상 범위입니다.
        </p>
      </ReportCard>

      <ReportCard title="권장 방식">
        <p className={styles.referenceMethod}>{report.method}</p>
        <p className={styles.referenceReportNote}>노출 범위 · {effect.exposureLabel}</p>
      </ReportCard>

      <ReportCard title="사람이 봐야 하는 경우">
        <CompactList items={report.reviewPoints} />
      </ReportCard>

      <ReportCard title="30일 파일럿에서 볼 것">
        <p className={styles.referencePilotSize}>{report.pilotSize}</p>
        <CompactList items={report.pilotItems} />
      </ReportCard>

      <ReportCard title="지원사업 준비에 활용">
        <p className={styles.referenceSupportNote}>{report.supportNote}</p>
      </ReportCard>

      <ReferenceActions onBack={onBack}>
        <Link
          className={styles.referencePrimaryButton}
          href={pilotHref}
          onClick={onPilotClick}
        >
          {screen.cta}
        </Link>
        <button
          className={`${styles.referencePrimaryButton} ${styles.referenceSecondaryButton}`}
          type="button"
          onClick={() => void onCopy()}
        >
          결과 저장하기
        </button>
      </ReferenceActions>
      <div className={styles.referenceCopyStatus} role="status" aria-live="polite">
        {copyStatus}
      </div>
      <span className={styles.referenceVisuallyHidden}>
        선택한 업무 키: {selectedWork}
      </span>
    </div>
  );
}

function MetricBlock({
  label,
  range,
  estimateLabel,
}: {
  label: string;
  range: string;
  estimateLabel: string;
}) {
  return (
    <div className={styles.referenceMetricBlock}>
      <span>{label}</span>
      <strong>{formatMonthlyEstimate(range)}</strong>
      <small>{estimateLabel}</small>
    </div>
  );
}

function ReportCard({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className={styles.referenceReportCard}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CompactList({ items }: { items: readonly [string, string, string] }) {
  return (
    <ul className={styles.referenceCompactList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
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

function getCompleteEffortInput(input: PartialAdoptionInputState) {
  if (input.volume === null || input.time === null || input.exposure === null) {
    return null;
  }
  return {
    volume: input.volume,
    time: input.time,
    exposure: input.exposure as ExposureScope,
  };
}

async function writeClipboardText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.width = "1px";
  textArea.style.height = "1px";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const copied = document.execCommand("copy");
    if (!copied) {
      throw new Error("Clipboard copy fallback failed");
    }
  } finally {
    document.body.removeChild(textArea);
  }
}
