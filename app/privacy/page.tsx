import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import SeoBreadcrumbs from "@/components/seo-breadcrumbs";
import { buildBreadcrumbStructuredData, buildPageMetadata, buildWebPageStructuredData } from "@/lib/site";
import { TOEIC_OFFICIAL_GUIDE_URL } from "@/lib/toeic-archive";

const PAGE_PATH = "/privacy";
const UPDATED_AT = "2026-07-27T00:00:00.000Z";

export const metadata: Metadata = buildPageMetadata({
  title: "토익맵 개인정보 안내",
  description:
    "토익맵의 현재 위치 사용 방식과 방문 분석 데이터 처리 원칙을 안내합니다.",
  path: PAGE_PATH,
});

export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <SeoBreadcrumbs
        items={[
          { label: "홈", href: "/" },
          { label: "개인정보 안내" },
        ]}
      />
      <JsonLd
        data={buildBreadcrumbStructuredData([
          { name: "홈", path: "/" },
          { name: "개인정보 안내", path: PAGE_PATH },
        ])}
      />
      <JsonLd
        data={buildWebPageStructuredData({
          name: "토익맵 개인정보 안내",
          description: "현재 위치와 방문 분석 데이터의 처리 방식을 안내합니다.",
          path: PAGE_PATH,
          dateModified: UPDATED_AT,
          sourceUrl: TOEIC_OFFICIAL_GUIDE_URL,
        })}
      />

      <section className="page-hero compact">
        <p className="page-kicker">개인정보 안내</p>
        <h1>현재 위치는 브라우저 안에서만 거리 계산에 사용합니다</h1>
        <p className="page-lead">
          위치 사용 버튼을 누르기 전에는 위치 권한을 요청하지 않습니다. 허용한
          현재 위치 값은 토익맵 서버에 저장하거나 전송하지 않으며, 브라우저에서
          시험장까지의 직선거리를 계산하고 지도를 이동하는 데 사용합니다.
        </p>
      </section>

      <section className="page-section">
        <h2>방문 분석</h2>
        <p className="page-copy">
          사이트 개선을 위해 Vercel Web Analytics의 익명 방문 통계를 사용합니다.
          토익맵은 이름, 이메일, TOEIC 접수 정보나 위치 좌표를 분석 이벤트로
          수집하지 않습니다.
        </p>
      </section>

      <section className="page-section">
        <h2>외부 서비스</h2>
        <p className="page-copy">
          지도 타일과 공식 TOEIC 링크처럼 외부 서비스로 이동하거나 외부
          리소스를 불러올 때는 해당 서비스의 정책이 적용됩니다.
        </p>
      </section>
    </main>
  );
}
