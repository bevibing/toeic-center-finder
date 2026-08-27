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
    question: "토익 접수는 어디서 하나요? 토익맵에서 바로 접수할 수 있나요?",
    answer:
      "토익 접수는 TOEIC 공식 접수 시스템에서만 가능하며 토익맵에서는 접수할 수 없습니다. 토익맵은 어떤 시험일에 어느 지역 시험장이 공개되어 있는지 미리 비교해 보는 용도이며, 원하는 시험장을 정한 뒤 공식 사이트에서 접수하시면 됩니다. 접수 기간과 잔여 좌석은 시험일마다 다르므로 공식 사이트에서 확인하세요.",
  },
  {
    question: "토익 고사장과 토익 시험장은 다른 말인가요?",
    answer:
      "같은 뜻입니다. 공식 안내에서는 시험장이라는 표현을 쓰고 응시자들은 고사장이라는 말도 자주 사용합니다. 토익맵에서는 두 표현을 같은 의미로 보고 지역별·시험일별 시험장 목록을 제공합니다.",
  },
  {
    question: "원하는 시험장을 직접 고를 수 있나요?",
    answer:
      "시험장 선택은 공식 접수 과정에서 이루어지며, 인기 있는 시험장은 접수 시작 직후 마감되기도 합니다. 토익맵은 접수 전에 어느 시험장이 가까운지 미리 비교해 두는 용도이고, 실제 선택과 잔여 좌석 확인은 공식 사이트에서 해야 합니다.",
  },
  {
    question: "찾는 지역이 목록에 없습니다.",
    answer:
      "토익맵은 공식 조회에서 사용하는 16개 권역 구분을 그대로 따릅니다. 예를 들어 충북과 충남은 충청으로 묶이며, 시·군 단위는 해당 권역 페이지 안에서 시군구별 시험장 수로 확인할 수 있습니다. 권역에 시험장이 없는 시험일에는 목록이 비어 있을 수 있습니다.",
  },
  {
    question: "목록에는 있는데 지도에 표시되지 않는 시험장이 있습니다.",
    answer:
      "좌표가 확인되지 않은 시험장은 지도에 표시하지 않고 목록에만 노출합니다. 잘못된 위치를 찍어 시험 당일 헤매게 하는 것보다, 표시하지 않고 주소를 그대로 보여주는 편이 안전하다고 판단했습니다. 주소를 지도 앱에 직접 입력하면 정확한 위치를 확인할 수 있습니다.",
  },
  {
    question: "시험장 목록은 언제 공개되나요?",
    answer:
      "시험장은 공식 접수가 시작되면서 공개되며, 접수 진행 상황에 따라 시험장이 추가되거나 마감될 수 있습니다. 토익맵은 공식 조회 결과를 주기적으로 확인해 반영하므로 접수 초반에는 목록이 계속 늘어날 수 있습니다. 각 페이지의 확인일을 참고하세요.",
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
