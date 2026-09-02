/// <reference types="@cloudflare/vitest-plugin/types" />

declare namespace Cloudflare {
  interface Env {
    ADMIN_USER_ID: string;
    MIGRATION_DB: D1Database;
    MIGRATION_UPGRADE_DB: D1Database;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
