import type { Metadata } from "next";
import Link from "next/link";
import DataSourceNote from "@/components/data-source-note";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import { getToeicLandingArchive, TOEIC_OFFICIAL_SCHEDULE_URL } from "@/lib/toeic-archive";
import { buildBreadcrumbStructuredData, buildPageMetadata, buildWebPageStructuredData } from "@/lib/site";

const PAGE_PATH = "/about";

export const metadata: Metadata = buildPageMetadata({
  title: "토익맵 데이터와 서비스 소개",
  description:
    "토익맵이 시험 일정, 시험장 주소와 좌표를 어떤 출처와 방식으로 제공하는지 안내합니다.",
  path: PAGE_PATH,
  keywords: ["토익맵", "토익 시험장 데이터 출처"],
});

export default async function AboutPage() {
  const archive = await getToeicLandingArchive();

  return (
    <main className="page-shell">
      <SeoBreadcrumbs
        items={[
          { label: "홈", href: "/" },
          { label: "데이터·서비스 소개" },
        ]}
      />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "데이터·서비스 소개", path: PAGE_PATH },
        ])}
      />
      <JsonLd
        data={buildWebPageStructuredData({
          name: "토익맵 데이터와 서비스 소개",
          description:
            "토익맵의 데이터 출처, 갱신 방식, 비공식 서비스 고지를 안내합니다.",
          path: PAGE_PATH,
          dateModified: archive.generatedAt,
          sourceUrl: TOEIC_OFFICIAL_SCHEDULE_URL,
        })}
      />

      <section className="page-hero compact">
        <p className="page-kicker">서비스 소개</p>
        <h1>토익맵은 공식 정보를 찾기 쉽게 연결합니다</h1>
        <p className="page-lead">
          토익맵은 한국TOEIC위원회가 운영하는 공식 사이트가 아닌 비공식 편의
          도구입니다. 시험일과 지역을 선택하면 공개된 시험장 정보를 지도와
          목록으로 빠르게 비교할 수 있도록 정리합니다.
        </p>
        <DataSourceNote
          updatedAt={archive.generatedAt}
          dataSource="archive"
          sourceUrl={archive.source.url}
        />
      </section>

      <section className="page-section">
        <h2>데이터를 만드는 방법</h2>
        <ol className="page-list">
          <li>공식 TOEIC 시험접수 시스템에서 공개된 활성 일정을 확인합니다.</li>
          <li>시험일·지역별 공개 시험장명과 주소를 정규화합니다.</li>
          <li>좌표가 확인된 시험장은 지도에 표시하고, 불확실한 좌표는 제외합니다.</li>
          <li>상위 시스템 장애 시 마지막 정상 데이터를 사용해 빈 페이지를 방지합니다.</li>
        </ol>
        <p className="page-note">
          접수 가능 여부, 시험 규정, 응시료와 일정 변경은 반드시{" "}
          <Link href={TOEIC_OFFICIAL_SCHEDULE_URL} rel="external">
            TOEIC 공식 사이트
          </Link>
          에서 최종 확인하세요.
        </p>
      </section>

      <section className="page-section">
        <h2>오류 제보와 문의</h2>
        <p className="page-copy">
          시험장명·주소·좌표가 실제 정보와 다르면 GitHub 이슈로 알려주세요.
          공식 사이트의 최신 정보와 대조해 수정합니다.
        </p>
        <Link
          className="page-button"
          href="https://github.com/bevibing/toeic-center-finder/issues"
          rel="external"
        >
          오류 제보하기
        </Link>
      </section>
    </main>
  );
}
