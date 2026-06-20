import type { Metadata, Viewport } from "next";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const title = "AgentProof | 조직 AI 업무 도입 준비도 진단";
const description =
  "조직의 AI 사용 현황과 업무별 기회를 파악하고 정확성, 개인정보, 책임 위험을 진단해 도입 우선순위와 사용 기준으로 정리합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI를 업무에 쓸 때, 무엇을 맡기고 무엇을 지킬지.",
    description,
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-agentproof.png",
        width: 1200,
        height: 630,
        alt: "AgentProof AI 업무 도입 준비도 진단",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-agentproof.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
