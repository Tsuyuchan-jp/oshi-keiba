import { env } from "cloudflare:workers";
import { applyD1Migrations } from "cloudflare:test";
import { describe, expect, test } from "vitest";

const EXPECTED_MIGRATIONS = [
  "0001_init.sql",
  "0002_trial_bets.sql",
  "0003_admin_undo.sql",
  "0004_enabled_kinds.sql",
  "0005_current_event.sql",
  "0006_horse_uma_runner_shot.sql",
  "0007_event_score_setup.sql",
  "0008_horse_score_input.sql",
  "0009_strategic_skills.sql",
  "0010_horse_uma_dress.sql",
  "0011_horse_paddock_profile.sql",
  "0012_member_operations.sql",
  "0013_member_soft_delete.sql",
  "0014_admin_identity.sql",
  "0015_r2_pending_deletions.sql",
  "0016_analysis_snapshots.sql",
  "0017_analysis_log_versions.sql",
  "0018_event_settlements.sql",
  "0019_event_paddock_comments.sql",
  "0020_pre_race_assessments.sql",
];

async function tableNames(db: D1Database): Promise<string[]> {
  const rows = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  ).all<{ name: string }>();
  return rows.results.map((row) => row.name);
}

describe("D1マイグレーション", () => {
  test("空のD1へ全20本を適用すると本番用スキーマと初期データが揃う", async () => {
    expect(env.TEST_MIGRATIONS.map((migration) => migration.name)).toEqual(EXPECTED_MIGRATIONS);
    await applyD1Migrations(env.MIGRATION_DB, env.TEST_MIGRATIONS);

    expect(await tableNames(env.MIGRATION_DB)).toEqual(expect.arrayContaining([
      "admin_undo",
      "analysis_snapshot_odds",
      "analysis_snapshots",
      "analysis_log_failures",
      "bets",
      "events",
      "event_settlements",
      "grants",
      "horses",
      "member_operations",
      "payouts",
      "r2_pending_deletions",
      "strategic_skill_dismissed",
      "strategic_skills",
      "users",
    ]));
    const admin = await env.MIGRATION_DB.prepare(
      "SELECT id, role, deleted_at FROM users WHERE id = ?",
    ).bind("9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44").first<{
      id: string;
      role: string;
      deleted_at: number | null;
    }>();
    expect(admin).toEqual({
      id: "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44",
      role: "admin",
      deleted_at: null,
    });
    expect((await env.MIGRATION_DB.prepare("SELECT COUNT(*) AS n FROM strategic_skills")
      .first<{ n: number }>())?.n).toBe(4);
    expect(await env.MIGRATION_DB.prepare("PRAGMA foreign_key_check").all()).toMatchObject({
      results: [],
    });
    expect((await env.MIGRATION_DB.prepare("PRAGMA quick_check").first<{ quick_check: string }>())
      ?.quick_check).toBe("ok");
  });

  test("初期版の開催・会員・単勝票を保持したまま最新版へ段階更新できる", async () => {
    const db = env.MIGRATION_UPGRADE_DB;
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(0, 1));
    const now = Date.now();
    await db.prepare(
      `INSERT INTO events (
        id, title, status, grant_g, bet_unit, seed_pool_s, pull_e, takeout_d,
        w_time_floor, w_time_exp, created_at, payouts_applied,
        published_at
      ) VALUES ('legacy-event', '旧開催', 'published', 3000, 100, 500, 1000, .2, .1, 1.5, ?, 1, ?)`,
    ).bind(now, now).run();
    await db.prepare(
      "INSERT INTO users (id, display_name, role, balance, created_at) VALUES ('legacy-user', '旧会員', 'member', 2500, ?)",
    ).bind(now).run();
    await db.prepare(
      `INSERT INTO horses (
        id, event_id, name, strength, scratched, finish_place, sort_order, created_at
      ) VALUES ('legacy-horse', 'legacy-event', '旧出走', 10, 0, 1, 1, ?)`,
    ).bind(now).run();
    await db.prepare(
      `INSERT INTO bets (
        id, event_id, user_id, horse_id, amount, refunded, created_at
      ) VALUES ('legacy-bet', 'legacy-event', 'legacy-user', 'legacy-horse', 500, 0, ?)`,
    ).bind(now).run();
    await db.prepare(
      `INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at)
       VALUES ('legacy-payout', 'legacy-event', 'legacy-user', 'legacy-bet', 400, 'win', ?)`,
    ).bind(now).run();

    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(1, 5));
    expect((await db.prepare(
      "SELECT is_current FROM events WHERE id = 'legacy-event'",
    ).first<{ is_current: number }>())?.is_current).toBe(1);
    await applyD1Migrations(db, env.TEST_MIGRATIONS.slice(5));

    expect(await db.prepare(
      "SELECT title, enabled_kinds, is_current, score_setup, paddock_comments_enabled FROM events WHERE id = 'legacy-event'",
    ).first()).toEqual({
      title: "旧開催",
      enabled_kinds: "win,umaren,umatan,sanrenpuku,sanrentan",
      is_current: 1,
      score_setup: null,
      paddock_comments_enabled: 0,
    });
    expect(await db.prepare(
      `SELECT kind, selection_key, horse_1, horse_2, horse_3, operation_id
       FROM bets WHERE id = 'legacy-bet'`,
    ).first()).toEqual({
      kind: "win",
      selection_key: "legacy-horse",
      horse_1: "legacy-horse",
      horse_2: null,
      horse_3: null,
      operation_id: null,
    });
    expect(await db.prepare(
      "SELECT display_name, role, balance, deleted_at FROM users WHERE id = 'legacy-user'",
    ).first()).toEqual({
      display_name: "旧会員",
      role: "member",
      balance: 2500,
      deleted_at: null,
    });
    expect((await db.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE role = 'admin'",
    ).first<{ n: number }>())?.n).toBe(1);
    expect(await db.prepare(
      `SELECT bet_total, payout_total, retained_amount, source
       FROM event_settlements WHERE event_id = 'legacy-event'`,
    ).first()).toEqual({
      bet_total: 500,
      payout_total: 400,
      retained_amount: 100,
      source: "backfill",
    });
    expect((await db.prepare(
      "SELECT balance FROM users WHERE role = 'admin'",
    ).first<{ balance: number }>())?.balance).toBe(100);
    expect(await db.prepare("PRAGMA foreign_key_check").all()).toMatchObject({
      results: [],
    });
  });
});
