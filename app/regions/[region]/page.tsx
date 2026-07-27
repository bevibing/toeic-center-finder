import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DataSourceNote from "@/components/data-source-note";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import ToeicCenterFinderClient from "@/components/toeic-center-finder-client";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getRegionPageSummaries } from "@/lib/landing-data";
import { getRegionIntro } from "@/lib/region-content";
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
        })}
      />
      <section className="page-hero compact">
        <p className="page-kicker">{region} 시험장 지도</p>
        <h1>{region} 토익 시험장 찾기</h1>
        <p className="page-lead">
          {summaries[0]
            ? `${summaries[0].examDate} 시험일과 ${region} 지역을 미리 선택했습니다. 지도에서 시험장을 바로 확인하거나 날짜를 바꿔 보세요.`
            : `${intro} 현재 공개된 일정이 없으면 다른 지역이나 시험일을 선택할 수 있습니다.`}
        </p>
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
