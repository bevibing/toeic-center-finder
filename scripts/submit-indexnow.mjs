#!/usr/bin/env node
/**
 * Submits the sitemap's URLs to IndexNow so Bing, Naver and Yandex learn about
 * new exam-date pages without waiting for a crawl cycle. Google does not
 * participate in IndexNow; it keeps using sitemap.xml.
 *
 * Usage: node scripts/submit-indexnow.mjs [--dry-run]
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://toeic.roundtable02.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "77bf232e5a04e4033aa3f13342361f3e";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
const MAX_URLS_PER_REQUEST = 10000;

const isDryRun = process.argv.includes("--dry-run");

const fetchSitemapUrls = async () => {
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  const response = await fetch(sitemapUrl, {
    headers: { "user-agent": "toeic-map-indexnow/1.0" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sitemapUrl}: HTTP ${response.status}`);
  }

  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());

  if (urls.length === 0) {
    throw new Error(`No <loc> entries found in ${sitemapUrl}`);
  }

  return urls;
};

const submit = async (urlList) => {
  const host = new URL(SITE_URL).host;
  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  // IndexNow answers 200 (accepted) or 202 (accepted, key validation pending).
  if (!response.ok && response.status !== 202) {
    throw new Error(
      `IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`,
    );
  }

  return response.status;
};

const main = async () => {
  const urls = await fetchSitemapUrls();

  if (urls.length > MAX_URLS_PER_REQUEST) {
    throw new Error(
      `Sitemap holds ${urls.length} URLs, above the ${MAX_URLS_PER_REQUEST} per-request limit.`,
    );
  }

  if (isDryRun) {
    console.log(
      JSON.stringify({ mode: "dry-run", host: new URL(SITE_URL).host, urlCount: urls.length }, null, 2),
    );
    return;
  }

  const status = await submit(urls);
  console.log(JSON.stringify({ mode: "submit", status, urlCount: urls.length }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
