import type { Metadata } from "next";

import { QuickDiagnosisPage } from "@/components/survey/QuickDiagnosisPage";

export const metadata: Metadata = {
  title: "AI 도입 간단 체크 | AgentProof",
  description: "우리 회사가 AI를 어떤 업무에 먼저 써야 할지 빠르게 확인합니다.",
  alternates: {
    canonical: "/survey/",
  },
  openGraph: {
    title: "AI 도입 간단 체크 | AgentProof",
    description: "우리 회사가 AI를 어떤 업무에 먼저 써야 할지 빠르게 확인합니다.",
    url: "/survey/",
    images: [
      {
        url: "/og-agentproof.png",
        width: 1200,
        height: 630,
        alt: "AgentProof AI 도입 간단 체크 예시 화면",
      },
    ],
  },
};

export default function SurveyPage() {
  return <QuickDiagnosisPage />;
}
