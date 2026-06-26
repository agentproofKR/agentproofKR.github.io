import type { Metadata } from "next";

import { QuickDiagnosisPage } from "@/components/survey/QuickDiagnosisPage";

export const metadata: Metadata = {
  title: "무료 체크 | AgentProof",
  description:
    "답변·문장·문서를 쓰기 전에 확인할 내용을 빠르게 살펴봅니다.",
  alternates: {
    canonical: "/survey/",
  },
  openGraph: {
    title: "무료 체크 | AgentProof",
    description: "답변·문장·문서를 쓰기 전에 확인할 내용을 빠르게 살펴봅니다.",
    url: "/survey/",
    images: [
      {
        url: "/og-agentproof.png",
        width: 1200,
        height: 630,
        alt: "AgentProof 무료 체크 예시 화면",
      },
    ],
  },
};

export default function SurveyPage() {
  return <QuickDiagnosisPage />;
}
