import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DataSourceNote from "@/components/data-source-note";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import ToeicCenterFinderClient from "@/components/toeic-center-finder-client";
import { getAvailableRegionDateLanding, getExamDateLabel, getRegionPageSummaries } from "@/lib/landing-data";
import { getRegionIntro } from "@/lib/region-content";
import { decodeRouteSegment } from "@/lib/route-utils";
import {
  buildBreadcrumbStructuredData,
  buildCenterCollectionStructuredData,
  buildPageMetadata,
  buildWebPageStructuredData,
} from "@/lib/site";

export const revalidate = 3600;

interface RegionDatePageProps {
  params: Promise<{
    examDate: string;
    region: string;
  }>;
}

export async function generateMetadata({
  params,
}: RegionDatePageProps): Promise<Metadata> {
  const { region: rawRegion, examDate: rawExamDate } = await params;
  const region = decodeRouteSegment(rawRegion);
  const examDate = decodeRouteSegment(rawExamDate);
  const landingData = await getAvailableRegionDateLanding(region, examDate);

  if (!landingData) {
    return buildPageMetadata({
      title: "토익 시험장 찾기",
      description: "토익 시험장 찾기 페이지입니다.",
      path: "/regions",
    });
  }

  if (landingData.status === "archived") {
    return buildPageMetadata({
      title: `${examDate} ${region} 토익 시험장 (종료)`,
      description: `${examDate} ${region} 토익 시험은 종료되었습니다. 다음 활성 시험일의 ${region} 시험장 지도를 바로 확인할 수 있습니다.`,
      path: `/regions/${region}/dates/${examDate}`,
      keywords: [`${region} 토익 시험장`, `${examDate} 토익 시험장`],
    });
  }

  return buildPageMetadata({
    title: `${examDate} ${region} 토익 시험장`,
    description: `${examDate} 시험일 기준 ${region} 토익 시험장 ${landingData.centers.length}곳과 대표 주소를 확인할 수 있습니다.`,
    path: `/regions/${region}/dates/${examDate}`,
    keywords: [`${region} 토익 시험장`, `${examDate} 토익 시험장`, `${region} 토익 시험일`],
  });
}

export default async function RegionDatePage({ params }: RegionDatePageProps) {
  const { region: rawRegion, examDate: rawExamDate } = await params;
  const region = decodeRouteSegment(rawRegion);
  const examDate = decodeRouteSegment(rawExamDate);
  const landingData = await getAvailableRegionDateLanding(region, examDate);

  if (!landingData) {
    notFound();
  }

  const relatedDates = (await getRegionPageSummaries(region))
    .filter((summary) => summary.examDate !== examDate)
    .slice(0, 4);
  const breadcrumbs = [
    { label: "홈", href: "/" },
    { label: "지역별 토익 시험장", href: "/regions" },
    { label: `${region} 토익 시험장`, href: `/regions/${region}` },
    { label: examDate },
  ];
  const examDateLabel = getExamDateLabel(examDate);
  const intro = getRegionIntro(region);
  const mapExamDate =
    landingData.status === "active" ? examDate : (relatedDates[0]?.examDate ?? "");
  const pagePath = `/regions/${region}/dates/${examDate}`;
  const pageName = `${examDate} ${region} 토익 시험장`;
  const pageDescription =
    landingData.status === "active"
      ? `${examDateLabel}에 응시 가능한 ${region} 지역 토익 시험장 목록입니다.`
      : `${examDateLabel} 시험은 종료되었습니다. 다음 활성 시험일의 ${region} 시험장 지도를 안내합니다.`;

  return (
    <main className="page-shell">
      <SeoBreadcrumbs items={breadcrumbs} />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "지역별 토익 시험장", path: "/regions" },
          { name: `${region} 토익 시험장`, path: `/regions/${region}` },
          { name: examDate, path: `/regions/${region}/dates/${examDate}` },
        ])}
      />
      <JsonLd
        data={buildWebPageStructuredData({
          name: pageName,
          description: pageDescription,
          path: pagePath,
          dateModified: landingData.updatedAt,
          sourceUrl: landingData.sourceUrl,
        })}
      />
      {landingData.centers.length > 0 ? (
        <JsonLd
          data={buildCenterCollectionStructuredData({
            name: pageName,
            description: pageDescription,
            path: pagePath,
            centers: landingData.centers,
          })}
        />
      ) : null}

      <section className="page-hero compact">
        <p className="page-kicker">
          {landingData.status === "archived" ? "종료된 시험일" : `${region} · ${examDateLabel}`}
        </p>
        <h1>{examDate} {region} 토익 시험장</h1>
        <p className="page-lead">
          {landingData.status === "active"
            ? `${examDateLabel}과 ${region} 지역을 미리 선택했습니다. 아래 지도에서 시험장을 바로 확인하고 현재 위치 기준으로 정렬해 보세요.`
            : `${examDateLabel} 시험은 종료되었습니다. 아래 지도에는 가장 가까운 다음 활성 시험일과 ${region} 지역을 선택해 두었습니다.`}
        </p>
        <div className="page-meta">
          <span>시험장 {landingData.centers.length}곳</span>
          <span>{region} 지역</span>
          <span>시험일 {examDate}</span>
        </div>
        <DataSourceNote
          updatedAt={landingData.updatedAt}
          dataSource={landingData.dataSource}
          sourceUrl={landingData.sourceUrl}
        />
      </section>

      <section
        className="finder-section priority"
        data-testid="finder-priority"
        id="finder-tool"
      >
        <div className="page-section-header finder-priority-header">
          <h2>
            {landingData.status === "active"
              ? `${examDate} ${region} 시험장 지도`
              : `${region} 다음 시험장 지도`}
          </h2>
          <p className="page-copy">
            현재 위치를 허용하면 시험장 목록을 직선거리 기준으로 정렬합니다.
          </p>
        </div>
        <div className="finder-frame">
          <ToeicCenterFinderClient
            initialExamDate={mapExamDate}
            initialLocationFilter={region}
          />
        </div>
      </section>

      <section className="page-section">
        <div className="page-section-header">
          <h2>{examDate} {region} 시험장 정보</h2>
          <p className="page-copy">
            {landingData.centers.length > 0
              ? `공식 조회에서 확인한 시험장명과 주소입니다. ${intro}`
              : "보존된 시험장 목록은 없지만 종료 상태와 다음 시험일 지도는 계속 제공합니다."}
          </p>
        </div>
        {landingData.centers.length > 0 ? (
          <table className="page-table">
            <thead>
              <tr>
                <th>시험장명</th>
                <th>주소</th>
              </tr>
            </thead>
            <tbody>
              {landingData.centers.map((center) => (
                <tr
                  id={`center-${encodeURIComponent(center.center_code)}`}
                  key={center.center_code}
                >
                  <td>{center.center_name}</td>
                  <td>{center.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="page-copy">
            해당 시험일은 종료되었습니다. 위 지도에서 다음 활성 시험일을
            확인하세요.
          </p>
        )}
      </section>

      {relatedDates.length > 0 ? (
        <section className="page-section">
          <div className="page-section-header">
            <h2>다른 시험일 보기</h2>
            <p className="page-copy">
              같은 지역의 다른 활성 시험일 페이지도 함께 비교할 수 있습니다.
            </p>
          </div>
          <div className="page-chip-list">
            {relatedDates.map((summary) => (
              <Link
                key={summary.examDate}
                className="page-chip-link"
                href={`/regions/${region}/dates/${summary.examDate}`}
              >
                {summary.examDate}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

    </main>
  );
}
