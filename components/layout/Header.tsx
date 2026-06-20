import Image from "next/image";
import Link from "next/link";

import styles from "@/styles/landing.module.css";

type HeaderProps = {
  onNavClick: (target: string) => void;
};

export function Header({ onNavClick }: HeaderProps) {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.navWrap}>
        <a className={styles.brand} href="#top" aria-label="AgentProof 홈">
          <Image
            className={styles.brandMark}
            src="/agentproof-logo-mark.png"
            width={786}
            height={891}
            alt=""
            aria-hidden="true"
            priority
          />
          <Image
            className={styles.brandLogo}
            src="/agentproof-logo-wordmark.png"
            width={1064}
            height={217}
            alt=""
            aria-hidden="true"
            priority
          />
        </a>
        <nav className={styles.navLinks} aria-label="주요 메뉴">
          <a href="#product" onClick={() => onNavClick("#product")}>
            MVP
          </a>
          <a href="#roles" onClick={() => onNavClick("#roles")}>
            고객 가설
          </a>
          <a href="#process" onClick={() => onNavClick("#process")}>
            파일럿
          </a>
        </nav>
        <Link
          className={`${styles.button} ${styles.buttonDark} ${styles.headerButton}`}
          href="/survey/"
        >
          역할별 AI 준비도
        </Link>
      </div>
    </header>
  );
}
