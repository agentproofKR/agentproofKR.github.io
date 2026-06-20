"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LeadModal } from "@/components/lead/LeadModal";
import { trackEvent } from "@/lib/analytics";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/landing.module.css";

import { decisionSteps, processSteps, roleCards } from "./content";

type ModalPlacement = "header" | "hero" | "process";

type LandingPageProps = {
  showVisualBaseline?: boolean;
};

export function LandingPage({ showVisualBaseline = false }: LandingPageProps) {
  const queryVisualBaseline = useSyncExternalStore(
    subscribeToLocationSnapshot,
    getVisualBaselineSnapshot,
    () => false,
  );
  const isVisualBaselineVisible = showVisualBaseline || queryVisualBaseline;
  const [modalPlacement, setModalPlacement] = useState<ModalPlacement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("page_view", {
      landing_variant: "v4.1",
      utm_source: stored.source ?? "",
      utm_medium: stored.medium ?? "",
      utm_campaign: stored.campaign ?? "",
      utm_content: stored.content ?? "",
    });
  }, []);

  const openLeadModal = (placement: ModalPlacement, opener: HTMLElement) => {
    openerRef.current = opener;
    setModalPlacement(placement);
    trackEvent("lead_modal_open", { placement });
  };

  const closeLeadModal = () => {
    setModalPlacement(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  const handleDiagnosticClick = () => {
    trackEvent("diagnostic_preview_click", { placement: "hero" });
    document.querySelector("#diagnostic")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavClick = (target: string) => {
    trackEvent("nav_anchor_click", { target });
  };

  return (
    <>
      {isVisualBaselineVisible ? (
        <div className={styles.visualBaseline} aria-hidden="true">
          <picture>
            <source media="(max-width: 767px)" srcSet="/visual-baseline/mobile-full.png" />
            <img src="/visual-baseline/pc-full.png" alt="" />
          </picture>
        </div>
      ) : null}
      <div
        className={
          isVisualBaselineVisible ? styles.semanticLandingBaseline : styles.semanticLanding
        }
      >
        <Header onCtaClick={openLeadModal} onNavClick={handleNavClick} />
        <main>
          <section className={styles.hero} aria-labelledby="hero-heading">
            <div className={styles.wrap}>
              <p className={styles.eyebrow}>AI WORK READINESS</p>
              <h1 id="hero-heading">
                AI를 업무에 쓸 때,
                <br />
                무엇을 맡기고 무엇을 지킬지.
              </h1>
              <p className={styles.heroCopy}>
                AgentProof는 조직의 AI 사용 현황과 업무별 기회를 파악하고, 정확성·개인정보·책임
                위험을 함께 진단해 도입 우선순위와 사용 기준으로 정리합니다.
              </p>
              <div className={styles.heroActions}>
                <button
                  className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                  type="button"
                  onClick={(event) => openLeadModal("hero", event.currentTarget)}
                >
                  우리 조직 AI 준비도 확인
                </button>
                <button className={styles.textLink} type="button" onClick={handleDiagnosticClick}>
                  진단 화면 보기 ↘
                </button>
              </div>
              <p className={styles.heroNote}>초기 진단 · 계정 연동이나 기밀자료 없이 시작</p>
            </div>
          </section>

          <section id="diagnostic" className={styles.diagnosticSection} aria-label="진단 화면">
            <div className={styles.wrap}>
              <DiagnosticPreview />
            </div>
          </section>

          <section id="roles" className={styles.rolesSection} aria-labelledby="roles-heading">
            <div className={styles.wrap}>
              <div className={styles.sectionHead}>
                <p className={styles.sectionKicker}>FOR EVERY ROLE</p>
                <h2 id="roles-heading">
                  같은 AI를 봐도,
                  <br />
                  필요한 판단은 다릅니다.
                </h2>
              </div>

              <div className={styles.roleGrid}>
                {roleCards.map((role) => (
                  <article className={styles.roleCard} key={role.number}>
                    <span>{role.number}</span>
                    <h3>{role.title}</h3>
                    <p>{role.body}</p>
                  </article>
                ))}
              </div>

              <ol className={styles.decisionFlow} aria-label="AI 도입 판단 흐름">
                {decisionSteps.map((step, index) => (
                  <li
                    className={index === decisionSteps.length - 1 ? styles.lastDecision : ""}
                    key={step.label}
                  >
                    <span>{step.label}</span>
                    <strong>{step.title}</strong>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section id="process" className={styles.processSection} aria-labelledby="process-heading">
            <div className={styles.wrap}>
              <p className={styles.darkKicker}>AI READINESS</p>
              <h2 id="process-heading">
                AI를 막기보다,
                <br />
                안전하게 쓸 기준을 만듭니다.
              </h2>
              <p className={styles.processCopy}>
                현재 사용 중인 도구와 도입하려는 업무를 확인해, 바로 실행할 수 있는 우선순위와
                가이드로 정리합니다.
              </p>
              <ol className={styles.processSteps}>
                {processSteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <strong>{step.title}</strong>
                    <p>{step.body}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.processAction}>
                <button
                  className={`${styles.button} ${styles.buttonLight} ${styles.buttonLarge}`}
                  type="button"
                  onClick={(event) => openLeadModal("process", event.currentTarget)}
                >
                  우리 조직 AI 준비도 확인
                </button>
                <p>1차 진단에는 계정 연동이나 실제 기밀자료가 필요하지 않습니다.</p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
      <LeadModal
        isOpen={modalPlacement !== null}
        onClose={closeLeadModal}
        placement={modalPlacement ?? "hero"}
      />
    </>
  );
}

function subscribeToLocationSnapshot() {
  return () => undefined;
}

function getVisualBaselineSnapshot() {
  return new URLSearchParams(window.location.search).get("visualBaseline") === "1";
}

function DiagnosticPreview() {
  const riskRows = [
    {
      level: "제한",
      title: "개인정보 포함 문서 외부 AI 업로드",
      meta: "2개 부서",
      className: styles.riskDanger,
    },
    {
      level: "조건부",
      title: "고객문의 답변 초안 자동화",
      meta: "사용 검토",
      className: styles.riskWarning,
    },
    {
      level: "도입 추천",
      title: "회의록·보고서 초안 작성",
      meta: "낮은 위험",
      className: styles.riskSuccess,
    },
  ];

  return (
    <div className={styles.productStage}>
      <div
        className={styles.appWindow}
        role="group"
        aria-label="AgentProof AI 업무 도입 진단 샘플 화면"
      >
        <div className={styles.windowBar}>
          <div className={styles.windowDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className={styles.windowTitle}>agentproof / ai-readiness / 2026-Q2</div>
          <div className={styles.sampleLabel}>SAMPLE DATA</div>
        </div>
        <div className={styles.appShell}>
          <aside className={styles.sidebar} aria-hidden="true">
            <div className={styles.appBrand}>AgentProof</div>
            <span>WORKSPACE</span>
            <b>Overview</b>
            <b>Use cases</b>
            <b>Risks</b>
            <b>Guidelines</b>
            <span>ASSESSMENT</span>
            <b>History</b>
            <b>Settings</b>
          </aside>
          <div className={styles.reportArea}>
            <div className={styles.projectTop}>
              <div>
                <p>ORGANIZATION / AI READINESS</p>
                <h2>업무 AI 도입 진단</h2>
                <span>SAMPLE ASSESSMENT · 18 WORKFLOWS · 6 TOOLS</span>
              </div>
              <strong>기준 보완 필요</strong>
            </div>
            <div className={styles.tabs} aria-hidden="true">
              <b>개요</b>
              <span>업무별 판단</span>
              <span>도입 가이드</span>
            </div>
            <div className={styles.adoptionStatus}>
              <span>ADOPTION STATUS</span>
              <h3>도입 가능 · 기준 보완</h3>
              <p>5개 업무는 우선 도입, 4개 업무는 사용 기준 보완이 필요합니다.</p>
              <dl>
                <div>
                  <dt>18</dt>
                  <dd>WORKFLOWS</dd>
                </div>
                <div>
                  <dt>5</dt>
                  <dd>PRIORITY</dd>
                </div>
                <div>
                  <dt>4</dt>
                  <dd>GAPS</dd>
                </div>
              </dl>
              <div className={styles.statusBars} aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className={styles.workspaceGrid}>
              <article className={styles.riskPanel}>
                <header>
                  <strong>업무별 판단</strong>
                  <span>18 use cases</span>
                </header>
                {riskRows.map((row) => (
                  <div className={styles.riskRow} key={row.level}>
                    <span className={row.className}>{row.level}</span>
                    <strong>{row.title}</strong>
                    <em>{row.meta} ›</em>
                  </div>
                ))}
              </article>
              <article className={styles.detailPanel}>
                <span>AP-021 · DATA HANDLING</span>
                <h3>개인정보 포함 문서 외부 AI 업로드</h3>
                <div className={styles.detailBlock}>
                  <em>업무 상황</em>
                  <p className={styles.detailQuote}>
                    &quot;지난달 고객 상담 내역을 요약해줘.&quot;
                  </p>
                </div>
                <div className={styles.detailBlock}>
                  <em>확인된 위험</em>
                  <p>
                    개인정보가 포함된 파일을 승인되지 않은 외부 AI에 업로드할 가능성이 있습니다.
                  </p>
                </div>
                <div className={styles.detailBlock}>
                  <em>근거</em>
                  <p>영업·고객지원 2개 업무에서 같은 데이터 처리 공백을 확인했습니다.</p>
                </div>
                <strong>비식별화 + 승인된 도구 사용 + 검토 책임 지정</strong>
              </article>
            </div>
          </div>
        </div>
      </div>
      <ul className={styles.capabilityStrip}>
        <li>진단 대상</li>
        <li>업무용 생성형 AI</li>
        <li>문서·보고서 작성</li>
        <li>사내 지식 검색</li>
        <li>AI 업무 자동화</li>
      </ul>
    </div>
  );
}
