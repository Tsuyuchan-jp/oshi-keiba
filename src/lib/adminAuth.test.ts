import assert from "node:assert/strict";
import test from "node:test";
import { isConfiguredAdmin } from "./adminAuth.ts";

const adminId = "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44";
const admin = {
  id: adminId,
  display_name: "管理者（システム）",
  role: "admin",
  balance: 0,
  deleted_at: null,
};

test("設定済みのIDとDB権限が一致する管理者だけを許可する", () => {
  assert.equal(
    isConfiguredAdmin({ userId: adminId, role: "admin", exp: Date.now() + 1 }, admin, adminId),
    true,
  );
  assert.equal(
    isConfiguredAdmin(
      { userId: adminId, role: "admin", exp: Date.now() + 1 },
      { ...admin, role: "member" },
      adminId,
    ),
    false,
  );
  assert.equal(
    isConfiguredAdmin(
      { userId: "member-with-admin-name", role: "admin", exp: Date.now() + 1 },
      { ...admin, id: "member-with-admin-name", role: "member", display_name: "管理者" },
      adminId,
    ),
    false,
  );
});
