import type { Metadata, Viewport } from "next";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const title = "AgentProof | 업무 AI, 어디까지 맡겨도 될까요?";
const description =
  "실무자의 사용 기준, 도입 담당자의 우선순위, 보안 담당자의 통제 기준을 진단하는 AgentProof Private beta입니다.";

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
    title,
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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
