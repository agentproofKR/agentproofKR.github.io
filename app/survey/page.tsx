import type { Metadata } from "next";

import { SurveyHub } from "@/components/survey/SurveyHub";

export const metadata: Metadata = {
  title: "3분 AI 안전 체크 | AgentProof",
  description:
    "10문항으로 AI 사용 위험과 이번 주 할 일을 이메일 없이 확인합니다.",
  alternates: {
    canonical: "/survey/",
  },
  openGraph: {
    title: "3분 AI 안전 체크 | AgentProof",
    description: "10문항만 답하고 이메일 없이 결과를 볼 수 있어요.",
    url: "/survey/",
    images: [
      {
        url: "/og-agentproof.png",
        width: 1200,
        height: 630,
        alt: "AgentProof AI 자가진단 예시 화면",
      },
    ],
  },
};

export default function SurveyPage() {
  return <SurveyHub />;
}
