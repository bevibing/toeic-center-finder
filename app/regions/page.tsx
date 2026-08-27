import type { Metadata } from "next";
import Link from "next/link";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getActiveSchedules } from "@/lib/landing-data";
import { buildBreadcrumbStructuredData, buildCollectionPageStructuredData, buildPageMetadata } from "@/lib/site";
import JsonLd from "@/components/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = buildPageMetadata({
  title: "지역별 토익 시험장 찾기",
  description:
    "서울, 경기, 인천을 포함한 전국 주요 지역의 토익 시험장 페이지로 이동해 시험일별 시험장 정보를 확인할 수 있습니다.",
  path: "/regions",
  keywords: ["지역별 토익 시험장", "전국 토익 시험장"],
});

export default async function RegionsPage() {
  const schedules = await getActiveSchedules();
  const breadcrumbs = [
    { label: "홈", href: "/" },
    { label: "지역별 토익 시험장" },
  ];

  return (
    <main className="page-shell">
      <SeoBreadcrumbs items={breadcrumbs} />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "지역별 토익 시험장", path: "/regions" },
        ])}
      />
      <JsonLd
        data={buildCollectionPageStructuredData({
          name: "지역별 토익 시험장 찾기",
          description:
            "전국 주요 지역의 토익 시험장 랜딩 페이지 목록입니다.",
          path: "/regions",
          itemNames: LOCATION_FILTERS.map((region) => `${region} 토익 시험장`),
          itemPaths: LOCATION_FILTERS.map((region) => `/regions/${region}`),
        })}
      />

      <section className="page-hero">
        <p className="page-kicker">지역 랜딩 인덱스</p>
        <h1>지역별 토익 시험장 페이지 모음</h1>
        <p className="page-lead">
          원하는 지역을 선택하면 활성 시험일과 함께 해당 지역의 시험장 요약
          페이지로 이동할 수 있습니다.
        </p>
        <div className="page-meta">
          <span>활성 시험일 {schedules.length}개</span>
          <span>전국 주요 지역 {LOCATION_FILTERS.length}곳</span>
        </div>
      </section>

      <section className="page-section">
        <div className="page-section-header">
          <h2>바로 이동할 지역 선택</h2>
          <p className="page-copy">
            각 지역 페이지에서는 시험일별 시험장 개요와 대표 시험장 주소를 확인할
            수 있습니다.
          </p>
        </div>
        <div className="page-card-grid">
          {LOCATION_FILTERS.map((region) => (
            <article className="page-card" key={region}>
              <h3>{region} 토익 시험장</h3>
              <p>
                {region} 지역 응시자를 위한 시험장 랜딩 페이지와 시험일별 링크를
                확인할 수 있습니다.
              </p>
              <Link className="page-chip-link" href={`/regions/${region}`}>
                {region} 페이지 보기
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
