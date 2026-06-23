import Image from "next/image";
import Link from "next/link";

import styles from "@/styles/survey.module.css";

export function SurveyHeader() {
  return (
    <header className={styles.surveyHeader}>
      <div className={styles.surveyHeaderInner}>
        <Link className={styles.surveyBrand} href="/" aria-label="AgentProof 홈">
          <Image
            className={styles.surveyBrandMark}
            src="/agentproof-logo-mark.png"
            width={786}
            height={891}
            alt=""
            aria-hidden="true"
            priority
          />
          <Image
            className={styles.surveyBrandLogo}
            src="/agentproof-logo-wordmark.png"
            width={1064}
            height={217}
            alt=""
            aria-hidden="true"
            priority
          />
        </Link>
        <Link className={styles.surveyHeaderCta} href="/survey/">
          AI 활용 진단
        </Link>
      </div>
    </header>
  );
}
