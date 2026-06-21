import type { Metadata } from "next";

import { SurveyResult } from "@/components/survey/SurveyResult";

export const metadata: Metadata = {
  title: "AI 자가점검 결과 | AgentProof",
  description: "AgentProof 역할별 AI 자가점검 결과 화면입니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SurveyResultPage() {
  return <SurveyResult />;
}
