import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { adminUndoAllowed } from "./adminUndo.ts";

test("Undo は明示的に許可した環境だけで有効", () => {
  assert.equal(adminUndoAllowed({}), false);
  assert.equal(adminUndoAllowed({ ALLOW_ADMIN_UNDO: "0" }), false);
  assert.equal(adminUndoAllowed({ ALLOW_ADMIN_UNDO: "1" }), true);
});

test("ローカル開発だけUndoとデモ初期化を有効にし、通常設定は無効にする", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const wranglerConfig = readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8");
  assert.match(packageJson.scripts.dev, /--var ALLOW_ADMIN_UNDO:1/);
  assert.match(packageJson.scripts.dev, /--var ALLOW_DEMO_RESET:1/);
  assert.match(wranglerConfig, /"ALLOW_ADMIN_UNDO"\s*:\s*"0"/);
  assert.match(wranglerConfig, /"ALLOW_DEMO_RESET"\s*:\s*"0"/);
});
