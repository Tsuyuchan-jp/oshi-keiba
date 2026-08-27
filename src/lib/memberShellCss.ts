/**
 * メンバー画面共通のオーバーレイ／quiet 骨格 CSS。
 * 場内電光の LED 固有スタイルは venueCss 側。
 */

/** ⋯・枠外リンク・使い方モーダル（venue / bet / gate 共通） */
export const MEMBER_OVERLAY_CSS = `
.more-btn {
  appearance: none; background: transparent; border: 0;
  color: #6aa8a4; font: inherit; font-size: 1.2rem; line-height: 1;
  padding: .15rem .35rem; cursor: pointer; letter-spacing: .05em;
}
.more-btn[aria-expanded="true"] { color: #e0b34a; }
.more-pop {
  display: none; position: absolute; right: 0; top: 2.2rem; z-index: 8;
  min-width: 8.5rem; background: #121516; border: 1px solid #3a4440; padding: .25rem 0;
}
.more-pop.open { display: block; }
.more-pop a, .more-pop button {
  display: block; width: 100%; text-align: left; background: none; border: 0;
  color: #c8d0cc; font: inherit; font-size: .82rem; padding: .45rem .75rem;
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
.out-links a:hover { color: #e0b34a; }
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
#howto-modal {
  max-width: 22rem; background: #0c0e0f; color: #e8eeea;
  border: 1px solid #3a4440; padding: 1rem 1.1rem;
}
#howto-modal::backdrop { background: rgba(0,0,0,.55); }
#howto-modal h2 { margin: 0 0 .65rem; font-size: 1rem; color: #e8eeea; }
#howto-modal .howto-sec { margin: 0 0 .85rem; }
#howto-modal .howto-sec h3 {
  margin: 0 0 .25rem; font-size: .78rem; letter-spacing: .06em; color: #c8d0cc;
}
#howto-modal .howto-sec p {
  margin: 0; font-size: .85rem; color: #9aa8a4; line-height: 1.55;
}
#howto-modal button {
  margin-top: .5rem; font: inherit; background: #1c1810; color: #e0b34a;
  border: 1px solid #e0b34a; padding: .35rem .7rem; cursor: pointer;
}
@media (min-width: 900px) {
  .out-links { display: flex; }
}
`;

/**
 * quiet（窓口・入場）の scene / shell / chrome。
 * 幅は --shell-max（既定 36rem）。入場は 26rem を指定。
 */
export const MEMBER_QUIET_FRAME_CSS = `
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  font-family: "IBM Plex Sans JP", "Hiragino Sans", sans-serif;
  color: #e8fffc;
  background: #050607;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
.scene { position: relative; height: 100dvh; overflow: hidden; }
.scene-bg {
  position: absolute; inset: 0; z-index: 0;
  background:
    linear-gradient(180deg, rgba(5,6,10,.42), rgba(5,8,6,.5)),
    url("/venue/night-9x16.png") center bottom / cover no-repeat;
}
.app-shell {
  position: relative; z-index: 3;
  display: flex; flex-direction: column;
  background: #0c0e0f;
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
  background: #000;
  border-bottom: 1px solid #1a3332;
}
.brand {
  color: #c8d0cc;
  font-weight: 700;
  font-size: .82rem;
  letter-spacing: .12em;
  text-decoration: none;
}
.who { color: #6aa8a4; font-size: .72rem; margin-top: .15rem; }
.chrome-end {
  position: relative;
  display: flex;
  align-items: center;
  gap: .25rem;
}
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
