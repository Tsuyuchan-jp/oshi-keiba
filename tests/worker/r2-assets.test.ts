import { env } from "cloudflare:workers";
import { describe, expect, test } from "vitest";
import {
  loginAdmin,
  postForm,
  postMultipart,
  redirectMessage,
  registerMember,
  seedReadyRace,
  workerFetch,
} from "./helpers";

type HorseAssets = {
  id: string;
  shot_key: string | null;
  trainer_icon_key: string | null;
};

const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
const JPEG_BYTES = new Uint8Array([255, 216, 255, 224, 1, 2, 3, 255, 217]);
const WEBP_BYTES = new TextEncoder().encode("RIFF0000WEBPVP8 ");

function imageFile(bytes: Uint8Array, name: string, type: string): File {
  return new File([bytes], name, { type });
}

function horseForm(overrides: Record<string, string | Blob> = {}): Record<string, string | Blob> {
  return {
    uma_name: "画像テストウマ",
    runner_name: "画像担当",
    style_key: "runner",
    strength_manual: "1",
    strength: "20",
    ...overrides,
  };
}

async function onlyHorse(eventId: string): Promise<HorseAssets> {
  const horse = await env.DB.prepare(
    "SELECT id, shot_key, trainer_icon_key FROM horses WHERE event_id = ?",
  ).bind(eventId).first<HorseAssets>();
  if (!horse) throw new Error("出走が見つかりません");
  return horse;
}

async function createHorseWithAssets(
  eventId: string,
  adminCookie: string,
): Promise<HorseAssets> {
  const response = await postMultipart("/admin/horse", horseForm({
    ocr_ok: "1",
    shot: imageFile(PNG_BYTES, "score.png", "image/png"),
    trainer_icon: imageFile(JPEG_BYTES, "trainer.jpg", "image/jpeg"),
  }), adminCookie);
  expect(redirectMessage(response).error).toBe(false);
  return onlyHorse(eventId);
}

describe("R2画像のHTTP結合", () => {
  test("スクリーンショットとアイコンを保存し、権限付き経路から正しいMIMEで取得する", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });
    const horse = await createHorseWithAssets(eventId, adminCookie);
    expect(horse.shot_key).toMatch(new RegExp(`^${eventId}/${horse.id}-[0-9a-f-]{36}$`));
    expect(horse.trainer_icon_key).toMatch(
      new RegExp(`^${eventId}/${horse.id}-trainer-icon-[0-9a-f-]{36}$`),
    );

    const shotObject = await env.SHOTS.get(horse.shot_key!);
    const iconObject = await env.SHOTS.get(horse.trainer_icon_key!);
    expect(shotObject?.httpMetadata?.contentType).toBe("image/png");
    expect(iconObject?.httpMetadata?.contentType).toBe("image/jpeg");
    expect(new Uint8Array(await shotObject!.arrayBuffer())).toEqual(PNG_BYTES);
    expect(new Uint8Array(await iconObject!.arrayBuffer())).toEqual(JPEG_BYTES);

    const adminShot = await workerFetch(`/admin/shot/${horse.id}`, {}, adminCookie);
    expect(adminShot.status).toBe(200);
    expect(adminShot.headers.get("Content-Type")).toBe("image/png");
    expect(adminShot.headers.get("Cache-Control")).toBe("private, max-age=300");
    expect(new Uint8Array(await adminShot.arrayBuffer())).toEqual(PNG_BYTES);

    const { cookie: memberCookie } = await registerMember("画像閲覧メンバー");
    const memberIcon = await workerFetch(
      `/paddock/trainer-icon/${horse.id}`,
      {},
      memberCookie,
    );
    expect(memberIcon.status).toBe(200);
    expect(memberIcon.headers.get("Content-Type")).toBe("image/jpeg");
    expect(new Uint8Array(await memberIcon.arrayBuffer())).toEqual(JPEG_BYTES);

    const anonymous = await workerFetch(`/paddock/shot/${horse.id}`);
    expect(anonymous.status).toBe(303);
    expect(anonymous.headers.get("Location")).toBe("/login");
  });

  test("空・未対応形式・2MB超過をDBとR2の更新前に拒否する", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });
    const invalidForms = [
      horseForm({ ocr_ok: "1" }),
      horseForm({
        ocr_ok: "1",
        shot: imageFile(new Uint8Array([1, 2, 3]), "score.gif", "image/gif"),
      }),
      horseForm({
        ocr_ok: "1",
        shot: imageFile(
          new Uint8Array(2 * 1024 * 1024 + 1),
          "oversize.png",
          "image/png",
        ),
      }),
    ];

    for (const form of invalidForms) {
      const response = redirectMessage(await postMultipart("/admin/horse", form, adminCookie));
      expect(response.error).toBe(true);
    }
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM horses WHERE event_id = ?")
      .bind(eventId).first<{ n: number }>())?.n).toBe(0);
    expect((await env.SHOTS.list()).objects).toEqual([]);
  });

  test("画像差し替えは旧画像をUndo猶予中だけ保持し、次の管理操作で削除する", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });
    const before = await createHorseWithAssets(eventId, adminCookie);

    const replaced = await postMultipart("/admin/horse-edit", horseForm({
      horse_id: before.id,
      shot: imageFile(WEBP_BYTES, "replacement.webp", "image/webp"),
      trainer_icon: imageFile(PNG_BYTES, "replacement-icon.png", "image/png"),
    }), adminCookie);
    expect(redirectMessage(replaced).error).toBe(false);
    const after = await onlyHorse(eventId);
    expect(after.shot_key).not.toBe(before.shot_key);
    expect(after.trainer_icon_key).not.toBe(before.trainer_icon_key);
    expect((await env.DB.prepare(
      "SELECT object_key FROM r2_pending_deletions ORDER BY object_key",
    ).all<{ object_key: string }>()).results.map((row) => row.object_key).sort()).toEqual(
      [before.shot_key!, before.trainer_icon_key!].sort(),
    );
    expect((await env.SHOTS.list()).objects).toHaveLength(4);

    const nextEdit = await postMultipart("/admin/horse-edit", horseForm({
      horse_id: before.id,
      runner_name: "次の管理操作",
    }), adminCookie);
    expect(redirectMessage(nextEdit).error).toBe(false);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM r2_pending_deletions")
      .first<{ n: number }>())?.n).toBe(0);
    expect(await env.SHOTS.get(before.shot_key!)).toBeNull();
    expect(await env.SHOTS.get(before.trainer_icon_key!)).toBeNull();
    expect(await env.SHOTS.get(after.shot_key!)).not.toBeNull();
    expect(await env.SHOTS.get(after.trainer_icon_key!)).not.toBeNull();
  });

  test("出走削除の画像も次の管理操作までは保留し、その後R2から除去する", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });
    const horse = await createHorseWithAssets(eventId, adminCookie);
    expect(redirectMessage(await postForm("/admin/horse-drop", {
      horse_id: horse.id,
    }, adminCookie)).error).toBe(false);
    expect(await env.SHOTS.get(horse.shot_key!)).not.toBeNull();
    expect(await env.SHOTS.get(horse.trainer_icon_key!)).not.toBeNull();

    const nextOperation = await postMultipart("/admin/horse", horseForm({
      uma_name: "次の出走",
      runner_name: "削除確定役",
    }), adminCookie);
    expect(redirectMessage(nextOperation).error).toBe(false);
    expect(await env.SHOTS.get(horse.shot_key!)).toBeNull();
    expect(await env.SHOTS.get(horse.trainer_icon_key!)).toBeNull();
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM r2_pending_deletions")
      .first<{ n: number }>())?.n).toBe(0);
  });

  test("R2実体が欠けた参照は404を返し、別の画像へ誤フォールバックしない", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });
    const horse = await createHorseWithAssets(eventId, adminCookie);
    await env.SHOTS.delete(horse.shot_key!);

    const response = await workerFetch(`/admin/shot/${horse.id}`, {}, adminCookie);
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("画像がありません");
    expect(await env.SHOTS.get(horse.trainer_icon_key!)).not.toBeNull();
  });

  test("R2保存後にDB更新が失敗しても出走とアップロード済み画像を残さない", async () => {
    const { cookie: adminCookie } = await loginAdmin();
    const { eventId } = await seedReadyRace({ horseCount: 0 });
    await env.DB.prepare(`CREATE TRIGGER fail_horse_asset_update
      BEFORE UPDATE OF shot_key ON horses
      WHEN NEW.shot_key IS NOT NULL
      BEGIN SELECT RAISE(ABORT, 'forced asset update failure'); END`).run();
    try {
      const result = redirectMessage(await postMultipart("/admin/horse", horseForm({
        ocr_ok: "1",
        shot: imageFile(PNG_BYTES, "will-rollback.png", "image/png"),
        trainer_icon: imageFile(JPEG_BYTES, "will-rollback.jpg", "image/jpeg"),
      }), adminCookie));
      expect(result.error).toBe(true);
      expect(result.message).toContain("forced asset update failure");
      expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM horses WHERE event_id = ?")
        .bind(eventId).first<{ n: number }>())?.n).toBe(0);
      expect((await env.SHOTS.list()).objects).toEqual([]);
    } finally {
      await env.DB.prepare("DROP TRIGGER fail_horse_asset_update").run();
    }
  });
});
