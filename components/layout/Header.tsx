import Image from "next/image";
import Link from "next/link";

import styles from "@/styles/landing.module.css";

type HeaderProps = {
  onNavClick: (target: string) => void;
  ctaHref?: string;
  homeHref?: string;
  navBaseHref?: string;
};

export function Header({
  ctaHref = "/survey/",
  homeHref = "#top",
  navBaseHref = "",
  onNavClick,
}: HeaderProps) {
  const navHref = (target: string) => `${navBaseHref}${target}`;

  return (
    <header className={styles.siteHeader}>
      <div className={styles.navWrap}>
        <a className={styles.brand} href={homeHref} aria-label="AgentProof 홈">
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
          <a href={navHref("#problem")} onClick={() => onNavClick("#problem")}>
            문제
          </a>
          <a href={navHref("#product")} onClick={() => onNavClick("#product")}>
            대시보드
          </a>
          <a href={navHref("#faq")} onClick={() => onNavClick("#faq")}>
            FAQ
          </a>
        </nav>
        <Link
          className={`${styles.button} ${styles.buttonDark} ${styles.headerButton}`}
          href={ctaHref}
        >
          무료 체크
        </Link>
      </div>
    </header>
  );
}
