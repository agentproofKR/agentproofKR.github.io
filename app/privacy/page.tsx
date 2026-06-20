import Link from "next/link";

import styles from "@/styles/landing.module.css";

export const metadata = {
  title: "개인정보처리방침 | AgentProof",
  description: "AgentProof 초기 고객검증 신청 정보 처리 기준입니다.",
};

export default function PrivacyPage() {
  return (
    <main className={styles.privacyPage}>
      <Link className={styles.backLink} href="/">
        ← AgentProof로 돌아가기
      </Link>
      <h1>개인정보처리방침</h1>
      <p>
        AgentProof는 초기 고객검증과 샘플 리포트 안내를 위해 신청자가 직접 입력한 최소 정보만
        수집합니다.
      </p>
      <section>
        <h2>수집 항목</h2>
        <p>역할, 현재 단계, 걱정되는 문제, 회사/팀명, 업무 이메일, 선택 입력한 상황 설명.</p>
      </section>
      <section>
        <h2>이용 목적</h2>
        <p>샘플 리포트 안내, 파일럿 상담, 고객검증 단계의 문제 적합성 확인에 사용합니다.</p>
      </section>
      <section>
        <h2>보유 기간</h2>
        <p>고객검증 종료 후 3개월까지 보관한 뒤 삭제합니다.</p>
      </section>
      <section>
        <h2>주의 사항</h2>
        <p>
          실제 기밀자료, 고객 데이터, 주민등록번호, 건강·금융정보 등 민감정보는 입력하지 않습니다.
          삭제 요청은 contact@agentproof.kr로 접수합니다.
        </p>
      </section>
    </main>
  );
}
