import type { ApiCenterInfo } from "@/lib/types";

export type VenueType = "대학교" | "고등학교" | "중학교" | "기타";

export interface DistrictSummary {
  name: string;
  centerCount: number;
}

export interface RegionInsights {
  districts: DistrictSummary[];
  venueCounts: Array<{ type: VenueType; count: number }>;
  totalCenters: number;
}

const DISTRICT_SUFFIXES = ["시", "군", "구"];

/**
 * Korean road-name addresses are "<시도> <시군구> <도로명> ...", so the second
 * token is the district. Falls back to the first token when an address is
 * shaped differently (e.g. 세종특별자치시, which has no separate district).
 */
export const extractDistrict = (address: string): string | null => {
  const tokens = address.trim().split(/\s+/);

  if (tokens.length === 0) {
    return null;
  }

  const candidate = tokens[1];

  if (candidate && DISTRICT_SUFFIXES.some((suffix) => candidate.endsWith(suffix))) {
    return candidate;
  }

  return tokens[0] || null;
};

/**
 * Center names arrive as short official labels: a school abbreviation optionally
 * followed by a building ("연세대미래관"), a branch in parentheses
 * ("전일중(전주)"), or a room ("제주대 아라캠 교양강의동"). Each type is matched
 * either at a name boundary or ahead of a building suffix, and universities are
 * checked first so "한양대 에리카캠퍼스" is not mistaken for anything else.
 */
const VENUE_PATTERNS: Array<{ type: VenueType; pattern: RegExp }> = [
  { type: "대학교", pattern: /대학|캠|공전|[가-힣]대(?=[\s(]|$)|[가-힣]대[가-힣\s]*관/ },
  {
    type: "고등학교",
    pattern: /고등학교|공고|여고|여상|상고|[가-힣]고(?=[\s(]|$)|[가-힣]고[가-힣\s]*관/,
  },
  { type: "중학교", pattern: /중학교|여중|[가-힣]중(?=[\s(]|$)|[가-힣]중[가-힣\s]*관/ },
];

export const classifyVenue = (centerName: string): VenueType => {
  for (const { type, pattern } of VENUE_PATTERNS) {
    if (pattern.test(centerName)) {
      return type;
    }
  }

  return "기타";
};

const VENUE_ORDER: VenueType[] = ["중학교", "고등학교", "대학교", "기타"];

export const buildRegionInsights = (centers: ApiCenterInfo[]): RegionInsights => {
  const districtCounts = new Map<string, number>();
  const venueCounts = new Map<VenueType, number>();

  for (const center of centers) {
    const district = extractDistrict(center.address);

    if (district) {
      districtCounts.set(district, (districtCounts.get(district) ?? 0) + 1);
    }

    const venueType = classifyVenue(center.center_name);
    venueCounts.set(venueType, (venueCounts.get(venueType) ?? 0) + 1);
  }

  return {
    districts: [...districtCounts.entries()]
      .map(([name, centerCount]) => ({ name, centerCount }))
      .sort(
        (left, right) =>
          right.centerCount - left.centerCount || left.name.localeCompare(right.name, "ko"),
      ),
    venueCounts: VENUE_ORDER.filter((type) => venueCounts.has(type)).map((type) => ({
      type,
      count: venueCounts.get(type) ?? 0,
    })),
    totalCenters: centers.length,
  };
};

const formatList = (values: string[], limit: number): string => {
  const shown = values.slice(0, limit);
  return shown.join(", ");
};

/**
 * Data-derived prose so each region/date page describes its own venues rather
 * than repeating a template with the region name swapped in.
 */
export const describeRegionCoverage = (
  region: string,
  insights: RegionInsights,
): string | null => {
  if (insights.totalCenters === 0) {
    return null;
  }

  const { districts, venueCounts, totalCenters } = insights;
  const sentences: string[] = [];

  // Distribution sentence — shape depends on how concentrated the region is,
  // so a two-venue island region does not read like a 25-district metro.
  if (districts.length === 1) {
    sentences.push(
      `${region} 지역 시험장 ${totalCenters}곳은 모두 ${districts[0].name} 안에 있어 이동 거리를 크게 고민하지 않아도 됩니다.`,
    );
  } else if (districts.length > 0) {
    const top = districts[0];
    const share = Math.round((top.centerCount / totalCenters) * 100);
    const topDistricts = formatList(
      districts.map((district) => district.name),
      5,
    );

    if (share >= 30) {
      sentences.push(
        `${region} 지역 시험장 ${totalCenters}곳 가운데 ${share}%가 ${top.name}에 몰려 있고, 나머지는 ${districts.length - 1}개 시군구에 흩어져 있습니다.`,
      );
    } else {
      sentences.push(
        `${region} 지역 시험장 ${totalCenters}곳은 ${districts.length}개 시군구에 고르게 흩어져 있으며 ${topDistricts}${
          districts.length > 5 ? " 등의" : ""
        } 순으로 많습니다.`,
      );
    }
  }

  // Venue-mix sentence — universities and schools imply different access.
  if (venueCounts.length > 0) {
    const dominant = [...venueCounts].sort((left, right) => right.count - left.count)[0];
    const dominantShare = Math.round((dominant.count / totalCenters) * 100);
    const venueText = venueCounts
      .map((venue) => `${venue.type} ${venue.count}곳`)
      .join(", ");

    if (dominant.type === "대학교" && dominantShare >= 50) {
      sentences.push(
        `${venueText}으로 대학 캠퍼스 비중이 높아, 같은 학교 안에서도 건물을 찾아가야 하는 경우가 많습니다.`,
      );
    } else if (dominantShare >= 70) {
      sentences.push(
        `${venueText}으로 대부분 ${dominant.type}에서 시험이 치러집니다.`,
      );
    } else {
      sentences.push(`시험장 유형은 ${venueText}으로 섞여 있습니다.`);
    }
  }

  sentences.push(
    totalCenters <= 3
      ? "시험장 수가 적어 접수 시작 직후 마감될 수 있으니 공식 사이트에서 잔여 여부를 서둘러 확인하세요."
      : "고사장은 시험일마다 달라질 수 있으므로 접수 전 공식 사이트에서 최종 확인하세요.",
  );

  return sentences.join(" ");
};
