import type { Metadata } from "next";

import { SurveyHub } from "@/components/survey/SurveyHub";

export const metadata: Metadata = {
  title: "3분 AI 업무 위험도 점검 | AgentProof",
  description:
    "ChatGPT, Copilot, Claude, 사내 챗봇, AI Agent 사용 중 생길 수 있는 오답, 기밀 유출, 승인 책임, 보안 기준 문제를 3분 안에 점검합니다.",
  alternates: {
    canonical: "/survey/",
  },
  openGraph: {
    title: "3분 AI 업무 위험도 점검 | AgentProof",
    description: "10문항에 답하고 이메일 없이 결과를 볼 수 있습니다.",
    url: "/survey/",
    images: [
      {
        url: "/og-agentproof.png",
        width: 1200,
        height: 630,
        alt: "AgentProof AI 자가점검 예시 화면",
      },
    ],
  },
};

export default function SurveyPage() {
  return <SurveyHub />;
}
