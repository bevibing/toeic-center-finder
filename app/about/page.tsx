import type { Metadata } from "next";
import Link from "next/link";
import DataSourceNote from "@/components/data-source-note";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import { getToeicLandingArchive, TOEIC_OFFICIAL_SCHEDULE_URL } from "@/lib/toeic-archive";
import {
  buildBreadcrumbStructuredData,
  buildPageMetadata,
  buildWebPageStructuredData,
  SITE_REPOSITORY_URL,
} from "@/lib/site";

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
        <h2>데이터는 얼마나 자주 갱신되나요?</h2>
        <p className="page-copy">
          시험 일정과 시험장 목록은 공식 조회 결과를 기준으로 주기적으로
          갱신하며, 각 페이지 상단에 마지막으로 확인한 날짜를 함께 표시합니다.
          공식 시스템에 새 시험일이 열리면 해당 시험일의 지역별 페이지가 새로
          만들어지고, 시험이 끝난 날짜는 종료 표시와 함께 다음 시험일로 안내가
          바뀝니다.
        </p>
        <p className="page-copy">
          다만 토익맵의 데이터는 실시간이 아닙니다. 공식 시스템에서 시험장이
          추가되거나 취소된 직후에는 토익맵 화면과 실제 정보가 잠시 다를 수
          있습니다. 화면에 표시된 확인일이 오래되었다면 공식 사이트를 먼저
          확인하시는 편이 안전합니다.
        </p>
      </section>

      <section className="page-section">
        <h2>토익맵이 하지 않는 일</h2>
        <p className="page-copy">
          토익맵은 시험장을 미리 살펴보는 지도일 뿐이며, 아래 기능은 제공하지
          않습니다. 모두 공식 시스템에서만 가능합니다.
        </p>
        <ul className="page-list">
          <li>시험 접수와 결제, 접수 변경 및 취소</li>
          <li>시험장별 잔여 좌석이나 마감 여부 조회</li>
          <li>수험표 발급과 성적 확인, 성적표 재발급</li>
          <li>시험 규정, 응시료, 준비물 안내</li>
        </ul>
        <p className="page-note">
          시험장 좌표가 확인되지 않은 경우에는 지도에 표시하지 않고 목록에만
          노출합니다. 잘못된 위치를 표시하는 것보다 표시하지 않는 편이 안전하다고
          판단했기 때문입니다.
        </p>
      </section>

      <section className="page-section">
        <h2>누가 만들고 운영하나요?</h2>
        <p className="page-copy">
          토익맵은 개인이 만들어 운영하는 사이드 프로젝트입니다. 별도의 법인이나
          기관이 아니며, 광고나 유료 상품 없이 공개된 공식 정보를 찾기 쉽게
          정리하는 것만을 목적으로 합니다. 소스 코드는 GitHub에 공개되어 있어
          데이터를 어떻게 수집하고 가공하는지 직접 확인할 수 있습니다.
        </p>
      </section>

      <section className="page-section">
        <h2>오류 제보와 문의</h2>
        <p className="page-copy">
          시험장명·주소·좌표가 실제 정보와 다르면 GitHub 이슈로 알려주세요.
          공식 사이트의 최신 정보와 대조해 수정합니다. 어떤 시험일의 어느
          시험장인지 함께 적어주시면 확인이 빠릅니다.
        </p>
        <ul className="page-list">
          <li>
            소스 코드:{" "}
            <Link href={SITE_REPOSITORY_URL} rel="external">
              {SITE_REPOSITORY_URL}
            </Link>
          </li>
        </ul>
        <Link
          className="page-button"
          href={`${SITE_REPOSITORY_URL}/issues`}
          rel="external"
        >
          오류 제보하기
        </Link>
      </section>
    </main>
  );
}
