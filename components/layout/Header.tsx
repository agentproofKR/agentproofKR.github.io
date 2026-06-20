import styles from "@/styles/landing.module.css";

type HeaderProps = {
  onCtaClick: (placement: "header", opener: HTMLElement) => void;
  onNavClick: (target: string) => void;
};

export function Header({ onCtaClick, onNavClick }: HeaderProps) {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.navWrap}>
        <a className={styles.brand} href="#top" aria-label="AgentProof 홈">
          <span aria-hidden="true">[·]</span>
          AgentProof
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
        <button
          className={`${styles.button} ${styles.buttonDark} ${styles.headerButton}`}
          type="button"
          onClick={(event) => onCtaClick("header", event.currentTarget)}
        >
          3분 진단
        </button>
      </div>
    </header>
  );
}
