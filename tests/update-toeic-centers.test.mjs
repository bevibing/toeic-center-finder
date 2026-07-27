import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  parseCenterCsv,
  runCenterRefresh,
  selectExamSchedules,
} from "../scripts/update-toeic-centers.mjs";

test("selectExamSchedules uses the first schedule for each exam day", () => {
  const schedules = [
    {
      exam_code: "EXAM_2026_04_26_SPECIAL",
      exam_day: "2026-04-26 00:00:00",
    },
    {
      exam_code: "EXAM_2026_04_26_REGULAR",
      exam_day: "2026-04-26 00:00:00",
    },
    {
      exam_code: "EXAM_2026_05_10_REGULAR",
      exam_day: "2026-05-10 00:00:00",
    },
  ];

  assert.deepEqual(selectExamSchedules(schedules), [
    {
      examDay: "2026-04-26",
      examCode: "EXAM_2026_04_26_SPECIAL",
    },
    {
      examDay: "2026-05-10",
      examCode: "EXAM_2026_05_10_REGULAR",
    },
  ]);
});

test("runCenterRefresh detects new centers, stale candidates, metadata changes, and manual review", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "toeic-centers-"));
  const csvPath = path.join(workspace, "toeic_centers.csv");
  const reportPath = path.join(workspace, "report.json");
  const statePath = path.join(workspace, "state.json");
  const landingArchivePath = path.join(workspace, "toeic-landings.json");

  await writeFile(
    csvPath,
    [
      "EXIST_001,37.5000,127.0000",
      "STALE_001,37.6000,127.1000",
    ].join("\n"),
    "utf8",
  );

  await writeFile(
    statePath,
    JSON.stringify(
      {
        version: 1,
        centers: [
          {
            centerCode: "EXIST_001",
            centerName: "기존 학교",
            address: "서울특별시 강남구 기존로 1",
            bigArea: "서울",
          },
          {
            centerCode: "STALE_001",
            centerName: "사라진 학교",
            address: "서울특별시 강남구 사라진로 2",
            bigArea: "서울",
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    landingArchivePath,
    JSON.stringify(
      {
        version: 1,
        generatedAt: "2026-03-16T00:00:00.000Z",
        source: {
          name: "한국TOEIC위원회 시험접수",
          url: "https://exam.toeic.co.kr/receipt/examSchList.php",
        },
        knownExamDates: ["2026-03-15"],
        entries: [
          {
            examDate: "2026-03-15",
            examCode: "EXPIRED_EXAM",
            region: "서울",
            updatedAt: "2026-03-01T00:00:00.000Z",
            centers: [],
          },
        ],
      },
      null,
      2,
    ),
    "utf8",
  );

  const schedules = [
    {
      exam_code: "EXAM_2026_04_26_SPECIAL",
      exam_day: "2026-04-26 00:00:00",
    },
    {
      exam_code: "EXAM_2026_04_26_REGULAR",
      exam_day: "2026-04-26 00:00:00",
    },
  ];

  const payloadByRequest = new Map([
    [
      "proc=getReceiptScheduleList&examCate=TOE",
      schedules,
    ],
    [
      "proc=getExamAreaInfo&examCate=TOE&sbGoodsType1=TOE&examCode=EXAM_2026_04_26_SPECIAL&bigArea=",
      [[{ big_area: "서울" }]],
    ],
    [
      "proc=getExamAreaInfo&examCate=TOE&sbGoodsType1=TOE&examCode=EXAM_2026_04_26_SPECIAL&bigArea=%EC%84%9C%EC%9A%B8",
      [
        null,
        null,
        [
          {
            center_code: "EXIST_001",
            center_name: "기존 학교 리뉴얼",
            address: "서울특별시 강남구 변경로 9",
          },
          {
            center_code: "NEW_001",
            center_name: "신규 학교",
            address: "서울특별시 강남구 신규로 3",
          },
          {
            center_code: "REVIEW_001",
            center_name: "검토 필요 학교",
            address: "서울특별시 강남구 검토로 4",
          },
        ],
      ],
    ],
    [
      "proc=getExamAreaInfo&examCate=TOE&sbGoodsType1=TOE&examCode=EXAM_2026_04_26_SPECIAL&bigArea=%EC%84%9C%EC%9A%B8&centerCode=NEW_001",
      [
        null,
        null,
        null,
        [
          {
            map_x: "37.5100",
            map_y: "127.0200",
          },
        ],
      ],
    ],
    [
      "proc=getExamAreaInfo&examCate=TOE&sbGoodsType1=TOE&examCode=EXAM_2026_04_26_SPECIAL&bigArea=%EC%84%9C%EC%9A%B8&centerCode=REVIEW_001",
      [
        null,
        null,
        null,
        [
          {
            map_x: "37.5200",
            map_y: "1270200",
            map_url_naver: "https://example.com/naver",
          },
        ],
      ],
    ],
  ]);

  const fetchImpl = async (_url, init) => {
    const body = String(init?.body ?? "");
    const payload = payloadByRequest.get(body);

    if (!payload) {
      return {
        ok: false,
        status: 404,
        async text() {
          return JSON.stringify({ error: body });
        },
      };
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(payload);
      },
    };
  };

  const refreshResult = await runCenterRefresh({
    fetchImpl,
    csvPath,
    reportPath,
    statePath,
    landingArchivePath,
    now: new Date("2026-04-01T00:00:00.000Z"),
    check: false,
    requestDelayMs: 0,
  });

  assert.equal(refreshResult.pendingReport.newCenters.length, 1);
  assert.equal(refreshResult.pendingReport.newCenters[0].centerCode, "NEW_001");
  assert.equal(refreshResult.pendingReport.changedMetadata.length, 1);
  assert.equal(refreshResult.pendingReport.changedMetadata[0].centerCode, "EXIST_001");
  assert.equal(refreshResult.pendingReport.manualReview.length, 1);
  assert.equal(refreshResult.pendingReport.manualReview[0].centerCode, "REVIEW_001");
  assert.equal(refreshResult.pendingReport.staleCenters.length, 1);
  assert.equal(refreshResult.pendingReport.staleCenters[0].centerCode, "STALE_001");
  assert.equal(refreshResult.report.newCenters.length, 0);

  const nextCsv = await readFile(csvPath, "utf8");
  const parsedCsv = parseCenterCsv(nextCsv);
  assert.ok(parsedCsv.has("NEW_001"));
  assert.equal(parsedCsv.get("NEW_001").latText, "37.5100");
  assert.equal(parsedCsv.has("REVIEW_001"), false);

  const nextReport = JSON.parse(await readFile(reportPath, "utf8"));
  assert.equal(nextReport.summary.newCenterCount, 0);

  const nextState = JSON.parse(await readFile(statePath, "utf8"));
  assert.equal(nextState.centers.some((center) => center.centerCode === "NEW_001"), true);

  const nextLandingArchive = JSON.parse(await readFile(landingArchivePath, "utf8"));
  assert.deepEqual(nextLandingArchive.knownExamDates, [
    "2026-03-15",
    "2026-04-26",
  ]);
  assert.equal(
    nextLandingArchive.entries.some(
      (entry) =>
        entry.examDate === "2026-03-15" &&
        entry.region === "서울" &&
        entry.examCode === "EXPIRED_EXAM",
    ),
    true,
  );
  assert.equal(
    nextLandingArchive.entries.some(
      (entry) =>
        entry.examDate === "2026-04-26" &&
        entry.region === "서울" &&
        entry.centers.some((center) => center.center_code === "NEW_001"),
    ),
    true,
  );

  const checkResult = await runCenterRefresh({
    fetchImpl,
    csvPath,
    reportPath,
    statePath,
    landingArchivePath,
    now: new Date("2026-04-01T00:00:00.000Z"),
    check: true,
    requestDelayMs: 0,
  });

  assert.equal(checkResult.changed, false);
});

test("runCenterRefresh check mode reports pending diffs without mutating files", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "toeic-centers-check-"));
  const csvPath = path.join(workspace, "toeic_centers.csv");
  const reportPath = path.join(workspace, "report.json");
  const statePath = path.join(workspace, "state.json");

  await mkdir(path.dirname(csvPath), { recursive: true });
  await writeFile(csvPath, "EXIST_001,37.5000,127.0000\n", "utf8");

  const fetchImpl = async () => ({
    ok: true,
    async text() {
      return JSON.stringify([]);
    },
  });

  const result = await runCenterRefresh({
    fetchImpl,
    csvPath,
    reportPath,
    statePath,
    check: true,
    requestDelayMs: 0,
  });

  assert.equal(result.changed, true);
  assert.equal(await readFile(csvPath, "utf8"), "EXIST_001,37.5000,127.0000\n");
});

test("runCenterRefresh retries on transient network errors and succeeds", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "toeic-centers-retry-"));
  const csvPath = path.join(workspace, "toeic_centers.csv");
  const reportPath = path.join(workspace, "report.json");
  const statePath = path.join(workspace, "state.json");

  await writeFile(csvPath, "", "utf8");

  let callCount = 0;
  const fetchImpl = async () => {
    callCount++;
    if (callCount === 1) {
      const error = new TypeError("fetch failed");
      error.cause = Object.assign(new Error("socket disconnected"), { code: "ECONNRESET" });
      throw error;
    }
    return {
      ok: true,
      async text() {
        return JSON.stringify([]);
      },
    };
  };

  await runCenterRefresh({
    fetchImpl,
    csvPath,
    reportPath,
    statePath,
    check: false,
    retryBaseDelayMs: 0,
    requestDelayMs: 0,
  });

  assert.equal(callCount, 2);
});

test("runCenterRefresh retries on retryable upstream responses and succeeds", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "toeic-centers-http-retry-"));
  const csvPath = path.join(workspace, "toeic_centers.csv");
  const reportPath = path.join(workspace, "report.json");
  const statePath = path.join(workspace, "state.json");

  await writeFile(csvPath, "", "utf8");

  let callCount = 0;
  const fetchImpl = async () => {
    callCount++;
    if (callCount === 1) {
      return {
        ok: false,
        status: 503,
        async text() {
          return "temporarily unavailable";
        },
      };
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify([]);
      },
    };
  };

  await runCenterRefresh({
    fetchImpl,
    csvPath,
    reportPath,
    statePath,
    check: false,
    retryBaseDelayMs: 0,
    requestDelayMs: 0,
  });

  assert.equal(callCount, 2);
});

test("runCenterRefresh waits between upstream requests when configured", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "toeic-centers-request-delay-"));
  const csvPath = path.join(workspace, "toeic_centers.csv");
  const reportPath = path.join(workspace, "report.json");
  const statePath = path.join(workspace, "state.json");

  await writeFile(csvPath, "", "utf8");

  const callTimes = [];
  const fetchImpl = async (_url, init) => {
    callTimes.push(Date.now());
    const body = String(init?.body ?? "");

    if (body === "proc=getReceiptScheduleList&examCate=TOE") {
      return {
        ok: true,
        status: 200,
        async text() {
          return JSON.stringify([
            {
              exam_code: "EXAM_2026_04_26_REGULAR",
              exam_day: "2026-04-26 00:00:00",
            },
          ]);
        },
      };
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify([[]]);
      },
    };
  };

  await runCenterRefresh({
    fetchImpl,
    csvPath,
    reportPath,
    statePath,
    check: false,
    requestDelayMs: 25,
    retryBaseDelayMs: 0,
  });

  assert.equal(callTimes.length, 2);
  assert.ok(callTimes[1] - callTimes[0] >= 20);
});

test("runCenterRefresh does not retry on non-transient errors", async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), "toeic-centers-no-retry-"));
  const csvPath = path.join(workspace, "toeic_centers.csv");
  const reportPath = path.join(workspace, "report.json");
  const statePath = path.join(workspace, "state.json");

  await writeFile(csvPath, "", "utf8");

  let callCount = 0;
  const fetchImpl = async () => {
    callCount++;
    throw new TypeError("unexpected error without transient code");
  };

  await assert.rejects(
    () =>
      runCenterRefresh({
        fetchImpl,
        csvPath,
        reportPath,
        statePath,
        check: false,
        retryBaseDelayMs: 0,
        requestDelayMs: 0,
      }),
    /TOEIC upstream fetch failed/u,
  );

  assert.equal(callCount, 1);
});
