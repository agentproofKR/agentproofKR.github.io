import Link from "next/link";

import { LEGAL_CONFIG } from "@/lib/legal";
import styles from "@/styles/survey.module.css";

export const metadata = {
  title: "권리 행사 요청 | AgentProof",
  description: "AgentProof 개인정보 열람, 정정, 삭제, 처리정지, 동의철회 요청 안내입니다.",
};

export default function PrivacyRequestPage() {
  const mailto = `mailto:${LEGAL_CONFIG.contactEmail}?subject=${encodeURIComponent(
    "[AgentProof] 개인정보 권리 행사 요청",
  )}`;

  return (
    <main className={styles.page}>
      <section className={styles.surveyPanel}>
        <Link className={styles.backLink} href="/privacy/">
          개인정보처리방침
        </Link>
        <p className={styles.eyebrow}>PRIVACY REQUEST</p>
        <h1>권리 행사 요청</h1>
        <p className={styles.lead}>
          열람, 정정, 삭제, 처리정지, 동의철회 요청은 아래 이메일로 접수합니다. 요청에는
          본인 확인에 필요한 최소 정보와 요청 범위만 포함해주세요.
        </p>
        <div className={styles.noticeBand}>
          <div>
            <h2>요청 가능한 권리</h2>
            <p>열람, 정정, 삭제, 처리정지, 동의철회, 베타·인터뷰·파일럿 연락 동의 철회</p>
          </div>
          <a href={mailto}>{LEGAL_CONFIG.contactEmail}</a>
        </div>
        <section className={styles.policySection}>
          <h2>작성 시 포함할 내용</h2>
          <ol>
            <li>요청 종류와 범위</li>
            <li>설문 참여 시각 또는 유입경로 등 본인 확인에 필요한 최소 단서</li>
            <li>회신 받을 이메일 주소</li>
          </ol>
          <p>
            주민등록번호, 생년월일, 전화번호, 실제 내부 시스템명, 고객명, 보안 취약점 상세는
            보내지 마세요.
          </p>
        </section>
      </section>
    </main>
  );
}
