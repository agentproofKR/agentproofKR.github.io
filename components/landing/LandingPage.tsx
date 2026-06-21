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
  ["이메일 필요?", "아니요. 결과는 이메일 없이 바로 볼 수 있습니다."],
  ["회사 자료를 넣어야 하나요?", "아니요. 기밀 자료는 절대 입력하지 않습니다."],
  ["AI Agent를 안 써도 되나요?", "네. ChatGPT나 Copilot만 써도 확인할 수 있습니다."],
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
                그냥 믿고 쓰고 있나요?
              </h1>
              <p className={styles.heroCopy}>
                오답·기밀유출·책임 문제.
                <br />
                3분이면 확인할 수 있습니다.
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
                  onClick={() => scrollToSection("#result-example")}
                >
                  결과 예시 보기 →
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
            aria-labelledby="roles-heading"
          >
            <div className={styles.wrap}>
              <div className={styles.rolesHead}>
                <div>
                  <p className={styles.sectionKicker}>문제</p>
                  <h2 id="roles-heading" className={styles.sectionTitle}>
                    AI 쓸 때,
                    <br />
                    가장 많이 막히는 3가지
                  </h2>
                </div>
                <p className={styles.sectionCopy}>
                  긴 설명 없이, 지금 가장 가까운 문제부터 확인하세요.
                </p>
              </div>

              <div className={styles.roleGrid}>
                {roleProblemCards.map((role) => (
                  <article className={styles.roleCard} key={role.index}>
                    <span>{role.index}</span>
                    <h3>{role.role}</h3>
                    <p className={styles.roleQuestion}>{role.problem}</p>
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
                      확인하기 <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            id="result-example"
            className={styles.finalCta}
            aria-labelledby="result-example-heading"
          >
            <div className={styles.wrap}>
              <div className={styles.finalPanel}>
                <p className={styles.sectionKicker}>결과 예시</p>
                <h2 id="result-example-heading">결과는 이렇게 나옵니다</h2>
                <div className={styles.resultExampleGrid}>
                  <article className={styles.resultExampleCard}>
                    <span className={styles.resultExampleLabel}>위험도</span>
                    <strong>주의</strong>
                  </article>
                  <article className={styles.resultExampleCard}>
                    <span className={styles.resultExampleLabel}>가장 큰 위험</span>
                    <strong>회사 자료 입력 기준 없음</strong>
                  </article>
                  <article className={styles.resultExampleCard}>
                    <span className={styles.resultExampleLabel}>이번 주 할 일</span>
                    <strong>금지 정보 5개 정하기</strong>
                  </article>
                </div>
                <div className={styles.finalActions}>
                  <Link
                    className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                    href="/survey/"
                    onClick={() => trackSurveyCta("result_example")}
                  >
                    내 결과 보기
                  </Link>
                </div>
                <p className={styles.finalNote}>SAMPLE DATA · 예시 결과입니다.</p>
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
                  답변 근거. 위험 테스트. 승인 기록. AI 사용을 한 화면에서 봅니다.
                </p>
              </div>

              <div className={styles.showcase} aria-label="제품 화면 미리보기">
                <div className={styles.showcaseHead}>
                  <p>AgentProof 대시보드</p>
                  <span>SAMPLE DATA · 예시 화면</span>
                </div>
                <div className={styles.productStage}>
                  <div className={styles.desktopDashboard}>
                    <Image
                      src="/agentproof-dashboard-sample.png"
                      width={1775}
                      height={886}
                      priority
                      sizes="(max-width: 767px) 0px, 1200px"
                      alt="AgentProof 업무용 AI 검증 대시보드 샘플. 위험 점수, 테스트 통과율, 배포 승인 상태, 근거 문서, 최근 테스트 결과를 보여줍니다."
                    />
                  </div>
                  <MobileDashboard />
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
                  결과를 먼저 보여드리고, 체크리스트나 인터뷰·상담은 원할 때만 이어갑니다.
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
                  <li><i>01</i><div><b>답변 근거</b></div></li>
                  <li><i>02</i><div><b>위험 테스트</b></div></li>
                  <li><i>03</i><div><b>승인 기록</b></div></li>
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
              <h2 id="faq-heading" className={styles.sectionTitle}>자주 묻는 질문</h2>
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
                  <br />
                  한 번만 확인하세요.
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
          <small>AI 사용 현황</small>
          <h3>업무 AI 사용 현황</h3>
          <p>문서 근거 · 사용 기준 · 승인 기록</p>
        </div>
        <div className={styles.mobileKpis}>
          <Metric label="위험 점수" value="32" detail="지난 7일 -12%" />
          <Metric label="테스트 통과율" value="92.4%" detail="+4.7%" />
          <Metric label="배포 승인" value="7 / 12" detail="대기 5건" />
          <Metric label="열린 이슈" value="18" detail="우선 검토 4건" />
        </div>
        <article className={styles.mobileCard}>
          <h4>근거가 있는 답변</h4>
          <strong>연차 사용은 어떻게 신청하나요?</strong>
          <p>
            인사시스템에서 신청할 수 있으며, 최소 1일 전 신청이 필요합니다. 팀장
            승인 후 인사팀 검토로 완료됩니다.
          </p>
          <dl>
            <div>
              <dt>인사규정 12조</dt>
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
            ["권한 검토", "통과"],
          ].map(([label, status]) => (
            <div className={styles.mobileTest} key={label}>
              <span>{label}</span>
              <b
                className={
                  status === "경고" ? styles.statusWarn : styles.statusOk
                }
              >
                {status}
              </b>
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

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={styles.mobileKpi}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{detail}</small>
    </div>
  );
}
