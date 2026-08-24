/**
 * 第2回向け: Imputed を TV に入れる式で、第1回実票を5案再生する。
 * 開場・途中・直前・確定を比較する HTML / MD を出す。F は使わない。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  allocateSeed,
  displayPool,
  parimutuelOdds,
  wCombined,
  wTime,
  wVolume,
} from "../src/lib/odds.ts";
import { EXOTIC_BETS, REDOS, type ExoticBet } from "./trial-odds-proposal-2-data.ts";

const REPORT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "reports", "2026-08-23");
const OUT_HTML = join(REPORT_DIR, "trial-odds-proposal-2.html");
const OUT_MD = join(REPORT_DIR, "trial-odds-proposal-2.md");

const EVENT = {
  title: "メンバーシップエクストラLoH",
  takeoutD: 0.2,
  wTimeExp: 1,
  openedAt: 1787447445177,
  closesAt: 1787482800000,
  closedAt: 1787482824096,
};

/** 途中: 17:45 の 14番単勝3000の直後（第1回で本命帯がいちばん跳ねた付近） */
const MID_AT = 1787474723814;

type Horse = { id: string; name: string; strength: number; finish: number; sort: number };

const HORSES: Horse[] = [
  { id: "d9780169-9763-4bd6-8ea1-a6f615ae2422", name: "アドマイヤグルーヴ（つゆちゃん）", strength: 1, finish: 9, sort: 1 },
  { id: "5c139e2f-1ce7-411d-9b04-a5bb552bc8dc", name: "アーモンドアイ（あさくらりえ）", strength: 3, finish: 13, sort: 2 },
  { id: "fe419cd2-9106-4c89-9660-f03722d59121", name: "スティルインラブ（Raiko）", strength: 18, finish: 8, sort: 3 },
  { id: "75565eac-5495-4115-9f2f-0c93344593b8", name: "アーモンドアイ（だいだい）", strength: 19, finish: 12, sort: 4 },
  { id: "1d1d3063-0d52-47e0-b7ba-a6dc2a8a92ca", name: "セイウンスカイ（GEDO）", strength: 20, finish: 1, sort: 5 },
  { id: "da7882b1-617f-49d7-aefd-1f614ee639b7", name: "セイウンスカイ（しょーじ）", strength: 21, finish: 3, sort: 6 },
  { id: "5220eb0e-1669-4d7a-9a4b-3a76c44be9e8", name: "アーモンドアイ（陸カヤック）", strength: 22, finish: 14, sort: 7 },
  { id: "fb29f451-9707-4ab0-863c-ee627491b664", name: "カツラギエース（みはるん）", strength: 24, finish: 4, sort: 8 },
  { id: "79b46bd6-4c7b-407d-993d-ca7209f66226", name: "アーモンドアイ（K4m1y4n）", strength: 25, finish: 11, sort: 9 },
  { id: "36053950-270b-4d3c-bf8b-120f855e7c02", name: "セイウンスカイ（シラオリ）", strength: 26, finish: 16, sort: 10 },
  { id: "99b70e31-c96d-4112-8eb4-063499fcbee0", name: "セイウンスカイ（かきお）", strength: 28, finish: 2, sort: 11 },
  { id: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", name: "セイウンスカイ（だい）", strength: 29, finish: 6, sort: 12 },
  { id: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", name: "カツラギエース（b-men）", strength: 30, finish: 7, sort: 13 },
  { id: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", name: "セイウンスカイ（neko）", strength: 31, finish: 5, sort: 14 },
  { id: "1c11f477-9656-4900-b5c8-7cbb876073e1", name: "アーモンドアイ（ゆっぴー）", strength: 32, finish: 10, sort: 15 },
  { id: "424492b2-a137-4b93-9f37-1fb78dacd8d3", name: "セイウンスカイ（tandm）", strength: 18, finish: 15, sort: 16 },
];

type WinBet = { id: string; horseId: string; amount: number; createdAt: number };
const WIN_BETS: WinBet[] = [
  { id: "27052e63-d434-4303-a69d-6ad0dd9103d5", horseId: "79b46bd6-4c7b-407d-993d-ca7209f66226", amount: 3000, createdAt: 1787453446312 },
  { id: "a3d76430-42d7-4051-9989-af06d226605e", horseId: "1d1d3063-0d52-47e0-b7ba-a6dc2a8a92ca", amount: 3000, createdAt: 1787453635620 },
  { id: "acbb5f88-3075-48ee-ba50-fbf3887b4191", horseId: "f4c8eb59-5062-46c9-b729-fd10f2570ec4", amount: 3000, createdAt: 1787454598242 },
  { id: "cc354470-f28f-4988-b76f-beb30cce48fb", horseId: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", amount: 1000, createdAt: 1787458217153 },
  { id: "afd17c6d-bca0-40f8-9232-82ecf700b2cc", horseId: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", amount: 1500, createdAt: 1787458320539 },
  { id: "1571187b-186f-46b1-9659-d6a72a7ba478", horseId: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 100, createdAt: 1787458788738 },
  { id: "8749958d-adce-4702-b638-269fa98f33f4", horseId: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 400, createdAt: 1787458916093 },
  { id: "8ae48aa8-6b79-4c89-a7d0-af48b195ffaf", horseId: "79b46bd6-4c7b-407d-993d-ca7209f66226", amount: 500, createdAt: 1787459344410 },
  { id: "121326c2-61ef-4a7e-9a84-139e7362f3bd", horseId: "b43cc65e-ee05-44ca-a1ff-ce4bc2497470", amount: 3000, createdAt: 1787460036420 },
  { id: "e7db269c-c0b7-475b-93ab-7914baf9c0c9", horseId: "99b70e31-c96d-4112-8eb4-063499fcbee0", amount: 3000, createdAt: 1787462632497 },
  { id: "9f21b3a9-5fa7-40e4-a6a5-d088b0f13f63", horseId: "da7882b1-617f-49d7-aefd-1f614ee639b7", amount: 100, createdAt: 1787470705716 },
  { id: "94e9df06-b46e-4fce-82ea-9c49cd7d1d55", horseId: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 900, createdAt: 1787470823218 },
  { id: "434cb990-3222-430a-a49e-9617f1729a98", horseId: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 1000, createdAt: 1787474685828 },
  { id: "c22ce313-b1ec-4d30-9d19-095d717587f9", horseId: "d16c5422-f20e-43ae-b1ca-fdb5be08b915", amount: 3000, createdAt: 1787474723813 },
  { id: "982df5b7-2d24-49f4-bdd7-1e9bd08f5874", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 300, createdAt: 1787480942626 },
  { id: "182c76b2-3bb9-4a5d-a7f0-be7484f5d2bb", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787480961434 },
  { id: "68af7b7b-3974-43eb-8653-6a7562aa5a1b", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787480974158 },
  { id: "5a6d9db9-3532-4364-8a0f-e4a768b7da86", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 500, createdAt: 1787481503760 },
  { id: "27044d0a-0654-4d51-a932-311c74ec1dbe", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 500, createdAt: 1787481668242 },
  { id: "54e31901-f049-4962-9a92-3ab66ef01b13", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 500, createdAt: 1787482349875 },
  { id: "13fa927d-7d31-4d52-9b66-d5aab01e456e", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 300, createdAt: 1787482438401 },
  { id: "98ca2a4e-3a5d-449f-8611-836279eff482", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787482459729 },
  { id: "26df2ba6-f0e1-4f53-a439-d7ab19092c97", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787482469490 },
  { id: "c3c093d1-ae91-41bf-9d2e-9d370650c4d8", horseId: "fb29f451-9707-4ab0-863c-ee627491b664", amount: 100, createdAt: 1787482479090 },
  { id: "38ecacac-3579-406b-9ea2-bf99ec427721", horseId: "fe419cd2-9106-4c89-9660-f03722d59121", amount: 1000, createdAt: 1787482635569 },
  { id: "5ea313df-4086-4286-8582-c3756fb58a39", horseId: "d9780169-9763-4bd6-8ea1-a6f615ae2422", amount: 1000, createdAt: 1787482649401 },
  { id: "0e7c4051-c7ad-46cc-9f22-198daafd698e", horseId: "79b46bd6-4c7b-407d-993d-ca7209f66226", amount: 1000, createdAt: 1787482664437 },
];

type Plan = {
  id: string;
  mark: string;
  label: string;
  S: number;
  E: number;
  floor: number;
  lambda: number;
  keep: string;
  drop: string;
};

const PLANS: Plan[] = [
  {
    id: "a",
    mark: "A",
    label: "基準",
    S: 50000,
    E: 100000,
    floor: 0.8,
    lambda: 1,
    keep: "3000 は S の 6%。跳ねは抑えつつ票は見える。E は次回持ち点総量（約 5.8 万）より厚く、第1回実票では直前 w≈0.5。連勝も TV・Display にフルで入る。",
    drop: "直前の Display に Seed がまだ乗るので、確定との差は残る。作者並びは一日ヒントとして残る。",
  },
  {
    id: "b",
    mark: "B",
    label: "S だけ厚く",
    S: 80000,
    E: 100000,
    floor: 0.8,
    lambda: 1,
    keep: "E・下限・λ は基準のまま。3000 が山の約 1/27 になり、跳ねをさらに抑える。w の進みは A と同じ。",
    drop: "序盤〜中盤は作者並びが A より残る。票の見え方は鈍い。直前→確定のギャップも A より開きやすい。",
  },
  {
    id: "c",
    mark: "C",
    label: "E を総量寄りに",
    S: 50000,
    E: 60000,
    floor: 0.8,
    lambda: 1,
    keep: "E を次回持ち点総量（57840）近くにする。票が乗ると Seed が早く薄まり、終盤は場の票が本体。S の厚みは基準のまま。",
    drop: "直前 w=0.5 は諦める（第1回票だと 0.3 前後）。終盤の 3000 は分母の Seed が減って A より跳ねやすい。",
  },
  {
    id: "d",
    mark: "D",
    label: "λ=0.5",
    S: 50000,
    E: 100000,
    floor: 0.8,
    lambda: 0.5,
    keep: "連勝は単勝板に半額だけ漏らす。単勝全額勢の板が、連勝勢に食われすぎない。S・E は基準。",
    drop: "連勝に厚い週は「場の総意」が不足。TV が小さいので直前 w は 0.5 より残る。ミックスで w が想定からずれる。",
  },
  {
    id: "e",
    mark: "E",
    label: "時計では落とさない",
    S: 50000,
    E: 100000,
    floor: 0.999,
    lambda: 1,
    keep: "w は票量だけ。閑散でも時間だけで作者が薄まらない。S=50000 のバラストは維持。",
    drop: "直前 w=0.5 より Seed が残る（第1回票なら w票≈0.62）。時間演出はない。",
  },
];

const horseIds = new Set(HORSES.map((h) => h.id));
const missingHorse = new Set<string>();

function hid(id: string | null | undefined): string | null {
  if (id == null) return null;
  if (horseIds.has(id)) return id;
  missingHorse.add(id);
  return id;
}

function addImputed(b: ExoticBet, lambda: number, into: Map<string, number>): void {
  const a = b.amount * lambda;
  const p1 = hid(b.h1);
  const p2 = hid(b.h2);
  const p3 = hid(b.h3);
  const add = (id: string | null, n: number) => {
    if (!id || !(n > 0)) return;
    into.set(id, (into.get(id) ?? 0) + n);
  };
  if (b.kind === "umaren") {
    add(p1, a / 2);
    add(p2, a / 2);
  } else if (b.kind === "umatan") {
    add(p1, (a * 2) / 3);
    add(p2, a / 3);
  } else if (b.kind === "sanrenpuku") {
    add(p1, a / 3);
    add(p2, a / 3);
    add(p3, a / 3);
  } else {
    add(p1, a / 2);
    add(p2, a / 3);
    add(p3, a / 6);
  }
}

type SnapKind = "open" | "mid" | "last" | "conf";

type HorseOdds = {
  id: string;
  win: number;
  imputed: number;
  odds: number | null;
};

type Snap = {
  kind: SnapKind;
  t: number;
  w: number;
  wT: number;
  wV: number;
  tv: number;
  winTotal: number;
  exoticTotal: number;
  seedShare: number;
  horses: HorseOdds[];
};

function activeIds(t: number): Set<string> {
  const live = new Set<string>();
  const events: { t: number; add?: string; del?: string }[] = [];
  for (const b of WIN_BETS) events.push({ t: b.createdAt, add: b.id });
  for (const b of EXOTIC_BETS) events.push({ t: b.createdAt, add: b.id });
  for (const r of REDOS) events.push({ t: r.at, del: r.betId });
  events.sort((a, b) => a.t - b.t || (a.add ? -1 : 1));
  for (const e of events) {
    if (e.t > t) break;
    if (e.add) live.add(e.add);
    if (e.del) live.delete(e.del);
  }
  return live;
}

function snapshot(plan: Plan, kind: SnapKind): Snap {
  const t =
    kind === "open" ? EVENT.openedAt : kind === "mid" ? MID_AT : EVENT.closesAt - 1;
  const confirmed = kind === "conf";
  const live = activeIds(confirmed ? EVENT.closedAt - 1 : t);
  const winBy = new Map<string, number>();
  let winTotal = 0;
  for (const b of WIN_BETS) {
    if (!live.has(b.id)) continue;
    winBy.set(b.horseId, (winBy.get(b.horseId) ?? 0) + b.amount);
    winTotal += b.amount;
  }
  const imputed = new Map<string, number>();
  let exoticTotal = 0;
  if (!confirmed) {
    for (const b of EXOTIC_BETS) {
      if (!live.has(b.id)) continue;
      exoticTotal += b.amount;
      addImputed(b, plan.lambda, imputed);
    }
  }
  const tv = confirmed ? winTotal : winTotal + plan.lambda * exoticTotal;
  const wT = confirmed
    ? 0
    : wTime(t, EVENT.openedAt, EVENT.closesAt, plan.floor, EVENT.wTimeExp);
  const wV = confirmed ? 0 : wVolume(tv, plan.E);
  const w = confirmed ? 0 : wCombined(wT, wV);
  const seeds = allocateSeed(
    HORSES.map((h) => h.strength),
    plan.S,
  );
  const displays = HORSES.map((h, i) => {
    const win = winBy.get(h.id) ?? 0;
    const imp = imputed.get(h.id) ?? 0;
    if (confirmed) return win;
    return displayPool(seeds[i], w, win + imp);
  });
  const displayTotal = displays.reduce((a, b) => a + b, 0);
  const seedMass = confirmed ? 0 : seeds.reduce((a, s) => a + s, 0) * w;
  const seedShare = displayTotal > 0 ? seedMass / displayTotal : 1;
  return {
    kind,
    t,
    w,
    wT,
    wV,
    tv,
    winTotal,
    exoticTotal,
    seedShare,
    horses: HORSES.map((h, i) => ({
      id: h.id,
      win: winBy.get(h.id) ?? 0,
      imputed: imputed.get(h.id) ?? 0,
      odds: parimutuelOdds(
        displays[i],
        confirmed ? winTotal : displayTotal,
        EVENT.takeoutD,
      ),
    })),
  };
}

type Run = { p: Plan; open: Snap; mid: Snap; last: Snap; conf: Snap };

function fmtOdds(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

function esc(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function jst(ms: number): string {
  return new Date(ms).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function gapBacked(last: Snap, conf: Snap): string {
  const g = last.horses
    .map((h, i) => {
      if (h.win < 1000 || h.odds == null || conf.horses[i].odds == null) return null;
      return Math.abs(h.odds - conf.horses[i].odds!);
    })
    .filter((n): n is number => n != null);
  return mean(g).toFixed(1);
}

function spread(snap: Snap): string {
  const xs = snap.horses.map((h) => h.odds).filter((n): n is number => n != null);
  return `${Math.min(...xs).toFixed(1)}〜${Math.max(...xs).toFixed(1)}`;
}

function htmlMomentTable(runs: Run[], key: "open" | "mid" | "last" | "conf"): string {
  const head = runs.map((r) => `<th class="num">${esc(r.p.mark)}</th>`).join("");
  const body = HORSES.map((h, i) => {
    const win = runs[0][key].horses[i].win;
    const cls = h.finish === 1 ? "winner-row" : win <= 0 ? "quiet-row" : "";
    const cells = runs.map((r) => `<td class="num">${fmtOdds(r[key].horses[i].odds)}</td>`).join("");
    return `<tr class="${cls}"><td class="num">${h.sort}</td><td>${esc(h.name)}</td><td class="num">${h.strength}</td><td class="num">${h.finish}</td><td class="num">${win.toLocaleString("ja-JP")}</td>${cells}</tr>`;
  }).join("");
  return `<table>
    <thead><tr><th class="num">#</th><th>ウマ娘</th><th class="num">Str</th><th class="num">着</th><th class="num">単勝実票</th>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function mdMomentTable(runs: Run[], key: "open" | "mid" | "last" | "conf"): string {
  const head = "| # | ウマ娘 | Str | 着 | 単勝実票 |" + runs.map((r) => ` ${r.p.mark} |`).join("");
  const sep = "|---|---|---|---|---:|" + runs.map(() => "---:|").join("");
  const rows = HORSES.map((h, i) => {
    const win = runs[0][key].horses[i].win;
    return `| ${h.sort} | ${h.name} | ${h.strength} | ${h.finish} | ${win} |${runs.map((r) => ` ${fmtOdds(r[key].horses[i].odds)} |`).join("")}`;
  });
  return [head, sep, ...rows].join("\n");
}

function main(): void {
  const runs: Run[] = PLANS.map((p) => ({
    p,
    open: snapshot(p, "open"),
    mid: snapshot(p, "mid"),
    last: snapshot(p, "last"),
    conf: snapshot(p, "conf"),
  }));
  const last0 = runs[0].last;
  const chipsNext = 14 * 3000 + 15840;

  const metricRows = runs
    .map((r) => `<tr>
      <td>${esc(r.p.mark)} ${esc(r.p.label)}</td>
      <td class="num">${r.p.S.toLocaleString("ja-JP")}</td>
      <td class="num">${r.p.E.toLocaleString("ja-JP")}</td>
      <td class="num">${r.p.floor}</td>
      <td class="num">${r.p.lambda}</td>
      <td class="num">${r.last.w.toFixed(2)}</td>
      <td class="num">${(r.last.seedShare * 100).toFixed(0)}%</td>
      <td class="num">${spread(r.last)}</td>
      <td class="num">${gapBacked(r.last, r.conf)}</td>
    </tr>`)
    .join("");

  const planCards = runs
    .map(
      (r) => `<article class="plan">
      <h3>${esc(r.p.mark)} ${esc(r.p.label)}</h3>
      <p class="meta">S=${r.p.S.toLocaleString("ja-JP")}　E=${r.p.E.toLocaleString("ja-JP")}　w時下限=${r.p.floor}　λ=${r.p.lambda}</p>
      <p><strong>優先:</strong> ${esc(r.p.keep)}</p>
      <p><strong>諦める:</strong> ${esc(r.p.drop)}</p>
      <p class="note">直前 w=${r.last.w.toFixed(2)}（w時 ${r.last.wT.toFixed(2)} × w票 ${r.last.wV.toFixed(2)}）　TV=${r.last.tv.toLocaleString("ja-JP")}　Seed ${(r.last.seedShare * 100).toFixed(0)}%</p>
    </article>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>第2回向け 仮値5案 · 設定比較</title>
<style>
  :root { --bg:#f4efe4; --paper:#fffdf7; --ink:#1c2416; --muted:#5c6754; --line:#d9d0bd; --accent:#3d5a2c; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font-family:"Yu Mincho","YuMincho","Hiragino Mincho ProN",serif; line-height:1.65; }
  .wrap { max-width: 1180px; margin:0 auto; padding:2rem 1.2rem 4rem; }
  header.hero h1 { font-size:1.5rem; margin:0 0 .4rem; }
  header.hero p, .note { color:var(--muted); }
  .kicker { font-family:"Yu Gothic","YuGothic",sans-serif; font-size:.82rem; letter-spacing:.12em; color:var(--accent); }
  nav.toc { display:flex; flex-wrap:wrap; gap:.5rem 1rem; margin:1.4rem 0 2rem; font-family:"Yu Gothic","YuGothic",sans-serif; font-size:.88rem; }
  nav.toc a { color:var(--accent); }
  section { background:var(--paper); border:1px solid var(--line); padding:1.3rem 1.2rem 1.5rem; margin:0 0 1.2rem; }
  h2 { font-size:1.15rem; margin:0 0 .8rem; }
  h3 { font-size:1rem; margin:0 0 .35rem; }
  .plans { display:grid; gap:.8rem; }
  article.plan { border:1px solid var(--line); padding:.8rem 1rem; background:#fff; }
  .meta { font-family:"Yu Gothic","YuGothic",sans-serif; font-size:.85rem; color:var(--muted); margin:.2rem 0 .5rem; }
  table { width:100%; border-collapse:collapse; font-family:"Yu Gothic","YuGothic",sans-serif; font-size:.82rem; }
  th, td { border-bottom:1px solid var(--line); padding:.38rem .32rem; text-align:left; vertical-align:top; }
  th { color:var(--muted); font-weight:600; font-size:.72rem; }
  td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
  tr.winner-row { background:#eef5ee; }
  tr.quiet-row { color:var(--muted); }
  code { font-family: ui-monospace, monospace; font-size:.85em; }
  @media print { body { background:#fff; } section { break-inside: avoid; } }
</style>
</head>
<body>
<div class="wrap">
  <p class="kicker">内部レポート · メンバーには出さない</p>
  <header class="hero">
    <h1>第2回向け 仮値5案</h1>
    <p>式は共通。第1回の実票（単勝＋連勝）を当てはめた再生。F なし。確定は単勝実票のみ。基準 S は <strong>50000</strong>（5000 は誤記のため、このファイルで差し替え済み）。</p>
    <p>途中は ${jst(MID_AT)}（14番へ単勝 3000 の直後）。次回の持ち点想定は 14×3000＋15840＝${chipsNext.toLocaleString("ja-JP")} スペ（E の読み用。票そのものは第1回のまま）。</p>
  </header>
  <nav class="toc">
    <a href="#formula">式</a>
    <a href="#plans">5案</a>
    <a href="#metrics">直前の要約</a>
    <a href="#open">開場</a>
    <a href="#mid">途中</a>
    <a href="#last">直前</a>
    <a href="#conf">確定</a>
  </nav>

  <section id="formula">
    <h2>次回の計算式（この比較の前提）</h2>
    <p><code>TV = 単勝実票合計 + λ × 連勝実票合計</code>（返還済みは含めない）</p>
    <p><code>w時 = 下限 + (1 − 下限) × 残り^1</code>　<code>w票 = max(0, 1 − TV / E)</code>　<code>w = w時 × w票</code></p>
    <p>連勝 600 の割り振り（λ=1 のとき）: 馬連 300+300 / 馬単 400+200 / 3連複 200×3 / 3連単 300+200+100</p>
    <p><code>Display_i = Seed_i × w + 単勝Real_i + Imputed_i</code>（投票中）　確定・払いは単勝 Real のみ。Seed は Strength 比（α=1）。</p>
    <p class="note">第1回再生の直前 TV（λ=1）は単勝 ${last0.winTotal.toLocaleString("ja-JP")} ＋連勝 ${last0.exoticTotal.toLocaleString("ja-JP")}。開場の単勝オッズは S に依らず Strength 比だけ。</p>
  </section>

  <section id="plans">
    <h2>各案の狙い</h2>
    <div class="plans">${planCards}</div>
  </section>

  <section id="metrics">
    <h2>直前の要約（第1回実票）</h2>
    <table>
      <thead><tr>
        <th>案</th><th class="num">S</th><th class="num">E</th><th class="num">下限</th><th class="num">λ</th>
        <th class="num">直前 w</th><th class="num">直前 Seed%</th><th class="num">直前の幅</th>
        <th class="num">直前→確定<br>（単勝1000〜）</th>
      </tr></thead>
      <tbody>${metricRows}</tbody>
    </table>
  </section>

  <section id="open">
    <h2>開場</h2>
    <p class="note">${jst(EVENT.openedAt)}　票ゼロ。α=1 なので5案とも同じ。</p>
    ${htmlMomentTable(runs, "open")}
  </section>
  <section id="mid">
    <h2>途中（14番全額の直後）</h2>
    <p class="note">${jst(MID_AT)}　ここから案の差が出る。</p>
    ${htmlMomentTable(runs, "mid")}
  </section>
  <section id="last">
    <h2>締切直前</h2>
    <p class="note">${jst(EVENT.closesAt)} の直前。参考（Seed＋単勝＋Imputed）。</p>
    ${htmlMomentTable(runs, "last")}
  </section>
  <section id="conf">
    <h2>確定</h2>
    <p class="note">単勝実票のみ。5案とも同じ。票なしは —。</p>
    ${htmlMomentTable(runs, "conf")}
  </section>
</div>
</body>
</html>
`;

  const md = `# 第2回向け 仮値5案（設定比較）

最終更新: 2026-08-25

**このファイルの役割:** 次回オッズ式（Imputed を TV に入れる、F なし）の仮値比較。閲覧は [\`trial-odds-proposal-2.html\`](./trial-odds-proposal-2.html)。再生成は \`node --experimental-strip-types scripts/trial-odds-proposal-2.ts\`。

票は第1回実票。次回の人数・持ち点は E の読みにだけ使う（14×3000＋15840＝${chipsNext.toLocaleString("ja-JP")}）。基準 S は **50000**（5000 は誤記のため差し替え）。

途中は ${jst(MID_AT)}（14番へ単勝 3000 の直後）。

---

## 式

\`\`\`
TV = 単勝実票合計 + λ × 連勝実票合計
w時 = 下限 + (1 − 下限) × 残り
w票 = max(0, 1 − TV / E)
w = w時 × w票
Seed_i = S × Strength_i / Σ Strength
Imputed: 馬連 1:1 / 馬単 2:1 / 3連複 1:1:1 / 3連単 3:2:1（額に λ）
Display_i = Seed_i × w + 単勝Real_i + Imputed_i   # 投票中
確定_i = 単勝Real のみ
\`\`\`

第1回再生の直前（λ=1）: 単勝 ${last0.winTotal.toLocaleString("ja-JP")}、連勝 ${last0.exoticTotal.toLocaleString("ja-JP")}。

## 5案

${runs
  .map(
    (r) => `### ${r.p.mark} ${r.p.label}

- S=${r.p.S}　E=${r.p.E}　w時下限=${r.p.floor}　λ=${r.p.lambda}
- 優先: ${r.p.keep}
- 諦める: ${r.p.drop}
- 直前 w=${r.last.w.toFixed(2)}、Seed ${(r.last.seedShare * 100).toFixed(0)}%、幅 ${spread(r.last)}、単勝1000〜の直前→確定 ${gapBacked(r.last, r.conf)} 倍
`,
  )
  .join("\n")}

## 開場

${mdMomentTable(runs, "open")}

## 途中（14番全額の直後）

${mdMomentTable(runs, "mid")}

## 締切直前

${mdMomentTable(runs, "last")}

## 確定

${mdMomentTable(runs, "conf")}
`;

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(OUT_HTML, html, "utf8");
  writeFileSync(OUT_MD, md, "utf8");
  if (missingHorse.size) {
    console.warn("unknown horse ids", [...missingHorse]);
  }
  console.log(`wrote ${OUT_HTML}`);
  console.log(`wrote ${OUT_MD}`);
  console.log(
    JSON.stringify(
      {
        lastTV: { win: last0.winTotal, exotic: last0.exoticTotal },
        plans: runs.map((r) => ({
          id: r.p.id,
          lastW: r.last.w,
          lastSeed: r.last.seedShare,
          lastTV: r.last.tv,
        })),
      },
      null,
      2,
    ),
  );
}

main();
