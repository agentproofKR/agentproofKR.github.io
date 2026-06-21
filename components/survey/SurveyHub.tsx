"use client";

import Link from "next/link";
import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import { getPersonaPath } from "@/lib/survey/questions";
import type { Persona } from "@/lib/survey/types";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

const personaCards: Array<{
  persona: Persona;
  title: string;
  question: string;
  body: string;
  cta: string;
}> = [
  {
    persona: "practitioner",
    title: "실무자",
    question: "AI를 직접 업무에 쓰고 있나요?",
    body: "답변 확인, 회사 정보 입력, 외부 문서 사용 기준을 점검합니다.",
    cta: "실무자 점검 시작",
  },
  {
    persona: "leader",
    title: "대표·도입 담당자",
    question: "회사에 AI를 도입하거나 도입 순서를 정해야 하나요?",
    body: "어떤 업무부터 시작할지와 현재 준비 상태를 점검합니다.",
    cta: "도입 준비 점검 시작",
  },
  {
    persona: "security",
    title: "보안·정책 담당자",
    question: "직원의 AI 사용 기준과 개인정보·권한을 관리하나요?",
    body: "허용 도구, 정보 입력, 기록, 사고 대응 기준을 점검합니다.",
    cta: "보안·정책 점검 시작",
  },
];

const helperItems = [
  "내가 AI를 직접 업무에 쓴다 → 실무자",
  "도입할 업무·예산·일정을 정한다 → 대표·도입 담당자",
  "보안·개인정보·사내 규정을 맡고 있다 → 보안·정책 담당자",
];

export function SurveyHub() {
  useEffect(() => {
    const initial = readUtmFromUrl(window.location.href);
    storeInitialUtm(initial, window.sessionStorage);
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("survey_landing_view", {
      survey_version: "2026-06-21",
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
        <p className={styles.eyebrow}>AI 업무 자가점검</p>
        <h1 id="survey-hub-title">내 역할에 맞는 점검을 선택하세요</h1>
        <p className={styles.lead}>
          지금 맡고 있는 일과 가장 가까운 항목을 골라주세요.
          <br />약 7~10분이 걸리며, 이메일 없이 결과를 볼 수 있습니다.
        </p>
      </section>

      <section className={styles.roleGrid} aria-label="역할 선택">
        {personaCards.map((card) => (
          <article className={styles.roleCard} key={card.persona}>
            <h2>{card.title}</h2>
            <p className={styles.cardQuestion}>{card.question}</p>
            <p>{card.body}</p>
            <Link
              className={styles.primaryLink}
              href={getPersonaPath(card.persona)}
              onClick={() => trackPersona(card.persona)}
            >
              {card.cta}
            </Link>
          </article>
        ))}
      </section>

      <section
        className={styles.helperBlock}
        aria-labelledby="role-helper-title"
      >
        <h2 id="role-helper-title">어떤 항목을 골라야 할지 모르겠나요?</h2>
        <ul>
          {helperItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        className={styles.noticeBand}
        aria-labelledby="survey-next-title"
      >
        <div>
          <h2 id="survey-next-title">
            설문을 마치면 결과를 바로 보여드립니다.
          </h2>
          <p>이메일은 베타 참여나 상담을 신청할 때만 선택해서 입력합니다.</p>
        </div>
        <div className={styles.linkRow}>
          <Link href="/privacy/">개인정보 안내</Link>
          <Link href="/beta-terms/">초기 사용자 프로그램 안내</Link>
        </div>
      </section>
    </main>
  );
}
