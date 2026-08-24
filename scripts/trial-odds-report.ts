/**
 * 試運転の単勝オッズを、終了時 S・E で時系列再生して HTML レポートを出す。
 * データは D1 から集計した票（単勝・やりなおし時刻）のみ。誰が買ったかは載せない。
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

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "reports", "trial-odds-replay.html");

const EVENT = {
  title: "メンバーシップエクストラLoH",
  grantG: 3000,
  members: 16,
  seedPoolS: 25000,
  pullE: 30000,
  takeoutD: 0.2,
  wTimeFloor: 0.5,
  wTimeExp: 1,
  openedAt: 1787447445177,
  closesAt: 1787482800000,
  closedAt: 1787482824096,
  publishedAt: 1787489779138,
};

const SPECIAL = { n: 30, stake: 17800, paid: 14240 };

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
  label: string;
  blurb: string;
  S: number;
  E: number;
  floor: number;
};

const SCENARIOS: Params[] = [
  {
    id: "actual",
    label: "今回（終了時の値）",
    blurb: "S=25000・E=30000。途中で 5000 上げたあとの値で全部再生。",
    S: 25000,
    E: 30000,
    floor: 0.5,
  },
  {
    id: "start",
    label: "開始時の S・E",
    blurb: "S=20000・E=25000。上げる前の錨。",
    S: 20000,
    E: 25000,
    floor: 0.5,
  },
  {
    id: "thick",
    label: "Seed を厚く",
    blurb: "S=40000・E=50000。作者並びが残り、1票での跳ねを抑える方向。",
    S: 40000,
    E: 50000,
    floor: 0.5,
  },
  {
    id: "timehold",
    label: "時間ではあまり薄めない",
    blurb: "S・E は今回のまま、w時下限だけ 0.8。時計によるドリフトを弱める。",
    S: 25000,
    E: 30000,
    floor: 0.8,
  },
];

type HorseSnap = {
  id: string;
  real: number;
  seed: number;
  display: number;
  shown: number | null;
  confirmed: number | null;
};

type Snap = {
  t: number;
  kind: "voting" | "confirmed";
  cause: string;
  wT: number;
  wV: number;
  w: number;
  realTotal: number;
  seedShare: number;
  horses: HorseSnap[];
};

function jst(ms: number): string {
  return new Date(ms).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jstLong(ms: number): string {
  return new Date(ms).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtOdds(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

function fmtPt(n: number): string {
  return `${Math.round(n).toLocaleString("ja-JP")} スペ`;
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shortName(h: Horse): string {
  const m = h.name.match(/^(.+?)（/);
  return m ? `${m[1]}` : h.name;
}

function boardAt(
  t: number,
  active: Map<string, { horseId: string; amount: number }>,
  p: Params,
  kind: "voting" | "confirmed",
): Omit<Snap, "cause"> {
  const realBy = new Map<string, number>();
  for (const v of active.values()) {
    realBy.set(v.horseId, (realBy.get(v.horseId) ?? 0) + v.amount);
  }
  const reals = HORSES.map((h) => realBy.get(h.id) ?? 0);
  const realTotal = reals.reduce((a, b) => a + b, 0);
  const seeds = allocateSeed(
    HORSES.map((h) => h.strength),
    p.S,
  );
  const wT = wTime(t, EVENT.openedAt, EVENT.closesAt, p.floor, EVENT.wTimeExp);
  const wV = wVolume(realTotal, p.E);
  const w = wCombined(wT, wV);
  const displays = seeds.map((s, i) => displayPool(s, w, reals[i]));
  const displayTotal = displays.reduce((a, b) => a + b, 0);
  const seedMass = seeds.reduce((a, s) => a + s, 0) * w;
  const seedShare = displayTotal > 0 ? seedMass / displayTotal : 1;
  const horses: HorseSnap[] = HORSES.map((h, i) => {
    const confirmed = parimutuelOdds(reals[i], realTotal, EVENT.takeoutD);
    const reference = parimutuelOdds(displays[i], displayTotal, EVENT.takeoutD);
    return {
      id: h.id,
      real: reals[i],
      seed: seeds[i],
      display: displays[i],
      shown: kind === "voting" ? reference : confirmed,
      confirmed,
    };
  });
  return { t, kind, wT, wV, w, realTotal, seedShare, horses };
}

function replay(p: Params): Snap[] {
  const tick = 10 * 60 * 1000;
  const times = new Set<number>([EVENT.openedAt, EVENT.closedAt - 1]);
  for (const b of WIN_BETS) times.add(b.createdAt);
  for (const r of REDOS) times.add(r.at);
  for (let t = EVENT.openedAt; t < EVENT.closedAt; t += tick) times.add(t);
  const sorted = [...times].sort((a, b) => a - b);

  const byPlace = new Map<number, WinBet[]>();
  for (const b of WIN_BETS) {
    const arr = byPlace.get(b.createdAt) ?? [];
    arr.push(b);
    byPlace.set(b.createdAt, arr);
  }
  const byRedo = new Map<number, string[]>();
  for (const r of REDOS) {
    const arr = byRedo.get(r.at) ?? [];
    arr.push(r.betId);
    byRedo.set(r.at, arr);
  }

  const active = new Map<string, { horseId: string; amount: number }>();
  const out: Snap[] = [];
  for (const t of sorted) {
    const placed = byPlace.get(t) ?? [];
    const undone = byRedo.get(t) ?? [];
    for (const b of placed) active.set(b.id, { horseId: b.horseId, amount: b.amount });
    for (const id of undone) active.delete(id);

    let cause = "経過";
    if (t === EVENT.openedAt) cause = "開場";
    else if (placed.length && undone.length) cause = "投票とやりなおし";
    else if (placed.length) {
      const sum = placed.reduce((a, b) => a + b.amount, 0);
      const names = [
        ...new Set(
          placed.map((b) => {
            const h = HORSES.find((x) => x.id === b.horseId)!;
            return `${h.sort}番`;
          }),
        ),
      ];
      cause = `${names.join("・")}へ +${sum.toLocaleString("ja-JP")}`;
    } else if (undone.length) cause = "やりなおし";
    else if (t === EVENT.closedAt - 1) cause = "締切直前";

    out.push({ ...boardAt(t, active, p, "voting"), cause });
  }
  out.push({
    ...boardAt(EVENT.closedAt, active, p, "confirmed"),
    cause: "確定配当へ切替",
  });
  return out;
}

/** 場内で目が行く本命帯。これより長い開場オッズは穴として分ける */
const POPULAR_OPEN = 16;
/** グラフの縦軸上限。これ以上は「開いた」とだけ見る */
const ODDS_CAP = 40;

function sparkPath(
  points: { t: number; y: number | null }[],
  t0: number,
  t1: number,
  yMin: number,
  yMax: number,
  w: number,
  h: number,
): string {
  const spanT = Math.max(1, t1 - t0);
  const spanY = Math.max(0.1, yMax - yMin);
  const parts: string[] = [];
  let drawing = false;
  for (const p of points) {
    if (p.y == null || !Number.isFinite(p.y)) {
      drawing = false;
      continue;
    }
    const x = ((p.t - t0) / spanT) * w;
    const y = h - ((p.y - yMin) / spanY) * h;
    parts.push(`${drawing ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`);
    drawing = true;
  }
  return parts.join(" ");
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

type HorseStats = {
  horse: Horse;
  open: number | null;
  lastRef: number | null;
  confirmed: number | null;
  min: number;
  max: number;
  range: number;
  rangeCap: number;
  maxJump: number;
  maxJumpCap: number;
  real: number;
  rankOpen: number;
  rankClose: number;
  popular: boolean;
};

type Shock = {
  t: number;
  cause: string;
  popularMean: number;
  holeMax: number;
  maxAbs: number;
  horse: string;
};

function analyze(snaps: Snap[]): {
  horses: HorseStats[];
  shocks: Shock[];
  lastVote: Snap;
  confirmed: Snap;
  open: Snap;
} {
  const voting = snaps.filter((s) => s.kind === "voting");
  const open = voting[0];
  const lastVote = voting[voting.length - 1];
  const confirmed = snaps.find((s) => s.kind === "confirmed")!;

  const rank = (snap: Snap) => {
    const order = [...snap.horses].sort((a, b) => {
      const oa = a.shown ?? 1e9;
      const ob = b.shown ?? 1e9;
      return oa - ob;
    });
    const m = new Map<string, number>();
    order.forEach((h, i) => m.set(h.id, i + 1));
    return m;
  };
  const rOpen = rank(open);
  const rClose = rank(lastVote);

  const horses: HorseStats[] = HORSES.map((h) => {
    const series = voting
      .map((s) => s.horses.find((x) => x.id === h.id)!.shown)
      .filter((n): n is number => n != null);
    let maxJump = 0;
    let maxJumpCap = 0;
    for (let i = 1; i < voting.length; i++) {
      const a = voting[i - 1].horses.find((x) => x.id === h.id)!.shown;
      const b = voting[i].horses.find((x) => x.id === h.id)!.shown;
      if (a != null && b != null) {
        maxJump = Math.max(maxJump, Math.abs(b - a));
        maxJumpCap = Math.max(
          maxJumpCap,
          Math.abs(Math.min(b, ODDS_CAP) - Math.min(a, ODDS_CAP)),
        );
      }
    }
    const min = Math.min(...series);
    const max = Math.max(...series);
    const last = lastVote.horses.find((x) => x.id === h.id)!;
    const openOdds = open.horses.find((x) => x.id === h.id)!.shown;
    return {
      horse: h,
      open: openOdds,
      lastRef: last.shown,
      confirmed: last.confirmed,
      min,
      max,
      range: max - min,
      rangeCap: Math.min(max, ODDS_CAP) - Math.min(min, ODDS_CAP),
      maxJump,
      maxJumpCap,
      real: last.real,
      rankOpen: rOpen.get(h.id)!,
      rankClose: rClose.get(h.id)!,
      popular: openOdds != null && openOdds <= POPULAR_OPEN,
    };
  });

  const popularIds = new Set(horses.filter((h) => h.popular).map((h) => h.horse.id));
  const shocks: Shock[] = [];
  for (let i = 1; i < voting.length; i++) {
    const prev = voting[i - 1];
    const cur = voting[i];
    if (cur.cause === "経過" || cur.cause === "締切直前") continue;
    const deltas: { abs: number; id: string; popular: boolean }[] = [];
    for (const h of HORSES) {
      const a = prev.horses.find((x) => x.id === h.id)!.shown;
      const b = cur.horses.find((x) => x.id === h.id)!.shown;
      if (a == null || b == null) continue;
      deltas.push({ abs: Math.abs(b - a), id: h.id, popular: popularIds.has(h.id) });
    }
    const maxD = deltas.reduce((m, d) => (d.abs > m.abs ? d : m), deltas[0]);
    const hs = HORSES.find((x) => x.id === maxD.id)!;
    const pop = deltas.filter((d) => d.popular);
    const hole = deltas.filter((d) => !d.popular);
    shocks.push({
      t: cur.t,
      cause: cur.cause,
      popularMean: mean(pop.map((d) => d.abs)),
      holeMax: hole.length ? Math.max(...hole.map((d) => d.abs)) : 0,
      maxAbs: maxD.abs,
      horse: `${hs.sort}番 ${shortName(hs)}`,
    });
  }
  shocks.sort((a, b) => b.popularMean - a.popularMean);

  return { horses, shocks, lastVote, confirmed, open };
}

function scenarioRow(p: Params, a: ReturnType<typeof analyze>): string {
  const pop = a.horses.filter((h) => h.popular);
  const hole = a.horses.filter((h) => !h.popular);
  const switchGap = mean(
    pop
      .filter((h) => h.real >= 1000 && h.lastRef != null && h.confirmed != null)
      .map((h) => Math.abs(h.lastRef! - h.confirmed!)),
  );
  return `<tr>
    <td>${esc(p.label)}</td>
    <td class="num">${mean(pop.map((h) => h.rangeCap)).toFixed(1)}</td>
    <td class="num">${Math.max(...pop.map((h) => h.maxJumpCap)).toFixed(1)}</td>
    <td class="num">${switchGap.toFixed(1)}</td>
    <td class="num">${mean(hole.map((h) => Math.min(h.lastRef ?? 0, 999))).toFixed(0)}</td>
    <td class="num">${(a.lastVote.seedShare * 100).toFixed(0)}%</td>
  </tr>`;
}

function cardSpark(h: HorseStats, snaps: Snap[], t0: number, t1: number): string {
  const voting = snaps.filter((s) => s.kind === "voting");
  const pts = voting.map((s) => ({
    t: s.t,
    y: s.horses.find((x) => x.id === h.horse.id)!.shown,
  }));
  const clipped = pts.map((p) => ({
    t: p.t,
    y: p.y == null ? null : Math.min(p.y, ODDS_CAP),
  }));
  const ys = clipped.map((p) => p.y).filter((n): n is number => n != null);
  const yMin = Math.max(0.8, Math.min(...ys) * 0.92);
  const yMax = h.popular ? Math.max(16, Math.max(...ys) * 1.08) : ODDS_CAP;
  const w = 280;
  const ht = 72;
  const d = sparkPath(clipped, t0, t1, yMin, yMax, w, ht);
  const clippedNote = h.max > ODDS_CAP ? `　${ODDS_CAP}倍超は頭打ち` : "";
  const winner = h.horse.finish === 1 ? " winner" : "";
  const backed = h.real > 0 ? "" : " quiet";
  const rankMove = h.rankClose - h.rankOpen;
  const rankTxt =
    rankMove === 0 ? "順位そのまま" : rankMove < 0 ? `${-rankMove}つ人気化` : `${rankMove}つ人気薄`;
  return `<article class="card${winner}${backed}">
    <header>
      <span class="num-badge">${h.horse.sort}</span>
      <div>
        <h3>${esc(h.horse.name)}</h3>
        <p class="meta">Strength ${h.horse.strength}　${h.horse.finish}着　単勝実票 ${fmtPt(h.real)}</p>
      </div>
    </header>
    <svg viewBox="0 0 ${w} ${ht}" class="spark" role="img" aria-label="${esc(shortName(h.horse))}の参考オッズ">
      <path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>
    <dl class="stats">
      <div><dt>開場</dt><dd>${fmtOdds(h.open)}</dd></div>
      <div><dt>締切直前</dt><dd>${fmtOdds(h.lastRef)}</dd></div>
      <div><dt>確定</dt><dd>${fmtOdds(h.confirmed)}</dd></div>
      <div><dt>振幅</dt><dd>${h.max > ODDS_CAP ? `${h.rangeCap.toFixed(0)}+` : h.range.toFixed(1)}</dd></div>
    </dl>
    <p class="foot">${rankTxt}　本命帯の跳ね ${h.maxJumpCap.toFixed(1)} 倍${clippedNote}</p>
  </article>`;
}

function popularOverlay(horses: HorseStats[], snaps: Snap[], t0: number, t1: number): string {
  const voting = snaps.filter((s) => s.kind === "voting");
  const pop = horses.filter((h) => h.popular && (h.real >= 500 || h.horse.finish === 1));
  const w = 640;
  const ht = 220;
  const paths = pop
    .map((h) => {
      const pts = voting.map((s) => {
        const y = s.horses.find((x) => x.id === h.horse.id)!.shown;
        return { t: s.t, y: y == null ? null : Math.min(y, 20) };
      });
      const d = sparkPath(pts, t0, t1, 1, 20, w, ht);
      const cls = h.horse.finish === 1 ? "winline" : "popline";
      return `<path class="${cls}" d="${d}" fill="none" stroke-width="${h.horse.finish === 1 ? 2.4 : 1.3}"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${w} ${ht}" class="wchart" role="img" aria-label="本命帯の参考オッズ">
    <text x="4" y="12" font-size="11" fill="#5c6754">20倍</text>
    <text x="4" y="${ht - 4}" font-size="11" fill="#5c6754">1倍</text>
    ${paths}
  </svg>`;
}

function wChart(snaps: Snap[], t0: number, t1: number): string {
  const voting = snaps.filter((s) => s.kind === "voting");
  const w = 640;
  const h = 160;
  const mk = (key: "w" | "wT" | "wV", cls: string) => {
    const pts = voting.map((s) => ({ t: s.t, y: s[key] }));
    return `<path class="${cls}" d="${sparkPath(pts, t0, t1, 0, 1, w, h)}" fill="none" stroke-width="2"/>`;
  };
  return `<svg viewBox="0 0 ${w} ${h}" class="wchart" role="img" aria-label="w の推移">
    ${mk("wT", "wt")}
    ${mk("wV", "wv")}
    ${mk("w", "ww")}
  </svg>`;
}

function main(): void {
  const runs = SCENARIOS.map((p) => {
    const snaps = replay(p);
    return { p, snaps, a: analyze(snaps) };
  });
  const actual = runs[0];
  const { snaps, a } = actual;
  const t0 = EVENT.openedAt;
  const t1 = EVENT.closedAt;
  const pop = a.horses.filter((h) => h.popular);
  const hole = a.horses.filter((h) => !h.popular);
  const unbacked = a.horses.filter((h) => h.real <= 0);
  const thickBacked = pop.filter((h) => h.real >= 1000 && h.lastRef != null && h.confirmed != null);
  const switchGap = mean(thickBacked.map((h) => Math.abs(h.lastRef! - h.confirmed!)));
  const switchGapAllPop = mean(
    pop
      .filter((h) => h.real > 0 && h.lastRef != null && h.confirmed != null)
      .map((h) => Math.abs(h.lastRef! - h.confirmed!)),
  );
  const allinShocks = a.shocks.filter((s) => s.cause.includes("3,000"));
  const topShock = a.shocks[0];
  const winner = a.horses.find((h) => h.horse.finish === 1)!;
  const winnerJump = `${fmtOdds(winner.open)} → 直前 ${fmtOdds(winner.lastRef)} → 確定 ${fmtOdds(winner.confirmed)}`;

  const takeaways = [
    `メンバーが眺めていた本命帯（開場 ${POPULAR_OPEN} 倍以内の ${pop.length} 頭）では、全額単勝が乗るたびに平均 ${topShock.popularMean.toFixed(1)} 倍動きました。いちばん効いたのは ${jst(topShock.t)} の「${esc(topShock.cause)}」。G=3000 を単勝に全部載せると、Seed 込みでも板がはっきり跳ねます。1着 ${esc(shortName(winner.horse))} は ${winnerJump} です。`,
    `穴側（開場 ${POPULAR_OPEN} 倍超）は別問題です。Seed が薄まると票のない頭の参考が数十〜数百倍まで開き、票が1本乗ると一気に縮みます。グラフは ${ODDS_CAP} 倍で頭打ちにしています。この「穴が時間だけで開いていく」動きが、動きすぎ感の本体になりやすいです。`,
    `締切直前でも Display の ${(a.lastVote.seedShare * 100).toFixed(0)}% はまだ Seed です（w=${a.lastVote.w.toFixed(2)}）。ただし実票が 1000 以上乗った本命は、参考→確定が平均 ${switchGap.toFixed(1)} 倍しかずれません（1着は直前 ${fmtOdds(winner.lastRef)} → 確定 ${fmtOdds(winner.confirmed)}）。締切で数字が飛ぶのは、実票の薄い頭と、票がゼロで「—」になる穴です。`,
  ];

  const shockRows = a.shocks
    .slice(0, 8)
    .map(
      (s) => `<tr>
        <td>${jst(s.t)}</td>
        <td>${esc(s.cause)}</td>
        <td class="num">${s.popularMean.toFixed(2)}</td>
        <td class="num">${s.holeMax >= 100 ? s.holeMax.toFixed(0) : s.holeMax.toFixed(1)}</td>
        <td>${esc(s.horse)}</td>
      </tr>`,
    )
    .join("");

  const tableRows = [...a.horses]
    .sort((x, y) => x.horse.sort - y.horse.sort)
    .map((h) => {
      const gap =
        h.lastRef != null && h.confirmed != null
          ? (h.confirmed - h.lastRef).toFixed(1)
          : "—";
      const cls = h.horse.finish === 1 ? "winner-row" : h.real <= 0 ? "quiet-row" : "";
      return `<tr class="${cls}">
        <td class="num">${h.horse.sort}</td>
        <td>${esc(h.horse.name)}</td>
        <td class="num">${h.horse.strength}</td>
        <td class="num">${h.horse.finish}</td>
        <td class="num">${fmtOdds(h.open)}</td>
        <td class="num">${fmtOdds(h.lastRef)}</td>
        <td class="num">${fmtOdds(h.confirmed)}</td>
        <td class="num">${gap}</td>
        <td class="num">${h.range.toFixed(1)}</td>
        <td class="num">${fmtPt(h.real)}</td>
        <td class="num">${h.rankOpen}→${h.rankClose}</td>
      </tr>`;
    })
    .join("");

  const scenarioRows = runs.map((r) => scenarioRow(r.p, r.a)).join("");

  const cards = a.horses.map((h) => cardSpark(h, snaps, t0, t1)).join("");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>試運転 単勝オッズ再生レポート</title>
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
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: "Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif;
    line-height: 1.65;
  }
  .wrap { max-width: 1100px; margin: 0 auto; padding: 2rem 1.2rem 4rem; }
  header.hero h1 { font-size: 1.7rem; margin: 0 0 .4rem; letter-spacing: .04em; }
  header.hero p { margin: .2rem 0; color: var(--muted); }
  .kicker { font-family: "Yu Gothic", "YuGothic", sans-serif; font-size: .82rem; letter-spacing: .12em; text-transform: none; color: var(--accent); }
  nav.toc {
    display: flex; flex-wrap: wrap; gap: .5rem 1rem;
    margin: 1.4rem 0 2rem; font-family: "Yu Gothic", "YuGothic", sans-serif; font-size: .88rem;
  }
  nav.toc a { color: var(--accent); }
  section { background: var(--paper); border: 1px solid var(--line); padding: 1.3rem 1.2rem 1.5rem; margin: 0 0 1.2rem; }
  h2 { font-size: 1.2rem; margin: 0 0 .8rem; }
  h3 { font-size: 1rem; margin: 0; }
  ol.take { padding-left: 1.2rem; }
  ol.take li { margin: .55rem 0; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: .7rem; margin: 1rem 0; }
  .metric { border: 1px solid var(--line); padding: .7rem .8rem; background: #faf6ec; }
  .metric b { display: block; font-size: 1.35rem; font-family: "Yu Gothic", "YuGothic", sans-serif; }
  .metric span { color: var(--muted); font-size: .8rem; font-family: "Yu Gothic", "YuGothic", sans-serif; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .8rem; }
  article.card { border: 1px solid var(--line); padding: .75rem .8rem .6rem; background: #fff; }
  article.card.winner { border-color: var(--win); box-shadow: inset 3px 0 0 var(--win); }
  article.card.quiet { opacity: .78; }
  article.card header { display: flex; gap: .6rem; align-items: flex-start; margin-bottom: .35rem; }
  .num-badge {
    font-family: "Yu Gothic", "YuGothic", sans-serif;
    font-weight: 700; min-width: 1.8rem; text-align: center;
    background: var(--ink); color: var(--bg); padding: .15rem 0;
  }
  article.card.winner .num-badge { background: var(--win); }
  .meta, .foot { margin: 0; color: var(--muted); font-size: .78rem; font-family: "Yu Gothic", "YuGothic", sans-serif; }
  .spark { width: 100%; height: 72px; color: var(--accent); display: block; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: .3rem; margin: .35rem 0 .2rem; }
  .stats dt { font-size: .7rem; color: var(--muted); font-family: "Yu Gothic", "YuGothic", sans-serif; }
  .stats dd { margin: 0; font-family: "Yu Gothic", "YuGothic", sans-serif; font-variant-numeric: tabular-nums; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-family: "Yu Gothic", "YuGothic", sans-serif; font-size: .85rem; }
  th, td { border-bottom: 1px solid var(--line); padding: .4rem .35rem; text-align: left; vertical-align: top; }
  th { color: var(--muted); font-weight: 600; font-size: .75rem; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  tr.winner-row { background: #eef5ee; }
  tr.quiet-row { color: var(--muted); }
  .note { color: var(--muted); font-size: .9rem; }
  .wchart { width: 100%; max-width: 640px; height: auto; }
  .wchart .wt { stroke: #a3b48f; }
  .wchart .wv { stroke: #c49a6c; }
  .wchart .ww { stroke: #3d5a2c; }
  .wchart .winline { stroke: #2c5a3e; }
  .wchart .popline { stroke: #7a8f6a; opacity: .85; }
  .legend { font-family: "Yu Gothic", "YuGothic", sans-serif; font-size: .8rem; color: var(--muted); }
  .legend i { display: inline-block; width: 1.1rem; height: 3px; margin: 0 .25rem 0 .6rem; vertical-align: middle; }
  .legend i.wt { background: #a3b48f; } .legend i.wv { background: #c49a6c; } .legend i.ww { background: #3d5a2c; }
  .warn { border-left: 3px solid var(--warn); padding-left: .8rem; }
  @media (max-width: 800px) {
    .metrics, .grid, .stats { grid-template-columns: 1fr 1fr; }
  }
  @media print {
    body { background: #fff; }
    section { break-inside: avoid; border: none; padding: 0 0 1rem; }
  }
</style>
</head>
<body>
<div class="wrap">
  <p class="kicker">内部レポート · メンバーには出さない</p>
  <header class="hero">
    <h1>${esc(EVENT.title)}<br>単勝オッズの再生</h1>
    <p>投票 ${jstLong(EVENT.openedAt)} 〜 ${jstLong(EVENT.closedAt)}（約 ${((EVENT.closedAt - EVENT.openedAt) / 3600000).toFixed(1)} 時間）</p>
    <p>終了時の値で再生：S=${EVENT.seedPoolS.toLocaleString("ja-JP")}　E=${EVENT.pullE.toLocaleString("ja-JP")}　D=20%　w時下限=0.5　G=${EVENT.grantG}　付与 ${EVENT.members} 人</p>
    <p>途中で S・E を 5000 上げた事実は再現していません。開場から締切まで終了時の値を使っています。</p>
  </header>
  <nav class="toc">
    <a href="#take">先に読む</a>
    <a href="#board">16頭の動き</a>
    <a href="#shock">跳ねた瞬間</a>
    <a href="#seed">初期オッズの残り方</a>
    <a href="#tune">S・E を変えたら</a>
    <a href="#table">数字表</a>
    <a href="#special">連勝の特払い</a>
  </nav>

  <section id="take">
    <h2>先に読む</h2>
    <ol class="take">
      ${takeaways.map((t) => `<li>${t}</li>`).join("")}
    </ol>
    <div class="metrics">
      <div class="metric"><span>単勝の実票合計（締切）</span><b>${fmtPt(a.lastVote.realTotal)}</b></div>
      <div class="metric"><span>直前の Seed の割合</span><b>${(a.lastVote.seedShare * 100).toFixed(0)}%</b></div>
      <div class="metric"><span>本命帯の振幅（平均・${ODDS_CAP}倍まで）</span><b>${mean(pop.map((h) => h.rangeCap)).toFixed(1)} 倍</b></div>
      <div class="metric"><span>実票1000以上の参考→確定</span><b>${switchGap.toFixed(1)} 倍</b></div>
    </div>
    <p class="note">場内に出ていたのは参考オッズです。グラフの縦軸は倍率で、<strong>下がるほど本命化</strong>、上がるほど人気薄です。ライブ更新と同じ式（Display = Seed×w + Real）で再生しています。</p>
  </section>

  <section id="board">
    <h2>メンバー目線の単勝</h2>
    <p>開場 ${POPULAR_OPEN} 倍以内のうち、単勝が 500 スペ以上乗った頭を同じ縦軸（1〜20倍）に重ねています。太い緑が1着。下がるほど本命化です。</p>
    ${popularOverlay(a.horses, snaps, t0, t1)}
    <p class="note">緑の左線は1着 ${esc(winner.horse.name)}。薄いカードは単勝実票ゼロ。1頭ずつの縦軸は頭ごとに違うので、穴は ${ODDS_CAP} 倍で頭打ちにしています。票なしは ${unbacked.length} 頭。</p>
    <div class="grid">${cards}</div>
  </section>

  <section id="shock">
    <h2>板が跳ねた瞬間</h2>
    <p>本命帯の動きは、時計より<strong>単勝の大口</strong>です。パリミュチュエルなので、1頭への 3000 は他の本命の数字もまとめて動かします。穴側の桁飛びは別列に分けました。</p>
    <p class="note">+3,000 の単勝は ${allinShocks.length} 回です。</p>
    <table>
      <thead><tr><th>時刻</th><th>何が起きたか</th><th class="num">本命帯の平均変化</th><th class="num">穴の最大</th><th>いちばん動いた頭</th></tr></thead>
      <tbody>${shockRows}</tbody>
    </table>
  </section>

  <section id="seed">
    <h2>初期オッズは、締切まで残っていた</h2>
    <p>w = w時 × w票。w時は時計だけでは 0.5 まで。w票は単勝実票が E に近づくと落ちる。掛け算なので、単勝が ${fmtPt(a.lastVote.realTotal)}（E の ${(a.lastVote.realTotal / EVENT.pullE * 100).toFixed(0)}%）でも、直前の w は ${a.lastVote.w.toFixed(2)} 残ります。</p>
    ${wChart(snaps, t0, t1)}
    <p class="legend"><i class="wt"></i>w時（時計）<i class="wv"></i>w票（単勝の量）<i class="ww"></i>合成 w（Seed の残り）</p>
    <p class="warn">よく買われた本命は、最後の参考と確定が近いです（1000 スペ以上で平均 ${switchGap.toFixed(1)} 倍、薄い票まで入れると ${switchGapAllPop.toFixed(1)} 倍）。票のない頭は参考の数字が消えて「—」になります。見ていて楽しかった穴の板と、払う数字のギャップはここに出ます。</p>
  </section>

  <section id="tune">
    <h2>同じ票で、S・E だけ変えた場合</h2>
    <p>票の時刻と金額は変えず、パラメータだけ差し替えています。小さくしたいのは主に「振幅」と「最大の瞬間変化」。締切の切替を小さくするには、直前の Seed 割合を落とす（E を下げる／単勝がもっと乗る）か、確定側を見せない、のどちらかです。</p>
    <table>
      <thead>
        <tr>
          <th>シナリオ</th>
          <th class="num">本命帯の振幅</th>
          <th class="num">本命帯の最大跳ね</th>
          <th class="num">本命帯 参考→確定（実票1000〜）</th>
          <th class="num">穴の直前オッズ</th>
          <th class="num">直前 Seed 割合</th>
        </tr>
      </thead>
      <tbody>${scenarioRows}</tbody>
    </table>
    <ul>
      ${runs
        .map((r) => `<li><strong>${esc(r.p.label)}</strong> — ${esc(r.p.blurb)}</li>`)
        .join("")}
    </ul>
    <p class="note">開始時の S・E の方が E が小さいので、同じ単勝量でも Seed は早く落ち、穴はより開きます。厚くすると本命帯の跳ねは小さい代わりに、作者並びが長く残ります。「動きすぎ」を抑えるなら厚め（とくに穴の開く速さ）、実票の面白さを出すなら E を小さめ、というトレードオフです。</p>
  </section>

  <section id="table">
    <h2>開場・直前・確定</h2>
    <table>
      <thead>
        <tr>
          <th class="num">#</th><th>ウマ娘</th><th class="num">Str</th><th class="num">着</th>
          <th class="num">開場</th><th class="num">直前</th><th class="num">確定</th>
          <th class="num">直前→確定</th><th class="num">振幅</th><th class="num">実票</th><th class="num">人気順</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </section>

  <section id="special">
    <h2>連勝の特払い（このレポートの本筋ではない）</h2>
    <p>単勝以外は、締切時点で当たり実票がゼロだったため <strong>4賭式とも特払い B</strong>（100→80）になりました。対象 ${SPECIAL.n} 票・賭け金 ${fmtPt(SPECIAL.stake)} → 戻し ${fmtPt(SPECIAL.paid)}。控除ぶんは ${fmtPt(SPECIAL.stake - SPECIAL.paid)} です。</p>
    <p class="note">キャリーオーバーを考えるなら、この「不成立の山」を次週に回す設計の材料になります。特払い率そのものは、今回のオッズの動きとは独立です。</p>
  </section>
</div>
</body>
</html>
`;

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, html, "utf8");
  console.log(`wrote ${OUT}`);
  console.log(
    JSON.stringify(
      {
        realTotal: a.lastVote.realTotal,
        w: a.lastVote.w,
        seedShare: a.lastVote.seedShare,
        popularRange: mean(pop.map((h) => h.rangeCap)),
        switchGap,
        topShock,
        winner: { open: winner.open, last: winner.lastRef, confirmed: winner.confirmed },
        scenarios: runs.map((r) => ({
          id: r.p.id,
          popularRange: mean(r.a.horses.filter((h) => h.popular).map((h) => h.rangeCap)),
          maxJump: Math.max(...r.a.horses.filter((h) => h.popular).map((h) => h.maxJumpCap)),
          seedShare: r.a.lastVote.seedShare,
        })),
      },
      null,
      2,
    ),
  );
}

main();
