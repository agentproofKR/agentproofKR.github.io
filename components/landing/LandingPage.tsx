"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { trackEvent } from "@/lib/analytics";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/landing.module.css";

import {
  landingVariant,
  processSteps,
  productTabs,
  roleProblemCards,
} from "./content";

type ProductTabId = (typeof productTabs)[number]["id"];

type LandingPageProps = {
  showVisualBaseline?: boolean;
};

const faqs = [
  ["이메일 필요?", "아니요. 결과는 바로 볼 수 있어요."],
  ["회사 자료를 넣어야 하나요?", "아니요. 기밀 자료는 입력하지 않습니다."],
  ["AI Agent를 안 써도 되나요?", "네. ChatGPT나 Copilot만 써도 됩니다."],
  ["무료인가요?", "3분 체크는 무료입니다."],
  ["결과가 보안 인증인가요?", "아니요. 빠른 자가 확인용입니다."],
] as const;

export function LandingPage({ showVisualBaseline = false }: LandingPageProps) {
  const [activeTabId, setActiveTabId] = useState<ProductTabId>(
    productTabs[0].id,
  );
  const activeTab =
    productTabs.find((tab) => tab.id === activeTabId) ?? productTabs[0];

  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("page_view", {
      landing_variant: landingVariant,
      utm_source: stored.source ?? "",
      utm_medium: stored.medium ?? "",
      utm_campaign: stored.campaign ?? "",
      utm_content: stored.content ?? "",
      viewport_group: window.matchMedia("(max-width: 767px)").matches
        ? "mobile"
        : "desktop",
    });
  }, []);

  const trackSurveyCta = (placement: string, persona = "") => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("persona_selected", {
      placement,
      persona,
      survey_version: "2026-06-21",
      utm_source: stored.source ?? "",
      utm_medium: stored.medium ?? "",
      utm_campaign: stored.campaign ?? "",
      utm_content: stored.content ?? "",
      viewport_group: window.matchMedia("(max-width: 767px)").matches
        ? "mobile"
        : "desktop",
    });
  };

  const scrollToSection = (target: string) => {
    document
      .querySelector(target)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavClick = (target: string) => {
    trackEvent("nav_anchor_click", { target });
  };

  const selectTab = (tabId: ProductTabId) => {
    setActiveTabId(tabId);
    trackEvent("product_tab_select", { tab: tabId });
  };

  return (
    <>
      {showVisualBaseline ? (
        <div className={styles.visualBaseline} aria-hidden="true">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet="/reference-agentproof-v51-mobile-full.png"
            />
            <img src="/reference-agentproof-v51-desktop-full.png" alt="" />
          </picture>
        </div>
      ) : null}
      <div
        className={
          showVisualBaseline
            ? styles.semanticLandingBaseline
            : styles.semanticLanding
        }
      >
        <Header onNavClick={handleNavClick} />
        <main id="main">
          <section
            id="top"
            className={styles.hero}
            aria-labelledby="hero-heading"
          >
            <div className={styles.wrap}>
              <div className={styles.betaPill}>
                <i aria-hidden="true" />
                초기 사용자 모집
              </div>
              <h1 id="hero-heading">
                AI 답변,
                <br />
                그냥 쓰면 위험합니다.
              </h1>
              <p className={styles.heroCopy}>
                오답·기밀유출·책임 문제.
                <br />
                3분 안에 확인하세요.
              </p>
              <div className={styles.heroActions}>
                <Link
                  className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                  href="/survey/"
                  onClick={() => trackSurveyCta("hero")}
                >
                  바로 확인하기
                </Link>
                <button
                  className={styles.textLink}
                  type="button"
                  onClick={() => scrollToSection("#product")}
                >
                  대시보드 보기
                </button>
              </div>
              <ul className={styles.heroMeta} aria-label="체크 안내">
                <li>이메일 없음</li>
                <li>기밀 입력 없음</li>
                <li>10문항</li>
              </ul>
            </div>
          </section>

          <section
            id="problem"
            className={styles.rolesSection}
            aria-labelledby="problem-heading"
          >
            <div className={styles.wrap}>
              <div className={styles.rolesHead}>
                <div>
                  <p className={styles.sectionKicker}>문제</p>
                  <h2 id="problem-heading" className={styles.sectionTitle}>
                    AI 쓸 때,
                    <br />
                    가장 많이 막히는 3가지
                  </h2>
                </div>
                <p className={styles.sectionCopy}>
                  가까운 문제부터 확인하세요.
                </p>
              </div>

              <div className={styles.roleGrid} data-testid="problem-grid">
                {roleProblemCards.map((role) => (
                  <article className={styles.roleCard} key={role.index}>
                    <span>{role.index}</span>
                    <h3>{role.role}</h3>
                    <p className={styles.roleQuestion}>{role.problem}</p>
                    <Link
                      className={styles.roleCta}
                      href={role.surveyPath}
                      onClick={() => {
                        trackEvent("role_problem_click", {
                          placement: role.placement,
                          problem: role.defaultProblem,
                        });
                        trackSurveyCta(
                          role.placement,
                          role.surveyPath
                            .replace("/survey/", "")
                            .replace("/", ""),
                        );
                      }}
                    >
                      {role.outcome} <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            id="product"
            className={`${styles.rolesSection} ${styles.productSection}`}
            aria-labelledby="product-heading"
          >
            <div className={styles.wrap}>
              <div className={styles.rolesHead}>
                <div>
                  <p className={styles.sectionKicker}>대시보드</p>
                  <h2 id="product-heading" className={styles.sectionTitle}>
                    AgentProof로 이렇게 관리합니다
                  </h2>
                </div>
                <p className={styles.sectionCopy}>
                  답변 근거.
                  <br />
                  위험 테스트.
                  <br />
                  승인 기록.
                  <br />
                  AI 사용을 한 화면에서 관리합니다.
                </p>
              </div>

              <div className={styles.showcase} aria-label="제품 화면 미리보기">
                <div className={styles.showcaseHead}>
                  <p>AgentProof 대시보드</p>
                  <span>SAMPLE DATA · 예시 화면</span>
                </div>
                <div className={styles.productStage}>
                  <div
                    className={styles.desktopDashboard}
                    data-testid="desktop-dashboard"
                  >
                    <Image
                      src="/agentproof-dashboard-sample.png"
                      width={1775}
                      height={886}
                      priority
                      sizes="(max-width: 767px) 720px, 1200px"
                      alt="AgentProof 업무용 AI 검증 대시보드 샘플. 위험 점수, 테스트 통과율, 배포 승인 상태, 근거 문서, 최근 테스트 결과를 보여줍니다."
                    />
                  </div>
                </div>
                <div
                  className={styles.featureTabs}
                  role="tablist"
                  aria-label="핵심 기능"
                >
                  {productTabs.map((tab) => {
                    const selected = tab.id === activeTabId;
                    return (
                      <button
                        key={tab.id}
                        className={`${styles.tab} ${selected ? styles.activeTab : ""}`}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => selectTab(tab.id)}
                      >
                        <small>{tab.number}</small>
                        <b>{tab.title}</b>
                      </button>
                    );
                  })}
                </div>
                <p className={styles.tabPanel} aria-live="polite">
                  {activeTab.body}
                </p>
              </div>
            </div>
          </section>

          <section
            id="process"
            className={styles.processSection}
            aria-labelledby="process-heading"
          >
            <div className={`${styles.wrap} ${styles.processGrid}`}>
              <div>
                <p className={styles.darkKicker}>진행 방식</p>
                <h2 id="process-heading" className={styles.sectionTitle}>
                  3분이면 끝납니다
                </h2>
                <p className={styles.processCopy}>
                  10문항만 답하면
                  <br />
                  위험과 할 일이 나옵니다.
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
                  <Link
                    className={`${styles.button} ${styles.buttonLight}`}
                    href="/survey/"
                    onClick={() => trackSurveyCta("process")}
                  >
                    바로 확인하기
                  </Link>
                  <p>이메일은 마지막에만 선택합니다.</p>
                </div>
              </div>
              <div
                className={styles.deliverable}
                role="region"
                aria-label="AgentProof 관리 항목"
              >
                <header>
                  <b>AgentProof가 남기는 것</b>
                  <span>SAMPLE DATA</span>
                </header>
                <ol>
                  <li>
                    <i>01</i>
                    <div>
                      <b>답변 근거</b>
                    </div>
                  </li>
                  <li>
                    <i>02</i>
                    <div>
                      <b>위험 테스트</b>
                    </div>
                  </li>
                  <li>
                    <i>03</i>
                    <div>
                      <b>승인 기록</b>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          <section
            id="faq"
            className={styles.rolesSection}
            aria-labelledby="faq-heading"
          >
            <div className={styles.wrap}>
              <p className={styles.sectionKicker}>FAQ</p>
              <h2 id="faq-heading" className={styles.sectionTitle}>
                자주 묻는 질문
              </h2>
              <div className={styles.faqList}>
                {faqs.map(([question, answer]) => (
                  <article className={styles.roleCard} key={question}>
                    <h3>{question}</h3>
                    <p>{answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            className={styles.finalCta}
            aria-labelledby="final-cta-heading"
          >
            <div className={styles.wrap}>
              <div className={styles.finalPanel}>
                <h2 id="final-cta-heading">
                  AI, 그냥 쓰기 전에
                  <br />한 번만 확인하세요.
                </h2>
                <p>
                  10문항.
                  <br />
                  3분.
                  <br />
                  이메일 없음.
                </p>
                <div className={styles.finalActions}>
                  <Link
                    className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                    href="/survey/"
                    onClick={() => trackSurveyCta("final")}
                  >
                    바로 확인하기
                  </Link>
                  <a
                    className={`${styles.button} ${styles.buttonOutline} ${styles.buttonLarge}`}
                    href="#product"
                  >
                    대시보드 보기
                  </a>
                </div>
                <p className={styles.finalNote}>
                  체크리스트·인터뷰·상담은 결과 확인 뒤 선택합니다.
                </p>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
