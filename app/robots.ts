import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/company";

// Authenticated / operational areas are kept out of search indexes. The
// public marketing surface (home, services, portfolio, legal) stays open.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/me",
          "/api",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/unauthorized",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
