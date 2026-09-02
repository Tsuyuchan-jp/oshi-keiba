import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { beforeAll, beforeEach } from "vitest";

const ADMIN_USER_ID = "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

beforeEach(async () => {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM member_operations"),
    env.DB.prepare("DELETE FROM payouts"),
    env.DB.prepare("DELETE FROM bets"),
    env.DB.prepare("DELETE FROM grants"),
    env.DB.prepare("DELETE FROM horses"),
    env.DB.prepare("DELETE FROM events"),
    env.DB.prepare("DELETE FROM admin_undo"),
    env.DB.prepare("DELETE FROM r2_pending_deletions"),
    env.DB.prepare("DELETE FROM users WHERE id <> ?").bind(ADMIN_USER_ID),
  ]);
  const objects = await env.SHOTS.list();
  if (objects.objects.length > 0) {
    await env.SHOTS.delete(objects.objects.map((object) => object.key));
  }
});
