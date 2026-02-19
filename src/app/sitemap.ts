import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { groupes, concerts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://concert-chaussettes.vercel.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/groupes`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  // Dynamic group pages
  const visibleGroupes = await db.query.groupes.findMany({
    where: eq(groupes.isVisible, true),
    columns: { id: true, updatedAt: true },
  });

  const groupePages: MetadataRoute.Sitemap = visibleGroupes.map((g) => ({
    url: `${baseUrl}/groupes/${g.id}`,
    lastModified: g.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Dynamic concert pages (published only)
  const publishedConcerts = await db.query.concerts.findMany({
    where: eq(concerts.status, "PUBLIE"),
    columns: { slug: true, updatedAt: true },
  });

  const concertPages: MetadataRoute.Sitemap = publishedConcerts.map((c) => ({
    url: `${baseUrl}/concert/${c.slug}`,
    lastModified: c.updatedAt ?? new Date(),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticPages, ...groupePages, ...concertPages];
}
