/**
 * 結合テスト用: node:sqlite を D1Database 互換で包む（メモリ・migrations 適用）
 */

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

type StmtMeta = {
  sql: string;
  values: unknown[];
};

function toD1Result<T = unknown>(changes = 0, lastRowId = 0): D1Result<T> {
  return {
    success: true,
    meta: {
      duration: 0,
      size_after: 0,
      rows_read: 0,
      rows_written: changes,
      last_row_id: lastRowId,
      changed_db: changes > 0,
      changes,
    },
    results: [],
  };
}

function wrapPrepared(
  db: DatabaseSync,
  sql: string,
  values: unknown[] = [],
): D1PreparedStatement {
  const meta: StmtMeta = { sql, values };
  const self: D1PreparedStatement = {
    bind(...next: unknown[]) {
      return wrapPrepared(db, sql, next);
    },
    first<T = unknown>() {
      const row = db.prepare(meta.sql).get(...(meta.values as never[]));
      return Promise.resolve((row as T | undefined) ?? null);
    },
    all<T = unknown>() {
      const results = db.prepare(meta.sql).all(...(meta.values as never[])) as T[];
      return Promise.resolve({
        ...toD1Result(0, 0),
        results,
      });
    },
    run() {
      const info = db.prepare(meta.sql).run(...(meta.values as never[]));
      return Promise.resolve(
        toD1Result(Number(info.changes), Number(info.lastInsertRowid)),
      );
    },
    raw() {
      throw new Error("testD1: raw() は未実装");
    },
  };
  // batch 実行用に内部メタをぶら下げる
  (self as unknown as { __meta: StmtMeta }).__meta = meta;
  return self;
}

function applyMigrations(db: DatabaseSync): void {
  const dir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d+.*\.sql$/i.test(f))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    db.exec(sql);
  }
}

/** 空のメモリ D1（全 migration 適用済み） */
export function createMemoryD1(): D1Database {
  const db = new DatabaseSync(":memory:");
  applyMigrations(db);

  const api: D1Database = {
    prepare(query: string) {
      return wrapPrepared(db, query);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]) {
      const out: D1Result<T>[] = [];
      db.exec("BEGIN");
      try {
        for (const stmt of statements) {
          const m = (stmt as unknown as { __meta?: StmtMeta }).__meta;
          if (!m) throw new Error("testD1: batch に未対応の statement");
          const info = db.prepare(m.sql).run(...(m.values as never[]));
          out.push(
            toD1Result(
              Number(info.changes),
              Number(info.lastInsertRowid),
            ) as D1Result<T>,
          );
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return out;
    },
    async exec(query: string): Promise<D1ExecResult> {
      db.exec(query);
      return { count: 0, duration: 0 };
    },
    async dump() {
      throw new Error("testD1: dump is not supported");
    },
    withSession() {
      throw new Error("testD1: withSession は未実装");
    },
  };
  return api;
}
