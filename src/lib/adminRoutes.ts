import { html, redirect } from "./http";
import { layoutAdmin } from "./adminLayout";
import {
  adminHorsesPage,
  adminLedgerPage,
  adminLoginBody,
  adminOddsPage,
  adminProgressPage,
  adminReauthField,
  adminRegisterPage,
  adminSettingsPage,
  betRowHtml,
  recentBetsHtml,
} from "./adminUi";
import { loadStrategicSkillsBundle } from "./adminStrategicApi";
import {
  getUser,
  eventScoreSetup,
  listAllBets,
  listEventPayouts,
  listMembers,
  loadBoard,
  numberByHorseId,
} from "./store";
import { getAdminUndoMeta } from "./undo";
import { sessionFromRequest } from "./auth";
import type { Session } from "./auth";
import type { UserRow } from "./store";
import { prepareAutoScoreRecompute } from "./scoreRecompute";

function msg(url: URL): { text: string | null; error: boolean } {
  return {
    text: url.searchParams.get("msg"),
    error: url.searchParams.get("err") === "1",
  };
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

/** 管理の GET。該当しなければ null */
export async function tryAdminGet(
  request: Request,
  env: Env,
  url: URL,
  path: string,
): Promise<Response | null> {
  if (request.method !== "GET") return null;

  if (path === "/admin/login") {
    const board = await loadBoard(env.DB);
    const m = msg(url);
    return html(
      layoutAdmin({
        title: "管理者ログイン",
        tab: "login",
        eventStatus: board.event.status,
        body: adminLoginBody(m),
      }),
    );
  }

  const shot = path.match(/^\/admin\/shot\/([^/]+)$/);
  if (shot) {
    const gate = await requireAdmin(request, env);
    if (gate instanceof Response) return gate;
    const board = await loadBoard(env.DB);
    const horse = board.horses.find((h) => h.horse.id === shot[1]);
    const key = horse?.horse.shot_key;
    if (!key || !env.SHOTS) {
      return new Response("画像がありません", { status: 404 });
    }
    const obj = await env.SHOTS.get(key);
    if (!obj) return new Response("画像がありません", { status: 404 });
    const type = obj.httpMetadata?.contentType || "image/jpeg";
    return new Response(obj.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=300",
      },
    });
  }

  const pages = new Set([
    "/admin",
    "/admin/register",
    "/admin/horses",
    "/admin/ledger",
    "/admin/odds",
    "/admin/settings",
  ]);
  if (!pages.has(path)) return null;

  const gate = await requireAdmin(request, env);
  if (gate instanceof Response) return gate;
  const board = await loadBoard(env.DB);
  const m = msg(url);
  const allowDemo = env.ALLOW_DEMO_RESET === "1";

  if (path === "/admin") {
    const members = await listMembers(env.DB);
    const allBets = await listAllBets(env.DB, board.event.id, "new");
    let undoMeta = null;
    try {
      undoMeta = await getAdminUndoMeta(env.DB);
    } catch {
      undoMeta = null;
    }
    const nums = numberByHorseId(board);
    const page = adminProgressPage({
      board,
      undoMeta,
      allowDemo,
      memberCount: members.length,
      betCount: allBets.length,
      recentBetsHtml: recentBetsHtml(allBets, board, nums),
    });
    return html(
      layoutAdmin({
        title: "進行",
        tab: "progress",
        user: gate.user,
        eventStatus: board.event.status,
        flash: m,
        body: page.body,
        afterDash: page.afterDash,
        scripts: page.scripts,
      }),
    );
  }

  if (path === "/admin/register") {
    const strategic = await loadStrategicSkillsBundle(env.DB);
    const page = adminRegisterPage(
      board,
      url.searchParams.get("edit"),
      m,
      strategic,
    );
    return html(
      layoutAdmin({
        title: "出走登録",
        tab: "register",
        user: gate.user,
        eventStatus: board.event.status,
        body: page.body,
        scripts: page.scripts,
      }),
    );
  }

  if (path === "/admin/horses") {
    const strategic = await loadStrategicSkillsBundle(env.DB);
    let preview = undefined;
    if (url.searchParams.get("rescore") === "preview" && board.event.status === "setup") {
      try {
        preview = await prepareAutoScoreRecompute(env.DB, board.event, eventScoreSetup(board.event), strategic.skills);
      } catch (err) {
        return redirect(`/admin/horses?err=1&msg=${encodeURIComponent(err instanceof Error ? err.message : "再計算内容を取得できません")}`);
      }
    }
    return html(
      layoutAdmin({
        title: "出走",
        tab: "horses",
        user: gate.user,
        eventStatus: board.event.status,
        flash: m,
        body: adminHorsesPage(
          board,
          url.searchParams.get("sel"),
          adminReauthField(),
          strategic.skills,
          preview,
        ),
      }),
    );
  }

  if (path === "/admin/ledger") {
    const betOrder = url.searchParams.get("bets") === "name" ? "name" : "new";
    const members = await listMembers(env.DB);
    const allBets = await listAllBets(env.DB, board.event.id, betOrder);
    const payouts = await listEventPayouts(env.DB, board.event.id);
    const payByBet = new Map(payouts.map((p) => [p.bet_id, p]));
    const nums = numberByHorseId(board);
    const betRows = allBets.map((b) => betRowHtml(b, board, nums, payByBet)).join("");
    return html(
      layoutAdmin({
        title: "台帳",
        tab: "ledger",
        user: gate.user,
        eventStatus: board.event.status,
        flash: m,
        body: adminLedgerPage({ board, members, betRows, betOrder }),
      }),
    );
  }

  if (path === "/admin/odds") {
    return html(
      layoutAdmin({
        title: "オッズ",
        tab: "odds",
        user: gate.user,
        eventStatus: board.event.status,
        flash: m,
        body: adminOddsPage(board),
      }),
    );
  }

  const settings = adminSettingsPage(board, m);
  return html(
    layoutAdmin({
      title: "開催設定",
      tab: "settings",
      user: gate.user,
      eventStatus: board.event.status,
      flash: m,
      body: settings.body,
      scripts: settings.scripts,
    }),
  );
}
