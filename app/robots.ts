import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const isProduction =
    process.env.VERCEL_ENV === "production" || siteUrl === "https://agentproofkr.github.io";

  return {
    rules: {
      userAgent: "*",
      allow: isProduction ? "/" : undefined,
      disallow: isProduction ? undefined : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
