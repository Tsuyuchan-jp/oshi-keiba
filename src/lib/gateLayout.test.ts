import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { memberSceneSlotScript } from "./memberSceneSlot.ts";

function runSceneScript(search: string, hour: number, preference?: "day" | "night"): { slot: string; tick: () => void } {
  const scene = { dataset: { slot: "" } };
  let tick = () => {};
  const source = memberSceneSlotScript().replace(/^<script>|<\/script>$/g, "");
  vm.runInNewContext(source, {
    URLSearchParams,
    location: { search },
    document: { querySelector: () => scene },
    Intl: {
      DateTimeFormat: function () {
        return { formatToParts: () => [{ type: "hour", value: String(hour) }] };
      },
    },
    Date,
    Number,
    localStorage: preference ? { getItem: () => preference } : undefined,
    setInterval: (callback: () => void) => { tick = callback; return 0; },
  });
  return { slot: scene.dataset.slot, tick };
}

test("入場背景はJSTの時刻から時間帯を自動判定する", () => {
  assert.equal(runSceneScript("", 9).slot, "day");
  assert.equal(runSceneScript("", 17).slot, "dusk");
  assert.equal(runSceneScript("", 22).slot, "night");
});

test("入場背景のURL指定は自動更新後も固定される", () => {
  const result = runSceneScript("?slot=dusk", 9);
  assert.equal(result.slot, "dusk");
  result.tick();
  assert.equal(result.slot, "dusk");
});

test("入場背景は利用者の固定設定を時刻より優先する", () => {
  assert.equal(runSceneScript("", 22, "day").slot, "day");
  assert.equal(runSceneScript("", 9, "night").slot, "night");
});
