import Link from "next/link";

import { LEGAL_CONFIG } from "@/lib/legal";
import styles from "@/styles/survey.module.css";

export const metadata = {
  title: "초기 사용자 참여 프로그램 안내 | AgentProof",
  description: "AgentProof 초기 사용자 참여 프로그램과 선택 연락 조건 안내입니다.",
};

export default function BetaTermsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.surveyPanel}>
        <Link className={styles.backLink} href="/survey/">
          진단으로 돌아가기
        </Link>
        <p className={styles.eyebrow}>초기 사용자 프로그램</p>
        <h1>AgentProof 초기 사용자 참여 프로그램</h1>
        <p className={styles.lead}>
          유효한 설문 완료자는 즉시 역할별 결과와 체크리스트를 확인할 수 있습니다. 선택
          동의한 경우에만 베타 초대와 리워드 안내를 받을 수 있습니다.
        </p>
        <section className={styles.policySection}>
          <h2>즉시 제공 혜택</h2>
          <ul>
            <li>역할별 AI 준비도 결과</li>
            <li>인쇄 또는 다운로드 가능한 체크리스트</li>
            <li>실무자: 업무 AI 안전 사용 체크리스트</li>
            <li>대표·도입 담당자: AI 도입 우선순위 1페이지 리포트</li>
            <li>보안·정책 담당자: AI 사용정책 스타터 체크리스트</li>
          </ul>
        </section>
        <section className={styles.policySection}>
          <h2>베타와 선택 안내 조건</h2>
          <ul>
            <li>베타 선정은 보장되지 않습니다.</li>
            <li>베타 수용 인원과 제품 적합도에 따라 선정이 달라질 수 있습니다.</li>
            <li>체험 제공 여부, 수량, 기간, 사용 조건은 베타 시작 전에 별도로 안내합니다.</li>
            <li>선택 안내는 현금 가치가 없습니다.</li>
            <li>선택 안내와 체험 조건은 양도할 수 없습니다.</li>
            <li>최종 제공 범위와 허용 사용처는 베타 출시 시 공지합니다.</li>
            <li>리워드 자격은 좋은 답변, 구매 의향, 점수, 파일럿 관심 여부에 좌우되지 않습니다.</li>
            <li>정당한 참여자 1명당 1회 혜택이 원칙입니다.</li>
            <li>부정 또는 중복 제출은 제외될 수 있습니다.</li>
          </ul>
        </section>
        <p className={styles.fieldHint}>문의: {LEGAL_CONFIG.contactEmail}</p>
      </section>
    </main>
  );
}
