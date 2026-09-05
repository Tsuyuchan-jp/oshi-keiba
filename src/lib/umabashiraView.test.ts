import assert from "node:assert/strict";
import { test } from "node:test";
import { umaNameCharsHtml, umabashiraPaperHtml } from "./umabashiraPaper.ts";
import { umabashiraCourseLine, umabashiraFileBase, umabashiraView } from "./umabashiraView.ts";
import type { Board } from "./storeTypes.ts";

const board = {
  event: {
    id: "event-1",
    title: "確認レース",
    status: "setup",
    score_setup: JSON.stringify({
      conditions: { courseKey: "10606", weather: 1, groundCondition: 1, season: 3 },
      requirements: { speedCap: 1200, staminaNoTempt: 600, staminaWithTempt: 800, staminaRace: false, power: 700, guts: 400, wisdom: 600 },
    }),
  },
  horses: [
    {
      number: 1,
      referenceOdds: 4.8,
      horse: {
        id: "horse-1",
        uma_name: "スペシャルウィーク",
        runner_name: "トレーナー I",
        chara_id: 1001,
        dress_id: 100101,
        strength: 128.4,
        scratched: 0,
        score_input: JSON.stringify({
          stats: { speed: 1200, stamina: 950, power: 1100, guts: 850, wisdom: 1000 },
          aptitudes: { turf: "S", dirt: "G", short: "G", mile: "A", medium: "S", long: "A", nige: "C", senkou: "A", sashi: "A", oikomi: "C" },
          skillNames: ["末脚", "コーナー巧者○"],
          skillIds: [null, null],
          styleKey: "leader",
        }),
      },
    },
    {
      number: 2,
      referenceOdds: 12,
      horse: {
        id: "horse-2",
        uma_name: "欠場",
        runner_name: "",
        chara_id: null,
        dress_id: null,
        strength: 1,
        scratched: 1,
        score_input: null,
      },
    },
    {
      number: 3,
      referenceOdds: null,
      horse: {
        id: "horse-3",
        uma_name: "直置き",
        runner_name: "花子",
        chara_id: null,
        dress_id: null,
        strength: 92,
        scratched: 0,
        score_input: null,
      },
    },
  ],
} as unknown as Board;

test("ウマ柱は取消を列から外し、setup でも参考オッズを出す", () => {
  const sheet = umabashiraView(board);
  assert.equal(sheet.horses.length, 2);
  assert.equal(sheet.horses[0]!.umaName, "スペシャルウィーク");
  assert.equal(sheet.horses[0]!.runnerName, "トレーナー I");
  assert.equal(sheet.horses[0]!.styleLabel, "先行");
  assert.equal(sheet.horses[0]!.petitUrl, "/images/umamusume/petit/petit_1001_100101_0010.png");
  assert.equal(sheet.horses[0]!.strength, 128.4);
  assert.equal(sheet.horses[0]!.odds, 4.8);
  assert.deepEqual(sheet.horses[0]!.stats, [1200, 950, 1100, 850, 1000]);
  assert.deepEqual(sheet.horses[0]!.sp, { base: 2, effective: 2, white: 2, gold: 0 });
  assert.equal(sheet.horses[0]!.mark, "◎");
  assert.equal(sheet.horses[1]!.mark, "○");
  assert.equal(sheet.horses[1]!.stats, null);
  assert.equal(sheet.horses[1]!.apt, null);
  assert.equal(sheet.horses[1]!.sp, null);
  assert.equal(sheet.horses[1]!.styleLabel, null);
  assert.equal(sheet.courseLine, "東京　芝2400m　秋・晴・良　｜　2頭");
});

test("投票開始後は参考オッズを出し、適性はモック短縮", () => {
  const voting = {
    ...board,
    event: { ...board.event, status: "voting" },
  } as unknown as Board;
  const sheet = umabashiraView(voting);
  assert.equal(sheet.horses[0]!.odds, 4.8);
  assert.deepEqual(sheet.horses[0]!.apt, [
    { text: "芝S", highlight: true },
    { text: "中S", highlight: true },
    { text: "先A", highlight: false },
  ]);
});

test("ウマ娘名は1文字ずつ包む", () => {
  assert.equal(umaNameCharsHtml("麦"), "<span>麦</span>");
  assert.equal(umaNameCharsHtml("スペ"), "<span>ス</span><span>ペ</span>");
  assert.equal(umaNameCharsHtml("オー"), '<span>オ</span><span class="choon">ー</span>');
});

test("コース行の欠けは —。ファイル名は日付と開催名", () => {
  assert.equal(umabashiraCourseLine(null, 0), "—");
  assert.equal(
    umabashiraFileBase("第3回春の合同練習杯", new Date("2026-09-04T16:00:00Z")),
    "2026-09-05-第3回春の合同練習杯-ウマ柱",
  );
});

test("ファイル名に使えない文字を置換し、空の開催名は既定名にする", () => {
  const now = new Date("2026-09-04T16:00:00Z");
  assert.equal(umabashiraFileBase("  春/秋:*?杯  ", now), "2026-09-05-春_秋___杯-ウマ柱");
  assert.equal(umabashiraFileBase("   ", now), "2026-09-05-開催-ウマ柱");
});

test("計算不能な評価点と参考オッズは欠損として扱う", () => {
  const invalid = {
    ...board,
    horses: board.horses.map((entry, index) => index === 0
      ? {
          ...entry,
          referenceOdds: Number.NaN,
          horse: { ...entry.horse, strength: Number.POSITIVE_INFINITY },
        }
      : entry),
  } as unknown as Board;
  const horse = umabashiraView(invalid).horses[0]!;
  assert.equal(horse.strength, null);
  assert.equal(horse.odds, null);
  assert.equal(horse.mark, "─");
});

test("戦略例外スキルをウマ柱のSP点数へ反映する", () => {
  const scoreInput = JSON.parse(String(board.horses[0]!.horse.score_input));
  scoreInput.skillNames = ["コンセントレーション", "コーナー巧者○"];
  scoreInput.skillIds = [200431, null];
  const strategicBoard = {
    ...board,
    horses: board.horses.map((entry, index) => index === 0
      ? { ...entry, horse: { ...entry.horse, score_input: JSON.stringify(scoreInput) } }
      : entry),
  } as unknown as Board;
  const withoutStrategic = umabashiraView(strategicBoard).horses[0]!.sp!.base;
  const withStrategic = umabashiraView(strategicBoard, [
    { skillId: 200431, name: "コンセントレーション", points: 5, memo: "テスト" },
  ]).horses[0]!.sp!.base;
  assert.ok(withStrategic > withoutStrategic);
});

test("出走0頭と最大18頭でも列数を紙面へ渡せる", () => {
  const emptySheet = umabashiraView({ ...board, horses: [] } as unknown as Board);
  assert.equal(emptySheet.horses.length, 0);
  assert.match(umabashiraPaperHtml(emptySheet), /style="--n:0"/);

  const template = board.horses[0]!;
  const fullBoard = {
    ...board,
    horses: Array.from({ length: 18 }, (_, index) => ({
      ...template,
      number: index + 1,
      horse: {
        ...template.horse,
        id: `horse-${index + 1}`,
        uma_name: `ウマ${index + 1}`,
        strength: 100 - index,
      },
    })),
  } as unknown as Board;
  const fullHtml = umabashiraPaperHtml(umabashiraView(fullBoard));
  assert.equal((fullHtml.match(/class="col tint-w/g) ?? []).length, 18);
  assert.match(fullHtml, /style="--n:18"/);
  assert.match(fullHtml, /class="waku-box w8"/);
});

test("紙面へ差し込む開催名・馬名・出走者名をHTMLとして解釈しない", () => {
  const unsafe = {
    ...board,
    event: { ...board.event, title: "<開催&杯>" },
    horses: board.horses.map((entry, index) => index === 0
      ? {
          ...entry,
          horse: { ...entry.horse, uma_name: "<ウマ>", runner_name: "A&B" },
        }
      : entry),
  } as unknown as Board;
  const html = umabashiraPaperHtml(umabashiraView(unsafe));
  assert.match(html, /&lt;開催&amp;杯&gt;/);
  assert.match(html, /aria-label="&lt;ウマ&gt;"/);
  assert.match(html, /A&amp;B/);
  assert.doesNotMatch(html, /<開催|<ウマ>/);
});

test("紙面はウマ番から枠色箱を塗り、評価点とSPを内側 span にする", () => {
  const html = umabashiraPaperHtml(umabashiraView(board));
  assert.match(html, /class="col tint-w1"/);
  assert.match(html, /class="waku-box w1"/);
  assert.match(html, /class="style style-先"/);
  assert.match(html, /score-cell"><b><span>128\.4<\/span>/);
  assert.match(html, /small class="gold"><span>金/);
  assert.match(html, /class="grain"/);
});
