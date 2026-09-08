/** 開催後の調整に使う、投票中ボードの集計スナップショットとCSV出力。 */

import { formatSelectionLabel, parseEnabledKinds, type BetKind } from "./bets";
import { IMPUTED_LAMBDA } from "./odds";
import { buildBoard, numberByHorseId } from "./storeBoard";
import { getEventById } from "./storeEvent";
import { listActiveBets, listHorses } from "./storeRead";
import type { Board, EventRow, HorseRow } from "./storeTypes";

export type AnalysisCause = "voting_open" | "bet" | "redo" | "scratch" | "interval" | "close";

/** 式の意味を変えるときだけ上げる。値だけの変更では上げない。 */
export const ANALYSIS_FORMULA_VERSION = "odds-v2";
/** CSV列の意味・構造を変えるときだけ上げる。 */
export const ANALYSIS_SCHEMA_VERSION = "analysis-log-v1";

export type AnalysisSnapshotRow = {
  id: number;
  event_id: string;
  captured_at: number;
  cause: AnalysisCause;
  seed_pool_s: number;
  pull_e: number;
  takeout_d: number;
  w_time_floor: number;
  w_time_exp: number;
  lambda: number;
  formula_version: string;
  schema_version: string;
  w_time: number;
  w_volume: number;
  w: number;
  win_real_total: number;
  exotic_real_total: number;
  tv: number;
  joined_count: number;
  bettor_count: number;
  active_bet_count: number;
  live_horse_count: number;
};

type AnalysisOddsRow = {
  snapshot_id: number;
  kind: BetKind;
  selection_key: string;
  selection_label: string;
  horse_1: string;
  horse_2: string | null;
  horse_3: string | null;
  real: number;
  shown_odds: number | null;
  seed: number | null;
  imputed: number | null;
  display: number | null;
  is_scratched: number;
};

export type AnalysisEventOption = Pick<EventRow, "id" | "title" | "status" | "created_at" | "is_current">;

export type AnalysisFailureRow = {
  id: number;
  event_id: string | null;
  occurred_at: number;
  cause: AnalysisCause;
  message: string;
};

export function analysisCauseLabel(cause: AnalysisCause): string {
  return ({
    voting_open: "投票開始",
    bet: "投票確定",
    redo: "やり直し",
    scratch: "出走取消",
    interval: "5分記録",
    close: "締切",
  })[cause];
}

async function countSnapshotMembers(db: D1Database, eventId: string): Promise<{
  joined: number;
  bettors: number;
  activeBets: number;
}> {
  const [joined, bettors, activeBets] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM grants WHERE event_id = ?").bind(eventId).first<{ n: number }>(),
    db.prepare("SELECT COUNT(DISTINCT user_id) AS n FROM bets WHERE event_id = ?").bind(eventId).first<{ n: number }>(),
    db.prepare("SELECT COUNT(*) AS n FROM bets WHERE event_id = ? AND refunded = 0").bind(eventId).first<{ n: number }>(),
  ]);
  return { joined: joined?.n ?? 0, bettors: bettors?.n ?? 0, activeBets: activeBets?.n ?? 0 };
}

function oddsRows(board: Board, snapshotId: number): AnalysisOddsRow[] {
  const nums = numberByHorseId(board);
  const votingLike = board.event.status === "voting" || board.event.status === "setup";
  const rows: AnalysisOddsRow[] = [];
  for (const kind of parseEnabledKinds(board.event.enabled_kinds)) {
    if (kind === "win") {
      for (const h of board.horses) {
        if (h.horse.scratched) continue;
        rows.push({
          snapshot_id: snapshotId,
          kind,
          selection_key: h.horse.id,
          selection_label: String(h.number),
          horse_1: h.horse.id,
          horse_2: null,
          horse_3: null,
          real: h.real,
          shown_odds: votingLike ? h.referenceOdds : h.confirmedOdds,
          seed: h.seed,
          imputed: h.imputed,
          display: h.display,
          is_scratched: 0,
        });
      }
      continue;
    }
    const pool = board.pools.find((p) => p.kind === kind);
    for (const combo of pool?.combos ?? []) {
      rows.push({
        snapshot_id: snapshotId,
        kind,
        selection_key: combo.selection_key,
        selection_label: formatSelectionLabel(kind, combo.horse_1, combo.horse_2, combo.horse_3, nums),
        horse_1: combo.horse_1,
        horse_2: combo.horse_2,
        horse_3: combo.horse_3,
        real: combo.real,
        shown_odds: combo.odds,
        seed: null,
        imputed: null,
        display: null,
        is_scratched: 0,
      });
    }
  }
  return rows;
}

/** 成功した操作の直後に、メンバーが見た板と同じ計算結果を保存する。 */
export async function captureAnalysisSnapshot(
  db: D1Database,
  eventId: string,
  cause: AnalysisCause,
  now = Date.now(),
): Promise<number | null> {
  const event = await getEventById(db, eventId);
  if (!event || (event.status !== "voting" && event.status !== "closed")) return null;
  const [horses, bets, counts] = await Promise.all([
    listHorses(db, event.id),
    listActiveBets(db, event.id),
    countSnapshotMembers(db, event.id),
  ]);
  const board = buildBoard(event, horses, bets, now);
  const result = await db.prepare(
    `INSERT INTO analysis_snapshots (
      event_id, captured_at, cause, seed_pool_s, pull_e, takeout_d, w_time_floor, w_time_exp, lambda, formula_version, schema_version,
      w_time, w_volume, w, win_real_total, exotic_real_total, tv,
      joined_count, bettor_count, active_bet_count, live_horse_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    event.id, now, cause, event.seed_pool_s, event.pull_e, event.takeout_d,
    event.w_time_floor, event.w_time_exp, IMPUTED_LAMBDA, ANALYSIS_FORMULA_VERSION, ANALYSIS_SCHEMA_VERSION,
    board.wTime, board.wVolume, board.w, board.realTotal, board.exoticTotal, board.tv,
    counts.joined, counts.bettors, counts.activeBets, board.horses.filter((h) => !h.horse.scratched).length,
  ).run();
  const snapshotId = Number(result.meta.last_row_id);
  const rows = oddsRows(board, snapshotId);
  if (rows.length) {
    await db.batch(rows.map((r) => db.prepare(
      `INSERT INTO analysis_snapshot_odds (
        snapshot_id, kind, selection_key, selection_label, horse_1, horse_2, horse_3,
        real, shown_odds, seed, imputed, display, is_scratched
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      r.snapshot_id, r.kind, r.selection_key, r.selection_label, r.horse_1, r.horse_2, r.horse_3,
      r.real, r.shown_odds, r.seed, r.imputed, r.display, r.is_scratched,
    )));
  }
  return snapshotId;
}

/** 分析ログの失敗は本体操作を失敗扱いにしない。D1も失敗時はWorkerログを最後の記録とする。 */
export async function captureAnalysisSnapshotSafely(
  db: D1Database,
  eventId: string,
  cause: AnalysisCause,
  now = Date.now(),
): Promise<number | null> {
  try {
    return await captureAnalysisSnapshot(db, eventId, cause, now);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("分析ログの保存に失敗しました:", { eventId, cause, message });
    try {
      await db.prepare(
        "INSERT INTO analysis_log_failures (event_id, occurred_at, cause, message) VALUES (?, ?, ?, ?)",
      ).bind(eventId, now, cause, message.slice(0, 500)).run();
    } catch (recordError) {
      console.error("分析ログ失敗の記録にも失敗しました:", recordError);
    }
    return null;
  }
}

/** Cron では投票中だけを5分間隔で記録する。 */
export async function captureCurrentIntervalSnapshot(db: D1Database, now = Date.now()): Promise<void> {
  const event = await db.prepare("SELECT id FROM events WHERE is_current = 1 LIMIT 1").first<{ id: string }>();
  if (event) await captureAnalysisSnapshotSafely(db, event.id, "interval", now);
}

export async function listAnalysisEvents(db: D1Database): Promise<AnalysisEventOption[]> {
  const { results } = await db.prepare(
    "SELECT id, title, status, created_at, is_current FROM events ORDER BY is_current DESC, created_at DESC",
  ).all<AnalysisEventOption>();
  return results ?? [];
}

export async function listAnalysisSnapshots(db: D1Database, eventId: string): Promise<AnalysisSnapshotRow[]> {
  const { results } = await db.prepare(
    "SELECT * FROM analysis_snapshots WHERE event_id = ? ORDER BY captured_at DESC, id DESC",
  ).bind(eventId).all<AnalysisSnapshotRow>();
  return results ?? [];
}

export async function listAnalysisFailures(db: D1Database, eventId: string): Promise<AnalysisFailureRow[]> {
  const { results } = await db.prepare(
    "SELECT * FROM analysis_log_failures WHERE event_id = ? ORDER BY occurred_at DESC, id DESC",
  ).bind(eventId).all<AnalysisFailureRow>();
  return results ?? [];
}

/** 投票を登録へ戻した開催の分析途中経過は、次の投票と混在させない。 */
export async function clearAnalysisLogForEvent(db: D1Database, eventId: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM analysis_log_failures WHERE event_id = ?").bind(eventId),
    // analysis_snapshot_odds は FK の ON DELETE CASCADE で同時に消える。
    db.prepare("DELETE FROM analysis_snapshots WHERE event_id = ?").bind(eventId),
  ]);
}

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const raw = String(value);
  // Excel等で意図しない式として解釈されないよう、先頭の式記号を無害化する。
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function csv(rows: Array<Record<string, string | number | null>>, columns: string[]): Uint8Array {
  const text = [columns.join(","), ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(","))].join("\r\n") + "\r\n";
  return new TextEncoder().encode(text);
}

function jst(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().replace("T", " ").replace(".000Z", "+09:00");
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): number[] { return [value & 255, (value >>> 8) & 255]; }
function u32(value: number): number[] { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }

/** 依存パッケージを増やさず、無圧縮ZIPを作る。CSVなので容量は十分小さい。 */
function zip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const file of files) {
    const name = encoder.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(file.data.length), ...u32(file.data.length), ...u16(name.length), ...u16(0), ...name,
    ]);
    parts.push(local, file.data);
    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(crc), ...u32(file.data.length), ...u32(file.data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name,
    ]));
    offset += local.length + file.data.length;
  }
  const centralSize = central.reduce((sum, x) => sum + x.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ]);
  const all = [...parts, ...central, end];
  const out = new Uint8Array(all.reduce((sum, x) => sum + x.length, 0));
  let at = 0;
  for (const part of all) { out.set(part, at); at += part.length; }
  return out;
}

export async function analysisExportZip(db: D1Database, eventId: string): Promise<Uint8Array> {
  const event = await getEventById(db, eventId);
  if (!event) throw new Error("開催が見つかりません");
  const [snapshots, odds, horses] = await Promise.all([
    listAnalysisSnapshots(db, eventId),
    db.prepare("SELECT * FROM analysis_snapshot_odds WHERE snapshot_id IN (SELECT id FROM analysis_snapshots WHERE event_id = ?) ORDER BY snapshot_id, kind, selection_key").bind(eventId).all<AnalysisOddsRow>(),
    listHorses(db, eventId),
  ]);
  const snapshotColumns = ["snapshot_id", "captured_at_jst", "captured_at_ms", "trigger", "formula_version", "schema_version", "S", "E", "D", "w_time_floor", "w_time_exp", "lambda", "w_time", "w_volume", "w", "win_real_total", "exotic_real_total", "tv", "joined_count", "bettor_count", "active_bet_count", "live_horse_count"];
  const oddsColumns = ["snapshot_id", "kind", "selection_key", "selection_label", "horse_1_id", "horse_2_id", "horse_3_id", "real", "shown_odds", "seed", "imputed", "display", "is_scratched"];
  const horseColumns = ["event_id", "horse_id", "horse_number", "name", "strength", "seed_source", "is_scratched", "finish_place"];
  const snapshotCsv = csv(snapshots.map((s) => ({
    snapshot_id: s.id, captured_at_jst: jst(s.captured_at), captured_at_ms: s.captured_at, trigger: s.cause,
    formula_version: s.formula_version, schema_version: s.schema_version,
    S: s.seed_pool_s, E: s.pull_e, D: s.takeout_d, w_time_floor: s.w_time_floor, w_time_exp: s.w_time_exp,
    lambda: s.lambda, w_time: s.w_time, w_volume: s.w_volume, w: s.w,
    win_real_total: s.win_real_total, exotic_real_total: s.exotic_real_total, tv: s.tv,
    joined_count: s.joined_count, bettor_count: s.bettor_count, active_bet_count: s.active_bet_count, live_horse_count: s.live_horse_count,
  })), snapshotColumns);
  const oddsCsv = csv((odds.results ?? []).map((o) => ({
    snapshot_id: o.snapshot_id, kind: o.kind, selection_key: o.selection_key, selection_label: o.selection_label,
    horse_1_id: o.horse_1, horse_2_id: o.horse_2, horse_3_id: o.horse_3, real: o.real,
    shown_odds: o.shown_odds, seed: o.seed, imputed: o.imputed, display: o.display, is_scratched: o.is_scratched,
  })), oddsColumns);
  const horseCsv = csv(horses.map((h, index) => ({
    event_id: event.id, horse_id: h.id, horse_number: index + 1, name: h.name, strength: h.strength,
    seed_source: h.seed_source, is_scratched: h.scratched, finish_place: h.finish_place,
  })), horseColumns);
  return zip([
    { name: "snapshots.csv", data: snapshotCsv },
    { name: "odds.csv", data: oddsCsv },
    { name: "horses.csv", data: horseCsv },
  ]);
}

export function analysisExportFilename(event: EventRow): string {
  const day = new Date(event.created_at + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return `analysis-log-${day}.zip`;
}
