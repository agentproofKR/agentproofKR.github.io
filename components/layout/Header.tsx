import styles from "@/styles/landing.module.css";

type HeaderProps = {
  onCtaClick: (placement: "header", opener: HTMLElement) => void;
  onNavClick: (target: string) => void;
};

export function Header({ onCtaClick, onNavClick }: HeaderProps) {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.navWrap}>
        <a className={styles.brand} href="#" aria-label="AgentProof 홈">
          <span aria-hidden="true">[·]</span>
          AgentProof
        </a>
        <nav className={styles.navLinks} aria-label="주요 섹션">
          <a href="#diagnostic" onClick={() => onNavClick("#diagnostic")}>
            진단 화면
          </a>
          <a href="#roles" onClick={() => onNavClick("#roles")}>
            역할별 가치
          </a>
          <a href="#process" onClick={() => onNavClick("#process")}>
            진행 방식
          </a>
        </nav>
        <button
          className={`${styles.button} ${styles.buttonDark} ${styles.headerButton}`}
          type="button"
          onClick={(event) => onCtaClick("header", event.currentTarget)}
        >
          AI 준비도 진단
        </button>
      </div>
    </header>
  );
}
