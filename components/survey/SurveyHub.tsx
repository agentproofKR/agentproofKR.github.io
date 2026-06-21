"use client";

import Link from "next/link";
import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import { getStoredUtm, readUtmFromUrl, storeInitialUtm } from "@/lib/utm";
import styles from "@/styles/survey.module.css";

const helperItems = ["회사명 입력 없음", "기밀 입력 없음", "약 3분"];

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
        <p className={styles.eyebrow}>3분 AI 안전 체크</p>
        <h1 id="survey-hub-title">
          우리 팀 AI 사용,
          <br />
          안전할까요?
        </h1>
        <p className={styles.lead}>
          10문항으로 확인합니다.
          <br />
          이메일 없이 결과를 볼 수 있어요.
        </p>
        <div className={styles.actions}>
          <Link
            className={styles.primaryLink}
            href="/survey/practitioner/"
            onClick={trackStart}
          >
            시작하기
          </Link>
        </div>
      </section>

      <section
        className={styles.helperBlock}
        aria-labelledby="survey-helper-title"
      >
        <h2 id="survey-helper-title">시작 전에 이것만 확인하세요</h2>
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
            끝나면 바로 보여드립니다.
          </h2>
          <p>위험과 이번 주 할 일을 정리합니다.</p>
        </div>
        <div className={styles.linkRow}>
          <Link href="/privacy/">개인정보 안내</Link>
          <Link href="/beta-terms/">초기 사용 안내</Link>
        </div>
      </section>
    </main>
  );
}
