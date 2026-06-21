import type { Metadata } from "next";

import { SurveyHub } from "@/components/survey/SurveyHub";

export const metadata: Metadata = {
  title: "AI 업무 자가점검 | AgentProof",
  description:
    "실무자, 대표·도입 담당자, 보안·정책 담당자 중 내 역할에 맞는 AgentProof 점검을 선택합니다.",
  openGraph: {
    title: "AI 업무 자가점검 | AgentProof",
    description: "약 7~10분 동안 답하고 이메일 없이 결과를 볼 수 있습니다.",
    url: "/survey/",
  },
};

export default function SurveyPage() {
  return <SurveyHub />;
}
