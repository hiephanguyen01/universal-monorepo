import { execFileSync } from "node:child_process";

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5433/app_test?schema=public";

export default function setup(): void {
  const databaseUrl =
    process.env.TEST_DATABASE_URL ??
    DEFAULT_TEST_DATABASE_URL;

  process.env.TEST_DATABASE_URL =
    databaseUrl;

  const pnpmCommand =
    process.platform === "win32"
      ? "pnpm.cmd"
      : "pnpm";

  execFileSync(
    pnpmCommand,
    [
      "exec",
      "prisma",
      "migrate",
      "deploy",
      "--config",
      "prisma7.config.ts",
    ],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    },
  );
}
