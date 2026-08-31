/** 入場（quiet）。骨格は memberShellCss */
import {
  MEMBER_MOBILE_GLASS_CSS,
  MEMBER_OVERLAY_CSS,
  MEMBER_QUIET_FRAME_CSS,
} from "./memberShellCss.ts";

export const GATE_CSS = `
${MEMBER_QUIET_FRAME_CSS}
${MEMBER_OVERLAY_CSS}
:root { --shell-max: 26rem; }
.desk { padding: 1.1rem 1rem 1.15rem; overflow: auto; flex: 1; min-height: 0; }
.desk h1 {
  margin: 0 0 .35rem; font-size: 1.2rem; letter-spacing: .14em; color: var(--member-ink);
}
.lead {
  margin: 0 0 1rem; font-size: .8rem; color: var(--member-muted); line-height: 1.55;
}
label {
  display: flex; flex-direction: column; gap: .3rem;
  font-size: .75rem; color: var(--member-muted); margin-bottom: .7rem;
}
input {
  background: var(--member-field-bg); color: var(--member-ink-bright); border: 1px solid var(--member-field-line);
  padding: .55rem .6rem; font: inherit; font-size: 1rem;
}
.go {
  width: 100%; margin-top: .25rem;
  background: var(--member-action); color: var(--member-action-ink); border: 0;
  padding: .85rem 1rem; font: inherit; font-weight: 800;
  letter-spacing: .12em; cursor: pointer;
}
.again {
  width: 100%; margin-top: .45rem;
  background: transparent; color: var(--member-ink-soft); border: 1px solid var(--member-line-strong);
  padding: .7rem 1rem; font: inherit; font-weight: 700; cursor: pointer;
}
.flash {
  margin: 0 0 .55rem; padding: .45rem .6rem; background: var(--member-accent-bg);
  border: 1px solid var(--member-accent); color: var(--member-accent); font-size: .82rem;
}
.flash.error { border-color: var(--member-danger); color: var(--member-danger-ink); }
@media (min-width: 900px) {
  .app-shell { max-height: none; }
}
${MEMBER_MOBILE_GLASS_CSS}
`;
