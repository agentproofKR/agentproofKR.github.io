import type { Metadata } from "next";

import { QuickDiagnosisPage } from "@/components/survey/QuickDiagnosisPage";

export const metadata: Metadata = {
  title: "AI 안심 점수 진단 | AgentProof",
  description:
    "AI 업무 도입 전 통제 상태와 안심 점수를 빠르게 확인합니다.",
  alternates: {
    canonical: "/survey/",
  },
  openGraph: {
    title: "AI 안심 점수 진단 | AgentProof",
    description: "AI 업무 도입 전 통제 상태와 안심 점수를 빠르게 확인합니다.",
    url: "/survey/",
    images: [
      {
        url: "/og-agentproof.png",
        width: 1200,
        height: 630,
        alt: "AgentProof 안심 점수 진단 예시 화면",
      },
    ],
  },
};

export default function SurveyPage() {
  return <QuickDiagnosisPage />;
}
