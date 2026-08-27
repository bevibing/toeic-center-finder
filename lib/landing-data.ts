import { unstable_cache } from "next/cache";
import {
  LOCATION_FILTERS,
  TOEIC_CENTERS_CACHE_TTL_SECONDS,
  TOEIC_SCHEDULE_CACHE_TTL_SECONDS,
} from "@/lib/constants";
import { decodeHtmlEntities } from "@/lib/html-entities";
import {
  findArchivedLanding,
  getArchivedSchedules,
  getToeicLandingArchive,
  isKnownArchivedExamDate,
  TOEIC_OFFICIAL_SCHEDULE_URL,
} from "@/lib/toeic-archive";
import { postToToeicUpstream } from "@/lib/toeic-proxy";
import type { ApiCenterInfo, ExamSchedule } from "@/lib/types";

export interface ActiveSchedule extends ExamSchedule {
  displayLabel: string;
}

export interface RegionPageSummary {
  examDate: string;
  centerCount: number;
  topCenters: ApiCenterInfo[];
  updatedAt: string;
  sourceUrl: string;
  dataSource: "live" | "archive";
}

export interface RegionDateLandingData {
  examDate: string;
  examCode: string;
  region: string;
  centers: ApiCenterInfo[];
  status: "active" | "archived";
  updatedAt: string;
  sourceUrl: string;
  dataSource: "live" | "archive";
}

const KOREA_LOCALE = "ko-KR";
const KOREA_TIME_ZONE = "Asia/Seoul";
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat(KOREA_LOCALE, {
  month: "long",
  day: "numeric",
  weekday: "long",
  timeZone: KOREA_TIME_ZONE,
});

export const getTodayInKorea = (): string =>
  process.env.TOEIC_TODAY_OVERRIDE ||
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: KOREA_TIME_ZONE,
  }).format(new Date());

const formatExamDateLabel = (examDate: string): string => {
  const examDateValue = new Date(`${examDate}T00:00:00+09:00`);
  return DATE_LABEL_FORMATTER.format(examDateValue);
};

const isRegion = (region: string): region is (typeof LOCATION_FILTERS)[number] =>
  LOCATION_FILTERS.includes(region as (typeof LOCATION_FILTERS)[number]);

const parseSchedules = (data: unknown, today = getTodayInKorea()): ActiveSchedule[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  const uniqueSchedules = new Map<string, string>();

  for (const item of data) {
    if (
      !item ||
      typeof item !== "object" ||
      !("exam_code" in item) ||
      !("exam_day" in item) ||
      typeof item.exam_code !== "string" ||
      typeof item.exam_day !== "string"
    ) {
      continue;
    }

    const examDate = item.exam_day.split(" ")[0];

    if (examDate >= today && !uniqueSchedules.has(examDate)) {
      uniqueSchedules.set(examDate, item.exam_code);
    }
  }

  return Array.from(uniqueSchedules.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([exam_day, exam_code]) => ({
      exam_code,
      exam_day,
      displayLabel: formatExamDateLabel(exam_day),
    }));
};

const parseCenters = (data: unknown): ApiCenterInfo[] => {
  if (!Array.isArray(data) || data.length < 3 || !Array.isArray(data[2])) {
    return [];
  }

  return (data[2] as ApiCenterInfo[]).map((center) => ({
    ...center,
    center_name: decodeHtmlEntities(center.center_name),
    address: decodeHtmlEntities(center.address.trim()),
  }));
};

const loadActiveSchedules = async (): Promise<ActiveSchedule[]> => {
  const today = getTodayInKorea();
  const cachedLoader = unstable_cache(
    async (): Promise<ActiveSchedule[]> => {
      try {
        const data = await postToToeicUpstream(
          {
            proc: "getReceiptScheduleList",
            examCate: "TOE",
          },
          {
            cacheTtlSeconds: TOEIC_SCHEDULE_CACHE_TTL_SECONDS,
          },
        );

        const parsedSchedules = parseSchedules(data, today);

        if (parsedSchedules.length > 0) {
          return parsedSchedules;
        }
      } catch {
        // A checked-in official-data snapshot keeps the map and landing pages
        // available while the upstream service is temporarily unavailable.
      }

      const archivedSchedules = await getArchivedSchedules(today);
      return archivedSchedules.map((schedule) => ({
        ...schedule,
        displayLabel: formatExamDateLabel(schedule.exam_day),
      }));
    },
    ["active-schedules", today],
    {
      revalidate: TOEIC_SCHEDULE_CACHE_TTL_SECONDS,
    },
  );

  return cachedLoader();
};

const loadRegionDateLandingData = async (
  region: string,
  examDate: string,
): Promise<RegionDateLandingData | null> => {
  if (!isRegion(region)) {
    return null;
  }

  const schedules = await loadActiveSchedules();
  const schedule = schedules.find((entry) => entry.exam_day === examDate);
  const archivedLanding = await findArchivedLanding(region, examDate);
  const archive = await getToeicLandingArchive();

  if (!schedule) {
    const isPastKnownExam =
      examDate < getTodayInKorea() &&
      (archivedLanding !== null || (await isKnownArchivedExamDate(examDate)));

    if (!isPastKnownExam) {
      return null;
    }

    return {
      examDate,
      examCode: archivedLanding?.examCode ?? "",
      region,
      centers: archivedLanding?.centers ?? [],
      status: "archived",
      updatedAt: archivedLanding?.updatedAt ?? archive.generatedAt,
      sourceUrl: archive.source.url || TOEIC_OFFICIAL_SCHEDULE_URL,
      dataSource: "archive",
    };
  }

  const cachedLoader = unstable_cache(
    async (): Promise<RegionDateLandingData | null> => {
      try {
        const data = await postToToeicUpstream(
          {
            proc: "getExamAreaInfo",
            examCate: "TOE",
            examCode: schedule.exam_code,
            bigArea: region,
            sbGoodsType1: "TOE",
          },
          {
            cacheTtlSeconds: TOEIC_CENTERS_CACHE_TTL_SECONDS,
          },
        );

        const centers = parseCenters(data);

        if (centers.length === 0) {
          if (!archivedLanding || archivedLanding.centers.length === 0) {
            return null;
          }

          return {
            examDate,
            examCode: archivedLanding.examCode,
            region,
            centers: archivedLanding.centers,
            status: "active",
            updatedAt: archivedLanding.updatedAt,
            sourceUrl: archive.source.url || TOEIC_OFFICIAL_SCHEDULE_URL,
            dataSource: "archive",
          };
        }

        return {
          examDate,
          examCode: schedule.exam_code,
          region,
          centers,
          status: "active",
          updatedAt: archivedLanding?.updatedAt ?? archive.generatedAt,
          sourceUrl: archive.source.url || TOEIC_OFFICIAL_SCHEDULE_URL,
          dataSource: "live",
        };
      } catch {
        if (!archivedLanding || archivedLanding.centers.length === 0) {
          return null;
        }

        return {
          examDate,
          examCode: archivedLanding.examCode,
          region,
          centers: archivedLanding.centers,
          status: "active",
          updatedAt: archivedLanding.updatedAt,
          sourceUrl: archive.source.url || TOEIC_OFFICIAL_SCHEDULE_URL,
          dataSource: "archive",
        };
      }
    },
    ["region-date-landing", region, examDate],
    {
      revalidate: TOEIC_CENTERS_CACHE_TTL_SECONDS,
    },
  );

  return cachedLoader();
};

export const getActiveSchedules = async (): Promise<ActiveSchedule[]> => loadActiveSchedules();

export const getAvailableRegionDateLanding = async (
  region: string,
  examDate: string,
): Promise<RegionDateLandingData | null> => loadRegionDateLandingData(region, examDate);

export const getRegionPageSummaries = async (
  region: string,
): Promise<RegionPageSummary[]> => {
  const schedules = await loadActiveSchedules();
  const summaries = await Promise.all(
    schedules.map(async (schedule) => {
      const landingData = await loadRegionDateLandingData(region, schedule.exam_day);

      if (!landingData) {
        return null;
      }

      return {
        examDate: schedule.exam_day,
        centerCount: landingData.centers.length,
        topCenters: landingData.centers.slice(0, 3),
        updatedAt: landingData.updatedAt,
        sourceUrl: landingData.sourceUrl,
        dataSource: landingData.dataSource,
      };
    }),
  );

  return summaries.filter((value): value is RegionPageSummary => value !== null);
};

/**
 * Sitemap-eligible landing pages.
 *
 * Mirrors the conditions `loadRegionDateLandingData` uses to resolve a page, so
 * the sitemap can never advertise a URL the route itself answers with 404:
 * the exam date must still be active, and the archive entry must hold at least
 * one center. Ended exam dates stay reachable for users but leave the sitemap.
 */
export const getIndexedRegionDateLandings = async (): Promise<
  Array<{ region: string; examDate: string; lastModified: string }>
> => {
  const [archive, schedules] = await Promise.all([
    getToeicLandingArchive(),
    loadActiveSchedules(),
  ]);
  const activeExamDates = new Set(schedules.map((schedule) => schedule.exam_day));
  const today = getTodayInKorea();

  return archive.entries
    .filter(
      (entry) =>
        entry.examDate >= today &&
        activeExamDates.has(entry.examDate) &&
        entry.centers.length > 0,
    )
    .map((entry) => ({
      region: entry.region,
      examDate: entry.examDate,
      lastModified: entry.updatedAt,
    }));
};

export interface UpcomingExamDateSummary {
  examDate: string;
  displayLabel: string;
  regionCount: number;
  centerCount: number;
}

/**
 * Nationwide overview of the upcoming exam dates, read straight from the
 * checked-in archive so the home page can server-render real figures without
 * fanning out to the upstream service on every request.
 */
export const getUpcomingExamDateOverview = async (
  limit = 3,
): Promise<UpcomingExamDateSummary[]> => {
  const [archive, schedules] = await Promise.all([
    getToeicLandingArchive(),
    loadActiveSchedules(),
  ]);
  const today = getTodayInKorea();

  return schedules
    .filter((schedule) => schedule.exam_day >= today)
    .slice(0, limit)
    .map((schedule) => {
      const entries = archive.entries.filter(
        (entry) => entry.examDate === schedule.exam_day && entry.centers.length > 0,
      );

      return {
        examDate: schedule.exam_day,
        displayLabel: schedule.displayLabel,
        regionCount: entries.length,
        centerCount: entries.reduce((total, entry) => total + entry.centers.length, 0),
      };
    })
    .filter((summary) => summary.regionCount > 0);
};

export const getExamDateLabel = (examDate: string): string => formatExamDateLabel(examDate);
