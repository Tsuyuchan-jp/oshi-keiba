/** 入場（quiet）。骨格は memberShellCss */
import {
  MEMBER_OVERLAY_CSS,
  MEMBER_QUIET_FRAME_CSS,
} from "./memberShellCss.ts";

export const GATE_CSS = `
${MEMBER_QUIET_FRAME_CSS}
${MEMBER_OVERLAY_CSS}
:root { --shell-max: 26rem; }
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
@media (min-width: 900px) {
  .app-shell { max-height: none; }
}
`;
