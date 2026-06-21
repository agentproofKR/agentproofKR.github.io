"use client";

import Link from "next/link";
import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

const helperItems = [
  "이메일 없이 결과 확인 가능",
  "회사명, 고객명, 기밀자료 입력 없음",
  "10문항, 약 3분 소요",
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

  const trackStart = () => {
    const stored = getStoredUtm(window.sessionStorage);
    trackEvent("survey_start_click", {
      placement: "survey_intro",
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
        <h1 id="survey-hub-title">3분 안에 AI 업무 위험도를 확인합니다</h1>
        <p className={styles.lead}>
          ChatGPT, Copilot, Claude, 사내 챗봇, AI Agent 사용 중 생길 수 있는
          오답, 기밀 유출, 승인 책임, 보안 기준 문제를 점검합니다.
          <br />약 3분이 걸리며, 이메일 없이 결과를 볼 수 있습니다.
        </p>
        <div className={styles.actions}>
          <Link
            className={styles.primaryLink}
            href="/survey/practitioner/"
            onClick={trackStart}
          >
            3분 점검 시작
          </Link>
        </div>
      </section>

      <section
        className={styles.helperBlock}
        aria-labelledby="survey-helper-title"
      >
        <h2 id="survey-helper-title">시작 전에 꼭 알아둘 점</h2>
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
            설문을 마치면 위험도와 이번 주 할 일을 바로 보여드립니다.
          </h2>
          <p>이메일은 체크리스트, 인터뷰, 상담을 신청할 때만 선택해서 입력합니다.</p>
        </div>
        <div className={styles.linkRow}>
          <Link href="/privacy/">개인정보 안내</Link>
          <Link href="/beta-terms/">초기 사용자 프로그램 안내</Link>
        </div>
      </section>
    </main>
  );
}
