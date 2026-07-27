import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import {
  TOEIC_OFFICIAL_GUIDE_URL,
  TOEIC_OFFICIAL_SCHEDULE_URL,
} from "@/lib/toeic-archive";
import {
  buildBreadcrumbStructuredData,
  buildFaqStructuredData,
  buildPageMetadata,
} from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: "토익 시험장 지도 이용 안내",
  description:
    "지역·시험일별 토익 시험장 지도, 현재 위치 정렬과 공식 정보 확인 방법을 안내합니다.",
  path: "/faq",
  keywords: ["토익 시험장 지도", "토익 시험장 찾기 방법"],
});

const FAQ_ITEMS = [
  {
    question: "지역과 날짜로 검색한 시험장을 지도에서 바로 볼 수 있나요?",
    answer:
      "네. 지역 또는 시험일 랜딩 페이지를 열면 지도와 검색기가 안내 글보다 먼저 표시됩니다. 가장 가까운 활성 시험일과 검색한 지역이 자동 선택되며, 다른 날짜나 지역으로 즉시 바꿀 수 있습니다.",
  },
  {
    question: "현재 위치를 사용하면 위치가 서버에 저장되나요?",
    answer:
      "아니요. 현재 위치 값은 토익맵 서버에 저장하거나 전송하지 않고 브라우저 안에서 시험장까지의 직선거리를 계산하는 데 사용합니다. 위치 권한을 거부해도 지역·시험일 검색은 사용할 수 있습니다.",
  },
  {
    question: "시험일마다 시험장 목록이 다른 이유는 무엇인가요?",
    answer:
      "TOEIC 시험장은 시험일과 지역에 따라 달라질 수 있습니다. 토익맵은 공식 조회 시스템에 공개된 활성 시험장의 마지막 정상 데이터를 표시하며, 실제 접수 가능 여부는 TOEIC 공식 사이트에서 최종 확인해야 합니다.",
  },
  {
    question: "지난 시험일 페이지도 사용할 수 있나요?",
    answer:
      "종료된 시험일 페이지는 갑자기 404로 사라지지 않고 종료 상태와 다음 활성 시험일 지도를 안내합니다. 마지막 정상 데이터가 남아 있으면 당시 공개된 시험장 정보도 함께 제공합니다.",
  },
  {
    question: "TOEIC 성적 유효기간은 어떻게 확인하나요?",
    answer:
      "공식 시험관리규정상 성적 유효기간은 시험 시행일로부터 2년 뒤 해당 시험일자까지입니다. 개인별 성적과 발급 가능 여부는 TOEIC 공식 사이트에서 확인하세요.",
  },
];

export default function FaqPage() {
  return (
    <main className="page-shell">
      <SeoBreadcrumbs
        items={[
          { label: "홈", href: "/" },
          { label: "이용 안내" },
        ]}
      />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "이용 안내", path: "/faq" },
        ])}
      />
      <JsonLd data={buildFaqStructuredData(FAQ_ITEMS)} />

      <section className="page-hero compact">
        <p className="page-kicker">이용 안내</p>
        <h1>토익 시험장 지도를 빠르게 사용하는 방법</h1>
        <p className="page-lead">
          검색 결과에 들어오면 지도를 먼저 사용하고, 필요한 경우 아래 안내에서
          데이터 기준과 공식 확인 방법을 확인하세요.
        </p>
      </section>

      <section className="page-section">
        <div className="faq-list">
          {FAQ_ITEMS.map((item) => (
            <article className="faq-item" key={item.question}>
              <h2>{item.question}</h2>
              <p className="page-copy">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section official-source-card">
        <h2>접수·시험 규정은 공식 사이트에서 확인하세요</h2>
        <p className="page-copy">
          접수 기간, 응시료, 규정 신분증, 입실 시각과 성적 발표일은 변경될 수
          있으므로 토익맵이 대신 단정하지 않습니다.
        </p>
        <div className="page-actions">
          <Link className="page-button" href={TOEIC_OFFICIAL_SCHEDULE_URL} rel="external">
            TOEIC 공식 사이트 일정
          </Link>
          <Link
            className="page-button secondary"
            href={TOEIC_OFFICIAL_GUIDE_URL}
            rel="external"
          >
            공식 수험자 가이드
          </Link>
        </div>
      </section>
    </main>
  );
}
