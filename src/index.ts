import {
  encodeSession,
  newId,
  sessionCookie,
  sessionExpiry,
  sessionFromRequest,
  timingSafeEqualStr,
  type Session,
} from "./lib/auth";
import {
  OPTIONAL_BET_KINDS,
  parseEnabledKinds,
  serializeEnabledKinds,
} from "./lib/bets";
import { bounce, html, readForm, redirect } from "./lib/http";
import {
  addHorse,
  clearHorses,
  deleteMember,
  discardCurrentSetup,
  dropHorse,
  forceClose,
  getUser,
  MAX_SHOT_BYTES,
  openNextEvent,
  openVoting,
  publishResults,
  resetDemo,
  revertVotingToSetup,
  savePlaces,
  scratchHorse,
  updateHorse,
  updateHorseNumbers,
  updateParams,
  upsertUser,
  loadBoard,
  eventScoreSetup,
} from "./lib/store";
import { applyAdminUndo, captureAdminUndo } from "./lib/undo";
import { adminUndoAllowed } from "./lib/adminUndo";
import { formatPt, parseJstInput, plainErrorPage } from "./lib/ui";
import { tryAdminGet } from "./lib/adminRoutes";
import { tryMemberGet, tryMemberPost } from "./lib/memberRoutes";
import {
  parseHorseScoreInput,
  serializeHorseScoreInput,
} from "./lib/horseScoreInput";
import { findUmaDressById, resolveUmaDress } from "./lib/umaDress";
import { resolveStrength } from "./lib/scoreFromHorse";
import { applyAutoScoreRecompute, prepareAutoScoreRecompute } from "./lib/scoreRecompute";
import { loadStrategicSkillsBundle, tryAdminStrategicApi } from "./lib/adminStrategicApi";
import { enrichScoreSetupWithEffects, scoreSetupFromForm } from "./lib/scoreSetup";
import { normalizeShotMime } from "./lib/shotMime";
import type { UserRow } from "./lib/store";

function demoResetAllowed(env: Env): boolean {
  return env.ALLOW_DEMO_RESET === "1";
}

/** 確認用パス。name=password にするとブラウザがログイン情報を流し込む */
function readAdminReauth(form: { get(name: string): string | File | null }): string {
  const a = form.get("admin_reauth");
  const b = form.get("password");
  const first = typeof a === "string" ? a : "";
  const second = typeof b === "string" ? b : "";
  return first || second;
}

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<{ session: Session; user: UserRow } | Response> {
  const session = await sessionFromRequest(request, env.SESSION_SECRET);
  if (!session || session.role !== "admin") {
    return redirect("/admin/login");
  }
  const user = await getUser(env.DB, session.userId);
  if (!user) return redirect("/admin/login");
  return { session, user };
}

async function putHorseShot(
  env: Env,
  eventId: string,
  horseId: string,
  file: File,
  suffix = "",
): Promise<string> {
  if (!env.SHOTS) throw new Error("画像の保存先がまだありません");
  if (file.size <= 0) throw new Error("画像が空です");
  if (file.size > MAX_SHOT_BYTES) throw new Error("画像が大きすぎます（2MBまで）");
  const contentType = normalizeShotMime(file.type, file.name);
  if (!contentType) throw new Error("対応形式は PNG / JPEG / WebP です");
  // 差し替えごとに別キーへ保存する。DB の参照キーを URL の版番号にも
  // 使うため、ブラウザが古い画像を再利用しない。
  const key = `${eventId}/${horseId}${suffix}-${newId()}`;
  await env.SHOTS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType },
  });
  return key;
}

/** DB 更新より先に画像の妥当性を確認し、途中更新を避ける。 */
function validateHorseShot(file: string | File | null): File | null {
  if (!(file instanceof File) || file.size <= 0) return null;
  if (file.size > MAX_SHOT_BYTES) throw new Error("画像が大きすぎます（2MBまで）");
  if (!normalizeShotMime(file.type, file.name)) {
    throw new Error("対応形式は PNG / JPEG / WebP です");
  }
  return file;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      const adminGet = await tryAdminGet(request, env, url, path);
      if (adminGet) return adminGet;

      if (path.startsWith("/admin/api/strategic-skills")) {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const res = await tryAdminStrategicApi(request, env, path, gate);
          if (res) return res;
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : "操作に失敗しました" },
            { status: 400 },
          );
        }
        return new Response("Not found", { status: 404 });
      }

      const memberGet = await tryMemberGet(request, env, url, path);
      if (memberGet) return memberGet;

      const memberPost = await tryMemberPost(request, env, path);
      if (memberPost) return memberPost;

      if (method === "POST" && path === "/admin/login") {
        const form = await readForm(request);
        const password = form.get("password") ?? "";
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin/login", "管理者の仮パスワードが違います", true);
        }
        const user = await upsertUser(env.DB, "管理者", "admin");
        const token = await encodeSession(
          { userId: user.id, role: "admin", exp: sessionExpiry() },
          env.SESSION_SECRET,
        );
        return redirect("/admin", { "Set-Cookie": sessionCookie(token) });
      }

      // —— 管理 POST ——
      if (method === "POST" && path === "/admin/params/preview") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const base = scoreSetupFromForm((name) => String(form.get(name) ?? ""));
          if (!base) throw new Error("評価条件を正しく入力してください。");
          const nextSetup = await enrichScoreSetupWithEffects(base);
          const board = await loadBoard(env.DB);
          const strategic = await loadStrategicSkillsBundle(env.DB);
          const changes = await prepareAutoScoreRecompute(env.DB, board.event, nextSetup, strategic.skills);
          return Response.json({ changes });
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : "再計算内容を取得できません" },
            { status: 400 },
          );
        }
      }

      if (method === "POST" && path === "/admin/params") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const board = await loadBoard(env.DB);
        const closesRaw = form.get("closes_at") ?? "";
        const titleRaw = String(form.get("title") ?? "").trim();
        try {
          if (!titleRaw) throw new Error("イベント名を入力してください。");
          const nextSetup = await (async () => {
            const base = scoreSetupFromForm((name) => String(form.get(name) ?? ""));
            if (!base) return null;
            return enrichScoreSetupWithEffects(base);
          })();
          const strategic = await loadStrategicSkillsBundle(env.DB);
          const changes = await prepareAutoScoreRecompute(env.DB, board.event, nextSetup, strategic.skills);
          await updateParams(env.DB, board.event, {
            title: titleRaw,
            grant_g: Number(form.get("grant_g")),
            bet_unit: Number(form.get("bet_unit")),
            seed_pool_s: Number(form.get("seed_pool_s")),
            pull_e: Number(form.get("pull_e")),
            takeout_d: Number(form.get("takeout_d")),
            w_time_floor: Number(form.get("w_time_floor")),
            w_time_exp: Number(form.get("w_time_exp")),
            voting_closes_at: parseJstInput(closesRaw),
            enabled_kinds:
              board.event.status === "setup"
                ? serializeEnabledKinds(
                    parseEnabledKinds(
                      ["win", ...OPTIONAL_BET_KINDS.filter((k) => form.get(`kind_${k}`))].join(
                        ",",
                      ),
                    ),
                  )
                : undefined,
            score_setup: nextSetup,
          });
          await applyAutoScoreRecompute(env.DB, changes);
          return bounce("/admin/settings", `レースイベント設定を保存しました。自動評価点 ${changes.length}頭を再計算しました`);
        } catch (err) {
          return bounce("/admin/settings", err instanceof Error ? err.message : "保存失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/rescore") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          const setup = eventScoreSetup(board.event);
          const strategic = await loadStrategicSkillsBundle(env.DB);
          const changes = await prepareAutoScoreRecompute(env.DB, board.event, setup, strategic.skills);
          await captureAdminUndo(env.DB, "自動評価点を再計算");
          await applyAutoScoreRecompute(env.DB, changes);
          return bounce("/admin/horses", `自動評価点 ${changes.length}頭を再計算しました`);
        } catch (err) {
          return bounce("/admin/horses", err instanceof Error ? err.message : "再計算に失敗しました", true);
        }
      }

      if (method === "POST" && path === "/admin/horse") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          const fd = await request.formData();
          const ocrOk = String(fd.get("ocr_ok") ?? "") === "1";
          const shot = fd.get("shot");
          if (ocrOk && (!(shot instanceof File) || shot.size <= 0)) {
            throw new Error("OCRした画像がありません。もう一度読み取ってください");
          }
          const setup = eventScoreSetup(board.event);
          const strategic = await loadStrategicSkillsBundle(env.DB);
          let scoreInput = parseHorseScoreInput(String(fd.get("score_input") ?? ""));
          const styleRaw = String(fd.get("style_key") ?? "").trim();
          if (!styleRaw) throw new Error("脚質を選んでください");
          if (scoreInput) {
            const parsed = parseHorseScoreInput({
              ...scoreInput,
              styleKey: styleRaw,
            });
            scoreInput = parsed;
          }
          const forceManual = String(fd.get("strength_manual") ?? "") === "1";
          const umaName = String(fd.get("uma_name") ?? "");
          const dressValue = String(fd.get("dress_id") ?? "").trim();
          const selectedDress = dressValue ? findUmaDressById(dressValue) : null;
          if (dressValue && !selectedDress) throw new Error("衣装を候補から選択してください");
          if (selectedDress && resolveUmaDress(umaName, selectedDress.dressName)?.dressId !== selectedDress.dressId) {
            throw new Error("選択中の衣装はウマ娘名と一致しません。衣装を選び直してください");
          }
          const comment = String(fd.get("paddock_comment") ?? "").trim();
          if (comment.length > 40) throw new Error("意気込みコメントは40文字以内です");
          const trainerIcon = validateHorseShot(fd.get("trainer_icon"));
          const resolved = resolveStrength({
            setup,
            input: scoreInput,
            manualStrength: Number(fd.get("strength")),
            forceManual,
            strategicSkills: strategic.skills,
          });
          const id = await addHorse(
            env.DB,
            board.event,
            umaName,
            String(fd.get("runner_name") ?? ""),
            {
              strength: resolved.strength,
              scoreInputJson: serializeHorseScoreInput(scoreInput),
              seedSource: resolved.source,
              charaId: selectedDress?.charaId ?? null,
              dressId: selectedDress?.dressId ?? null,
            },
          );
          try {
            const shotKey = ocrOk && shot instanceof File
              ? await putHorseShot(env, board.event.id, id, shot)
              : null;
            const trainerIconKey = trainerIcon
              ? await putHorseShot(env, board.event.id, id, trainerIcon, "-trainer-icon")
              : null;
            await updateHorse(env.DB, board.event, id, umaName, String(fd.get("runner_name") ?? ""), {
              strength: resolved.strength,
              scoreInputJson: serializeHorseScoreInput(scoreInput),
              seedSource: resolved.source,
              charaId: selectedDress?.charaId ?? null,
              dressId: selectedDress?.dressId ?? null,
              paddockComment: comment || null,
              trainerIconKey,
              shotKey,
              recordUndo: false,
            });
          } catch (err) {
            await env.DB.prepare("DELETE FROM horses WHERE id = ? AND event_id = ?")
              .bind(id, board.event.id)
              .run();
            throw err;
          }
          const src =
            resolved.source === "auto" ? "（自動算出）" : "（直置き）";
          return bounce("/admin/register", `登録しました ${src}`);
        } catch (err) {
          return bounce("/admin/register", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/horse-edit") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await request.formData();
        try {
          const board = await loadBoard(env.DB);
          const horseId = String(form.get("horse_id") ?? "");
          const existing = board.horses.find((h) => h.horse.id === horseId);
          if (!existing) throw new Error("出走が見つかりません");
          const setup = eventScoreSetup(board.event);
          const strategic = await loadStrategicSkillsBundle(env.DB);
          let scoreInput = parseHorseScoreInput(existing.horse.score_input);
          const styleRaw = String(form.get("style_key") ?? "").trim();
          if (!styleRaw) throw new Error("脚質を選んでください");
          if (scoreInput && String(form.get("score_edit") ?? "") === "1") {
            const apt = scoreInput.aptitudes;
            const previousSkillNames = scoreInput.skillNames;
            const previousSkillIds = scoreInput.skillIds;
            const skillNames = String(form.get("skill_names") ?? "").split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
            scoreInput = parseHorseScoreInput({ stats: { speed: Number(form.get("stat_speed")), stamina: Number(form.get("stat_stamina")), power: Number(form.get("stat_power")), guts: Number(form.get("stat_guts")), wisdom: Number(form.get("stat_wisdom")) }, aptitudes: { turf: String(form.get("apt_turf") ?? apt.turf), dirt: String(form.get("apt_dirt") ?? apt.dirt), short: String(form.get("apt_short") ?? apt.short), mile: String(form.get("apt_mile") ?? apt.mile), medium: String(form.get("apt_medium") ?? apt.medium), long: String(form.get("apt_long") ?? apt.long), nige: String(form.get("apt_nige") ?? apt.nige), senkou: String(form.get("apt_senkou") ?? apt.senkou), sashi: String(form.get("apt_sashi") ?? apt.sashi), oikomi: String(form.get("apt_oikomi") ?? apt.oikomi) }, skillNames, skillIds: skillNames.map((name, index) => previousSkillNames[index] === name ? previousSkillIds[index] ?? null : null), styleKey: styleRaw });
          } else if (scoreInput) {
            scoreInput = parseHorseScoreInput({
              ...scoreInput,
              styleKey: styleRaw,
            });
          }
          const forceManual = String(form.get("strength_manual") ?? "") === "1";
          const umaName = String(form.get("uma_name") ?? "");
          const dressValue = String(form.get("dress_id") ?? "").trim();
          const selectedDress = dressValue ? findUmaDressById(dressValue) : null;
          if (dressValue && !selectedDress) throw new Error("衣装を候補から選択してください");
          if (selectedDress && resolveUmaDress(umaName, selectedDress.dressName)?.dressId !== selectedDress.dressId) {
            throw new Error("選択中の衣装はウマ娘名と一致しません。衣装を選び直してください");
          }
          const comment = String(form.get("paddock_comment") ?? "").trim();
          if (comment.length > 40) throw new Error("意気込みコメントは40文字以内です");
          const shot = validateHorseShot(form.get("shot"));
          const icon = validateHorseShot(form.get("trainer_icon"));
          const shotKey = shot
            ? await putHorseShot(env, board.event.id, horseId, shot)
            : existing.horse.shot_key;
          const iconKey = icon
            ? await putHorseShot(env, board.event.id, horseId, icon, "-trainer-icon")
            : existing.horse.trainer_icon_key;
          const resolved = resolveStrength({
            setup,
            input: scoreInput,
            manualStrength: Number(form.get("strength")),
            forceManual,
            strategicSkills: strategic.skills,
          });
          await updateHorse(
            env.DB,
            board.event,
            horseId,
            umaName,
            String(form.get("runner_name") ?? ""),
            {
              strength: resolved.strength,
              scoreInputJson: serializeHorseScoreInput(scoreInput),
              seedSource: resolved.source,
              charaId: selectedDress?.charaId ?? null,
              dressId: selectedDress?.dressId ?? null,
              keepScoreInput: false,
              paddockComment: comment || null,
              trainerIconKey: iconKey,
              shotKey,
            },
          );
          return bounce(`/admin/register?edit=${encodeURIComponent(horseId)}`, "更新しました");
        } catch (err) {
          return bounce("/admin/register", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/horse-drop") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          await dropHorse(env.DB, board.event, form.get("horse_id") ?? "");
          return bounce("/admin/register", "名簿から外しました");
        } catch (err) {
          return bounce("/admin/register", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/horse-numbers") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          const ids = form.getAll("horse_id");
          const numbers = form.getAll("horse_number");
          if (ids.length !== numbers.length) throw new Error("ウマ番の入力が不完全です");
          await updateHorseNumbers(
            env.DB,
            board.event,
            ids.map((id, index) => ({ horseId: String(id), number: Number(numbers[index]) })),
          );
          return bounce("/admin/register", "ウマ番を保存しました");
        } catch (err) {
          return bounce("/admin/register", err instanceof Error ? err.message : "ウマ番を保存できませんでした", true);
        }
      }

      if (method === "POST" && path === "/admin/open") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          await openVoting(env.DB, board.event, board.event.voting_closes_at);
          return bounce("/admin", "投票を開始しました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/close") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          await forceClose(env.DB, board.event);
          return bounce("/admin", "強制締切しました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/next-event") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          await openNextEvent(env.DB, board.event);
          return bounce("/admin", "次の開催を開きました。タイトルと締切を入れてください");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/clear-horses") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const password = readAdminReauth(form);
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin", "管理者パスが違います（空にしていません）", true);
        }
        try {
          const board = await loadBoard(env.DB);
          await clearHorses(env.DB, board.event);
          return bounce("/admin", "出走を空にしました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/discard-event") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const password = readAdminReauth(form);
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin", "管理者パスが違います（破棄していません）", true);
        }
        try {
          const board = await loadBoard(env.DB);
          await discardCurrentSetup(env.DB, board.event);
          return bounce("/admin", "開催を破棄しました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/revert-voting") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const password = readAdminReauth(form);
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin", "管理者パスが違います（戻していません）", true);
        }
        try {
          const board = await loadBoard(env.DB);
          await revertVotingToSetup(env.DB, board.event);
          return bounce("/admin", "投票を取り消し、出走登録に戻しました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/scratch") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const password = readAdminReauth(form);
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin/horses", "管理者パスが違います（取消していません）", true);
        }
        try {
          const board = await loadBoard(env.DB);
          const refunded = await scratchHorse(
            env.DB,
            board.event,
            form.get("horse_id") ?? "",
          );
          return bounce("/admin/horses", `取消しました。返還 ${formatPt(refunded)}`);
        } catch (err) {
          return bounce("/admin/horses", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/places") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          const places = board.horses
            .filter((h) => !h.horse.scratched)
            .map((h) => ({
              horseId: h.horse.id,
              place: Number(form.get(`place_${h.horse.id}`)),
            }));
          await savePlaces(env.DB, board.event, places);
          return bounce("/admin", "着順を保存しました（まだ一般には出していません）");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/publish") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          const result = await publishResults(env.DB, board.event);
          return bounce("/admin", result === "published" ? "公開し、払戻しました" : "すでに公開・払戻済みです");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/member-delete") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const name = await deleteMember(env.DB, form.get("user_id") ?? "");
          return bounce("/admin/ledger", `「${name}」を削除しました`);
        } catch (err) {
          return bounce("/admin/ledger", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/undo") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        if (!adminUndoAllowed(env)) {
          return bounce("/admin", "Undo はこの環境では無効です", true);
        }
        const form = await readForm(request);
        const password = readAdminReauth(form);
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin", "管理者パスが違います（巻き戻していません）", true);
        }
        try {
          const label = await applyAdminUndo(env.DB);
          return bounce("/admin", `「${label}」を巻き戻しました`);
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/reset") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        if (!demoResetAllowed(env)) {
          return bounce("/admin", "デモ初期化はローカルだけです", true);
        }
        const form = await readForm(request);
        const password = readAdminReauth(form);
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin", "管理者パスが違います（初期化していません）", true);
        }
        await resetDemo(env.DB);
        return bounce("/admin", "デモを初期化しました（名前は残し、残高は 0 です）");
      }

      return html(
        plainErrorPage("Not Found", "ページがありません。"),
        404,
      );
    } catch (error) {
      console.error("Unhandled error:", error);
      return html(
        plainErrorPage("エラー", "内部エラーです。"),
        500,
      );
    }
  },
};
