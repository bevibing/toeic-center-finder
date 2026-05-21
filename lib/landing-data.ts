import { unstable_cache } from "next/cache";
import {
  LOCATION_FILTERS,
  TOEIC_CENTERS_CACHE_TTL_SECONDS,
  TOEIC_SCHEDULE_CACHE_TTL_SECONDS,
} from "@/lib/constants";
import { decodeHtmlEntities } from "@/lib/html-entities";
import { postToToeicUpstream } from "@/lib/toeic-proxy";
import type { ApiCenterInfo, ExamSchedule } from "@/lib/types";

export interface ActiveSchedule extends ExamSchedule {
  displayLabel: string;
}

export interface RegionPageSummary {
  examDate: string;
  centerCount: number;
  topCenters: ApiCenterInfo[];
}

export interface RegionDateLandingData {
  examDate: string;
  examCode: string;
  region: string;
  centers: ApiCenterInfo[];
}

const KOREA_LOCALE = "ko-KR";
const KOREA_TIME_ZONE = "Asia/Seoul";
const DATE_LABEL_FORMATTER = new Intl.DateTimeFormat(KOREA_LOCALE, {
  month: "long",
  day: "numeric",
  weekday: "long",
  timeZone: KOREA_TIME_ZONE,
});

const getTodayInKorea = (): string =>
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

        return parseSchedules(data, today);
      } catch {
        return [];
      }
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

  if (!schedule) {
    return null;
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
          return null;
        }

        return {
          examDate,
          examCode: schedule.exam_code,
          region,
          centers,
        };
      } catch {
        return null;
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
      };
    }),
  );

  return summaries.filter((value): value is RegionPageSummary => value !== null);
};

export const getIndexedRegionDateLandings = async (): Promise<
  Array<{ region: string; examDate: string }>
> => {
  const schedules = await loadActiveSchedules();
  const entries: Array<{ region: string; examDate: string } | null> = await Promise.all(
    LOCATION_FILTERS.flatMap((region) =>
      schedules.map(async (schedule) => {
        const landingData = await loadRegionDateLandingData(region, schedule.exam_day);

        if (!landingData) {
          return null;
        }

        return {
          region,
          examDate: schedule.exam_day,
        };
      }),
    ),
  );

  return entries.filter(
    (value): value is { region: string; examDate: string } => value !== null,
  );
};

export const getExamDateLabel = (examDate: string): string => formatExamDateLabel(examDate);
