"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SurveyHeader } from "@/components/survey/SurveyHeader";
import { getWorkspaceByJob } from "@/lib/survey/quickDiagnosis";
import styles from "@/styles/survey.module.css";

const preparingFeatures = [
  {
    title: "초안 만들기",
    subtitle: "빠르게 시작해요",
  },
  {
    title: "쓰기 전 확인",
    subtitle: "볼 내용을 정리해요",
  },
  {
    title: "기록 남기기",
    subtitle: "나중에 설명하기 쉽게",
  },
] as const;

export function WorkspaceBetaPage() {
  const searchParams = useSearchParams();
  const workspace = getWorkspaceByJob(searchParams.get("job"));

  return (
    <>
      <SurveyHeader />
      <main className={`${styles.page} ${styles.quickPage}`}>
        <section className={styles.workspaceBeta} aria-labelledby="workspace-title">
          <p className={styles.quickEyebrow}>준비 중</p>
          <h1 id="workspace-title">
            {workspace.title},
            <br />
            먼저 하나만 확인해보세요.
          </h1>
          <p className={styles.workspaceLead}>
            곧 이 화면에서 문장을 만들고,
            <br />
            쓰기 전에 볼 내용을 함께 확인할 수 있습니다.
          </p>
          <ul className={styles.workspaceFeatureList}>
            {preparingFeatures.map((feature) => (
              <li key={feature.title}>
                <strong>{feature.title}</strong>
                <span>{feature.subtitle}</span>
              </li>
            ))}
          </ul>
          <div className={styles.quickActions}>
            <Link
              className={styles.quickPrimaryLink}
              href="mailto:agentproof.ai@gmail.com?subject=AgentProof%20%ED%8C%8C%EC%9D%BC%EB%9F%BF%20%EB%AC%B8%EC%9D%98"
            >
              파일럿 문의하기
            </Link>
            <Link className={styles.quickSecondaryLink} href="/survey/">
              무료 체크로 돌아가기
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
