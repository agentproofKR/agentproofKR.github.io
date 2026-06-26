import type { Metadata } from "next";
import { Suspense } from "react";

import { WorkspaceBetaPage } from "@/components/survey/WorkspaceBetaPage";

export const metadata: Metadata = {
  title: "확인 화면 | AgentProof",
  description:
    "선택한 문장과 문서를 확인할 수 있도록 준비 중인 화면입니다.",
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
