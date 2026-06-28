"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { Header } from "@/components/layout/Header";
import { trackEvent } from "@/lib/analytics";
import {
  adoptionPurposeOptions,
  buildAdoptionReport,
  formatResultSummary,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  usageScopeOptions,
  workNatureOptions,
  workOptions,
  type AdoptionPurpose,
  type AdoptionReport,
  type DiagnosisOption,
  type ReferenceDiagnosisScreen,
  type UsageScope,
  type WorkNature,
  type WorkType,
} from "@/lib/survey/quickDiagnosis";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

type ScreenIndex = 0 | 1 | 2 | 3 | 4 | 5;

export function QuickDiagnosisPage() {
  const [screenIndex, setScreenIndex] = useState<ScreenIndex>(0);
  const [selectedWork, setSelectedWork] = useState<WorkType | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<AdoptionPurpose | null>(
    null,
  );
  const [selectedNature, setSelectedNature] = useState<WorkNature | null>(null);
  const [selectedScope, setSelectedScope] = useState<UsageScope | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const report = useMemo(
    () =>
      buildAdoptionReport({
        workType: selectedWork ?? "unknown",
        purpose: selectedPurpose ?? "find_use_case",
        nature: selectedNature ?? "unclear",
        scope: selectedScope ?? "unknown",
      }),
    [selectedNature, selectedPurpose, selectedScope, selectedWork],
  );

  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_view", {
      mode: "adoption_mini_report",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  }, []);

  const goToScreen = (nextIndex: ScreenIndex) => {
    setScreenIndex(nextIndex);
    setToastMessage("");
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_step_view", {
      mode: "adoption_mini_report",
      step: referenceDiagnosisScreens[nextIndex].id,
      selectedWork: selectedWork ?? "",
      selectedPurpose: selectedPurpose ?? "",
      selectedNature: selectedNature ?? "",
      selectedScope: selectedScope ?? "",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  };

  const start = () => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_start", {
      mode: "adoption_mini_report",
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    goToScreen(1);
  };

  const chooseWork = (workType: WorkType) => {
    setSelectedWork(workType);
    setSelectedPurpose(null);
    setSelectedNature(null);
    setSelectedScope(null);
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "work",
      value: workType,
      quickDiagnosisVersion,
    });
  };

  const choosePurpose = (purpose: AdoptionPurpose) => {
    setSelectedPurpose(purpose);
    setSelectedNature(null);
    setSelectedScope(null);
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "purpose",
      value: purpose,
      selectedWork: selectedWork ?? "",
      quickDiagnosisVersion,
    });
  };

  const chooseNature = (nature: WorkNature) => {
    setSelectedNature(nature);
    setSelectedScope(null);
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "nature",
      value: nature,
      selectedWork: selectedWork ?? "",
      selectedPurpose: selectedPurpose ?? "",
      quickDiagnosisVersion,
    });
  };

  const chooseScope = (scope: UsageScope) => {
    setSelectedScope(scope);
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "scope",
      value: scope,
      selectedWork: selectedWork ?? "",
      selectedPurpose: selectedPurpose ?? "",
      selectedNature: selectedNature ?? "",
      quickDiagnosisVersion,
    });
  };

  const showResult = () => {
    if (
      selectedWork === null ||
      selectedPurpose === null ||
      selectedNature === null ||
      selectedScope === null
    ) {
      return;
    }

    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_complete", {
      mode: "adoption_mini_report",
      selectedWork,
      selectedPurpose,
      selectedNature,
      selectedScope,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    goToScreen(5);
  };

  const requestPilot = () => {
    trackEvent("quick_diagnosis_pilot_cta_click", {
      mode: "adoption_mini_report",
      selectedWork: selectedWork ?? "",
      selectedPurpose: selectedPurpose ?? "",
      selectedNature: selectedNature ?? "",
      selectedScope: selectedScope ?? "",
      quickDiagnosisVersion,
    });
  };

  const copyResult = async () => {
    const summary = formatResultSummary(report);
    await writeClipboardText(summary);
    setToastMessage("결과를 복사했습니다");
    trackEvent("quick_diagnosis_result_copy", {
      mode: "adoption_mini_report",
      selectedWork: selectedWork ?? "",
      quickDiagnosisVersion,
    });
  };

  const saveResult = () => {
    const summary = formatResultSummary(report);
    window.sessionStorage.setItem("agentproof-quick-diagnosis-result", summary);
    setToastMessage("결과를 저장했습니다");
    trackEvent("quick_diagnosis_result_save", {
      mode: "adoption_mini_report",
      selectedWork: selectedWork ?? "",
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
              <OptionStepScreen
                options={workOptions}
                screenIndex={1}
                selectedValue={selectedWork}
                onBack={() => goToScreen(0)}
                onNext={() => goToScreen(2)}
                onSelect={chooseWork}
              />
            ) : null}
            {screenIndex === 2 ? (
              <OptionStepScreen
                options={adoptionPurposeOptions}
                screenIndex={2}
                selectedValue={selectedPurpose}
                onBack={() => goToScreen(1)}
                onNext={() => goToScreen(3)}
                onSelect={choosePurpose}
              />
            ) : null}
            {screenIndex === 3 ? (
              <OptionStepScreen
                options={workNatureOptions}
                screenIndex={3}
                selectedValue={selectedNature}
                onBack={() => goToScreen(2)}
                onNext={() => goToScreen(4)}
                onSelect={chooseNature}
              />
            ) : null}
            {screenIndex === 4 ? (
              <OptionStepScreen
                options={usageScopeOptions}
                screenIndex={4}
                selectedValue={selectedScope}
                onBack={() => goToScreen(3)}
                onNext={showResult}
                onSelect={chooseScope}
              />
            ) : null}
            {screenIndex === 5 ? (
              <ReportScreen
                report={report}
                toastMessage={toastMessage}
                onBack={() => goToScreen(4)}
                onCopy={() => void copyResult()}
                onPilotClick={requestPilot}
                onSave={saveResult}
              />
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}

function CardTopBar({ screenIndex }: { screenIndex: ScreenIndex }) {
  const screen: ReferenceDiagnosisScreen = referenceDiagnosisScreens[screenIndex];

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

function OptionStepScreen<TValue extends string>({
  options,
  screenIndex,
  selectedValue,
  onBack,
  onNext,
  onSelect,
}: {
  options: readonly DiagnosisOption<TValue>[];
  screenIndex: ScreenIndex;
  selectedValue: TValue | null;
  onBack: () => void;
  onNext: () => void;
  onSelect: (value: TValue) => void;
}) {
  const screen: ReferenceDiagnosisScreen = referenceDiagnosisScreens[screenIndex];

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
        {options.map((option) => {
          const selected = option.value === selectedValue;
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
          disabled={selectedValue === null}
          type="button"
          onClick={onNext}
        >
          {screen.cta}
        </button>
      </ReferenceActions>
    </div>
  );
}

function ReportScreen({
  report,
  toastMessage,
  onBack,
  onCopy,
  onPilotClick,
  onSave,
}: {
  report: AdoptionReport;
  toastMessage: string;
  onBack: () => void;
  onCopy: () => void;
  onPilotClick: () => void;
  onSave: () => void;
}) {
  const screen = referenceDiagnosisScreens[5];
  const pilotHref = `mailto:agentproof.ai@gmail.com?subject=${encodeURIComponent(
    "30일 파일럿 설계 요청",
  )}`;

  return (
    <div className={`${styles.referenceScreen} ${styles.referenceReportScreen}`}>
      <section className={styles.referenceReportHero} aria-labelledby="reference-title">
        <span>{report.workLabel}</span>
        <h1 id="reference-title">
          {report.headline.split("\n").map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p className={styles.referenceReportLead}>{report.natureLine}</p>
      </section>

      <ReportCard title="기대효과">
        <p className={styles.referenceSupportNote}>{report.expectedValueCopy}</p>
        {report.timeEstimate ? (
          <div className={styles.referenceEstimateBox}>
            <span>예상 절감</span>
            <strong>{report.timeEstimate}</strong>
            <small>예상 범위</small>
          </div>
        ) : report.valueItems ? (
          <CompactList items={report.valueItems} />
        ) : null}
      </ReportCard>

      <ReportCard title="권장 방식">
        <p className={styles.referenceMethod}>{report.method}</p>
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
          onClick={onSave}
        >
          결과 저장하기
        </button>
        <button
          className={`${styles.referencePrimaryButton} ${styles.referenceTertiaryButton}`}
          type="button"
          onClick={onCopy}
        >
          결과 복사하기
        </button>
      </ReferenceActions>
      <div className={styles.referenceCopyStatus} role="status" aria-live="polite">
        {toastMessage}
      </div>
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
