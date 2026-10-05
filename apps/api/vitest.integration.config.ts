import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

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
