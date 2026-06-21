import Link from "next/link";

import { LEGAL_CONFIG } from "@/lib/legal";
import styles from "@/styles/survey.module.css";

export const metadata = {
  title: "개인정보처리방침 | AgentProof",
  description: "AgentProof 역할별 AI 준비도 정밀진단 개인정보 처리 기준입니다.",
};

const sections = [
  {
    title: "1. 개인정보처리자 및 보호책임자",
    body: `서비스명은 AgentProof이며 운영 형태는 ${LEGAL_CONFIG.operatorType}입니다. 개인정보처리자는 ${LEGAL_CONFIG.operatorName}이고 개인정보 문의 및 권리행사 연락처는 ${LEGAL_CONFIG.contactEmail}입니다.`,
  },
  {
    title: "2. 개인정보 처리 목적",
    body: "역할별 AI 준비도 결과 산출, 고객군과 서비스 수요 분석, AgentProof 기능·진단 기준·검증 리포트 개발 및 개선, 중복 제출과 오남용 방지를 위해 처리합니다.",
  },
  {
    title: "3. 처리 항목",
    body: "역할, 조직 규모, 업종, AI 활용·도입 단계, 사용 도구 및 업무 유형, 정책·보안·운영 수준에 관한 설문 응답, 설문 세션 식별자, 제출 시각, 유입경로(UTM)를 처리합니다. 이메일과 회사명은 베타, 인터뷰, 파일럿 상담을 선택한 경우에만 별도로 수집합니다.",
  },
  {
    title: "4. 수집 방법",
    body: "웹사이트의 역할별 AI 준비도 정밀진단과 결과 페이지의 선택 참여 양식을 통해 이용자가 직접 입력한 정보만 수집합니다.",
  },
  {
    title: "5. 보유 및 이용 기간",
    body: "설문 원문 응답과 세션 연결정보는 제출일로부터 6개월 보유 후 삭제합니다. 베타 연락처는 동의일로부터 12개월 또는 베타 프로그램 종료 후 90일까지 중 먼저 도래하는 날까지, 인터뷰 연락처는 대상 선정 완료 또는 마지막 연락일로부터 90일, 파일럿 상담 연락처는 마지막 상담 연락일로부터 1년까지 보유합니다.",
  },
  {
    title: "6. 파기 절차와 방법",
    body: "보유 기간이 끝난 원문 응답과 연락처는 복구하기 어렵도록 삭제하며, 삭제 요청 처리 기록은 삭제 대상 원문을 보유하지 않는 범위에서 남깁니다. 개인을 식별할 수 없도록 집계한 통계만 보유할 수 있습니다.",
  },
  {
    title: "7. 제3자 제공 여부",
    body: "현재 AgentProof는 설문 응답과 연락처를 제3자에게 판매하거나 제공하지 않습니다. 법령에 따른 요청이 있는 경우에는 필요한 범위에서만 검토합니다.",
  },
  {
    title: "8. 개인정보 처리업무 위탁",
    body: "공개 사이트는 GitHub, Inc.의 GitHub Pages 정적 호스팅으로 제공됩니다. 설문 제출, 동의 기록, 선택 연락처 저장은 Supabase, Inc.의 Edge Functions와 Supabase Postgres로 처리합니다. Supabase 프로젝트의 Postgres 저장 리전은 ap-northeast-2(서울)로 검증되었고, Edge Function은 Supabase Edge Runtime의 전 세계 엣지 인프라에서 요청 위치에 가까운 노드에서 실행될 수 있습니다. 선택 연락처 이메일은 별도 테이블에 암호화하여 보관합니다.",
  },
  {
    title: "9. 개인정보 국외 이전",
    body: "설문 응답, 세션 식별자, UTM, 동의 기록, 선택 연락처는 서비스 제공과 이용자 동의에 따른 위탁 처리 과정에서 GitHub 및 Supabase 인프라로 이전·처리될 수 있습니다. 현재 Supabase Postgres 저장 리전은 ap-northeast-2(서울)이며, Edge Function 실행은 Supabase의 글로벌 엣지 네트워크에서 처리될 수 있습니다. 보유 기간은 이 방침의 보유 및 이용 기간 조항을 따릅니다.",
  },
  {
    title: "10. 자동수집 정보 및 분석",
    body: "유입경로(UTM), persona, survey_version, question_count, completion_time_band, result_band 등 비식별 운영 이벤트만 사용할 수 있습니다. 이메일, 회사명, 자유 입력, 개별 답변, 사고 상세, 문서명, 취약점 상세는 분석 이벤트에 포함하지 않습니다.",
  },
  {
    title: "11. 안전성 확보조치",
    body: "클라이언트 번들에 secret을 포함하지 않으며, 서버 저장소 연결 시 RLS, 직접 익명 쓰기 차단, 엄격한 CORS, honeypot, rate limiting, idempotency key, 입력 길이 제한, PII-safe logging을 적용합니다.",
  },
  {
    title: "12. 열람·정정·삭제·처리정지·동의철회 방법",
    body: `권리 행사는 ${LEGAL_CONFIG.contactEmail}로 요청할 수 있습니다. 요청 시 본인 확인에 필요한 최소 정보와 요청 범위를 알려주세요. 자세한 절차는 /privacy/request/ 페이지에서 안내합니다.`,
  },
  {
    title: "13. 만 14세 미만 이용 제한",
    body: "본 진단은 만 14세 이상을 대상으로 합니다. 만 14세 미만의 개인정보를 의도적으로 수집하지 않습니다.",
  },
  {
    title: "14. 개인정보 침해 구제기관",
    body: "개인정보 침해 관련 상담은 개인정보침해신고센터, 개인정보 분쟁조정위원회 등 관련 기관을 통해 받을 수 있습니다.",
  },
  {
    title: "15. 시행일과 변경 이력",
    body: "본 방침은 2026년 6월 21일부터 시행합니다. 처리자, 처리 목적, 수탁자, 국외 이전, 보유 기간이 바뀌면 변경 이력을 남기고 공개합니다.",
  },
];

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <section className={styles.surveyPanel}>
        <Link className={styles.backLink} href="/">
          AgentProof 홈
        </Link>
        <p className={styles.eyebrow}>PRIVACY</p>
        <h1>개인정보처리방침</h1>
        <p className={styles.lead}>
          AgentProof 역할별 AI 준비도 정밀진단은 개인정보 최소수집과 목적별 분리 동의를
          기준으로 운영합니다.
        </p>
        {sections.map((section) => (
          <section className={styles.policySection} key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        <Link className={styles.primaryLink} href="/privacy/request/">
          권리 행사 요청 방법 보기
        </Link>
      </section>
    </main>
  );
}
