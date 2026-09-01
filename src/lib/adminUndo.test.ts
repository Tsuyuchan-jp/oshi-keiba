import assert from "node:assert/strict";
import test from "node:test";
import { adminUndoAllowed } from "./adminUndo.ts";

test("Undo は明示的に許可した環境だけで有効", () => {
  assert.equal(adminUndoAllowed({}), false);
  assert.equal(adminUndoAllowed({ ALLOW_ADMIN_UNDO: "0" }), false);
  assert.equal(adminUndoAllowed({ ALLOW_ADMIN_UNDO: "1" }), true);
});
