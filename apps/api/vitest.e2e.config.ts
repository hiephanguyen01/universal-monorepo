import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/app_test?schema=public";

process.env.TEST_DATABASE_URL =
  testDatabaseUrl;

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  testDatabaseUrl;

process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ??
  "e2e-access-secret-value";

process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  "e2e-refresh-secret-value";

process.env.WEB_ORIGIN =
  process.env.WEB_ORIGIN ??
  "http://localhost:3000";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(
        __dirname,
        "./src",
      ),
    },
  },

  test: {
    globals: true,
    environment: "node",
    include: [
      "test/e2e/**/*.e2e.spec.ts",
    ],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
    globalSetup: [
      "./test/integration/global-setup.ts",
    ],
  },
});
