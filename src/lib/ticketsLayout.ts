import { escapeHtml } from "./http.ts";
import { BET_KINDS } from "./bets.ts";
import { backgroundModal, chromeTimesHtml, memberMoreScript, memberOutLinks } from "./memberShell.ts";
import { memberSceneSlotScript } from "./memberSceneSlot.ts";
import type { Board, EventStatus, UserRow } from "./store.ts";
import { TICKETS_CSS } from "./ticketsCss.ts";
import { ticketSummary, type MyTicketView } from "./ticketsView.ts";
import { formatPt, howToModal, statusLabel } from "./ui.ts";

function closeHm(ms: number | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ms));
}

function purchaseTime(ms: number): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

function outcomeHtml(ticket: MyTicketView, status: EventStatus): string {
  if (ticket.result === "refund") return `<div class="ticket-outcome"><span>返還</span><b>${escapeHtml(formatPt(ticket.payoutAmount))}</b></div><span class="ticket-stamp ticket-stamp--refund">取消</span>`;
  if (status !== "published") {
    if (status !== "closed") return `<div class="ticket-outcome"><span>結果を待っています</span></div>`;
    if (ticket.specialPending) return `<div class="ticket-outcome"><b>特払い予定</b></div>`;
    return `<div class="ticket-outcome"><span>確定配当</span><b>${ticket.confirmedOdds == null ? "—" : `${ticket.confirmedOdds.toFixed(1)}倍`}</b></div>`;
  }
  if (ticket.result === "hit") return `<div class="ticket-outcome"><span>払戻</span><b>${escapeHtml(formatPt(ticket.payoutAmount))}</b></div><span class="ticket-stamp ticket-stamp--hit">的中</span>`;
  if (ticket.result === "special") return `<div class="ticket-outcome"><span>特払い</span><b>${escapeHtml(formatPt(ticket.payoutAmount))}</b></div><span class="ticket-stamp ticket-stamp--special">特払</span>`;
  return `<div class="ticket-outcome"><b>はずれ</b></div>`;
}

function ticketHtml(ticket: MyTicketView, board: Board, index: number): string {
  const serial = `${String(index + 1).padStart(3, "0")}-${ticket.key.length.toString(16).padStart(2, "0")}`;
  const classes = `bet-ticket${ticket.result === "lost" ? " is-lost" : ""}`;
  return `<article class="${classes}">
    <div class="ticket-stub"><strong>推し馬券</strong><span>${escapeHtml(serial)}</span></div>
    <div class="ticket-body">
      <div class="ticket-head"><b>${escapeHtml(board.event.title)}</b><span>${escapeHtml(purchaseTime(ticket.purchasedAt))} 発券</span></div>
      <div class="ticket-pick"><span class="ticket-kind">${escapeHtml(ticket.kindLabel)}</span><span class="ticket-numbers">${escapeHtml(ticket.selectionLabel)}</span></div>
      <div class="ticket-names">${escapeHtml(ticket.horseNames.join(" ／ "))}</div>
      <div class="ticket-facts">
        <div class="ticket-fact"><span>購入額</span><b>${escapeHtml(formatPt(ticket.amount))}</b></div>
        <div class="ticket-fact"><span>購入</span><b>${ticket.purchaseCount > 1 ? `${ticket.purchaseCount}回分` : "1回"}</b></div>
      </div>
      ${outcomeHtml(ticket, board.event.status)}
    </div>
  </article>`;
}

function ticketGroupsHtml(tickets: MyTicketView[], board: Board): string {
  let index = 0;
  return BET_KINDS.map((kind) => {
    const grouped = tickets.filter((ticket) => ticket.kind === kind);
    if (grouped.length === 0) return "";
    const cards = grouped.map((ticket) => ticketHtml(ticket, board, index++)).join("");
    return `<section class="ticket-kind-group"><h2>${escapeHtml(grouped[0]!.kindLabel)}<span>${grouped.length}枚</span></h2><div class="ticket-grid">${cards}</div></section>`;
  }).join("");
}

export function ticketShelfLinkHtml(tickets: MyTicketView[]): string {
  const summary = ticketSummary(tickets);
  if (summary.count === 0) return `<p class="hint">まだ馬券がありません。</p>`;
  return `<a class="ticket-shelf-link" href="/tickets"><span><small>自分の馬券</small><b>${summary.count}枚・合計 ${escapeHtml(formatPt(summary.amount))}</b></span><strong>馬券を見る →</strong></a>`;
}

export function venueTicketNoticeHtml(tickets: MyTicketView[], opts: { needsLogin?: boolean } = {}): string {
  const summary = ticketSummary(tickets);
  const href = opts.needsLogin ? "/login" : "/tickets";
  const linkLabel = "自分の馬券を見る →";
  if (summary.count === 0) {
    return `<section class="ticket-result-notice" aria-label="自分の馬券">
      <div><span>MY TICKETS</span><b>${opts.needsLogin ? "ログインして馬券を確認" : "購入した馬券はありません"}</b><small>${opts.needsLogin ? "ログインすると購入内容を確認できます" : "購入した馬券は馬券ページに表示されます"}</small></div>
      <a class="member-primary-action" href="${href}">${linkLabel}</a>
    </section>`;
  }
  const hit = summary.hitCount > 0;
  return `<section class="ticket-result-notice${hit ? " is-hit" : ""}" aria-label="馬券の結果">
    <div><span>${hit ? "WINNING TICKET" : "TICKET RESULT"}</span><b>${hit ? "的中馬券があります" : "馬券の結果が確定しました"}</b><small>${hit ? `${summary.hitCount}枚的中・払戻 ${escapeHtml(formatPt(summary.payoutAmount))}` : `${summary.count}枚の結果を見る`}</small></div>
    <a class="member-primary-action" href="${href}">${linkLabel}</a>
  </section>`;
}

export function ticketsPage(opts: { board: Board; user: UserRow; tickets: MyTicketView[]; preview?: boolean }): string {
  const summary = ticketSummary(opts.tickets);
  const hit = opts.board.event.status === "published" && summary.hitCount > 0;
  const list = opts.tickets.length > 0
    ? ticketGroupsHtml(opts.tickets, opts.board)
    : `<section class="ticket-empty"><h2>まだ馬券がありません</h2><p>窓口で買った馬券が、ここに紙券のように並びます。</p><a class="member-primary-action" href="/bet">窓口へ</a></section>`;
  const metaNow = opts.board.event.status === "voting" ? `<span id="meta-now">現在 <strong id="now-clock">--:--</strong></span>` : "";
  const metaClose = opts.board.event.status === "voting"
    ? `<span id="meta-close">締切 <strong>${escapeHtml(closeHm(opts.board.event.voting_closes_at))}</strong></span>`
    : `<span id="meta-close">${escapeHtml(statusLabel(opts.board.event.status))}</span>`;
  return `<!doctype html><html lang="ja"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <title>自分の馬券｜OSHI KEIBA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;600;700;800&family=Chakra+Petch:wght@600;700;800&display=swap" rel="stylesheet">
  <style>${TICKETS_CSS}</style></head><body>
  <div class="scene member-glass member-glass--tickets" data-slot="night"><div class="scene-bg" aria-hidden="true"></div><div class="app-shell">
    <header class="chrome member-chrome ticket-chrome">
      <div class="chrome-brand"><a class="brand" href="/">OSHI KEIBA</a><div class="who">${escapeHtml(opts.user.display_name)} · ${escapeHtml(formatPt(opts.user.balance))}</div></div>
      <div class="chrome-state member-chrome-status"><span class="pill idle"><span class="dot"></span>${escapeHtml(statusLabel(opts.board.event.status))}</span>${chromeTimesHtml(metaNow, metaClose)}</div>
      <nav class="chrome-nav ticket-nav" aria-label="ページ移動"><a href="/">場内</a><a href="/bet">窓口</a><a href="/paddock">パドック</a></nav>
      <div class="chrome-menu"><button type="button" class="more-btn" id="more-btn" aria-expanded="false" aria-haspopup="true" aria-label="ほか">⋯</button><div class="more-pop" id="more-pop">
        <a href="/tickets" aria-current="page">馬券</a><a href="#" id="howto-open">使い方</a><button type="button" id="background-open">背景</button><a href="/logout">ログアウト</a><a href="/admin">管理者</a>
      </div></div>
    </header>
    <main class="ticket-page member-glass-surface"><section class="ticket-hero"><div><span class="ticket-kicker">MY TICKETS</span><h1>自分の馬券</h1><p>${opts.preview ? "管理者確認用の表示です。購入操作はできません。" : `${escapeHtml(opts.board.event.title)}の買い目をまとめています。`}</p></div>
      <div class="ticket-summary"><span>馬券 <b>${summary.count}枚</b></span><span>購入 <b>${escapeHtml(formatPt(summary.amount))}</b></span>${hit ? `<span class="summary-hit">的中 <b>${summary.hitCount}枚・${escapeHtml(formatPt(summary.payoutAmount))}</b></span>` : ""}</div>
    </section>${list}</main>
  </div></div>
  ${memberOutLinks()}${howToModal()}${backgroundModal()}${memberMoreScript()}${memberSceneSlotScript("now-clock")}
  </body></html>`;
}
