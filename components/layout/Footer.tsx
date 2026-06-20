import Link from "next/link";

import styles from "@/styles/landing.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <strong>AgentProof</strong>
        <div>
          <p>초기 고객검증 단계 · 화면의 수치와 조직 정보는 예시 데이터입니다.</p>
          <Link href="/privacy">개인정보처리방침</Link>
          <span>contact@agentproof.kr</span>
        </div>
      </div>
    </footer>
  );
}
