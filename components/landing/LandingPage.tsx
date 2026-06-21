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
  pilotDeliverables,
  processSteps,
  productTabs,
  roleProblemCards,
} from "./content";

type ProductTabId = (typeof productTabs)[number]["id"];

type LandingPageProps = {
  showVisualBaseline?: boolean;
};

export function LandingPage({ showVisualBaseline = false }: LandingPageProps) {
  const [activeTabId, setActiveTabId] = useState<ProductTabId>(productTabs[0].id);
  const activeTab = productTabs.find((tab) => tab.id === activeTabId) ?? productTabs[0];

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
      viewport_group: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
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
      viewport_group: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    });
  };

  const handleProductClick = () => {
    document.querySelector("#product")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <source media="(max-width: 767px)" srcSet="/reference-agentproof-v51-mobile-full.png" />
            <img src="/reference-agentproof-v51-desktop-full.png" alt="" />
          </picture>
        </div>
      ) : null}
      <div className={showVisualBaseline ? styles.semanticLandingBaseline : styles.semanticLanding}>
        <Header onNavClick={handleNavClick} />
        <main id="main">
          <section id="top" className={styles.hero} aria-labelledby="hero-heading">
            <div className={styles.wrap}>
              <div className={styles.betaPill}>
                <i aria-hidden="true" />
                초기 사용자 모집
              </div>
              <h1 id="hero-heading">
                업무 AI,
                <br />
                어디까지 맡겨도 될까요?
              </h1>
              <p className={styles.heroCopy}>
                실무자의 사용 기준, 도입 담당자의 우선순위, 보안 담당자의 통제 기준을
                진단합니다.
              </p>
              <div className={styles.heroActions}>
                <Link
                  className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                  href="/survey/"
                  onClick={() => trackSurveyCta("hero")}
                >
                  역할별 AI 준비도 정밀진단
                </Link>
                <button className={styles.textLink} type="button" onClick={handleProductClick}>
                  예시 화면 보기 ↘
                </button>
              </div>
              <ul className={styles.heroMeta} aria-label="대상 안내">
                <li>실무자</li>
                <li>대표·도입 담당자</li>
                <li>보안·정책 담당자</li>
              </ul>

              <section id="product" className={styles.showcase} aria-label="제품 화면 미리보기">
                <div className={styles.showcaseHead}>
                  <p>예시 화면 · 문서·규정 검색 Agent</p>
                  <span>샘플 데이터 · 제품 콘셉트</span>
                </div>
                <div className={styles.productStage}>
                  <div className={styles.desktopDashboard}>
                    <Image
                      src="/agentproof_mvp_dashboard_agentproof.png"
                      width={1775}
                      height={886}
                      priority
                      sizes="(max-width: 767px) 0px, 1200px"
                      alt="AgentProof 업무용 AI 검증 대시보드 샘플. 위험 점수, 테스트 통과율, 배포 승인 상태, 근거 문서, 최근 테스트 결과를 보여준다."
                    />
                  </div>
                  <MobileDashboard />
                </div>
                <div className={styles.featureTabs} role="tablist" aria-label="핵심 기능">
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
              </section>
            </div>
          </section>

          <section id="roles" className={styles.rolesSection} aria-labelledby="roles-heading">
            <div className={styles.wrap}>
              <div className={styles.rolesHead}>
                <div>
                  <p className={styles.sectionKicker}>역할별 고민</p>
                  <h2 id="roles-heading" className={styles.sectionTitle}>
                    어디에서 가장
                    <br />
                    막히시나요?
                  </h2>
                </div>
                <p className={styles.sectionCopy}>
                  역할마다 필요한 첫 서비스가 다릅니다.
                </p>
              </div>

              <div className={styles.roleGrid}>
                {roleProblemCards.map((role) => (
                  <article className={styles.roleCard} key={role.index}>
                    <span>{role.index}</span>
                    <h3>{role.role}</h3>
                    <p className={styles.roleQuestion}>“{role.problem}”</p>
                    <strong>
                      <i aria-hidden="true" />
                      {role.outcome}
                    </strong>
                    <Link
                      className={styles.roleCta}
                      href={role.surveyPath}
                      onClick={() => {
                        trackEvent("role_problem_click", {
                          placement: role.placement,
                          role: role.role,
                          problem: role.defaultProblem,
                        });
                        trackSurveyCta(role.placement, role.surveyPath.replace("/survey/", "").replace("/", ""));
                      }}
                    >
                      이 문제 선택 <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="process" className={styles.processSection} aria-labelledby="process-heading">
            <div className={`${styles.wrap} ${styles.processGrid}`}>
              <div>
                <p className={styles.darkKicker}>처음 검증할 업무</p>
                <h2 id="process-heading" className={styles.sectionTitle}>
                  첫 파일럿은
                  <br />
                  문서·규정 검색부터.
                </h2>
                <p className={styles.processCopy}>
                  답변, 근거, 정책 위험을 실제 질문으로 검증합니다.
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
                    역할별 진단 시작
                  </Link>
                  <p>기밀자료 없이 상담할 수 있습니다.</p>
                </div>
              </div>
              <div className={styles.deliverable} role="region" aria-label="파일럿 결과물">
                <header>
                  <b>받게 되는 것</b>
                  <span>확인하는 결과</span>
                </header>
                <ol>
                  {pilotDeliverables.map((item) => (
                    <li key={item.number}>
                      <i>{item.number}</i>
                      <div>
                        <b>{item.title}</b>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className={styles.finalCta} aria-labelledby="final-cta-heading">
            <div className={styles.wrap}>
              <div className={styles.finalPanel}>
                <h2 id="final-cta-heading">
                  지금 가장 필요한 서비스를
                  <br />
                  알려주세요.
                </h2>
                <p>응답을 바탕으로 첫 고객과 기능 우선순위를 정합니다.</p>
                <div className={styles.finalActions}>
                  <Link
                    className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                    href="/survey/"
                    onClick={() => trackSurveyCta("final")}
                  >
                    역할별 진단 시작
                  </Link>
                  <a className={`${styles.button} ${styles.buttonOutline} ${styles.buttonLarge}`} href="#product">
                    예시 화면 다시 보기
                  </a>
                </div>
                <p className={styles.finalNote}>
                  참여자에게 역할별 체크리스트와 파일럿 안내를 보냅니다.
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

function MobileDashboard() {
  return (
    <div
      className={styles.mobileDashboard}
      role="group"
      aria-label="AgentProof 모바일 제품 화면 샘플"
    >
      <div className={styles.mobileTop}>
        <div className={styles.mobileBrand}>
          <Image
            src="/agentproof-logo-mark.png"
            width={786}
            height={891}
            alt=""
            aria-hidden="true"
          />
          AgentProof
        </div>
        <div>SAMPLE DATA</div>
      </div>
      <div className={styles.mobileBody}>
        <div className={styles.mobileTitle}>
          <small>OVERVIEW / AI ASSURANCE</small>
          <h3>업무 Agent 검증 현황</h3>
          <p>문서 검색 · 정책 검증 · 배포 승인</p>
        </div>
        <div className={styles.mobileKpis}>
          <Metric label="위험 점수" value="32" detail="↓ 12% 지난 7일" />
          <Metric label="테스트 통과율" value="92.4%" detail="↑ 4.7%" />
          <Metric label="배포 승인" value="7 / 12" detail="대기 5건" />
          <Metric label="열린 이슈" value="18" detail="우선 검토 4건" />
        </div>
        <article className={styles.mobileCard}>
          <h4>근거가 있는 답변</h4>
          <strong>연차 사용은 어떻게 신청하나요?</strong>
          <p>
            인사시스템에서 신청할 수 있으며, 최소 1일 전 신청이 필요합니다. 팀장 승인 후
            인사팀 검토로 완료됩니다.
          </p>
          <dl>
            <div>
              <dt>인사규정 제12조</dt>
              <dd>v2.1</dd>
            </div>
            <div>
              <dt>연차 운영 가이드</dt>
              <dd>v1.3</dd>
            </div>
          </dl>
        </article>
        <article className={styles.mobileCard}>
          <h4>최근 검증 결과</h4>
          {[
            ["환각 테스트", "통과"],
            ["정책 위반", "통과"],
            ["오래된 문서 참조", "경고"],
            ["권한 검사", "통과"],
          ].map(([label, status]) => (
            <div className={styles.mobileTest} key={label}>
              <span>{label}</span>
              <b className={status === "경고" ? styles.statusWarn : styles.statusOk}>{status}</b>
            </div>
          ))}
        </article>
        <div className={styles.mobileActions}>
          <span>감사 리포트</span>
          <strong>배포 승인 요청</strong>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className={styles.mobileKpi}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{detail}</small>
    </div>
  );
}
