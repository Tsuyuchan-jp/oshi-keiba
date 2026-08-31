/**
 * 入場。HTML 構造・クラスは gate モック。name / POST / mode は本番。
 * 未ログインなのでログアウトは出さない。
 */
import { flashHtml, howToModal } from "./ui.ts";
import { GATE_CSS } from "./gateCss.ts";
import { memberMoreScript, memberOutLinks } from "./memberShell.ts";

export function gateLoginPage(opts: {
  flash: { text: string | null; error: boolean };
}): string {
  const flash = opts.flash.text
    ? flashHtml(opts.flash.text, opts.flash.error)
    : "";
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>入場</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP:wght@400;600;700;800&family=Chakra+Petch:wght@600;700&display=swap" rel="stylesheet">
  <style>${GATE_CSS}</style>
</head>
<body>
  <div class="scene member-glass member-glass--gate">
    <div class="scene-bg" aria-hidden="true"></div>
    <div class="app-shell">
      <header class="chrome">
        <div>
          <a class="brand" href="/">OSHI KEIBA</a>
        </div>
        <button type="button" class="more-btn" id="more-btn" aria-expanded="false" aria-haspopup="true" aria-label="ほか">⋯</button>
        <div class="more-pop" id="more-pop">
          <a href="#" id="howto-open">使い方</a>
          <a href="/admin">管理者</a>
        </div>
      </header>
      <div class="desk">
        ${flash}
        <h1>入場</h1>
        <p class="lead">表示名だけで入ります。個人パスワードはありません。スペは開催に参加したときに入ります。</p>
        <form method="post" action="/login" id="gate">
          <label>表示名
            <input name="display_name" required maxlength="40" autocomplete="nickname" placeholder="例：neko">
          </label>
          <label>共有パス
            <input name="password" type="password" required autocomplete="current-password">
          </label>
          <button class="go" name="mode" value="register" type="submit">初めて入場</button>
          <button class="again" name="mode" value="login" type="submit">登録済みでもう一度</button>
        </form>
      </div>
    </div>
  </div>
  ${memberOutLinks()}
  ${howToModal()}
  ${memberMoreScript()}
</body>
</html>`;
}
