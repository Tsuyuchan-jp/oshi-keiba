/// <reference types="@cloudflare/vitest-plugin/types" />

declare namespace Cloudflare {
  interface Env {
    ADMIN_USER_ID: string;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
