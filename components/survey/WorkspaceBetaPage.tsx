"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SurveyHeader } from "@/components/survey/SurveyHeader";
import { getWorkspaceByJob } from "@/lib/survey/quickDiagnosis";
import styles from "@/styles/survey.module.css";

const preparingFeatures = [
  {
    title: "초안 만들기",
    subtitle: "AI로 빠르게 시작",
  },
  {
    title: "보내기 전 확인",
    subtitle: "조심할 표현 보기",
  },
  {
    title: "고친 내용 남기기",
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
          <p className={styles.quickEyebrow}>Workspace Beta</p>
          <h1 id="workspace-title">
            {workspace.title},
            <br />
            먼저 1건만 확인해보세요.
          </h1>
          <p className={styles.workspaceLead}>
            곧 이 화면에서 답변이나 문장을 만들고,
            <br />
            보내기 전에 확인할 부분을 같이 볼 수 있습니다.
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
            <Link className={styles.quickPrimaryLink} href="/survey/">
              30일 동안 써보고 판단하기
            </Link>
            <Link className={styles.quickSecondaryLink} href="/survey/">
              무료 진단으로 돌아가기
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
