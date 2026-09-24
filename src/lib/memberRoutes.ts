/**
 * メンバー向けルート（入場・場内・窓口・ライブ）。該当しなければ null。
 * 管理は adminRoutes / index の admin POST。
 */
import {
  clearSessionCookie,
  encodeSession,
  sessionCookie,
  sessionExpiry,
  sessionFromRequest,
  timingSafeEqualStr,
  newId,
  type Session,
} from "./auth.ts";
import {
  formatSelectionLabel,
  isBetKind,
  kindIsEnabled,
  normalizeSelection,
  parseEnabledKinds,
  type BetKind,
} from "./bets.ts";
import { exoticReferenceOdds } from "./odds.ts";
import { escapeHtml, bounce, html, json, readForm, redirect } from "./http.ts";
import {
  getUser,
  hasJoinedEvent,
  joinButtonLabel,
  joinEvent,
  listUserBets,
  listUserPayouts,
  loadBoard,
  loginMember,
  numberByHorseId,
  placeBet,
  redoMyBets,
  registerMember,
  type UserRow,
} from "./store.ts";
import {
  BOARD_FLASH_SCRIPT,
  formatPt,
  groupMyBets,
  livePollScript,
  statusLabel,
} from "./ui.ts";
import {
  betBuyPage,
  betClosedPage,
  betJoinPage,
} from "./betLayout.ts";
import { gateLoginPage } from "./gateLayout.ts";
import {
  resolveVenueSlot,
  venueBoardPage,
} from "./venueLayout.ts";
import { paddockPage } from "./paddockPage.ts";
import { paddockView } from "./paddockView.ts";
import { listStrategicSkills } from "./strategicSkills.ts";
import { venueOddsResponse } from "./venueOdds.ts";
import { ticketsPage, ticketShelfLinkHtml, venueTicketNoticeHtml } from "./ticketsLayout.ts";
import { buildMyTickets } from "./ticketsView.ts";

function requiredOperationId(value: string | null): string {
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new Error("画面を更新してからやり直してください");
  }
  return value;
}

function msg(url: URL): { text: string | null; error: boolean } {
  return {
    text: url.searchParams.get("msg"),
    error: url.searchParams.get("err") === "1",
  };
}

function isActiveMember(user: UserRow | null): user is UserRow {
  return user?.role === "member" && user.deleted_at == null;
}

function exoticReferencePreview(
  board: Awaited<ReturnType<typeof loadBoard>>,
  kind: Exclude<BetKind, "win">,
  pickedIds: string[],
) {
  const need = kind === "umaren" || kind === "umatan" ? 2 : 3;
  const live = board.horses.filter((entry) => !entry.horse.scratched);
  if (pickedIds.length < need - 1 || pickedIds.length > need || new Set(pickedIds).size !== pickedIds.length) return null;
  const indexById = new Map(live.map((entry, index) => [entry.horse.id, index]));
  if (pickedIds.some((id) => !indexById.has(id))) return null;
  const pool = board.pools.find((entry) => entry.kind === kind);
  if (!pool) return null;
  const realByKey = new Map(pool.combos.map((combo) => [combo.selection_key, combo.real]));
  const nums = numberByHorseId(board);
  const item = (ids: string[]) => {
    const normalized = normalizeSelection(kind, ids);
    const selection = ids.map((id) => indexById.get(id)!);
    const displayIds = kind === "umaren" || kind === "sanrenpuku"
      ? [...ids].sort((a, b) => (nums.get(a) ?? 0) - (nums.get(b) ?? 0))
      : ids;
    return {
      key: normalized.selection_key,
      label: formatSelectionLabel(kind, displayIds[0]!, displayIds[1] ?? null, displayIds[2] ?? null, nums),
      odds: exoticReferenceOdds({
        kind,
        strengths: live.map((entry) => entry.horse.strength),
        selection,
        seedPool: board.event.seed_pool_s,
        timeWeight: board.wTime,
        realTotal: pool.realTotal,
        selectionReal: realByKey.get(normalized.selection_key) ?? 0,
        takeoutD: board.event.takeout_d,
      }),
    };
  };
  if (pickedIds.length === need) {
    return { state: "selected" as const, items: [item(pickedIds)] };
  }
  return {
    state: "candidates" as const,
    items: live
      .filter((entry) => !pickedIds.includes(entry.horse.id))
      .map((entry) => item([...pickedIds, entry.horse.id])),
  };
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
  if (!isActiveMember(user)) return redirect("/login");
  return { session, user };
}

/** 窓口内で引き継ぐ表示状態だけを安全に URL へ戻す。 */
function betUrl(
  kind: BetKind,
  candidateHorseId: string | null,
  slot: string | null,
): string {
  const params = new URLSearchParams({ kind });
  if (candidateHorseId) params.set("candidate", candidateHorseId);
  if (slot === "day" || slot === "dusk" || slot === "night") {
    params.set("slot", slot);
  }
  return `/bet?${params}`;
}

/** 閲覧ページだけは、管理者セッションからも開けるようにする。 */
async function requireMemberOrAdmin(
  request: Request,
  env: Env,
): Promise<{ session: Session; user: UserRow; preview: boolean } | Response> {
  const session = await sessionFromRequest(request, env.SESSION_SECRET);
  if (!session || (session.role !== "member" && session.role !== "admin")) {
    return redirect("/login");
  }
  const user = await getUser(env.DB, session.userId);
  if (!user || (session.role === "member" && !isActiveMember(user))) {
    return redirect(session.role === "admin" ? "/admin/login" : "/login");
  }
  return { session, user, preview: session.role === "admin" };
}

function memberPasswordOk(env: Env, password: string): boolean {
  const expected = env.MEMBER_PASSWORD;
  if (!expected) return false;
  return timingSafeEqualStr(password, expected);
}

/** メンバーの GET。該当しなければ null */
export async function tryMemberGet(
  request: Request,
  env: Env,
  url: URL,
  path: string,
): Promise<Response | null> {
  if (request.method !== "GET") return null;

  if (path === "/logout") {
    return redirect("/", { "Set-Cookie": clearSessionCookie() });
  }

  if (path === "/login") {
    const session = await sessionFromRequest(request, env.SESSION_SECRET);
    if (session?.role === "member") return redirect("/");
    if (session?.role === "admin") return redirect("/admin");
    return html(gateLoginPage({
      flash: msg(url),
      slot: resolveVenueSlot(url.searchParams.get("slot")),
    }));
  }

  if (path === "/api/board") {
    const board = await loadBoard(env.DB, env.SHOTS);
    const venueView = url.searchParams.get("venue_view");
    if (venueView === "win" || venueView === "umaren" || venueView === "sanrenpuku" || venueView === "ordered") {
      const axis = Number(url.searchParams.get("axis"));
      return json({
        status: board.event.status,
        statusLabel: statusLabel(board.event.status),
        venue: venueOddsResponse(board, venueView, Number.isFinite(axis) ? axis : undefined),
      });
    }
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
    let reference: ReturnType<typeof exoticReferencePreview> | null = null;
    const referenceKind = url.searchParams.get("reference_kind");
    if (referenceKind && isBetKind(referenceKind) && referenceKind !== "win" && liveKinds.includes(referenceKind)) {
      const pickedIds = [url.searchParams.get("h1"), url.searchParams.get("h2"), url.searchParams.get("h3")]
        .filter((id): id is string => Boolean(id));
      reference = exoticReferencePreview(board, referenceKind, pickedIds);
    }
    return json({
      status: board.event.status,
      statusLabel: statusLabel(board.event.status),
      kinds,
      reference,
    });
  }

  const paddockMedia = path.match(/^\/paddock\/(shot|trainer-icon)\/([^/]+)$/);
  if (paddockMedia) {
    const gate = await requireMemberOrAdmin(request, env);
    if (gate instanceof Response) return gate;
    const board = await loadBoard(env.DB, env.SHOTS);
    const horse = board.horses.find((item) => item.horse.id === paddockMedia[2]);
    const key = paddockMedia[1] === "shot"
      ? horse?.horse.shot_key
      : horse?.horse.trainer_icon_key;
    if (!key || !env.SHOTS) return new Response("画像がありません", { status: 404 });
    const obj = await env.SHOTS.get(key);
    if (!obj) return new Response("画像がありません", { status: 404 });
    return new Response(obj.body, { headers: { "Content-Type": obj.httpMetadata?.contentType || "image/jpeg", "Cache-Control": "private, max-age=300" } });
  }

  if (path === "/paddock") {
    const gate = await requireMemberOrAdmin(request, env);
    if (gate instanceof Response) return gate;
    const board = await loadBoard(env.DB, env.SHOTS);
    return html(paddockPage(paddockView(board, await listStrategicSkills(env.DB))));
  }

  if (path === "/tickets") {
    const gate = await requireMemberOrAdmin(request, env);
    if (gate instanceof Response) return gate;
    const board = await loadBoard(env.DB, env.SHOTS);
    const [bets, payouts] = await Promise.all([
      listUserBets(env.DB, board.event.id, gate.user.id),
      listUserPayouts(env.DB, board.event.id, gate.user.id),
    ]);
    return html(ticketsPage({
      board,
      user: gate.user,
      tickets: buildMyTickets(board, bets, payouts),
      preview: gate.preview,
    }));
  }

  if (path === "/__local/venue-odds") {
    // 本番へ比較用の画面を出さない。npm run dev のローカル確認だけで使う。
    if (env.ALLOW_DEMO_RESET !== "1") return null;
    const session = await sessionFromRequest(request, env.SESSION_SECRET);
    const user = session ? await getUser(env.DB, session.userId) : null;
    const board = await loadBoard(env.DB, env.SHOTS);
    const layoutParam = url.searchParams.get("layout");
    const layout = layoutParam === "three" || layoutParam === "five" ? layoutParam : "jra";
    const runnerParam = Number(url.searchParams.get("runners"));
    const oddsPreviewRunnerCount = [15, 16, 17, 18].includes(runnerParam) ? runnerParam : 17;
    return html(venueBoardPage({
      board,
      user,
      flash: msg(url),
      slot: resolveVenueSlot(url.searchParams.get("slot")),
      oddsPreview: layout,
      oddsPreviewRunnerCount,
    }));
  }

  if (path === "/" || path === "/board") {
    const session = await sessionFromRequest(request, env.SESSION_SECRET);
    const user = session ? await getUser(env.DB, session.userId) : null;
    const board = await loadBoard(env.DB, env.SHOTS);
    const m = msg(url);
    const canViewUmabashira = isActiveMember(user) || session?.role === "admin";
    const strategicSkills = canViewUmabashira
      ? await listStrategicSkills(env.DB)
      : [];

    let ticketNoticeHtml: string | undefined;
    let showClosedTicketLink = false;
    if ((board.event.status === "published" || board.event.status === "closed") && isActiveMember(user)) {
      const bets = await listUserBets(env.DB, board.event.id, user.id);
      if (board.event.status === "published") {
        const payouts = await listUserPayouts(env.DB, board.event.id, user.id);
        ticketNoticeHtml = venueTicketNoticeHtml(buildMyTickets(board, bets, payouts));
      } else {
        showClosedTicketLink = bets.length > 0;
      }
    }
    return html(
      venueBoardPage({
        board,
        user,
        flash: m,
        slot: resolveVenueSlot(url.searchParams.get("slot")),
        ticketNoticeHtml,
        showClosedTicketLink,
        strategicSkills,
        showUmabashira: canViewUmabashira,
      }),
    );
  }

  if (path === "/bet") {
    const gate = await requireMemberOrAdmin(request, env);
    if (gate instanceof Response) return gate;
    const board = await loadBoard(env.DB, env.SHOTS);
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

    if (!gate.preview && live && !joined) {
      return html(
        betJoinPage({
          board,
          user,
          flash: m,
          joinLabel: joinButtonLabel(board.event.title),
          kind,
          candidateHorseId: url.searchParams.get("candidate"),
          slot: url.searchParams.get("slot"),
        }),
      );
    }

    const canBuy = !gate.preview && board.event.status === "voting" && joined;
    const ticketViews = buildMyTickets(board, myBets, []);
    const myBetsHtml = ticketShelfLinkHtml(ticketViews);
    const redoHtml =
      canBuy && grouped.length > 0
        ? `<button type="submit" class="text-btn" form="redo-form" onclick="return confirm('全ての馬券がリセットされますがよろしいですか？');">やりなおし（全部取消）</button>`
        : "";

    if (!canBuy && !gate.preview) {
      return html(
        betClosedPage({
          board,
          user,
          flash: m,
          myBetsHtml: grouped.length > 0 ? myBetsHtml : undefined,
        }),
      );
    }

    return html(
      betBuyPage({
        board,
        user,
        kind,
        flash: m,
        myBetsHtml,
        redoHtml,
        betOperationId: newId(),
        redoOperationId: newId(),
        preview: gate.preview,
        candidateHorseId: url.searchParams.get("candidate"),
        slot: url.searchParams.get("slot"),
        scripts:
          (live ? livePollScript("/api/board", kind) : "") + BOARD_FLASH_SCRIPT,
      }),
    );
  }

  return null;
}

/** メンバーの POST。該当しなければ null */
export async function tryMemberPost(
  request: Request,
  env: Env,
  path: string,
): Promise<Response | null> {
  if (request.method !== "POST") return null;

  if (path === "/login") {
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

  if (path === "/bet") {
    const gate = await requireMember(request, env);
    if (gate instanceof Response) return gate;
    const form = await readForm(request);
    const kindRaw = form.get("kind") ?? "win";
    const kind: BetKind = isBetKind(kindRaw) ? kindRaw : "win";
    try {
      const board = await loadBoard(env.DB, env.SHOTS);
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
        requiredOperationId(form.get("operation_id")),
        env.SHOTS,
      );
      const flash = encodeURIComponent(
        JSON.stringify({ hit: result.selection_key }),
      );
      const target = new URL(betUrl(kind, form.get("candidate"), form.get("slot")), "https://oshi-keiba.local");
      target.searchParams.set("b", flash);
      return bounce(target.pathname + target.search, "買いました");
    } catch (e) {
      return bounce(
        betUrl(kind, form.get("candidate"), form.get("slot")),
        e instanceof Error ? e.message : "投票に失敗",
        true,
      );
    }
  }

  if (path === "/bet/join") {
    const gate = await requireMember(request, env);
    if (gate instanceof Response) return gate;
    const form = await readForm(request);
    try {
      const board = await loadBoard(env.DB, env.SHOTS);
      await joinEvent(env.DB, board.event, gate.user);
      const kindRaw = form.get("kind") ?? "win";
      const kind: BetKind = isBetKind(kindRaw) ? kindRaw : "win";
      return bounce(
        betUrl(kind, form.get("candidate"), form.get("slot")),
        "参加しました",
      );
    } catch (e) {
      return bounce(
        betUrl(
          isBetKind(form.get("kind") ?? "") ? form.get("kind") as BetKind : "win",
          form.get("candidate"),
          form.get("slot"),
        ),
        e instanceof Error ? e.message : "参加に失敗",
        true,
      );
    }
  }

  if (path === "/bet/redo") {
    const gate = await requireMember(request, env);
    if (gate instanceof Response) return gate;
    const form = await readForm(request);
    try {
      const board = await loadBoard(env.DB, env.SHOTS);
      const total = await redoMyBets(
        env.DB,
        board.event,
        gate.user,
        requiredOperationId(form.get("operation_id")),
        env.SHOTS,
      );
      return bounce(
        "/bet",
        `やりなおしました（${formatPt(total)} を戻しました）`,
      );
    } catch (e) {
      return bounce(
        "/bet",
        e instanceof Error ? e.message : "やりなおしに失敗",
        true,
      );
    }
  }

  return null;
}
