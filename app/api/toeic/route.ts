import { NextResponse } from "next/server";
import {
  TOEIC_SCHEDULE_CACHE_TTL_SECONDS,
  TOEIC_SCHEDULE_STALE_TTL_SECONDS,
} from "@/lib/constants";
import { getTodayInKorea } from "@/lib/landing-data";
import { getArchivedSchedules } from "@/lib/toeic-archive";
import { postToToeicUpstream, ToeicProxyError } from "@/lib/toeic-proxy";

export const runtime = "nodejs";

const CACHE_CONTROL = [
  "public",
  `max-age=${TOEIC_SCHEDULE_CACHE_TTL_SECONDS}`,
  `s-maxage=${TOEIC_SCHEDULE_CACHE_TTL_SECONDS}`,
  `stale-while-revalidate=${TOEIC_SCHEDULE_STALE_TTL_SECONDS}`,
].join(", ");

const getArchivedScheduleResponse = async () => {
  const archivedSchedules = await getArchivedSchedules(getTodayInKorea());

  if (archivedSchedules.length === 0) {
    return null;
  }

  return NextResponse.json(archivedSchedules, {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "X-TOEIC-Data-Source": "archive",
    },
  });
};

export async function GET() {
  try {
    const data = await postToToeicUpstream({
      proc: "getReceiptScheduleList",
      examCate: "TOE",
    }, {
      cacheTtlSeconds: TOEIC_SCHEDULE_CACHE_TTL_SECONDS,
    });

    if (!Array.isArray(data) || data.length === 0) {
      const archivedResponse = await getArchivedScheduleResponse();

      if (archivedResponse) {
        return archivedResponse;
      }

      return NextResponse.json(
        { error: "No data received from TOEIC server" },
        {
          status: 404,
          headers: {
            "Cache-Control": CACHE_CONTROL,
          },
        },
      );
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    const archivedResponse = await getArchivedScheduleResponse();

    if (archivedResponse) {
      return archivedResponse;
    }

    const proxyError =
      error instanceof ToeicProxyError
        ? error
        : new ToeicProxyError("Failed to fetch data", "UPSTREAM_FETCH_FAILED");

    return NextResponse.json(
      {
        error: "Failed to fetch data",
        message: proxyError.message,
        code: proxyError.code,
      },
      {
        status: proxyError.status,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
