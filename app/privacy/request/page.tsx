import Link from "next/link";

import { LEGAL_CONFIG } from "@/lib/legal";
import styles from "@/styles/survey.module.css";

export const metadata = {
  title: "개인정보 요청 방법 | AgentProof",
  description:
    "AgentProof 개인정보 열람, 수정, 삭제, 처리정지, 동의 철회 요청 방법입니다.",
};

const requestTypes = [
  "내 정보 열람",
  "잘못된 정보 수정",
  "설문 답변 또는 연락처 삭제",
  "처리정지",
  "필수 동의 철회",
  "베타 연락 철회",
  "인터뷰 연락 철회",
  "파일럿 상담 연락 철회",
] as const;

export default function PrivacyRequestPage() {
  const mailto = `mailto:${LEGAL_CONFIG.contactEmail}?subject=${encodeURIComponent(
    "[AgentProof] 개인정보 요청",
  )}`;

  return (
    <main className={styles.page}>
      <section className={styles.surveyPanel}>
        <Link className={styles.backLink} href="/privacy/">
          개인정보 안내
        </Link>
        <p className={styles.eyebrow}>개인정보 요청</p>
        <h1>개인정보 요청 방법</h1>
        <p className={styles.lead}>
          개인정보 열람, 수정, 삭제, 처리정지, 동의 철회를 이메일로 요청할 수
          있습니다.
          <br />
          필요한 정보만 적어 보내주세요.
        </p>

        <div className={styles.noticeBand}>
          <div>
            <h2>요청 접수</h2>
            <p>
              요청을 받으면 본인 확인에 필요한 최소 정보만 확인한 뒤 처리합니다.
            </p>
          </div>
          <a href={mailto}>{LEGAL_CONFIG.contactEmail}</a>
        </div>

        <section className={styles.policySection}>
          <h2>요청할 수 있는 일</h2>
          <ul>
            {requestTypes.map((type) => (
              <li key={type}>{type}</li>
            ))}
          </ul>
        </section>

        <section className={styles.policySection}>
          <h2>이메일에 적어주세요</h2>
          <ol>
            <li>요청 종류와 범위</li>
            <li>
              설문 참여 시각, 선택한 역할, 제출 경로처럼 본인 확인에 필요한 최소
              단서
            </li>
            <li>회신 받을 이메일 주소</li>
          </ol>
          <p>
            주민등록번호, 생년월일, 전화번호, 실제 내부 시스템명, 고객명, 보안
            취약점 상세는 보내지 마세요.
          </p>
        </section>

        <section className={styles.policySection}>
          <h2>처리 절차</h2>
          <ol>
            <li>요청 내용을 확인합니다.</li>
            <li>필요한 경우 본인 확인을 위해 추가 정보를 요청합니다.</li>
            <li>처리 결과를 이메일로 안내합니다.</li>
            <li>법령상 보관이 필요한 정보는 제한 사유와 기간을 설명합니다.</li>
          </ol>
        </section>

        <section className={styles.policySection}>
          <h2>운영자 정보</h2>
          <p>
            서비스명은 AgentProof이며 운영 형태는 {LEGAL_CONFIG.operatorType}
            입니다.{" "}
            {LEGAL_CONFIG.operatorName
              ? `개인정보처리자와 개인정보 보호책임자는 ${LEGAL_CONFIG.operatorName}입니다.`
              : "검증된 법적 표시명이 아직 설정되지 않아 공개 설문 저장은 비활성화됩니다."}{" "}
            개인정보 문의와 권리 요청은 {LEGAL_CONFIG.contactEmail}로 받습니다.
          </p>
        </section>

        <p className={styles.fieldHint}>
          처리 결과에 이의가 있으면 같은 이메일로 다시 알려주세요. 요청 범위와
          사유를 함께 확인하겠습니다.
        </p>
      </section>
    </main>
  );
}
