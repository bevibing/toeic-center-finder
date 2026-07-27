import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const FOOTER_LINKS = [
  { href: "/regions", label: "지역별 시험장" },
  { href: "/faq", label: "이용 안내" },
  { href: "/about", label: "데이터·서비스 소개" },
  { href: "/privacy", label: "개인정보 안내" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>{SITE_NAME}</strong>
        <p>공식 TOEIC 정보를 찾기 쉽게 연결하는 비공식 편의 도구입니다.</p>
      </div>
      <nav aria-label="서비스 안내">
        {FOOTER_LINKS.map((link) => (
          <Link href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
