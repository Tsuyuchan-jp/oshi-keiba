import {
  MEMBER_MOBILE_CHROME_CSS,
  MEMBER_MOBILE_GLASS_CSS,
  MEMBER_OVERLAY_CSS,
  MEMBER_QUIET_FRAME_CSS,
} from "./memberShellCss.ts";

export const TICKETS_CSS = `
${MEMBER_QUIET_FRAME_CSS}
${MEMBER_OVERLAY_CSS}
${MEMBER_MOBILE_CHROME_CSS}
:root { --shell-max: 72rem; }
body { overflow: hidden; }
.scene-bg {
  background-color: #07110f;
  background-image: linear-gradient(180deg, var(--veil-top), var(--veil-bot)), var(--scene-portrait);
  background-position: center bottom; background-size: cover; background-repeat: no-repeat;
}
.scene[data-slot="day"] { --veil-top: rgba(18,28,29,.18); --veil-bot: rgba(6,19,16,.38); --scene-portrait: url("/venue/day-9x16.png"); --scene-landscape: url("/venue/day-16x9.png"); }
.scene[data-slot="dusk"] { --veil-top: rgba(24,12,8,.28); --veil-bot: rgba(10,20,17,.48); --scene-portrait: url("/venue/dusk-9x16.png"); --scene-landscape: url("/venue/dusk-16x9.png"); }
.scene[data-slot="night"] { --veil-top: rgba(5,6,10,.38); --veil-bot: rgba(5,15,13,.58); --scene-portrait: url("/venue/night-glass-9x16.png"); --scene-landscape: url("/venue/night-16x9.png"); }
.ticket-chrome .chrome-state { margin-left: auto; }
.ticket-chrome .chrome-state { display: flex; align-items: center; gap: .4rem; color: var(--member-accent); font-size: .72rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ticket-chrome .chrome-state strong { color: var(--member-white); }
.ticket-chrome .pill { display: inline-flex; align-items: center; gap: .3rem; padding: .2rem .55rem; border-radius: 999px; background: rgba(224,179,74,.15); color: var(--member-accent); font-size: .68rem; font-weight: 700; letter-spacing: .06em; }
.ticket-chrome .pill .dot { width: .42rem; height: .42rem; border-radius: 50%; background: currentColor; }
.ticket-nav { display: flex; align-items: center; gap: .65rem; white-space: nowrap; }
.ticket-nav a { color: var(--member-muted); font-size: .78rem; text-decoration: none; }
.ticket-page {
  flex: 1; min-height: 0; overflow: auto; padding: 1.1rem clamp(.75rem, 2vw, 1.4rem) 2rem;
  background: rgba(5, 14, 13, .72);
}
.ticket-hero { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin: 0 auto 1rem; max-width: 66rem; }
.ticket-kicker { display: block; margin-bottom: .2rem; color: #79aaa4; font: 700 .68rem/1.2 "Chakra Petch", sans-serif; letter-spacing: .18em; }
.ticket-hero h1 { margin: 0; color: #f0f6ef; font-size: clamp(1.35rem, 3vw, 2rem); letter-spacing: .08em; }
.ticket-hero p { margin: .35rem 0 0; color: #8eb4ae; font-size: .8rem; }
.ticket-summary { display: flex; gap: .3rem; flex-wrap: wrap; justify-content: flex-end; }
.ticket-summary span { padding: .35rem .55rem; border: 1px solid rgba(118,170,160,.35); background: rgba(7,24,21,.7); color: #bdd7d1; font-size: .72rem; white-space: nowrap; }
.ticket-summary b { color: #fff4ce; font-variant-numeric: tabular-nums; }
.ticket-summary .summary-hit { border-color: rgba(221,65,43,.65); color: #ffd8d2; }
.ticket-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 29rem), 1fr)); gap: 1rem; max-width: 66rem; margin: 0 auto; }
.bet-ticket {
  position: relative; display: grid; grid-template-columns: 4.2rem minmax(0, 1fr);
  min-height: 13.2rem; overflow: hidden; color: #152a23;
  background:
    radial-gradient(circle at 0 50%, transparent 0 .48rem, #edf2dc .51rem) left center / 1rem 2rem repeat-y,
    radial-gradient(circle at 100% 50%, transparent 0 .48rem, #edf2dc .51rem) right center / 1rem 2rem repeat-y,
    linear-gradient(104deg, rgba(56,126,88,.08), transparent 38%, rgba(48,111,79,.08)),
    #edf2dc;
  border: 1px solid rgba(230,241,218,.8); box-shadow: 0 .55rem 1.5rem rgba(0,0,0,.28);
}
.bet-ticket::after { content: "OSHI KEIBA"; position: absolute; right: -1.5rem; bottom: -.35rem; color: rgba(33,102,70,.07); font: 800 3.5rem/1 "Chakra Petch",sans-serif; transform: rotate(-8deg); pointer-events: none; }
.ticket-stub { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: .85rem .35rem; border-right: 1px dashed #668c74; background: rgba(57,116,79,.11); }
.ticket-stub strong { writing-mode: vertical-rl; color: #214f3b; font-size: 1rem; letter-spacing: .14em; }
.ticket-stub span { color: #406957; font: 700 .62rem/1.2 "Chakra Petch",sans-serif; letter-spacing: .08em; }
.ticket-body { position: relative; z-index: 1; display: flex; flex-direction: column; min-width: 0; padding: .8rem 1rem .75rem .8rem; }
.ticket-head { display: flex; justify-content: space-between; gap: .7rem; padding-bottom: .45rem; border-bottom: 2px solid #315f49; }
.ticket-head b { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .84rem; letter-spacing: .04em; }
.ticket-head span { flex: 0 0 auto; color: #466859; font-size: .66rem; }
.ticket-pick { display: flex; align-items: center; gap: .75rem; margin: .6rem 0 .25rem; }
.ticket-kind { flex: 0 0 auto; border: 2px solid #245b3e; padding: .22rem .38rem; color: #174f35; font-size: 1.05rem; font-weight: 900; line-height: 1.05; }
.ticket-numbers { min-width: 0; color: #102d20; font: 800 clamp(1.8rem, 5vw, 2.55rem)/1 "Chakra Petch",sans-serif; letter-spacing: .03em; white-space: nowrap; }
.ticket-names { min-height: 1.35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #355b4a; font-size: .75rem; font-weight: 700; }
.ticket-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .3rem .7rem; margin-top: auto; padding-top: .55rem; border-top: 1px solid rgba(52,98,75,.28); }
.ticket-fact { display: flex; justify-content: space-between; gap: .5rem; color: #4c6a5c; font-size: .67rem; }
.ticket-fact b { color: #193c2c; font-size: .76rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ticket-outcome { display: flex; align-items: baseline; justify-content: flex-end; gap: .4rem; margin-top: .42rem; min-height: 1.4rem; color: #426557; font-size: .68rem; }
.ticket-outcome b { color: #173d2b; font-size: 1rem; font-variant-numeric: tabular-nums; }
.ticket-stamp { position: absolute; z-index: 3; top: 48%; right: 1rem; transform: translateY(-50%) rotate(-11deg); padding: .12em .24em; border: .12em solid currentColor; border-radius: .12em; font-size: clamp(2.1rem, 7vw, 3.3rem); font-weight: 900; line-height: 1; letter-spacing: .08em; opacity: .88; pointer-events: none; }
.ticket-stamp--hit { color: #c7241b; text-shadow: 0 0 1px rgba(199,36,27,.5); }
.ticket-stamp--special { color: #236692; font-size: clamp(1.7rem, 6vw, 2.7rem); }
.ticket-stamp--refund { color: #576c64; font-size: clamp(1.45rem, 5vw, 2.25rem); }
.bet-ticket.is-lost { filter: saturate(.35); opacity: .66; }
.bet-ticket.is-lost .ticket-outcome b { color: #5b655f; }
.ticket-empty { max-width: 42rem; margin: 2rem auto; padding: 2rem 1rem; text-align: center; border: 1px solid rgba(118,170,160,.3); background: rgba(7,24,21,.65); color: #b5cbc6; }
.ticket-empty h2 { margin: 0 0 .45rem; color: #f0f6ef; font-size: 1.1rem; }
.ticket-empty p { margin: 0 0 1rem; font-size: .82rem; line-height: 1.6; }
.ticket-empty a, .ticket-back { display: inline-block; padding: .55rem .9rem; background: #e0b34a; color: #171006; font-size: .78rem; font-weight: 800; text-decoration: none; }
@media (min-width: 900px) {
  .scene-bg { background-image: linear-gradient(180deg,var(--veil-top),var(--veil-bot)),var(--scene-landscape); background-position: center; }
  .app-shell { height: calc(100dvh - 3rem); max-height: calc(100dvh - 3rem); }
}
@media (max-width: 899px) {
  body { overflow: auto; }
  .scene { min-height: 100dvh; height: auto; }
  .scene .app-shell { min-height: calc(100dvh - 28px); height: auto; overflow: visible; }
  .ticket-page { overflow: visible; }
  .ticket-hero { align-items: stretch; flex-direction: column; }
  .ticket-summary { justify-content: flex-start; }
  .ticket-grid { grid-template-columns: 1fr; }
  .bet-ticket { grid-template-columns: 3.35rem minmax(0,1fr); min-height: 12.4rem; }
  .ticket-stub { padding-inline: .25rem; }
  .ticket-body { padding-right: .75rem; }
  .ticket-facts { grid-template-columns: 1fr; gap: .16rem; }
}
${MEMBER_MOBILE_GLASS_CSS}
`;
