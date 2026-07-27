import type { Metadata } from "next";
import { getConfiguredSiteUrl } from "@/lib/site-config";
import type { ApiCenterInfo } from "@/lib/types";

export const SITE_NAME = "토익맵";
export const SITE_ALTERNATE_NAME = "TOEIC Center Map";
const DEFAULT_DESCRIPTION =
  "지역별 토익 시험장과 시험 일정을 한 번에 확인하고, 현재 위치 기준으로 가까운 시험장을 빠르게 찾을 수 있습니다.";
const DEFAULT_KEYWORDS = [
  "토익 시험장",
  "토익 고사장",
  "지역별 토익 시험장",
  "시험일별 토익 시험장",
  "토익 시험 일정",
  "토익 시험장 찾기",
];

export interface BreadcrumbStructuredDataItem {
  name: string;
  path: string;
}

interface PageMetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}

export const getSiteUrl = (): string => getConfiguredSiteUrl();

export const buildAbsoluteUrl = (path = "/"): string => {
  const siteUrl = getSiteUrl();
  return path === "/" ? siteUrl : `${siteUrl}${path}`;
};

export const buildPageMetadata = ({
  title,
  description,
  path = "/",
  keywords = [],
}: PageMetadataOptions): Metadata => ({
  metadataBase: new URL(getSiteUrl()),
  title,
  description,
  keywords: [...DEFAULT_KEYWORDS, ...keywords],
  applicationName: SITE_NAME,
  alternates: {
    canonical: path,
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: buildAbsoluteUrl(path),
    siteName: SITE_NAME,
    locale: "ko_KR",
    images: [
      {
        url: "/img.png",
        width: 2942,
        height: 1548,
        alt: "토익 시험장 찾기 미리보기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/img.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
});

export const buildMetadata = (): Metadata =>
  ({
    ...buildPageMetadata({
      title: "내 근처 토익 시험장 찾기",
      description: DEFAULT_DESCRIPTION,
      path: "/",
      keywords: ["내 근처 토익", "TOEIC center"],
    }),
    verification: {
      other: {
        "naver-site-verification": "e3036bd7f9dd301fd4218e4b348b031efc9ead06",
      },
    },
  });

export const buildWebsiteStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: getSiteUrl(),
  description: DEFAULT_DESCRIPTION,
  inLanguage: "ko-KR",
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
  },
});

export const buildBreadcrumbStructuredData = (
  items: BreadcrumbStructuredDataItem[],
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: buildAbsoluteUrl(item.path),
  })),
});

export const buildCollectionPageStructuredData = ({
  name,
  description,
  path,
  itemNames,
}: {
  name: string;
  description: string;
  path: string;
  itemNames: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: buildAbsoluteUrl(path),
  inLanguage: "ko-KR",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: itemNames.map((itemName, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: itemName,
    })),
  },
});

export const buildFaqStructuredData = (
  items: Array<{ question: string; answer: string }>,
) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

export const buildCenterCollectionStructuredData = ({
  name,
  description,
  path,
  centers,
}: {
  name: string;
  description: string;
  path: string;
  centers: ApiCenterInfo[];
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: buildAbsoluteUrl(path),
  inLanguage: "ko-KR",
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: centers.length,
    itemListElement: centers.map((center, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        "@id": `${buildAbsoluteUrl(path)}#center-${encodeURIComponent(center.center_code)}`,
        name: center.center_name,
        address: {
          "@type": "PostalAddress",
          streetAddress: center.address,
          addressCountry: "KR",
        },
      },
    })),
  },
});

export const buildWebPageStructuredData = ({
  name,
  description,
  path,
  dateModified,
  sourceUrl,
}: {
  name: string;
  description: string;
  path: string;
  dateModified: string;
  sourceUrl: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  name,
  description,
  url: buildAbsoluteUrl(path),
  inLanguage: "ko-KR",
  dateModified,
  isBasedOn: sourceUrl,
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: getSiteUrl(),
  },
});
