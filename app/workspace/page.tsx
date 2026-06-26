import type { Metadata } from "next";
import { Suspense } from "react";

import { WorkspaceBetaPage } from "@/components/survey/WorkspaceBetaPage";

export const metadata: Metadata = {
  title: "AgentProof Workspace | 준비 중",
  description:
    "선택한 업무부터 AI 답변과 보내기 전 확인할 부분을 함께 볼 수 있게 준비 중입니다.",
  alternates: {
    canonical: "/workspace/",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function WorkspacePage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceBetaPage />
    </Suspense>
  );
}
