import Link from "next/link";
import Image from "next/image";

import styles from "@/styles/landing.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <strong className={styles.footerBrand}>
          <Image
            src="/agentproof-logo-mark.png"
            width={786}
            height={891}
            alt=""
            aria-hidden="true"
          />
          <Image
            src="/agentproof-logo-wordmark.png"
            width={1064}
            height={217}
            alt="AgentProof"
          />
        </strong>
        <div>
          <p>업무 AI 도입 문제를 검증하는 Private beta</p>
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/privacy/request">권리 행사</Link>
          <Link href="/beta-terms">Founding Researcher 약관</Link>
          <span>agentproof.ai@gmail.com</span>
          <span>© 2026 AgentProof</span>
        </div>
      </div>
    </footer>
  );
}
