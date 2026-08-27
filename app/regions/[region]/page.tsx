import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DataSourceNote from "@/components/data-source-note";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import ToeicCenterFinderClient from "@/components/toeic-center-finder-client";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getAvailableRegionDateLanding, getRegionPageSummaries } from "@/lib/landing-data";
import { getRegionIntro } from "@/lib/region-content";
import { buildRegionInsights, describeRegionCoverage } from "@/lib/region-insights";
import { decodeRouteSegment } from "@/lib/route-utils";
import { getToeicLandingArchive } from "@/lib/toeic-archive";
import {
  buildBreadcrumbStructuredData,
  buildCollectionPageStructuredData,
  buildPageMetadata,
} from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCATION_FILTERS.map((region) => ({ region }));
}

const isValidRegion = (region: string): boolean =>
  LOCATION_FILTERS.includes(region as (typeof LOCATION_FILTERS)[number]);

interface RegionPageProps {
  params: Promise<{
    region: string;
  }>;
}

export async function generateMetadata({
  params,
}: RegionPageProps): Promise<Metadata> {
  const { region: rawRegion } = await params;
  const region = decodeRouteSegment(rawRegion);

  if (!isValidRegion(region)) {
    return buildPageMetadata({
      title: "토익 시험장 찾기",
      description: "토익 시험장 찾기 페이지입니다.",
      path: "/regions",
    });
  }

  return buildPageMetadata({
    title: `${region} 토익 시험장 찾기`,
    description: `${region} 지역 토익 시험장과 활성 시험일별 랜딩 페이지를 확인할 수 있습니다.`,
    path: `/regions/${region}`,
    keywords: [`${region} 토익 시험장`, `${region} 토익 고사장`],
  });
}

export default async function RegionPage({ params }: RegionPageProps) {
  const { region: rawRegion } = await params;
  const region = decodeRouteSegment(rawRegion);

  if (!isValidRegion(region)) {
    notFound();
  }

  const summaries = await getRegionPageSummaries(region);
  const archive = await getToeicLandingArchive();
  const nearestLanding = summaries[0]
    ? await getAvailableRegionDateLanding(region, summaries[0].examDate)
    : null;
  const insights = nearestLanding ? buildRegionInsights(nearestLanding.centers) : null;
  const coverage = insights ? describeRegionCoverage(region, insights) : null;
  const breadcrumbs = [
    { label: "홈", href: "/" },
    { label: "지역별 토익 시험장", href: "/regions" },
    { label: `${region} 토익 시험장` },
  ];
  const intro = getRegionIntro(region);

  return (
    <main className="page-shell">
      <SeoBreadcrumbs items={breadcrumbs} />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "지역별 토익 시험장", path: "/regions" },
          { name: `${region} 토익 시험장`, path: `/regions/${region}` },
        ])}
      />
      <JsonLd
        data={buildCollectionPageStructuredData({
          name: `${region} 토익 시험장`,
          description: intro,
          path: `/regions/${region}`,
          itemNames: summaries.map((summary) => `${summary.examDate} ${region} 토익 시험장`),
          itemPaths: summaries.map(
            (summary) => `/regions/${region}/dates/${summary.examDate}`,
          ),
        })}
      />
      <section className="page-hero compact">
        <p className="page-kicker">{region} 시험장 지도</p>
        <h1>{region} 토익 시험장 찾기</h1>
        <p className="page-lead">
          {summaries[0]
            ? `${region} 지역에서 응시 가능한 토익 시험일은 현재 ${summaries.length}개이며, 가장 가까운 시험일은 ${summaries[0].examDate}로 시험장 ${summaries[0].centerCount}곳이 공개되어 있습니다.`
            : `현재 ${region} 지역에 공개된 토익 시험일이 없습니다. 다른 지역이나 시험일을 선택해 확인할 수 있습니다.`}
        </p>
        <p className="page-copy">{intro}</p>
        <DataSourceNote
          updatedAt={summaries[0]?.updatedAt ?? archive.generatedAt}
          dataSource={summaries[0]?.dataSource ?? "archive"}
          sourceUrl={summaries[0]?.sourceUrl ?? archive.source.url}
        />
      </section>

      <section
        className="finder-section priority"
        data-testid="finder-priority"
        id="finder-tool"
      >
        <div className="page-section-header finder-priority-header">
          <h2>{region}에서 가까운 토익 시험장 지도</h2>
          <p className="page-copy">
            현재 위치를 허용하면 선택한 시험장의 직선거리가 가까운 순서로
            정렬됩니다.
          </p>
        </div>
        <div className="finder-frame">
          <ToeicCenterFinderClient
            initialExamDate={summaries[0]?.examDate}
            initialLocationFilter={region}
          />
        </div>
      </section>

      {coverage && insights ? (
        <section className="page-section">
          <div className="page-section-header">
            <h2>{region} 토익 시험장은 어디에 있나요?</h2>
            <p className="page-copy">{coverage}</p>
          </div>
          {insights.districts.length > 1 ? (
            <table className="page-table">
              <thead>
                <tr>
                  <th>시군구</th>
                  <th>시험장 수</th>
                </tr>
              </thead>
              <tbody>
                {insights.districts.map((district) => (
                  <tr key={district.name}>
                    <td>{district.name}</td>
                    <td>{district.centerCount}곳</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <p className="page-note">
            {summaries[0]?.examDate} 시험일 기준이며, 시험일마다 운영되는 고사장은
            달라질 수 있습니다.
          </p>
        </section>
      ) : null}

      {nearestLanding && nearestLanding.centers.length > 0 ? (
        <section className="page-section">
          <div className="page-section-header">
            <h2>
              {nearestLanding.examDate} {region} 토익 시험장 전체 목록
            </h2>
            <p className="page-copy">
              가장 가까운 시험일에 공개된 {region} 지역 시험장 {nearestLanding.centers.length}
              곳의 이름과 대표 주소입니다. 다른 시험일은 아래 표에서 선택하세요.
            </p>
          </div>
          <table className="page-table">
            <thead>
              <tr>
                <th>시험장명</th>
                <th>주소</th>
              </tr>
            </thead>
            <tbody>
              {nearestLanding.centers.map((center) => (
                <tr key={center.center_code}>
                  <td>{center.center_name}</td>
                  <td>{center.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="page-section">
        <div className="page-section-header">
          <h2>시험일별 {region} 토익 시험장</h2>
          <p className="page-copy">
            공개된 시험장이 있는 일정만 노출합니다. 원하는 시험일을 선택하면
            대표 시험장과 주소를 포함한 상세 랜딩 페이지로 이동합니다.
          </p>
        </div>

        {summaries.length > 0 ? (
          <table className="page-table">
            <thead>
              <tr>
                <th>시험일</th>
                <th>시험장 수</th>
                <th>대표 시험장</th>
                <th>이동</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary) => (
                <tr key={summary.examDate}>
                  <td>{summary.examDate}</td>
                  <td>{summary.centerCount}곳</td>
                  <td>
                    {summary.topCenters.map((center) => center.center_name).join(", ")}
                  </td>
                  <td>
                    <Link
                      className="page-chip-link"
                      href={`/regions/${region}/dates/${summary.examDate}`}
                    >
                      시험일 페이지 보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="page-copy">
            현재 공개된 {region} 시험장 데이터가 없어 검색 도구에서 직접 확인하는
            흐름을 우선 제공합니다.
          </p>
        )}
      </section>
    </main>
  );
}
