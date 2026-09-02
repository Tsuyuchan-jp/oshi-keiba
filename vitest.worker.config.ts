import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const ADMIN_USER_ID = "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44";

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      main: "./src/index.ts",
      miniflare: {
        compatibilityDate: "2026-08-21",
        d1Databases: ["DB"],
        r2Buckets: ["SHOTS"],
        bindings: {
          ADMIN_PASSWORD: "worker-test-admin-password",
          ADMIN_USER_ID,
          MEMBER_PASSWORD: "worker-test-member-password",
          SESSION_SECRET: "worker-test-session-secret-with-sufficient-length",
          TEST_MIGRATIONS: await readD1Migrations("./migrations"),
        },
      },
    })),
  ],
  test: {
    include: ["tests/worker/**/*.test.ts"],
    setupFiles: ["./tests/worker/setup.ts"],
  },
});
