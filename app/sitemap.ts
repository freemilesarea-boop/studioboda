import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/company";
import { listActiveServices } from "@/lib/queries/services";
import { listPublishedPortfolio } from "@/lib/queries/portfolio";

// Revalidate periodically so newly published services/portfolio entries
// enter the sitemap without a redeploy. DB queries tolerate missing env
// (return []), so this never breaks the build.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [services, portfolio] = await Promise.all([
    listActiveServices().catch(() => []),
    listPublishedPortfolio().catch(() => []),
  ]);

  const serviceRoutes: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${siteUrl}/services/${s.key}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const portfolioRoutes: MetadataRoute.Sitemap = portfolio.map((p) => ({
    url: `${siteUrl}/portfolio/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...serviceRoutes, ...portfolioRoutes];
}
