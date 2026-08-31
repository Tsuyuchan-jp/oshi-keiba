import { escapeHtml } from "./http";
import { ADMIN_CSS } from "./adminCss";
import { flashHtml } from "./ui";
import { appVersionLabel } from "./version";
import type { EventStatus } from "./store";
import type { UserRow } from "./store";

export type AdminTab =
  | "progress"
  | "register"
  | "horses"
  | "ledger"
  | "odds"
  | "settings"
  | "login";

const TABS: { id: Exclude<AdminTab, "login">; href: string; label: string }[] = [
  { id: "progress", href: "/admin", label: "進行" },
  { id: "register", href: "/admin/register", label: "出走登録" },
  { id: "horses", href: "/admin/horses", label: "出走" },
  { id: "ledger", href: "/admin/ledger", label: "台帳" },
  { id: "odds", href: "/admin/odds", label: "オッズ" },
  { id: "settings", href: "/admin/settings", label: "開催設定" },
];

export function layoutAdmin(opts: {
  title: string;
  tab: AdminTab;
  user?: UserRow | null;
  eventStatus?: EventStatus;
  body: string;
  flash?: { text: string | null; error: boolean };
  scripts?: string;
  afterDash?: string;
}): string {
  const nav = TABS.map(
    (t) =>
      `<a href="${t.href}" class="${opts.tab === t.id ? "on" : ""}">${escapeHtml(t.label)}</a>`,
  ).join("");
  const flash = opts.flash?.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  const settingsToast = opts.tab === "settings" && opts.flash?.text
    ? `<div class="admin-toast${opts.flash.error ? " error" : ""}" role="${opts.flash.error ? "alert" : "status"}"><span aria-hidden="true">${opts.flash.error ? "!" : "✓"}</span><span>${escapeHtml(opts.flash.text)}</span><button type="button" aria-label="通知を閉じる" onclick="this.parentElement.remove()">×</button></div>`
    : "";
  const registerToast = opts.tab === "register" && opts.flash?.text
    ? `<div class="admin-toast${opts.flash.error ? " error" : ""}" role="${opts.flash.error ? "alert" : "status"}"><span aria-hidden="true">${opts.flash.error ? "!" : "✓"}</span><span>${escapeHtml(opts.flash.text)}</span><button type="button" aria-label="通知を閉じる" onclick="this.parentElement.remove()">×</button></div>`
    : "";
  const pageClass =
    opts.tab === "settings"
      ? "settings-page"
      : opts.tab === "odds"
        ? "odds-page"
        : opts.tab === "ledger"
          ? "ledger-page"
          : opts.tab === "register"
            ? "register-page"
            : opts.tab === "progress"
              ? "progress-page"
              : "";
  const mainFlash = opts.tab === "settings" || opts.tab === "register" ? "" : flash;
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>${ADMIN_CSS}</style>
</head>
<body class="${pageClass}" data-screen="admin" data-phase="${escapeHtml(opts.eventStatus ?? "")}">
  <div class="dash">
    <nav class="side" aria-label="管理">
      <div class="mark">OSHI KEIBA · 管理 <span class="app-ver">${appVersionLabel()}</span></div>
      ${nav}
      <div class="side-foot">
        ${opts.user ? `<a href="/logout">ログアウト</a>` : ""}
        <a href="/">場内を見る</a>
      </div>
    </nav>
    <div class="main">
      ${mainFlash}
      ${opts.body}
    </div>
  </div>
  ${settingsToast}
  ${settingsToast ? `<script>setTimeout(()=>document.querySelector('.admin-toast')?.remove(),5000);</script>` : ""}
  ${registerToast}
  ${registerToast ? `<script>
    (() => {
      const params = new URLSearchParams(location.search);
      params.delete("msg");
      params.delete("err");
      const query = params.toString();
      history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + location.hash);
      ${opts.flash?.error ? "" : "setTimeout(() => document.querySelector('.admin-toast')?.remove(), 5000);"}
    })();
  </script>` : ""}
  ${opts.afterDash ?? ""}
  ${opts.scripts ?? ""}
</body>
</html>`;
}
