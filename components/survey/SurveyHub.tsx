"use client";

import Link from "next/link";
import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import { getPersonaPath, personaDefinitions } from "@/lib/survey/questions";
import type { Persona } from "@/lib/survey/types";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

const personaCards: Array<{
  persona: Persona;
  label: string;
  title: string;
  body: string;
  reward: string;
}> = [
  {
    persona: "practitioner",
    label: "01",
    title: "실무자",
    body: "AI 답변 신뢰성, 개인정보·기밀 입력 기준, 외부 제출 전 검토 기준을 확인합니다.",
    reward: "업무 AI 안전 사용 체크리스트",
  },
  {
    persona: "leader",
    label: "02",
    title: "대표·도입 담당자",
    body: "도입 우선순위, 데이터·프로세스 준비, 파일럿 실행 기준을 정리합니다.",
    reward: "AI 도입 우선순위 1페이지 리포트",
  },
  {
    persona: "security",
    label: "03",
    title: "보안·정책 담당자",
    body: "AI 자산, 정책, 접근통제, 로그, 공급자·사고대응 기준을 점검합니다.",
    reward: "AI 사용정책 스타터 체크리스트",
  },
];

export function SurveyHub() {
  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("survey_landing_view", {
      survey_version: personaDefinitions.practitioner.questions[0] ? "2026-06-21" : "",
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  }, []);

  const trackPersona = (persona: Persona) => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("persona_selected", {
      persona,
      survey_version: "2026-06-21",
      utm_source: stored.source ?? "",
      utm_campaign: stored.campaign ?? "",
    });
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="survey-hub-title">
        <Link className={styles.backLink} href="/">
          AgentProof 홈
        </Link>
        <p className={styles.eyebrow}>역할별 진단</p>
        <h1 id="survey-hub-title">역할별 AI 준비도 정밀진단</h1>
        <p className={styles.lead}>
          약 7–10분 동안 현재 AI 활용, 도입 준비, 정책·보안 기준을 점검하고 완료 즉시
          결과를 확인합니다. 이메일 입력 없이 기본 결과 확인 가능.
        </p>
        <div className={styles.summaryStrip} aria-label="진단 안내">
          <span>완료 즉시 결과 확인</span>
          <span>설문 답변은 URL에 저장하지 않음</span>
          <span>초기 사용자 프로그램 선택 가능</span>
        </div>
      </section>

      <section className={styles.roleGrid} aria-label="역할 선택">
        {personaCards.map((card) => {
          const definition = personaDefinitions[card.persona];
          return (
            <article className={styles.roleCard} key={card.persona}>
              <span className={styles.cardIndex}>{card.label}</span>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
              <dl>
                <div>
                  <dt>문항</dt>
                  <dd>{definition.questionCount}개</dd>
                </div>
                <div>
                  <dt>소요</dt>
                  <dd>{definition.estimatedMinutes}</dd>
                </div>
                <div>
                  <dt>결과물</dt>
                  <dd>{card.reward}</dd>
                </div>
              </dl>
              <Link
                className={styles.primaryLink}
                href={getPersonaPath(card.persona)}
                onClick={() => trackPersona(card.persona)}
              >
                {card.title} 진단 시작
              </Link>
            </article>
          );
        })}
      </section>

      <section className={styles.noticeBand} aria-labelledby="privacy-summary-title">
        <div>
          <h2 id="privacy-summary-title">개인정보와 응답 처리 요약</h2>
          <p>
            필수 응답은 역할별 준비도 결과 산출과 서비스 개발 목적에만 사용합니다. 이메일,
            회사명, 상담 목적은 결과 확인 뒤 선택 행동에서만 별도로 입력합니다.
          </p>
        </div>
        <Link href="/privacy/">개인정보처리방침 보기</Link>
      </section>
    </main>
  );
}
