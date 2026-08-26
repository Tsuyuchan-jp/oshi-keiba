import {
  clearSessionCookie,
  encodeSession,
  sessionCookie,
  sessionExpiry,
  sessionFromRequest,
  timingSafeEqualStr,
  type Session,
} from "./lib/auth";
import {
  BET_KIND_LABEL,
  formatSelectionLabel,
  isBetKind,
  kindIsEnabled,
  OPTIONAL_BET_KINDS,
  parseEnabledKinds,
  serializeEnabledKinds,
  type BetKind,
} from "./lib/bets";
import { escapeHtml, html, json, readForm, redirect } from "./lib/http";
import {
  addHorse,
  clearHorses,
  deleteMember,
  discardCurrentSetup,
  dropHorse,
  forceClose,
  getUser,
  hasJoinedEvent,
  joinButtonLabel,
  joinEvent,
  listUserBets,
  listUserPayouts,
  loadBoard,
  loginMember,
  MAX_SHOT_BYTES,
  numberByHorseId,
  openNextEvent,
  openVoting,
  placeBet,
  publishResults,
  redoMyBets,
  registerMember,
  resetDemo,
  revertVotingToSetup,
  savePlaces,
  scratchHorse,
  setHorseShotKey,
  updateHorse,
  updateParams,
  upsertUser,
} from "./lib/store";
import { applyAdminUndo } from "./lib/undo";
import {
  BOARD_FLASH_SCRIPT,
  betTabsHtml,
  comboOddsTable,
  DEDUPE_SELECT_SCRIPT,
  flashHtml,
  formatPt,
  groupMyBets,
  layout,
  livePollScript,
  parseJstInput,
  pickSelects,
  statusLabel,
  winSheetTable,
  kindVoidNotes,
} from "./lib/ui";
import { tryAdminGet } from "./lib/adminRoutes";
import { resolveVenueSlot, venueBoardPage, venueTicketsHtml } from "./lib/venueLayout";
import {
  parseHorseScoreInput,
  serializeHorseScoreInput,
} from "./lib/horseScoreInput";
import { resolveStrength } from "./lib/scoreFromHorse";
import { enrichScoreSetupWithEffects, scoreSetupFromForm } from "./lib/scoreSetup";
import { normalizeShotMime } from "./lib/shotMime";
import { eventScoreSetup } from "./lib/store";
import type { UserRow } from "./lib/store";

function msg(url: URL): { text: string | null; error: boolean } {
  return {
    text: url.searchParams.get("msg"),
    error: url.searchParams.get("err") === "1",
  };
}

function bounce(path: string, text: string, error = false): Response {
  const u = new URL(path, "https://oshi-keiba.local");
  u.searchParams.set("msg", text);
  if (error) u.searchParams.set("err", "1");
  return redirect(u.pathname + u.search);
}

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

async function requireMember(
  request: Request,
  env: Env,
): Promise<{ session: Session; user: UserRow } | Response> {
  const session = await sessionFromRequest(request, env.SESSION_SECRET);
  if (!session || session.role !== "member") {
    return redirect("/login");
  }
  const user = await getUser(env.DB, session.userId);
  if (!user) return redirect("/login");
  return { session, user };
}

function memberPasswordOk(env: Env, password: string): boolean {
  const expected = env.MEMBER_PASSWORD;
  if (!expected) return false;
  return timingSafeEqualStr(password, expected);
}

async function putHorseShot(
  env: Env,
  eventId: string,
  horseId: string,
  file: File,
): Promise<string> {
  if (!env.SHOTS) throw new Error("画像の保存先がまだありません");
  if (file.size <= 0) throw new Error("画像が空です");
  if (file.size > MAX_SHOT_BYTES) throw new Error("画像が大きすぎます（2MBまで）");
  const contentType = normalizeShotMime(file.type, file.name);
  if (!contentType) throw new Error("対応形式は PNG / JPEG / WebP です");
  const key = `${eventId}/${horseId}`;
  await env.SHOTS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType },
  });
  return key;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      if (method === "GET" && path === "/logout") {
        return redirect("/", { "Set-Cookie": clearSessionCookie() });
      }

      const adminGet = await tryAdminGet(request, env, url, path);
      if (adminGet) return adminGet;

      // —— メンバー入室 ——
      if (method === "GET" && path === "/login") {
        const session = await sessionFromRequest(request, env.SESSION_SECRET);
        if (session?.role === "member") return redirect("/");
        if (session?.role === "admin") return redirect("/admin");
        const m = msg(url);
        const board = await loadBoard(env.DB);
        return html(
          layout({
            title: "入室",
            eventStatus: board.event.status,
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>入室</h1>
                <p class="note">表示名だけで入ります。個人パスワードはありません。スペはその開催に参加したときに入ります。</p>
                <form method="post" action="/login" class="row" style="margin-bottom:1.25rem">
                  <input type="hidden" name="mode" value="register">
                  <label>表示名 <input name="display_name" required maxlength="40" autocomplete="nickname"></label>
                  <label>共有パス <input name="password" type="password" required></label>
                  <button type="submit">初めて入室（登録）</button>
                </form>
                <form method="post" action="/login" class="row">
                  <input type="hidden" name="mode" value="login">
                  <label>表示名 <input name="display_name" required maxlength="40" autocomplete="nickname"></label>
                  <label>共有パス <input name="password" type="password" required></label>
                  <button type="submit" class="secondary">登録済み再入室</button>
                </form>
              </div>`,
          }),
        );
      }

      if (method === "POST" && path === "/login") {
        const form = await readForm(request);
        const password = form.get("password") ?? "";
        const name = form.get("display_name") ?? "";
        const mode = form.get("mode") ?? "login";
        if (!memberPasswordOk(env, password)) {
          return bounce("/login", "共有パスが違います", true);
        }
        try {
          const user =
            mode === "register"
              ? await registerMember(env.DB, name)
              : await loginMember(env.DB, name);
          const token = await encodeSession(
            { userId: user.id, role: "member", exp: sessionExpiry() },
            env.SESSION_SECRET,
          );
          return redirect("/", { "Set-Cookie": sessionCookie(token) });
        } catch (e) {
          return bounce(
            "/login",
            e instanceof Error ? e.message : "入室に失敗",
            true,
          );
        }
      }

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

      // —— ライブ API ——
      if (method === "GET" && path === "/api/board") {
        const board = await loadBoard(env.DB);
        const nums = numberByHorseId(board);
        const kinds: Record<
          string,
          { key: string; label: string; odds: number | null }[]
        > = {};
        const liveKinds = parseEnabledKinds(board.event.enabled_kinds);
        for (const k of liveKinds) {
          if (k === "win") {
            const votingLike =
              board.event.status === "voting" || board.event.status === "setup";
            kinds.win = board.horses
              .filter((h) => !h.horse.scratched)
              .map((h) => ({
                key: h.horse.id,
                label: String(h.number),
                odds: votingLike ? h.referenceOdds : h.confirmedOdds,
              }));
          } else {
            const pool = board.pools.find((p) => p.kind === k)!;
            kinds[k] = pool.combos.map((c) => ({
              key: c.selection_key,
              label: formatSelectionLabel(
                k,
                c.horse_1,
                c.horse_2,
                c.horse_3,
                nums,
              ),
              odds: c.odds,
            }));
          }
        }
        return json({
          status: board.event.status,
          statusLabel: statusLabel(board.event.status),
          kinds,
        });
      }

      // —— 場内（未入室でも閲覧可。買うには入室） ——
      if (method === "GET" && (path === "/" || path === "/board")) {
        const session = await sessionFromRequest(request, env.SESSION_SECRET);
        const user = session ? await getUser(env.DB, session.userId) : null;
        const board = await loadBoard(env.DB);
        const m = msg(url);
        const live = board.event.status === "voting";

        if (
          board.event.status === "voting" ||
          board.event.status === "closed" ||
          board.event.status === "published"
        ) {
          let ticketsHtml: string | undefined;
          if (board.event.status === "published" && user && user.role === "member") {
            const bets = await listUserBets(env.DB, board.event.id, user.id);
            const payouts = await listUserPayouts(env.DB, board.event.id, user.id);
            ticketsHtml = venueTicketsHtml(bets, payouts, board);
          }
          return html(
            venueBoardPage({
              board,
              user,
              flash: m,
              slot: resolveVenueSlot(url.searchParams.get("slot")),
              ticketsHtml,
              scripts:
                board.event.status === "voting"
                  ? livePollScript("/api/board", "win")
                  : "",
            }),
          );
        }

        let cta = "";
        if (board.event.status === "setup") {
          cta = `<p class="note">投票開始までお待ちください。</p>`;
        }

        return html(
          layout({
            title: "場内",
            user,
            eventStatus: board.event.status,
            live,
            scripts: live ? livePollScript("/api/board", "win") : "",
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>${escapeHtml(board.event.title)}</h1>
                <p class="muted">場内（単勝オッズ）</p>
                ${winSheetTable(board)}
                ${kindVoidNotes(board)}
                ${cta}
              </div>`,
          }),
        );
      }

      // —— 投票ページ ——
      if (method === "GET" && path === "/bet") {
        const gate = await requireMember(request, env);
        if (gate instanceof Response) return gate;
        const board = await loadBoard(env.DB);
        const user = (await getUser(env.DB, gate.user.id))!;
        const m = msg(url);
        const kindParam = url.searchParams.get("kind") ?? "win";
        let kind: BetKind = isBetKind(kindParam) ? kindParam : "win";
        if (!kindIsEnabled(board.event.enabled_kinds, kind)) {
          return redirect("/bet");
        }
        const live = board.event.status === "voting";
        const joined = await hasJoinedEvent(env.DB, board.event.id, user.id);
        const myBets = await listUserBets(env.DB, board.event.id, user.id);
        const grouped = groupMyBets(myBets, board);

        if (live && !joined) {
          return html(
            layout({
              title: "投票",
              user,
              eventStatus: board.event.status,
              body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>投票</h1>
                <p class="bal-now"><span class="bal-k">いまの所持</span><strong>${formatPt(user.balance)}</strong></p>
                <form method="post" action="/bet/join">
                  <p class="cta"><button type="submit">${escapeHtml(joinButtonLabel(board.event.title))}</button></p>
                </form>
              </div>`,
            }),
          );
        }

        const canBuy = board.event.status === "voting" && joined;
        const form = canBuy
          ? `<form method="post" action="/bet" class="bet-form" id="bet-form">
              <input type="hidden" name="kind" value="${kind}">
              <div class="row">${pickSelects(kind, board)}</div>
              <div class="row">
                <button type="button" class="amt secondary" data-add="100">+100</button>
                <button type="button" class="amt secondary" data-add="500">+500</button>
                <button type="button" class="amt secondary" data-amt="all">残り全部</button>
                <label>金額（スペ）
                  <input name="amount" id="bet-amount" type="number" min="0" step="${board.event.bet_unit}" value="0" required>
                </label>
                <button type="submit">買う</button>
              </div>
            </form>
            <script>
              (() => {
                const bal = ${user.balance};
                const unit = ${board.event.bet_unit};
                const kindLabel = ${JSON.stringify(BET_KIND_LABEL[kind])};
                const form = document.getElementById("bet-form");
                const input = document.getElementById("bet-amount");
                const cap = Math.floor(bal / unit) * unit;
                const setAmt = (n) => {
                  const v = Math.max(0, Math.min(cap, Math.floor(n / unit) * unit));
                  input.value = String(v);
                };
                document.querySelectorAll("[data-add]").forEach((btn) => {
                  btn.addEventListener("click", () => {
                    setAmt(Number(input.value || 0) + Number(btn.getAttribute("data-add")));
                  });
                });
                document.querySelectorAll("[data-amt]").forEach((btn) => {
                  btn.addEventListener("click", () => {
                    if (btn.getAttribute("data-amt") === "all") setAmt(cap);
                  });
                });
                form.addEventListener("submit", (ev) => {
                  const picks = [...form.querySelectorAll("select")].map((s) => {
                    const opt = s.options[s.selectedIndex];
                    return opt && opt.value ? opt.textContent.trim() : "";
                  }).filter(Boolean);
                  const amt = Number(input.value);
                  if (!picks.length || !(amt >= unit)) {
                    ev.preventDefault();
                    alert("買い目と金額（" + unit + " スペ単位）を入れてください");
                    return;
                  }
                  const msg = "この内容で買いますか？\\n\\n" + kindLabel + "\\n" + picks.join(" / ") + "\\n" + amt.toLocaleString("ja-JP") + " スペ";
                  if (!confirm(msg)) ev.preventDefault();
                });
              })();
            </script>
            ${DEDUPE_SELECT_SCRIPT}`
          : `<p class="note">いまは投票期間外です。場内でオッズを見てください。</p>`;

        const myList =
          grouped.length === 0
            ? `<p class="muted">まだ馬券がありません。</p>`
            : `<table><thead><tr><th>内容</th><th>額</th></tr></thead><tbody>
                ${grouped.map((g) => `<tr data-sel="${escapeHtml(g.selection_key)}"><td>${escapeHtml(g.label)}</td><td class="num">${formatPt(g.amount)}</td></tr>`).join("")}
              </tbody></table>`;

        const redo =
          canBuy && grouped.length > 0
            ? `<div class="redo-wrap">
                <form method="post" action="/bet/redo"
                  onsubmit="return confirm('全ての馬券がリセットされますがよろしいですか？');">
                  <button type="submit" class="text-btn">やりなおし（全部取消）</button>
                </form>
              </div>`
            : "";

        return html(
          layout({
            title: "投票",
            user,
            eventStatus: board.event.status,
            live,
            scripts:
              (live ? livePollScript("/api/board", kind) : "") + BOARD_FLASH_SCRIPT,
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>馬券を買う</h1>
                <p class="bal-now"><span class="bal-k">いまの所持</span><strong>${formatPt(user.balance)}</strong></p>
                ${betTabsHtml(kind, board.event.enabled_kinds)}
                ${form}
                <h2>${escapeHtml(BET_KIND_LABEL[kind])}のオッズ</h2>
                ${comboOddsTable(board, kind)}
                <div class="my-bets">
                  <h2>自分の馬券</h2>
                  ${myList}
                </div>
                ${redo}
              </div>`,
          }),
        );
      }

      if (method === "POST" && path === "/bet") {
        const gate = await requireMember(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const kindRaw = form.get("kind") ?? "win";
        const kind: BetKind = isBetKind(kindRaw) ? kindRaw : "win";
        try {
          const board = await loadBoard(env.DB);
          const ids = [
            form.get("h1") ?? "",
            form.get("h2") ?? "",
            form.get("h3") ?? "",
          ].filter(Boolean);
          const result = await placeBet(
            env.DB,
            board.event,
            gate.user,
            kind,
            ids,
            Number(form.get("amount") ?? "0"),
          );
          const flash = encodeURIComponent(
            JSON.stringify({ hit: result.selection_key }),
          );
          return bounce(
            `/bet?kind=${kind}&b=${flash}`,
            "買いました",
          );
        } catch (e) {
          return bounce(
            `/bet?kind=${kind}`,
            e instanceof Error ? e.message : "投票に失敗",
            true,
          );
        }
      }

      if (method === "POST" && path === "/bet/join") {
        const gate = await requireMember(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          await joinEvent(env.DB, board.event, gate.user);
          return bounce("/bet", "参加しました");
        } catch (e) {
          return bounce(
            "/bet",
            e instanceof Error ? e.message : "参加に失敗",
            true,
          );
        }
      }

      if (method === "POST" && path === "/bet/redo") {
        const gate = await requireMember(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          const total = await redoMyBets(env.DB, board.event, gate.user);
          return bounce("/bet", `やりなおしました（${formatPt(total)} を戻しました）`);
        } catch (e) {
          return bounce(
            "/bet",
            e instanceof Error ? e.message : "やりなおしに失敗",
            true,
          );
        }
      }

      // —— 管理 POST ——
      if (method === "POST" && path === "/admin/params") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const board = await loadBoard(env.DB);
        const closesRaw = form.get("closes_at") ?? "";
        try {
          await updateParams(env.DB, board.event, {
            title: form.get("title") ?? board.event.title,
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
            score_setup: await (async () => {
              const base = scoreSetupFromForm((name) =>
                String(form.get(name) ?? ""),
              );
              if (!base) return null;
              return enrichScoreSetupWithEffects(base);
            })(),
          });
          return bounce("/admin/settings", "レースイベント設定を保存しました");
        } catch (err) {
          return bounce("/admin/settings", err instanceof Error ? err.message : "保存失敗", true);
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
          let scoreInput = parseHorseScoreInput(String(fd.get("score_input") ?? ""));
          const styleRaw = String(fd.get("style_key") ?? "").trim();
          if (scoreInput && styleRaw) {
            const parsed = parseHorseScoreInput({
              ...scoreInput,
              styleKey: styleRaw,
            });
            scoreInput = parsed;
          } else if (scoreInput && !styleRaw) {
            scoreInput = { ...scoreInput, styleKey: null };
          }
          const forceManual = String(fd.get("strength_manual") ?? "") === "1";
          const resolved = resolveStrength({
            setup,
            input: scoreInput,
            manualStrength: Number(fd.get("strength")),
            forceManual,
          });
          const id = await addHorse(
            env.DB,
            board.event,
            String(fd.get("uma_name") ?? ""),
            String(fd.get("runner_name") ?? ""),
            {
              strength: resolved.strength,
              scoreInputJson: serializeHorseScoreInput(scoreInput),
              seedSource: resolved.source,
            },
          );
          if (ocrOk && shot instanceof File) {
            try {
              const key = await putHorseShot(env, board.event.id, id, shot);
              await setHorseShotKey(env.DB, board.event, id, key);
            } catch (err) {
              await env.DB.prepare("DELETE FROM horses WHERE id = ? AND event_id = ?")
                .bind(id, board.event.id)
                .run();
              throw err;
            }
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
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          const horseId = form.get("horse_id") ?? "";
          const existing = board.horses.find((h) => h.horse.id === horseId);
          if (!existing) throw new Error("出走が見つかりません");
          const setup = eventScoreSetup(board.event);
          let scoreInput = parseHorseScoreInput(existing.horse.score_input);
          const styleRaw = String(form.get("style_key") ?? "").trim();
          if (scoreInput) {
            scoreInput = parseHorseScoreInput({
              ...scoreInput,
              styleKey: styleRaw || null,
            });
          }
          const forceManual = String(form.get("strength_manual") ?? "") === "1";
          const resolved = resolveStrength({
            setup,
            input: scoreInput,
            manualStrength: Number(form.get("strength")),
            forceManual,
          });
          await updateHorse(
            env.DB,
            board.event,
            horseId,
            form.get("uma_name") ?? "",
            form.get("runner_name") ?? "",
            {
              strength: resolved.strength,
              scoreInputJson: serializeHorseScoreInput(scoreInput),
              seedSource: resolved.source,
              keepScoreInput: false,
            },
          );
          return bounce("/admin/register", "更新しました");
        } catch (err) {
          return bounce("/admin/register", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/horse-drop") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const password = readAdminReauth(form);
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin/register", "管理者パスが違います（外していません）", true);
        }
        try {
          const board = await loadBoard(env.DB);
          await dropHorse(env.DB, board.event, form.get("horse_id") ?? "");
          return bounce("/admin/register", "名簿から外しました");
        } catch (err) {
          return bounce("/admin/register", err instanceof Error ? err.message : "失敗", true);
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
          await publishResults(env.DB, board.event);
          return bounce("/admin", "公開し、払戻しました");
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
        layout({
          title: "Not Found",
          body: `<div class="card"><p>ページがありません。</p></div>`,
        }),
        404,
      );
    } catch (error) {
      console.error("Unhandled error:", error);
      return html(
        layout({
          title: "エラー",
          body: `<div class="card"><p>内部エラーです。</p></div>`,
        }),
        500,
      );
    }
  },
};
