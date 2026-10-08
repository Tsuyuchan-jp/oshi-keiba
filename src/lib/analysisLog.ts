/** 開催後の調整に使う、投票中ボードの集計スナップショットとCSV出力。 */

import { formatSelectionLabel, parseEnabledKinds, type BetKind } from "./bets";
import {
  EXOTIC_GAMMA,
  EXOTIC_PULL_E,
  EXOTIC_STRENGTH_FLOOR,
  exoticOddsQuote,
  exoticReferenceQuote,
  FORMULA_V4,
  IMPUTED_LAMBDA,
  isOddsV4,
  seedForKind,
  wVolume,
} from "./odds";
import { buildBoard, numberByHorseId } from "./storeBoard";
import { getEventById } from "./storeEvent";
import { listActiveBets, listHorses } from "./storeRead";
import type { Board, EventRow, HorseRow } from "./storeTypes";
import { exoticCandidatesFor } from "./venueOdds";

export type AnalysisCause = "voting_open" | "bet" | "redo" | "scratch" | "pre_close" | "close";

/** 式の意味を変えるときだけ上げる。値だけの変更では上げない。 */
export const ANALYSIS_FORMULA_VERSION = FORMULA_V4;
/** CSV列の意味・構造を変えるときだけ上げる。 */
export const ANALYSIS_SCHEMA_VERSION = "analysis-log-v2";

export const ANALYSIS_ARCHIVE_WARNING_BYTES = 3 * 1024 * 1024;
export const ANALYSIS_CAPTURE_PAUSE_BYTES = 4 * 1024 * 1024;
const ANALYSIS_ARCHIVE_PREFIX = "analysis-archives";
const ANALYSIS_POPULAR_LIMIT = 10;

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
  log_complete: number;
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
  is_bet: number;
  popular_rank: number | null;
};

type AnalysisMarketRow = {
  snapshot_id: number;
  kind: Exclude<BetKind, "win">;
  real_total: number;
  pull_e: number;
  seed_pool_s: number;
  gamma: number;
  strength_floor: number;
  w_time: number;
  w_volume: number;
  w: number;
};

export type AnalysisLogState = {
  event_id: string;
  active_uncompressed_bytes: number;
  horse_csv_bytes: number;
  archive_count: number;
  archive_in_progress: number;
  capture_paused: number;
  skipped_snapshot_count: number;
  limit_reached_at: number | null;
  last_archived_at: number | null;
  last_archive_error: string | null;
};

export type AnalysisArchiveRow = {
  id: number;
  event_id: string;
  part_number: number;
  r2_key: string;
  archived_at: number;
  first_captured_at: number;
  last_captured_at: number;
  snapshot_count: number;
  odds_row_count: number;
  uncompressed_bytes: number;
  formula_version: string;
  schema_version: string;
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
    pre_close: "締切直前",
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

function oddsRows(board: Board, snapshotId: number): {
  odds: AnalysisOddsRow[];
  markets: AnalysisMarketRow[];
} {
  const nums = numberByHorseId(board);
  const votingLike = board.event.status === "voting" || board.event.status === "setup";
  const rows: AnalysisOddsRow[] = [];
  const markets: AnalysisMarketRow[] = [];
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
          is_bet: h.real > 0 ? 1 : 0,
          popular_rank: null,
        });
      }
      continue;
    }
    const pool = board.pools.find((p) => p.kind === kind);
    const realByKey = new Map((pool?.combos ?? []).map((combo) => [combo.selection_key, combo]));
    const live = board.horses.filter((entry) => !entry.horse.scratched && entry.number > 0);
    const indexById = new Map(live.map((entry, index) => [entry.horse.id, index]));
    const v4 = isOddsV4(board.event);
    const candidates = v4 || votingLike
      ? exoticCandidatesFor(board, kind)
      : (pool?.combos ?? []).map((combo) => ({
          ids: [combo.horse_1, combo.horse_2, combo.horse_3].filter((id): id is string => id != null),
          numbers: [combo.horse_1, combo.horse_2, combo.horse_3]
            .filter((id): id is string => id != null)
            .map((id) => nums.get(id) ?? 0),
          key: combo.selection_key,
          label: formatSelectionLabel(kind, combo.horse_1, combo.horse_2, combo.horse_3, nums),
        }));
    const calculated = candidates.map((entry) => {
      const combo = realByKey.get(entry.key);
      const selectionReal = combo?.real ?? 0;
      const quote = v4
        ? exoticOddsQuote({
            kind,
            strengths: live.map((item) => item.horse.strength),
            selection: entry.ids.map((id) => indexById.get(id)!),
            seedPool: seedForKind(board.event, kind),
            realTotal: pool?.realTotal ?? 0,
            selectionReal,
            takeoutD: board.event.takeout_d,
          })
        : votingLike
          ? exoticReferenceQuote({
              kind,
              strengths: live.map((item) => item.horse.strength),
              selection: entry.ids.map((id) => indexById.get(id)!),
              seedPool: board.event.seed_pool_s,
              timeWeight: board.wTime,
              realTotal: pool?.realTotal ?? 0,
              selectionReal,
              takeoutD: board.event.takeout_d,
            })
          : null;
      return {
        entry,
        combo,
        shownOdds: v4 || votingLike ? (quote?.odds ?? null) : (combo?.odds ?? null),
        seed: quote?.seed ?? null,
        display: v4 && quote && "share" in quote ? quote.share : (quote && "display" in quote ? quote.display : null),
      };
    });
    const popular = [...calculated]
      .filter((item) => item.shownOdds != null)
      .sort((a, b) => {
        const oddsDifference = a.shownOdds! - b.shownOdds!;
        if (oddsDifference) return oddsDifference;
        for (let index = 0; index < Math.max(a.entry.numbers.length, b.entry.numbers.length); index += 1) {
          const numberDifference = (a.entry.numbers[index] ?? 0) - (b.entry.numbers[index] ?? 0);
          if (numberDifference) return numberDifference;
        }
        return 0;
      })
      .slice(0, ANALYSIS_POPULAR_LIMIT);
    const popularRank = new Map(popular.map((item, index) => [item.entry.key, index + 1]));
    for (const item of calculated) {
      const real = item.combo?.real ?? 0;
      if (!(real > 0) && !popularRank.has(item.entry.key)) continue;
      rows.push({
        snapshot_id: snapshotId,
        kind,
        selection_key: item.entry.key,
        selection_label: item.entry.label,
        horse_1: item.entry.ids[0]!,
        horse_2: item.entry.ids[1] ?? null,
        horse_3: item.entry.ids[2] ?? null,
        real,
        shown_odds: item.shownOdds,
        seed: item.seed,
        imputed: null,
        display: item.display,
        is_scratched: 0,
        is_bet: real > 0 ? 1 : 0,
        popular_rank: popularRank.get(item.entry.key) ?? null,
      });
    }
    const volumeWeight = v4 ? 0 : wVolume(pool?.realTotal ?? 0, EXOTIC_PULL_E[kind]);
    markets.push({
      snapshot_id: snapshotId,
      kind,
      real_total: pool?.realTotal ?? 0,
      pull_e: v4 ? 0 : EXOTIC_PULL_E[kind],
      seed_pool_s: v4 ? seedForKind(board.event, kind) : board.event.seed_pool_s,
      gamma: EXOTIC_GAMMA,
      strength_floor: v4 ? 0 : EXOTIC_STRENGTH_FLOOR,
      w_time: v4 ? 0 : board.wTime,
      w_volume: volumeWeight,
      w: v4 ? 0 : board.wTime * volumeWeight,
    });
  }
  return { odds: rows, markets };
}

/** 成功した操作の直後に、メンバーが見た板と同じ計算結果を保存する。 */
export async function captureAnalysisSnapshot(
  db: D1Database,
  eventId: string,
  cause: AnalysisCause,
  now = Date.now(),
  archiveBucket?: R2Bucket,
): Promise<number | null> {
  const event = await getEventById(db, eventId);
  if (!event || (event.status !== "voting" && event.status !== "closed")) return null;
  let logState = await getAnalysisLogState(db, event.id);
  if (logState && logState.active_uncompressed_bytes >= ANALYSIS_ARCHIVE_WARNING_BYTES) {
    await tryArchiveCurrentAnalysis(db, event, archiveBucket, now);
    logState = await getAnalysisLogState(db, event.id);
  }
  const reservedCause = cause === "voting_open" || cause === "pre_close" || cause === "close";
  if (logState && logState.active_uncompressed_bytes >= ANALYSIS_CAPTURE_PAUSE_BYTES && !reservedCause) {
    await db.prepare(
      `UPDATE analysis_log_states SET
        capture_paused = 1,
        skipped_snapshot_count = skipped_snapshot_count + 1,
        limit_reached_at = COALESCE(limit_reached_at, ?)
      WHERE event_id = ?`,
    ).bind(now, event.id).run();
    return null;
  }
  const [horses, bets, counts] = await Promise.all([
    listHorses(db, event.id),
    listActiveBets(db, event.id),
    countSnapshotMembers(db, event.id),
  ]);
  const board = buildBoard(event, horses, bets, now);
  const v4 = isOddsV4(event);
  const result = await db.prepare(
    `INSERT INTO analysis_snapshots (
      event_id, captured_at, cause, seed_pool_s, pull_e, takeout_d, w_time_floor, w_time_exp, lambda, formula_version, schema_version,
      w_time, w_volume, w, win_real_total, exotic_real_total, tv,
      joined_count, bettor_count, active_bet_count, live_horse_count, log_complete
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
  ).bind(
    event.id, now, cause, event.seed_pool_s, v4 ? 0 : event.pull_e, event.takeout_d,
    v4 ? 0 : event.w_time_floor, v4 ? 0 : event.w_time_exp, v4 ? 0 : IMPUTED_LAMBDA,
    v4 ? FORMULA_V4 : "odds-v3", ANALYSIS_SCHEMA_VERSION,
    v4 ? 0 : board.wTime, v4 ? 0 : board.wVolume, v4 ? 0 : board.w,
    board.realTotal, board.exoticTotal, v4 ? 0 : board.tv,
    counts.joined, counts.bettors, counts.activeBets, board.horses.filter((h) => !h.horse.scratched).length,
  ).run();
  const snapshotId = Number(result.meta.last_row_id);
  const snapshot: AnalysisSnapshotRow = {
    id: snapshotId,
    event_id: event.id,
    captured_at: now,
    cause,
    seed_pool_s: event.seed_pool_s,
    pull_e: v4 ? 0 : event.pull_e,
    takeout_d: event.takeout_d,
    w_time_floor: v4 ? 0 : event.w_time_floor,
    w_time_exp: v4 ? 0 : event.w_time_exp,
    lambda: v4 ? 0 : IMPUTED_LAMBDA,
    formula_version: v4 ? FORMULA_V4 : "odds-v3",
    schema_version: ANALYSIS_SCHEMA_VERSION,
    w_time: v4 ? 0 : board.wTime,
    w_volume: v4 ? 0 : board.wVolume,
    w: v4 ? 0 : board.w,
    win_real_total: board.realTotal,
    exotic_real_total: board.exoticTotal,
    tv: v4 ? 0 : board.tv,
    joined_count: counts.joined,
    bettor_count: counts.bettors,
    active_bet_count: counts.activeBets,
    live_horse_count: board.horses.filter((h) => !h.horse.scratched).length,
    log_complete: 1,
  };
  const captured = oddsRows(board, snapshotId);
  if (captured.odds.length) {
    await db.batch(captured.odds.map((r) => db.prepare(
      `INSERT INTO analysis_snapshot_odds (
        snapshot_id, kind, selection_key, selection_label, horse_1, horse_2, horse_3,
        real, shown_odds, seed, imputed, display, is_scratched, is_bet, popular_rank
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      r.snapshot_id, r.kind, r.selection_key, r.selection_label, r.horse_1, r.horse_2, r.horse_3,
      r.real, r.shown_odds, r.seed, r.imputed, r.display, r.is_scratched, r.is_bet, r.popular_rank,
    )));
  }
  if (captured.markets.length) {
    await db.batch(captured.markets.map((r) => db.prepare(
      `INSERT INTO analysis_snapshot_markets (
        snapshot_id, kind, real_total, pull_e, seed_pool_s, gamma, strength_floor,
        w_time, w_volume, w
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      r.snapshot_id, r.kind, r.real_total, r.pull_e, r.seed_pool_s, r.gamma, r.strength_floor,
      r.w_time, r.w_volume, r.w,
    )));
  }
  await db.prepare("UPDATE analysis_snapshots SET log_complete = 1 WHERE id = ?").bind(snapshotId).run();
  await updateAnalysisSizeAndArchive(db, event, horses, snapshot, captured, archiveBucket, now);
  return snapshotId;
}

/** 分析ログの失敗は本体操作を失敗扱いにしない。D1も失敗時はWorkerログを最後の記録とする。 */
export async function captureAnalysisSnapshotSafely(
  db: D1Database,
  eventId: string,
  cause: AnalysisCause,
  now = Date.now(),
  archiveBucket?: R2Bucket,
): Promise<number | null> {
  try {
    return await captureAnalysisSnapshot(db, eventId, cause, now, archiveBucket);
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

export async function listAnalysisEvents(db: D1Database): Promise<AnalysisEventOption[]> {
  const { results } = await db.prepare(
    "SELECT id, title, status, created_at, is_current FROM events ORDER BY is_current DESC, created_at DESC",
  ).all<AnalysisEventOption>();
  return results ?? [];
}

export async function listAnalysisSnapshots(db: D1Database, eventId: string): Promise<AnalysisSnapshotRow[]> {
  const { results } = await db.prepare(
    "SELECT * FROM analysis_snapshots WHERE event_id = ? AND log_complete = 1 ORDER BY captured_at DESC, id DESC",
  ).bind(eventId).all<AnalysisSnapshotRow>();
  return results ?? [];
}

export async function listAnalysisFailures(db: D1Database, eventId: string): Promise<AnalysisFailureRow[]> {
  const { results } = await db.prepare(
    "SELECT * FROM analysis_log_failures WHERE event_id = ? ORDER BY occurred_at DESC, id DESC",
  ).bind(eventId).all<AnalysisFailureRow>();
  return results ?? [];
}

export async function getAnalysisLogState(
  db: D1Database,
  eventId: string,
): Promise<AnalysisLogState | null> {
  return db.prepare(
    "SELECT * FROM analysis_log_states WHERE event_id = ?",
  ).bind(eventId).first<AnalysisLogState>();
}

export async function listAnalysisArchives(
  db: D1Database,
  eventId: string,
): Promise<AnalysisArchiveRow[]> {
  const { results } = await db.prepare(
    "SELECT * FROM analysis_log_archives WHERE event_id = ? ORDER BY part_number",
  ).bind(eventId).all<AnalysisArchiveRow>();
  return results ?? [];
}

/** 投票を登録へ戻した開催の分析途中経過は、次の投票と混在させない。 */
export async function clearAnalysisLogForEvent(
  db: D1Database,
  eventId: string,
  archiveBucket?: R2Bucket,
): Promise<void> {
  const archives = await listAnalysisArchives(db, eventId);
  if (archives.length && archiveBucket) {
    await archiveBucket.delete(archives.map((archive) => archive.r2_key));
  } else if (archives.length) {
    throw new Error("分析ログの退避先に接続できないため登録へ戻せません");
  }
  await db.batch([
    db.prepare("DELETE FROM analysis_log_failures WHERE event_id = ?").bind(eventId),
    db.prepare("DELETE FROM analysis_log_archives WHERE event_id = ?").bind(eventId),
    db.prepare("DELETE FROM analysis_log_states WHERE event_id = ?").bind(eventId),
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

const SNAPSHOT_COLUMNS = ["snapshot_id", "captured_at_jst", "captured_at_ms", "trigger", "formula_version", "schema_version", "S", "E", "D", "w_time_floor", "w_time_exp", "lambda", "w_time", "w_volume", "w", "win_real_total", "exotic_real_total", "tv", "joined_count", "bettor_count", "active_bet_count", "live_horse_count"];
const ODDS_COLUMNS = ["snapshot_id", "kind", "selection_key", "selection_label", "horse_1_id", "horse_2_id", "horse_3_id", "real", "shown_odds", "seed", "imputed", "display", "is_scratched", "is_bet", "popular_rank"];
const MARKET_COLUMNS = ["snapshot_id", "kind", "real_total", "pull_e", "seed_pool_s", "gamma", "strength_floor", "w_time", "w_volume", "w"];
const HORSE_COLUMNS = ["event_id", "horse_id", "horse_number", "name", "strength", "seed_source", "is_scratched", "finish_place"];
const STATUS_COLUMNS = ["event_id", "writer_formula_version", "writer_schema_version", "archive_threshold_bytes", "pause_threshold_bytes", "active_uncompressed_bytes", "archive_count", "capture_paused", "skipped_snapshot_count", "limit_reached_at_jst", "last_archived_at_jst", "last_archive_error"];

function snapshotCsvRow(s: AnalysisSnapshotRow): Record<string, string | number | null> {
  return {
    snapshot_id: s.id, captured_at_jst: jst(s.captured_at), captured_at_ms: s.captured_at, trigger: s.cause,
    formula_version: s.formula_version, schema_version: s.schema_version,
    S: s.seed_pool_s, E: s.pull_e, D: s.takeout_d, w_time_floor: s.w_time_floor, w_time_exp: s.w_time_exp,
    lambda: s.lambda, w_time: s.w_time, w_volume: s.w_volume, w: s.w,
    win_real_total: s.win_real_total, exotic_real_total: s.exotic_real_total, tv: s.tv,
    joined_count: s.joined_count, bettor_count: s.bettor_count, active_bet_count: s.active_bet_count,
    live_horse_count: s.live_horse_count,
  };
}

function oddsCsvRow(o: AnalysisOddsRow): Record<string, string | number | null> {
  return {
    snapshot_id: o.snapshot_id, kind: o.kind, selection_key: o.selection_key, selection_label: o.selection_label,
    horse_1_id: o.horse_1, horse_2_id: o.horse_2, horse_3_id: o.horse_3, real: o.real,
    shown_odds: o.shown_odds, seed: o.seed, imputed: o.imputed, display: o.display,
    is_scratched: o.is_scratched, is_bet: o.is_bet, popular_rank: o.popular_rank,
  };
}

function marketCsvRow(m: AnalysisMarketRow): Record<string, string | number | null> {
  return { ...m };
}

function horseCsv(
  event: EventRow,
  horses: HorseRow[],
): Uint8Array {
  return csv(horses.map((h, index) => ({
    event_id: event.id, horse_id: h.id, horse_number: index + 1, name: h.name, strength: h.strength,
    seed_source: h.seed_source, is_scratched: h.scratched, finish_place: h.finish_place,
  })), HORSE_COLUMNS);
}

function analysisStatusCsv(eventId: string, state: AnalysisLogState | null): Uint8Array {
  return csv([{
    event_id: eventId,
    writer_formula_version: ANALYSIS_FORMULA_VERSION,
    writer_schema_version: ANALYSIS_SCHEMA_VERSION,
    archive_threshold_bytes: ANALYSIS_ARCHIVE_WARNING_BYTES,
    pause_threshold_bytes: ANALYSIS_CAPTURE_PAUSE_BYTES,
    active_uncompressed_bytes: state?.active_uncompressed_bytes ?? 0,
    archive_count: state?.archive_count ?? 0,
    capture_paused: state?.capture_paused ?? 0,
    skipped_snapshot_count: state?.skipped_snapshot_count ?? 0,
    limit_reached_at_jst: state?.limit_reached_at == null ? "" : jst(state.limit_reached_at),
    last_archived_at_jst: state?.last_archived_at == null ? "" : jst(state.last_archived_at),
    last_archive_error: state?.last_archive_error ?? "",
  }], STATUS_COLUMNS);
}

function csvContentBytes(
  rows: Array<Record<string, string | number | null>>,
  columns: string[],
): number {
  return csv(rows, columns).length - csv([], columns).length;
}

async function analysisExportFiles(
  db: D1Database,
  eventId: string,
  maxSnapshotId?: number,
): Promise<{ event: EventRow; files: { name: string; data: Uint8Array }[]; snapshots: AnalysisSnapshotRow[]; oddsCount: number }> {
  const event = await getEventById(db, eventId);
  if (!event) throw new Error("開催が見つかりません");
  const cutoff = maxSnapshotId == null ? "" : " AND id <= ?";
  const bindCutoff = (statement: D1PreparedStatement) => maxSnapshotId == null
    ? statement.bind(eventId)
    : statement.bind(eventId, maxSnapshotId);
  const [snapshots, odds, markets, horses] = await Promise.all([
    bindCutoff(db.prepare(`SELECT * FROM analysis_snapshots WHERE event_id = ? AND log_complete = 1${cutoff} ORDER BY captured_at DESC, id DESC`)).all<AnalysisSnapshotRow>(),
    bindCutoff(db.prepare(`SELECT * FROM analysis_snapshot_odds WHERE snapshot_id IN (SELECT id FROM analysis_snapshots WHERE event_id = ? AND log_complete = 1${cutoff}) ORDER BY snapshot_id, kind, selection_key`)).all<AnalysisOddsRow>(),
    bindCutoff(db.prepare(`SELECT * FROM analysis_snapshot_markets WHERE snapshot_id IN (SELECT id FROM analysis_snapshots WHERE event_id = ? AND log_complete = 1${cutoff}) ORDER BY snapshot_id, kind`)).all<AnalysisMarketRow>(),
    listHorses(db, eventId),
  ]);
  const snapshotRows = snapshots.results ?? [];
  const oddsRows = odds.results ?? [];
  return {
    event,
    snapshots: snapshotRows,
    oddsCount: oddsRows.length,
    files: [
      { name: "snapshots.csv", data: csv(snapshotRows.map(snapshotCsvRow), SNAPSHOT_COLUMNS) },
      { name: "markets.csv", data: csv((markets.results ?? []).map(marketCsvRow), MARKET_COLUMNS) },
      { name: "odds.csv", data: csv(oddsRows.map(oddsCsvRow), ODDS_COLUMNS) },
      { name: "horses.csv", data: horseCsv(event, horses) },
    ],
  };
}

async function archiveCurrentAnalysis(
  db: D1Database,
  event: EventRow,
  bucket: R2Bucket,
  now: number,
): Promise<void> {
  const cutoff = await db.prepare(
    "SELECT MAX(id) AS id FROM analysis_snapshots WHERE event_id = ? AND log_complete = 1",
  ).bind(event.id).first<{ id: number | null }>();
  if (cutoff?.id == null) {
    await db.prepare(
      "UPDATE analysis_log_states SET archive_in_progress = 0 WHERE event_id = ?",
    ).bind(event.id).run();
    return;
  }
  const exported = await analysisExportFiles(db, event.id, cutoff.id);
  if (!exported.snapshots.length) {
    await db.prepare(
      "UPDATE analysis_log_states SET archive_in_progress = 0 WHERE event_id = ?",
    ).bind(event.id).run();
    return;
  }
  const state = await getAnalysisLogState(db, event.id);
  const partNumber = (state?.archive_count ?? 0) + 1;
  const key = `${ANALYSIS_ARCHIVE_PREFIX}/${event.id}/part-${String(partNumber).padStart(3, "0")}.zip`;
  const body = zip(exported.files);
  const uncompressedBytes = exported.files.reduce((sum, file) => sum + file.data.length, 0);
  const horseBytes = exported.files.find((file) => file.name === "horses.csv")?.data.length ?? 0;
  const emptyCurrentBytes = horseBytes
    + csv([], SNAPSHOT_COLUMNS).length
    + csv([], MARKET_COLUMNS).length
    + csv([], ODDS_COLUMNS).length;
  const archivedContentBytes = uncompressedBytes - emptyCurrentBytes;
  await bucket.put(key, body, { httpMetadata: { contentType: "application/zip" } });
  const times = exported.snapshots.map((snapshot) => snapshot.captured_at);
  await db.batch([
    db.prepare(
      `INSERT INTO analysis_log_archives (
        event_id, part_number, r2_key, archived_at, first_captured_at, last_captured_at,
        snapshot_count, odds_row_count, uncompressed_bytes, formula_version, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      event.id, partNumber, key, now, Math.min(...times), Math.max(...times),
      exported.snapshots.length, exported.oddsCount, uncompressedBytes,
      ANALYSIS_FORMULA_VERSION, ANALYSIS_SCHEMA_VERSION,
    ),
    db.prepare(
      "DELETE FROM analysis_snapshots WHERE event_id = ? AND log_complete = 1 AND id <= ?",
    ).bind(event.id, cutoff.id),
    db.prepare(
      `UPDATE analysis_log_states SET
        active_uncompressed_bytes = MAX(
          active_uncompressed_bytes - ?,
          horse_csv_bytes + ?
        ),
        archive_count = ?, archive_in_progress = 0,
        capture_paused = 0,
        last_archived_at = ?, last_archive_error = NULL
      WHERE event_id = ?`,
    ).bind(
      archivedContentBytes,
      csv([], SNAPSHOT_COLUMNS).length + csv([], MARKET_COLUMNS).length + csv([], ODDS_COLUMNS).length,
      partNumber,
      now,
      event.id,
    ),
  ]);
}

async function updateAnalysisSizeAndArchive(
  db: D1Database,
  event: EventRow,
  horses: HorseRow[],
  snapshot: AnalysisSnapshotRow,
  captured: { odds: AnalysisOddsRow[]; markets: AnalysisMarketRow[] },
  archiveBucket: R2Bucket | undefined,
  now: number,
): Promise<void> {
  const horseBytes = horseCsv(event, horses).length;
  const emptyCurrentBytes = horseBytes
    + csv([], SNAPSHOT_COLUMNS).length
    + csv([], MARKET_COLUMNS).length
    + csv([], ODDS_COLUMNS).length;
  const addedBytes = csvContentBytes([snapshotCsvRow(snapshot)], SNAPSHOT_COLUMNS)
    + csvContentBytes(captured.markets.map(marketCsvRow), MARKET_COLUMNS)
    + csvContentBytes(captured.odds.map(oddsCsvRow), ODDS_COLUMNS);
  await db.prepare(
    `INSERT INTO analysis_log_states (
      event_id, active_uncompressed_bytes, horse_csv_bytes, archive_count, archive_in_progress,
      capture_paused, skipped_snapshot_count, limit_reached_at,
      last_archived_at, last_archive_error
    ) VALUES (?, ?, ?, 0, 0, 0, 0, NULL, NULL, NULL)
    ON CONFLICT(event_id) DO UPDATE SET
      active_uncompressed_bytes = analysis_log_states.active_uncompressed_bytes
        - analysis_log_states.horse_csv_bytes + excluded.horse_csv_bytes + ?,
      horse_csv_bytes = excluded.horse_csv_bytes`,
  ).bind(event.id, emptyCurrentBytes + addedBytes, horseBytes, addedBytes).run();
  const state = await getAnalysisLogState(db, event.id);
  if (!state || state.active_uncompressed_bytes < ANALYSIS_ARCHIVE_WARNING_BYTES) return;
  await tryArchiveCurrentAnalysis(db, event, archiveBucket, now);
}

async function tryArchiveCurrentAnalysis(
  db: D1Database,
  event: EventRow,
  bucket: R2Bucket | undefined,
  now: number,
): Promise<void> {
  if (!bucket) {
    await db.prepare(
      "UPDATE analysis_log_states SET last_archive_error = ? WHERE event_id = ?",
    ).bind("3MiBに達しましたが、退避先のR2を利用できません", event.id).run();
    return;
  }
  const claimed = await db.prepare(
    `UPDATE analysis_log_states
      SET archive_in_progress = ?, last_archive_error = NULL
      WHERE event_id = ? AND (archive_in_progress = 0 OR archive_in_progress < ?)
        AND active_uncompressed_bytes >= ?`,
  ).bind(now, event.id, now - 5 * 60 * 1000, ANALYSIS_ARCHIVE_WARNING_BYTES).run();
  if ((claimed.meta.changes ?? 0) === 0) return;
  try {
    await archiveCurrentAnalysis(db, event, bucket, now);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await db.prepare(
      "UPDATE analysis_log_states SET archive_in_progress = 0, last_archive_error = ? WHERE event_id = ?",
    ).bind(message.slice(0, 500), event.id).run();
  }
}

export async function archiveAnalysisIfNeeded(
  db: D1Database,
  event: EventRow,
  bucket?: R2Bucket,
  now = Date.now(),
): Promise<void> {
  const state = await getAnalysisLogState(db, event.id);
  if (!state || state.active_uncompressed_bytes < ANALYSIS_ARCHIVE_WARNING_BYTES) return;
  await tryArchiveCurrentAnalysis(db, event, bucket, now);
}

export async function analysisExportZip(
  db: D1Database,
  eventId: string,
  bucket?: R2Bucket,
): Promise<Uint8Array> {
  const [current, archives, state] = await Promise.all([
    analysisExportFiles(db, eventId),
    listAnalysisArchives(db, eventId),
    getAnalysisLogState(db, eventId),
  ]);
  const statusFile = { name: "analysis-status.csv", data: analysisStatusCsv(eventId, state) };
  if (!archives.length) return zip([...current.files, statusFile]);
  if (!bucket) throw new Error("分析ログの退避先に接続できません");
  const archiveFiles: { name: string; data: Uint8Array }[] = [];
  for (const archive of archives) {
    const object = await bucket.get(archive.r2_key);
    if (!object) throw new Error(`分析ログ part-${archive.part_number} が見つかりません`);
    archiveFiles.push({
      name: `part-${String(archive.part_number).padStart(3, "0")}.zip`,
      data: new Uint8Array(await object.arrayBuffer()),
    });
  }
  archiveFiles.push({ name: "part-current.zip", data: zip(current.files) });
  archiveFiles.push(statusFile);
  archiveFiles.push({
    name: "README.txt",
    data: new TextEncoder().encode("分析ログは容量保護のため複数ZIPに分割されています。すべて展開して分析してください。\r\n"),
  });
  return zip(archiveFiles);
}

export async function analysisArchiveZip(
  db: D1Database,
  eventId: string,
  partNumber: number,
  bucket: R2Bucket,
): Promise<Uint8Array | null> {
  const archive = await db.prepare(
    "SELECT * FROM analysis_log_archives WHERE event_id = ? AND part_number = ?",
  ).bind(eventId, partNumber).first<AnalysisArchiveRow>();
  if (!archive) return null;
  const object = await bucket.get(archive.r2_key);
  return object ? new Uint8Array(await object.arrayBuffer()) : null;
}

export function analysisExportFilename(event: EventRow): string {
  const day = new Date(event.created_at + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return `analysis-log-${day}.zip`;
}
