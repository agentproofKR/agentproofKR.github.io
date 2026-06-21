import type { Metadata, Viewport } from "next";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const title = "AgentProof | AI 안전 체크";
const description =
  "AI 답변 오류, 기밀유출, 책임 문제를 3분 안에 확인하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/agentproof-logo-mark.png", type: "image/png" }],
    apple: [{ url: "/agentproof-logo-mark.png", type: "image/png" }],
  },
  openGraph: {
    title: "AI 답변, 그냥 쓰면 위험합니다.",
    description,
    type: "website",
    url: "/",
    images: [
      {
        url: "/og-agentproof.png",
        width: 1200,
        height: 630,
        alt: "AgentProof 업무 AI 검증 대시보드",
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
    <html lang="ko" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
