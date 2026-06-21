import Link from "next/link";

import { LEGAL_CONFIG } from "@/lib/legal";
import styles from "@/styles/survey.module.css";

export const metadata = {
  title: "초기 사용자 참여 안내 | AgentProof",
  description:
    "AgentProof 초기 사용자 참여 신청과 선택 연락 조건을 쉽게 안내합니다.",
};

export default function BetaTermsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.surveyPanel}>
        <Link className={styles.backLink} href="/survey/">
          점검으로 돌아가기
        </Link>
        <p className={styles.eyebrow}>초기 사용자</p>
        <h1>초기 사용자 참여 안내</h1>
        <p className={styles.lead}>
          설문을 마치면 결과와 체크리스트를 바로 볼 수 있습니다.
          <br />
          베타 참여를 신청하면 서비스가 준비될 때 이메일로 알려드립니다.
        </p>

        <section className={styles.policySection}>
          <h2>무엇을 받을 수 있나요?</h2>
          <ul>
            <li>설문 결과</li>
            <li>역할별 체크리스트</li>
            <li>베타 서비스 우선 안내</li>
          </ul>
        </section>

        <section className={styles.policySection}>
          <h2>신청하면 꼭 베타에 참여할 수 있나요?</h2>
          <p>
            아니요.
            <br />
            서비스 준비 상태와 모집 인원에 따라 참여가 어려울 수 있습니다.
          </p>
        </section>

        <section className={styles.policySection}>
          <h2>체험 혜택은 정해졌나요?</h2>
          <p>
            아직 정해지지 않았습니다.
            <br />
            혜택이 생기면 수량, 사용기간, 사용방법을 먼저 알려드립니다.
          </p>
        </section>

        <section className={styles.policySection}>
          <h2>돈으로 바꾸거나 다른 사람에게 줄 수 있나요?</h2>
          <p>
            아니요.
            <br />
            체험 혜택은 현금으로 바꾸거나 다른 사람에게 넘길 수 없습니다.
          </p>
        </section>

        <section className={styles.policySection}>
          <h2>신청을 취소할 수 있나요?</h2>
          <p>
            네.
            <br />
            <a href={`mailto:${LEGAL_CONFIG.contactEmail}`}>
              {LEGAL_CONFIG.contactEmail}
            </a>
            으로 취소를 요청할 수 있습니다.
          </p>
        </section>

        <div className={styles.fairnessNotice}>
          <p>
            설문 답변, 점수, 구매 의향에 따라 혜택을 다르게 주지 않습니다.
            <br />
            같은 사람이 여러 번 제출한 경우에는 한 번만 인정할 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
