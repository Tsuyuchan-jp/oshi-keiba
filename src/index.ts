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
  BET_KINDS,
  formatSelectionLabel,
  isBetKind,
  type BetKind,
} from "./lib/bets";
import { escapeHtml, html, json, readForm, redirect } from "./lib/http";
import {
  addHorse,
  bulkUpsertHorses,
  forceClose,
  getUser,
  listAllBets,
  listMembers,
  listUserBets,
  listUserPayouts,
  loadBoard,
  loginMember,
  numberByHorseId,
  openVoting,
  placeBet,
  publishResults,
  redoMyBets,
  registerMember,
  resetDemo,
  savePlaces,
  scratchHorse,
  seedDemoHorses,
  updateHorse,
  updateParams,
  upsertUser,
} from "./lib/store";
import {
  BOARD_FLASH_SCRIPT,
  betTabsHtml,
  comboOddsTable,
  DEDUPE_SELECT_SCRIPT,
  flashHtml,
  formatOddsWithUnit,
  formatPt,
  formulaPanel,
  groupMyBets,
  kindVoidNotes,
  layout,
  livePollScript,
  parseJstInput,
  pickSelects,
  statusLabel,
  strengthCalcModal,
  toJstInput,
  wCaption,
  winSheetTable,
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      if (method === "GET" && path === "/logout") {
        return redirect("/", { "Set-Cookie": clearSessionCookie() });
      }

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
                <p class="note">表示名だけで入ります。個人パスワードはありません。</p>
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

      if (method === "GET" && path === "/admin/login") {
        const m = msg(url);
        const board = await loadBoard(env.DB);
        return html(
          layout({
            title: "管理者ログイン",
            admin: true,
            eventStatus: board.event.status,
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>管理者ログイン</h1>
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

      // —— ライブ API ——
      if (method === "GET" && path === "/api/board") {
        const board = await loadBoard(env.DB);
        const nums = numberByHorseId(board);
        const kinds: Record<
          string,
          { key: string; label: string; odds: number | null }[]
        > = {};
        for (const k of BET_KINDS) {
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

      // —— 場内 ——
      if (method === "GET" && (path === "/" || path === "/board")) {
        const gate = await requireMember(request, env);
        if (gate instanceof Response) return gate;
        const board = await loadBoard(env.DB);
        const user = (await getUser(env.DB, gate.user.id))!;
        const m = msg(url);
        const live = board.event.status === "voting";

        let cta = "";
        if (board.event.status === "setup") {
          cta = `<p class="note">投票開始までお待ちください。</p>`;
        } else if (board.event.status === "voting") {
          cta = `<p class="cta"><a class="btn" href="/bet">馬券を買う</a></p>`;
        }

        let publishedBlock = "";
        if (board.event.status === "published") {
          const bets = await listUserBets(env.DB, board.event.id, user.id);
          const payouts = await listUserPayouts(env.DB, board.event.id, user.id);
          const payByBet = new Map(payouts.map((p) => [p.bet_id, p]));
          const nums = numberByHorseId(board);
          const placeRows = board.horses
            .filter((h) => !h.horse.scratched && h.horse.finish_place != null)
            .sort(
              (a, b) => (a.horse.finish_place ?? 0) - (b.horse.finish_place ?? 0),
            )
            .map(
              (h) =>
                `<tr><td>${h.horse.finish_place}着</td><td>${h.number}. ${escapeHtml(h.horse.name)}</td></tr>`,
            )
            .join("");
          const hist = bets
            .map((b) => {
              const label = `${BET_KIND_LABEL[b.kind]} ${formatSelectionLabel(b.kind, b.horse_1, b.horse_2, b.horse_3, nums)}`;
              const pay = payByBet.get(b.id);
              let result = "外れ";
              if (b.refunded && pay?.kind === "refund") result = "取消（全額戻し）";
              else if (b.refunded && pay?.kind === "redo") result = "やりなおし";
              else if (pay?.kind === "special") result = "特払い（8割戻し）";
              else if (pay?.kind === "win") result = `的中 ${formatPt(pay.amount)}`;
              else if (b.refunded) result = "返還";
              return `<tr><td>${escapeHtml(label)}</td><td class="num">${formatPt(b.amount)}</td><td>${escapeHtml(result)}</td></tr>`;
            })
            .join("");
          publishedBlock = `
            <div class="card">
              <h2>着順</h2>
              <table><thead><tr><th>着</th><th>ウマ娘</th></tr></thead><tbody>${placeRows}</tbody></table>
            </div>
            <div class="card">
              <h2>自分の馬券</h2>
              <p class="muted">残高 ${formatPt(user.balance)}</p>
              <table>
                <thead><tr><th>内容</th><th>額</th><th>結果</th></tr></thead>
                <tbody>${hist || `<tr><td colspan="3" class="muted">なし</td></tr>`}</tbody>
              </table>
            </div>`;
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
              </div>
              ${publishedBlock}`,
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
        const kind: BetKind = isBetKind(kindParam) ? kindParam : "win";
        const live = board.event.status === "voting";
        const myBets = await listUserBets(env.DB, board.event.id, user.id);
        const grouped = groupMyBets(myBets, board);

        const canBuy = board.event.status === "voting";
        const form = canBuy
          ? `<form method="post" action="/bet" class="bet-form" id="bet-form"
                onsubmit="return confirm('この内容で買いますか？\\n' + (document.getElementById('confirm-summary')?.textContent || ''));">
              <input type="hidden" name="kind" value="${kind}">
              <div class="row">${pickSelects(kind, board)}</div>
              <div class="row">
                <button type="button" class="amt secondary" data-amt="100">100</button>
                <button type="button" class="amt secondary" data-amt="500">500</button>
                <button type="button" class="amt secondary" data-amt="all">残り全部</button>
                <label>金額（スペ）
                  <input name="amount" id="bet-amount" type="number" min="${board.event.bet_unit}" step="${board.event.bet_unit}" value="${board.event.bet_unit}" required>
                </label>
                <button type="submit">買う</button>
              </div>
              <p class="note" id="confirm-summary" hidden></p>
            </form>
            <script>
              const bal = ${user.balance};
              const unit = ${board.event.bet_unit};
              document.querySelectorAll("[data-amt]").forEach((btn) => {
                btn.addEventListener("click", () => {
                  const a = btn.getAttribute("data-amt");
                  const input = document.getElementById("bet-amount");
                  if (!input) return;
                  if (a === "all") {
                    input.value = String(Math.floor(bal / unit) * unit);
                  } else {
                    input.value = a;
                  }
                });
              });
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
                ${betTabsHtml(kind)}
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

      // —— 管理 ——
      if (method === "GET" && path === "/admin") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const board = await loadBoard(env.DB);
        const m = msg(url);
        const e = board.event;
        const liveCount = board.horses.filter((h) => !h.horse.scratched).length;
        const members = await listMembers(env.DB);
        const betOrder = url.searchParams.get("bets") === "name" ? "name" : "new";
        const allBets = await listAllBets(env.DB, e.id, betOrder);
        const nums = numberByHorseId(board);

        const horseRows = board.horses
          .map((h) => {
            const placeCell =
              e.status === "closed" && !h.horse.scratched
                ? `<select form="places-form" class="place-select" name="place_${h.horse.id}" required>
                    <option value="">—</option>
                    ${Array.from({ length: liveCount }, (_, i) => {
                      const n = i + 1;
                      const sel = h.horse.finish_place === n ? " selected" : "";
                      return `<option value="${n}"${sel}>${n}着</option>`;
                    }).join("")}
                  </select>`
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
            const edit =
              e.status === "setup" && !h.horse.scratched
                ? `<form method="post" action="/admin/horse-edit" class="row">
                    <input type="hidden" name="horse_id" value="${h.horse.id}">
                    <input name="name" value="${escapeHtml(h.horse.name)}" required maxlength="40">
                    <input name="strength" type="number" min="0" step="0.1" value="${h.horse.strength}" required style="width:5rem">
                    <button type="submit" class="secondary">更新</button>
                  </form>`
                : `<div>${escapeHtml(h.horse.name)}<div class="muted">#${h.number || "—"} Strength ${h.horse.strength}　Seed ${h.seed.toFixed(0)}</div></div>`;
            return `<tr class="${h.horse.scratched ? "scr" : ""}">
              <td>${edit}</td>
              <td class="num">${formatOddsWithUnit(h.referenceOdds)}</td>
              <td class="num">${formatOddsWithUnit(h.confirmedOdds)}</td>
              <td class="num">${formatPt(h.real)}</td>
              <td>${placeCell}</td>
              <td>${scratchBtn}</td>
            </tr>`;
          })
          .join("");

        const memberRows = members
          .map(
            (u) =>
              `<tr><td>${escapeHtml(u.display_name)}</td><td class="num">${formatPt(u.balance)}</td></tr>`,
          )
          .join("");

        const betRows = allBets
          .map((b) => {
            const label = formatSelectionLabel(
              b.kind,
              b.horse_1,
              b.horse_2,
              b.horse_3,
              nums,
            );
            return `<tr class="${b.refunded ? "scr" : ""}">
              <td>${escapeHtml(b.display_name)}</td>
              <td>${escapeHtml(BET_KIND_LABEL[b.kind])}</td>
              <td>${escapeHtml(label)}</td>
              <td class="num">${formatPt(b.amount)}</td>
              <td class="muted">${b.refunded ? "取消済" : ""}</td>
            </tr>`;
          })
          .join("");

        return html(
          layout({
            title: "管理",
            user: gate.user,
            admin: true,
            eventStatus: e.status,
            body: `${flashHtml(m.text, m.error)}
              <div class="card">
                <h1>管理者</h1>
                <p>頭数（取消前） ${liveCount}　${escapeHtml(wCaption(board))}</p>
              </div>
              <div class="card">
                <h2>数値</h2>
                <form method="post" action="/admin/params">
                  <div class="row">
                    <label>タイトル <input name="title" value="${escapeHtml(e.title)}"></label>
                    <label>G（スペ） <input name="grant_g" type="number" min="0" step="1" value="${e.grant_g}"></label>
                    <label>単位 <input name="bet_unit" type="number" min="1" step="1" value="${e.bet_unit}"></label>
                    <label>S（単勝 Seed 合計） <input name="seed_pool_s" type="number" min="0" step="1" value="${e.seed_pool_s}"></label>
                    <label>E <input name="pull_e" type="number" min="0" step="1" value="${e.pull_e}"></label>
                    <label>D <input name="takeout_d" type="number" min="0" max="0.99" step="0.01" value="${e.takeout_d}"></label>
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
                  <form method="post" action="/admin/seed-demo"><button type="submit">仮ウマ娘を入れる</button></form>
                  <form method="post" action="/admin/open"><button type="submit">投票開始</button></form>
                  <form method="post" action="/admin/close"><button class="danger" type="submit">強制締切</button></form>
                </div>
                <form method="post" action="/admin/reset" style="margin-top:1rem"
                  onsubmit="return confirm('デモを初期化します。メンバーの表示名は残ります。よろしいですか？');">
                  <div class="row">
                    <label>管理者パス再入力 <input name="password" type="password" required autocomplete="current-password"></label>
                    <button class="secondary" type="submit">デモ初期化</button>
                  </div>
                </form>
              </div>
              <div class="card">
                <h2>出走（Strength / Seed）</h2>
                <p class="note">試運転は直置き → <button type="button" class="text-btn" id="strength-detail">詳細</button></p>
                ${strengthCalcModal()}
                ${
                  e.status === "setup"
                    ? `<form method="post" action="/admin/horse" class="row">
                        <label>名前 <input name="name" required maxlength="40"></label>
                        <label>Strength <input name="strength" type="number" min="0" step="0.1" value="10" required></label>
                        <button type="submit">登録</button>
                      </form>
                      <form method="post" action="/admin/horses-bulk" style="margin-top:1rem">
                        <label>一括（名前、点数を改行）
                          <textarea name="bulk" rows="6" placeholder="スペシャルウィーク、28&#10;サイレンススズカ、22" style="width:100%"></textarea>
                        </label>
                        <button type="submit" class="secondary">一括反映</button>
                      </form>`
                    : `<p class="note">出走登録完了。飛び入り禁止。</p>`
                }
                <form id="places-form" method="post" action="/admin/places"></form>
                <table>
                  <thead><tr><th>ウマ娘</th><th>参考</th><th>確定</th><th>単勝実票</th><th>着順</th><th></th></tr></thead>
                  <tbody>${horseRows}</tbody>
                </table>
                ${
                  e.status === "closed"
                    ? `<p class="note">一般画面には着順を出しません。公開まで。</p>
                       <button form="places-form" type="submit">着順を保存</button>
                       <script>
                         const syncPlaceOptions = () => {
                           const selects = [...document.querySelectorAll("select.place-select")];
                           const taken = new Set(selects.map((s) => s.value).filter((v) => v !== ""));
                           for (const s of selects) {
                             const mine = s.value;
                             for (const opt of s.options) {
                               if (opt.value === "") continue;
                               const hide = taken.has(opt.value) && opt.value !== mine;
                               opt.hidden = hide;
                               opt.disabled = hide;
                             }
                           }
                         };
                         document.querySelectorAll("select.place-select").forEach((s) => {
                           s.addEventListener("change", syncPlaceOptions);
                         });
                         syncPlaceOptions();
                       </script>
                       <form method="post" action="/admin/publish" style="margin-top:1rem">
                         <button type="submit">結果を公開して払戻する</button>
                       </form>`
                    : ""
                }
              </div>
              <div class="card">
                <h2>参加者残高</h2>
                <table>
                  <thead><tr><th>名前</th><th>残高</th></tr></thead>
                  <tbody>${memberRows || `<tr><td colspan="2" class="muted">まだいません</td></tr>`}</tbody>
                </table>
              </div>
              <div class="card">
                <h2>全投票一覧</h2>
                <p class="note">
                  <a href="/admin?bets=new">新しい順</a>　
                  <a href="/admin?bets=name">名前順</a>
                </p>
                <table>
                  <thead><tr><th>誰</th><th>賭式</th><th>組み合わせ</th><th>額</th><th></th></tr></thead>
                  <tbody>${betRows || `<tr><td colspan="5" class="muted">なし</td></tr>`}</tbody>
                </table>
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
          return bounce("/admin", "数値を保存しました");
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
          return bounce("/admin", "仮ウマ娘を登録しました");
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

      if (method === "POST" && path === "/admin/horse-edit") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          await updateHorse(
            env.DB,
            board.event,
            form.get("horse_id") ?? "",
            form.get("name") ?? "",
            Number(form.get("strength")),
          );
          return bounce("/admin", "更新しました");
        } catch (err) {
          return bounce("/admin", err instanceof Error ? err.message : "失敗", true);
        }
      }

      if (method === "POST" && path === "/admin/horses-bulk") {
        const gate = await requireAdmin(request, env);
        if (gate instanceof Response) return gate;
        const form = await readForm(request);
        try {
          const board = await loadBoard(env.DB);
          const n = await bulkUpsertHorses(
            env.DB,
            board.event,
            form.get("bulk") ?? "",
          );
          return bounce("/admin", `${n} 頭を反映しました`);
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
          return bounce("/admin", `取消しました。返還 ${formatPt(refunded)}`);
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
        const form = await readForm(request);
        const password = form.get("password") ?? "";
        if (!timingSafeEqualStr(password, env.ADMIN_PASSWORD)) {
          return bounce("/admin", "管理者パスが違います（初期化していません）", true);
        }
        await resetDemo(env.DB);
        return bounce("/admin", "デモを初期化しました（メンバー名は残しています）");
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
