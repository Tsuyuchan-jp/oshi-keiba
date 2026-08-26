/** 場内（voting）用。モック layout-venue.html。管理・窓口には載せない */
export const VENUE_CSS = `
:root {
  --bg: #070808;
  --led: #00e8d8;
  --led-dim: #6aa8a4;
  --odds: #ff8a2a;
  --pulse: rgba(255, 138, 42, .28);
  --line: #1a3332;
}
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }
body {
  background: #050607;
  color: #e8fffc;
  font-family: "IBM Plex Sans JP", "Hiragino Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
.app-shell {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chrome {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .55rem .85rem;
  background: #000;
  border-bottom: 1px solid #1a3332;
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  letter-spacing: .04em;
}
.chrome .brand {
  color: var(--led);
  font-weight: 700;
  font-size: .82rem;
  letter-spacing: .12em;
  text-decoration: none;
}
.who { color: var(--led-dim); font-size: .72rem; margin-top: .2rem; }
.chrome-end {
  position: relative;
  display: flex;
  align-items: center;
  gap: .35rem;
  flex: 0 0 auto;
}
.more-btn {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--led-dim);
  font: inherit;
  font-size: 1.2rem;
  line-height: 1;
  padding: .15rem .35rem;
  cursor: pointer;
  letter-spacing: .05em;
}
.more-btn[aria-expanded="true"] { color: #e0b34a; }
.more-pop {
  display: none;
  position: absolute;
  right: 0;
  top: 2.2rem;
  z-index: 8;
  min-width: 8.5rem;
  background: #121516;
  border: 1px solid #3a4440;
  padding: .25rem 0;
}
.more-pop.open { display: block; }
.more-pop a, .more-pop button {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  color: #c8d0cc;
  font-family: "IBM Plex Sans JP", sans-serif;
  font-size: .82rem;
  letter-spacing: 0;
  padding: .45rem .75rem;
  text-decoration: none;
  cursor: pointer;
}
.out-links {
  display: none;
  position: fixed;
  right: 1rem;
  bottom: calc(.85rem + env(safe-area-inset-bottom));
  z-index: 11;
  font-size: .75rem;
}
.out-links a {
  color: rgba(232, 238, 234, .55);
  text-decoration: none;
  margin-left: .75rem;
}
.out-links a:hover { color: #e0b34a; }
@media (min-width: 900px) {
  .out-links { display: block; }
}
#howto-modal {
  max-width: 22rem;
  background: #0c0e0f;
  color: #e8eeea;
  border: 1px solid #3a4440;
  padding: 1rem 1.1rem;
}
#howto-modal::backdrop { background: rgba(0,0,0,.55); }
#howto-modal h2 { margin: 0 0 .65rem; font-size: 1rem; color: #e8eeea; }
#howto-modal .howto-sec { margin: 0 0 .85rem; }
#howto-modal .howto-sec h3 {
  margin: 0 0 .25rem;
  font-size: .78rem;
  letter-spacing: .06em;
  color: #c8d0cc;
}
#howto-modal .howto-sec p {
  margin: 0;
  font-size: .85rem;
  color: #9aa8a4;
  line-height: 1.55;
}
#howto-modal button {
  margin-top: .5rem;
  font: inherit;
  background: #1c1810;
  color: #e0b34a;
  border: 1px solid #e0b34a;
  padding: .35rem .7rem;
  cursor: pointer;
}
.led-meta {
  display: flex;
  align-items: center;
  gap: .85rem;
  color: var(--led);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: .82rem;
  line-height: 1;
}
.led-meta > span { display: inline-flex; align-items: center; }
.led-meta strong { color: #fff; font-weight: 700; }
.pill {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .2rem .55rem;
  border-radius: 999px;
  font-weight: 700;
  letter-spacing: .06em;
  font-size: .68rem;
  background: rgba(224, 179, 74, .15);
  color: #e0b34a;
  border: 0;
}
.pill .dot {
  width: .45rem;
  height: .45rem;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1.2s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }
.board {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: .35rem .45rem .55rem;
  overflow: auto;
}
.board-head {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .35rem;
  font-family: "Chakra Petch", "IBM Plex Sans JP", sans-serif;
  color: var(--led);
}
.board-head h1 {
  margin: 0;
  font-size: clamp(.95rem, 2.2vw, 1.15rem);
  letter-spacing: .14em;
  font-weight: 700;
}
.sheet-wrap {
  background: #000;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.sheet {
  --col-num: 1.55rem;
  --col-runner: 5.5rem;
  --col-style: 1.7rem;
  --col-odds: 6.2rem;
  --sheet-pad-y: .32rem;
  font-size: clamp(.78rem, 1.8vw, .9rem);
}
.sheet-row {
  display: grid;
  grid-template-columns:
    var(--col-num)
    minmax(0, 1fr)
    var(--col-runner)
    var(--col-style)
    var(--col-odds);
  align-items: center;
  column-gap: .2rem;
  padding: var(--sheet-pad-y) .15rem;
  border-bottom: 1px solid #0c1818;
}
.sheet-row.head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #000;
  color: var(--led-dim);
  font-weight: 500;
  letter-spacing: .12em;
  font-size: .68rem;
  border-bottom: 1px solid #143230;
}
.c-num {
  color: #fff;
  font-family: "Chakra Petch", sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 0 6px rgba(255,255,255,.25);
}
.c-name {
  color: var(--led);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 0 8px rgba(0, 232, 216, .25);
}
.c-runner {
  color: #c8d4d3;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-style {
  color: var(--led);
  font-size: .78em;
  text-align: center;
  white-space: nowrap;
}
.c-odds {
  color: var(--odds);
  font-family: "Chakra Petch", sans-serif;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 1.15em;
  text-align: right;
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(255, 138, 42, .35);
}
.sheet-row.head .c-odds { color: var(--led-dim); font-size: .68em; text-shadow: none; }
@keyframes pulse-row {
  0% { background: var(--pulse); }
  100% { background: transparent; }
}
.sheet-row.pulse,
.sheet-row.pulse-row { animation: pulse-row 1.5s ease-out; }
.cta {
  background: var(--odds);
  color: #140800;
  border: 0;
  border-radius: 2px;
  padding: .65rem 1.35rem;
  font-size: .95rem;
  font-weight: 800;
  letter-spacing: .12em;
  box-shadow: 0 0 18px rgba(255, 138, 42, .35);
  text-decoration: none;
  display: inline-block;
  text-align: center;
}
.cta:hover { filter: brightness(1.08); }
.foot {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: .5rem;
  margin-top: .45rem;
}
.cols { display: flex; gap: 0; min-height: 0; flex: 1; }
.cols .sheet-wrap { flex: 1; }
.flash {
  flex: 0 0 auto;
  margin: 0 0 .4rem;
  padding: .45rem .6rem;
  background: #1c1810;
  border: 1px solid #e0b34a;
  color: #e0b34a;
  font-size: .82rem;
}
.flash.error { border-color: #ff5a4a; color: #ff8a80; }
.scene {
  position: relative;
  min-height: 100dvh;
  min-height: 100vh;
  overflow: hidden;
}
.scene-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: #0a1218;
  background-image:
    linear-gradient(180deg, var(--veil-top), var(--veil-bot)),
    var(--scene-portrait);
  background-position: center bottom, center bottom;
  background-size: cover, cover;
  background-repeat: no-repeat;
  transition: opacity .8s ease;
}
.scene .app-shell {
  position: relative;
  z-index: 3;
  background: #050505;
  border: 2px solid #d8dce0;
  border-radius: 2px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, .55);
}
.scene[data-slot="day"] {
  --veil-top: rgba(20, 28, 36, .18);
  --veil-bot: rgba(12, 18, 16, .28);
  --scene-portrait: url("/venue/day-9x16.png");
  --scene-landscape: url("/venue/day-16x9.png");
}
.scene[data-slot="dusk"] {
  --veil-top: rgba(24, 12, 8, .28);
  --veil-bot: rgba(18, 10, 8, .38);
  --scene-portrait: url("/venue/dusk-9x16.png");
  --scene-landscape: url("/venue/dusk-16x9.png");
}
.scene[data-slot="night"] {
  --veil-top: rgba(5, 6, 10, .38);
  --veil-bot: rgba(5, 8, 6, .48);
  --scene-portrait: url("/venue/night-9x16.png");
  --scene-landscape: url("/venue/night-16x9.png");
}
@media (max-width: 899px) {
  .scene { height: 100dvh; height: 100vh; }
  .scene .app-shell {
    height: calc(100% - 28px);
    margin: 14px;
    width: calc(100% - 28px);
    overflow: hidden;
  }
  .col-b { display: none; }
  .foot { display: block; }
  .cta {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: .8rem 1rem;
  }
}
@media (min-width: 900px) {
  .scene {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    height: 100vh;
  }
  .scene-bg {
    background-image:
      linear-gradient(180deg, var(--veil-top), var(--veil-bot)),
      var(--scene-landscape);
    background-position: center, center;
  }
  .scene .app-shell {
    width: min(68rem, calc(100vw - 4rem));
    height: auto;
    max-height: min(36rem, calc(100dvh - 4rem));
    margin: 0;
    overflow: hidden;
  }
  .foot { justify-content: flex-end; }
  .cta { min-width: 11rem; text-align: center; }
}
`;
