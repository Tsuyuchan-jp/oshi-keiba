/**
 * store ライフサイクル結合: 投票 → 締切 → 着順 → 公開（残高不変条件）
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULTS, payoutAmount, parimutuelOdds } from "./odds.ts";
import { createMemoryD1 } from "./testD1.ts";
import {
  addHorse,
  deleteMember,
  ensureEvent,
  forceClose,
  getEventById,
  getUser,
  joinEvent,
  listAllBets,
  listEventPayouts,
  listMembers,
  loadTreasuryDashboard,
  listUserBets,
  loginMember,
  listHorses,
  openVoting,
  placeBet,
  publishResults,
  redoMyBets,
  reopenClosedToVoting,
  registerMember,
  savePlaces,
} from "./store.ts";

async function refresh(db: D1Database, id: string) {
  const e = await getEventById(db, id);
  assert.ok(e);
  return e;
}

async function seedRace(db: D1Database) {
  const event0 = await ensureEvent(db);
  const h1 = await addHorse(db, event0, "テスト一着", "A", {
    strength: 20,
  });
  const h2 = await addHorse(db, event0, "テスト二着", "B", {
    strength: 10,
  });
  await db.prepare("UPDATE events SET voting_closes_at = ?, score_setup = ? WHERE id = ?")
    .bind(Date.now() + 60_000, JSON.stringify({
      conditions: { courseKey: "10606", weather: 1, groundCondition: 1, season: 3 },
      requirements: {
        speedCap: 1200, staminaNoTempt: 600, staminaWithTempt: 800,
        staminaRace: false, power: 700, guts: 400, wisdom: 600,
        staminaByStyle: {
          runner: { noTempt: 600, withTempt: 800 }, leader: { noTempt: 600, withTempt: 800 },
          betweener: { noTempt: 600, withTempt: 800 }, chaser: { noTempt: 600, withTempt: 800 },
        },
      },
      staminaRaceSelected: true,
    }), event0.id).run();
  await openVoting(db, await refresh(db, event0.id), null);
  const event = await refresh(db, event0.id);
  assert.equal(event.status, "voting");
  return { event, h1, h2 };
}

test("投票開始: 締切と脚質別スタミナが未設定なら直接呼び出しても開始できない", async () => {
  const db = createMemoryD1();
  const event = await ensureEvent(db);
  await addHorse(db, event, "テスト一号", "A", { strength: 10 });
  await addHorse(db, event, "テスト二号", "B", { strength: 10 });
  const current = await refresh(db, event.id);
  await assert.rejects(
    () => openVoting(db, current, null),
    /投票締切日時.*レース条件/,
  );
});

test("当選単勝: 付与→投票→締切→着順→公開で残高が払戻どおり増える", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  const user = await registerMember(db, "当選太郎");
  const joined = await joinEvent(db, event, user);
  assert.equal(joined.balance, DEFAULTS.grantG);

  const amount = 500;
  await placeBet(db, event, joined, "win", [h1], amount);
  const afterBet = await getUser(db, joined.id);
  assert.ok(afterBet);
  assert.equal(afterBet.balance, DEFAULTS.grantG - amount);

  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  await publishResults(db, await refresh(db, event.id));

  const published = await refresh(db, event.id);
  assert.equal(published.status, "published");
  assert.equal(published.payouts_applied, 1);

  // 単独票なら odds = 1 - D
  const odds = parimutuelOdds(amount, amount, event.takeout_d);
  assert.ok(odds != null);
  const pay = payoutAmount(amount, odds);
  const final = await getUser(db, joined.id);
  assert.ok(final);
  assert.equal(final.balance, DEFAULTS.grantG - amount + pay);
  assert.ok(final.balance >= 0);
});

test("外れ単勝: 当たりに実票があれば払戻なし（特払いしない）", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  // 特払い回避のため、勝ち馬にも最低1票を入れる
  const winner = await joinEvent(
    db,
    event,
    await registerMember(db, "当たり側"),
  );
  const loser = await joinEvent(
    db,
    event,
    await registerMember(db, "外れ花子"),
  );
  const loseAmount = 700;
  await placeBet(db, event, winner, "win", [h1], 100);
  await placeBet(db, event, loser, "win", [h2], loseAmount);
  const afterBet = await getUser(db, loser.id);
  assert.ok(afterBet);
  assert.equal(afterBet.balance, DEFAULTS.grantG - loseAmount);

  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  await publishResults(db, await refresh(db, event.id));

  const final = await getUser(db, loser.id);
  assert.ok(final);
  assert.equal(final.balance, DEFAULTS.grantG - loseAmount);
});

test("やりなおし: 投票中に残高が戻る", async () => {
  const db = createMemoryD1();
  const { event, h1 } = await seedRace(db);
  const user = await registerMember(db, "やりなおし");
  const joined = await joinEvent(db, event, user);
  await placeBet(db, event, joined, "win", [h1], 300);
  const refunded = await redoMyBets(db, event, joined);
  assert.equal(refunded, 300);
  const final = await getUser(db, joined.id);
  assert.ok(final);
  assert.equal(final.balance, DEFAULTS.grantG);
});

test("同じ操作IDの購入を再送しても、馬券と残高控除は一度だけ", async () => {
  const db = createMemoryD1();
  const { event, h1 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "購入再送"));
  const operationId = "7de4b798-2a82-4cf7-9827-0eb6d81f9a11";

  await placeBet(db, event, user, "win", [h1], 500, operationId);
  await placeBet(db, event, user, "win", [h1], 500, operationId);

  const after = await getUser(db, user.id);
  assert.ok(after);
  assert.equal(after.balance, DEFAULTS.grantG - 500);
  assert.equal((await listUserBets(db, event.id, user.id)).length, 1);
});

test("同じ操作IDのやりなおしを再送しても、返還は一度だけ", async () => {
  const db = createMemoryD1();
  const { event, h1 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "返還再送"));
  await placeBet(db, event, user, "win", [h1], 500);
  const operationId = "c85240e2-b8be-4d81-9701-0a07403c68a7";

  assert.equal(await redoMyBets(db, event, user, operationId), 500);
  assert.equal(await redoMyBets(db, event, user, operationId), 500);

  const after = await getUser(db, user.id);
  assert.ok(after);
  assert.equal(after.balance, DEFAULTS.grantG);
});

test("同時購入では残高を超える購入を確定しない", async () => {
  const db = createMemoryD1();
  const { event, h1 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "同時購入"));

  const results = await Promise.allSettled([
    placeBet(db, event, user, "win", [h1], 2000, "8ac17bd4-f8f5-40d8-a6e5-cc45ebd2cc59"),
    placeBet(db, event, user, "win", [h1], 2000, "f5f4679b-7e90-4b93-a672-62b2bbd6f635"),
  ]);

  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  const after = await getUser(db, user.id);
  assert.ok(after);
  assert.equal(after.balance, DEFAULTS.grantG - 2000);
  assert.equal((await listUserBets(db, event.id, user.id)).length, 1);
});

test("二人投票: 総付与と残高・控除の関係が崩れない", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  const a = await joinEvent(
    db,
    event,
    await registerMember(db, "会員A"),
  );
  const b = await joinEvent(
    db,
    event,
    await registerMember(db, "会員B"),
  );
  const aw = 1000;
  const al = 400;
  await placeBet(db, event, a, "win", [h1], aw);
  await placeBet(db, event, b, "win", [h2], al);

  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  await publishResults(db, await refresh(db, event.id));

  const odds = parimutuelOdds(aw, aw + al, event.takeout_d);
  assert.ok(odds != null);
  const pay = payoutAmount(aw, odds);
  const ua = await getUser(db, a.id);
  const ub = await getUser(db, b.id);
  assert.ok(ua && ub);
  assert.equal(ua.balance, DEFAULTS.grantG - aw + pay);
  assert.equal(ub.balance, DEFAULTS.grantG - al);
  assert.ok(ua.balance >= 0 && ub.balance >= 0);

  // 付与合計 = 最終残高合計 + プールから控除・端数で残った分
  const grants = 2 * DEFAULTS.grantG;
  const poolLeft = aw + al - pay; // 控除と負け票の残り（当選者への払いを除く）
  assert.equal(ua.balance + ub.balance + poolLeft, grants);
  const treasury = await loadTreasuryDashboard(
    db,
    event.id,
    "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44",
  );
  assert.equal(treasury.adminBalance, poolLeft);
  assert.equal(treasury.memberBalanceTotal, ua.balance + ub.balance);
  assert.equal(treasury.unsettledPoolTotal, 0);
  assert.equal(treasury.totalIssued, grants);
  assert.deepEqual(treasury.settlements.map((x) => ({
    bet: x.bet_total,
    payout: x.payout_total,
    effective: x.effective_bet_total,
    prize: x.prize_payout_total,
    redo: x.redo_total,
    scratch: x.scratch_refund_total,
    retained: x.retained_amount,
    source: x.source,
  })), [{
    bet: aw + al,
    payout: pay,
    effective: aw + al,
    prize: pay,
    redo: 0,
    scratch: 0,
    retained: poolLeft,
    source: "publish",
  }]);
  assert.equal(treasury.currentEffectiveBetTotal, aw + al);
  assert.equal(treasury.currentPrizePayoutTotal, pay);
  assert.equal(treasury.currentRedoTotal, 0);
});

test("場の会計: やり直しは有効投票から除き、払戻は的中だけにする", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "やり直し会計"));
  await placeBet(db, event, user, "win", [h1], 500);
  assert.equal(await redoMyBets(db, event, user), 500);
  await placeBet(db, event, user, "win", [h1], 500);
  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  await publishResults(db, await refresh(db, event.id));
  const odds = parimutuelOdds(500, 500, event.takeout_d);
  assert.ok(odds != null);
  const pay = payoutAmount(500, odds);
  const treasury = await loadTreasuryDashboard(
    db,
    event.id,
    "9f0cdb75-82dd-4d4e-b7b7-97f7e1ea8c44",
  );
  assert.equal(treasury.currentBetTotal, 1000);
  assert.equal(treasury.currentRedoTotal, 500);
  assert.equal(treasury.currentEffectiveBetTotal, 500);
  assert.equal(treasury.currentPrizePayoutTotal, pay);
  assert.equal(treasury.currentScratchRefundTotal, 0);
  assert.equal(treasury.settlements[0]?.effective_bet_total, 500);
  assert.equal(treasury.settlements[0]?.redo_total, 500);
  assert.equal(treasury.settlements[0]?.prize_payout_total, pay);
});

test("結果公開を同時に再送しても、払戻と残高加算は一度だけ", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "公開同時実行"));
  const amount = 500;
  await placeBet(db, event, user, "win", [h1], amount);
  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);

  const stale = await refresh(db, event.id);
  const results = await Promise.all([
    publishResults(db, stale),
    publishResults(db, stale),
  ]);

  assert.deepEqual(results.sort(), ["already_published", "published"]);
  const odds = parimutuelOdds(amount, amount, event.takeout_d);
  assert.ok(odds != null);
  const userAfter = await getUser(db, user.id);
  assert.ok(userAfter);
  assert.equal(userAfter.balance, DEFAULTS.grantG - amount + payoutAmount(amount, odds));
  assert.equal((await listEventPayouts(db, event.id)).length, 1);
});

test("公開バッチの失敗は全て戻り、再試行で一度だけ確定する", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "公開再試行"));
  await placeBet(db, event, user, "win", [h1], 500);
  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  await db.exec(`CREATE TRIGGER fail_publish_payout BEFORE INSERT ON payouts
    WHEN NEW.kind = 'win' BEGIN SELECT RAISE(ABORT, 'payout failure'); END`);

  const beforeFailure = await refresh(db, event.id);
  await assert.rejects(() => publishResults(db, beforeFailure), /payout failure/);
  const failed = await refresh(db, event.id);
  const balanceAfterFailure = await getUser(db, user.id);
  assert.ok(balanceAfterFailure);
  assert.equal(failed.status, "closed");
  assert.equal(failed.payouts_applied, 0);
  assert.equal(balanceAfterFailure.balance, DEFAULTS.grantG - 500);
  assert.equal((await listEventPayouts(db, event.id)).length, 0);

  await db.exec("DROP TRIGGER fail_publish_payout");
  assert.equal(await publishResults(db, await refresh(db, event.id)), "published");
  assert.equal((await listEventPayouts(db, event.id)).length, 1);
});

test("メンバーを利用停止にしても、公開済み開催の投票と払戻は残る", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "記録を残す会員"));
  await placeBet(db, event, user, "win", [h1], 500);
  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  await publishResults(db, await refresh(db, event.id));

  await deleteMember(db, user.id);

  const stopped = await getUser(db, user.id);
  assert.ok(stopped);
  assert.ok(stopped.deleted_at != null);
  assert.equal((await listMembers(db)).length, 0);
  await assert.rejects(() => loginMember(db, "記録を残す会員"), /登録されていません/);
  const bets = await listAllBets(db, event.id, "new");
  assert.equal(bets.length, 1);
  assert.equal(bets[0]?.display_name, "記録を残す会員");
  assert.equal((await listEventPayouts(db, event.id)).length, 1);

  const restored = await registerMember(db, "記録を残す会員");
  assert.equal(restored.id, user.id);
  assert.equal(restored.deleted_at, null);
  assert.equal((await listMembers(db)).length, 1);
});

test("締切は出走と馬券を残して投票中へ戻せる。公開後は戻せない", async () => {
  const db = createMemoryD1();
  const { event, h1, h2 } = await seedRace(db);
  const user = await joinEvent(db, event, await registerMember(db, "巻き戻し会員"));
  await placeBet(db, event, user, "win", [h1], 500);
  const balanceAfterBet = (await getUser(db, user.id))!.balance;
  await db.prepare("UPDATE events SET voting_closes_at = ? WHERE id = ?")
    .bind(Date.now() - 1_000, event.id).run();
  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  const closedCauses = await db.prepare(
    "SELECT cause FROM analysis_snapshots WHERE event_id = ? AND cause IN ('pre_close', 'close')",
  ).bind(event.id).all<{ cause: string }>();
  assert.equal(closedCauses.results?.length, 2);

  const bet = (await listAllBets(db, event.id, "new"))[0]!;
  await db.prepare(
    "INSERT INTO payouts (id, event_id, user_id, bet_id, amount, kind, created_at) VALUES (?, ?, ?, ?, ?, 'win', ?)",
  ).bind("payout-guard", event.id, user.id, bet.id, 100, Date.now()).run();
  const guarded = await refresh(db, event.id);
  await assert.rejects(
    () => reopenClosedToVoting(db, guarded),
    /確定配当のある開催は戻せません/,
  );
  assert.equal((await refresh(db, event.id)).status, "closed");
  assert.equal((await listHorses(db, event.id)).find((horse) => horse.id === h1)?.finish_place, 1);
  await db.prepare("DELETE FROM payouts WHERE id = ?").bind("payout-guard").run();

  await reopenClosedToVoting(db, await refresh(db, event.id));

  const reopened = await refresh(db, event.id);
  assert.equal(reopened.status, "voting");
  assert.equal(reopened.closed_at, null);
  assert.equal(reopened.voting_closes_at, null);
  assert.equal(reopened.payouts_applied, 0);
  const horses = await listHorses(db, event.id);
  assert.equal(horses.length, 2);
  assert.ok(horses.every((horse) => horse.finish_place == null));
  const bets = await listAllBets(db, event.id, "new");
  assert.equal(bets.length, 1);
  assert.equal(bets[0]?.refunded, 0);
  assert.equal(bets[0]?.amount, 500);
  assert.equal((await getUser(db, user.id))!.balance, balanceAfterBet);
  const remainingClose = await db.prepare(
    "SELECT COUNT(*) AS n FROM analysis_snapshots WHERE event_id = ? AND cause IN ('pre_close', 'close')",
  ).bind(event.id).first<{ n: number }>();
  assert.equal(remainingClose?.n, 0);
  const keptOpen = await db.prepare(
    "SELECT COUNT(*) AS n FROM analysis_snapshots WHERE event_id = ? AND cause = 'voting_open'",
  ).bind(event.id).first<{ n: number }>();
  assert.equal(keptOpen?.n, 1);

  await assert.rejects(
    () => reopenClosedToVoting(db, reopened),
    /投票締切後、結果公開前/,
  );

  await forceClose(db, await refresh(db, event.id));
  await savePlaces(db, await refresh(db, event.id), [
    { horseId: h1, place: 1 },
    { horseId: h2, place: 2 },
  ]);
  await publishResults(db, await refresh(db, event.id));
  const published = await refresh(db, event.id);
  await assert.rejects(
    () => reopenClosedToVoting(db, published),
    /投票締切後、結果公開前/,
  );
  assert.equal((await refresh(db, event.id)).status, "published");
  assert.equal((await listHorses(db, event.id)).length, 2);
});
