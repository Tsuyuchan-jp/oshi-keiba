import assert from "node:assert/strict";
import { test } from "node:test";
import { GATE_CSS } from "./gateCss.ts";

test("入場背景には時間帯ごとの画像が用意されている", () => {
  assert.match(GATE_CSS, /\.scene\[data-slot="day"\].*day-9x16\.png/);
  assert.match(GATE_CSS, /\.scene\[data-slot="dusk"\].*dusk-9x16\.png/);
  assert.match(GATE_CSS, /\.scene\[data-slot="night"\].*night-glass-9x16\.png/);
  assert.match(GATE_CSS, /var\(--scene-landscape\)/);
});
