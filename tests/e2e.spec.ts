import { expect, test } from "@playwright/test";

test.describe("TOEIC center finder", () => {
  test("loads schedules, sorts centers by current location, and syncs list/map selection", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({
      latitude: 37.5412163,
      longitude: 127.1497531,
    });

    await page.goto("/");

    await expect(page).toHaveTitle(/내 근처 토익 시험장 찾기/);
    await expect(page.getByTestId("leaflet-map")).toBeVisible();

    await page.getByLabel("시험 일정").selectOption("2026-04-26");
    await page.getByLabel("위치").selectOption("서울");

    await expect(page.getByTestId("location-item-PBT_004")).toBeVisible();
    await expect(page.getByTestId("location-item-PBT_015")).toBeVisible();
    await expect(page.getByTestId("location-item-MISSING_COORD_001")).toBeVisible();

    await page.getByRole("button", { name: "현재 위치 사용" }).click();

    const firstLocation = page.locator('[data-testid^="location-item-"]').first();
    await expect(firstLocation).toContainText("서울 송파 테스트센터");
    await expect(firstLocation).toContainText("직선 거리:");

    await page.getByTestId("location-item-PBT_015").click();
    await expect(page.getByTestId("selected-location-name")).toHaveText(
      "서울 강북 & 테스트센터",
    );
    await expect(page.getByTestId("map-center")).toContainText("37.6492881");

    const mapMarkerButton = page.getByRole("button", {
      name: "서울 송파 테스트센터",
      exact: true,
    });

    await expect(mapMarkerButton).toHaveCount(1);
    await mapMarkerButton.dispatchEvent("click");

    await expect(page.getByTestId("selected-location-name")).toHaveText(
      "서울 송파 테스트센터",
    );
    await expect(page.getByTestId("map-center")).toContainText("37.5412163");

    await expect(
      page.getByRole("button", { name: "좌표 없는 시험장", exact: true }),
    ).toHaveCount(0);
  });

  test("shows a geolocation error when permission is denied", async ({ page, context }) => {
    await context.clearPermissions();
    await page.goto("/");

    await page.getByLabel("시험 일정").selectOption("2026-04-26");
    await page.getByLabel("위치").selectOption("서울");
    await page.getByRole("button", { name: "현재 위치 사용" }).click();

    await expect(page.getByTestId("geolocation-error")).toContainText(
      "위치 정보를 가져오는 데 실패했습니다.",
    );
  });

  test("shows a center loading error when upstream times out", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("시험 일정").selectOption("2026-04-26");
    await page.getByLabel("위치").selectOption("세종");

    await expect(page.getByTestId("app-error")).toContainText(
      "시험 센터 정보를 불러오는 데 실패했습니다.",
    );
  });

  test("serves metadata assets and removes the legacy subpath dependency", async ({
    request,
  }) => {
    const homeResponse = await request.get("/");
    expect(homeResponse.ok()).toBeTruthy();
    await expect(homeResponse.text()).resolves.not.toContain("/location-map-app");
    await expect(homeResponse.text()).resolves.toContain(
      'rel="canonical" href="https://toeic.roundtable02.com"',
    );

    const robotsResponse = await request.get("/robots.txt");
    expect(robotsResponse.ok()).toBeTruthy();
    await expect(robotsResponse.text()).resolves.toContain("Sitemap:");
    await expect(robotsResponse.text()).resolves.toContain("Host: https://toeic.roundtable02.com");

    const sitemapResponse = await request.get("/sitemap.xml");
    expect(sitemapResponse.ok()).toBeTruthy();
    await expect(sitemapResponse.text()).resolves.toContain("<loc>");
    await expect(sitemapResponse.text()).resolves.toContain(
      "<loc>https://toeic.roundtable02.com/regions</loc>",
    );

    const ogImageResponse = await request.get("/img.png");
    expect(ogImageResponse.ok()).toBeTruthy();

    const legacyResponse = await request.get("/location-map-app/");
    expect(legacyResponse.status()).toBe(404);
  });

  test("serves crawlable region landing pages with SSR content", async ({ page, request }) => {
    const regionResponse = await request.get("/regions/%EC%84%9C%EC%9A%B8");
    expect(regionResponse.ok()).toBeTruthy();
    await expect(regionResponse.text()).resolves.toContain("서울 토익 시험장 찾기");
    await expect(regionResponse.text()).resolves.toContain("공식 TOEIC 시험장 조회 기반");

    const dateResponse = await request.get("/regions/%EC%84%9C%EC%9A%B8/dates/2026-04-26");
    expect(dateResponse.ok()).toBeTruthy();
    const dateHtml = await dateResponse.text();
    expect(dateHtml).toContain("서울 송파 테스트센터");
    expect(dateHtml).toContain("서울특별시 강동구 성내로 13");
    expect(dateHtml).toContain(
      'rel="canonical" href="https://toeic.roundtable02.com/regions/%EC%84%9C%EC%9A%B8/dates/2026-04-26"',
    );
    expect(dateHtml).toContain('"@type":"Place"');
    expect(dateHtml).toContain('"dateModified"');
    expect(dateHtml).not.toContain('"@type":"FAQPage"');

    await page.goto("/regions/%EC%84%9C%EC%9A%B8/dates/2026-04-26");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "2026-04-26 서울 토익 시험장",
    );
    await expect(page.getByTestId("finder-priority")).toBeVisible();
    await expect(page.getByTestId("leaflet-map")).toBeVisible();
    await expect(page.getByLabel("시험 일정")).toHaveValue("2026-04-26");
    await expect(page.getByLabel("위치")).toHaveValue("서울");
    await expect(page.getByTestId("location-item-PBT_004")).toBeVisible();

    const finderBox = await page.getByTestId("finder-priority").boundingBox();
    const summaryBox = await page
      .getByRole("heading", { name: "2026-04-26 서울 시험장 정보" })
      .boundingBox();
    expect(finderBox?.y).toBeLessThan(summaryBox?.y ?? Number.POSITIVE_INFINITY);

    await page.goto("/regions/%EC%84%9C%EC%9A%B8");
    await expect(page.getByTestId("finder-priority")).toBeVisible();
    await expect(page.getByTestId("leaflet-map")).toBeVisible();
    await expect(page.getByLabel("시험 일정")).toHaveValue("2026-04-26");
    await expect(page.getByLabel("위치")).toHaveValue("서울");

    const regionFinderBox = await page.getByTestId("finder-priority").boundingBox();
    const scheduleTableBox = await page
      .getByRole("heading", { name: "시험일별 서울 토익 시험장" })
      .boundingBox();
    expect(regionFinderBox?.y).toBeLessThan(
      scheduleTableBox?.y ?? Number.POSITIVE_INFINITY,
    );
    await expect(
      page.getByRole("heading", { name: "서울 토익 시험장은 어디서 확인하나요?" }),
    ).toHaveCount(0);
  });

  test("keeps an expired exam landing useful and sends visitors to the next map", async ({
    page,
    request,
  }) => {
    const expiredResponse = await request.get(
      "/regions/%EC%84%9C%EC%9A%B8/dates/2026-03-15",
    );
    expect(expiredResponse.ok()).toBeTruthy();

    const expiredHtml = await expiredResponse.text();
    expect(expiredHtml).toContain("종료된 시험일");
    expect(expiredHtml).toContain("다음 시험장 지도");
    expect(expiredHtml).not.toContain('"@type":"FAQPage"');

    await page.goto("/regions/%EC%84%9C%EC%9A%B8/dates/2026-03-15");
    await expect(page.getByTestId("leaflet-map")).toBeVisible();
    await expect(page.getByLabel("시험 일정")).toHaveValue("2026-04-26");
    await expect(page.getByLabel("위치")).toHaveValue("서울");
    await expect(page.getByTestId("location-item-PBT_004")).toBeVisible();
  });

  test("shows the map before controls and center cards on mobile landing pages", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/regions/%EC%84%9C%EC%9A%B8/dates/2026-04-26");
    await expect(page.getByTestId("leaflet-map")).toBeVisible();

    const mapBox = await page.getByTestId("leaflet-map").boundingBox();
    const finderHeadingBox = await page
      .getByRole("heading", { name: "내 근처 토익 시험장 찾기" })
      .boundingBox();

    expect(mapBox?.height).toBeGreaterThanOrEqual(300);
    expect(mapBox?.y).toBeLessThan(
      finderHeadingBox?.y ?? Number.POSITIVE_INFINITY,
    );
  });

  test("publishes durable discovery, source, and trust signals", async ({ request }) => {
    const homeHtml = await (await request.get("/")).text();
    expect(homeHtml).toContain('href="/regions"');
    expect(homeHtml).toContain('href="/faq"');
    expect(homeHtml).toContain('href="/about"');
    expect(homeHtml).toContain('href="/privacy"');
    expect(homeHtml).toContain('"alternateName":"TOEIC Center Map"');

    const faqHtml = await (await request.get("/faq")).text();
    expect(faqHtml).toContain("TOEIC 공식 사이트");
    expect(faqHtml).toContain("시험 시행일로부터 2년");
    expect(faqHtml).not.toContain("발표일로부터 2년");
    expect(faqHtml).not.toContain("정기시험 응시료는 약");

    const aboutResponse = await request.get("/about");
    expect(aboutResponse.ok()).toBeTruthy();
    await expect(aboutResponse.text()).resolves.toContain("비공식 편의 도구");

    const privacyResponse = await request.get("/privacy");
    expect(privacyResponse.ok()).toBeTruthy();
    await expect(privacyResponse.text()).resolves.toContain(
      "현재 위치는 브라우저 안에서만",
    );

    const sitemapHtml = await (await request.get("/sitemap.xml")).text();
    expect(sitemapHtml).toContain("<loc>https://toeic.roundtable02.com/about</loc>");
    expect(sitemapHtml).toContain("<loc>https://toeic.roundtable02.com/privacy</loc>");
    expect(sitemapHtml).toContain(
      "<loc>https://toeic.roundtable02.com/regions/%EC%84%9C%EC%9A%B8/dates/2026-03-15</loc>",
    );
    expect(sitemapHtml).not.toContain("<lastmod>2026-04-26");
  });

  test("preserves the API contract through Next route handlers", async ({ request }) => {
    const healthResponse = await request.get("/api/health");
    expect(healthResponse.ok()).toBeTruthy();
    await expect(healthResponse.json()).resolves.toMatchObject({
      status: "ok",
    });

    const schedulesResponse = await request.get("/api/toeic");
    expect(schedulesResponse.ok()).toBeTruthy();
    expect(schedulesResponse.headers()["cache-control"]).toContain("s-maxage=3600");
    await expect(schedulesResponse.json()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exam_code: "EXAM_2026_04_26",
        }),
      ]),
    );

    const missingParamsResponse = await request.get("/api/toeic/centers");
    expect(missingParamsResponse.status()).toBe(400);

    const successCentersResponse = await request.get(
      "/api/toeic/centers?examCode=EXAM_2026_04_26&bigArea=서울",
    );
    expect(successCentersResponse.ok()).toBeTruthy();
    expect(successCentersResponse.headers()["cache-control"]).toContain(
      "s-maxage=86400",
    );
    await expect(successCentersResponse.json()).resolves.toEqual(
      expect.arrayContaining([
        null,
        null,
        expect.arrayContaining([
          expect.objectContaining({
            center_code: "PBT_004",
          }),
        ]),
      ]),
    );

    const noDataResponse = await request.get(
      "/api/toeic/centers?examCode=EXAM_2026_04_26&bigArea=제주",
    );
    expect(noDataResponse.status()).toBe(404);

    const upstreamFailureResponse = await request.get(
      "/api/toeic/centers?examCode=FAIL_500&bigArea=서울",
    );
    expect(upstreamFailureResponse.status()).toBe(500);

    const timeoutResponse = await request.get(
      "/api/toeic/centers?examCode=EXAM_2026_04_26&bigArea=세종",
    );
    expect(timeoutResponse.status()).toBe(500);
    await expect(timeoutResponse.json()).resolves.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
    });
  });
});
