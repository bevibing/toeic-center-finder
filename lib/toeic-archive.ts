import { readFile } from "node:fs/promises";
import path from "node:path";
import defaultArchive from "@/data/toeic-landings.json";
import type { ApiCenterInfo, ExamSchedule } from "@/lib/types";

export const TOEIC_OFFICIAL_SCHEDULE_URL =
  "https://exam.toeic.co.kr/receipt/examSchList.php";
export const TOEIC_OFFICIAL_GUIDE_URL =
  "https://exam.toeic.co.kr/common/template/viewContents.php?contentsCode=36&guide=Y";

interface ToeicLandingArchiveEntry {
  examDate: string;
  examCode: string;
  region: string;
  updatedAt: string;
  centers: ApiCenterInfo[];
}

export interface ToeicLandingArchive {
  version: number;
  generatedAt: string;
  source: {
    name: string;
    url: string;
  };
  knownExamDates: string[];
  entries: ToeicLandingArchiveEntry[];
}

let configuredArchivePromise: Promise<ToeicLandingArchive> | null = null;

const isArchive = (value: unknown): value is ToeicLandingArchive => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const archive = value as Partial<ToeicLandingArchive>;
  return (
    archive.version === 1 &&
    typeof archive.generatedAt === "string" &&
    Array.isArray(archive.knownExamDates) &&
    Array.isArray(archive.entries)
  );
};

const loadConfiguredArchive = async (): Promise<ToeicLandingArchive> => {
  const configuredPath = process.env.TOEIC_LANDING_ARCHIVE_PATH;

  if (!configuredPath) {
    return defaultArchive as ToeicLandingArchive;
  }

  const archivePath = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
  const parsedArchive = JSON.parse(await readFile(archivePath, "utf8")) as unknown;

  if (!isArchive(parsedArchive)) {
    throw new Error(`Invalid TOEIC landing archive: ${archivePath}`);
  }

  return parsedArchive;
};

export const getToeicLandingArchive = async (): Promise<ToeicLandingArchive> => {
  configuredArchivePromise ??= loadConfiguredArchive();
  return configuredArchivePromise;
};

export const findArchivedLanding = async (
  region: string,
  examDate: string,
): Promise<ToeicLandingArchiveEntry | null> => {
  const archive = await getToeicLandingArchive();
  return (
    archive.entries.find(
      (entry) => entry.region === region && entry.examDate === examDate,
    ) ?? null
  );
};

export const isKnownArchivedExamDate = async (
  examDate: string,
): Promise<boolean> => {
  const archive = await getToeicLandingArchive();
  return archive.knownExamDates.includes(examDate);
};

export const getArchivedSchedules = async (
  fromDate: string,
): Promise<ExamSchedule[]> => {
  const archive = await getToeicLandingArchive();
  const schedulesByDate = new Map<string, ExamSchedule>();

  for (const entry of archive.entries) {
    if (entry.examDate < fromDate || schedulesByDate.has(entry.examDate)) {
      continue;
    }

    schedulesByDate.set(entry.examDate, {
      exam_code: entry.examCode,
      exam_day: entry.examDate,
    });
  }

  return [...schedulesByDate.values()].sort((left, right) =>
    left.exam_day.localeCompare(right.exam_day),
  );
};

export const findArchivedCentersByExamCode = async (
  examCode: string,
  region: string,
): Promise<ApiCenterInfo[] | null> => {
  const archive = await getToeicLandingArchive();
  const entry = archive.entries.find(
    (candidate) =>
      candidate.examCode === examCode && candidate.region === region,
  );

  return entry?.centers ?? null;
};
