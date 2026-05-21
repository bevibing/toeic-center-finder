import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const appPort = process.env.PORT ?? "3000";
const mockPort = process.env.MOCK_UPSTREAM_PORT ?? "4010";
const upstreamUrl = `http://127.0.0.1:${mockPort}/receipt/centerMapProc.php`;

const mockServer = spawn(process.execPath, ["scripts/mock-toeic-upstream.mjs"], {
  stdio: "inherit",
  env: {
    ...process.env,
    MOCK_UPSTREAM_PORT: mockPort,
  },
});

const nextServer = spawn(
  npmCommand,
  ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", appPort],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: appPort,
      TOEIC_UPSTREAM_BASE_URL: upstreamUrl,
      TOEIC_TODAY_OVERRIDE: process.env.TOEIC_TODAY_OVERRIDE ?? "2026-04-01",
      TOEIC_PROXY_TIMEOUT_MS: process.env.TOEIC_PROXY_TIMEOUT_MS ?? "1500",
      NEXT_PUBLIC_TOEIC_CENTER_COORDINATES_PATH:
        process.env.NEXT_PUBLIC_TOEIC_CENTER_COORDINATES_PATH ??
        "/toeic_centers.e2e.csv",
    },
  },
);

const shutdown = (exitCode = 0) => {
  mockServer.kill("SIGTERM");
  nextServer.kill("SIGTERM");
  process.exit(exitCode);
};

mockServer.on("exit", (code) => {
  if (code !== 0) {
    shutdown(code ?? 1);
  }
});

nextServer.on("exit", (code) => {
  shutdown(code ?? 0);
});

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
