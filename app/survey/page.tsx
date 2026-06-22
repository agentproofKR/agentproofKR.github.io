import type { Metadata } from "next";

import { SurveyHub } from "@/components/survey/SurveyHub";

export const metadata: Metadata = {
  title: "3분 AI 안전 체크 | AgentProof",
  description:
    "10문항으로 AI 사용 위험과 바로 정해야 할 기준을 이메일 없이 확인합니다.",
  alternates: {
    canonical: "/survey/",
  },
  openGraph: {
    title: "3분 AI 안전 체크 | AgentProof",
    description: "10문항으로 필요한 기준을 확인하고 이메일 없이 바로 결과를 봅니다.",
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
