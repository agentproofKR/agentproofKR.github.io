import Link from "next/link";

import { LEGAL_CONFIG } from "@/lib/legal";
import styles from "@/styles/survey.module.css";

export const metadata = {
  title: "초기 사용자 안내 | AgentProof",
  description:
    "AgentProof 초기 사용자 신청과 선택 연락 조건을 쉽게 안내합니다.",
};

export default function BetaTermsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.surveyPanel}>
        <Link className={styles.backLink} href="/survey/">
          체크로 돌아가기
        </Link>
        <p className={styles.eyebrow}>초기 사용자</p>
        <h1>초기 사용자 안내</h1>
        <p className={styles.lead}>
          설문 결과와 체크리스트는 바로 볼 수 있습니다.
          <br />
          베타 안내는 신청한 분께만 보냅니다.
        </p>

        <section className={styles.policySection}>
          <h2>무엇을 볼 수 있나요?</h2>
          <ul>
            <li>설문 결과와 이번 주 할 일</li>
            <li>체크리스트</li>
            <li>신청한 분께 보내는 베타 안내</li>
          </ul>
        </section>

        <section className={styles.policySection}>
          <h2>참여는 어떻게 정해지나요?</h2>
          <p>
            베타 참여는 신청 순서, 운영 상황, 필요한 사용자 유형에 따라 달라집니다.
          </p>
        </section>

        <section className={styles.policySection}>
          <h2>혜택이 생기면 어떻게 알 수 있나요?</h2>
          <p>
            혜택이 생기면 조건, 기간, 사용 방법을 먼저 알려드립니다.
          </p>
        </section>

        <section className={styles.policySection}>
          <h2>다른 사람에게 넘길 수 있나요?</h2>
          <p>
            아니요. 체험 혜택은 현금으로 바꾸거나 다른 사람에게 줄 수 없습니다.
          </p>
        </section>

        <section className={styles.policySection}>
          <h2>취소할 수 있나요?</h2>
          <p>
            네.{" "}
            <a href={`mailto:${LEGAL_CONFIG.contactEmail}`}>
              {LEGAL_CONFIG.contactEmail}
            </a>
            으로 요청하세요.
          </p>
        </section>

        <div className={styles.fairnessNotice}>
          <p>
            설문 답변, 점수, 구매 의향에 따라 다르게 대우하지 않습니다.
            <br />
            같은 사람이 여러 번 제출한 경우에는 한 번만 인정할 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
