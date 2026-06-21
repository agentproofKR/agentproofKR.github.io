import type { Metadata } from "next";

import { SurveyResult } from "@/components/survey/SurveyResult";

export const metadata: Metadata = {
  title: "AI 안전 체크 결과 | AgentProof",
  description: "AI 사용 위험과 이번 주 할 일을 정리한 결과 화면입니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SurveyResultPage() {
  return <SurveyResult />;
}
