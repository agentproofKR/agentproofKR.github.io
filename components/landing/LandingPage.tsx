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

  const handleProductClick = () => {
    document
      .querySelector("#product")
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
                회사에서 AI 쓰고 있는데,
                <br />
                어디까지 믿어도 될까요?
              </h1>
              <p className={styles.heroCopy}>
                ChatGPT, Copilot, Claude, 사내 챗봇, AI Agent 사용 중 생길 수 있는
                오답, 기밀 유출, 승인 책임, 보안 기준 문제를 3분 안에 점검해보세요.
              </p>
              <div className={styles.heroActions}>
                <Link
                  className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                  href="/survey/"
                  onClick={() => trackSurveyCta("hero")}
                >
                  무료로 AI 업무 위험도 확인하기
                </Link>
                <button
                  className={styles.textLink}
                  type="button"
                  onClick={handleProductClick}
                >
                  결과 예시 보기 ↘
                </button>
              </div>
              <ul className={styles.heroMeta} aria-label="대상 안내">
                <li>이메일 없이 결과 확인 가능</li>
                <li>회사 기밀 입력 없음</li>
                <li>약 3분 소요</li>
              </ul>

              <section
                id="product"
                className={styles.showcase}
                aria-label="제품 화면 미리보기"
              >
                <div className={styles.showcaseHead}>
                <p>결과 예시 · AI 업무 위험도</p>
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
                      alt="AgentProof 업무용 AI 검증 대시보드 샘플. 위험 점수, 테스트 통과율, 배포 승인 상태, 근거 문서, 최근 테스트 결과를 보여준다."
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
              </section>
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
                    AI를 쓰기 시작하면,
                    <br />
                    이런 문제가 먼저 생깁니다
                  </h2>
                </div>
                <p className={styles.sectionCopy}>
                  지금 가장 가까운 문제에서 바로 점검을 시작할 수 있습니다.
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
                      이 문제로 점검하기 <span aria-hidden="true">→</span>
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
                <h2 id="result-example-heading">설문을 마치면 이런 결과를 바로 확인합니다</h2>
                <p>AI 업무 위험도: 주의 · 가장 큰 위험: 회사 자료 입력 기준 부족 · 이번 주 할 일: 입력 금지 정보 5가지 정하기</p>
                <p className={styles.finalNote}>추천 결과물: AI 사용 체크리스트 · SAMPLE DATA</p>
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
                  진행은
                  <br />
                  간단합니다
                </h2>
                <p className={styles.processCopy}>
                  결과를 먼저 보여드리고, 체크리스트와 인터뷰·파일럿 상담은 선택으로 받습니다.
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
                    3분 점검 시작
                  </Link>
                  <p>기밀자료 없이 점검할 수 있습니다.</p>
                </div>
              </div>
              <div
                className={styles.deliverable}
                role="region"
                aria-label="파일럿 결과물"
              >
                <header>
                  <b>받게 되는 것</b>
                  <span>AgentProof가 확인하는 것</span>
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
              <div className={styles.roleGrid}>
                {[
                  ["이메일을 꼭 입력해야 하나요?", "아니요. 결과는 이메일 없이 바로 볼 수 있습니다."],
                  ["회사 자료나 기밀을 입력해야 하나요?", "아니요. 회사명, 고객명, 기밀자료는 입력하지 않습니다."],
                  ["AI Agent를 쓰지 않아도 참여할 수 있나요?", "네. ChatGPT, Copilot, Claude, Gemini, 사내 챗봇을 업무에 쓰거나 검토 중이어도 참여할 수 있습니다."],
                ].map(([question, answer]) => (
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
                  지금 가장 필요한 서비스를
                  <br />
                  알려주세요.
                </h2>
                <p>3분 점검으로 우리 회사 AI 사용 기준을 먼저 확인하세요.</p>
                <div className={styles.finalActions}>
                  <Link
                    className={`${styles.button} ${styles.buttonDark} ${styles.buttonLarge}`}
                    href="/survey/"
                    onClick={() => trackSurveyCta("final")}
                  >
                    무료로 AI 업무 위험도 확인하기
                  </Link>
                  <a
                    className={`${styles.button} ${styles.buttonOutline} ${styles.buttonLarge}`}
                    href="#product"
                  >
                    결과 예시 다시 보기
                  </a>
                </div>
                <p className={styles.finalNote}>
                  체크리스트와 인터뷰·파일럿 상담은 결과 확인 후 선택할 수 있습니다.
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
          <p>문서 검색 · 사용 기준 · 승인 기록</p>
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
            인사시스템에서 신청할 수 있으며, 최소 1일 전 신청이 필요합니다. 팀장
            승인 후 인사팀 검토로 완료됩니다.
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
