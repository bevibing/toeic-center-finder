import type { MetadataRoute } from "next";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getIndexedRegionDateLandings } from "@/lib/landing-data";
import { getToeicLandingArchive } from "@/lib/toeic-archive";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Last hand-edit of the static editorial pages (FAQ, about, privacy). */
const EDITORIAL_CONTENT_UPDATED = new Date("2026-08-28");

const latestDate = (values: string[], fallback: Date): Date => {
  const newest = values.reduce<string | null>(
    (latest, value) => (latest === null || value > latest ? value : latest),
    null,
  );

  return newest ? new Date(newest) : fallback;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [indexedLandings, archive] = await Promise.all([
    getIndexedRegionDateLandings(),
    getToeicLandingArchive(),
  ]);

  // Aggregated pages are only as fresh as the exam data behind them.
  const archiveGeneratedAt = new Date(archive.generatedAt);
  const dataLastModified = latestDate(
    indexedLandings.map((entry) => entry.lastModified),
    archiveGeneratedAt,
  );
  const lastModifiedByRegion = new Map<string, Date>(
    LOCATION_FILTERS.map((region) => [
      region,
      latestDate(
        indexedLandings
          .filter((entry) => entry.region === region)
          .map((entry) => entry.lastModified),
        archiveGeneratedAt,
      ),
    ]),
  );

  return [
    {
      url: siteUrl,
      lastModified: dataLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/regions`,
      lastModified: dataLastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: EDITORIAL_CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: EDITORIAL_CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: EDITORIAL_CONTENT_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...LOCATION_FILTERS.map((region) => ({
      url: `${siteUrl}/regions/${encodeURIComponent(region)}`,
      lastModified: lastModifiedByRegion.get(region) ?? archiveGeneratedAt,
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
