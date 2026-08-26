/** 窓口（quiet）。マークカード。場内電光・管理には載せない */
export const BET_CSS = `
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
.nav a {
  color: #6aa8a4;
  text-decoration: none;
  font-size: .78rem;
  margin-left: .65rem;
}
.nav a.on { color: #e0b34a; }
.pill {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: .2rem .55rem; border-radius: 999px;
  background: rgba(224, 179, 74, .15); color: #e0b34a;
  font-size: .68rem; font-weight: 700; letter-spacing: .06em;
}
.pill .dot {
  width: .45rem; height: .45rem; border-radius: 50%; background: currentColor;
  animation: blink 1.2s step-end infinite;
}
.pill.idle .dot { animation: none; opacity: .85; }
@keyframes blink { 50% { opacity: 0; } }
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
}
.out-links a {
  color: rgba(232, 238, 234, .55); text-decoration: none; margin-left: .75rem;
}
.out-links a:hover { color: #e0b34a; }
.purse {
  flex: 0 0 auto;
  display: flex; align-items: baseline; justify-content: space-between; gap: .75rem;
  padding: .4rem .7rem; background: #101214; border-bottom: 1px solid #1a2220;
}
.purse .k { font-size: .7rem; letter-spacing: .08em; color: #6aa8a4; }
.purse .v {
  font-size: 1.35rem; font-weight: 800; font-variant-numeric: tabular-nums;
  letter-spacing: .02em; color: #fff;
}
.purse .u { font-size: .78rem; font-weight: 600; color: #8a9490; margin-left: .25rem; }
.desk {
  display: flex; flex-direction: column; padding: 0; overflow: hidden; flex: 1; min-height: 0;
}
.desk-scroll {
  flex: 1; min-height: 0; overflow: auto; padding: .65rem .7rem 5.5rem;
}
.desk-plain { padding: 1.1rem 1rem 1.15rem; overflow: auto; flex: 1; min-height: 0; }
.desk-plain h1 {
  margin: 0 0 .35rem; font-size: 1.2rem; letter-spacing: .14em; color: #e8eeea;
}
.desk-plain .lead {
  margin: 0 0 1rem; font-size: .8rem; color: #6aa8a4; line-height: 1.55;
}
.kinds {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-bottom: .65rem;
}
.kinds a, .kinds span {
  display: block; text-align: center; text-decoration: none;
  border: 1px solid #2a3332; background: #141618; color: #8a9490;
  padding: .45rem 0; font-size: .72rem; font-weight: 700;
}
.kinds a.on, .kinds span.on {
  background: #1c1810; color: #e0b34a; border-color: #e0b34a;
}
.kinds span { opacity: .35; cursor: default; }
.hint { margin: 0 0 .45rem; font-size: .75rem; color: #6aa8a4; }
.wells { display: flex; gap: 6px; margin-bottom: .55rem; }
.well {
  flex: 1; min-height: 3.1rem; border: 1px dashed #3a4440; background: #101214;
  padding: .35rem .4rem; text-align: left; cursor: pointer; color: #6aa8a4; font: inherit;
}
.well.fill { border-style: solid; border-color: #e0b34a; color: #e8fffc; }
.well .k { display: block; font-size: .65rem; color: #6aa8a4; margin-bottom: .1rem; }
.well .v { font-weight: 700; font-size: .85rem; }
.well .o { color: #ff8a2a; font-size: .72rem; margin-left: .25rem; }
.board { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.chip {
  display: grid; grid-template-columns: 1.6rem minmax(0, 1fr) auto; gap: .3rem;
  align-items: center; padding: .4rem .4rem; border: 1px solid #2a3332;
  background: #141618; color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.chip .n { font-weight: 800; font-variant-numeric: tabular-nums; color: #c8d0cc; }
.chip .uma {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .78rem;
}
.chip .od { color: #8a8070; font-size: .72rem; font-variant-numeric: tabular-nums; }
.chip.on { border-color: #e0b34a; background: #1a1610; }
.chip.on .n, .chip.on .uma { color: #e0b34a; }
.chip.used:not(.on) { opacity: .4; }
@keyframes pulse-row {
  0% { background: rgba(255, 138, 42, .28); }
  100% { background: transparent; }
}
.chip.pulse-row,
.orow.pulse-row { animation: pulse-row 1.5s ease-out; }
.t-row.pulse-hit,
.orow.pulse-hit { animation: pulse-row 1.5s ease-out; background: rgba(255, 138, 42, .18); }
.odds-mini { margin: .85rem 0 0; font-size: .78rem; }
.odds-mini h2 {
  font-size: .72rem; color: #6aa8a4; margin: 0 0 .35rem; letter-spacing: .08em; font-weight: 600;
}
.orow {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .35rem;
  padding: .28rem 0; border-bottom: 1px solid #152018; color: #c8d0cc;
}
.orow .odds-now { color: #ff8a2a; font-variant-numeric: tabular-nums; font-weight: 700; }
.tickets {
  margin-top: .9rem; border-top: 1px solid #1a2220; padding-top: .55rem;
}
.tickets h2 {
  margin: 0 0 .35rem; font-size: .72rem; letter-spacing: .08em; color: #6aa8a4; font-weight: 600;
}
.t-row {
  display: flex; justify-content: space-between; gap: .5rem;
  padding: .28rem 0; font-size: .82rem; border-bottom: 1px solid #152018;
}
.text-btn {
  background: none; border: 0; color: #6aa8a4; text-decoration: underline;
  cursor: pointer; font: inherit; padding: .5rem 0 0;
}
.dock {
  flex: 0 0 auto;
  display: grid; grid-template-columns: 1fr auto; gap: .55rem; align-items: center;
  padding: .55rem .7rem calc(.55rem + env(safe-area-inset-bottom));
  border-top: 1px solid #2a3332; background: #0a0c0d;
}
.amt-box { display: flex; flex-direction: column; gap: .3rem; min-width: 0; }
.amt-row { display: flex; gap: 4px; flex-wrap: wrap; }
.amt-row button {
  border: 1px solid #2a3332; background: #161a1c; color: #c8d4d3;
  padding: .28rem .45rem; font: inherit; font-size: .72rem; cursor: pointer;
}
.amt-show { font-size: .78rem; color: #6aa8a4; }
.amt-show b {
  color: #fff; font-size: 1.15rem; font-variant-numeric: tabular-nums; margin-left: .25rem;
}
.amt-show .rest { display: block; font-size: .68rem; color: #6aa8a4; margin-top: .1rem; }
.amt-show .rest b { color: #c8d0cc; font-weight: 700; font-size: inherit; margin-left: 0; }
.buy {
  background: #ff8a2a; color: #140800; border: 0;
  padding: .85rem 1.25rem; font: inherit; font-weight: 800;
  letter-spacing: .12em; cursor: pointer; min-width: 7.5rem;
}
.buy:disabled { opacity: .35; cursor: not-allowed; }
.join-btn {
  width: 100%; background: #ff8a2a; color: #140800; border: 0;
  padding: .85rem 1rem; font: inherit; font-weight: 800; letter-spacing: .12em; cursor: pointer;
}
.flash {
  margin: 0 0 .55rem; padding: .45rem .6rem; background: #1c1810;
  border: 1px solid #e0b34a; color: #e0b34a; font-size: .82rem;
}
.flash.error { border-color: #ff5a4a; color: #ff8a80; }
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
  .scene { display: flex; align-items: center; justify-content: center; }
  .scene-bg {
    background:
      linear-gradient(180deg, rgba(5,6,10,.4), rgba(5,8,6,.48)),
      url("/venue/night-16x9.png") center / cover no-repeat;
  }
  .app-shell {
    width: min(36rem, calc(100vw - 4rem));
    max-height: calc(100dvh - 3rem);
    height: auto;
    margin: 0;
  }
  .out-links { display: block; }
}
`;
