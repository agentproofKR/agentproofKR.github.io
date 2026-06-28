"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { Header } from "@/components/layout/Header";
import { trackEvent } from "@/lib/analytics";
import {
  adoptionScopeOptions,
  buildAdoptionReport,
  exposureOptions,
  formatResultSummary,
  monthlyVolumeOptions,
  quickDiagnosisVersion,
  referenceDiagnosisScreens,
  timePerCaseOptions,
  workOptions,
  type AdoptionScope,
  type AdoptionReport,
  type DiagnosisOption,
  type Exposure,
  type MonthlyVolume,
  type ReferenceDiagnosisScreen,
  type TimePerCase,
  type WorkType,
} from "@/lib/survey/quickDiagnosis";
import {
  getQuickDiagnosisSubmissionMode,
  submitQuickDiagnosisToEndpoint,
  type QuickDiagnosisPayload,
} from "@/lib/survey/quickDiagnosisSubmission";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

type ScreenIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function QuickDiagnosisPage() {
  const [screenIndex, setScreenIndex] = useState<ScreenIndex>(0);
  const [selectedWork, setSelectedWork] = useState<WorkType | null>(null);
  const [selectedMonthlyVolume, setSelectedMonthlyVolume] = useState<MonthlyVolume | null>(
    null,
  );
  const [selectedTimePerCase, setSelectedTimePerCase] = useState<TimePerCase | null>(
    null,
  );
  const [selectedAdoptionScope, setSelectedAdoptionScope] = useState<AdoptionScope | null>(
    null,
  );
  const [selectedExposure, setSelectedExposure] = useState<Exposure | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [quickStorageStatus, setQuickStorageStatus] = useState("");
  const quickSessionIdRef = useRef<string | null>(null);
  const quickIdempotencyKeyRef = useRef<string | null>(null);
  const hasSubmittedQuickDiagnosisRef = useRef(false);

  const report = useMemo(
    () =>
      buildAdoptionReport({
        workType: selectedWork ?? "unknown",
        monthlyVolume: selectedMonthlyVolume ?? "unknown",
        timePerCase: selectedTimePerCase ?? "unknown",
        adoptionScope: selectedAdoptionScope ?? "unknown",
        exposure: selectedExposure ?? "unknown",
      }),
    [
      selectedAdoptionScope,
      selectedExposure,
      selectedMonthlyVolume,
      selectedTimePerCase,
      selectedWork,
    ],
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

  useEffect(() => {
    if (
      screenIndex !== 6 ||
      selectedWork === null ||
      selectedMonthlyVolume === null ||
      selectedTimePerCase === null ||
      selectedAdoptionScope === null ||
      selectedExposure === null ||
      hasSubmittedQuickDiagnosisRef.current
    ) {
      return;
    }

    const mode = getQuickDiagnosisSubmissionMode(
      process.env.NEXT_PUBLIC_SURVEY_API_URL,
    );
    if (mode.mode === "disabled") {
      return;
    }

    hasSubmittedQuickDiagnosisRef.current = true;
    const { idempotencyKey, sessionId } = getQuickDiagnosisIds({
      idempotencyKeyRef: quickIdempotencyKeyRef,
      sessionIdRef: quickSessionIdRef,
    });
    const stored = getStoredUtm(window.sessionStorage);
    const payload: QuickDiagnosisPayload = {
      kind: "quick_diagnosis",
      sessionId,
      idempotencyKey,
      quickDiagnosisVersion,
      honeypot: "",
      selections: {
        workType: selectedWork,
        monthlyVolume: selectedMonthlyVolume,
        timePerCase: selectedTimePerCase,
        adoptionScope: selectedAdoptionScope,
        exposure: selectedExposure,
      },
      result: {
        aiAdoptionScore: report.aiAdoptionScore,
        resultBand: report.resultBand,
        savingRateMin: report.savingRateMin,
        savingRateMax: report.savingRateMax,
        savingHoursMin: report.savingHoursMin,
        savingHoursMax: report.savingHoursMax,
        savingMoneyMin: report.savingMoneyMin,
        savingMoneyMax: report.savingMoneyMax,
        supportReviewAverage: report.supportReviewAverage,
        supportReviewMin: report.supportReviewMin,
        supportReviewMax: report.supportReviewMax,
        projectScale: report.projectScale,
        hourlyCost: report.hourlyCost,
      },
      utm: {
        source: stored.source ?? undefined,
        medium: stored.medium ?? undefined,
        campaign: stored.campaign ?? undefined,
        content: stored.content ?? undefined,
      },
    };

    void submitQuickDiagnosisToEndpoint(mode.endpoint, payload).then((result) => {
      if (result.ok) {
        setQuickStorageStatus("익명 결과가 저장되었습니다");
        return;
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("quick diagnosis submission failed", result.code);
      }
    });
  }, [
    report,
    screenIndex,
    selectedAdoptionScope,
    selectedExposure,
    selectedMonthlyVolume,
    selectedTimePerCase,
    selectedWork,
  ]);

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
      monthlyVolume: selectedMonthlyVolume ?? "",
      timePerCase: selectedTimePerCase ?? "",
      adoptionScope: selectedAdoptionScope ?? "",
      exposure: selectedExposure ?? "",
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
    setSelectedMonthlyVolume(null);
    setSelectedTimePerCase(null);
    setSelectedAdoptionScope(null);
    setSelectedExposure(null);
    hasSubmittedQuickDiagnosisRef.current = false;
    setQuickStorageStatus("");
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "work",
      value: workType,
      quickDiagnosisVersion,
    });
  };

  const chooseMonthlyVolume = (monthlyVolume: MonthlyVolume) => {
    setSelectedMonthlyVolume(monthlyVolume);
    setSelectedTimePerCase(null);
    setSelectedAdoptionScope(null);
    setSelectedExposure(null);
    hasSubmittedQuickDiagnosisRef.current = false;
    setQuickStorageStatus("");
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "monthly_volume",
      value: monthlyVolume,
      selectedWork: selectedWork ?? "",
      quickDiagnosisVersion,
    });
  };

  const chooseTimePerCase = (timePerCase: TimePerCase) => {
    setSelectedTimePerCase(timePerCase);
    setSelectedAdoptionScope(null);
    setSelectedExposure(null);
    hasSubmittedQuickDiagnosisRef.current = false;
    setQuickStorageStatus("");
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "time_per_case",
      value: timePerCase,
      selectedWork: selectedWork ?? "",
      monthlyVolume: selectedMonthlyVolume ?? "",
      quickDiagnosisVersion,
    });
  };

  const chooseAdoptionScope = (adoptionScope: AdoptionScope) => {
    setSelectedAdoptionScope(adoptionScope);
    setSelectedExposure(null);
    hasSubmittedQuickDiagnosisRef.current = false;
    setQuickStorageStatus("");
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "adoption_scope",
      value: adoptionScope,
      selectedWork: selectedWork ?? "",
      monthlyVolume: selectedMonthlyVolume ?? "",
      timePerCase: selectedTimePerCase ?? "",
      quickDiagnosisVersion,
    });
  };

  const chooseExposure = (exposure: Exposure) => {
    setSelectedExposure(exposure);
    hasSubmittedQuickDiagnosisRef.current = false;
    setQuickStorageStatus("");
    trackEvent("quick_diagnosis_option_select", {
      mode: "adoption_mini_report",
      field: "exposure",
      value: exposure,
      selectedWork: selectedWork ?? "",
      monthlyVolume: selectedMonthlyVolume ?? "",
      timePerCase: selectedTimePerCase ?? "",
      adoptionScope: selectedAdoptionScope ?? "",
      quickDiagnosisVersion,
    });
  };

  const showResult = () => {
    if (
      selectedWork === null ||
      selectedMonthlyVolume === null ||
      selectedTimePerCase === null ||
      selectedAdoptionScope === null ||
      selectedExposure === null
    ) {
      return;
    }

    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("quick_diagnosis_complete", {
      mode: "adoption_mini_report",
      selectedWork,
      monthlyVolume: selectedMonthlyVolume,
      timePerCase: selectedTimePerCase,
      adoptionScope: selectedAdoptionScope,
      exposure: selectedExposure,
      quickDiagnosisVersion,
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
    goToScreen(6);
  };

  const requestPilot = () => {
    trackEvent("quick_diagnosis_pilot_cta_click", {
      mode: "adoption_mini_report",
      selectedWork: selectedWork ?? "",
      monthlyVolume: selectedMonthlyVolume ?? "",
      timePerCase: selectedTimePerCase ?? "",
      adoptionScope: selectedAdoptionScope ?? "",
      exposure: selectedExposure ?? "",
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
                options={monthlyVolumeOptions}
                screenIndex={2}
                selectedValue={selectedMonthlyVolume}
                onBack={() => goToScreen(1)}
                onNext={() => goToScreen(3)}
                onSelect={chooseMonthlyVolume}
              />
            ) : null}
            {screenIndex === 3 ? (
              <OptionStepScreen
                options={timePerCaseOptions}
                screenIndex={3}
                selectedValue={selectedTimePerCase}
                onBack={() => goToScreen(2)}
                onNext={() => goToScreen(4)}
                onSelect={chooseTimePerCase}
              />
            ) : null}
            {screenIndex === 4 ? (
              <OptionStepScreen
                options={adoptionScopeOptions}
                screenIndex={4}
                selectedValue={selectedAdoptionScope}
                onBack={() => goToScreen(3)}
                onNext={() => goToScreen(5)}
                onSelect={chooseAdoptionScope}
              />
            ) : null}
            {screenIndex === 5 ? (
              <OptionStepScreen
                options={exposureOptions}
                screenIndex={5}
                selectedValue={selectedExposure}
                onBack={() => goToScreen(4)}
                onNext={showResult}
                onSelect={chooseExposure}
              />
            ) : null}
            {screenIndex === 6 ? (
              <ReportScreen
                report={report}
                storageStatus={quickStorageStatus}
                toastMessage={toastMessage}
                onBack={() => goToScreen(5)}
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
  storageStatus,
  toastMessage,
  onBack,
  onCopy,
  onPilotClick,
  onSave,
}: {
  report: AdoptionReport;
  storageStatus: string;
  toastMessage: string;
  onBack: () => void;
  onCopy: () => void;
  onPilotClick: () => void;
  onSave: () => void;
}) {
  const screen = referenceDiagnosisScreens[6];
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
      </ReportCard>

      <section
        className={styles.referenceMetricGrid}
        aria-label="AI 도입 결과 요약"
      >
        {report.metricCards.map((card) => (
          <article className={styles.referenceMetricCard} key={card.title}>
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            {card.caption ? <small>{card.caption}</small> : null}
          </article>
        ))}
      </section>
      <p className={styles.referenceMetricDisclaimer}>
        {report.supportDisclaimer}
      </p>

      <ReportCard title="권장 방식">
        <p className={styles.referenceMethod}>{report.method}</p>
      </ReportCard>

      <ReportCard title="사람이 봐야 하는 경우">
        <CompactList items={report.reviewPoints} />
      </ReportCard>

      <ReportCard title="30일 파일럿에서 볼 것">
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
      <p className={styles.referencePrivacyNote}>
        익명 결과는 서비스 개선을 위해 저장될 수 있습니다.
      </p>
      {storageStatus ? (
        <p className={styles.referenceStoredNote}>{storageStatus}</p>
      ) : null}
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

function getQuickDiagnosisIds({
  idempotencyKeyRef,
  sessionIdRef,
}: {
  sessionIdRef: { current: string | null };
  idempotencyKeyRef: { current: string | null };
}) {
  const sessionStorageKey = "agentproof-quick-diagnosis-session-id";
  const idempotencyStorageKey = "agentproof-quick-diagnosis-idempotency-key";
  const storedSessionId = window.sessionStorage.getItem(sessionStorageKey);
  const storedIdempotencyKey = window.sessionStorage.getItem(idempotencyStorageKey);

  const sessionId = sessionIdRef.current ?? storedSessionId ?? createUuid();
  const idempotencyKey =
    idempotencyKeyRef.current ??
    storedIdempotencyKey ??
    `quick-${sessionId}-${quickDiagnosisVersion}`;

  sessionIdRef.current = sessionId;
  idempotencyKeyRef.current = idempotencyKey;
  window.sessionStorage.setItem(sessionStorageKey, sessionId);
  window.sessionStorage.setItem(idempotencyStorageKey, idempotencyKey);

  return { idempotencyKey, sessionId };
}

function createUuid() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}
