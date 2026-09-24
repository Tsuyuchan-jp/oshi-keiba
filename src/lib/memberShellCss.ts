/**
 * メンバー画面共通のオーバーレイ／quiet 骨格 CSS。
 * 場内電光の LED 固有スタイルは venueCss 側。
 */

/** メンバー画面共通。画面ごとの色指定はこのトークンを参照する。 */
export const MEMBER_TOKENS_CSS = `
:root {
  --member-page-bg: #050607;
  --member-shell-bg: #0c0e0f;
  --member-panel-bg: #141618;
  --member-field-bg: #101214;
  --member-accent-bg: #1c1810;
  --member-black: #000;
  --member-ink-bright: #e8fffc;
  --member-ink: #e8eeea;
  --member-ink-soft: #c8d0cc;
  --member-table-ink: #c8d4d3;
  --member-white: #fff;
  --member-muted: #6aa8a4;
  --member-accent: #e0b34a;
  --member-action: #ff8a2a;
  --member-action-ink: #140800;
  --member-danger: #ff5a4a;
  --member-danger-ink: #ff8a80;
  --member-chrome-line: #1a3332;
  --member-panel-line: #1a2220;
  --member-field-line: #2a3332;
  --member-line-strong: #3a4440;
  --member-table-line: #152018;
}
`;

/** ⋯・枠外リンク・使い方モーダル（venue / bet / gate 共通） */
export const MEMBER_OVERLAY_CSS = `
.more-btn {
  appearance: none; background: transparent; border: 0;
  color: var(--member-muted); font: inherit; font-size: 1.2rem; line-height: 1;
  padding: .15rem .35rem; cursor: pointer; letter-spacing: .05em;
}
.more-btn[aria-expanded="true"] { color: var(--member-accent); }
.more-pop {
  display: none; position: absolute; right: 0; top: 2.2rem; z-index: 8;
  min-width: 8.5rem; background: #121516; border: 1px solid var(--member-line-strong); padding: .25rem 0;
}
.more-pop.open { display: block; }
.more-pop a, .more-pop button {
  display: block; width: 100%; text-align: left; background: none; border: 0;
  color: var(--member-ink-soft); font: inherit; font-size: .82rem; padding: .45rem .75rem;
  text-decoration: none; cursor: pointer;
}
.out-links {
  display: none; position: fixed; right: 1rem;
  bottom: calc(.85rem + env(safe-area-inset-bottom)); z-index: 11; font-size: .75rem;
  align-items: flex-end;
}
.out-links a {
  color: rgba(232, 238, 234, .55); text-decoration: none; margin-left: .75rem;
}
.out-links a:hover { color: var(--member-accent); }
.out-links .out-admin {
  display: inline-flex; flex-direction: column; align-items: flex-end;
  margin-left: .75rem; gap: .12rem; vertical-align: bottom;
}
.out-links .out-admin a { margin-left: 0; }
.out-links .app-ver {
  color: rgba(232, 238, 234, .38); font-size: .65rem;
  letter-spacing: .04em; font-variant-numeric: tabular-nums; line-height: 1;
  user-select: none;
}
.member-modal {
  width: min(42rem, calc(100vw - 2rem)); max-width: 42rem;
  max-height: min(44rem, calc(100dvh - 2rem)); overflow: auto;
  background: var(--member-shell-bg); color: var(--member-ink);
  border: 1px solid var(--member-line-strong); padding: 1rem 1.1rem;
}
.member-modal::backdrop { background: rgba(0,0,0,.55); }
.member-modal h2 { margin: 0 0 .65rem; font-size: 1rem; color: var(--member-ink); }
.member-modal .howto-sec { margin: 0 0 .85rem; }
.member-modal .howto-sec h3 {
  margin: 0 0 .25rem; font-size: .78rem; letter-spacing: .06em; color: var(--member-ink-soft);
}
.member-modal .howto-sec p {
  margin: 0; font-size: .85rem; color: #9aa8a4; line-height: 1.55;
}
.member-modal button {
  margin-top: .5rem; font: inherit; background: var(--member-accent-bg); color: var(--member-accent);
  border: 1px solid var(--member-accent); padding: .35rem .7rem; cursor: pointer;
}
.background-options { display: grid; gap: .45rem; }
.background-option {
  display: grid; gap: .1rem; padding: .7rem .75rem;
  border: 1px solid var(--member-field-line); cursor: pointer;
}
.background-option:has(input:checked) { border-color: var(--member-accent); background: var(--member-accent-bg); }
.background-option input { accent-color: var(--member-accent); }
.background-option strong { font-size: .9rem; }
.background-option span { margin-left: 1.55rem; color: #9aa8a4; font-size: .78rem; line-height: 1.45; }
.background-current { margin: -.25rem 0 .85rem; color: var(--member-muted); font-size: .82rem; }
@media (min-width: 900px) {
  .out-links { display: flex; }
}
`;

/** メンバー画面で使うスマホ向けの共通グラス面。各画面の CSS の末尾に置く。 */
export const MEMBER_MOBILE_GLASS_CSS = `
@media (max-width: 899px) {
  .member-glass { --glass-surface-alpha: .36; --glass-control-alpha: .22; }
  .member-glass[data-slot="day"] { --glass-surface-alpha: .56; --glass-control-alpha: .30; }
  .member-glass[data-slot="dusk"] { --glass-surface-alpha: .46; --glass-control-alpha: .26; }
  .member-glass[data-slot="night"], .member-glass:not([data-slot]) { --glass-surface-alpha: .36; --glass-control-alpha: .22; }
  .member-glass .app-shell {
    background: rgba(5, 7, 8, .01); border-color: rgba(216, 220, 224, .58);
    -webkit-backdrop-filter: blur(8px) saturate(115%); backdrop-filter: blur(8px) saturate(115%);
  }
  .member-glass--venue .app-shell { box-shadow: none; }
  .member-glass--venue .chrome, .member-glass--venue .board,
  .member-glass--bet .chrome,
  .member-glass--gate .chrome, .member-glass--gate .desk,
  .member-glass--tickets .chrome,
  .member-glass .member-glass-surface { background: rgba(5, 7, 8, var(--glass-surface-alpha)); }
  .member-glass--bet .dock { background: transparent; }
  .member-glass--venue .sheet-wrap, .member-glass--venue .sheet-row.head, .member-glass--venue .j-panel { background: transparent; }
  .member-glass--bet .kinds a, .member-glass--bet .kinds span, .member-glass--bet .well,
  .member-glass--bet .chip, .member-glass--bet .amt-row button, .member-glass--bet .amt-all,
  .member-glass--gate input { background: rgba(5, 7, 8, var(--glass-control-alpha)); }
}
`;

/**
 * quiet（窓口・入場）の scene / shell / chrome。
 * 幅は --shell-max（既定 36rem）。入場は 26rem を指定。
 */
export const MEMBER_QUIET_FRAME_CSS = `
${MEMBER_TOKENS_CSS}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: "IBM Plex Sans JP", "Hiragino Sans", sans-serif;
  color: var(--member-ink-bright);
  background: var(--member-page-bg);
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
.scene { position: relative; height: 100dvh; overflow: hidden; }
.scene-bg {
  position: absolute; inset: 0; z-index: 0;
  background:
    linear-gradient(180deg, rgba(5,6,10,.42), rgba(5,8,6,.5)),
    url("/venue/night-glass-9x16.png") center bottom / cover no-repeat;
}
.app-shell {
  position: relative; z-index: 3;
  display: flex; flex-direction: column;
  background: var(--member-shell-bg);
  border: 2px solid #3a403c;
  overflow: hidden;
  height: calc(100% - 28px);
  margin: 14px;
  width: calc(100% - 28px);
}
.chrome {
  flex: 0 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .55rem .85rem;
  background: var(--member-black);
  border-bottom: 1px solid var(--member-chrome-line);
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  letter-spacing: .04em;
  line-height: 1.2;
}
.brand {
  color: var(--member-ink-soft);
  font-weight: 700;
  font-size: .82rem;
  letter-spacing: .12em;
  text-decoration: none;
}
.who { color: var(--member-muted); font-size: .72rem; margin-top: .15rem; }
.chrome-end {
  position: relative;
  display: flex;
  align-items: center;
  gap: .25rem;
}
.chrome-menu { position: relative; }
.member-chrome-status {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-left: auto;
  color: var(--member-accent);
  font-size: .72rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.member-chrome-status strong { color: var(--member-white); }
.member-chrome-status .pill {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .2rem .55rem; border-radius: 999px;
  background: rgba(224, 179, 74, .15); color: var(--member-accent);
  font-size: .68rem; font-weight: 700; letter-spacing: .06em;
}
.member-chrome-status .pill .dot {
  width: .45rem; height: .45rem; border-radius: 50%; background: currentColor;
  animation: member-chrome-blink 1.2s step-end infinite;
}
.member-chrome-status .pill.idle .dot { animation: none; opacity: .85; }
@keyframes member-chrome-blink { 50% { opacity: 0; } }

@media (min-width: 900px) {
  .scene { display: flex; align-items: center; justify-content: center; }
  .scene-bg {
    background:
      linear-gradient(180deg, rgba(5,6,10,.4), rgba(5,8,6,.48)),
      url("/venue/night-16x9.png") center / cover no-repeat;
  }
  .app-shell {
    width: min(var(--shell-max, 36rem), calc(100vw - 4rem));
    max-height: calc(100dvh - 3rem);
    height: auto;
    margin: 0;
  }
}
`;

/** 場内・窓口で共有するヘッダー。スマホはタイトル行と状態行を分ける。 */
export const MEMBER_MOBILE_CHROME_CSS = `
.member-chrome .chrome-times {
  display: inline-flex;
  align-items: center;
  gap: .65rem;
  min-width: 0;
}
.member-chrome .chrome-times > span {
  display: inline-flex;
  align-items: center;
  gap: .25em;
  white-space: nowrap;
}
@media (max-width: 899px) {
  .member-chrome {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "brand menu"
      "state state"
      "nav nav";
    align-items: start;
    column-gap: .55rem;
    row-gap: .4rem;
  }
  .member-chrome .chrome-brand { grid-area: brand; min-width: 0; }
  .member-chrome .chrome-state {
    grid-area: state;
    min-width: 0;
    width: 100%;
    margin-left: 0;
    justify-self: stretch;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .5rem .75rem;
    font-size: .78rem;
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    flex-wrap: wrap;
    white-space: normal;
  }
  .member-chrome .chrome-times {
    justify-content: flex-end;
    flex: 1 1 auto;
  }
  .member-chrome .chrome-nav {
    grid-area: nav;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    width: 100%;
    border-top: 1px solid var(--member-chrome-line);
  }
  .member-chrome .chrome-nav a {
    margin-left: 0;
    padding: .35rem .2rem .15rem;
    text-align: center;
  }
  .member-chrome .chrome-nav a.on { border-bottom: 2px solid var(--member-accent); }
  .member-chrome .chrome-menu { grid-area: menu; }
  .member-chrome #meta-close { display: inline-flex; }
}
`;
