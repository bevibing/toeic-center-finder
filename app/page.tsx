import Link from "next/link";
import DataSourceNote from "@/components/data-source-note";
import ToeicCenterFinderClient from "@/components/toeic-center-finder-client";
import { LOCATION_FILTERS } from "@/lib/constants";
import { getUpcomingExamDateOverview } from "@/lib/landing-data";
import { getToeicLandingArchive } from "@/lib/toeic-archive";

export const revalidate = 3600;

export default async function HomePage() {
  const [upcomingExamDates, archive] = await Promise.all([
    getUpcomingExamDateOverview(),
    getToeicLandingArchive(),
  ]);
  const nextExamDate = upcomingExamDates[0];

  return (
    <main>
      <h1 className="visually-hidden">내 근처 토익 시험장 찾기</h1>
      <ToeicCenterFinderClient initialExamDate={nextExamDate?.examDate} />

      <section className="page-shell">
        <section className="page-section">
          <h2>토익맵은 어떤 서비스인가요?</h2>
          <p className="page-copy">
            토익맵은 지역과 시험일을 선택하면 공개된 토익 시험장 목록과 대표
            주소를 지도에서 바로 비교할 수 있는 도구입니다. 현재 위치를 허용하면
            시험장을 가까운 순서로 정렬해 응시 지역을 정하는 데 걸리는 시간을
            줄일 수 있습니다.
          </p>
          <p className="page-copy">
            토익맵은 한국TOEIC위원회가 운영하는 공식 사이트가 아닌 비공식 편의
            도구입니다. 접수 가능 여부와 시험 규정은 반드시 공식 사이트에서
            최종 확인하세요.
          </p>
          <DataSourceNote
            updatedAt={archive.generatedAt}
            dataSource="archive"
            sourceUrl={archive.source.url}
          />
        </section>

        {nextExamDate ? (
          <section className="page-section">
            <div className="page-section-header">
              <h2>다가오는 토익 시험 일정</h2>
              <p className="page-copy">
                가장 가까운 시험일은 {nextExamDate.examDate}(
                {nextExamDate.displayLabel})이며, 전국 {nextExamDate.regionCount}개
                지역에서 시험장 {nextExamDate.centerCount}곳이 공개되어 있습니다.
              </p>
            </div>
            <table className="page-table">
              <thead>
                <tr>
                  <th>시험일</th>
                  <th>공개 지역</th>
                  <th>시험장 수</th>
                </tr>
              </thead>
              <tbody>
                {upcomingExamDates.map((summary) => (
                  <tr key={summary.examDate}>
                    <td>
                      {summary.examDate} ({summary.displayLabel})
                    </td>
                    <td>{summary.regionCount}개 지역</td>
                    <td>{summary.centerCount}곳</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <section className="page-section">
          <div className="page-section-header">
            <h2>이렇게 사용하세요</h2>
            <p className="page-copy">
              접수 전에 어느 지역 어느 시험장에서 볼지 미리 정해두면 접수 화면에서
              헤매지 않습니다.
            </p>
          </div>
          <ol className="page-list">
            <li>
              응시할 시험일을 고릅니다. 시험일마다 운영되는 시험장이 다르기
              때문에 날짜를 먼저 정하는 편이 빠릅니다.
            </li>
            <li>
              지역을 선택하거나 현재 위치 사용을 누릅니다. 위치를 허용하면
              시험장이 가까운 순서로 정렬됩니다.
            </li>
            <li>
              목록에서 시험장을 누르면 지도에서 위치를 확인할 수 있습니다.
              주소를 지도 앱에 넣어 실제 이동 시간을 확인해 보세요.
            </li>
            <li>
              시험장을 정했다면 공식 사이트에서 접수를 진행합니다. 토익맵에서는
              접수할 수 없습니다.
            </li>
          </ol>
        </section>

        <section className="page-section">
          <div className="page-section-header">
            <h2>토익 시험장은 어떻게 정해지나요?</h2>
            <p className="page-copy">
              토익 시험장은 시험일마다 새로 편성됩니다. 대부분 중학교와
              고등학교를 빌려 사용하고 일부 지역은 대학교 강의동을 사용합니다.
              같은 지역이라도 이번 시험일에 열린 고사장이 다음 시험일에는 열리지
              않을 수 있습니다.
            </p>
            <p className="page-copy">
              그래서 &ldquo;토익 고사장&rdquo;을 검색할 때는 지역만이 아니라
              시험일까지 함께 확인해야 합니다. 토익맵이 지역과 시험일을 두 축으로
              나눠 페이지를 제공하는 이유입니다. 자세한 내용은{" "}
              <Link href="/faq">이용 안내</Link>와{" "}
              <Link href="/about">데이터 소개</Link>에서 확인할 수 있습니다.
            </p>
          </div>
        </section>

        <section className="page-section">
          <div className="page-section-header">
            <h2>지역별 토익 시험장 바로가기</h2>
            <p className="page-copy">
              지역 페이지에서는 해당 지역의 시험일별 시험장 수와 대표 시험장을
              한 번에 확인할 수 있습니다.
            </p>
          </div>
          <div className="page-chip-list">
            {LOCATION_FILTERS.map((region) => (
              <Link
                key={region}
                className="page-chip-link"
                href={`/regions/${region}`}
              >
                {region} 토익 시험장
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
