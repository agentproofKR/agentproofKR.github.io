"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SurveyHeader } from "@/components/survey/SurveyHeader";
import { getWorkspaceByJob } from "@/lib/survey/quickDiagnosis";
import styles from "@/styles/survey.module.css";

const preparingFeatures = [
  "AI 초안 만들기",
  "보내기 전 확인하기",
  "더 나은 표현으로 고치기",
  "실제로 썼는지 남기기",
  "30일 동안 써보고 정리하기",
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
            선택한 일부터 작게 써볼 수 있게 준비 중입니다.
          </h1>
          <p className={styles.workspaceLead}>
            AI로 답변이나 문서를 만들고,
            <br />
            보내기 전에 확인할 부분을 같이 볼 수 있습니다.
          </p>
          <div className={styles.workspaceSelected}>
            선택한 일: <strong>{workspace.title}</strong>
          </div>
          <ul className={styles.workspaceFeatureList}>
            {preparingFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
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
