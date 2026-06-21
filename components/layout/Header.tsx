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
          <a href="#problem" onClick={() => onNavClick("#problem")}>
            문제
          </a>
          <a href="#result-example" onClick={() => onNavClick("#result-example")}>
            결과
          </a>
          <a href="#product" onClick={() => onNavClick("#product")}>
            대시보드
          </a>
          <a href="#faq" onClick={() => onNavClick("#faq")}>
            FAQ
          </a>
        </nav>
        <Link
          className={`${styles.button} ${styles.buttonDark} ${styles.headerButton}`}
          href="/survey/"
        >
          3분 체크
        </Link>
      </div>
    </header>
  );
}
