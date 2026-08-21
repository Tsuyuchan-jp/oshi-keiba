import {
  clearSessionCookie,
  encodeSession,
  sessionCookie,
  sessionExpiry,
  sessionFromRequest,
  timingSafeEqualStr,
  type Session,
} from "./lib/auth";
import { escapeHtml, html, json, readForm, redirect } from "./lib/http";
import {
  addHorse,
  ensureDemoMembers,
  forceClose,
  getUser,
  grantIfNeeded,
  isDemoMemberName,
  listUserBets,
  loadBoard,
  openVoting,
  placeBet,
  publishResults,
  resetDemo,
  savePlaces,
  scratchHorse,
  seedDemoHorses,
  updateParams,
  upsertUser,
} from "./lib/store";
import {
  formulaPanel,
  HINT,
  boardTable,
  flashHtml,
  formatOdds,
  formatPt,
  layout,
  parseJstInput,
  statusLabel,
  toJstInput,
  wCaption,
} from "./lib/ui";
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      if (method === "GET" && path === "/login") {
        const m = msg(url);
        return html(
          layout({
            title: "ログイン（仮）",
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>メンバーログイン<span class="stamp">仮</span></h1>
                <p class="note">共通の仮パスワードと、自分の表示名。名前を変えれば複数アカウント相当です。本番のメンバーシップ認証ではありません。</p>
                <form method="post" action="/login">
                  <div class="row">
                    <label>表示名 <input name="name" required maxlength="40"></label>
                    <label>仮パスワード <input name="password" type="password" required></label>
                    <button type="submit">入室</button>
                  </div>
                </form>
              </div>`,
          }),
        );
      }

      if (method === "POST" && path === "/login") {
        const form = await readForm(request);
        const name = (form.get("name") ?? "").trim();
        const password = form.get("password") ?? "";
        if (!name) return bounce("/login", "表示名を入れてください", true);
        if (!timingSafeEqualStr(password, env.MEMBER_PASSWORD)) {
          return bounce("/login", "仮パスワードが違います", true);
        }
        const eventBoard = await loadBoard(env.DB);
        const user0 = await upsertUser(env.DB, name, "member");
        const user = await grantIfNeeded(env.DB, eventBoard.event, user0);
        const token = await encodeSession(
          { userId: user.id, role: "member", exp: sessionExpiry() },
          env.SESSION_SECRET,
        );
        return redirect("/", { "Set-Cookie": sessionCookie(token) });
      }

      if (method === "GET" && path === "/logout") {
        return redirect("/login", { "Set-Cookie": clearSessionCookie() });
      }

      if (method === "GET" && path === "/admin/login") {
        const m = msg(url);
        return html(
          layout({
            title: "管理者ログイン（仮）",
            admin: true,
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>管理者ログイン<span class="stamp">仮</span></h1>
                <form method="post" action="/admin/login">
                  <div class="row">
                    <label>仮パスワード <input name="password" type="password" required></label>
                    <button type="submit">管理画面へ</button>
                  </div>
                </form>
              </div>`,
          }),
        );
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

      if (method === "GET" && path === "/api/board") {
        const session = await sessionFromRequest(request, env.SESSION_SECRET);
        const board = await loadBoard(env.DB);
        const showPlaces =
          board.event.status === "published" || session?.role === "admin";
        return json({
          status: board.event.status,
          statusLabel: statusLabel(board.event.status),
          caption: wCaption(board),
          showPlaces,
          horses: board.horses.map((h) => ({
            id: h.horse.id,
            name: h.horse.name,
            scratched: !!h.horse.scratched,
            real: h.real,
            seed: h.seed,
            referenceOdds: h.referenceOdds,
            confirmedOdds: h.confirmedOdds,
            finishPlace: showPlaces ? h.horse.finish_place : null,
          })),
        });
      }

      if (method === "GET" && path === "/demo") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const board = await loadBoard(env.DB);
        const members = await ensureDemoMembers(env.DB, board.event);
        const showPlaces = board.event.status === "published";
        const m = msg(url);
        const who = url.searchParams.get("who") ?? "メンバー01";
        const live = board.horses.filter((h) => !h.horse.scratched);
        const options = live
          .map(
            (h) =>
              `<option value="${h.horse.id}">${escapeHtml(h.horse.name)}</option>`,
          )
          .join("");
        const chips = members
          .map(
            (u) =>
              `<button type="button" class="chip${u.display_name === who ? " on" : ""}" data-who="${escapeHtml(u.display_name)}">${escapeHtml(u.display_name)}</button>`,
          )
          .join("");
        const rows = members
          .map((u) => {
            const canBet = board.event.status === "voting";
            const betCell = canBet
              ? `<form method="post" action="/demo/bet" class="row">
                  <input type="hidden" name="user_id" value="${u.id}">
                  <input type="hidden" name="who" value="${escapeHtml(u.display_name)}">
                  <select name="horse_id">${options}</select>
                  <input name="amount" type="number" min="${board.event.bet_unit}" step="${board.event.bet_unit}" value="700" required style="width:6.5rem">
                  <button type="submit">買う</button>
                </form>`
              : `<span class="muted">投票期間外</span>`;
            return `<tr class="desk-row${u.display_name === who ? " desk-focus" : ""}" data-who="${escapeHtml(u.display_name)}">
              <td><button type="button" class="chip${u.display_name === who ? " on" : ""}" data-who="${escapeHtml(u.display_name)}">${escapeHtml(u.display_name)}</button></td>
              <td class="num">${formatPt(u.balance)}</td>
              <td>${betCell}</td>
            </tr>`;
          })
          .join("");
        return html(
          layout({
            title: "デモ用投票画面（仮）",
            user: gate.user,
            admin: true,
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>デモ用投票画面<span class="stamp">仮</span></h1>
                <p class="note">運営が 10 人分を代行する画面です。会員向けのログインではありません。チップまたは行で強調、投票は各行から直接できます。</p>
                <p>${statusLabel(board.event.status)}</p>
                <p class="note">${HINT}</p>
                <p class="note">${wCaption(board)}</p>
                ${boardTable(board, { showPlaces })}
              </div>
              <div class="card">
                <h2>メンバー01〜10</h2>
                <div class="chips">${chips}</div>
                <table>
                  <thead><tr><th>名前</th><th>所持額</th><th>単勝</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
              <script>
                const apply = (who) => {
                  document.querySelectorAll("[data-who]").forEach((el) => {
                    const on = el.getAttribute("data-who") === who;
                    el.classList.toggle("on", on && el.classList.contains("chip"));
                    if (el.classList.contains("desk-row")) el.classList.toggle("desk-focus", on);
                  });
                  history.replaceState(null, "", "/demo?who=" + encodeURIComponent(who));
                };
                document.querySelectorAll("[data-who]").forEach((el) => {
                  el.addEventListener("click", (ev) => {
                    if (ev.target.closest("form")) return;
                    apply(el.getAttribute("data-who"));
                  });
                });
              </script>`,
          }),
        );
      }

      if (method === "POST" && path === "/demo/bet") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const who = form.get("who") ?? "メンバー01";
        try {
          const board = await loadBoard(env.DB);
          const user = await getUser(env.DB, form.get("user_id") ?? "");
          if (!user || !isDemoMemberName(user.display_name)) {
            throw new Error("デモ用投票画面のメンバーではありません");
          }
          await placeBet(
            env.DB,
            board.event,
            user,
            form.get("horse_id") ?? "",
            Number(form.get("amount") ?? "0"),
          );
          return bounce(`/demo?who=${encodeURIComponent(who)}`, `${user.display_name} が投票しました`);
        } catch (e) {
          return bounce(
            `/demo?who=${encodeURIComponent(who)}`,
            e instanceof Error ? e.message : "投票に失敗",
            true,
          );
        }
      }

      if (method === "GET" && (path === "/" || path === "/board")) {
        const session = await sessionFromRequest(request, env.SESSION_SECRET);
        const user = session ? await getUser(env.DB, session.userId) : null;
        const board = await loadBoard(env.DB);
        const showPlaces = board.event.status === "published";
        const m = msg(url);
        const myBets =
          user && session?.role === "member"
            ? await listUserBets(env.DB, board.event.id, user.id)
            : [];
        const live = board.horses.filter((h) => !h.horse.scratched);
        const betForm =
          session?.role === "member" && board.event.status === "voting"
            ? `<form method="post" action="/bet" class="row">
                <label>ウマ娘
                  <select name="horse_id">${live
                    .map(
                      (h) =>
                        `<option value="${h.horse.id}">${escapeHtml(h.horse.name)}</option>`,
                    )
                    .join("")}</select>
                </label>
                <label>金額（単位 ${board.event.bet_unit}）
                  <input name="amount" type="number" min="${board.event.bet_unit}" step="${board.event.bet_unit}" value="700" required>
                </label>
                <button type="submit">単勝を買う</button>
              </form>
              <p class="note">1頭へ全額可。1人一票にはしません。複数頭・複数回できます。</p>`
            : session?.role === "member"
              ? `<p class="note">いまは投票できません（${statusLabel(board.event.status)}）。</p>`
              : `<p class="note">投票はデモ用投票画面から行います。</p>`;

        const oddsName =
          board.event.status === "closed" || board.event.status === "published"
            ? "確定配当"
            : "参考オッズ";

        const resultNote =
          board.event.status === "closed"
            ? `<p class="note">着順は note 公開に合わせるため、ここではまだ出しません。確定配当だけ見えます。</p>`
            : board.event.status === "published" && board.winVoid
              ? `<p class="note">1着に実際の投票額が無かったため、この賭式は不成立・返還です。</p>`
              : "";

        const myList = myBets.length
          ? `<ul>${myBets
              .map((b) => {
                const h = board.horses.find((x) => x.horse.id === b.horse_id);
                return `<li>${escapeHtml(h?.horse.name ?? b.horse_id)} ${formatPt(b.amount)}${b.refunded ? "（返還）" : ""}</li>`;
              })
              .join("")}</ul>`
          : `<p class="muted">まだ投票していません。</p>`;

        return html(
          layout({
            title: "オッズ表（仮）",
            user,
            loginNav: "text",
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>${escapeHtml(board.event.title)}<span class="stamp">仮</span></h1>
                <p>${statusLabel(board.event.status)}　／　${oddsName}</p>
                ${boardTable(board, { showPlaces })}
                ${resultNote}
              </div>
              <div class="card">
                <h2>単勝を買う</h2>
                ${betForm}
              </div>
              <div class="card">
                <h2>自分の投票</h2>
                ${myList}
              </div>`,
          }),
        );
      }

      if (method === "POST" && path === "/bet") {
        const gate = await requireMember(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        const horseId = form.get("horse_id") ?? "";
        const amount = Number(form.get("amount") ?? "0");
        try {
          const board = await loadBoard(env.DB);
          await placeBet(env.DB, board.event, gate.user, horseId, amount);
          return bounce("/", "投票しました");
        } catch (e) {
          return bounce("/", e instanceof Error ? e.message : "投票に失敗", true);
        }
      }

      if (method === "GET" && path === "/admin") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const board = await loadBoard(env.DB);
        const m = msg(url);
        const e = board.event;
        const liveCount = board.horses.filter((h) => !h.horse.scratched).length;
        const horseRows = board.horses
          .map((h) => {
            const placeCell =
              e.status === "closed" && !h.horse.scratched
                ? `<input form="places-form" type="number" name="place_${h.horse.id}" min="1" max="${liveCount}" value="${h.horse.finish_place ?? ""}" required>`
                : h.horse.finish_place != null
                  ? `${h.horse.finish_place}着`
                  : "—";
            const scratchBtn =
              e.status !== "published" && !h.horse.scratched
                ? `<form method="post" action="/admin/scratch">
                    <input type="hidden" name="horse_id" value="${h.horse.id}">
                    <button class="danger" type="submit">取消・返還</button>
                  </form>`
                : "";
            return `<tr class="${h.horse.scratched ? "scr" : ""}">
              <td>${escapeHtml(h.horse.name)}<div class="muted">相対評価点 ${h.horse.strength}（直置き）</div></td>
              <td class="num">${formatOdds(h.referenceOdds)}</td>
              <td class="num">${formatOdds(h.confirmedOdds)}</td>
              <td class="num">${formatPt(h.real)}</td>
              <td>${placeCell}</td>
              <td>${scratchBtn}</td>
            </tr>`;
          })
          .join("");

        return html(
          layout({
            title: "管理（仮）",
            user: gate.user,
            admin: true,
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>管理者<span class="stamp">仮</span></h1>
                <p>${statusLabel(e.status)}　頭数（取消前） ${liveCount}</p>
                <p class="note">馬券締切はゲーム内で着順が見える前。日時指定と強制ボタンの両方。着順の公開は note に合わせ、締切とは別です。</p>
              </div>
              <div class="card">
                <h2>数値</h2>
                <form method="post" action="/admin/params">
                  <div class="row">
                    <label>タイトル <input name="title" value="${escapeHtml(e.title)}"></label>
                    <label>G 毎週配る仮想ポイント <input name="grant_g" type="number" min="0" step="1" value="${e.grant_g}"></label>
                    <label>単位 <input name="bet_unit" type="number" min="1" step="1" value="${e.bet_unit}"></label>
                    <label>S 仮想の初期投票額の合計 <input name="seed_pool_s" type="number" min="0" step="1" value="${e.seed_pool_s}"></label>
                    <label>E 実際の投票額に寄せ始める目安 <input name="pull_e" type="number" min="0" step="1" value="${e.pull_e}"></label>
                    <label>D 控除 <input name="takeout_d" type="number" min="0" max="0.99" step="0.01" value="${e.takeout_d}"></label>
                    <label>w時 下限 <input name="w_time_floor" type="number" min="0" max="0.99" step="0.05" value="${e.w_time_floor}"></label>
                    <label>w時 指数 <input name="w_time_exp" type="number" min="0.2" max="4" step="0.1" value="${e.w_time_exp}"></label>
                    <label>日時締切（JST） <input name="closes_at" type="datetime-local" value="${toJstInput(e.voting_closes_at)}"></label>
                  </div>
                  <button type="submit">保存</button>
                </form>
              </div>
              <div class="card">
                <h2>週次操作</h2>
                <div class="row">
                  <form method="post" action="/admin/seed-demo"><button type="submit">仮ウマ娘 7 頭を入れる</button></form>
                  <form method="post" action="/admin/open"><button type="submit">投票開始（名簿を閉じる）</button></form>
                  <form method="post" action="/admin/close"><button class="danger" type="submit">強制締切 → 確定配当</button></form>
                  <form method="post" action="/admin/reset"><button class="secondary" type="submit">デモ初期化</button></form>
                </div>
              </div>
              <div class="card">
                <h2>出走（直置き Seed。U-tools は後）</h2>
                ${
                  e.status === "setup"
                    ? `<form method="post" action="/admin/horse" class="row">
                        <label>名前 <input name="name" required maxlength="40"></label>
                        <label>相対評価点（直置き） <input name="strength" type="number" min="0" step="0.1" value="10" required></label>
                        <button type="submit">登録</button>
                      </form>`
                    : `<p class="note">名簿は閉じています。飛び入りはルールで禁止です。</p>`
                }
                <form id="places-form" method="post" action="/admin/places"></form>
                <table>
                  <thead><tr><th>ウマ娘</th><th>参考オッズ</th><th>確定配当</th><th>実際の投票額</th><th>着順</th><th></th></tr></thead>
                  <tbody>${horseRows}</tbody>
                </table>
                ${
                  e.status === "closed"
                    ? `<p class="note">一般画面には着順を出しません。公開スイッチを押すまで。</p>
                       <button form="places-form" type="submit">着順を保存</button>`
                    : ""
                }
                ${
                  e.status === "closed"
                    ? `<form method="post" action="/admin/publish" style="margin-top:1rem">
                         <button type="submit">結果を公開して払戻する</button>
                       </form>`
                    : ""
                }
              </div>
              <div class="card">
                <h2>内部計算</h2>
                ${formulaPanel(board)}
              </div>`,
          }),
        );
      }

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
          });
          return bounce("/admin", "数値を保存しました（G は E・S を自動では変えません）");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "保存失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/seed-demo") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          await seedDemoHorses(env.DB, board.event);
          return bounce("/admin", "仮ウマ娘を登録しました（直置き Seed）");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/horse") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          await addHorse(
            env.DB,
            board.event,
            form.get("name") ?? "",
            Number(form.get("strength")),
          );
          return bounce("/admin", "登録しました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/open") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        try {
          const board = await loadBoard(env.DB);
          await openVoting(env.DB, board.event, board.event.voting_closes_at);
          return bounce("/admin", "投票を開始し、名簿を閉じました");
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
          return bounce("/admin", "強制締切しました。確定配当に切り替わりました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/scratch") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          const refunded = await scratchHorse(
            env.DB,
            board.event,
            form.get("horse_id") ?? "",
          );
          return bounce("/admin", `取消しました。返還 ${refunded} pt`);
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
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

      if (method === "POST" && path === "/admin/reset") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        await resetDemo(env.DB);
        return bounce("/admin", "デモを初期化しました");
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
