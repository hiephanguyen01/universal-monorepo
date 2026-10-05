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
  "integration-access-secret";

process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  "integration-refresh-secret";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: [
      "test/integration/**/*.int.spec.ts",
    ],
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 30_000,
    globalSetup: [
      "./test/integration/global-setup.ts",
    ],
  },
});
