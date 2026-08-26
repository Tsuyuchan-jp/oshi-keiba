/**
 * store ライフサイクル結合: 投票 → 締切 → 着順 → 公開（残高不変条件）
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULTS, payoutAmount, parimutuelOdds } from "./odds.ts";
import { createMemoryD1 } from "./testD1.ts";
import {
  addHorse,
  ensureEvent,
  forceClose,
  getEventById,
  getUser,
  joinEvent,
  openVoting,
  placeBet,
  publishResults,
  redoMyBets,
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
    recordUndo: false,
  });
  const h2 = await addHorse(db, event0, "テスト二着", "B", {
    strength: 10,
    recordUndo: false,
  });
  await openVoting(db, await refresh(db, event0.id), null);
  const event = await refresh(db, event0.id);
  assert.equal(event.status, "voting");
  return { event, h1, h2 };
}

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
});
