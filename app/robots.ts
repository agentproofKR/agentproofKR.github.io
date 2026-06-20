import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const isLocal = siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1");

  return {
    rules: {
      userAgent: "*",
      allow: isLocal ? undefined : "/",
      disallow: isLocal ? "/" : undefined,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
