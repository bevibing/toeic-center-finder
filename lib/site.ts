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
  /**
   * Keeps a page reachable and crawlable for users who arrive from bookmarks or
   * old links while removing it from the index (used for ended exam dates).
   */
  noindex?: boolean;
}

export const getSiteUrl = (): string => getConfiguredSiteUrl();

/**
 * Percent-encodes each path segment so structured-data URLs match the
 * canonical/og:url values Next.js emits for Hangul routes such as
 * `/regions/서울` -> `/regions/%EC%84%9C%EC%9A%B8`.
 */
export const buildAbsoluteUrl = (path = "/"): string => {
  const siteUrl = getSiteUrl();

  if (path === "/") {
    return siteUrl;
  }

  const encodeSegment = (segment: string): string => {
    if (!segment) {
      return segment;
    }

    try {
      // Decode first so an already-encoded segment is not double-encoded.
      return encodeURIComponent(decodeURIComponent(segment));
    } catch {
      return encodeURIComponent(segment);
    }
  };

  const encodedPath = path.split("/").map(encodeSegment).join("/");

  return `${siteUrl}${encodedPath}`;
};

export const buildPageMetadata = ({
  title,
  description,
  path = "/",
  keywords = [],
  noindex = false,
}: PageMetadataOptions): Metadata => ({
  metadataBase: new URL(getSiteUrl()),
  title,
  description,
  keywords: [...DEFAULT_KEYWORDS, ...keywords],
  applicationName: SITE_NAME,
  ...(noindex ? { robots: { index: false, follow: true } } : {}),
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
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "지역별 토익 시험장을 지도에서 확인하는 토익맵 화면 미리보기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.jpg"],
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

export const SITE_REPOSITORY_URL = "https://github.com/bevibing/toeic-center-finder";

export const buildOrganizationStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${getSiteUrl()}/#organization`,
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAME,
  url: getSiteUrl(),
  logo: `${getSiteUrl()}/logo512.png`,
  sameAs: [SITE_REPOSITORY_URL],
  description:
    "한국TOEIC위원회가 운영하는 공식 사이트가 아닌, 지역·시험일별 토익 시험장 정보를 정리해 제공하는 비공식 편의 도구입니다.",
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
  itemPaths,
}: {
  name: string;
  description: string;
  path: string;
  itemNames: string[];
  /** Parallel to `itemNames`; makes the list machine-navigable. */
  itemPaths?: string[];
}) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name,
  description,
  url: buildAbsoluteUrl(path),
  inLanguage: "ko-KR",
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: itemNames.length,
    itemListElement: itemNames.map((itemName, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: itemName,
      ...(itemPaths?.[index] ? { item: buildAbsoluteUrl(itemPaths[index]) } : {}),
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
