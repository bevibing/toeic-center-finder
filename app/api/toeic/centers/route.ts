import { NextRequest, NextResponse } from "next/server";
import {
  TOEIC_CENTERS_CACHE_TTL_SECONDS,
  TOEIC_CENTERS_STALE_TTL_SECONDS,
} from "@/lib/constants";
import { findArchivedCentersByExamCode } from "@/lib/toeic-archive";
import { postToToeicUpstream, ToeicProxyError } from "@/lib/toeic-proxy";

export const runtime = "nodejs";

const CACHE_CONTROL = [
  "public",
  `max-age=${TOEIC_CENTERS_CACHE_TTL_SECONDS}`,
  `s-maxage=${TOEIC_CENTERS_CACHE_TTL_SECONDS}`,
  `stale-while-revalidate=${TOEIC_CENTERS_STALE_TTL_SECONDS}`,
].join(", ");

const getArchivedCenterResponse = async (
  examCode: string,
  bigArea: string,
) => {
  const archivedCenters = await findArchivedCentersByExamCode(examCode, bigArea);

  if (!archivedCenters || archivedCenters.length === 0) {
    return null;
  }

  return NextResponse.json([null, null, archivedCenters], {
    headers: {
      "Cache-Control": CACHE_CONTROL,
      "X-TOEIC-Data-Source": "archive",
    },
  });
};

export async function GET(request: NextRequest) {
  const examCode = request.nextUrl.searchParams.get("examCode");
  const bigArea = request.nextUrl.searchParams.get("bigArea");

  if (!examCode || !bigArea) {
    return NextResponse.json(
      { error: "Missing required parameters: examCode or bigArea" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const data = await postToToeicUpstream({
      proc: "getExamAreaInfo",
      examCate: "TOE",
      examCode,
      bigArea,
      sbGoodsType1: "TOE",
    }, {
      cacheTtlSeconds: TOEIC_CENTERS_CACHE_TTL_SECONDS,
    });

    const hasCenters =
      Array.isArray(data) &&
      Array.isArray(data[2]) &&
      data[2].length > 0;

    if (!hasCenters) {
      const archivedResponse = await getArchivedCenterResponse(examCode, bigArea);

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
    const archivedResponse = await getArchivedCenterResponse(examCode, bigArea);

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
