import assert from "node:assert/strict";
import { test } from "node:test";
import { memberUmabashiraModalHtml, memberUmabashiraScript } from "./memberUmabashira.ts";
import type { Board } from "./storeTypes.ts";

const board = {
  event: {
    id: "event-1",
    title: "確認レース",
    status: "voting",
    score_setup: null,
  },
  horses: [
    {
      number: 1,
      referenceOdds: 2.4,
      horse: {
        id: "horse-1",
        uma_name: "スペシャルウィーク",
        runner_name: "トレーナー",
        chara_id: null,
        dress_id: null,
        strength: 100,
        scratched: 0,
        score_input: null,
      },
    },
  ],
} as unknown as Board;

test("メンバー向けウマ柱は全画面モーダル用の紙面と操作案内を持つ", () => {
  const html = memberUmabashiraModalHtml(board);
  assert.match(html, /id="umabashira-modal"/);
  assert.match(html, /class="umabashira-paper"/);
  assert.match(html, /確認レース/);
  assert.match(html, /data-sel="horse-1"/);
  assert.match(html, /class="odds-now">2\.4/);
  assert.match(html, /スマホは2本指、PCはホイール/);
  assert.match(html, /id="umabashira-zoom-reset"/);
});

test("ウマ柱の拡大・移動スクリプトはブラウザで解釈できる", () => {
  const source = memberUmabashiraScript()
    .replace(/^<script>/, "")
    .replace(/<\/script>$/, "");
  assert.doesNotThrow(() => new Function(source));
  assert.match(source, /pointerdown/);
  assert.match(source, /pointermove/);
  assert.match(source, /Math\.hypot/);
  assert.match(source, /addEventListener\("wheel"/);
  assert.match(source, /paper\.style\.zoom/);
  assert.match(source, /e\.target === modal/);
  assert.match(source, /\(viewportSize - contentSize\) \/ 2/);
});
