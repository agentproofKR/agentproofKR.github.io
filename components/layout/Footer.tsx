import Link from "next/link";

import styles from "@/styles/landing.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <strong>AgentProof</strong>
        <div>
          <p>업무 AI 도입 문제를 검증하는 Private beta</p>
          <Link href="/privacy">개인정보처리방침</Link>
          <span>contact@agentproof.kr</span>
          <span>© 2026 AgentProof</span>
        </div>
      </div>
    </footer>
  );
}
