import Link from "next/link";

interface DataSourceNoteProps {
  updatedAt: string;
  dataSource: "live" | "archive";
  sourceUrl: string;
}

const formatUpdatedAt = (updatedAt: string): string => {
  const parsedDate = new Date(updatedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return updatedAt;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(parsedDate);
};

export default function DataSourceNote({
  updatedAt,
  dataSource,
  sourceUrl,
}: DataSourceNoteProps) {
  return (
    <p className="data-source-note">
      <span>공식 TOEIC 시험장 조회 기반</span>
      <span>확인일 {formatUpdatedAt(updatedAt)}</span>
      {dataSource === "archive" ? <span>마지막 정상 데이터 사용 중</span> : null}
      <Link href={sourceUrl} rel="external">
        공식 일정 확인
      </Link>
    </p>
  );
}
