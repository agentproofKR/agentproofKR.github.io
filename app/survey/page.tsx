import type { Metadata } from "next";

import { QuickDiagnosisPage } from "@/components/survey/QuickDiagnosisPage";

export const metadata: Metadata = {
  title: "3분 무료 진단 | AgentProof",
  description:
    "AI로 만든 답변을 보내기 전 확인할 부분과 먼저 해볼 일을 3분 안에 확인합니다.",
  alternates: {
    canonical: "/survey/",
  },
  openGraph: {
    title: "3분 무료 진단 | AgentProof",
    description: "AI로 먼저 맡겨볼 일과 보내기 전 확인할 부분을 확인합니다.",
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
  return <QuickDiagnosisPage />;
}
