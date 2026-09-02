import { env } from "cloudflare:workers";
import { describe, expect, test } from "vitest";
import {
  joinRace,
  loginAdmin,
  openRace,
  postForm,
  postMultipart,
  redirectMessage,
  registerMember,
  seedReadyRace,
  workerFetch,
} from "./helpers";

type EventState = {
  id: string;
  status: "setup" | "voting" | "closed" | "published";
  is_current: number;
  payouts_applied: number;
};

async function eventState(eventId: string): Promise<EventState> {
  const row = await env.DB.prepare(
    "SELECT id, status, is_current, payouts_applied FROM events WHERE id = ?",
  ).bind(eventId).first<EventState>();
  if (!row) throw new Error("開催が見つかりません");
  return row;
}

describe("開催ライフサイクルのHTTP結合", () => {
  test("出走登録から全5賭式の購入・締切・着順・公開・次開催まで進める", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });

    for (let index = 1; index <= 3; index += 1) {
      const registered = await postMultipart("/admin/horse", {
        uma_name: `HTTPウマ${index}`,
        runner_name: `HTTP出走者${index}`,
        style_key: "runner",
        strength_manual: "1",
        strength: String(40 - index),
      }, adminCookie);
      expect(registered.status).toBe(303);
      expect(redirectMessage(registered).error).toBe(false);
    }

    const horseRows = await env.DB.prepare(
      "SELECT id FROM horses WHERE event_id = ? ORDER BY sort_order",
    ).bind(eventId).all<{ id: string }>();
    const horseIds = horseRows.results.map((row) => row.id);
    expect(horseIds).toHaveLength(3);

    const opened = await openRace(adminCookie);
    expect(redirectMessage(opened)).toMatchObject({
      error: false,
      message: "投票を開始しました",
    });
    expect((await eventState(eventId)).status).toBe("voting");

    const { cookie: memberCookie } = await registerMember("全賭式メンバー");
    expect(redirectMessage(await joinRace(memberCookie)).error).toBe(false);

    const bets = [
      { kind: "win", ids: [horseIds[0]] },
      { kind: "umaren", ids: [horseIds[1], horseIds[0]] },
      { kind: "umatan", ids: [horseIds[0], horseIds[1]] },
      { kind: "sanrenpuku", ids: [horseIds[2], horseIds[0], horseIds[1]] },
      { kind: "sanrentan", ids: [horseIds[0], horseIds[1], horseIds[2]] },
    ] as const;
    for (const bet of bets) {
      const bought = await postForm("/bet", {
        kind: bet.kind,
        h1: bet.ids[0],
        h2: bet.ids[1] ?? "",
        h3: bet.ids[2] ?? "",
        amount: "100",
        operation_id: crypto.randomUUID(),
      }, memberCookie);
      expect(redirectMessage(bought).error, bet.kind).toBe(false);
    }

    const storedBets = await env.DB.prepare(
      `SELECT kind, horse_1, horse_2, horse_3, amount
       FROM bets WHERE event_id = ? ORDER BY created_at, kind`,
    ).bind(eventId).all<{
      kind: string;
      horse_1: string;
      horse_2: string | null;
      horse_3: string | null;
      amount: number;
    }>();
    expect(storedBets.results).toHaveLength(5);
    expect(new Set(storedBets.results.map((bet) => bet.kind))).toEqual(
      new Set(["win", "umaren", "umatan", "sanrenpuku", "sanrentan"]),
    );
    expect(storedBets.results.every((bet) => bet.amount === 100)).toBe(true);

    const liveBoard = await workerFetch("/api/board");
    expect(liveBoard.status).toBe(200);
    const liveJson = await liveBoard.json<{ status: string; kinds: Record<string, unknown[]> }>();
    expect(liveJson.status).toBe("voting");
    expect(Object.keys(liveJson.kinds).sort()).toEqual(
      ["sanrenpuku", "sanrentan", "umaren", "umatan", "win"],
    );

    expect(redirectMessage(await postForm("/admin/close", {}, adminCookie)).error).toBe(false);
    expect((await eventState(eventId)).status).toBe("closed");

    const places = Object.fromEntries(
      horseIds.map((horseId, index) => [`place_${horseId}`, String(index + 1)]),
    );
    expect(redirectMessage(await postForm("/admin/places", places, adminCookie)).error).toBe(false);
    expect(redirectMessage(await postForm("/admin/publish", {}, adminCookie)).error).toBe(false);

    const published = await eventState(eventId);
    expect(published).toMatchObject({ status: "published", payouts_applied: 1 });
    const paidBets = await env.DB.prepare(
      `SELECT b.kind AS bet_kind
       FROM payouts p JOIN bets b ON b.id = p.bet_id
       WHERE p.event_id = ? ORDER BY b.kind`,
    ).bind(eventId).all<{ bet_kind: string }>();
    expect(paidBets.results.map((row) => row.bet_kind).sort()).toEqual(
      ["sanrenpuku", "sanrentan", "umaren", "umatan", "win"],
    );

    const memberBoard = await workerFetch("/", {}, memberCookie);
    expect(memberBoard.status).toBe(200);
    expect(await memberBoard.text()).toContain("的中");

    const republished = redirectMessage(await postForm("/admin/publish", {}, adminCookie));
    expect(republished.error).toBe(false);
    expect(republished.message).toContain("すでに公開");
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM payouts WHERE event_id = ?")
      .bind(eventId).first<{ n: number }>())?.n).toBe(5);

    expect(redirectMessage(await postForm("/admin/next-event", {}, adminCookie)).error).toBe(false);
    expect((await eventState(eventId)).is_current).toBe(0);
    const current = await env.DB.prepare(
      "SELECT status, title, is_current FROM events WHERE is_current = 1",
    ).first<{ status: string; title: string; is_current: number }>();
    expect(current).toEqual({ status: "setup", title: "", is_current: 1 });
  });

  test("許可されない状態遷移は開催状態を変えない", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });

    for (const path of ["/admin/open", "/admin/close", "/admin/publish", "/admin/next-event"]) {
      const result = redirectMessage(await postForm(path, {}, adminCookie));
      expect(result.error, path).toBe(true);
      expect((await eventState(eventId)).status, path).toBe("setup");
    }

    await seedReadyRace({ horseCount: 3 });
    expect(redirectMessage(await openRace(adminCookie)).error).toBe(false);
    expect((await eventState(eventId)).status).toBe("voting");

    const lateHorse = redirectMessage(await postMultipart("/admin/horse", {
      uma_name: "飛び入り",
      runner_name: "禁止",
      style_key: "runner",
      strength_manual: "1",
      strength: "10",
    }, adminCookie));
    expect(lateHorse.error).toBe(true);
    expect(lateHorse.message).toContain("飛び入り禁止");
    expect(redirectMessage(await postForm("/admin/open", {}, adminCookie)).error).toBe(true);
    expect(redirectMessage(await postForm("/admin/next-event", {}, adminCookie)).error).toBe(true);

    expect(redirectMessage(await postForm("/admin/close", {}, adminCookie)).error).toBe(false);
    expect(redirectMessage(await postForm("/admin/close", {}, adminCookie)).error).toBe(true);
    expect(redirectMessage(await postForm("/admin/publish", {}, adminCookie)).error).toBe(true);
    expect((await eventState(eventId)).status).toBe("closed");
  });

  test("締切時刻を過ぎた開催は公開API参照時に自動で締切になる", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace();
    expect(redirectMessage(await openRace(adminCookie)).error).toBe(false);
    await env.DB.prepare("UPDATE events SET voting_closes_at = ? WHERE id = ?")
      .bind(Date.now() - 1, eventId).run();

    const response = await workerFetch("/api/board");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "closed" });
    expect((await eventState(eventId)).status).toBe("closed");
  });

  test("出走上限18頭では開始でき、19頭目の登録はDBを増やさず拒否する", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 18 });
    const tooMany = redirectMessage(await postMultipart("/admin/horse", {
      uma_name: "19頭目",
      runner_name: "上限確認",
      style_key: "runner",
      strength_manual: "1",
      strength: "10",
    }, adminCookie));
    expect(tooMany.error).toBe(true);
    expect(tooMany.message).toContain("18 まで");
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM horses WHERE event_id = ?")
      .bind(eventId).first<{ n: number }>())?.n).toBe(18);
    expect(redirectMessage(await openRace(adminCookie)).error).toBe(false);
    expect((await eventState(eventId)).status).toBe("voting");
  });

  test("不正な設定値はHTTP経由でも拒否し、開催を部分更新しない", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });
    const invalid = redirectMessage(await postForm("/admin/params", {
      title: "上書きされない",
      grant_g: "4200",
      bet_unit: "200",
      seed_pool_s: "900",
      pull_e: "1000",
      takeout_d: "1",
      w_time_floor: "0.15",
      w_time_exp: "2",
      closes_at: "",
    }, adminCookie));
    expect(invalid.error).toBe(true);
    expect(invalid.message).toContain("0 〜 0.99");
    expect((await env.DB.prepare("SELECT title, takeout_d FROM events WHERE id = ?")
      .bind(eventId).first<{ title: string; takeout_d: number }>())).toEqual({
        title: "結合テスト杯",
        takeout_d: 0.2,
      });
  });
});
