import { env } from "cloudflare:workers";
import { describe, expect, test } from "vitest";
import {
  joinRace,
  loginAdmin,
  openRace,
  postForm,
  redirectMessage,
  registerMember,
  seedReadyRace,
} from "./helpers";

type RaceContext = {
  adminCookie: string;
  memberCookie: string;
  memberId: string;
  eventId: string;
  horseIds: string[];
};

async function prepareRace(opts: {
  join?: boolean;
  enabledKinds?: string;
  grant?: number;
} = {}): Promise<RaceContext> {
  const { cookie: adminCookie } = await loginAdmin();
  const race = await seedReadyRace({
    enabledKinds: opts.enabledKinds,
    grant: opts.grant,
  });
  expect(redirectMessage(await openRace(adminCookie)).error).toBe(false);
  const displayName = `投票者-${crypto.randomUUID()}`;
  const { cookie: memberCookie } = await registerMember(displayName);
  const member = await env.DB.prepare("SELECT id FROM users WHERE display_name = ?")
    .bind(displayName).first<{ id: string }>();
  if (!member) throw new Error("メンバーが見つかりません");
  if (opts.join !== false) {
    expect(redirectMessage(await joinRace(memberCookie)).error).toBe(false);
  }
  return { adminCookie, memberCookie, memberId: member.id, ...race };
}

function betValues(
  horseIds: string[],
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    kind: "win",
    h1: horseIds[0],
    h2: "",
    h3: "",
    amount: "100",
    operation_id: crypto.randomUUID(),
    ...overrides,
  };
}

async function userBalance(userId: string): Promise<number> {
  const row = await env.DB.prepare("SELECT balance FROM users WHERE id = ?")
    .bind(userId).first<{ balance: number }>();
  if (!row) throw new Error("残高が見つかりません");
  return row.balance;
}

describe("投票ルートの境界と再送", () => {
  test("参加前の購入を拒否し、参加時の付与は一度だけ行う", async () => {
    const race = await prepareRace({ join: false });
    const denied = redirectMessage(await postForm(
      "/bet",
      betValues(race.horseIds),
      race.memberCookie,
    ));
    expect(denied.error).toBe(true);
    expect(denied.message).toContain("まだ参加していません");
    expect(await userBalance(race.memberId)).toBe(0);

    expect(redirectMessage(await joinRace(race.memberCookie)).error).toBe(false);
    expect(redirectMessage(await joinRace(race.memberCookie)).error).toBe(false);
    expect(await userBalance(race.memberId)).toBe(3000);
    expect((await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM grants WHERE event_id = ? AND user_id = ?",
    ).bind(race.eventId, race.memberId).first<{ n: number }>())?.n).toBe(1);
  });

  test("金額は最低単位・単位倍数・残高をサーバー側で検証する", async () => {
    const race = await prepareRace();
    for (const amount of ["0", "99", "150", "3100", "NaN"]) {
      const result = redirectMessage(await postForm("/bet", betValues(race.horseIds, {
        amount,
      }), race.memberCookie));
      expect(result.error, amount).toBe(true);
    }
    expect(await userBalance(race.memberId)).toBe(3000);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM bets WHERE event_id = ?")
      .bind(race.eventId).first<{ n: number }>())?.n).toBe(0);

    const minimum = redirectMessage(await postForm(
      "/bet",
      betValues(race.horseIds, { amount: "100" }),
      race.memberCookie,
    ));
    expect(minimum.error).toBe(false);
    expect(await userBalance(race.memberId)).toBe(2900);
  });

  test("無効賭式・頭数違い・重複・別開催・取消済みの買い目を拒否する", async () => {
    const race = await prepareRace({ enabledKinds: "win" });
    const foreignHorse = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO horses (
        id, event_id, name, uma_name, runner_name, strength, seed_source,
        scratched, sort_order, created_at
      ) VALUES (?, ?, '別開催', '別開催', '別開催', 1, 'manual', 0, 1, ?)`,
    ).bind(foreignHorse, "not-current-event", Date.now()).run().catch(() => undefined);

    const invalidCases = [
      betValues(race.horseIds, {
        kind: "umaren",
        h1: race.horseIds[0],
        h2: race.horseIds[1],
      }),
      betValues(race.horseIds, { kind: "win", h1: "" }),
      betValues(race.horseIds, {
        kind: "umaren",
        h1: race.horseIds[0],
        h2: race.horseIds[0],
      }),
      betValues(race.horseIds, { h1: foreignHorse }),
    ];
    await env.DB.prepare("UPDATE horses SET scratched = 1 WHERE id = ?")
      .bind(race.horseIds[2]).run();
    invalidCases.push(betValues(race.horseIds, { h1: race.horseIds[2] }));

    for (const values of invalidCases) {
      const result = redirectMessage(await postForm("/bet", values, race.memberCookie));
      expect(result.error).toBe(true);
    }
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM bets WHERE event_id = ?")
      .bind(race.eventId).first<{ n: number }>())?.n).toBe(0);
    expect(await userBalance(race.memberId)).toBe(3000);
  });

  test("購入操作IDの同一再送は一度だけ確定し、異なる内容への再利用を拒否する", async () => {
    const race = await prepareRace();
    const operationId = crypto.randomUUID();
    const values = betValues(race.horseIds, { operation_id: operationId });
    expect(redirectMessage(await postForm("/bet", values, race.memberCookie)).error).toBe(false);
    expect(redirectMessage(await postForm("/bet", values, race.memberCookie)).error).toBe(false);

    const reused = redirectMessage(await postForm("/bet", {
      ...values,
      amount: "200",
    }, race.memberCookie));
    expect(reused.error).toBe(true);
    expect(reused.message).toContain("再利用できません");
    expect(await userBalance(race.memberId)).toBe(2900);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM bets WHERE operation_id = ?")
      .bind(operationId).first<{ n: number }>())?.n).toBe(1);
  });

  test("不正な操作IDはDB更新前に拒否する", async () => {
    const race = await prepareRace();
    for (const operationId of ["", "short", "../../invalid-operation-id"] ) {
      const result = redirectMessage(await postForm("/bet", betValues(race.horseIds, {
        operation_id: operationId,
      }), race.memberCookie));
      expect(result.error, operationId).toBe(true);
      expect(result.message).toContain("画面を更新");
    }
    expect(await userBalance(race.memberId)).toBe(3000);
  });

  test("同時購入でも残高を超える票は一方しか確定しない", async () => {
    const race = await prepareRace();
    const responses = await Promise.all([
      postForm("/bet", betValues(race.horseIds, {
        amount: "2000",
        operation_id: crypto.randomUUID(),
      }), race.memberCookie),
      postForm("/bet", betValues(race.horseIds, {
        amount: "2000",
        operation_id: crypto.randomUUID(),
      }), race.memberCookie),
    ]);
    expect(responses.map(redirectMessage).filter((result) => !result.error)).toHaveLength(1);
    expect(await userBalance(race.memberId)).toBe(1000);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM bets WHERE event_id = ?")
      .bind(race.eventId).first<{ n: number }>())?.n).toBe(1);
  });

  test("やりなおしの同一再送は一度だけ返還する", async () => {
    const race = await prepareRace();
    expect(redirectMessage(await postForm(
      "/bet",
      betValues(race.horseIds, { amount: "500" }),
      race.memberCookie,
    )).error).toBe(false);
    const operationId = crypto.randomUUID();
    const redo = { operation_id: operationId };
    expect(redirectMessage(await postForm("/bet/redo", redo, race.memberCookie)).error).toBe(false);
    expect(redirectMessage(await postForm("/bet/redo", redo, race.memberCookie)).error).toBe(false);
    expect(await userBalance(race.memberId)).toBe(3000);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM payouts WHERE operation_id = ?")
      .bind(operationId).first<{ n: number }>())?.n).toBe(1);
    expect((await env.DB.prepare("SELECT refunded FROM bets WHERE event_id = ?")
      .bind(race.eventId).first<{ refunded: number }>())?.refunded).toBe(1);
  });

  test("出走取消はその馬を含む票だけを返還し、以後の購入を拒否する", async () => {
    const race = await prepareRace();
    expect(redirectMessage(await postForm("/bet", betValues(race.horseIds, {
      kind: "umaren",
      h1: race.horseIds[0],
      h2: race.horseIds[1],
      amount: "500",
    }), race.memberCookie)).error).toBe(false);
    expect(await userBalance(race.memberId)).toBe(2500);

    const scratched = redirectMessage(await postForm("/admin/scratch", {
      horse_id: race.horseIds[1],
      admin_reauth: "worker-test-admin-password",
    }, race.adminCookie));
    expect(scratched.error).toBe(false);
    expect(scratched.message).toContain("返還 500");
    expect(await userBalance(race.memberId)).toBe(3000);
    expect((await env.DB.prepare("SELECT refunded FROM bets WHERE event_id = ?")
      .bind(race.eventId).first<{ refunded: number }>())?.refunded).toBe(1);

    const retry = redirectMessage(await postForm("/bet", betValues(race.horseIds, {
      h1: race.horseIds[1],
    }), race.memberCookie));
    expect(retry.error).toBe(true);
    expect(retry.message).toContain("投票できません");
  });
});
