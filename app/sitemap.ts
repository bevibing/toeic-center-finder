import type { MetadataRoute } from "next";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getIndexedRegionDateLandings } from "@/lib/landing-data";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const CONTENT_UPDATED = new Date("2026-07-27");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const indexedLandings = await getIndexedRegionDateLandings();

  return [
    {
      url: siteUrl,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/regions`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...LOCATION_FILTERS.map((region) => ({
      url: `${siteUrl}/regions/${encodeURIComponent(region)}`,
      lastModified: CONTENT_UPDATED,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...indexedLandings.map((entry) => ({
      url: `${siteUrl}/regions/${encodeURIComponent(entry.region)}/dates/${entry.examDate}`,
      lastModified: new Date(entry.lastModified),
      changeFrequency: "daily" as const,
      priority: 0.75,
    })),
  ];
}
