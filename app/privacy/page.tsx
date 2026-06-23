import type { ReactNode } from "react";
import Link from "next/link";

import { SurveyHeader } from "@/components/survey/SurveyHeader";
import { LEGAL_CONFIG } from "@/lib/legal";
import styles from "@/styles/survey.module.css";

export const metadata = {
  title: "개인정보 안내 | AgentProof",
  description:
    "AgentProof 설문과 선택 신청에 필요한 개인정보 처리 내용을 쉽게 안내합니다.",
};

const summaryCards = [
  {
    title: "받는 것",
    body: "성명, 연락처, 설문 답변",
  },
  {
    title: "연락처",
    body: "결과 안내와 후속 연락에만 사용",
  },
  {
    title: "보관",
    body: "성명·연락처는 2개월",
  },
  {
    title: "삭제",
    body: "요청하면 처리합니다.",
  },
] as const;

const operatorNotice = LEGAL_CONFIG.operatorName
  ? `개인정보처리자와 개인정보 보호책임자는 ${LEGAL_CONFIG.operatorName}입니다.`
  : "검증된 법적 표시명이 아직 설정되지 않아 공개 설문 저장은 비활성화됩니다.";

const providerRows = [
  {
    provider: "GitHub, Inc.",
    info: "정적 웹페이지, 이미지 파일, 방문 보안 로그에 필요한 기술 정보",
    purpose: "agentproofkr.github.io 사이트를 안정적으로 보여주기 위해 필요합니다.",
    location:
      "GitHub Pages 방문 시 IP 주소가 보안 목적으로 기록됩니다. GitHub 공식 하위처리자 목록에는 미국 처리 위치가 공시된 인프라 제공자가 포함됩니다.",
    retention:
      "AgentProof가 기간을 정하지 않습니다. GitHub의 보안과 서비스 운영 정책에 따릅니다.",
    refusal:
      "GitHub Pages 처리를 원하지 않으면 이 공개 사이트를 이용할 수 없습니다. 개인정보 요청은 AgentProof 연락처로 접수할 수 있습니다.",
  },
  {
    provider: "Supabase, Inc.",
    info: "설문 세션, 설문 답변, 결과 요약, 동의 기록, 성명, 연락처, 선택 연락처, 비식별 운영 이벤트",
    purpose: "자가점검 결과 저장, 중복 제출 방지, AI 안전 체크 결과 안내와 선택한 베타·인터뷰·파일럿 연락을 처리하기 위해 필요합니다.",
    location:
      "Postgres 프로젝트 리전은 ap-northeast-2(서울)로 검증되었습니다. Edge Function은 요청 위치에 가까운 Supabase 엣지 인프라에서 실행될 수 있으며, 현재 공개 호출은 특정 실행 리전을 고정하지 않습니다.",
    retention:
      "설문 시작 시 입력한 성명·연락처는 2개월, 설문 원문은 6개월, 인터뷰 연락처는 90일, 파일럿 연락처는 1년, 베타 연락처는 12개월 또는 베타 종료 후 90일 중 빠른 날까지 보관합니다.",
    refusal:
      "필수 설문 처리에 동의하지 않으면 설문 저장과 결과 생성이 진행되지 않습니다. 선택 연락은 언제든지 철회할 수 있습니다.",
  },
] as const;

const detailSections: Array<{ title: string; body: ReactNode }> = [
  {
    title: "개인정보처리자",
    body: (
      <>
        <p>
          서비스명은 AgentProof입니다. 운영 형태는 {LEGAL_CONFIG.operatorType}
          입니다. {operatorNotice}
        </p>
        <p>
          개인정보 문의와 권리 요청은 {LEGAL_CONFIG.contactEmail}로 받습니다.
        </p>
      </>
    ),
  },
  {
    title: "수집 목적",
    body: (
      <ul>
        <li>역할에 맞는 자가점검 결과를 보여드립니다.</li>
        <li>AI 안전 체크 결과 안내와 필요한 후속 연락을 드립니다.</li>
        <li>어떤 기능과 안내가 필요한지 파악합니다.</li>
        <li>중복 제출과 오남용을 줄입니다.</li>
        <li>베타, 인터뷰, 상담을 신청한 경우 연락을 드립니다.</li>
      </ul>
    ),
  },
  {
    title: "수집 항목",
    body: (
      <ul>
        <li>성명과 연락처를 받습니다.</li>
        <li>역할, 조직 규모, 업종, AI 사용 상황, 설문 답변을 받습니다.</li>
        <li>설문 제출을 구분하기 위한 임시 번호와 제출 시각을 저장합니다.</li>
        <li>
          어떤 SNS 글을 통해 들어왔는지 알 수 있는 표시(UTM)를 저장할 수
          있습니다.
        </li>
        <li>
          이메일과 회사명은 베타, 인터뷰, 상담을 추가로 선택한 경우에도 받을 수 있습니다.
        </li>
      </ul>
    ),
  },
  {
    title: "수집 방법",
    body: (
      <p>
        이용자가 웹사이트에서 직접 입력한 정보만 받습니다. 설문 답변과 선택 신청
        정보는 서로 다른 목적의 기록으로 나누어 처리합니다.
      </p>
    ),
  },
  {
    title: "보관 기간",
    body: (
      <ul>
        <li>
          설문 시작 시 입력한 성명과 연락처는 수집일로부터 2개월 동안 보관합니다.
        </li>
        <li>
          설문 원문 답변과 연결 정보는 제출일로부터 6개월 동안 보관합니다.
        </li>
        <li>
          베타 연락처는 동의일로부터 12개월 또는 베타 종료 후 90일 중 빠른
          날까지 보관합니다.
        </li>
        <li>
          인터뷰 연락처는 대상 선정 완료 또는 마지막 연락일로부터 90일 동안
          보관합니다.
        </li>
        <li>
          파일럿 상담 연락처는 마지막 상담 연락일로부터 1년 동안 보관합니다.
        </li>
      </ul>
    ),
  },
  {
    title: "삭제 방법",
    body: (
      <p>
        보관 기간이 끝난 원문 답변과 연락처는 복구하기 어렵도록 삭제합니다. 삭제
        요청 처리 기록은 삭제 대상 원문을 보유하지 않는 범위에서만 남깁니다.
      </p>
    ),
  },
  {
    title: "제3자 제공",
    body: (
      <p>
        AgentProof는 설문 답변이나 연락처를 제3자에게 판매하거나 제공하지
        않습니다. 법령에 따른 요청이 있는 경우 필요한 범위에서만 검토합니다.
      </p>
    ),
  },
  {
    title: "처리업무 위탁",
    body: (
      <>
        <p>서비스 운영에 필요한 범위에서 아래 제공자를 사용합니다.</p>
        <table className={styles.legalTable}>
          <thead>
            <tr>
              <th scope="col">제공자</th>
              <th scope="col">역할</th>
              <th scope="col">처리 내용</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GitHub, Inc.</td>
              <td>GitHub Pages 정적 사이트 제공</td>
              <td>웹페이지와 이미지 파일을 전달합니다.</td>
            </tr>
            <tr>
              <td>Supabase, Inc.</td>
              <td>설문 저장</td>
              <td>설문 제출, 동의 기록, 성명, 연락처, 선택 연락처를 저장합니다.</td>
            </tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    title: "국외 처리와 이전",
    body: (
      <>
        <p>
          아래 내용은 실제 배포 구성과 공식 문서를 대조해 정리했습니다. 근거는
          저장소의 <code>docs/privacy-provider-evidence.md</code>에 남깁니다.
        </p>
        <table className={styles.legalTable}>
          <thead>
            <tr>
              <th scope="col">어떤 회사인가요</th>
              <th scope="col">어떤 정보를 처리하나요</th>
              <th scope="col">왜 필요한가요</th>
              <th scope="col">어디에서 처리될 수 있나요</th>
              <th scope="col">얼마나 보관하나요</th>
              <th scope="col">원하지 않으면 어떻게 하나요</th>
            </tr>
          </thead>
          <tbody>
            {providerRows.map((row) => (
              <tr key={row.provider}>
                <td>{row.provider}</td>
                <td>{row.info}</td>
                <td>{row.purpose}</td>
                <td>{row.location}</td>
                <td>{row.retention}</td>
                <td>{row.refusal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    ),
  },
  {
    title: "자동수집 정보",
    body: (
      <p>
        persona, survey_version, question_count, completion_time_band,
        result_band 같은 비식별 운영 이벤트만 사용할 수 있습니다. 이메일,
        회사명, 자유 입력, 개별 답변은 분석 이벤트에 포함하지 않습니다.
      </p>
    ),
  },
  {
    title: "자세한 보안조치",
    body: (
      <ul>
        <li>클라이언트 번들에는 secret을 넣지 않습니다.</li>
        <li>
          허가되지 않은 사람이 데이터를 보지 못하도록 막는 설정(RLS)을
          적용합니다.
        </li>
        <li>
          허용된 사이트에서만 설문을 보낼 수 있게 하는 설정(CORS)을 적용합니다.
        </li>
        <li>
          honeypot, rate limiting, idempotency key, 입력 길이 제한을 적용합니다.
        </li>
        <li>로그와 분석에는 이메일, 회사명, 개별 답변을 넣지 않습니다.</li>
      </ul>
    ),
  },
  {
    title: "이용자 권리",
    body: (
      <p>
        열람, 수정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다. 요청 방법은
        개인정보 요청 안내 페이지에서 확인할 수 있습니다.
      </p>
    ),
  },
  {
    title: "만 14세 미만 이용 제한",
    body: (
      <p>
        이 자가점검은 만 14세 이상을 대상으로 합니다. 만 14세 미만의 정보는 받지
        않습니다.
      </p>
    ),
  },
  {
    title: "구제기관",
    body: (
      <p>
        개인정보 침해 상담은 개인정보침해신고센터, 개인정보 분쟁조정위원회 등
        관련 기관을 통해 받을 수 있습니다.
      </p>
    ),
  },
  {
    title: "시행일과 변경 이력",
    body: (
      <p>
        이 안내는 2026년 6월 21일부터 적용합니다. 처리자, 목적, 수탁자, 이전
        방식, 보관 기간이 바뀌면 변경 이력을 남기고 공개합니다.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SurveyHeader />
      <main className={styles.page}>
        <section className={styles.surveyPanel}>
        <Link className={styles.backLink} href="/">
          AgentProof 홈
        </Link>
        <p className={styles.eyebrow}>개인정보</p>
        <h1>개인정보 안내</h1>
        <p className={styles.lead}>
          성명과 연락처를 받습니다.
          <br />
          결과 안내와 후속 연락에만 사용합니다.
          <br />
          <br />
          성명과 연락처는 수집 후 2개월 동안 보관합니다.
          <br />
          삭제 요청도 할 수 있어요.
        </p>

        <div className={styles.summaryGrid} aria-label="개인정보 요약">
          {summaryCards.map((card) => (
            <article
              className={styles.summaryCard}
              data-testid="privacy-summary-card"
              key={card.title}
            >
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </div>

        <div className={styles.noticeBand}>
          <div>
            <h2>개인정보 요청이 필요하신가요?</h2>
            <p>열람, 수정, 삭제, 동의 철회 요청을 이메일로 접수합니다.</p>
          </div>
          <div className={styles.linkRow}>
            <Link href="/privacy/request/">개인정보 요청 방법 보기</Link>
            <a href={`mailto:${LEGAL_CONFIG.contactEmail}`}>
              {LEGAL_CONFIG.contactEmail}
            </a>
          </div>
        </div>

        <section
          className={styles.detailSection}
          aria-labelledby="privacy-details-title"
        >
          <h2 id="privacy-details-title">자세한 내용 보기</h2>
          <div className={styles.detailList}>
            {detailSections.map((section) => (
              <details key={section.title}>
                <summary>{section.title}</summary>
                <div>{section.body}</div>
              </details>
            ))}
          </div>
        </section>
      </section>
      </main>
    </>
  );
}
