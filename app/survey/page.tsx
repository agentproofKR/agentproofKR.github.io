import type { Metadata } from "next";

import { SurveyHub } from "@/components/survey/SurveyHub";

export const metadata: Metadata = {
  title: "역할별 AI 준비도 정밀진단 | AgentProof",
  description:
    "실무자, 대표·도입 담당자, 보안·정책 담당자를 위한 AgentProof AI 준비도 정밀진단입니다.",
  openGraph: {
    title: "역할별 AI 준비도 정밀진단 | AgentProof",
    description: "약 7–10분 설문 후 이메일 없이 기본 결과를 바로 확인합니다.",
    url: "/survey/",
  },
};

export default function SurveyPage() {
  return <SurveyHub />;
}
