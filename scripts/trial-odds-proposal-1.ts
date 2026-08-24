/**
 * 第2回向け改善案1: 同じ票で設定4通りを再生し、開場・直前・確定を比較する HTML / MD を出す。
 * 票データは scripts/trial-odds-report.ts と同じ（終了時パラメータで一律再生）。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  displayPool,
  parimutuelOdds,
  wCombined,
  wTime,
  wVolume,
} from "../src/lib/odds.ts";

const REPORT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "reports",
  "2026-08-23",
);
const OUT_HTML = join(REPORT_DIR, "trial-odds-proposal-1.html");
const OUT_MD = join(REPORT_DIR, "trial-odds-proposal-1.md");

const EVENT = {
  title: "メンバーシップエクストラLoH",
  takeoutD: 0.2,
  wTimeExp: 1,
  openedAt: 1787447445177,
  closesAt: 1787482800000,
  closedAt: 1787482824096,
};

type Horse = {
  id: string;
  name: string;
  strength: number;
  finish: number;
  sort: number;
};

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

const REDOS: { betId: string; at: number }[] = [
  { betId: "acbb5f88-3075-48ee-ba50-fbf3887b4191", at: 1787454631483 },
  { betId: "cc354470-f28f-4988-b76f-beb30cce48fb", at: 1787458298372 },
  { betId: "27052e63-d434-4303-a69d-6ad0dd9103d5", at: 1787458950820 },
  { betId: "982df5b7-2d24-49f4-bdd7-1e9bd08f5874", at: 1787481491409 },
  { betId: "182c76b2-3bb9-4a5d-a7f0-be7484f5d2bb", at: 1787481491409 },
  { betId: "68af7b7b-3974-43eb-8653-6a7562aa5a1b", at: 1787481491409 },
  { betId: "5a6d9db9-3532-4364-8a0f-e4a768b7da86", at: 1787481657924 },
  { betId: "27044d0a-0654-4d51-a932-311c74ec1dbe", at: 1787482341063 },
  { betId: "54e31901-f049-4962-9a92-3ab66ef01b13", at: 1787482429015 },
  { betId: "13fa927d-7d31-4d52-9b66-d5aab01e456e", at: 1787482451549 },
];

type Params = {
  id: string;
  mark: string;
  label: string;
  blurb: string;
  S: number;
  E: number;
  floor: number;
  alpha: number;
};

const SCENARIOS: Params[] = [
  {
    id: "trial",
    mark: "①",
    label: "今回の試運転",
    blurb: "終了時の値で開場から一律再生。α=1（Strength 比のまま）。",
    S: 25000,
    E: 30000,
    floor: 0.5,
    alpha: 1,
  },
  {
    id: "thick",
    mark: "②",
    label: "S・E だけ厚め",
    blurb: "作者並びの山を厚くして、1票の相対重さを落とす。αは今回と同じ。",
    S: 40000,
    E: 50000,
    floor: 0.5,
    alpha: 1,
  },
  {
    id: "thick-floor",
    mark: "③",
    label: "S・E 厚め＋w時下限 0.8",
    blurb: "②に加え、時計だけでは Seed を薄めすぎない。",
    S: 40000,
    E: 50000,
    floor: 0.8,
    alpha: 1,
  },
  {
    id: "proposal",
    mark: "④",
    label: "改善案1（提案）",
    blurb: "Seed を √Strength で圧縮し、山はさらに厚く残す。投票中の感覚合わせが目的。",
    S: 50000,
    E: 70000,
    floor: 0.8,
    alpha: 0.5,
  },
];

function allocateSeedAlpha(strengths: number[], seedPoolS: number, alpha: number): number[] {
  const weights = strengths.map((s) => Math.max(0, s) ** alpha);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!(seedPoolS > 0) || !(sum > 0)) return strengths.map(() => 0);
  return weights.map((w) => (seedPoolS * w) / sum);
}

function activeAtClose(): Map<string, { horseId: string; amount: number }> {
  const active = new Map<string, { horseId: string; amount: number }>();
  const events: { t: number; kind: "bet" | "redo"; betId: string; bet?: WinBet }[] = [];
  for (const b of WIN_BETS) events.push({ t: b.createdAt, kind: "bet", betId: b.id, bet: b });
  for (const r of REDOS) events.push({ t: r.at, kind: "redo", betId: r.betId });
  events.sort((a, b) => a.t - b.t || (a.kind === "bet" ? -1 : 1));
  const tClose = EVENT.closedAt - 1;
  for (const e of events) {
    if (e.t > tClose) break;
    if (e.kind === "bet" && e.bet) {
      active.set(e.bet.id, { horseId: e.bet.horseId, amount: e.bet.amount });
    } else {
      active.delete(e.betId);
    }
  }
  return active;
}

type HorseOdds = {
  id: string;
  real: number;
  open: number | null;
  last: number | null;
  confirmed: number | null;
};

type Run = {
  p: Params;
  w: number;
  wT: number;
  wV: number;
  seedShare: number;
  realTotal: number;
  horses: HorseOdds[];
};

function board(
  t: number,
  active: Map<string, { horseId: string; amount: number }>,
  p: Params,
  kind: "voting" | "confirmed",
): { w: number; wT: number; wV: number; seedShare: number; realTotal: number; shown: (number | null)[] } {
  const realBy = new Map<string, number>();
  for (const v of active.values()) {
    realBy.set(v.horseId, (realBy.get(v.horseId) ?? 0) + v.amount);
  }
  const reals = HORSES.map((h) => realBy.get(h.id) ?? 0);
  const realTotal = reals.reduce((a, b) => a + b, 0);
  const seeds = allocateSeedAlpha(
    HORSES.map((h) => h.strength),
    p.S,
    p.alpha,
  );
  const wT = wTime(t, EVENT.openedAt, EVENT.closesAt, p.floor, EVENT.wTimeExp);
  const wV = wVolume(realTotal, p.E);
  const w = wCombined(wT, wV);
  const displays = seeds.map((s, i) => displayPool(s, w, reals[i]));
  const displayTotal = displays.reduce((a, b) => a + b, 0);
  const seedMass = seeds.reduce((a, s) => a + s, 0) * w;
  const seedShare = displayTotal > 0 ? seedMass / displayTotal : 1;
  const shown = HORSES.map((_, i) => {
    if (kind === "confirmed") return parimutuelOdds(reals[i], realTotal, EVENT.takeoutD);
    return parimutuelOdds(displays[i], displayTotal, EVENT.takeoutD);
  });
  return { w, wT, wV, seedShare, realTotal, shown };
}

function runScenario(p: Params, active: Map<string, { horseId: string; amount: number }>): Run {
  const empty = new Map<string, { horseId: string; amount: number }>();
  const open = board(EVENT.openedAt, empty, p, "voting");
  const last = board(EVENT.closedAt - 1, active, p, "voting");
  const conf = board(EVENT.closedAt, active, p, "confirmed");
  return {
    p,
    w: last.w,
    wT: last.wT,
    wV: last.wV,
    seedShare: last.seedShare,
    realTotal: last.realTotal,
    horses: HORSES.map((h, i) => ({
      id: h.id,
      real: (() => {
        let r = 0;
        for (const v of active.values()) if (v.horseId === h.id) r += v.amount;
        return r;
      })(),
      open: open.shown[i],
      last: last.shown[i],
      confirmed: conf.shown[i],
    })),
  };
}

function fmtOdds(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function spread(horses: HorseOdds[]): string {
  const opens = horses.map((h) => h.open).filter((n): n is number => n != null);
  return `${Math.min(...opens).toFixed(1)}〜${Math.max(...opens).toFixed(1)}`;
}

function gapBacked(horses: HorseOdds[]): string {
  const g = horses
    .filter((h) => h.real >= 1000 && h.last != null && h.confirmed != null)
    .map((h) => Math.abs(h.last! - h.confirmed!));
  return mean(g).toFixed(1);
}

function mdTableCompare(runs: Run[]): string {
  const head =
    "| # | ウマ娘 | Str | 着 | 実票 |" +
    runs.map((r) => ` ${r.p.mark}開場 | ${r.p.mark}直前 | ${r.p.mark}確定 |`).join("");
  const sep = "|---|---|---|---|---|" + runs.map(() => "---:|---:|---:|").join("");
  const rows = HORSES.map((h, i) => {
    const cells = runs
      .map((r) => {
        const x = r.horses[i];
        return ` ${fmtOdds(x.open)} | ${fmtOdds(x.last)} | ${fmtOdds(x.confirmed)} |`;
      })
      .join("");
    return `| ${h.sort} | ${h.name} | ${h.strength} | ${h.finish} | ${runs[0].horses[i].real} |${cells}`;
  });
  return [head, sep, ...rows].join("\n");
}

function mdTableOne(run: Run): string {
  const rows = HORSES.map((h, i) => {
    const x = run.horses[i];
    const gap =
      x.last != null && x.confirmed != null ? (x.confirmed - x.last).toFixed(1) : "—";
    return `| ${h.sort} | ${h.name} | ${h.strength} | ${h.finish} | ${fmtOdds(x.open)} | ${fmtOdds(x.last)} | ${fmtOdds(x.confirmed)} | ${gap} | ${x.real} |`;
  });
  return [
    "| # | ウマ娘 | Str | 着 | 開場 | 直前 | 確定 | 直前→確定 | 実票 |",
    "|---|---|---|---|---:|---:|---:|---:|---:|",
    ...rows,
  ].join("\n");
}

function htmlCompareTable(runs: Run[]): string {
  const groupHead = runs
    .map((r) => `<th colspan="3" class="grp grp-${r.p.id}">${esc(r.p.mark)} ${esc(r.p.label)}</th>`)
    .join("");
  const subHead = runs
    .map(
      (r) =>
        `<th class="num grp-${r.p.id}">開場</th><th class="num grp-${r.p.id}">直前</th><th class="num grp-${r.p.id}">確定</th>`,
    )
    .join("");
  const body = HORSES.map((h, i) => {
    const cls = h.finish === 1 ? "winner-row" : runs[0].horses[i].real <= 0 ? "quiet-row" : "";
    const odds = runs
      .map((r) => {
        const x = r.horses[i];
        return `<td class="num grp-${r.p.id}">${fmtOdds(x.open)}</td><td class="num grp-${r.p.id}">${fmtOdds(x.last)}</td><td class="num grp-${r.p.id}">${fmtOdds(x.confirmed)}</td>`;
      })
      .join("");
    return `<tr class="${cls}">
      <td class="num sticky">${h.sort}</td>
      <td class="sticky name">${esc(h.name)}</td>
      <td class="num">${h.strength}</td>
      <td class="num">${h.finish}</td>
      <td class="num">${runs[0].horses[i].real.toLocaleString("ja-JP")}</td>
      ${odds}
    </tr>`;
  }).join("");
  return `<div class="scroll">
  <table class="wide">
    <thead>
      <tr>
        <th class="num sticky" rowspan="2">#</th>
        <th class="sticky name" rowspan="2">ウマ娘</th>
        <th class="num" rowspan="2">Str</th>
        <th class="num" rowspan="2">着</th>
        <th class="num" rowspan="2">実票</th>
        ${groupHead}
      </tr>
      <tr>${subHead}</tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</div>`;
}

function htmlOneTable(run: Run): string {
  const rows = HORSES.map((h, i) => {
    const x = run.horses[i];
    const gap =
      x.last != null && x.confirmed != null ? (x.confirmed - x.last).toFixed(1) : "—";
    const cls = h.finish === 1 ? "winner-row" : x.real <= 0 ? "quiet-row" : "";
    return `<tr class="${cls}">
      <td class="num">${h.sort}</td>
      <td>${esc(h.name)}</td>
      <td class="num">${h.strength}</td>
      <td class="num">${h.finish}</td>
      <td class="num">${fmtOdds(x.open)}</td>
      <td class="num">${fmtOdds(x.last)}</td>
      <td class="num">${fmtOdds(x.confirmed)}</td>
      <td class="num">${gap}</td>
      <td class="num">${x.real.toLocaleString("ja-JP")}</td>
    </tr>`;
  }).join("");
  return `<table>
    <thead>
      <tr>
        <th class="num">#</th><th>ウマ娘</th><th class="num">Str</th><th class="num">着</th>
        <th class="num">開場</th><th class="num">直前</th><th class="num">確定</th>
        <th class="num">直前→確定</th><th class="num">実票</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function main(): void {
  const active = activeAtClose();
  const runs = SCENARIOS.map((p) => runScenario(p, active));
  const realTotal = runs[0].realTotal;

  const metricRows = runs
    .map((r) => {
      const opens = r.horses.map((h) => h.open).filter((n): n is number => n != null);
      return `<tr>
        <td>${esc(r.p.mark)} ${esc(r.p.label)}</td>
        <td class="num">${r.p.S.toLocaleString("ja-JP")}</td>
        <td class="num">${r.p.E.toLocaleString("ja-JP")}</td>
        <td class="num">${r.p.floor}</td>
        <td class="num">${r.p.alpha}</td>
        <td class="num">${spread(r.horses)}</td>
        <td class="num">${r.w.toFixed(2)}</td>
        <td class="num">${(r.seedShare * 100).toFixed(0)}%</td>
        <td class="num">${gapBacked(r.horses)}</td>
        <td class="num">${Math.max(...opens).toFixed(1)}</td>
      </tr>`;
    })
    .join("");

  const stacked = runs
    .map(
      (r) => `<section id="${r.p.id}">
    <h2>${esc(r.p.mark)} ${esc(r.p.label)}</h2>
    <p>S=${r.p.S.toLocaleString("ja-JP")}　E=${r.p.E.toLocaleString("ja-JP")}　w時下限=${r.p.floor}　α=${r.p.alpha}。${esc(r.p.blurb)}</p>
    <p class="note">直前の合成 w=${r.w.toFixed(2)}（w時 ${r.wT.toFixed(2)} × w票 ${r.wV.toFixed(2)}）　Display の Seed 割合 ${(r.seedShare * 100).toFixed(0)}%　開場の幅 ${spread(r.horses)} 倍</p>
    ${htmlOneTable(r)}
  </section>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>第2回向け 改善案1 · 設定比較</title>
<style>
  :root {
    --bg: #f4efe4;
    --paper: #fffdf7;
    --ink: #1c2416;
    --muted: #5c6754;
    --line: #d9d0bd;
    --accent: #3d5a2c;
    --warn: #8a4b1f;
    --win: #2c5a3e;
    --c1: #f7f1e4;
    --c2: #eef4ea;
    --c3: #e8f0f4;
    --c4: #f3eee8;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif;
    line-height: 1.65;
  }
  .wrap { max-width: 1280px; margin: 0 auto; padding: 2rem 1.2rem 4rem; }
  header.hero h1 { font-size: 1.55rem; margin: 0 0 .4rem; letter-spacing: .04em; }
  header.hero p { margin: .2rem 0; color: var(--muted); }
  .kicker { font-family: "Yu Gothic", "YuGothic", sans-serif; font-size: .82rem; letter-spacing: .12em; color: var(--accent); }
  nav.toc {
    display: flex; flex-wrap: wrap; gap: .5rem 1rem;
    margin: 1.4rem 0 2rem; font-family: "Yu Gothic", "YuGothic", sans-serif; font-size: .88rem;
  }
  nav.toc a { color: var(--accent); }
  section { background: var(--paper); border: 1px solid var(--line); padding: 1.3rem 1.2rem 1.5rem; margin: 0 0 1.2rem; }
  h2 { font-size: 1.15rem; margin: 0 0 .8rem; }
  ul.prop { padding-left: 1.2rem; }
  ul.prop li { margin: .4rem 0; }
  table { width: 100%; border-collapse: collapse; font-family: "Yu Gothic", "YuGothic", sans-serif; font-size: .82rem; }
  th, td { border-bottom: 1px solid var(--line); padding: .38rem .32rem; text-align: left; vertical-align: top; }
  th { color: var(--muted); font-weight: 600; font-size: .72rem; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  tr.winner-row { background: #eef5ee; }
  tr.quiet-row { color: var(--muted); }
  .note { color: var(--muted); font-size: .9rem; }
  .scroll { overflow-x: auto; max-width: 100%; }
  table.wide { min-width: 1180px; }
  table.wide th.sticky, table.wide td.sticky {
    position: sticky; background: var(--paper); z-index: 1;
  }
  table.wide th.sticky:first-child, table.wide td.sticky:first-child { left: 0; }
  table.wide td.sticky.name, table.wide thead th.sticky:nth-child(2) {
    left: 2.4rem; min-width: 11rem; box-shadow: 6px 0 8px -6px rgba(0,0,0,.12);
  }
  .grp-trial { background: var(--c1); }
  .grp-thick { background: var(--c2); }
  .grp-thick-floor { background: var(--c3); }
  .grp-proposal { background: var(--c4); }
  th.grp { text-align: center; color: var(--ink); font-size: .75rem; }
  @media print {
    body { background: #fff; }
    section { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="wrap">
  <p class="kicker">内部レポート · メンバーには出さない</p>
  <header class="hero">
    <h1>第2回向け 改善案1<br>単勝設定の比較</h1>
    <p>${esc(EVENT.title)} の実票を固定し、パラメータだけ差し替えた再生。確定は実票のみなので4条件とも同じ。</p>
    <p>単勝実票合計（締切） ${realTotal.toLocaleString("ja-JP")} スペ　D=20%　G=3000 は触らない。</p>
  </header>
  <nav class="toc">
    <a href="#idea">改善案1</a>
    <a href="#metrics">条件の要約</a>
    <a href="#compare">横並び比較</a>
    <a href="#trial">①</a>
    <a href="#thick">②</a>
    <a href="#thick-floor">③</a>
    <a href="#proposal">④</a>
  </nav>

  <section id="idea">
    <h2>改善案1の狙い</h2>
    <p>次回は予選通過者だけが本戦に出る想定なので、今回の Strength 1（開場 277 倍）のような極端な穴は出づらい。第2回では<strong>締切直前と確定のズレを小さくすることより、投票中にメンバーが見る板の感覚を揃える</strong>方を優先する。</p>
    <ul class="prop">
      <li><strong>残るズレ</strong>は、(a) 小さな Strength 差が開場本命を決めてしまうこと、(b) G=3000 の全額単勝で板が跳ね、見る時刻で本命感が分かれること。</li>
      <li><strong>④の式</strong>　<code>Seed_i = S × Strength_i^α / Σ Strength^α</code>（α=0.5 は平方根）。参考は従来どおり Display = Seed×w + Real。確定・払いは実票のみ（①の約束は維持）。</li>
      <li><strong>④の数値</strong>　S=50000、E=70000、w時下限=0.8、α=0.5。作者並びは穏やかなヒントとして一日残し、1票では飛ばしにくくする。確定との差は厚い票でも少し増える（許容）。</li>
      <li>この再生は<strong>第1回の実票・Strength のまま</strong>④を当てたもの。予選後の拮抗場では開場の圧縮がさらに効く。α は未実装（管理画面の改変が要る）。</li>
    </ul>
  </section>

  <section id="metrics">
    <h2>4条件の要約</h2>
    <table>
      <thead>
        <tr>
          <th>条件</th>
          <th class="num">S</th>
          <th class="num">E</th>
          <th class="num">w時下限</th>
          <th class="num">α</th>
          <th class="num">開場の幅</th>
          <th class="num">直前 w</th>
          <th class="num">直前 Seed%</th>
          <th class="num">参考→確定<br>（実票1000〜）</th>
          <th class="num">開場の最長</th>
        </tr>
      </thead>
      <tbody>${metricRows}</tbody>
    </table>
    <p class="note">開場の幅は全頭の最小〜最大。α=1 の①②③は開場が同じ（S は比に効かない）。④だけ Strength を圧縮するので開場が寄る。確定列は4表とも同一。</p>
  </section>

  <section id="compare">
    <h2>全頭・横並び（開場 / 直前 / 確定）</h2>
    <p>左の番号・名前は横スクロールしても残します。列の色が条件です。緑行は1着、薄い字は単勝実票ゼロ。</p>
    ${htmlCompareTable(runs)}
  </section>

  ${stacked}
</div>
</body>
</html>
`;

  const md = `# 第2回向け 改善案1（設定比較）

最終更新: 2026-08-24

**このファイルの役割:** 第2回本戦に向けた改善案1の正本（設定・式・同じ票での再生比較）。人間向け閲覧は [\`trial-odds-proposal-1.html\`](./trial-odds-proposal-1.html)。再生成は \`node --experimental-strip-types scripts/trial-odds-proposal-1.ts\`。

第1回の知見正本は [trial-odds-report.md](./trial-odds-report.md)。票・やりなおしはそこと同じ。再生は開場から締切までパラメータ固定。

---

## 狙い

次回は予選通過者のみ本戦。アプリは本戦のみ。Strength 1 の極端な穴は出づらい。

優先は **投票中のメンバーの感覚のズレを減らす**こと。締切直前と確定配当のズレ縮小は二の次（確定は実票のみの約束①は維持）。

残るズレ:

1. 小さな Strength 差が開場本命を決める（第1回の15番は開場1番人気・実票0）
2. G=3000 の全額単勝で、見る時刻によって板が別物になる

## ④で触るもの

\`\`\`
Seed_i = S × Strength_i^α / Σ Strength^α
w時 = 下限 + (1 − 下限) × 残り^指数
w票 = max(0, 1 − TV / E)
w = w時 × w票
Display_i = Seed_i × w + Real_i
参考_i = (Σ Display × (1 − D)) / Display_i
\`\`\`

| 項目 | ①今回 | ② | ③ | ④提案 |
|---|---|---|---|---|
| S | 25000 | 40000 | 40000 | 50000 |
| E | 30000 | 50000 | 50000 | 70000 |
| w時下限 | 0.5 | 0.5 | 0.8 | 0.8 |
| α | 1 | 1 | 1 | 0.5 |

G=3000、D=20%、確定=実票のみ、は全条件共通。α は未実装。

## 再生サマリ

単勝実票合計（締切）: ${realTotal.toLocaleString("ja-JP")} スペ

${runs
  .map(
    (r) =>
      `- **${r.p.mark} ${r.p.label}** 開場 ${spread(r.horses)} 倍、直前 w=${r.w.toFixed(2)}、Seed ${(r.seedShare * 100).toFixed(0)}%、実票1000〜の参考→確定 ${gapBacked(r.horses)} 倍`,
  )
  .join("\n")}

確定は4条件とも同じ（実票と D だけ）。開場は①②③が同一、④だけ α で圧縮。

## 横並び（全頭）

${mdTableCompare(runs)}

${runs.map((r) => `## ${r.p.mark} ${r.p.label}\n\n${r.p.blurb}\n\n${mdTableOne(r)}`).join("\n\n")}

## 関連

| パス | 内容 |
|---|---|
| [trial-odds-report.md](./trial-odds-report.md) | 第1回再生の知見正本 |
| [\`trial-odds-proposal-1.html\`](./trial-odds-proposal-1.html) | この案の閲覧用 |
| [\`scripts/trial-odds-proposal-1.ts\`](../../scripts/trial-odds-proposal-1.ts) | 生成スクリプト |
`;

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(OUT_HTML, html, "utf8");
  writeFileSync(OUT_MD, md, "utf8");
  console.log(`wrote ${OUT_HTML}`);
  console.log(`wrote ${OUT_MD}`);
}

main();
