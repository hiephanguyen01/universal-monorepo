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
    include: ["test/**/*.spec.ts"],
    exclude: [
      "test/integration/**/*.int.spec.ts",
      "test/e2e/**/*.e2e.spec.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: [
        "text",
        "json-summary",
      ],
      reportsDirectory:
        "coverage",
      include: [
        "src/modules/**/application/use-cases/**/*.ts",
        "src/modules/**/application/policies/**/*.ts",
        "src/modules/**/application/mappers/**/*.ts",
        "src/modules/**/domain/entities/**/*.ts",
        "src/modules/**/domain/value-objects/**/*.ts",
      ],

      thresholds: {
        statements:
          90,

        branches:
          85,

        functions:
          90,

        lines:
          90,
      },
    },
  },
});
