/** 入場（quiet）。場内電光・管理には載せない */
export const GATE_CSS = `
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
.more-btn {
  appearance: none; background: transparent; border: 0;
  color: #6aa8a4; font: inherit; font-size: 1.2rem; line-height: 1;
  padding: .15rem .35rem; cursor: pointer; letter-spacing: .05em;
}
.more-btn[aria-expanded="true"] { color: #e0b34a; }
.more-pop {
  display: none; position: absolute; right: .55rem; top: 2.7rem; z-index: 8;
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
.desk { padding: 1.1rem 1rem 1.15rem; overflow: auto; flex: 1; min-height: 0; }
.desk h1 {
  margin: 0 0 .35rem; font-size: 1.2rem; letter-spacing: .14em; color: #e8eeea;
}
.lead {
  margin: 0 0 1rem; font-size: .8rem; color: #6aa8a4; line-height: 1.55;
}
label {
  display: flex; flex-direction: column; gap: .3rem;
  font-size: .75rem; color: #6aa8a4; margin-bottom: .7rem;
}
input {
  background: #101214; color: #e8fffc; border: 1px solid #2a3332;
  padding: .55rem .6rem; font: inherit; font-size: 1rem;
}
.go {
  width: 100%; margin-top: .25rem;
  background: #ff8a2a; color: #140800; border: 0;
  padding: .85rem 1rem; font: inherit; font-weight: 800;
  letter-spacing: .12em; cursor: pointer;
}
.again {
  width: 100%; margin-top: .45rem;
  background: transparent; color: #c8d0cc; border: 1px solid #3a4440;
  padding: .7rem 1rem; font: inherit; font-weight: 700; cursor: pointer;
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
    width: min(26rem, calc(100vw - 4rem));
    max-height: none;
    height: auto;
    margin: 0;
  }
  .out-links { display: block; }
}
`;
