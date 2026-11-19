// খেলা কখন? v2 — পুরো অ্যাপ এক ফাইলে
import { Fragment, createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ════════════════ স্টাইল ════════════════
const CSS = `
:root, [data-theme="dark"] {
  --bg: #0c1311; --card: #151f1c; --card2: #1c2925; --line: rgba(255,255,255,.07);
  --text: #eef5f2; --muted: #8ea39b; --green: #00e676; --greenDim: rgba(0,230,118,.12);
  --amber: #f59e0b; --red: #ff4d5e; --brand: #064e3b; --shadow: 0 8px 30px rgba(0,0,0,.35);
  --onGreen: #04130d;
}
[data-theme="light"] {
  --bg: #eef2f1; --card: #ffffff; --card2: #f4f7f6; --line: rgba(0,0,0,.08);
  --text: #0e1a16; --muted: #5f726b; --green: #00875a; --greenDim: #e1f5ec;
  --amber: #c27803; --red: #d92d3c; --brand: #064e3b; --shadow: 0 8px 30px rgba(0,0,0,.08);
  --onGreen: #ffffff;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: var(--bg); color: var(--text); overflow-x: clip; }
body { font-family: "Hind Siliguri", system-ui, sans-serif; -webkit-tap-highlight-color: transparent; }
button, input { font: inherit; color: inherit; }
button { cursor: pointer; border: 0; background: none; }
img { display: block; }

.app { max-width: 520px; margin: 0 auto; min-height: 100vh; padding-bottom: 84px; }

/* ── হেডার ── */
.top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: center; gap: 9px; font-weight: 700; font-size: 19px; }
.brand b { color: var(--amber); }
.top .sp { flex: 1; }
.pill-btn { height: 32px; min-width: 32px; padding: 0 10px; border-radius: 16px; background: var(--card); border: 1px solid var(--line);
  font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }

.demo-bar { margin: 10px 16px 0; padding: 7px 12px; border-radius: 10px; background: color-mix(in srgb, var(--amber) 14%, transparent);
  color: var(--amber); font-size: 12.5px; text-align: center; }

/* ── সেকশন ── */
.sec { margin: 18px 16px 0; }
.sec-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sec-h h2 { font-size: 15.5px; font-weight: 700; }
.link { color: var(--green); font-size: 13px; font-weight: 600; }
.card { background: var(--card); border-radius: 16px; border: 1px solid var(--line); overflow: hidden; }
.muted { color: var(--muted); }
.empty { padding: 26px 16px; text-align: center; color: var(--muted); font-size: 14px; }

/* ── ক্রেস্ট ── */
.crest { object-fit: contain; flex: none; }
.crest-fb { flex: none; border-radius: 50%; background: var(--card2); border: 1px solid var(--line); color: var(--muted);
  display: grid; place-items: center; font-family: Inter, sans-serif; font-weight: 700; }

/* ── প্রতিযোগিতার হেডার ── */
.comp-h { display: flex; align-items: center; gap: 9px; padding: 11px 14px; font-size: 13.5px; font-weight: 700; border-bottom: 1px solid var(--line); }
.comp-h img { background: #fff; border-radius: 6px; padding: 2px; }

/* ── ম্যাচ সারি (FotMob ধাঁচ) ── */
.row { display: grid; grid-template-columns: 1fr 74px 1fr; align-items: center; gap: 6px; padding: 12px 12px; width: 100%;
  border-bottom: 1px solid var(--line); text-align: left; }
.row:last-child { border-bottom: 0; }
.row:active { background: var(--card2); }
.side { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; font-weight: 500; }
@media (max-width: 380px) { .side { font-size: 13px; gap: 6px; } .row { padding-left: 8px; padding-right: 8px; grid-template-columns: 1fr 66px 1fr; } .row.has-badge { padding-left: 46px; } }
@media (max-width: 340px) { .side { font-size: 12.5px; gap: 4px; } .side .crest, .side .crest-fb { width: 18px !important; height: 18px !important; font-size: 6.5px !important; } .row { gap: 4px; padding-left: 6px; padding-right: 6px; grid-template-columns: 1fr 60px 1fr; } .mid .t { font-size: 12px; } }
.side.home { justify-content: flex-end; text-align: right; }
.side span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.side.win span { font-weight: 700; }
.mid { text-align: center; line-height: 1.15; }
.mid .t { font-size: 13px; font-weight: 600; }
.mid .sc { font-family: Inter, sans-serif; font-size: 16px; font-weight: 800; letter-spacing: .5px; }
.mid .st { font-size: 10.5px; color: var(--muted); margin-top: 2px; }
.mid .lv { color: var(--red); font-weight: 700; }
.pred-tag { display: block; margin-top: 3px; font-size: 10px; color: var(--green); font-weight: 600; }
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--red); margin-right: 4px; animation: blink 1s infinite alternate; vertical-align: middle; }
@keyframes blink { from { opacity: .3 } to { opacity: 1 } }

/* ── হিরো (পরের খেলা) ── */
.hero { position: relative; border-radius: 20px; padding: 18px 16px 16px; color: #fff; overflow: hidden;
  background: radial-gradient(120% 90% at 100% 0%, rgba(0,230,118,.28), transparent 55%), linear-gradient(150deg, #0a3d2f 0%, #064e3b 45%, #08261f 100%); box-shadow: var(--shadow); }
.hero-top { display: flex; align-items: center; gap: 8px; font-size: 12.5px; opacity: .85; }
.hero-top img { background: #fff; border-radius: 5px; padding: 2px; }
.hero-teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; margin: 16px 0 12px; text-align: center; }
.hero-team { display: flex; flex-direction: column; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; line-height: 1.2; }
.hero-vs { font-size: 13px; opacity: .7; }
.hero-time { text-align: center; }
.hero-time .big { font-size: 22px; font-weight: 700; }
.hero-time .when { font-size: 13px; opacity: .8; }
.cd { margin-top: 12px; display: flex; justify-content: center; }
.cd span { background: rgba(0,0,0,.25); border: 1px solid rgba(255,255,255,.12); padding: 6px 14px; border-radius: 999px; font-size: 13.5px; font-weight: 600; }
.cd b { color: #7dffb8; }

.cta { padding: 18px 16px; display: flex; gap: 14px; align-items: center; }
.cta h3 { font-size: 16.5px; margin-bottom: 4px; }
.cta p { font-size: 13.5px; color: var(--muted); line-height: 1.5; }
.btn { height: 44px; padding: 0 18px; border-radius: 12px; background: var(--green); color: var(--onGreen); font-weight: 700; font-size: 15px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.btn.ghost { background: var(--card2); color: var(--text); border: 1px solid var(--line); }
.btn.block { width: 100%; }
.btn:disabled { opacity: .55; }

/* ── রাইভাল কার্ড ── */
.rival { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-bottom: 1px solid var(--line); font-size: 13.5px; }
.rival:last-child { border-bottom: 0; }
.rival .nm { font-weight: 700; flex: 1; min-width: 0; }
.rival .res { font-size: 12.5px; color: var(--muted); text-align: right; }
.badge { font-family: Inter, sans-serif; font-size: 11px; font-weight: 800; width: 22px; height: 22px; border-radius: 6px; display: grid; place-items: center; color: #fff; }
.badge.W { background: #16a34a; } .badge.D { background: #64748b; } .badge.L { background: #dc2626; }

/* ── তারিখ স্ট্রিপ ── */
.strip { display: flex; gap: 6px; overflow-x: auto; padding: 12px 16px 4px; scrollbar-width: none; }
.strip::-webkit-scrollbar { display: none; }
.day { flex: none; width: 58px; padding: 7px 0; border-radius: 12px; text-align: center; background: var(--card); border: 1px solid var(--line); }
.day .a { font-size: 12px; font-weight: 600; color: var(--muted); }
.day .b { font-size: 13px; font-weight: 700; }
.day.on { background: var(--green); border-color: var(--green); }
.day.on .a, .day.on .b { color: var(--onGreen); }
.chips { display: flex; gap: 6px; overflow-x: auto; padding: 8px 16px 0; scrollbar-width: none; }
.chips::-webkit-scrollbar { display: none; }
.chip { flex: none; height: 32px; padding: 0 12px; border-radius: 16px; font-size: 13px; font-weight: 600; background: var(--card); border: 1px solid var(--line);
  display: inline-flex; align-items: center; gap: 6px; }
.chip img { background: #fff; border-radius: 4px; padding: 1px; }
.chip.on { background: var(--greenDim); border-color: var(--green); color: var(--green); }

/* ── নিচের ন্যাভ ── */
.nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 30; background: var(--card); border-top: 1px solid var(--line);
  padding-bottom: env(safe-area-inset-bottom); }
.nav-in { max-width: 520px; margin: 0 auto; display: grid; grid-template-columns: repeat(5, 1fr); }
.nav button { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 9px 0 10px; font-size: 11.5px; color: var(--muted); font-weight: 500; }
.nav button svg { width: 22px; height: 22px; }
.nav button.on { color: var(--green); font-weight: 700; }

/* ── বটম শিট ── */
.veil { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,.55); display: flex; align-items: flex-end; justify-content: center; animation: fade .15s; }
.sheet { width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto; background: var(--bg); border-radius: 22px 22px 0 0; padding: 8px 16px calc(20px + env(safe-area-inset-bottom)); animation: up .2s ease-out; }
.grab { width: 40px; height: 4px; border-radius: 2px; background: var(--line); margin: 4px auto 10px; }
@keyframes up { from { transform: translateY(40px); opacity: .6 } }
@keyframes fade { from { opacity: 0 } }

.stepper { display: flex; align-items: center; justify-content: center; gap: 10px; }
.stepper button { width: 38px; height: 38px; border-radius: 12px; background: var(--card2); border: 1px solid var(--line); font-size: 20px; font-weight: 700; }
.stepper .v { font-family: Inter, sans-serif; font-size: 30px; font-weight: 800; min-width: 34px; text-align: center; }
.pred-box { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 6px; padding: 16px 10px; }
.pred-box .dash { font-size: 24px; color: var(--muted); }

/* ── ফর্ম ── */
.field { display: block; margin-bottom: 12px; }
.field span { display: block; font-size: 13px; color: var(--muted); margin-bottom: 5px; }
.field input { width: 100%; height: 46px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); padding: 0 14px; font-size: 15px; outline: none; }
.field input:focus { border-color: var(--green); }
.seg { display: grid; grid-template-columns: 1fr 1fr; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 3px; }
.seg button { height: 36px; border-radius: 9px; font-weight: 600; font-size: 14px; color: var(--muted); }
.seg button.on { background: var(--card2); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,.15); }
.err { color: var(--red); font-size: 13px; margin: 6px 0 10px; }
.note { color: var(--green); font-size: 13.5px; margin: 6px 0 10px; line-height: 1.5; }
.or { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 12.5px; margin: 14px 0; }
.or::before, .or::after { content: ""; flex: 1; height: 1px; background: var(--line); }

/* ── দল বাছাই ── */
.team-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.team-pick { position: relative; padding: 12px 6px 10px; border-radius: 14px; background: var(--card); border: 1.5px solid var(--line);
  display: flex; flex-direction: column; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; text-align: center; line-height: 1.2; }
.team-pick.fav { border-color: var(--green); background: var(--greenDim); }
.team-pick.rival { border-color: var(--red); background: color-mix(in srgb, var(--red) 10%, transparent); }
.team-pick:disabled { opacity: .35; }
.team-pick .mark { position: absolute; top: 6px; right: 7px; font-size: 13px; }
.lg-h { font-size: 13px; font-weight: 700; color: var(--muted); margin: 16px 0 8px; display: flex; align-items: center; gap: 7px; }
.lg-h img { background: #fff; border-radius: 4px; padding: 1px; }
.sticky-foot { position: sticky; bottom: 0; background: var(--bg); padding: 12px 0 4px; display: flex; gap: 8px; }

/* ── লিডারবোর্ড ── */
.lb { display: grid; grid-template-columns: 32px 1fr auto; align-items: center; gap: 8px; padding: 11px 14px; border-bottom: 1px solid var(--line); font-size: 14px; }
.lb:last-child { border-bottom: 0; }
.lb .rk { font-family: Inter, sans-serif; font-weight: 800; color: var(--muted); text-align: center; }
.lb .rk.top { color: var(--amber); }
.lb .pt { font-weight: 700; text-align: right; }
.lb .sub { font-size: 11.5px; color: var(--muted); }
.ptbadge { font-family: Inter, sans-serif; font-size: 11px; font-weight: 800; padding: 3px 7px; border-radius: 7px; background: var(--card2); color: var(--muted); }
.ptbadge.p3 { background: var(--green); color: var(--onGreen); }
.ptbadge.p1 { background: var(--greenDim); color: var(--green); }

.prof-head { display: flex; align-items: center; gap: 14px; padding: 16px; }
.avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--brand); color: #fff; display: grid; place-items: center; font-size: 22px; font-weight: 700; }
.kv { display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; border-top: 1px solid var(--line); font-size: 14px; }
.team-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 14px; }
.tchip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px 5px 6px; border-radius: 999px; background: var(--card2); font-size: 12.5px; font-weight: 600; }
.toast { position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%); z-index: 60; background: var(--text); color: var(--bg); padding: 9px 16px; border-radius: 999px; font-size: 13.5px; font-weight: 600; animation: fade .2s; }
.spin { width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid var(--line); border-top-color: var(--green); animation: rot .7s linear infinite; margin: 30px auto; }
@keyframes rot { to { transform: rotate(360deg) } }

/* ── ফুটার ── */
.foot { margin-top: 32px; background: #0b1311; color: #e9f2ee; border-radius: 22px 22px 0 0; padding: 28px 20px 24px; }
.foot-in { max-width: 1100px; margin: 0 auto; }
.foot-brand { display: flex; align-items: center; gap: 12px; font-size: 24px; }
.foot-brand b span { color: #f59e0b; }
.foot-tag { margin-top: 10px; font-size: 17px; font-weight: 600; color: #00e676; }
.foot-desc { font-size: 14px; line-height: 1.75; color: #a9bbb4; margin: 14px 0 18px; }
.foot-social { display: flex; gap: 10px; }
.foot-social a { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: #1a2622; color: #e9f2ee; }
.foot-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 26px 16px; margin: 26px 0 22px; }
.foot-cols h4 { font-size: 15px; font-weight: 700; margin-bottom: 10px; color: #fff; }
.foot-cols a, .foot-cols button { display: block; text-align: left; padding: 6px 0; font-size: 14.5px; color: #c4d3cd; text-decoration: none; overflow-wrap: anywhere; }
.foot-cols a:hover, .foot-cols button:hover { color: #00e676; }
.foot-bottom { border-top: 1px solid rgba(255,255,255,.08); padding-top: 16px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; font-size: 12px; color: #8ea39b; font-family: Inter, "Hind Siliguri", sans-serif; }
.foot-bottom a { color: #c4d3cd; font-weight: 600; text-decoration: none; }
.foot-bottom a:hover { color: #00e676; }
/* ফুটারের আলাদা পাতা */
.info h1 { font-size: 24px; margin: 6px 0 12px; }
.info h2 { font-size: 16px; margin: 22px 0 8px; }
.info p { font-size: 15px; line-height: 1.8; color: var(--text); opacity: .9; }
.founder { text-align: center; margin-bottom: 18px; }
.contact-cards { display: grid; gap: 10px; margin: 18px 0 6px; }
.contact-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-decoration: none; color: inherit; }
.contact-card b { display: block; font-size: 15px; }
.contact-card small { color: var(--muted); font-size: 13px; font-family: Inter, sans-serif; }
.contact-ic { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: var(--greenDim); color: var(--green); flex: none; }
.contact-ic.fb { background: color-mix(in srgb, #1877f2 14%, transparent); color: #1877f2; }
.contact-topics { display: grid; gap: 10px; }
.contact-topics > div { background: var(--card); border-radius: 14px; padding: 12px 14px; }
.contact-topics b { font-size: 14.5px; }
.contact-topics p { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin-top: 2px; opacity: 1; }
.founder-photo { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--green); margin: 0 auto 10px; }
.foot-made { font-size: 12.5px; font-weight: 600; color: var(--muted); margin-bottom: 8px; font-family: Inter, "Hind Siliguri", sans-serif; }
.foot-links { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
.foot-links a { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; text-decoration: none; font-family: Inter, sans-serif; font-weight: 500; }
.foot-copy { font-size: 11px; color: var(--muted); opacity: .8; }

/* ── হোমের পরিচিতি অংশ ── */
.about { padding: 16px; }
.about p, .dev p { font-size: 14.5px; line-height: 1.7; color: var(--text); opacity: .88; }
.facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
.facts div { background: var(--card2); border-radius: 12px; padding: 10px 6px; text-align: center; }
.facts b { display: block; font-size: 18px; color: var(--green); }
.facts span { font-size: 12px; color: var(--muted); }
.step { display: flex; gap: 12px; padding: 13px 14px; border-bottom: 1px solid var(--line); }
.step:last-of-type { border-bottom: 0; }
.step-n { flex: none; width: 28px; height: 28px; border-radius: 50%; background: var(--greenDim); color: var(--green); display: grid; place-items: center; font-weight: 700; font-size: 14px; }
.step b { font-size: 14.5px; }
.step p { font-size: 13.5px; color: var(--muted); line-height: 1.5; margin-top: 2px; }
.dev { padding: 16px; }
.dev-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.dev-links { display: flex; gap: 10px; margin-top: 14px; }
.dev-links a { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: var(--card2); border: 1px solid var(--line); color: var(--green); }
.dev-links a.fb { color: #1877f2; }
.dev-photo { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid var(--green); flex: none; }

/* ── জিজ্ঞেস করো ── */
.ask-fab { position: fixed; z-index: 35; right: max(14px, calc(50vw - 246px)); bottom: calc(76px + env(safe-area-inset-bottom)); height: 44px; padding: 0 16px 0 14px; border-radius: 22px;
  background: linear-gradient(135deg, #064e3b, #0a7a55); color: #fff; font-weight: 700; font-size: 14.5px; display: inline-flex; align-items: center; gap: 7px;
  box-shadow: 0 6px 20px rgba(0,0,0,.35); border: 1px solid rgba(0,230,118,.45); }
.ask-spark { color: #7dffb8; font-size: 15px; }
.sheet.ask { display: flex; flex-direction: column; height: 82vh; }
.ask-head { font-weight: 700; font-size: 16.5px; display: flex; align-items: center; gap: 8px; padding: 4px 2px 10px; border-bottom: 1px solid var(--line); }
.ask-body { flex: 1; overflow-y: auto; padding: 12px 0; display: flex; flex-direction: column; gap: 10px; }
.ask-ex { display: flex; flex-wrap: wrap; gap: 6px; }
.ask-follow { margin-top: 10px; }
.guide { margin-top: 10px; }
.guide-h { display: flex; align-items: center; gap: 10px; font-size: 15.5px; }
.guide-ic { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: var(--greenDim); color: var(--green); flex: none; font-size: 18px; }
.guide-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px; margin: 12px 0 4px; }
.guide-facts div { background: var(--card2); border-radius: 12px; padding: 10px 8px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
.guide-facts b { font-size: 20px; color: var(--green); font-family: Inter, "Hind Siliguri", sans-serif; }
.guide-facts span { font-size: 11.5px; color: var(--muted); line-height: 1.3; }
.guide-steps { list-style: none; margin: 12px 0 0; padding: 0; position: relative; }
.guide-steps li { display: flex; gap: 12px; position: relative; padding-bottom: 14px; animation: qzIn .35s ease both; }
.guide-steps li:not(:last-child)::before { content: ""; position: absolute; left: 13px; top: 28px; bottom: 0; width: 2px; background: var(--line); }
.guide-n { width: 28px; height: 28px; border-radius: 50%; background: var(--green); color: var(--onGreen); display: grid; place-items: center; font-size: 13px; font-weight: 800; flex: none; position: relative; z-index: 1; }
.guide-steps b { font-size: 14px; display: block; line-height: 1.4; margin-top: 3px; }
.guide-steps p { font-size: 13px; color: var(--muted); line-height: 1.55; margin-top: 2px; }
.guide-tips { background: rgba(245,158,11,.1); border-radius: 12px; padding: 10px 12px; display: grid; gap: 6px; font-size: 12.5px; line-height: 1.55; }
.guide-tips b { color: var(--amber); font-size: 12.5px; }
.guide-tips p { position: relative; padding-left: 12px; }
.guide-tips p::before { content: ""; position: absolute; left: 0; top: .65em; width: 5px; height: 5px; border-radius: 50%; background: var(--amber); }
.guide-cta { margin-top: 12px; }
.ask-follow .chip { font-size: 12.5px; padding: 6px 11px; }
.ask-new { margin-left: auto; font-size: 12.5px; font-weight: 600; color: var(--green); }
.ask-mic { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; color: var(--muted); background: var(--card2); flex: none; }
.ask-mic.on { color: #fff; background: var(--red); animation: dotBlink .8s ease-in-out infinite alternate; }
.tbl.ask { grid-template-columns: 24px 1fr 30px 38px 34px; }
.tbl.ask.hl { background: var(--greenDim); }
.tbl.ask.hl .tm b { color: var(--green); }
.ask-gap { text-align: center; color: var(--muted); font-size: 12px; line-height: 1; padding: 2px 0; }
.ask-more { display: block; width: 100%; text-align: center; padding: 10px; font-size: 13px; font-weight: 600; color: var(--green); border-top: 1px solid var(--line); }
.ask-h2h { padding: 12px; }
.h2h-bar { display: flex; height: 26px; border-radius: 8px; overflow: hidden; font-size: 12.5px; font-weight: 700; color: #fff; }
.h2h-bar span { display: grid; place-items: center; min-width: 0; }
.h2h-bar .a, .h2h-legend .a { background: var(--green); color: var(--onGreen); }
.h2h-bar .d, .h2h-legend .d { background: var(--muted); }
.h2h-bar .b, .h2h-legend .b { background: var(--amber); color: #1d1300; }
.h2h-legend { display: flex; justify-content: space-between; gap: 6px; font-size: 12px; margin: 8px 0 6px; color: var(--muted); }
.h2h-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; }
.ah-row { display: grid; grid-template-columns: 62px 1fr 42px 1fr; gap: 6px; align-items: center; padding: 7px 0; border-top: 1px solid var(--line); font-size: 13px; }
.ah-row b { text-align: center; }
.ah-row span:last-child { text-align: right; }
.ah-row small { font-size: 11.5px; }
.bubble { max-width: 92%; padding: 10px 13px; border-radius: 16px; font-size: 14.5px; line-height: 1.6; }
.bubble.me { align-self: flex-end; background: var(--green); color: var(--onGreen); border-bottom-right-radius: 5px; }
.bubble.bot { align-self: flex-start; background: var(--card); border: 1px solid var(--line); border-bottom-left-radius: 5px; width: 92%; }
.bubble .card .row { padding: 10px 6px; }
.ask-input { display: flex; gap: 8px; padding-top: 10px; border-top: 1px solid var(--line); }
.ask-input input { flex: 1; height: 44px; border-radius: 22px; border: 1px solid var(--line); background: var(--card); padding: 0 16px; font-size: 15px; outline: none; }
.ask-input input:focus { border-color: var(--green); }
.ask-input .btn { height: 44px; border-radius: 22px; }

/* ── লিগ ও দলের পাতা ── */
.comp-h { width: 100%; text-align: left; }
.comp-go { margin-left: auto; color: var(--muted); font-size: 18px; line-height: 1; }
.hero-top { color: inherit; text-align: left; }
.hero-team { color: inherit; }
.page-head { display: flex; align-items: center; gap: 10px; padding: 14px 16px 0; }
.page-head h1 { font-size: 21px; }
.page-head img { background: #fff; border-radius: 8px; padding: 3px; }
.back { width: 36px; height: 36px; border-radius: 50%; background: var(--card); border: 1px solid var(--line); font-size: 18px; font-weight: 700; flex: none; }
.seg3 { grid-template-columns: repeat(3, 1fr); }
.tbl { display: grid; grid-template-columns: 26px 1fr 26px 26px 26px 26px 34px 30px; align-items: center; gap: 2px; padding: 9px 10px 9px 8px; width: 100%; text-align: center;
  font-size: 13px; border-bottom: 1px solid var(--line); border-left: 3px solid transparent; }
.tbl:last-child { border-bottom: 0; }
.tbl-h { font-size: 11.5px; color: var(--muted); font-weight: 600; padding-top: 10px; padding-bottom: 8px; }
.tbl .tm { display: flex; align-items: center; gap: 7px; text-align: left; min-width: 0; }
.tbl .tm b { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tbl .pos { color: var(--muted); font-weight: 600; }
.tbl .pts { font-weight: 800; }
.tbl.z-up { border-left-color: #16a34a; } .tbl.z-mid { border-left-color: #f59e0b; } .tbl.z-down { border-left-color: #dc2626; }
.legend { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-size: 12px; color: var(--muted); margin-top: 8px; }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-left: 6px; }
.legend i.z-up { background: #16a34a; } .legend i.z-mid { background: #f59e0b; } .legend i.z-down { background: #dc2626; }
.scr { display: grid; grid-template-columns: 26px 1fr 54px 44px; align-items: center; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--line); font-size: 13.5px; text-align: center; }
.scr:last-child { border-bottom: 0; }
.scr-h { font-size: 11.5px; color: var(--muted); font-weight: 600; }
.scr .pl { text-align: left; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.scr .pl b { font-weight: 600; font-family: Inter, "Hind Siliguri", sans-serif; }
.pl-team { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--muted); text-align: left; }
.scr .pts { font-weight: 800; font-size: 16px; color: var(--green); }
.scr .pos { color: var(--muted); font-weight: 600; }
.team-hero { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 16px 4px; text-align: center; }
.team-hero h1 { font-size: 23px; margin-top: 6px; }
.fav-btn { display: inline-flex; align-items: center; gap: 7px; margin-top: 10px; height: 36px; padding: 0 16px; border-radius: 18px; border: 1.5px solid var(--line); background: var(--card); font-weight: 700; font-size: 13.5px; color: var(--text); }
.fav-btn span { color: var(--amber); font-size: 17px; }
.fav-btn.on { border-color: var(--amber); background: rgba(245,158,11,.12); }
.team-pos { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
.stat-row { display: grid; grid-template-columns: repeat(6, 1fr); padding: 12px 6px; text-align: center; }
.stat-row b { display: block; font-size: 16px; }
.stat-row span { font-size: 11px; color: var(--muted); }
.form-row { display: flex; gap: 8px; }
.badge.big { width: 38px; height: 38px; border-radius: 10px; font-size: 15px; }
.badge.big.word { width: 44px; font-family: "Hind Siliguri", sans-serif; font-size: 13.5px; font-weight: 700; }
.league-strip { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 0 16px; }
.league-strip::-webkit-scrollbar { display: none; }
.league-tile { flex: none; width: 92px; padding: 12px 6px 10px; border-radius: 14px; background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; text-align: center; line-height: 1.2; }
.league-tile img { background: #fff; border-radius: 8px; padding: 3px; }
.tchip { color: inherit; }
.tbl-h span:nth-child(2) { text-align: left; }
.app { padding-bottom: 140px; }

/* ── বন্ধুদের লিগ ── */
.fl-head { display: flex; align-items: center; gap: 12px; }
.fl-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-bottom: 1px solid var(--line); }
.fl-row:last-child { border-bottom: 0; }
.fl-icon { width: 38px; height: 38px; border-radius: 12px; background: var(--brand); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 17px; flex: none; }
.inline-form { display: flex; gap: 8px; }
.inline-form input { flex: 1; min-width: 0; height: 44px; border-radius: 12px; border: 1px solid var(--line); background: var(--card2); padding: 0 12px; font-size: 15px; outline: none; }
.inline-form input:focus { border-color: var(--green); }
.code { font-family: Inter, sans-serif; letter-spacing: 1.5px; color: var(--green); }

/* ── খেলোয়াড় আর মুখোমুখি ── */
.info-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--line); font-size: 14px; }
.info-row:last-child { border-bottom: 0; }
.info-row b { text-align: right; font-weight: 600; }
.card.info-row { margin-bottom: 4px; }
.sq { display: grid; grid-template-columns: 40px 1fr auto; grid-template-rows: auto auto; column-gap: 10px; padding: 9px 14px; border-bottom: 1px solid var(--line); align-items: center; }
.sq-av { grid-column: 1; grid-row: 1 / span 2; display: flex; }
.sq > b { grid-column: 2; }
.av { border-radius: 50%; object-fit: cover; object-position: 50% 18%; background: var(--card2); flex: none; display: block; }
.av-fb { display: grid; place-items: center; color: var(--muted); font-family: Inter, sans-serif; font-weight: 700; }
.sq:last-child { border-bottom: 0; }
.sq b { font-weight: 600; font-size: 14px; font-family: Inter, "Hind Siliguri", sans-serif; }
.sq .muted { grid-column: 2; font-size: 12px; }
.sq-age { grid-column: 3; grid-row: 1 / span 2; align-self: center; font-size: 13px; color: var(--muted); }
.h2h-agg { display: grid; grid-template-columns: 1fr 1fr 1fr; text-align: center; padding: 14px 8px; border-bottom: 1px solid var(--line); }
.h2h-agg b { display: block; font-size: 24px; font-family: Inter, sans-serif; }
.h2h-agg span { font-size: 12px; color: var(--muted); }
.h2h-row { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; border-bottom: 1px solid var(--line); font-size: 13.5px; }
.h2h-row:last-child { border-bottom: 0; }
.h2h-row .muted { font-size: 11.5px; }
.h2h-score b { font-family: Inter, sans-serif; margin: 0 4px; }

/* ══════ মিনিমাল ডিজাইন ══════ */
.sec { margin-top: 22px; }
.sec-h h2 { font-size: 15px; font-weight: 700; letter-spacing: .1px; }
.card { border-radius: 14px; }
/* পরের খেলা — কমপ্যাক্ট */
.nx { width: 100%; text-align: left; border-radius: 16px; padding: 12px 14px 14px; color: #fff;
  background: linear-gradient(135deg, #0a3d2f, #064e3b 60%, #08261f); border: 1px solid rgba(0,230,118,.22); }
.nx-top { display: flex; justify-content: space-between; align-items: center; font-size: 12px; opacity: .85; margin-bottom: 10px; }
.nx-top > span:first-child { display: inline-flex; align-items: center; gap: 6px; }
.nx-top img { background: #fff; border-radius: 4px; padding: 1px; }
.nx-cd { color: #7dffb8; font-weight: 600; }
.nx-mid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
.nx-team { display: flex; align-items: center; gap: 8px; min-width: 0; }
.nx-team.r { justify-content: flex-end; text-align: right; }
.nx-team b { font-size: 14.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nx-time { text-align: center; display: flex; flex-direction: column; line-height: 1.15; }
.nx-time b { font-size: 16px; }
.nx-time small { font-size: 11px; opacity: .75; }
.nx-score { font-family: Inter, sans-serif; font-size: 20px !important; }
/* অতিথির জন্য সরু লাইন */
.slim { width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 14px; background: var(--card); border: 1px dashed color-mix(in srgb, var(--green) 45%, transparent); font-size: 14px; text-align: left; }
.slim span:nth-child(2) { flex: 1; }
.slim-star { color: var(--amber); font-size: 16px; }
/* লিগ — ছোট গোল আইকন */
.league-strip { gap: 14px; }
.league-tile { width: 64px; padding: 0; background: none; border: 0; gap: 6px; font-size: 11px; font-weight: 500; color: var(--muted); }
.league-tile img { width: 48px; height: 48px; padding: 9px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px var(--line); }
/* পরিচিতি — হালকা লেখা, কার্ড ছাড়া */
.about-wrap { margin-top: 36px; border-top: 1px solid var(--line); padding-top: 6px; }
.about-blk { padding: 16px 0 6px; }
.about-blk h3 { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.about-blk p { font-size: 13.5px; line-height: 1.7; color: var(--muted); }
.about-blk p.clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.steps { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.steps > div { background: var(--card); border-radius: 12px; padding: 10px 12px; }
.steps .step-n { width: 22px; height: 22px; font-size: 12px; margin-bottom: 6px; }
.steps b { display: block; font-size: 13.5px; }
.steps p { font-size: 12px; line-height: 1.5; margin-top: 2px; }
.dev-mini { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.dev-mini .dev-photo { width: 52px; height: 52px; border-width: 1.5px; }
.dev-mini b { font-size: 15px; }
.dev-mini .dev-links { margin: 0; gap: 8px; }
.dev-mini .dev-links a { width: 34px; height: 34px; }
/* জিজ্ঞেস বাটন — ছোট */
.ask-fab { height: 40px; padding: 0 14px 0 12px; font-size: 13.5px; border-radius: 20px; }
.foot { margin-top: 28px; }
.league-tile img { object-fit: contain; padding: 10px; }

/* ── প্রিয় দলের চিহ্ন ── */
.fav-star { font-style: normal; color: var(--amber); font-size: .9em; margin-right: 4px; }
.fav-star.r { margin: 0 0 0 4px; }
.row.my { background: color-mix(in srgb, var(--amber) 6%, transparent); }
.my-h { display: flex; align-items: center; gap: 6px; }
.fav-wrap { display: grid; gap: 10px; }
.follow-h { display: flex; align-items: center; gap: 10px; width: 100%; padding: 13px 16px; background: var(--card2); border-bottom: 1px solid var(--line); font-size: 15.5px; text-align: left; }
.follow-h .fav-star { font-size: 17px; margin: 0; }
.follow-h b { flex: 1; }
.chev { flex: none; color: var(--text); transform: rotate(180deg); transition: transform .2s; }
.chev.up { transform: none; }

/* সরু দাগ ছাড়া, FotMob-এর মতো পরিষ্কার কার্ড আর টেবিল */
.card { border: 0; }
.row, .comp-h, .follow-h { border-bottom: 0; }
.tbl, .scr, .lb, .rival, .kv, .step, .fl-row, .info-row, .sq, .h2h-agg, .h2h-row, .ask-head { border-top: 0; border-bottom: 0; }
.seg, .lg-card, .bubble.bot { border: 0; }
.ask-input { border-top: 0; }
.follow-h { padding: 14px 16px; }
.row { position: relative; }
.row.has-badge { padding-left: 50px; }
.row.has-badge .mid .st { display: none; }
.mid .st { white-space: nowrap; }
.rbadge { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 32px; padding: 3px 0; border-radius: 8px; background: var(--card2);
  color: var(--muted); font-size: 10.5px; font-weight: 700; text-align: center; line-height: 1.2; white-space: nowrap; overflow: hidden; }

/* ── ম্যাচের শিট: সাদামাটা, ভারী রঙ ছাড়া ── */
.ms-top { display: flex; align-items: center; gap: 10px; padding: 2px 0 6px; }
.ms-comp { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--muted); text-align: left; }
.ms-comp span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ms-comp img { background: #fff; border-radius: 5px; padding: 2px; }
.ms-share { width: 38px; height: 38px; border-radius: 50%; background: var(--card); display: grid; place-items: center; color: var(--text); flex: none; }
.ms-share svg { width: 18px; height: 18px; }
.spin.sm { width: 16px; height: 16px; margin: 0; border-width: 2px; }
.ms-teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; padding: 14px 0 6px; }
.ms-team { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; text-align: center; line-height: 1.25; }
.ms-mid { text-align: center; min-width: 96px; }
.ms-time { font-size: 26px; font-weight: 700; line-height: 1.1; }
.ms-score { font-family: Inter, sans-serif; font-size: 32px; font-weight: 800; letter-spacing: 1px; }
.ms-date { font-size: 13px; color: var(--muted); margin-top: 4px; }
.ms-cd { text-align: center; font-size: 12.5px; color: var(--muted); padding-bottom: 4px; }
.ms-row { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; font-size: 14.5px; font-weight: 600; text-align: left; }
.pick .pred-box { padding: 14px 8px 4px; }
.game-sw { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.game-sw button { display: flex; align-items: center; justify-content: center; gap: 7px; height: 46px; border-radius: 14px; background: var(--card); border: 1.5px solid var(--line); font-weight: 700; font-size: 14.5px; color: var(--muted); }
.game-sw button.on { border-color: var(--green); background: var(--greenDim); color: var(--green); }
.game-sw button svg { flex: none; }
@keyframes qzIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes qzPop { 0% { opacity: 0; transform: scale(.6); } 60% { opacity: 1; transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes qzShake { 0%, 100% { transform: none; } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
@keyframes qzRight { 0% { transform: scale(1); } 40% { transform: scale(1.03); } 100% { transform: scale(1); } }
.qz-stage .qz-q { animation: qzIn .35s ease both; }
.qz-stage .qz-opt { animation: qzIn .35s ease both; }
.qz-opt { transition: background .3s, border-color .3s, opacity .3s, transform .1s; }
.qz-opt.right { animation: qzRight .45s ease; }
.qz-opt.wrong { animation: qzShake .35s ease; }
.qz-verdict { animation: qzIn .3s ease both; }
.qz-count { animation: qzPop .5s ease both; }
.qz-result { animation: qzPop .45s ease both; }
.qz-board .qz-pl { animation: qzIn .3s ease both; }
.qz-lobby, .qz-hero, .qz-join { animation: qzIn .3s ease both; }
.qz-hero-ic { width: 64px; height: 64px; margin: 0 auto; border-radius: 20px; display: grid; place-items: center; background: var(--greenDim); color: var(--green); }
.qz-mode { display: flex; align-items: center; justify-content: flex-start; gap: 14px; text-align: left; padding: 0 18px; }
.qz-mode span { display: flex; flex-direction: column; line-height: 1.25; }
.qz-mode small { font-weight: 500; font-size: 12px; opacity: .8; }
.qz-ic-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
.qz-badge { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex: none; font-weight: 800; font-size: 13px; background: var(--card2); color: var(--muted); }
.qz-badge.r1 { background: linear-gradient(145deg, #ffd65a, #e0a200); color: #4a3300; }
.qz-badge.r2 { background: linear-gradient(145deg, #e6ebf0, #a9b4bf); color: #2f3a44; }
.qz-badge.r3 { background: linear-gradient(145deg, #f0b27a, #c06d2c); color: #3d1f06; }
.qz-badge.big { width: 72px; height: 72px; margin: 0 auto; font-size: 30px; box-shadow: 0 8px 24px rgba(0,0,0,.12); }
.qz-ini { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; flex: none; font-weight: 700; font-size: 13px; background: var(--brand); color: #fff; }
.qz-hero { padding: 22px 18px; text-align: center; }
.qz-hero-ic { font-size: 44px; }
.qz-hero h2 { font-size: 21px; margin: 6px 0 6px; }
.qz-hero p { font-size: 13.5px; line-height: 1.6; margin-bottom: 16px; }
.qz-modes { display: grid; gap: 10px; }
.qz-modes .btn { height: 58px; font-size: 16px; }
.qz-join { margin-top: 12px; padding: 14px; }
.qz-join form { display: flex; gap: 8px; margin-top: 10px; }
.qz-join input { flex: 1; min-width: 0; height: 44px; border-radius: 12px; border: 1px solid var(--line); background: var(--card2); padding: 0 14px; font-size: 16px; letter-spacing: 2px; text-transform: uppercase; outline: none; color: var(--text); }
.qz-lobby { padding: 18px; text-align: center; }
.qz-code { font-family: Inter, sans-serif; font-weight: 800; font-size: 38px; letter-spacing: 6px; color: var(--green); margin: 4px 0 14px; }
.qz-board { margin-top: 4px; }
.qz-pl { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-top: 1px solid var(--line); }
.qz-pl:first-child { border-top: 0; }
.qz-pl.me { background: var(--greenDim); }
.qz-nm { flex: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.qz-nm small { color: var(--muted); font-weight: 500; }
.qz-sc { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.2; }
.qz-sc b { font-size: 17px; }
.qz-sc small { font-size: 11.5px; color: var(--muted); }
.qz-go { margin-top: 14px; height: 52px; font-size: 16.5px; }
.qz-wait { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--muted); font-size: 13.5px; margin: 14px 0; text-align: center; }
.qz-count { font-family: Inter, sans-serif; font-size: 96px; font-weight: 800; text-align: center; color: var(--green); margin-top: 60px; }
.qz-top { display: flex; justify-content: space-between; font-size: 13px; color: var(--muted); font-weight: 600; }
.qz-myscore { color: var(--green); }
.qz-timer { height: 8px; border-radius: 4px; background: var(--card2); overflow: hidden; margin: 10px 0 4px; }
.qz-timer i { display: block; height: 100%; background: var(--green); transition: width .25s linear; }
.qz-timer i.low { background: var(--red); }
.qz-left { text-align: center; font-family: Inter, sans-serif; font-weight: 800; font-size: 26px; color: var(--green); }
.qz-left.low { color: var(--red); }
.qz-q { font-size: 19px; line-height: 1.5; margin: 10px 0 16px; text-align: center; }
.qz-opts { display: grid; gap: 10px; }
.qz-opt { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 14px; border-radius: 14px; background: var(--card); border: 1.5px solid var(--line); font-size: 15.5px; font-weight: 600; color: var(--text); transition: transform .1s; }
.qz-opt:active:not(:disabled) { transform: scale(.98); }
.qz-l { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--card2); font-size: 13.5px; flex: none; }
.qz-opt.picked { border-color: var(--green); background: var(--greenDim); }
.qz-opt.picked .qz-l, .qz-opt.right .qz-l { background: var(--green); color: var(--onGreen); }
.qz-opt.right { border-color: var(--green); background: var(--greenDim); }
.qz-opt.wrong { border-color: var(--red); background: rgba(255,77,94,.12); }
.qz-opt.wrong .qz-l { background: var(--red); color: #fff; }
.qz-opt.dim { opacity: .55; }
.qz-opt:disabled { cursor: default; }
.qz-verdict { margin: 14px 0; padding: 12px 14px; border-radius: 14px; display: flex; flex-direction: column; gap: 4px; font-size: 13.5px; }
.qz-verdict b { font-size: 16px; }
.qz-verdict.ok { background: var(--greenDim); color: var(--green); }
.qz-verdict.bad { background: rgba(255,77,94,.12); color: var(--red); }
.qz-verdict span { color: var(--text); }
.qz-result { padding: 22px 18px; text-align: center; }
.qz-big { font-size: 52px; }
.qz-result h2 { font-size: 19px; margin: 6px 0; }
.qz-score { font-family: Inter, sans-serif; font-size: 54px; font-weight: 800; color: var(--green); line-height: 1.1; }
.qz-score small { font-size: 24px; color: var(--muted); }
.qz-actions { display: grid; gap: 10px; margin-top: 16px; }
.qz-note { text-align: center; font-size: 12px; }
.qz-next { margin: 4px 0 12px; height: 52px; font-size: 16px; animation: qzIn .3s ease both; scroll-margin-bottom: 16px; }
@media (max-width: 380px), (max-height: 700px) {
  .qz-q { font-size: 17px; margin: 6px 0 12px; }
  .qz-opt { padding: 11px 12px; font-size: 15px; }
  .qz-opts { gap: 8px; }
  .qz-l { width: 26px; height: 26px; }
  .qz-verdict { margin: 10px 0; padding: 10px 12px; }
}
/* খেলা চলাকালীন: নিচের মেনু সরে যায়, পুরো জায়গা কুইজের */
.quiz-focus .nav { transform: translate(-50%, 130%); opacity: 0; pointer-events: none; }
.quiz-focus .app { padding-bottom: 24px; }
.qz-top { align-items: center; gap: 10px; }
.qz-dots { flex: 1; display: flex; gap: 5px; justify-content: center; }
.qz-dots i { width: 9px; height: 9px; border-radius: 50%; background: var(--card2); border: 1.5px solid var(--line); transition: background .3s, transform .3s; }
.qz-dots i.cur { border-color: var(--green); transform: scale(1.25); }
.qz-dots i.ok { background: var(--green); border-color: var(--green); }
.qz-dots i.bad { background: var(--red); border-color: var(--red); }
.qz-dots i.miss { background: var(--muted); border-color: var(--muted); }
.qz-sub { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--muted); font-weight: 600; margin-top: 8px; }
.confetti { position: fixed; inset: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 80; }
.qz-x { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--card2); color: var(--muted); font-size: 14px; font-weight: 700; flex: none; }
.qz-review { margin-top: 14px; padding: 12px 14px; }
.qz-review summary { font-weight: 700; cursor: pointer; }
.qz-rv { padding: 10px 0; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 3px; font-size: 13.5px; }
.qz-rv:first-of-type { margin-top: 10px; }
.qz-rv .ok { color: var(--green); }
.qz-rv .bad { color: var(--red); }
.lb-filter { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px 12px; padding: 2px 16px; }
.lb-filter::-webkit-scrollbar { display: none; }
.lb-filter .chip { flex: none; display: inline-flex; align-items: center; gap: 6px; }
.pick-out { text-align: center; font-size: 13.5px; font-weight: 600; color: var(--green); padding: 0 12px 12px; }
.pick-done { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; background: var(--greenDim); }
.pick-done span:last-child { display: flex; flex-direction: column; gap: 2px; }
.pick-done small { font-size: 12.5px; }
.pick-ok { width: 34px; height: 34px; border-radius: 50%; background: var(--green); color: var(--onGreen); display: grid; place-items: center; font-weight: 800; font-size: 17px; flex: none; }
.pick-undo { display: block; margin: 10px auto 0; font-size: 13px; color: var(--muted); }
.pick-side { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 0; }
.pick-side small { font-size: 12px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stepper { gap: 12px; }
.stepper button { width: 34px; height: 34px; border-radius: 50%; border: 0; background: var(--card2); font-size: 18px; font-weight: 600; color: var(--text); }
.stepper button:disabled { opacity: .35; }
.stepper .v { font-size: 28px; min-width: 30px; }

/* ── খেলোয়াড় ── */
button.sq { width: 100%; text-align: left; }
.sq-go { font-style: normal; margin-left: 8px; color: var(--muted); }
.pl-name { text-align: left; }
.pl-name b:hover { text-decoration: underline; }
button.scr { width: 100%; }
.pl-avatar { width: 84px; height: 84px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(150deg, #0a3d2f, #064e3b 60%, #08261f);
  color: #7dffb8; font-family: Inter, sans-serif; font-weight: 800; font-size: 32px; box-shadow: 0 0 0 3px var(--greenDim); }
.pl-photo-wrap { position: relative; width: 112px; height: 112px; }
.pl-photo { width: 112px; height: 112px; border-radius: 50%; object-fit: cover; object-position: 50% 15%; background: var(--card2); box-shadow: 0 0 0 3px var(--greenDim); }
.pl-shirt { position: absolute; right: -2px; bottom: 2px; min-width: 32px; height: 32px; padding: 0 6px; border-radius: 16px; display: grid; place-items: center;
  background: var(--brand); color: #7dffb8; font-family: Inter, sans-serif; font-weight: 800; font-size: 14px; box-shadow: 0 0 0 3px var(--bg); }
.pl-credit { text-align: center; font-size: 10.5px; margin-top: 6px; }
.pl-credit a { color: var(--muted); text-decoration: none; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 4px; padding: 16px 8px; text-align: center; }
.stat-grid b { display: block; font-size: 19px; font-family: Inter, "Hind Siliguri", sans-serif; }
.stat-grid span { font-size: 11.5px; color: var(--muted); line-height: 1.3; display: block; margin-top: 2px; }

/* ── জিজ্ঞেস-বক্সে খেলোয়াড় ── */
.ask-pl { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; text-align: left; }
.ask-pl-n { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.ask-pl-n b { font-size: 14px; font-family: Inter, "Hind Siliguri", sans-serif; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ask-pl-n small { font-size: 11.5px; }
.ask-pl-g { font-family: Inter, sans-serif; font-weight: 800; font-size: 17px; color: var(--green); display: flex; flex-direction: column; align-items: center; line-height: 1.1; }
.ask-pl-g small { font-size: 10px; font-weight: 500; color: var(--muted); font-family: "Hind Siliguri", sans-serif; }

/* ── সার্চ ── */
.pill-btn.round { width: 32px; padding: 0; border-radius: 50%; }
.search-ov { position: fixed; inset: 0; z-index: 45; background: var(--bg); display: flex; flex-direction: column; animation: fade .15s; }
.search-top { display: flex; align-items: center; gap: 10px; padding: 12px 16px; max-width: 760px; width: 100%; margin: 0 auto; }
.search-box { flex: 1; display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; border-radius: 22px; background: var(--card); color: var(--muted); }
.search-box input { flex: 1; min-width: 0; border: 0; outline: none; background: none; font-size: 15.5px; color: var(--text); }
.search-x { font-size: 22px; line-height: 1; color: var(--muted); padding: 0 4px; }
.search-body { flex: 1; overflow-y: auto; padding: 0 16px 40px; max-width: 760px; width: 100%; margin: 0 auto; }
.s-recent-h { display: flex; justify-content: space-between; align-items: center; }
.s-recent-h button { font-size: 12.5px; font-weight: 600; color: var(--green); }
.s-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 14px; text-align: left; }
.s-row:active, .s-row:hover { background: var(--card2); }
.s-row b { font-size: 15px; font-weight: 600; }
.s-ic { width: 30px; height: 30px; border-radius: 50%; background: #fff; display: grid; place-items: center; flex: none; }
.s-ic:empty::after { content: attr(data-c); font-family: Inter, sans-serif; font-weight: 800; font-size: 9.5px; color: #064e3b; }
.s-txt { display: flex; flex-direction: column; min-width: 0; }
.s-txt b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: Inter, "Hind Siliguri", sans-serif; }
.s-txt small { font-size: 12px; }

/* ── লিগের তালিকা ── */
.lg-list { display: grid; gap: 10px; }
.lg-card { display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px; text-align: left; background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
.lg-card:active { background: var(--card2); }
.lg-ic { width: 48px; height: 48px; flex: none; border-radius: 50%; background: #fff; display: grid; place-items: center; box-shadow: 0 0 0 1px var(--line); }
.lg-ic:empty::after { content: attr(data-c); font-family: Inter, sans-serif; font-weight: 800; font-size: 13px; color: #064e3b; }
.lg-nm { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.lg-nm b { font-size: 15.5px; }
.lg-nm small { font-size: 12px; }

/* ── নিচের ন্যাভ: ভাসমান, কোণা গোল ── */
.nav { left: 50%; right: auto; bottom: calc(10px + env(safe-area-inset-bottom)); transform: translateX(-50%); width: calc(100% - 24px); max-width: 496px;
  border: 1px solid var(--line); border-radius: 24px; padding-bottom: 0; box-shadow: var(--shadow);
  background: color-mix(in srgb, var(--card) 92%, transparent); backdrop-filter: blur(14px); }
.nav-in { padding: 2px 6px; }
.nav button { border-radius: 18px; }
/* মাঝখানের উঁচু গোল "জিজ্ঞেস করুন" বাটন */
.nav button.nav-ask { position: relative; padding-top: 32px; color: var(--muted); white-space: nowrap; font-size: 11px; }
.nav button.nav-ask.on { color: var(--green); }
.ask-orb { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 50%; color: #fff;
  background: radial-gradient(circle at 30% 25%, #7dffb8 0%, #00b36b 38%, #064e3b 100%);
  box-shadow: 0 6px 18px rgba(0,160,90,.35), 0 0 0 4px var(--card); }
.ask-orb svg { width: 26px; height: 26px; }
.nav-ask .ask-orb { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); }
.nav-ask.on .ask-orb { box-shadow: 0 6px 18px rgba(0,160,90,.5), 0 0 0 4px var(--card), 0 0 0 6px var(--green); }
.ask-orb.sm { width: 32px; height: 32px; box-shadow: none; }
.ask-orb.sm svg { width: 17px; height: 17px; }
/* জিজ্ঞেস-পাতা: লেখার ঘর নিচের ন্যাভের ঠিক ওপরে আটকে থাকে */
.ask-page { margin: 0 16px; min-height: calc(100vh - 170px); min-height: calc(100dvh - 170px); display: flex; flex-direction: column; }
.ask-page .ask-head { padding: 16px 0 12px; border-bottom: 0; font-size: 18px; gap: 10px; }
.ask-page .ask-body { overflow: visible; flex: 1; }
.ask-page .ask-input { position: sticky; bottom: calc(92px + env(safe-area-inset-bottom)); background: var(--bg); padding: 10px 0; border-top: 0; transition: bottom .25s ease; }
.nav { transition: transform .25s ease, opacity .2s ease; }
.kb-open .nav { transform: translate(-50%, 130%); opacity: 0; pointer-events: none; }
.kb-open .ask-page .ask-input { bottom: 0; }
.kb-open .app { padding-bottom: 0; }
.toast { bottom: calc(100px + env(safe-area-inset-bottom)); }

/* ══════ ডেস্কটপ (১০২৪px বা তার বেশি চওড়া স্ক্রিন) ══════ */
.dnav { display: none; }
@media (min-width: 1024px) {
  .app { max-width: 1280px; padding: 0 28px 40px; }
  .top { padding: 14px 0; gap: 18px; }
  .nav { display: none; }
  .dnav { display: flex; gap: 4px; margin-left: 18px; }
  .dnav button { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border-radius: 19px; font-size: 14.5px; font-weight: 600; color: var(--muted); }
  .dnav button svg { width: 18px; height: 18px; }
  .dnav button:hover { color: var(--text); background: var(--card); }
  .dnav button.on { color: var(--green); background: var(--greenDim); }

  .sec { margin-left: 0; margin-right: 0; }
  .strip, .chips { padding-left: 0; padding-right: 0; }
  .strip { scrollbar-width: thin; padding-bottom: 8px; }
  .strip::-webkit-scrollbar { display: block; height: 6px; }
  .strip::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }
  .day, .chip, .row, .comp-h, .league-tile, .fl-row, .tbl, .slim { transition: background .12s, border-color .12s; }
  .day:hover, .chip:hover { border-color: color-mix(in srgb, var(--green) 50%, transparent); }
  .row:hover, .comp-h:hover, .fl-row:hover { background: var(--card2); }
  .league-strip { margin: 0; padding: 0; flex-wrap: wrap; }

  .follow { max-width: 760px; }
  .lg-list { grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .lg-card:hover { background: var(--card2); border-color: color-mix(in srgb, var(--green) 40%, transparent); }

  /* ম্যাচ পাতা: লিগগুলো দুই কলামে */
  .v-matches .groups { columns: 2; column-gap: 16px; }
  .v-matches .groups > .card { display: inline-block; width: 100%; break-inside: avoid; }

  /* লিগ, দল, প্রেডিকশন, প্রোফাইল: মাঝখানে পড়ার মতো চওড়া */
  .main.narrow { max-width: 820px; margin: 0 auto; }
  .page-head, .team-hero { padding-left: 0; padding-right: 0; }

  .foot-cols { grid-template-columns: repeat(3, 1fr); }
  .contact-cards, .contact-topics { grid-template-columns: 1fr 1fr; }
  .foot { border-radius: 22px 22px 0 0; }
  /* পরিচিতি তিন কলামে */
  .about-wrap { display: grid; grid-template-columns: 1fr 1.4fr 1fr; gap: 32px; margin-top: 44px; }
  .about-blk p.clamp { -webkit-line-clamp: 4; }

  /* ম্যাচের বিস্তারিত আর জিজ্ঞেস-বক্স: নিচ থেকে নয়, মাঝখানে পপআপ */
  .veil { align-items: center; padding: 24px; }
  .sheet { max-width: 560px; max-height: 88vh; border-radius: 22px; padding-bottom: 20px; box-shadow: var(--shadow); animation: fade .15s; }
  .sheet .grab { display: none; }
  .sheet.ask { height: 78vh; }
  .nav { display: none; }
  .ask-page { max-width: 760px; margin: 0 auto; min-height: calc(100vh - 140px); }
  .ask-page .ask-input { bottom: 0; padding-bottom: 24px; }
  .toast { bottom: 32px; }
}
/* ভক্তদের রায় */
.fv { margin-top: 14px; padding: 14px 14px 12px; border-radius: 18px; border: 1px solid var(--line);
  background: radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--green) 12%, transparent), transparent 60%),
              radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--amber) 12%, transparent), transparent 60%), var(--card); }
.fv-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.fv-h h3 { font-size: 16px; font-weight: 800; margin: 0 0 2px; }
.fv-h small { font-size: 12.5px; }
.fv-state { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; padding: 4px 10px; border-radius: 999px; background: var(--card2); color: var(--muted); white-space: nowrap; }
.fv-state.on { background: var(--greenDim); color: var(--green); }
.fv-state i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: fvpulse 1.6s infinite; }
@keyframes fvpulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
.fv-opts { display: grid; grid-template-columns: 1fr .72fr 1fr; gap: 8px; }
.fv-opt { position: relative; display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 6px 10px; border-radius: 14px;
  border: 1.5px solid var(--line); background: var(--bg); color: var(--text); transition: transform .15s, border-color .2s, background .2s, box-shadow .2s; min-width: 0; }
.fv-opt:not(:disabled):hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--fvc) 55%, transparent); }
.fv-opt:not(:disabled):active { transform: scale(.97); }
.fv-opt:disabled { cursor: default; }
.fv-opt.k0 { --fvc: var(--green); } .fv-opt.k1 { --fvc: #8b97a6; } .fv-opt.k2 { --fvc: var(--amber); }
.fv-opt.lead { background: color-mix(in srgb, var(--fvc) 9%, var(--bg)); }
.fv-opt.mine { border-color: var(--fvc); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fvc) 22%, transparent); }
.fv-opt.won::after { content: "✓"; position: absolute; top: 6px; right: 8px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 900; background: var(--fvc); color: #fff; }
.fv-ic { height: 34px; display: grid; place-items: center; }
.fv-x { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--card2); color: var(--muted); font-weight: 800; font-size: 17px; }
.fv-nm { font-size: 12.5px; font-weight: 600; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fv-pc { font-size: 21px; font-weight: 800; color: var(--fvc); font-family: Inter, "Hind Siliguri", sans-serif; line-height: 1.1; }
.fv-me { font-size: 10.5px; font-weight: 700; color: var(--fvc); }
.fv-bar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; margin-top: 12px; background: var(--card2); gap: 2px; }
.fv-bar span { height: 100%; transition: width .8s cubic-bezier(.2, .8, .2, 1); }
.fv-bar span:first-child { border-radius: 999px 0 0 999px; } .fv-bar span:last-child { border-radius: 0 999px 999px 0; }
.fv-bar .k0 { background: linear-gradient(90deg, var(--green), color-mix(in srgb, var(--green) 75%, #fff)); }
.fv-bar .k1 { background: #8b97a6; }
.fv-bar .k2 { background: linear-gradient(90deg, color-mix(in srgb, var(--amber) 75%, #fff), var(--amber)); }
.fv-bar.empty span { opacity: .18; }
.fv-hint { font-size: 12px; text-align: center; margin-top: 10px; }
.fv-verdict { margin-top: 10px; font-size: 13px; font-weight: 600; text-align: center; padding: 8px 10px; border-radius: 10px; background: color-mix(in srgb, var(--amber) 14%, transparent); }
.fv-verdict.ok { background: var(--greenDim); color: var(--green); }

/* দৈনিক চ্যালেঞ্জ */
.qz-sub-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; margin: -4px 0 14px; border-radius: 14px; background: var(--card2); }
.qz-sub-tabs button { display: flex; align-items: center; justify-content: center; gap: 6px; height: 38px; border-radius: 11px; font-size: 13.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.qz-sub-tabs button.on { background: var(--card); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.qz-sub-tabs button.on svg { color: var(--green); }
@media (max-width: 360px) { .qz-sub-tabs button svg { display: none; } }
.dl-hero { padding: 18px 16px 16px; background: radial-gradient(130% 100% at 0% 0%, color-mix(in srgb, var(--green) 16%, transparent), transparent 60%), radial-gradient(120% 90% at 100% 0%, color-mix(in srgb, var(--amber) 12%, transparent), transparent 60%), var(--card); }
.dl-hero h2 { font-size: 21px; margin: 0; }
.dl-hero-top { display: flex; align-items: center; gap: 12px; }
.dl-hero-ic { width: 54px; height: 54px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(145deg, var(--green), color-mix(in srgb, var(--green) 60%, #000)); color: #fff; flex: none; box-shadow: 0 8px 22px color-mix(in srgb, var(--green) 35%, transparent); }
.card.dl-hero > .dl-hero-ic { margin: 0 auto 10px; }
.card.dl-hero > h2, .card.dl-hero > p { text-align: center; }
.dl-chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 12px; }
.dl-chips span { font-size: 12.5px; font-weight: 600; padding: 5px 11px; border-radius: 999px; background: var(--card2); color: var(--text); }
.dl-streak { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, #f97316 12%, transparent); color: #ea580c; margin-bottom: 12px; }
.dl-streak span { display: flex; flex-direction: column; line-height: 1.35; }
.dl-streak b { font-size: 15px; } .dl-streak small { font-size: 12.5px; color: var(--muted); }
.dl-go { height: 52px; font-size: 16.5px; }
.dl-meta { font-size: 12.5px; text-align: center; margin-top: 10px; }
.dl-rules { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--line); }
.dl-rules div { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2px; }
.dl-rules b { font-size: 16px; color: var(--green); font-family: Inter, "Hind Siliguri", sans-serif; }
.dl-rules span { font-size: 11px; color: var(--muted); line-height: 1.35; }
.dl-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: var(--green); }
.dl-play .qz-top { gap: 10px; }
.dl-done { padding: 18px 16px; text-align: center; background: radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--green) 16%, transparent), transparent 65%), var(--card); }
.dl-done-h { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--green); }
.dl-score { font-size: 64px; font-weight: 800; line-height: 1; margin: 12px 0 10px; font-family: Inter, "Hind Siliguri", sans-serif; }
.dl-score small { font-size: 28px; color: var(--muted); font-weight: 700; }
.dl-marks { display: flex; justify-content: center; gap: 8px; margin-bottom: 14px; }
.dl-marks span { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; color: #fff; font-weight: 900; font-size: 17px; animation: qzIn .35s ease both; }
.dl-marks span:nth-child(2) { animation-delay: .08s; } .dl-marks span:nth-child(3) { animation-delay: .16s; } .dl-marks span:nth-child(4) { animation-delay: .24s; } .dl-marks span:nth-child(5) { animation-delay: .32s; }
.dl-marks .ok { background: #16a34a; } .dl-marks .bad { background: var(--red); }
.dl-pts { font-size: 17px; font-weight: 600; } .dl-pts b { font-size: 30px; color: var(--green); font-family: Inter, "Hind Siliguri", sans-serif; }
.dl-break { font-size: 12.5px; margin-top: 2px; }
.dl-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 16px 0 14px; }
.dl-stats div, .pb-stats div { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 4px; border-radius: 14px; background: var(--bg); color: var(--muted); }
.dl-stats b, .pb-stats b { font-size: 19px; color: var(--text); font-family: Inter, "Hind Siliguri", sans-serif; }
.dl-stats small, .pb-stats small { font-size: 11.5px; }
.fl { color: #f97316; }
.dl-share { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 48px; }
.dl-next { font-size: 13px; color: var(--muted); margin-top: 12px; } .dl-next b { color: var(--text); font-family: Inter, "Hind Siliguri", sans-serif; letter-spacing: .5px; }
.dl-week { padding-bottom: 6px; }
.dl-range { font-size: 12px; padding: 0 16px 6px; }
.dl-row { border-bottom: 1px solid var(--line); }
.dl-row:last-child { border-bottom: 0; }
.bdg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 4px; padding: 10px; }
.bdg-cell { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3px; padding: 10px 4px; border-radius: 14px; }
.bdg-cell b { font-size: 12.5px; line-height: 1.3; }
.bdg-cell small { font-size: 10.5px; color: var(--muted); line-height: 1.35; }
.bdg-cell:not(.off) small { color: var(--green); font-weight: 700; }
.bdg-cell.off b { color: var(--muted); }
.bdg { filter: drop-shadow(0 4px 8px rgba(0,0,0,.15)); }
.bdg.locked { filter: none; opacity: .7; }
.bdg-grid.compact { grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); }
.pb-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 12px 12px 0; }
.bdg-veil { align-items: center; justify-content: center; padding: 24px; z-index: 90; }
.bdg-pop { width: 100%; max-width: 340px; background: var(--card); border-radius: 24px; padding: 22px 20px 18px; text-align: center; animation: bdgIn .45s cubic-bezier(.2, 1.4, .4, 1) both; }
.bdg-pop > small { font-size: 13px; font-weight: 800; color: var(--amber); letter-spacing: .3px; }
.bdg-pop-row { display: flex; justify-content: center; gap: 8px; margin: 10px 0 6px; }
.bdg-pop-row svg { animation: bdgSpin .9s ease both; }
.bdg-pop-t { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; } .bdg-pop-t b { font-size: 18px; } .bdg-pop-t span { font-size: 13px; }
@keyframes bdgIn { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: none; } }
@keyframes bdgSpin { from { transform: rotateY(90deg) scale(.6); } to { transform: none; } }
.dl-teaser-wrap { margin-top: 10px; }
.dl-teaser { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 12px 14px; border-radius: 16px; border: 1.5px solid var(--line); color: var(--text);
  background: linear-gradient(110deg, color-mix(in srgb, var(--green) 14%, var(--card)), var(--card) 70%); }
.dl-teaser.glow { border-color: color-mix(in srgb, var(--green) 55%, transparent); animation: dlGlow 2.6s ease-in-out infinite; }
@keyframes dlGlow { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--green) 0%, transparent); } 50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--green) 16%, transparent); } }
.dl-teaser.done { background: var(--card); }
.dl-t-ic { width: 40px; height: 40px; flex: none; border-radius: 12px; display: grid; place-items: center; background: var(--green); color: var(--onGreen); }
.dl-teaser.done .dl-t-ic { background: var(--greenDim); color: var(--green); }
.dl-t-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; }
.dl-t-txt b { font-size: 15px; } .dl-t-txt small { font-size: 12.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dl-t-streak { display: inline-flex; align-items: center; gap: 3px; font-weight: 800; font-size: 14px; color: #f97316; font-family: Inter, "Hind Siliguri", sans-serif; }
.dl-t-go { flex: none; height: 34px; padding: 0 14px; border-radius: 17px; background: var(--green); color: var(--onGreen); font-weight: 700; font-size: 13.5px; display: grid; place-items: center; }
.dl-teaser.side { padding: 14px; }
.dl-teaser { position: relative; cursor: pointer; padding-right: 40px; }
.dl-t-x { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: var(--muted); background: transparent; }
.dl-t-x:hover, .dl-t-x:focus-visible { background: var(--card2); color: var(--text); }

/* হোম: বড় স্ক্রিনে ম্যাচ বাঁ পাশে, কাজের তথ্য ডান পাশে */
@media (min-width: 1100px) {
  .home-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start; }
  .home-grid .groups { columns: 1 !important; }
  .home-side { display: flex; flex-direction: column; gap: 16px; padding-top: 18px; }
  .side-card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px 14px 10px; text-align: left; color: var(--text); }
  .side-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .side-h h3, .side-quiz h3 { font-size: 15.5px; font-weight: 700; margin: 0; }
  .side-h .link { font-size: 13px; }
  .side-sub { font-size: 12.5px; margin: 8px 2px 4px; }
  .side-empty { font-size: 13px; padding: 14px 2px; }
  .side-lgs { display: flex; gap: 6px; }
  .side-lgs button { flex: 1; height: 34px; border-radius: 10px; border: 1px solid var(--line); display: grid; place-items: center; background: var(--bg); }
  .side-lgs button:hover { border-color: color-mix(in srgb, var(--green) 50%, transparent); }
  .side-lgs button.on { border-color: var(--green); background: var(--greenDim); }
  .side-lgs img { background: #fff; border-radius: 5px; padding: 2px; box-sizing: content-box; }
  .mt { display: flex; flex-direction: column; }
  .mt-row, .sc-row { display: grid; align-items: center; gap: 8px; padding: 7px 4px; border-radius: 8px; font-size: 13.5px; text-align: left; color: var(--text); width: 100%; }
  .mt-row { grid-template-columns: 20px minmax(0, 1fr) 24px 34px 30px; }
  .mt-row > span:nth-child(n+3) { text-align: right; }
  .mt-h { font-size: 11.5px; padding-top: 2px; padding-bottom: 4px; }
  .sc-row { grid-template-columns: 22px minmax(0, 1fr) auto; }
  button.mt-row:hover, button.sc-row:hover { background: var(--card2); }
  .mt-tm { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .mt-tm b, .sc-nm b { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sc-nm { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
  .sc-nm small { font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mt-pts { font-weight: 700; text-align: right; }
  .rk-b { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: var(--card2); color: var(--muted); }
  .rk-b.r1 { background: #f5c542; color: #3a2a00; } .rk-b.r2 { background: #cfd6dd; color: #2a3138; } .rk-b.r3 { background: #e0a46e; color: #3a2210; }
  .side-quiz { display: flex; gap: 12px; padding: 16px; background: linear-gradient(135deg, var(--greenDim), var(--card) 70%); }
  .sq-ic { width: 40px; height: 40px; flex: none; border-radius: 12px; display: grid; place-items: center; background: var(--green); color: var(--onGreen); }
  .side-quiz p { font-size: 13px; margin: 4px 0 10px; line-height: 1.5; }
  .side-quiz .btn { height: 36px; padding: 0 16px; font-size: 13.5px; }
  .side-ask { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; cursor: pointer; }
  .side-ask:hover { border-color: color-mix(in srgb, var(--green) 45%, transparent); }
  .side-ask .muted { font-size: 12.5px; line-height: 1.5; }
  .side-go { color: var(--green); font-weight: 600; font-size: 13.5px; margin-top: 4px; }
}
@media (min-width: 1280px) { .home-grid .groups { columns: 2 !important; } }
/* লিগ আর দলের পাতা: মাঝারি ডেস্কটপে মাঝখানে পড়ার মতো চওড়া, বড় স্ক্রিনে দুই কলাম */
@media (min-width: 1024px) and (max-width: 1099px) { .main.v-league, .main.v-team, .main.v-player, .main.v-predict, .main.v-daily { max-width: 820px; margin: 0 auto; } }
@media (min-width: 1100px) {
  .pg-grid { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 28px; align-items: start; }
  .pg-side .sec:first-child, .pg-main .sec:first-child { margin-top: 18px; }
  .pd-top { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 28px; align-items: center; }
  .pd-top > * { margin: 0 !important; }
  .team-hero.row + .pl-credit { text-align: left; margin-left: 0; }
  .lb .rk { display: grid; place-items: center; }
  .v-league .tbl { padding-top: 11px; padding-bottom: 11px; }
  .team-hero.row { flex-direction: row; justify-content: flex-start; flex-wrap: wrap; gap: 14px 22px; text-align: left; padding-top: 4px; }
  .team-hero.row .th-name { display: flex; flex-direction: column; }
  .team-hero.row .th-name h1 { margin: 0; }
  .team-hero.row .fav-btn { margin: 0 0 0 auto; }
  .team-hero.row .team-pos { flex-basis: 100%; justify-content: flex-start; margin-top: 0; }
}
`;
if (typeof document !== "undefined" && !document.getElementById("kk-css")) {
  const st = document.createElement("style");
  st.id = "kk-css";
  st.textContent = CSS;
  document.head.appendChild(st);
}

// ════════════════ lib/i18n.js ════════════════
const S = {
  home: ["হোম", "Home"],
  matches: ["ম্যাচ", "Matches"],
  leagues: ["লিগ", "Leagues"],
  ask: ["জিজ্ঞেস করুন", "Ask"],
  myTeamGames: ["আপনার দলের খেলা", "Your teams"],
  following: ["প্রিয় দলের খেলা", "Following"],
  predict: ["গেম", "Games"],
  profile: ["প্রোফাইল", "Profile"],
  nextMatch: ["পরের খেলা", "Next match"],
  yourTeams: ["আপনার দলের সামনের ম্যাচ", "Your teams — upcoming"],
  rivalWatch: ["রাইভালদের খবর", "Rival watch"],
  todayBig: ["আজকের খেলা", "Today's matches"],
  seeAll: ["সব দেখুন", "See all"],
  noMatchDay: ["এই দিনে কোনো ম্যাচ নেই", "No matches on this day"],
  all: ["সব", "All"],
  live: ["লাইভ", "LIVE"],
  ht: ["বিরতি", "HT"],
  ft: ["শেষ", "FT"],
  postponed: ["স্থগিত", "Postponed"],
  cancelled: ["বাতিল", "Cancelled"],
  vs: ["বনাম", "vs"],
  bdTime: ["বাংলাদেশ সময়", "Bangladesh time"],
  startsIn: ["শুরু হতে বাকি", "Starts in"],
  share: ["শেয়ার", "Share"],
  copied: ["কপি হয়েছে", "Copied"],
  yourPick: ["আপনার প্রেডিকশন", "Your prediction"],
  save: ["সেভ করুন", "Save"],
  saved: ["সেভ হয়েছে", "Saved"],
  locked: ["কিকঅফের পর প্রেডিকশন বন্ধ", "Predictions close at kickoff"],
  loginToPredict: ["প্রেডিকশন দিতে লগইন করুন", "Log in to predict"],
  myPredictions: ["আমার প্রেডিকশন", "My predictions"],
  leaderboard: ["লিডারবোর্ড", "Leaderboard"],
  rules: ["হুবহু স্কোর মিললে ৩ পয়েন্ট, শুধু ফল (জয়/ড্র/হার) মিললে ১ পয়েন্ট। ম্যাচ শেষ হওয়ার পরের হালনাগাদে পয়েন্ট যোগ হয়।", "Exact score = 3 pts, correct result = 1 pt. Points are added at the next update after the match."],
  noPredictions: ["এখনো কোনো প্রেডিকশন দেননি। যেকোনো ম্যাচে ট্যাপ করে শুরু করুন।", "No predictions yet. Tap any match to start."],
  noLeaders: ["এখনো কারও পয়েন্ট হয়নি", "No points yet"],
  pts: ["পয়েন্ট", "pts"],
  pending: ["অপেক্ষায়", "Pending"],
  upcomingToPredict: ["প্রেডিকশন দিন", "Make your picks"],
  login: ["লগইন", "Log in"],
  signup: ["রেজিস্ট্রেশন", "Sign up"],
  logout: ["লগআউট", "Log out"],
  name: ["নাম", "Name"],
  email: ["ইমেইল", "Email"],
  phone: ["মোবাইল নম্বর", "Mobile number"],
  password: ["পাসওয়ার্ড", "Password"],
  google: ["Google দিয়ে চালিয়ে যান", "Continue with Google"],
  or: ["অথবা", "or"],
  checkEmail: ["ইমেইলে একটা লিংক পাঠানো হয়েছে। সেটায় ক্লিক করে অ্যাকাউন্ট চালু করুন।", "We emailed you a link. Click it to activate your account."],
  pickFav: ["প্রিয় দল বেছে নিন", "Pick your favourite teams"],
  pickFavSub: ["সর্বোচ্চ ৩টা — এদের খেলা ম্যাচ পাতার একদম উপরে দেখাবে", "Up to 3 — their matches show at the top of Matches"],
  pickRival: ["রাইভাল দল বেছে নিন", "Pick your rivals"],
  pickRivalSub: ["সর্বোচ্চ ৫টা — এদের ফলও নজরে রাখবে", "Up to 5 — keep an eye on them too"],
  phoneNeeded: ["আপনার মোবাইল নম্বর দিন", "Add your mobile number"],
  phoneWhy: ["না দিলেও সব ফিচার চলবে। নম্বর অন্য কেউ দেখতে পায় না।", "Everything works without it. Nobody else can see your number."],
  optional: ["ঐচ্ছিক", "optional"],
  search: ["দল খুঁজুন", "Search teams"],
  next: ["পরের ধাপ", "Next"],
  back: ["পেছনে", "Back"],
  done: ["শেষ", "Done"],
  skip: ["এখন না", "Skip"],
  myTeams: ["আমার দল", "My teams"],
  favs: ["প্রিয়", "Favourites"],
  rivals: ["রাইভাল", "Rivals"],
  edit: ["এডিট", "Edit"],
  settings: ["সেটিংস", "Settings"],
  language: ["ভাষা", "Language"],
  theme: ["থিম", "Theme"],
  dark: ["ডার্ক", "Dark"],
  light: ["লাইট", "Light"],
  ctaTitle: ["আপনার দলের খেলা কখন?", "When does your team play?"],
  ctaBody: ["প্রিয় দল বেছে নিন, তাদের পরের খেলা বাংলাদেশ সময়ে কাউন্টডাউনসহ ম্যাচ পাতার উপরে দেখাবে।", "Pick your teams and their next match shows at the top of Matches, in Bangladesh time."],
  ctaBtn: ["শুরু করুন", "Get started"],
  noUpcoming: ["সামনে কোনো ম্যাচের সূচি নেই", "No upcoming fixtures"],
  lastResult: ["শেষ ফল", "Last result"],
  next2: ["পরের ম্যাচ", "Next"],
  demo: ["ডেমো মোড — নমুনা ডেটা দেখানো হচ্ছে", "Demo mode — sample data"],
  error: ["কোথাও একটা সমস্যা হয়েছে", "Something went wrong"],
  loading: ["লোড হচ্ছে…", "Loading…"],
  matchday: ["রাউন্ড", "Matchday"],
};

const LangCtx = createContext("bn");
const useT = () => {
  const lang = useContext(LangCtx);
  const t = (k) => (S[k] ? S[k][lang === "bn" ? 0 : 1] : k);
  return { t, lang };
};

// ════════════════ lib/format.js ════════════════
// সময়, তারিখ আর সংখ্যা — সব বাংলাদেশ সময়ে (Asia/Dhaka)
const TZ = "Asia/Dhaka";
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
// দেশের নাম বাংলায় (না থাকলে ইংরেজিই)
const NAT_BN = {
  Spain: "স্পেন", France: "ফ্রান্স", Germany: "জার্মানি", Italy: "ইতালি", England: "ইংল্যান্ড", Portugal: "পর্তুগাল", Brazil: "ব্রাজিল", Argentina: "আর্জেন্টিনা",
  Netherlands: "নেদারল্যান্ডস", Belgium: "বেলজিয়াম", Croatia: "ক্রোয়েশিয়া", Uruguay: "উরুগুয়ে", Colombia: "কলম্বিয়া", Norway: "নরওয়ে", Denmark: "ডেনমার্ক",
  Sweden: "সুইডেন", Switzerland: "সুইজারল্যান্ড", Austria: "অস্ট্রিয়া", Poland: "পোল্যান্ড", Serbia: "সার্বিয়া", Scotland: "স্কটল্যান্ড", Wales: "ওয়েলস",
  Ireland: "আয়ারল্যান্ড", "Republic of Ireland": "আয়ারল্যান্ড", "Northern Ireland": "উত্তর আয়ারল্যান্ড", USA: "যুক্তরাষ্ট্র", "United States": "যুক্তরাষ্ট্র",
  Mexico: "মেক্সিকো", Canada: "কানাডা", Japan: "জাপান", "Korea Republic": "দক্ষিণ কোরিয়া", "South Korea": "দক্ষিণ কোরিয়া", Morocco: "মরক্কো", Egypt: "মিসর",
  Senegal: "সেনেগাল", Nigeria: "নাইজেরিয়া", Ghana: "ঘানা", Cameroon: "ক্যামেরুন", "Ivory Coast": "আইভরি কোস্ট", "Côte d'Ivoire": "আইভরি কোস্ট", Algeria: "আলজেরিয়া",
  Tunisia: "তিউনিসিয়া", Mali: "মালি", Turkey: "তুরস্ক", Türkiye: "তুরস্ক", Greece: "গ্রিস", Ukraine: "ইউক্রেন", Russia: "রাশিয়া", Czechia: "চেক প্রজাতন্ত্র",
  "Czech Republic": "চেক প্রজাতন্ত্র", Slovakia: "স্লোভাকিয়া", Slovenia: "স্লোভেনিয়া", Hungary: "হাঙ্গেরি", Romania: "রোমানিয়া", Georgia: "জর্জিয়া", Ecuador: "ইকুয়েডর",
  Chile: "চিলি", Paraguay: "প্যারাগুয়ে", Peru: "পেরু", Venezuela: "ভেনেজুয়েলা", Australia: "অস্ট্রেলিয়া", Iceland: "আইসল্যান্ড", Finland: "ফিনল্যান্ড",
  Albania: "আলবেনিয়া", Kosovo: "কসোভো", Bosnia: "বসনিয়া", "Bosnia and Herzegovina": "বসনিয়া", Armenia: "আর্মেনিয়া", Israel: "ইসরায়েল", Iran: "ইরান",
  "Saudi Arabia": "সৌদি আরব", Jamaica: "জ্যামাইকা", "Cape Verde Islands": "কেপ ভার্দে", Guinea: "গিনি", "DR Congo": "ডিআর কঙ্গো", "Congo DR": "ডিআর কঙ্গো", Gabon: "গ্যাবন",
};
const natName = (n, lang) => (lang === "bn" ? NAT_BN[n] || n : n);
// কোচদের নাম বাংলায়
const COACH_BN = {
  "José Mourinho": "জোসে মরিনিও", "Vincent Kompany": "ভিনসেন্ট কোম্পানি", "Mikel Arteta": "মিকেল আর্তেতা", "Pep Guardiola": "পেপ গার্দিওলা", "Josep Guardiola": "পেপ গার্দিওলা",
  "Arne Slot": "আর্নে স্লট", "Hans-Dieter Flick": "হান্সি ফ্লিক", "Hansi Flick": "হান্সি ফ্লিক", "Diego Simeone": "দিয়েগো সিমিওনে", "Carlo Ancelotti": "কার্লো আনচেলত্তি",
  "Xabi Alonso": "জাবি আলোনসো", "Luis Enrique": "লুইস এনরিকে", "Enzo Maresca": "এনজো মারেসকা", "Ruben Amorim": "রুবেন আমোরিম", "Rúben Amorim": "রুবেন আমোরিম",
  "Antonio Conte": "আন্তোনিও কন্তে", "Simone Inzaghi": "সিমোনে ইনজাঘি", "Cristian Chivu": "ক্রিস্তিয়ান চিভু", "Massimiliano Allegri": "মাসিমিলিয়ানো আলেগ্রি",
  "Thomas Frank": "টমাস ফ্রাঙ্ক", "Ange Postecoglou": "অ্যাঞ্জে পোস্তেকোগলু", "Eddie Howe": "এডি হাউ", "Unai Emery": "উনাই এমেরি", "Niko Kovač": "নিকো কোভাচ",
  "Roberto De Zerbi": "রবার্তো দে জের্বি", "Igor Tudor": "ইগর তুদর", "Gian Piero Gasperini": "জান পিয়েরো গাসপেরিনি", "Oliver Glasner": "অলিভার গ্লাসনার",
};
const BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BN_DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const BN_DAYS_SHORT = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const EN_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const num = (n, lang = "bn") =>
  lang === "bn" ? String(n).replace(/\d/g, (d) => BN_DIGITS[d]) : String(n);

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
  hour: "numeric", minute: "numeric", hourCycle: "h23", weekday: "short",
});
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// ঢাকার সময়ে তারিখের অংশগুলো
function dhaka(date) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(date)).map((x) => [x.type, x.value]));
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, wd: WD[p.weekday] };
}

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (date) => {
  const p = dhaka(date);
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
};

// "2026-11-20" + n দিন
const addDays = (key, n) => {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
};

// ঢাকার একটা দিনের শুরু ও শেষ (UTC ISO) — Supabase কোয়েরির জন্য
const dayRangeUTC = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0) - 6 * 3600000);
  return [start.toISOString(), new Date(start.getTime() + 86400000).toISOString()];
};

function period(h) {
  if (h < 4) return "রাত";
  if (h < 6) return "ভোর";
  if (h < 12) return "সকাল";
  if (h < 15) return "দুপুর";
  if (h < 18) return "বিকাল";
  if (h < 20) return "সন্ধ্যা";
  return "রাত";
}

// "রাত ১:৩০" / "1:30 AM"
function timeLabel(date, lang = "bn") {
  const { h, mi } = dhaka(date);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  if (lang === "bn") return `${period(h)} ${num(h12, "bn")}:${num(pad(mi), "bn")}`;
  return `${h12}:${pad(mi)} ${h < 12 ? "AM" : "PM"}`;
}

// "আজ" / "আগামীকাল" / "শুক্রবার, ২০ নভেম্বর"
function dayLabel(key, lang = "bn", { short = false, abs = false } = {}) {
  const today = dayKey(new Date());
  const rel = { [today]: ["আজ", "Today"], [addDays(today, 1)]: ["আগামীকাল", "Tomorrow"], [addDays(today, -1)]: ["গতকাল", "Yesterday"] }[key];
  if (rel && !short && !abs) return lang === "bn" ? rel[0] : rel[1];
  const [y, m, d] = key.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (lang === "bn") return `${(short ? BN_DAYS_SHORT : BN_DAYS)[wd]}, ${num(d, "bn")} ${BN_MONTHS[m - 1]}`;
  return `${(short ? EN_DAYS_SHORT : EN_DAYS)[wd]}, ${d} ${EN_MONTHS[m - 1]}`;
}

// তারিখ-স্ট্রিপের জন্য ছোট লেবেল
function stripLabel(key, lang = "bn") {
  const today = dayKey(new Date());
  const [y, m, d] = key.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const top = key === today ? (lang === "bn" ? "আজ" : "Today") : (lang === "bn" ? BN_DAYS_SHORT : EN_DAYS_SHORT)[wd];
  const bottom = lang === "bn" ? `${num(d, "bn")} ${BN_MONTHS[m - 1].slice(0, 3)}` : `${d} ${EN_MONTHS[m - 1]}`;
  return { top, bottom };
}

// "২ দিন ৫ ঘণ্টা" / "৪০ মিনিট"
function countdown(ms, lang = "bn") {
  if (ms <= 0) return lang === "bn" ? "শুরু হয়ে গেছে" : "Started";
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  const L = lang === "bn" ? { d: "দিন", h: "ঘণ্টা", m: "মিনিট" } : { d: "d", h: "h", m: "m" };
  const sep = lang === "bn" ? " " : "";
  const parts = d > 0 ? [[d, L.d], [h, L.h]] : h > 0 ? [[h, L.h], [mm, L.m]] : [[mm, L.m]];
  return parts.map(([v, u]) => `${num(v, lang)}${sep}${u}`).join(" ");
}

const LIVE = ["IN_PLAY", "PAUSED", "LIVE"];
const isLive = (m) => LIVE.includes(m.status);
const isDone = (m) => m.status === "FINISHED";
const isOff = (m) => ["POSTPONED", "CANCELLED", "SUSPENDED"].includes(m.status);
const canPredict = (m) => !isOff(m) && new Date(m.utc_date) > new Date();

// "শনিবার, ২১ নভেম্বর দিবাগত রাত ২:০০" — মাঝরাতের পরের খেলা আগের দিনের নামে
function whenText(date, lang = "bn", { abs = false } = {}) {
  const k = dayKey(date);
  const { h } = dhaka(date);
  if (lang === "bn" && h < 6) return `${dayLabel(addDays(k, -1), "bn", { abs })} দিবাগত ${timeLabel(date, "bn")}`;
  return `${dayLabel(k, lang, { abs })}, ${timeLabel(date, lang)}`;
}

// ════════════════ lib/card.js ════════════════
// ম্যাচের শেয়ার-কার্ড (১০৮০×১০৮০ ছবি) — ব্রাউজারেই আঁকা হয়, কোনো সার্ভার খরচ নেই
const CARD_W = 1080;
const CARD_FONT = "'Hind Siliguri', sans-serif";

function loadImg(src) {
  return new Promise((ok) => {
    if (!src) return ok(null);
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ok(null);
    img.src = src;
  });
}
const proxied = (crest) => (crest && crest.startsWith("https://crests.football-data.org/") ? `/api/extra?type=crest&u=${encodeURIComponent(crest)}` : null);

function fitText(ctx, text, maxW, size, weight = 700) {
  let s = size;
  do { ctx.font = `${weight} ${s}px ${CARD_FONT}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 20);
}

function clockLogo(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = "#064e3b"; ctx.fill();
  ctx.lineWidth = r * 0.08; ctx.strokeStyle = "#00e676"; ctx.stroke();
  ctx.lineCap = "round";
  const hand = (deg, len, w, c) => { const a = ((deg - 90) * Math.PI) / 180; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); };
  hand(0, r * 0.42, r * 0.13, "#fff"); hand(60, r * 0.55, r * 0.08, "#00e676");
  ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2); ctx.fillStyle = "#e11d48"; ctx.fill();
  ctx.restore();
}

function crestOrBadge(ctx, img, team, cx, cy, size) {
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, size / 2 + 26, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.fill();
  if (img) {
    const ratio = Math.min(size / img.width, size / img.height);
    const w = img.width * ratio, h = img.height * ratio;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = "#064e3b"; ctx.font = `800 ${size * 0.32}px Inter, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((team?.tla || team?.short_en || "?").slice(0, 3), cx, cy);
  }
  ctx.restore();
}

async function makeCard(m, { lang = "bn", teamName, compName }) {
  try { await Promise.all([document.fonts.load(`700 60px ${CARD_FONT}`, "খেলা"), document.fonts.load(`500 40px ${CARD_FONT}`, "খেলা")]); } catch { /* ignore */ }
  const [hImg, aImg] = await Promise.all([loadImg(proxied(m.home?.crest)), loadImg(proxied(m.away?.crest))]);
  const c = document.createElement("canvas");
  c.width = CARD_W; c.height = CARD_W;
  const ctx = c.getContext("2d");
  const bn = lang === "bn";

  // পটভূমি
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_W);
  g.addColorStop(0, "#0a3d2f"); g.addColorStop(0.5, "#064e3b"); g.addColorStop(1, "#06201a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CARD_W, CARD_W);
  const glow = ctx.createRadialGradient(CARD_W * 0.85, 0, 0, CARD_W * 0.85, 0, CARD_W * 0.8);
  glow.addColorStop(0, "rgba(0,230,118,0.30)"); glow.addColorStop(1, "rgba(0,230,118,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, CARD_W, CARD_W);

  // ওপরে ব্র্যান্ড আর প্রতিযোগিতা
  clockLogo(ctx, 110, 108, 44);
  ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#fff";
  ctx.font = `700 50px ${CARD_FONT}`; ctx.fillText("খেলা কখন", 172, 112);
  const bw = ctx.measureText("খেলা কখন").width;
  ctx.fillStyle = "#f59e0b"; ctx.fillText("?", 172 + bw + 4, 112);
  ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.8)"; fitText(ctx, compName, 440, 38, 600); ctx.fillText(compName, CARD_W - 70, 112);

  // দুই দল
  const cy = 400, cs = 190;
  crestOrBadge(ctx, hImg, m.home, 270, cy, cs);
  crestOrBadge(ctx, aImg, m.away, CARD_W - 270, cy, cs);
  ctx.textAlign = "center"; ctx.fillStyle = "#fff";
  const hn = teamName(m.home), an = teamName(m.away);
  fitText(ctx, hn, 400, 50); ctx.fillText(hn, 270, cy + 175);
  fitText(ctx, an, 400, 50); ctx.fillText(an, CARD_W - 270, cy + 175);

  const done = isDone(m) || isLive(m);
  if (done && m.home_score != null) {
    ctx.font = `800 96px Inter, sans-serif`; ctx.fillStyle = "#fff";
    ctx.fillText(`${m.home_score} - ${m.away_score}`, CARD_W / 2, cy);
    ctx.font = `600 36px ${CARD_FONT}`; ctx.fillStyle = "#7dffb8";
    ctx.fillText(isLive(m) ? (bn ? "লাইভ" : "LIVE") : (bn ? "খেলা শেষ" : "Full time"), CARD_W / 2, cy + 80);
  } else {
    ctx.font = `600 44px ${CARD_FONT}`; ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(bn ? "বনাম" : "vs", CARD_W / 2, cy);
  }

  // সময়ের বাক্স
  const bx = 90, by = 680, bw2 = CARD_W - 180, bh = 250;
  ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by, bw2, bh, 36); ctx.fill(); ctx.stroke();
  const { h } = dhaka(m.utc_date);
  const dayText = !done && bn && h < 6 ? whenText(m.utc_date, "bn", { abs: true }).replace(/ রাত .*$/, "") : dayLabel(dayKey(m.utc_date), lang, { abs: true });
  ctx.fillStyle = "rgba(255,255,255,0.85)"; fitText(ctx, dayText, bw2 - 80, 44, 600); ctx.fillText(dayText, CARD_W / 2, by + 62);
  ctx.fillStyle = "#00e676"; ctx.font = `700 100px ${CARD_FONT}`; ctx.fillText(timeLabel(m.utc_date, lang), CARD_W / 2, by + 150);
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `500 32px ${CARD_FONT}`; ctx.fillText(bn ? "বাংলাদেশ সময়" : "Bangladesh time", CARD_W / 2, by + 218);

  // নিচে ঠিকানা
  ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `600 34px Inter, sans-serif`;
  ctx.fillText("khelakokhon.com", CARD_W / 2, CARD_W - 62);

  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}

async function shareCard(m, opts, toast) {
  const blob = await makeCard(m, opts);
  if (!blob) throw new Error("card");
  const file = new File([blob], `khelakokhon-${m.id}.png`, { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: "khelakokhon.com" });
      return;
    }
  } catch (e) { if (e?.name === "AbortError") return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast?.(opts.lang === "bn" ? "ছবি ডাউনলোড হয়েছে" : "Image downloaded");
}

// ════════════════ lib/demo.js ════════════════
// ডেমো ডেটা — Supabase কী সেট করা না থাকলে (লোকাল টেস্ট বা প্রিভিউ) এটা দেখায়
const T = (id, short, tla, bn, league) => ({ id, name_en: short, short_en: short, tla, name_bn: bn, crest: `https://crests.football-data.org/${id}.png`, league });

const DEMO_COMPETITIONS = [
  { code: "CL", name_en: "Champions League", name_bn: "চ্যাম্পিয়ন্স লিগ", emblem: "https://crests.football-data.org/CL.png", sort: 1 },
  { code: "PL", name_en: "Premier League", name_bn: "প্রিমিয়ার লিগ", emblem: "https://crests.football-data.org/PL.png", sort: 2 },
  { code: "PD", name_en: "La Liga", name_bn: "লা লিগা", emblem: "https://crests.football-data.org/PD.png", sort: 3 },
  { code: "BL1", name_en: "Bundesliga", name_bn: "বুন্দেসলিগা", emblem: "https://crests.football-data.org/BL1.png", sort: 4 },
  { code: "SA", name_en: "Serie A", name_bn: "সিরি আ", emblem: "https://crests.football-data.org/SA.png", sort: 5 },
  { code: "FL1", name_en: "Ligue 1", name_bn: "লিগ ওয়ান", emblem: "https://crests.football-data.org/FL1.png", sort: 6 },
];

const DEMO_TEAMS = [
  T(57, "Arsenal", "ARS", "আর্সেনাল", "PL"), T(61, "Chelsea", "CHE", "চেলসি", "PL"), T(64, "Liverpool", "LIV", "লিভারপুল", "PL"),
  T(65, "Man City", "MCI", "ম্যানচেস্টার সিটি", "PL"), T(66, "Man United", "MUN", "ম্যানচেস্টার ইউনাইটেড", "PL"), T(73, "Tottenham", "TOT", "টটেনহ্যাম", "PL"),
  T(67, "Newcastle", "NEW", "নিউক্যাসল", "PL"), T(58, "Aston Villa", "AVL", "অ্যাস্টন ভিলা", "PL"),
  T(86, "Real Madrid", "RMA", "রিয়াল মাদ্রিদ", "PD"), T(81, "Barça", "FCB", "বার্সেলোনা", "PD"), T(78, "Atleti", "ATM", "অ্যাটলেটিকো মাদ্রিদ", "PD"), T(559, "Sevilla", "SEV", "সেভিয়া", "PD"),
  T(5, "Bayern", "FCB", "বায়ার্ন মিউনিখ", "BL1"), T(4, "Dortmund", "BVB", "ডর্টমুন্ড", "BL1"), T(3, "Leverkusen", "B04", "লেভারকুসেন", "BL1"), T(721, "RB Leipzig", "RBL", "লাইপজিগ", "BL1"),
  T(98, "Milan", "MIL", "এসি মিলান", "SA"), T(108, "Inter", "INT", "ইন্টার মিলান", "SA"), T(109, "Juventus", "JUV", "জুভেন্টাস", "SA"), T(113, "Napoli", "NAP", "নাপোলি", "SA"),
  T(524, "PSG", "PSG", "পিএসজি", "FL1"), T(516, "Marseille", "OM", "মার্সেই", "FL1"), T(548, "Monaco", "ASM", "মোনাকো", "FL1"), T(523, "Lyon", "OL", "লিওঁ", "FL1"),
];

const byId = Object.fromEntries(DEMO_TEAMS.map((t) => [t.id, t]));
const compBy = Object.fromEntries(DEMO_COMPETITIONS.map((c) => [c.code, c]));

// নির্দিষ্ট বীজ থেকে র‍্যান্ডম — প্রতিবার একই ডেমো
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

let cache = null;
function demoMatches() {
  if (cache) return cache;
  const r = rng(42);
  const now = Date.now();
  const base = new Date(); base.setUTCHours(0, 0, 0, 0);
  const slots = [12.5, 15, 17.5, 20]; // UTC ঘণ্টা → বাংলাদেশে সন্ধ্যা থেকে রাত
  const out = [];
  let id = 1000;
  for (let day = -4; day <= 12; day++) {
    const comps = (day + 40) % 7 === 2 || (day + 40) % 7 === 3 ? ["CL"] : ["PL", "PD", "BL1", "SA", "FL1"];
    for (const code of comps) {
      const pool = code === "CL" ? DEMO_TEAMS.slice() : DEMO_TEAMS.filter((t) => t.league === code);
      const shuffled = pool.sort(() => r() - 0.5);
      const pairs = code === "CL" ? 4 : 2;
      for (let i = 0; i < pairs && i * 2 + 1 < shuffled.length; i++) {
        const h = shuffled[i * 2], a = shuffled[i * 2 + 1];
        const hour = code === "CL" ? (i < 2 ? 17.75 : 20) : slots[Math.floor(r() * slots.length)];
        const t = base.getTime() + day * 86400000 + hour * 3600000;
        let status = "TIMED", hs = null, as = null;
        if (t + 115 * 60000 < now) { status = "FINISHED"; hs = Math.floor(r() * 4); as = Math.floor(r() * 3); }
        else if (t < now) { status = "IN_PLAY"; hs = Math.floor(r() * 3); as = Math.floor(r() * 2); }
        out.push({
          id: id++, competition_code: code, matchday: 13 + Math.max(0, day), utc_date: new Date(t).toISOString(),
          status, home_id: h.id, away_id: a.id, home_score: hs, away_score: as,
          home: h, away: a, competition: compBy[code],
        });
      }
    }
  }
  // একটা বড় ম্যাচ যেন সবসময় থাকে: আগামীকাল রাত ২টায় রিয়াল–বার্সা
  const t = base.getTime() + 86400000 + 20 * 3600000;
  out.push({ id: 1, competition_code: "PD", matchday: 14, utc_date: new Date(t).toISOString(), status: "TIMED", home_id: 86, away_id: 81, home_score: null, away_score: null, home: byId[86], away: byId[81], competition: compBy.PD });
  cache = out.sort((a, b) => a.utc_date.localeCompare(b.utc_date));
  return cache;
}

const DEMO_LEADERS = [
  { display_name: "সাকিব", points: 47, exact: 9, played: 31 },
  { display_name: "রাফি", points: 42, exact: 7, played: 33 },
  { display_name: "নুসরাত", points: 39, exact: 8, played: 25 },
  { display_name: "তানভীর", points: 31, exact: 5, played: 28 },
  { display_name: "মেহেদী", points: 27, exact: 4, played: 22 },
  { display_name: "ঋতু", points: 22, exact: 3, played: 19 },
];

// ডেমো টেবিল আর গোলদাতা
function demoStandings(code) {
  const r = rng(code.length * 97 + code.charCodeAt(0));
  const pool = code === "CL" ? DEMO_TEAMS : DEMO_TEAMS.filter((t) => t.league === code);
  return pool
    .map((t) => { const w = Math.floor(r() * 10), d = Math.floor(r() * 4), l = 12 - w - d < 0 ? 0 : 12 - w - d, gf = w * 2 + d, ga = l * 2 + d;
      return { competition_code: code, team_id: t.id, team: t, played: w + d + l, won: w, draw: d, lost: l, gf, ga, gd: gf - ga, points: w * 3 + d, form: "W,D,L,W,W" }; })
    .sort((a, b) => b.points - a.points || b.gd - a.gd)
    .map((x, i) => ({ ...x, position: i + 1 }));
}
function demoScorers(code) {
  const pool = code === "CL" ? DEMO_TEAMS : DEMO_TEAMS.filter((t) => t.league === code);
  return pool.slice(0, 8).map((t, i) => ({ competition_code: code, player_id: i, player_name: `Player ${i + 1}`, team_id: t.id, team: t, played: 12, goals: 12 - i, assists: (i * 3) % 5, penalties: i % 2 }));
}

// ════════════════ lib/data.js ════════════════
// সাইটের সব ডেটা এখান দিয়ে যায়। সাইট শুধু Supabase থেকে পড়ে — football-data.org-এ সরাসরি কখনো না।
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY না থাকলে ডেমো মোডে চলে।
const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DEMO = !SB_URL || !KEY;
const sb = DEMO ? null : createClient(SB_URL, KEY);

const MATCH_SELECT = "*, home:teams!matches_home_fk(*), away:teams!matches_away_fk(*), competition:competitions(*)";
const ok = ({ data, error }) => {
  if (error) throw error;
  return data;
};

// ── ডেমো স্টোরেজ (ব্রাউজারে) ──
const ls = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem("kk_" + k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem("kk_" + k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const demoListeners = new Set();

// ═════════ ম্যাচ ═════════
async function getCompetitions() {
  if (DEMO) return DEMO_COMPETITIONS;
  return ok(await sb.from("competitions").select("*").order("sort"));
}

async function getMatchesOnDay(key) {
  const [from, to] = dayRangeUTC(key);
  if (DEMO) return demoMatches().filter((m) => m.utc_date >= from && m.utc_date < to);
  return ok(await sb.from("matches").select(MATCH_SELECT).gte("utc_date", from).lt("utc_date", to).order("utc_date"));
}

// নির্দিষ্ট দলগুলোর সামনের (বা আগের) ম্যাচ
async function getTeamMatches(teamIds, { upcoming = true, limit = 10 } = {}) {
  if (!teamIds.length) return [];
  const now = new Date().toISOString();
  if (DEMO) {
    const list = demoMatches().filter((m) => teamIds.includes(m.home_id) || teamIds.includes(m.away_id));
    return upcoming
      ? list.filter((m) => m.status !== "FINISHED" && m.utc_date >= new Date(Date.now() - 3 * 3600000).toISOString()).slice(0, limit)
      : list.filter((m) => m.status === "FINISHED").reverse().slice(0, limit);
  }
  const ids = teamIds.join(",");
  let q = sb.from("matches").select(MATCH_SELECT).or(`home_id.in.(${ids}),away_id.in.(${ids})`);
  q = upcoming
    ? q.neq("status", "FINISHED").gte("utc_date", new Date(Date.now() - 3 * 3600000).toISOString()).order("utc_date")
    : q.eq("status", "FINISHED").lte("utc_date", now).order("utc_date", { ascending: false });
  return ok(await q.limit(limit));
}

// কোনো তারিখের পর প্রথম যেদিন ম্যাচ আছে (UTC ISO সময় ফেরত দেয়)
async function getNextMatchTime(afterISO) {
  if (DEMO) return demoMatches().find((m) => m.utc_date >= afterISO)?.utc_date || null;
  const rows = ok(await sb.from("matches").select("utc_date").gte("utc_date", afterISO).order("utc_date").limit(1));
  return rows[0]?.utc_date || null;
}

// ═════════ লিগ টেবিল, গোলদাতা, সাম্প্রতিক ফল ═════════
async function getStandings(code) {
  if (DEMO) return demoStandings(code);
  return ok(await sb.from("standings").select("*, team:teams(*)").eq("competition_code", code).order("position"));
}

async function getScorers(code) {
  if (DEMO) return demoScorers(code);
  return ok(await sb.from("scorers").select("*, team:teams(*)").eq("competition_code", code).order("goals", { ascending: false }).order("assists", { ascending: false }).limit(20));
}

async function getTeamStandings(teamId) {
  if (DEMO) return DEMO_COMPETITIONS.flatMap((c) => demoStandings(c.code).filter((r) => r.team_id === teamId).map((r) => ({ ...r, competition: c })));
  return ok(await sb.from("standings").select("*, competition:competitions(*)").eq("team_id", teamId));
}

async function getCompRecent(code, limit = 10) {
  if (DEMO) return demoMatches().filter((m) => m.competition_code === code && m.status === "FINISHED").reverse().slice(0, limit);
  return ok(await sb.from("matches").select(MATCH_SELECT).eq("competition_code", code).eq("status", "FINISHED").order("utc_date", { ascending: false }).limit(limit));
}

// কোনো প্রতিযোগিতার সামনের খেলা
// কোনো প্রতিযোগিতার গোলদাতার তালিকা পুরো কিনা (১ গোলের খেলোয়াড় পর্যন্ত নেমেছে) — তবেই "০ গোল" বলা যায়
const scorersComplete = (all, code) => {
  const l = all.filter((x) => x.competition_code === code);
  return l.length > 20 || (l.length > 0 && Math.min(...l.map((x) => x.goals)) <= 1);
};
// সব প্রতিযোগিতার গোলদাতা (জিজ্ঞেস-বক্সের খেলোয়াড়ের প্রশ্নের জন্য, একবার এনে রাখা)
let allScorersP = null;
function getAllScorers() {
  if (DEMO) return Promise.resolve(["CL", "PL", "PD", "BL1", "SA", "FL1"].flatMap((c) => demoScorers(c).map((r) => ({ ...r, player_id: r.team_id * 100 + r.player_id }))));
  allScorersP ||= sb.from("scorers").select("*, team:teams(*)").then(ok).catch((e) => { allScorersP = null; throw e; });
  return allScorersP;
}

// ছয় লিগের সব খেলোয়াড়: [id, নাম, দলের id, পজিশন] — ব্রাউজারে এক দিন জমা থাকে
let allPlayersP = null;
function getAllPlayers() {
  if (DEMO) return Promise.resolve(DEMO_TEAMS.flatMap((t, k) => [[9000 + k * 2, `Squad Player ${k * 2}`, t.id, "Defence"], [9001 + k * 2, `Squad Player ${k * 2 + 1}`, t.id, "Midfield"]]));
  if (!allPlayersP) {
    try {
      const j = JSON.parse(localStorage.getItem("kk_players") || "null");
      if (j && Date.now() - j.t < 86400000 && Array.isArray(j.data)) allPlayersP = Promise.resolve(j.data);
    } catch { /* ignore */ }
    allPlayersP ||= extra({ type: "players" }).then((data) => { try { localStorage.setItem("kk_players", JSON.stringify({ t: Date.now(), data })); } catch { /* ignore */ } return data; })
      .catch((e) => { allPlayersP = null; throw e; });
  }
  return allPlayersP;
}

async function getCompUpcoming(code, limit = 6) {
  const from = new Date(Date.now() - 3 * 3600000).toISOString();
  if (DEMO) return demoMatches().filter((m) => m.competition_code === code && m.status !== "FINISHED" && m.utc_date >= from).slice(0, limit);
  return ok(await sb.from("matches").select(MATCH_SELECT).eq("competition_code", code).neq("status", "FINISHED").gte("utc_date", from).order("utc_date").limit(limit));
}

async function getMatchesByIds(ids) {
  if (!ids.length) return [];
  if (DEMO) return demoMatches().filter((m) => ids.includes(m.id));
  return ok(await sb.from("matches").select(MATCH_SELECT).in("id", ids));
}

async function getTeams() {
  if (DEMO) return DEMO_TEAMS;
  return ok(await sb.from("team_list").select("*").order("name_en"));
}

// ═════════ লগইন ═════════
async function getUser() {
  if (DEMO) return ls.get("user", null);
  const { data } = await sb.auth.getSession();
  return data.session?.user ?? null;
}

function onAuth(cb) {
  if (DEMO) {
    demoListeners.add(cb);
    return () => demoListeners.delete(cb);
  }
  const { data } = sb.auth.onAuthStateChange((_e, session) => cb(session?.user ?? null));
  return () => data.subscription.unsubscribe();
}

const demoLogin = (user) => { ls.set("user", user); demoListeners.forEach((f) => f(user)); return { user }; };

// আমন্ত্রণের কোড (লিংক থেকে এসে থাকলে) — লগইন/রেজিস্ট্রেশনের পরেও যেন হারিয়ে না যায়
const pendingJoin = () => { try { return localStorage.getItem("kk_join"); } catch { return null; } };
// লগইনের পর ফেরার ঠিকানা: আমন্ত্রণ থাকলে /join/কোড (অন্য ব্রাউজারে ইমেইল খুললেও কোড সাথে যায়)
const pendingQuiz = () => { try { return localStorage.getItem("kk_quiz"); } catch { return null; } };
const backTo = () => window.location.origin + (pendingJoin() ? `/join/${pendingJoin()}` : pendingQuiz() ? `/quiz${pendingQuiz() === "new" ? "" : "/" + pendingQuiz()}` : "");

async function signUp({ name, email, phone, password }) {
  const join = pendingJoin() || undefined;
  if (DEMO) return demoLogin({ id: "demo", email, user_metadata: { name, phone, join } });
  // কোডটা অ্যাকাউন্টেও রাখি: ইমেইলের লিংক অন্য ফোনে/অ্যাপে খুললেও লিগে যোগ হবে
  const data = ok(await sb.auth.signUp({ email, password, options: { data: { name, phone, join }, emailRedirectTo: backTo() } }));
  return { user: data.session ? data.user : null, needsConfirm: !data.session };
}

async function signIn({ email, password }) {
  if (DEMO) return demoLogin({ id: "demo", email, user_metadata: { name: email.split("@")[0] } });
  return ok(await sb.auth.signInWithPassword({ email, password }));
}

async function signInGoogle() {
  if (DEMO) return demoLogin({ id: "demo", email: "demo@gmail.com", user_metadata: { name: "ডেমো ইউজার" } });
  ok(await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: backTo() } }));
}

async function signOut() {
  if (DEMO) { ls.set("user", null); demoListeners.forEach((f) => f(null)); return; }
  await sb.auth.signOut();
}

// ═════════ প্রোফাইল ═════════
async function getProfile(user) {
  if (DEMO) return ls.get("profile", { id: user.id, display_name: user.user_metadata?.name, phone: user.user_metadata?.phone, email: user.email, onboarded: false });
  return ok(await sb.from("profiles").select("*").eq("id", user.id).maybeSingle());
}

async function updateProfile(user, patch) {
  if (DEMO) { const p = { ...(await getProfile(user)), ...patch }; ls.set("profile", p); return p; }
  return ok(await sb.from("profiles").update(patch).eq("id", user.id).select().single());
}

// ═════════ প্রিয় ও রাইভাল দল ═════════
async function getMyTeams(user) {
  if (DEMO) return ls.get("teams", { fav: [], rival: [] });
  const rows = ok(await sb.from("user_teams").select("team_id, kind").eq("user_id", user.id));
  return { fav: rows.filter((r) => r.kind === "fav").map((r) => r.team_id), rival: rows.filter((r) => r.kind === "rival").map((r) => r.team_id) };
}

async function saveMyTeams(user, { fav, rival }) {
  if (DEMO) { ls.set("teams", { fav, rival }); return; }
  ok(await sb.from("user_teams").delete().eq("user_id", user.id));
  const rows = [...fav.map((team_id) => ({ user_id: user.id, team_id, kind: "fav" })), ...rival.map((team_id) => ({ user_id: user.id, team_id, kind: "rival" }))];
  if (rows.length) ok(await sb.from("user_teams").insert(rows));
}

// ═════════ প্রেডিকশন ═════════
async function getMyPredictions(user) {
  if (DEMO) return ls.get("preds", {});
  const rows = ok(await sb.from("predictions").select("match_id, home, away, points").eq("user_id", user.id));
  return Object.fromEntries(rows.map((r) => [r.match_id, r]));
}

async function savePrediction(user, matchId, home, away) {
  if (DEMO) { const p = ls.get("preds", {}); p[matchId] = { match_id: matchId, home, away, points: null }; ls.set("preds", p); return p[matchId]; }
  return ok(await sb.from("predictions").upsert({ user_id: user.id, match_id: matchId, home, away }, { onConflict: "user_id,match_id" }).select("match_id, home, away, points").single());
}

// comp না দিলে সব লিগ মিলিয়ে; দিলে শুধু সেই লিগের ম্যাচের পয়েন্ট
// (লিগ অনুযায়ী হিসাবের ফাংশন ডেটাবেসে না থাকলে "missing" error)
const rpcMissing = (e) => /PGRST202|could not find the function|does not exist/i.test((e?.code || "") + " " + (e?.message || ""));
async function getLeaderboard(comp) {
  if (DEMO) return comp ? DEMO_LEADERS.filter((_, i) => (i + comp.length) % 3).map((r) => ({ ...r, points: Math.round(r.points / 3), exact: Math.round(r.exact / 3), played: Math.round(r.played / 3) })) : DEMO_LEADERS;
  if (!comp) return ok(await sb.rpc("get_leaderboard", { lim: 50 }));
  const { data, error } = await sb.rpc("get_leaderboard_comp", { lim: 50, comp });
  if (error) throw rpcMissing(error) ? Object.assign(new Error("missing"), { missing: true }) : error;
  return data;
}

// ═════════ বন্ধুদের লিগ ═════════
const rpc = async (fn, args) => ok(await sb.rpc(fn, args));
const demoLeagues = () => ls.get("pleagues", []);

async function myLeagues() {
  if (DEMO) return demoLeagues().map((l) => ({ ...l, members: l.board.length, is_owner: true }));
  return rpc("my_pleagues");
}

async function createLeague(name) {
  if (DEMO) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const l = { id: code, name, code, board: [{ display_name: "আপনি", points: 0, exact: 0, played: 0, is_me: true }, ...DEMO_LEADERS.slice(0, 3)] };
    ls.set("pleagues", [l, ...demoLeagues()]);
    return { id: l.id, code };
  }
  return (await rpc("create_pleague", { p_name: name }))[0];
}

async function joinLeague(code) {
  if (DEMO) { const l = demoLeagues().find((x) => x.code === code.toUpperCase()); if (!l) throw new Error("এই কোডের কোনো লিগ নেই"); return l; }
  return (await rpc("join_pleague", { p_code: code }))[0];
}

async function leagueBoard(id, comp) {
  if (DEMO) { const b = demoLeagues().find((x) => x.id === id)?.board || []; return comp ? b.map((r) => ({ ...r, points: Math.round(r.points / 2), exact: Math.round(r.exact / 2), played: Math.round(r.played / 2) })) : b; }
  if (!comp) return rpc("pleague_board", { p_id: id });
  const { data, error } = await sb.rpc("pleague_board_comp", { p_id: String(id), comp });
  if (error) throw rpcMissing(error) ? Object.assign(new Error("missing"), { missing: true }) : error;
  return data;
}

// লিডারবোর্ডের লিগ ফিল্টার: সব + ছয় লিগ
function CompFilter({ value, onChange }) {
  const { lang } = useT();
  const comps = ["PL", "PD", "CL", "SA", "BL1", "FL1"].map((code) => ({ code }));
  return (
    <div className="lb-filter">
      <button className={"chip" + (!value ? " on" : "")} onClick={() => onChange(null)}>{lang === "bn" ? "সব" : "All"}</button>
      {comps.map((c) => (
        <button key={c.code} className={"chip" + (value === c.code ? " on" : "")} onClick={() => onChange(c.code)}><CompIcon c={c} size={16} />{compLabel(c.code, lang)}</button>
      ))}
    </div>
  );
}
function BoardRows({ rows, isMe, lang, t }) {
  return (
    <div className="card">
      {rows.map((r, i) => (
        <div className="lb" key={i} style={isMe(r) ? { background: "var(--greenDim)" } : null}>
          <div className="rk"><RankBadge rank={i + 1} lang={lang} /></div>
          <div>
            <div style={{ fontWeight: 600 }}>{r.display_name}{isMe(r) ? (lang === "bn" ? " (আপনি)" : " (you)") : ""}</div>
            <div className="sub">{lang === "bn" ? `${num(r.played, lang)} ম্যাচ · হুবহু ${num(r.exact, lang)}` : `${r.played} played · ${r.exact} exact`}</div>
          </div>
          <div className="pt">{num(r.points, lang)} <span className="sub">{t("pts")}</span></div>
        </div>
      ))}
    </div>
  );
}
function BoardMsg({ err, comp, lang }) {
  const bn = lang === "bn";
  if (err === "missing") return <div className="card empty">{bn ? "লিগ অনুযায়ী লিডারবোর্ড খুব শিগগিরই চালু হচ্ছে।" : "Per-league leaderboards are coming soon."}</div>;
  return <div className="card empty">{comp ? (bn ? `${compIn(comp, "bn")} এখনো কেউ পয়েন্ট পায়নি।` : `No points ${compIn(comp, "en")} yet.`) : (bn ? "এখনো কেউ পয়েন্ট পায়নি।" : "No points yet.")}</div>;
}

async function leaveLeague(user, id) {
  if (DEMO) { ls.set("pleagues", demoLeagues().filter((x) => x.id !== id)); return; }
  ok(await sb.from("pleague_members").delete().eq("league_id", id).eq("user_id", user.id));
}

// ═════════ খেলোয়াড় তালিকা আর মুখোমুখি (দরকার হলে /api/extra থেকে) ═════════
async function extra(params) {
  const r = await fetch("/api/extra?" + new URLSearchParams(params));
  const j = await r.json().catch(() => ({ ok: false }));
  if (!j.ok) throw new Error(j.error || "unavailable");
  return j.data;
}

async function getTeamInfo(id) {
  if (DEMO) return {
    id, venue: "Demo Stadium", founded: 1902, coach: { name: "Demo Coach", nationality: "Spain" },
    squad: ["Goalkeeper", "Goalkeeper", "Centre-Back", "Left-Back", "Right-Back", "Centre-Back", "Central Midfield", "Defensive Midfield", "Attacking Midfield", "Left Winger", "Right Winger", "Centre-Forward"]
      .map((pos, i) => ({ id: i, name: `Player ${i + 1}`, position: pos, dateOfBirth: `${1990 + i}-03-0${(i % 9) + 1}`, nationality: ["Spain", "France", "Brazil", "England"][i % 4] })),
  };
  return extra({ type: "team", id });
}

async function getPlayer(id) {
  if (DEMO) return {
    id, name: `Player ${id + 1}`, dateOfBirth: "1996-05-11", nationality: "Spain", position: "Centre-Forward", shirtNumber: 9,
    team: { id: 86, name: "Real Madrid CF", shortName: "Real Madrid", crest: "https://crests.football-data.org/86.png", contractUntil: "2028-06" },
    stats: { from: "2026-07-01", to: "2026-11-18", matches: 14, competitions: "PD,CL" },
    photo: { url: "/icon-512x512.png", page: "https://commons.wikimedia.org/" },
  };
  return extra({ type: "player", id });
}
// গোলদাতার তালিকায় এই খেলোয়াড় (প্রতিযোগিতা অনুযায়ী)
async function getPlayerScoring(id) {
  if (DEMO) return [{ competition_code: "PD", goals: 7, assists: 3, played: 11, penalties: 2 }, { competition_code: "CL", goals: 2, assists: 1, played: 4, penalties: 0 }];
  return ok(await sb.from("scorers").select("competition_code, goals, assists, played, penalties").eq("player_id", id));
}

// খেলোয়াড়দের ছোট ছবি: দলের পুরো স্কোয়াড বা কয়েকজন (id) — একবার আনা ছবি মনে রাখে
// ব্রাউজারে এক দিন জমা থাকে, তাই আবার খুললে সঙ্গে সঙ্গে ছবি
const photoMemo = (() => { try { const j = JSON.parse(localStorage.getItem("kk_photos") || "{}"); return Date.now() - (j.t || 0) < 86400000 ? j.map || {} : {}; } catch { return {}; } })();
const savePhotos = () => { try { localStorage.setItem("kk_photos", JSON.stringify({ t: Date.now(), map: photoMemo })); } catch { /* ignore */ } };
const photoReq = {};
async function getPhotos(params) {
  if (DEMO) return {};
  const k = JSON.stringify(params);
  photoReq[k] ||= extra({ type: "photos", ...params }).then((d) => { Object.assign(photoMemo, d); savePhotos(); return d; }).finally(() => setTimeout(() => delete photoReq[k], 60000));
  return photoReq[k];
}
// ছোট মাপ (১২০px); পুরনো Special:FilePath লিংকও চলে
const smallPhoto = (url) => url && (url.includes("upload.wikimedia.org") ? url.replace(/\/\d+px-/, "/120px-") : url.replace(/width=\d+/, "width=120"));
// সরাসরি লিংকে না এলে (ছবি ছোট হলে মাপের ছবি থাকে না) Special:FilePath দিয়ে আরেকবার
const photoFallback = (url) => {
  const m = url && url.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//);
  return m ? `https://commons.wikimedia.org/wiki/Special:FilePath/${m[1]}?width=${(url.match(/\/(\d+)px-/) || [])[1] || 120}` : null;
};

async function getH2H(matchId, homeId, awayId) {
  if (DEMO) return {
    aggregates: { numberOfMatches: 5, totalGoals: 14, homeTeam: { id: homeId, wins: 2, draws: 1, losses: 2 }, awayTeam: { id: awayId, wins: 2, draws: 1, losses: 2 } },
    matches: [0, 1, 2, 3, 4].map((i) => ({ id: i, utcDate: `202${5 - (i >> 1)}-0${(i % 9) + 1}-12T19:00:00Z`, competition: { code: "PD" }, homeTeam: { id: i % 2 ? awayId : homeId }, awayTeam: { id: i % 2 ? homeId : awayId }, score: { home: i % 3, away: (i + 1) % 3 } })),
  };
  return extra({ type: "h2h", match: matchId });
}

// ════════════════ components.jsx ════════════════
// লিগ বা দলের পাতায় যাওয়ার জন্য (App থেকে আসে)
const NavCtx = createContext({ openLeague: () => {}, openTeam: () => {}, openPlayer: () => {} });
// প্রিয় দলের id-গুলো — ম্যাচের সারিতে ★ দেখাতে
const FavCtx = createContext([]);
const useNav = () => useContext(NavCtx);

// দলের নাম যেভাবে দেখাবে: [ইংরেজি, বাংলা] — ইংরেজিতে প্রচলিত নাম (Barça নয় Barcelona), বাংলায় পত্রিকার বানান
// ডেটাবেসের নামগুলো খোঁজার জন্য থাকে (বার্সা, atleti লিখলেও পাওয়া যায়)
const TEAM_NAMES = {
  1: ["Köln", "কোলন"],
  2: ["Hoffenheim", "হফেনহাইম"],
  3: ["Bayer Leverkusen", "বায়ার লেভারকুসেন"],
  4: ["Borussia Dortmund", "বরুসিয়া ডর্টমুন্ড"],
  5: ["Bayern Munich", "বায়ার্ন মিউনিখ"],
  6: ["Schalke 04", "শালকে"],
  7: ["Hamburg", "হামবুর্গ"],
  10: ["Stuttgart", "স্টুটগার্ট"],
  12: ["Werder Bremen", "ভেরডার ব্রেমেন"],
  15: ["Mainz", "মাইনৎস"],
  16: ["Augsburg", "আউগসবুর্গ"],
  17: ["Freiburg", "ফ্রাইবুর্গ"],
  18: ["Borussia Mönchengladbach", "বরুসিয়া মনশেনগ্লাডবাখ"],
  19: ["Eintracht Frankfurt", "আইনট্রাখট ফ্রাঙ্কফুর্ট"],
  28: ["Union Berlin", "উনিয়ন বার্লিন"],
  29: ["Paderborn", "পাডারবর্ন"],
  57: ["Arsenal", "আর্সেনাল"],
  58: ["Aston Villa", "অ্যাস্টন ভিলা"],
  61: ["Chelsea", "চেলসি"],
  62: ["Everton", "এভারটন"],
  63: ["Fulham", "ফুলহাম"],
  64: ["Liverpool", "লিভারপুল"],
  65: ["Manchester City", "ম্যানচেস্টার সিটি"],
  66: ["Manchester United", "ম্যানচেস্টার ইউনাইটেড"],
  67: ["Newcastle", "নিউক্যাসল"],
  71: ["Sunderland", "সান্ডারল্যান্ড"],
  73: ["Tottenham", "টটেনহাম"],
  76: ["Wolverhampton", "উলভারহ্যাম্পটন"],
  77: ["Athletic Bilbao", "অ্যাথলেটিক বিলবাও"],
  78: ["Atlético Madrid", "আতলেতিকো মাদ্রিদ"],
  79: ["Osasuna", "ওসাসুনা"],
  80: ["Espanyol", "এস্পানিওল"],
  81: ["Barcelona", "বার্সেলোনা"],
  82: ["Getafe", "হেতাফে"],
  84: ["Málaga", "মালাগা"],
  86: ["Real Madrid", "রিয়াল মাদ্রিদ"],
  87: ["Rayo Vallecano", "রায়ো ভায়েকানো"],
  88: ["Levante", "লেভান্তে"],
  90: ["Real Betis", "রিয়াল বেতিস"],
  92: ["Real Sociedad", "রিয়াল সোসিয়েদাদ"],
  94: ["Villarreal", "ভিয়ারিয়াল"],
  95: ["Valencia", "ভালেন্সিয়া"],
  98: ["AC Milan", "এসি মিলান"],
  99: ["Fiorentina", "ফিওরেন্তিনা"],
  100: ["Roma", "রোমা"],
  102: ["Atalanta", "আতালান্তা"],
  103: ["Bologna", "বোলোনিয়া"],
  104: ["Cagliari", "কালিয়ারি"],
  107: ["Genoa", "জেনোয়া"],
  108: ["Inter Milan", "ইন্টার মিলান"],
  109: ["Juventus", "জুভেন্টাস"],
  110: ["Lazio", "লাৎসিও"],
  112: ["Parma", "পারমা"],
  113: ["Napoli", "নাপোলি"],
  115: ["Udinese", "উদিনেসে"],
  263: ["Alavés", "আলাভেস"],
  285: ["Elche", "এলচে"],
  322: ["Hull City", "হাল সিটি"],
  341: ["Leeds United", "লিডস ইউনাইটেড"],
  349: ["Ipswich Town", "ইপসউইচ টাউন"],
  351: ["Nottingham Forest", "নটিংহাম ফরেস্ট"],
  354: ["Crystal Palace", "ক্রিস্টাল প্যালেস"],
  397: ["Brighton", "ব্রাইটন"],
  402: ["Brentford", "ব্রেন্টফোর্ড"],
  454: ["Venezia", "ভেনেৎসিয়া"],
  470: ["Frosinone", "ফ্রোসিনোনে"],
  471: ["Sassuolo", "সাসুয়োলো"],
  498: ["Sporting CP", "স্পোর্টিং লিসবন"],
  503: ["Porto", "পোর্তো"],
  511: ["Toulouse", "তুলুজ"],
  512: ["Brest", "ব্রেস্ত"],
  516: ["Marseille", "মার্সেই"],
  519: ["Auxerre", "অক্সের"],
  521: ["Lille", "লিল"],
  522: ["Nice", "নিস"],
  523: ["Lyon", "লিওঁ"],
  524: ["Paris Saint-Germain", "পিএসজি"],
  525: ["Lorient", "লরিয়াঁ"],
  529: ["Rennes", "রেন"],
  531: ["Troyes", "ত্রোয়া"],
  532: ["Angers", "অঁজে"],
  533: ["Le Havre", "লে আভ্র"],
  535: ["Le Mans", "লে মাঁ"],
  546: ["Lens", "লঁস"],
  548: ["Monaco", "মোনাকো"],
  558: ["Celta Vigo", "সেল্তা ভিগো"],
  559: ["Sevilla", "সেভিয়া"],
  560: ["Deportivo La Coruña", "দেপোর্তিভো লা করুনিয়া"],
  563: ["West Ham", "ওয়েস্ট হাম"],
  576: ["Strasbourg", "স্ত্রাসবুর্গ"],
  586: ["Torino", "তোরিনো"],
  610: ["Galatasaray", "গালাতাসারাই"],
  613: ["Fenerbahçe", "ফেনারবাহচে"],
  674: ["PSV Eindhoven", "পিএসভি আইন্দহোভেন"],
  675: ["Feyenoord", "ফেইনুর্ড"],
  678: ["Ajax", "আয়াক্স"],
  719: ["Elversberg", "এলভার্সবার্গ"],
  721: ["RB Leipzig", "আরবি লাইপজিগ"],
  851: ["Club Brugge", "ক্লাব ব্রুগা"],
  930: ["Slavia Prague", "স্লাভিয়া প্রাগ"],
  1044: ["Bournemouth", "বোর্নমাউথ"],
  1045: ["Paris FC", "প্যারিস এফসি"],
  1076: ["Coventry City", "কভেন্ট্রি সিটি"],
  1887: ["Shakhtar Donetsk", "শাখতার দোনেৎস্ক"],
  1899: ["AEK Athens", "এইকে এথেন্স"],
  1903: ["Benfica", "বেনফিকা"],
  2016: ["LASK", "লাস্ক"],
  5335: ["Racing Santander", "রেসিং সান্তান্দের"],
  5720: ["Viking", "ভাইকিং"],
  5721: ["Bodø/Glimt", "বোডো/গ্লিমট"],
  5890: ["Lecce", "লেচে"],
  5911: ["Monza", "মনৎসা"],
  7397: ["Como", "কোমো"],
  7509: ["Slovan Bratislava", "স্লোভান ব্রাতিস্লাভা"],
  10233: ["Sabah", "সাবাহ"],
};
const teamName = (team, lang) =>
  !team ? (lang === "bn" ? "নির্ধারিত হয়নি" : "TBD")
    : TEAM_NAMES[team.id] ? TEAM_NAMES[team.id][lang === "bn" ? 1 : 0]
    : lang === "bn" ? team.name_bn || team.short_en || team.name_en : team.short_en || team.name_en;
// খোঁজার জন্য দলের সব নাম
const teamAliases = (t) => [t.name_bn, t.name_en, t.short_en, ...(TEAM_NAMES[t.id] || []), ...(TEAM_SHORT[t.id] || [])];
// ম্যাচের সারিতে জায়গা কম: লম্বা নামের প্রচলিত ছোট রূপ (FotMob-এর মতো)। দলের পাতা, শিট, সার্চে পুরো নাম থাকে।
const TEAM_SHORT = {
  65: ["Man City", "ম্যান সিটি"], 66: ["Man United", "ম্যান ইউনাইটেড"], 351: ["Nott'm Forest", "নটিংহাম"], 76: ["Wolves", "উলভস"],
  349: ["Ipswich", "ইপসউইচ"], 341: ["Leeds", "লিডস"], 1076: ["Coventry", "কভেন্ট্রি"], 322: ["Hull", "হাল সিটি"],
  78: ["Atlético", "আতলেতিকো"], 77: ["Athletic", "অ্যাথলেটিক"], 560: ["Deportivo", "দেপোর্তিভো"], 5335: ["Racing", "রেসিং"], 87: ["Rayo", "রায়ো"],
  4: ["Dortmund", "ডর্টমুন্ড"], 3: ["Leverkusen", "লেভারকুসেন"], 18: ["Gladbach", "গ্লাডবাখ"], 19: ["Frankfurt", "ফ্রাঙ্কফুর্ট"],
  12: ["Bremen", "ব্রেমেন"], 721: ["Leipzig", "লাইপজিগ"], 5: ["Bayern", "বায়ার্ন"],
  524: ["PSG", "পিএসজি"], 674: ["PSV", "পিএসভি"], 1887: ["Shakhtar", "শাখতার"], 7509: ["Slovan", "স্লোভান"], 930: ["Slavia", "স্লাভিয়া"],
  498: ["Sporting", "স্পোর্টিং"], 1899: ["AEK", "এইকে"],
};
const teamShort = (team, lang) => (team && TEAM_SHORT[team.id] ? TEAM_SHORT[team.id][lang === "bn" ? 1 : 0] : teamName(team, lang));
// বাংলায় লিগ আঁ নয়, লিগ ওয়ান (ডেটাবেসের নাম যা-ই থাকুক)
const COMP_BN_FIX = { FL1: "লিগ ওয়ান" };
const compName = (c, lang) => (c ? (lang === "bn" ? COMP_BN_FIX[c.code] || c.name_bn : c.name_en) : "");

// খেলোয়াড়ের বাংলা নাম (পত্রিকার বানান): গোলদাতা তালিকার উপরের দিক, পরিচিত তারকা আর বড় ১৪ দলের পুরো স্কোয়াড; বাকিরা ইংরেজিতে
const PLAYER_BN = {
  "Achraf Hakimi": "আশরাফ হাকিমি",
  "Ademola Lookman": "আদেমোলা লুকমান",
  "Adil Bourabaa": "আদিল বুরাবা",
  "Adrien Rabiot": "আদ্রিয়েঁ রাবিও",
  "Adrien Thomasson": "আদ্রিয়েঁ তোমাসোঁ",
  "Adrián": "আদ্রিয়ান",
  "Alejandro Grimaldo": "আলেহান্দ্রো গ্রিমালদো",
  "Aleksey Batrakov": "আলেক্সেই বাত্রাকভ",
  "Alessandro Bastoni": "আলেসান্দ্রো বাস্তোনি",
  "Alexander Isak": "আলেক্সান্ডার ইসাক",
  "Alexander Sørloth": "আলেক্সান্ডার সরলথ",
  "Alexis Mac Allister": "আলেক্সিস ম্যাক অ্যালিস্টার",
  "Alisson Becker": "আলিসন বেকার",
  "Alphadjo Cisse": "আলফাদজো সিসে",
  "Alphonso Davies": "আলফোনসো ডেভিস",
  "Amine Gouiri": "আমিন গুইরি",
  "Amine Harit": "আমিন হারিত",
  "Anastasios Douvikas": "আনাস্তাসিওস দুভিকাস",
  "Ansu Fati": "আনসু ফাতি",
  "Ante Budimir": "আন্তে বুদিমির",
  "Anthony Caci": "অ্যান্থনি কাসি",
  "Anthony Gordon": "অ্যান্থনি গর্ডন",
  "Antoine Semenyo": "আঁতোয়ান সেমেনিও",
  "Antonio Nusa": "আন্তোনিও নুসা",
  "Antonio Raimondo": "আন্তোনিও রাইমোন্দো",
  "Antonio Rüdiger": "আন্তোনিও রুডিগার",
  "Arda Guler": "আরদা গুলের",
  "Ayoze Pérez": "আয়োসে পেরেস",
  "Benjamin Šeško": "বেঞ্জামিন শেসকো",
  "Bernardo Silva": "বের্নার্দো সিলভা",
  "Boulaye Dia": "বুলায়ে দিয়া",
  "Bradley Barcola": "ব্র্যাডলি বারকোলা",
  "Brugui": "ব্রুগি",
  "Bruno Fernandes": "ব্রুনো ফার্নান্দেস",
  "Bruno Guimarães": "ব্রুনো গিমারেস",
  "Bryan Mbeumo": "ব্রায়ান এমবেউমো",
  "Bukayo Saka": "বুকায়ো সাকা",
  "Cameron Archer": "ক্যামেরন আর্চার",
  "Casper Tengstedt": "কাসপার টেংস্টেড",
  "Charalampos Kostoulas": "খারালাম্পোস কোস্তুলাস",
  "Che Adams": "চে অ্যাডামস",
  "Christian Pulisic": "ক্রিস্টিয়ান পুলিসিক",
  "Christopher Nkunku": "ক্রিস্টোফার এনকুনকু",
  "Cody Gakpo": "কোডি গাকপো",
  "Cole Palmer": "কোল পামার",
  "Dani Olmo": "দানি ওলমো",
  "Daniel Maldini": "দানিয়েল মালদিনি",
  "Daniel Namaso": "ড্যানিয়েল নামাসো",
  "Davide Frattesi": "দাভিদে ফ্রাত্তেসি",
  "Dayot Upamecano": "দায়ো উপামেকানো",
  "Dean Huijsen": "ডিন হুইসেন",
  "Declan Rice": "ডেকলান রাইস",
  "Desire Doue": "দেজিরে দুয়ে",
  "Diego Moreira": "দিয়েগো মোরেইরা",
  "Dominic Calvert-Lewin": "ডমিনিক কালভার্ট-লুইন",
  "Dominik Szoboszlai": "দমিনিক সোবোসলাই",
  "Donyell Malen": "ডনিয়েল মালেন",
  "Eberechi Eze": "এবেরেচি এজে",
  "Ederson": "এদেরসন",
  "Eduardo Camavinga": "এদুয়ার্দো কামাভিঙ্গা",
  "Emiliano Martínez": "এমিলিয়ানো মার্তিনেজ",
  "Enzo Fernández": "এনজো ফার্নান্দেজ",
  "Enzo Le Fée": "এনজো লে ফে",
  "Erling Haaland": "আর্লিং হালান্ড",
  "Ermedin Demirovic": "এরমেদিন দেমিরোভিচ",
  "Ernest Nuamah": "আর্নেস্ট নুয়ামাহ",
  "Esteban Lepaul": "এস্তেবান লেপোল",
  "Evanilson": "এভানিলসন",
  "Fabián Ruiz": "ফাবিয়ান রুইজ",
  "Federico Chiesa": "ফেদেরিকো কিয়েসা",
  "Federico Dimarco": "ফেদেরিকো দিমার্কো",
  "Federico Valverde": "ফেদেরিকো ভালভের্দে",
  "Felix Kalu Nmecha": "ফেলিক্স এনমেচা",
  "Fer Niño": "ফের নিনিও",
  "Fermín López": "ফেরমিন লোপেজ",
  "Ferrán Torres": "ফেরান তোরেস",
  "Florian Thauvin": "ফ্লোরিয়াঁ তোভাঁ",
  "Florian Wirtz": "ফ্লোরিয়ান ভির্টজ",
  "Folarin Balogun": "ফোলারিন বালোগুন",
  "Franco Mastantuono": "ফ্রাঙ্কো মাস্তান্তুয়োনো",
  "Frenkie de Jong": "ফ্রেংকি ডি ইয়ং",
  "Fábio Silva": "ফাবিও সিলভা",
  "Gabriel Magalhães": "গাব্রিয়েল মাগালিয়েস",
  "Gessime Yassine": "জেসিম ইয়াসিন",
  "Giacomo Calò": "জাকোমো কালো",
  "Gianluigi Donnarumma": "জানলুইজি দোন্নারুম্মা",
  "Giorgi Kvernadze": "গিওর্গি কভেরনাদজে",
  "Giuliano Simeone": "জুলিয়ানো সিমিওনে",
  "Gustav Isaksen": "গুস্তাভ ইসাকসেন",
  "Gustavo Varela": "গুস্তাভো ভারেলা",
  "Hakan Çalhanoğlu": "হাকান চালহানোগলু",
  "Harry Kane": "হ্যারি কেইন",
  "Hugo Ekitike": "উগো একিতিকে",
  "Ibrahim Maza": "ইব্রাহিম মাজা",
  "Igor Matanovic": "ইগর মাতানোভিচ",
  "Iñaki Williams": "ইনিয়াকি উইলিয়ামস",
  "Jack Hinshelwood": "জ্যাক হিনশেলউড",
  "Jamal Musiala": "জামাল মুসিয়ালা",
  "Jan Oblak": "ইয়ান অবলাক",
  "Jean-Philippe Mateta": "জঁ-ফিলিপ মাতেতা",
  "Jeremie Frimpong": "জেরেমি ফ্রিমপং",
  "Joan García": "জোয়ান গার্সিয়া",
  "Jonathan Burkardt": "ইয়োনাথান বুরকার্ট",
  "Jonathan Clauss": "জোনাথন ক্লস",
  "Jonathan David": "জোনাথন ডেভিড",
  "Jonathan Tah": "ইয়োনাথান টাহ",
  "Joseph Scally": "জোসেফ স্ক্যালি",
  "Josh Maja": "জশ মাজা",
  "Joshua Kimmich": "ইয়োশুয়া কিমিখ",
  "João Pedro": "জোয়াও পেদ্রো",
  "Joško Gvardiol": "ইওশকো গাভার্দিওল",
  "Jude Bellingham": "জুড বেলিংহাম",
  "Julián Álvarez": "হুলিয়ান আলভারেজ",
  "Kai Havertz": "কাই হাভার্টজ",
  "Kamory Doumbia": "কামোরি দুম্বিয়া",
  "Kenan Yıldız": "কেনান ইলদিজ",
  "Kevin De Bruyne": "কেভিন ডি ব্রুইনা",
  "Kevin Schade": "কেভিন শাডে",
  "Khvicha Kvaratskhelia": "খভিচা কাভারাতস্কেলিয়া",
  "Kiernan Dewsbury Hall": "কিয়ারনান ডিউসবারি-হল",
  "Kylian Mbappé": "কিলিয়ান এমবাপ্পে",
  "Lamine Yamal": "লামিন ইয়ামাল",
  "Lassine Sinayoko": "লাসিন সিনায়োকো",
  "Lautaro Martínez": "লাউতারো মার্তিনেজ",
  "Leny Yoro": "লেনি ইয়োরো",
  "Leroy Sané": "লেরয় সানে",
  "Liam Delap": "লিয়াম ডেলাপ",
  "Louis Mafouta": "লুই মাফুতা",
  "Lucas Boyé": "লুকাস বোয়ে",
  "Ludovic Ajorque": "লুদোভিক আজর্ক",
  "Luis Díaz": "লুইস দিয়াজ",
  "Luis Suárez": "লুইস সুয়ারেজ",
  "Luka Modrić": "লুকা মদরিচ",
  "Luka Sučić": "লুকা সুচিচ",
  "Manuel Neuer": "মানুয়েল নয়ার",
  "Marcus Rashford": "মার্কাস র‍্যাশফোর্ড",
  "Marcus Tavernier": "মার্কাস টাভার্নিয়ার",
  "Marcus Thuram-Ulien": "মার্কাস থুরাম",
  "Mariano Díaz": "মারিয়ানো দিয়াজ",
  "Marquinhos": "মারকিনিওস",
  "Martin Satriano": "মার্তিন সাত্রিয়ানো",
  "Martin Ødegaard": "মার্টিন ওডেগার্ড",
  "Martín Zubimendi": "মার্তিন সুবিমেন্দি",
  "Mason Greenwood": "ম্যাসন গ্রিনউড",
  "Mateo Pellegrino": "মাতেও পেলেগ্রিনো",
  "Matheus Cunha": "মাথেউস কুনিয়া",
  "Mathys Tel": "মাথিস তেল",
  "Matias Soule": "মাতিয়াস সুলে",
  "Maurice Krattenmacher": "মরিস ক্রাটেনমাখার",
  "Michael Gregoritsch": "মাইকেল গ্রেগরিচ",
  "Michael Olise": "মাইকেল ওলিসে",
  "Mika Biereth": "মিকা বিয়েরেথ",
  "Mike Maignan": "মাইক মেনিয়াঁ",
  "Mikel Oyarzabal": "মিকেল ওইয়ারসাবাল",
  "Milos Kerkez": "মিলোস কেরকেজ",
  "Milutin Osmajić": "মিলুতিন ওসমাইচ",
  "Miro Muheim": "মিরো মুহেইম",
  "Mohamed Belloumi": "মোহাম্মদ বেলুমি",
  "Moise Kean": "মোইসে কিন",
  "Moisés Caicedo": "মোইসেস কাইসেদো",
  "Morgan Rogers": "মরগান রজার্স",
  "Nick Woltemade": "নিক ভোল্টেমাডে",
  "Niclas Füllkrug": "নিকলাস ফুলক্রুগ",
  "Nico Paz": "নিকো পাজ",
  "Nico Williams": "নিকো উইলিয়ামস",
  "Nicolas Jackson": "নিকোলাস জ্যাকসন",
  "Nicolo Tresoldi": "নিকোলো ত্রেসোলদি",
  "Nicolò Barella": "নিকোলো বারেল্লা",
  "Nikola Krstović": "নিকোলা ক্রস্তোভিচ",
  "Noni Madueke": "নোনি মাদুয়েকে",
  "Nuno Mendes": "নুনো মেন্দেস",
  "Olivier Giroud": "অলিভিয়ের জিরু",
  "Omar Marmoush": "ওমর মারমুশ",
  "Orri Oskarsson": "অরি অস্কারসন",
  "Ousmane Dembélé": "উসমান দেম্বেলে",
  "Pablo Gavira": "গাভি",
  "Paris Brunner": "প্যারিস ব্রুনার",
  "Pascal Groß": "পাসকাল গ্রস",
  "Patrik Schick": "পাত্রিক শিক",
  "Paulo Dybala": "পাওলো দিবালা",
  "Pedri": "পেদ্রি",
  "Pedro Neto": "পেদ্রো নেতো",
  "Phil Foden": "ফিল ফোডেন",
  "Phillip Tietz": "ফিলিপ টিয়েৎস",
  "Pierre-Emerick Aubameyang": "পিয়েরে-এমেরিক অবামেয়াং",
  "Rafael Leão": "রাফায়েল লিয়াও",
  "Raphinha": "রাফিনিয়া",
  "Rasmus Højlund": "রাসমুস হয়লুন্ড",
  "Rayan Cherki": "রায়ান শেরকি",
  "Reece James": "রিস জেমস",
  "Roberto Fernández": "রবের্তো ফার্নান্দেজ",
  "Rodri": "রদ্রি",
  "Rodrigo Mora": "রদ্রিগো মোরা",
  "Rodrygo": "রদ্রিগো",
  "Romelu Lukaku": "রোমেলু লুকাকু",
  "Romulo Cruz": "রোমুলো ক্রুজ",
  "Ryan Gravenberch": "রায়ান গ্রাভেনবার্খ",
  "Rúben Dias": "রুবেন দিয়াস",
  "Sandro Tonali": "সান্দ্রো তোনালি",
  "Santiago Giménez": "সান্তিয়াগো হিমেনেজ",
  "Scott McTominay": "স্কট ম্যাকটমিনে",
  "Sebastian Szymański": "সেবাস্তিয়ান শিমানস্কি",
  "Sehrou Guirassy": "সেরু গিরাসি",
  "Sepe Elye Wahi": "এলি ওয়াহি",
  "Serge Gnabry": "সার্জ জিনাব্রি",
  "Sergio Camello": "সার্জিও কামেলো",
  "Teun Koopmeiners": "টিউন কুপমেইনার্স",
  "Thibaut Courtois": "থিবো কোর্তোয়া",
  "Thierno Barry": "থিয়ের্নো বারি",
  "Thomas Jørgensen": "টমাস ইয়র্গেনসেন",
  "Tidiam Gomis": "তিদিয়াম গোমিস",
  "Tijjani Noslin": "তিজানি নসলিন",
  "Trent Alexander-Arnold": "ট্রেন্ট আলেক্সান্ডার-আরনল্ড",
  "Victor Osimhen": "ভিক্টর ওসিমেন",
  "Viktor Gyökeres": "ভিক্টর গিয়োকেরেস",
  "Vinicius Junior": "ভিনিসিয়ুস জুনিয়র",
  "Virgil van Dijk": "ভার্জিল ফন ডাইক",
  "Vitinha": "ভিতিনিয়া",
  "William Saliba": "উইলিয়াম সালিবা",
  "Xavi Simons": "চাভি সিমন্স",
  "Yann Sommer": "ইয়ান সোমার",
  "Yasin Ayari": "ইয়াসিন আয়ারি",
  "Yassir Zabiri": "ইয়াসির জাবিরি",
  "Yoane Wissa": "ইয়োয়ান উইসা",
  "Younes Ebnoutalib": "ইউনেস এবনুতালিব",
  "Yuito Suzuki": "ইউইতো সুজুকি",
  "Álex Baena": "আলেক্স বায়েনা",
  "Álex Berenguer": "আলেক্স বেরেঙ্গের",
  "Álvaro García": "আলভারো গার্সিয়া",
  "Éder Militão": "এদের মিলিতাও",
  // ── বড় ১৪ দলের পুরো স্কোয়াড ──
  "Andriy Lunin": "আন্দ্রি লুনিন",
  "Denzel Dumfries": "ডেনজেল ডামফ্রিস",
  "Ferland Mendy": "ফারলঁ মেন্দি",
  "Ibrahima Konaté": "ইব্রাহিমা কোনাতে",
  "Cucurella": "কুকুরেয়া",
  "Álvaro Carreras": "আলভারো কারেরাস",
  "Raúl": "রাউল",
  "Aurélien Tchouameni": "অরেলিয়েঁ চুয়ামেনি",
  "Thiago Pitarch": "থিয়াগো পিতার্চ",
  "Jorge Cestero": "হোর্হে সেস্তেরো",
  "Brahim Diaz": "ব্রাহিম দিয়াজ",
  "Endrick": "এনদ্রিক",
  "Carlos Espí": "কার্লোস এস্পি",
  "Yan Diomandé": "ইয়ান দিওমান্দে",
  "Ilya Voloshyn": "ইলিয়া ভোলোশিন",
  "Wojciech Szczęsny": "ভয়চেখ শেজনি",
  "Dominik Livaković": "দমিনিক লিভাকোভিচ",
  "João Cancelo": "জোয়াও কানসেলো",
  "Andreas Christensen": "আন্দ্রেয়াস ক্রিস্টেনসেন",
  "Jules Koundé": "জুল কুন্দে",
  "Eric García": "এরিক গার্সিয়া",
  "Álex Balde": "আলেক্স বালদে",
  "Pau Cubarsí": "পাউ কুবারসি",
  "Gerard Martín": "জেরার্দ মার্তিন",
  "Xavi Espart": "চাভি এসপার্ত",
  "Marc Bernal": "মার্ক বের্নাল",
  "Brian Fariñas": "ব্রায়ান ফারিনিয়াস",
  "Gabriel Jesus": "গাব্রিয়েল জেসুস",
  "Karim Adeyemi": "করিম আদেয়েমি",
  "Roony Bardghji": "রুনি বারদজি",
  "Hamza Abdelkarim": "হামজা আবদেলকারিম",
  "Jesse Bisiwu": "জেসি বিসিউ",
  "Ebrima Tunkara": "এব্রিমা তুনকারা",
  "Orian Goren": "ওরিয়ান গোরেন",
  "Álex Campos": "আলেক্স কাম্পোস",
  "Iker Rodríguez": "ইকার রদ্রিগেজ",
  "Géronimo Rulli": "জেরোনিমো রুলি",
  "Marcus Bettinelli": "মার্কাস বেত্তিনেল্লি",
  "Rayan Aït Nouri": "রায়ান আইত নুরি",
  "Matheus Nunes": "মাথেউস নুনেস",
  "Marc Guéhi": "মার্ক গেহি",
  "Rico Lewis": "রিকো লুইস",
  "Nico O'Reilly": "নিকো ও'রেইলি",
  "Abdukodir Khusanov": "আবদুকোদির খুসানভ",
  "Vitor Reis": "ভিতর রেইস",
  "Mateo Kovačić": "মাতেও কোভাচিচ",
  "Elliot Anderson": "এলিয়ট অ্যান্ডারসন",
  "Ayyoub Bouaddi": "আইয়ুব বুয়াদ্দি",
  "Iliman Ndiaye": "ইলিমান এনদিয়ায়ে",
  "Jeremy Doku": "জেরেমি দোকু",
  "Allan": "অ্যালান",
  "Ryan McAidoo": "রায়ান ম্যাকএইডু",
  "Freddie Woodman": "ফ্রেডি উডম্যান",
  "Giorgi Mamardashvili": "গিওর্গি মামারদাশভিলি",
  "Vítězslav Jaroš": "ভিতেজস্লাভ ইয়ারোশ",
  "Harvey Davies": "হার্ভি ডেভিস",
  "Kostas Tsimikas": "কোস্তাস সিমিকাস",
  "Joe Gomez": "জো গোমেজ",
  "Ronald Araújo": "রোনালদ আরাউহো",
  "Conor Bradley": "কনর ব্র্যাডলি",
  "Giovanni Leoni": "জোভান্নি লেওনি",
  "Jeremy Jacquet": "জেরেমি জাকে",
  "Wataru Endō": "ওয়াতারু এন্দো",
  "James McConnell": "জেমস ম্যাককনেল",
  "Trey Nyoni": "ট্রে নিওনি",
  "Lewis Koumas": "লুইস কুমাস",
  "Víctor Muñoz": "ভিক্তর মুনিওজ",
  "Rio Ngumoha": "রিও এনগুমোহা",
  "Joshua Sonni-Lambie": "জশুয়া সনি-ল্যাম্বি",
  "Kepa Arrizabalaga": "কেপা আরিজাবালাগা",
  "David Raya": "দাভিদ রায়া",
  "Illan Meslier": "ইলান মেসলিয়ে",
  "Ben White": "বেন হোয়াইট",
  "Ezri Konsa": "এজরি কনসা",
  "Jurrien Timber": "ইউরিয়েন টিম্বার",
  "Piero Hincapié": "পিয়েরো হিনকাপিয়ে",
  "Riccardo Calafiori": "রিকার্দো কালাফিওরি",
  "Cristhian Mosquera": "ক্রিস্তিয়ান মস্কেরা",
  "Mikel Merino": "মিকেল মেরিনো",
  "Myles Lewis-Skelly": "মাইলস লুইস-স্কেলি",
  "Christos Tzolis": "ক্রিস্তোস জোলিস",
  "Max Dowman": "ম্যাক্স ডাওম্যান",
  "Maalik Hashi": "মালিক হাশি",
  "Karl Darlow": "কার্ল ডারলো",
  "Tom Heaton": "টম হিটন",
  "Senne Lammens": "সেনে লামেন্স",
  "Dermot Mee": "ডারমট মি",
  "Harry Maguire": "হ্যারি ম্যাগুয়ার",
  "Matthijs de Ligt": "মাটিয়াস ডি লিখট",
  "Noussair Mazraoui": "নুসাইর মাজরাউই",
  "Luke Shaw": "লুক শ",
  "Diogo Dalot": "দিয়োগো দালো",
  "Lisandro Martínez": "লিসান্দ্রো মার্তিনেজ",
  "Harry Amass": "হ্যারি অ্যামাস",
  "Ayden Heaven": "আইডেন হেভেন",
  "Youri Tielemans": "ইউরি টিলেমান্স",
  "Mason Mount": "ম্যাসন মাউন্ট",
  "Manuel Ugarte": "মানুয়েল উগার্তে",
  "Andrey Santos": "আন্দ্রে সান্তোস",
  "Carlos Baleba": "কার্লোস বালেবা",
  "Kobbie Mainoo": "কোবি মাইনু",
  "Tyler Fletcher": "টাইলার ফ্লেচার",
  "Joshua Zirkzee": "জশুয়া জার্কজি",
  "Amad Diallo": "আমাদ দিয়ালো",
  "Patrick Dorgu": "প্যাট্রিক ডরগু",
  "Shea Lacey": "শে লেসি",
  "Daniel Armer": "ড্যানিয়েল আর্মার",
  "Gabriel Slonina": "গাব্রিয়েল স্লোনিনা",
  "Teddy Sharman-Lowe": "টেডি শারম্যান-লো",
  "Mike Penders": "মাইক পেন্ডার্স",
  "Wesley Fofana": "ওয়েসলি ফোফানা",
  "Maxence Lacroix": "মাক্সঁস লাক্রোয়া",
  "Pep Chavarría": "পেপ চাভারিয়া",
  "Malo Gusto": "মালো গুস্তো",
  "Levi Colwill": "লেভি কলউইল",
  "Jorrel Hato": "ইয়োরেল হাতো",
  "Marco Palestra": "মার্কো পালেস্ত্রা",
  "Aaron Anselmino": "অ্যারন আনসেলমিনো",
  "Josh Acheampong": "জশ আচিয়াম্পং",
  "Jordan Henderson": "জর্ডান হেন্ডারসন",
  "Valentin Barco": "ভালেন্তিন বারকো",
  "Romeo Lavia": "রোমিও লাভিয়া",
  "Mahdi Nicoll-Jazuli": "মাহদি নিকল-জাজুলি",
  "Danny Welbeck": "ড্যানি ওয়েলবেক",
  "Emanuel Emegha": "ইমানুয়েল এমেগা",
  "Jamie Bynoe-Gittens": "জেমি বাইনো-গিটেন্স",
  "Geovany Quenda": "জিওভানি কেন্দা",
  "Estevao": "এস্তেভাও",
  "Sven Ulreich": "স্ভেন উলরাইখ",
  "Jonas Urbig": "ইয়োনাস উরবিগ",
  "Konrad Laimer": "কনরাড লাইমার",
  "Hiroki Ito": "হিরোকি ইতো",
  "Sacha Boey": "সাশা বোয়ে",
  "Josip Stanišić": "ইওসিপ স্তানিশিচ",
  "Min-Jae Kim": "কিম মিন-জে",
  "Nathaniel Brown": "নাথানিয়েল ব্রাউন",
  "Ismael Saibari": "ইসমাইল সাইবারি",
  "Tom Bischof": "টম বিশফ",
  "Aleksandar Pavlović": "আলেক্সান্দার পাভলোভিচ",
  "Lennart Karl": "লেনার্ট কার্ল",
  "David Daiber": "ডেভিড ডাইবার",
  "Bara Ndiaye": "বারা এনদিয়ায়ে",
  "David Podar-Stiube": "ডেভিড পোদার-স্টিউবে",
  "Matvei Safonov": "মাতভেই সাফোনভ",
  "Lucas Chevalier": "লুকাস শেভালিয়ে",
  "Lucas Digne": "লুকাস দিনিয়ে",
  "Lucas Hernández": "লুকাস এরনান্দেজ",
  "William Pacho": "উইলিয়াম পাচো",
  "Illia Zabarnyi": "ইলিয়া জাবারনি",
  "Lucas Beraldo": "লুকাস বেরালদো",
  "Warren Zaïre-Emery": "ওয়ারেন জাইর-এমেরি",
  "Joao Neves": "জোয়াও নেভেস",
  "Senny Mayulu": "সেনি মাইয়ুলু",
  "Pedro Fernández": "পেদ্রো ফার্নান্দেজ",
  "Maghnes Akliouche": "মাগনেস আকলিউশ",
  "Mika Godts": "মিকা গডস",
  "Quentin Ndjantou": "কঁতাঁ এনজান্তু",
  "Younes Idder": "ইউনেস ইদ্দের",
  "Arthur Bar": "আর্তুর বার",
  "Adam Mouak": "আদাম মুয়াক",
  "Ivan Provedel": "ইভান প্রোভেদেল",
  "Raffaele Di Gennaro": "রাফায়েলে দি জেনারো",
  "Josep Martinez": "জোসেপ মার্তিনেজ",
  "Manuel Akanji": "মানুয়েল আকাঞ্জি",
  "Yann Aurel Bisseck": "ইয়ান অরেল বিসেক",
  "John Stones": "জন স্টোনস",
  "Benjamin Pavard": "বাঁজামাঁ পাভার",
  "Carlos": "কার্লোস",
  "Djed Spence": "জেড স্পেন্স",
  "Piotr Zieliński": "পিওতর জিয়েলিনস্কি",
  "Henrikh Mkhitaryan": "হেনরিখ মখিতারিয়ান",
  "Curtis Jones": "কার্টিস জোনস",
  "Luis Henrique": "লুইস এনরিকে",
  "Petar Sucic": "পেতার সুচিচ",
  "Andy Diouf": "অ্যান্ডি দিউফ",
  "Aleksandar Stankovic": "আলেক্সান্দার স্তানকোভিচ",
  "Ange-Yoan Bonny": "আঞ্জ-ইয়োয়ান বনি",
  "Francesco Esposito": "ফ্রান্সেসকো এসপোসিতো",
  "Pietro Terracciano": "পিয়েত্রো তেরাচ্চানো",
  "Lorenzo Torriani": "লরেনজো তোরিয়ানি",
  "Matteo Gabbia": "মাত্তেও গাব্বিয়া",
  "Fikayo Tomori": "ফিকায়ো তোমোরি",
  "Pervis Estupiñán": "পেরভিস এস্তুপিনিয়ান",
  "Strahinja Pavlović": "স্ত্রাহিনিয়া পাভলোভিচ",
  "Filippo Terracciano": "ফিলিপ্পো তেরাচ্চানো",
  "Koni De Winter": "কোনি ডি উইন্টার",
  "Gila": "হিলা",
  "Davide Bartesaghi": "দাভিদে বার্তেসাগি",
  "Sankhoun Diawara": "সাঙ্কুন দিয়াওয়ারা",
  "Ruben Loftus-Cheek": "রুবেন লফটাস-চিক",
  "Alexis Saelemaekers": "আলেক্সিস সালেমেকার্স",
  "Ardon Jasari": "আরদন জাসারি",
  "Yunus Musah": "ইউনুস মুসা",
  "Warren Bondo": "ওয়ারেন বন্দো",
  "Christian Comotto": "ক্রিস্টিয়ান কোমোত্তো",
  "Samuel Chukwueze": "স্যামুয়েল চুকুয়েজে",
  "Gonçalo Ramos": "গনসালো রামোস",
  "Omari Hutchinson": "ওমারি হাচিনসন",
  "Francesco Camarda": "ফ্রান্সেসকো কামার্দা",
  "Lorenzo Ossola": "লরেনজো ওসোলা",
  "El Hadji Cissé": "এল হাজি সিসে",
  "Luca Menon": "লুকা মেনন",
  "Nirash Perera": "নিরাশ পেরেরা",
  "Carlo Pinsoglio": "কার্লো পিনসোলিও",
  "Guglielmo Vicario": "গুলিয়েলমো ভিকারিও",
  "Kamil Grabara": "কামিল গ্রাবারা",
  "Bremer": "ব্রেমার",
  "Daniele Rugani": "দানিয়েলে রুগানি",
  "Lloyd Kelly": "লয়েড কেলি",
  "Jhon Lucumí": "জন লুকুমি",
  "Zeki Çelik": "জেকি চেলিক",
  "Juan Cabal": "হুয়ান কাবাল",
  "Andrea Cambiaso": "আন্দ্রেয়া কাম্বিয়াসো",
  "Pierre Kalulu": "পিয়েরে কালুলু",
  "Federico Gatti": "ফেদেরিকো গাত্তি",
  "Manuel Locatelli": "মানুয়েল লোকাতেল্লি",
  "Weston McKennie": "ওয়েস্টন ম্যাককেনি",
  "Douglas Luiz": "ডগলাস লুইজ",
  "Khéphren Thuram-Ulie": "কেফরেন থুরাম",
  "Pape Sarr": "পাপে সার",
  "Arkadiusz Milik": "আরকাদিউশ মিলিক",
  "Jérémie Boga": "জেরেমি বোগা",
  "Randal Kolo Muani": "রান্দাল কোলো মুয়ানি",
  "Edon Zhegrova": "এদন জেগরোভা",
  "Nicolás González": "নিকোলাস গনসালেস",
  "Francisco Conceição": "ফ্রান্সিসকো কনসেইসাও",
  "Jeff Ekhator": "জেফ একাতর",
  "Kerim Alajbegović": "কেরিম আলাইবেগোভিচ",
  "Juan Musso": "হুয়ান মুসো",
  "Salvi Esquivel": "সালভি এস্কিভেল",
  "Marcos Llorente": "মার্কোস ইয়োরেন্তে",
  "Dávid Hancko": "দাভিদ হানকো",
  "Christian Romero": "ক্রিস্টিয়ান রোমেরো",
  "Robin Le Normand": "রবিন লে নরমঁ",
  "Marc Pubill": "মার্ক পুবিল",
  "Daniel Martínez": "দানিয়েল মার্তিনেজ",
  "Jorge Domínguez": "হোর্হে দমিনগেজ",
  "Koke": "কোকে",
  "Morten Hjulmand": "মর্টেন ইউলমান্ড",
  "Johnny": "জনি",
  "Obed Vargas": "ওবেদ ভার্গাস",
  "Rodrigo Mendoza": "রদ্রিগো মেন্দোসা",
  "Kang-in Lee": "লি কাং-ইন",
  "Alejandro Baena": "আলেহান্দ্রো বায়েনা",
  "Arnau Ortiz": "আরনাউ অর্তিজ",
  "Carlos Martin": "কার্লোস মার্তিন",
  "Gregor Kobel": "গ্রেগর কোবেল",
  "Patrick Drewes": "প্যাট্রিক ড্রেভেস",
  "Alexander Meyer": "আলেক্সান্ডার মায়ার",
  "Silas Ostrzinski": "সিলাস অস্ত্রজিনস্কি",
  "Waldemar Anton": "ভালডেমার আন্টন",
  "Emre Can": "এমরে চান",
  "Ramy Bensebaini": "রামি বেনসেবাইনি",
  "Julian Ryerson": "জুলিয়ান রায়ারসন",
  "Nico Schlotterbeck": "নিকো শ্লটারবেক",
  "Daniel Svensson": "ড্যানিয়েল সভেনসন",
  "Kouakou Gadou": "কুয়াকু গাদু",
  "Filippo Mané": "ফিলিপ্পো মানে",
  "Kaua Prates": "কাউয়া প্রাতেস",
  "Luca Reggiani": "লুকা রেজ্জানি",
  "Marcel Sabitzer": "মার্সেল জাবিৎসার",
  "Joey Veerman": "জোয়ি ভেরমান",
  "Carney Chukwuemeka": "কার্নি চুকুয়েমেকা",
  "Jobe Bellingham": "জোব বেলিংহাম",
  "Ethan Nwaneri": "ইথান এনওয়ানেরি",
  "Konstantinos Karetsas": "কনস্তান্তিনোস কারেৎসাস",
  "Justin Lerma": "জাস্টিন লেরমা",
  "Mussa Kaba": "মুসা কাবা",
  "Enzo dos Santos": "এনজো দোস সান্তোস",
  "Maximilian Beier": "মাক্সিমিলিয়ান বেইয়ার",
  "Samuele Inácio": "সামুয়েলে ইনাসিও",
  "Mathis Albert": "মাতিস আলবার্ট"
};
const playerName = (name, lang) => (lang === "bn" && PLAYER_BN[name]) || name;

// ── লোগো: চলমান ঘড়ি, ভেতরে "খ" আর "?" (v1-এর লোগো) — বাংলাদেশ সময়ে চলে ──
function Logo({ size = 30, onClick }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const { h, mi } = dhaka(now);
  const s = new Date(now).getSeconds();
  const hDeg = ((h % 12) / 12) * 360 + (mi / 60) * 30;
  const mDeg = (mi / 60) * 360 + (s / 60) * 6;
  const sDeg = (s / 60) * 360;
  const pt = (deg, r) => { const rad = ((deg - 90) * Math.PI) / 180; return [40 + r * Math.cos(rad), 40 + r * Math.sin(rad)]; };
  const [hx, hy] = pt(hDeg, 13), [mx, my] = pt(mDeg, 21), [sx, sy] = pt(sDeg, 24);
  const minor = [[59, 8.5, 56, 13.5], [71.5, 21, 66.5, 24], [71.5, 59, 66.5, 56], [59, 71.5, 56, 66.5], [21, 71.5, 24, 66.5], [8.5, 59, 13.5, 56], [8.5, 21, 13.5, 24], [21, 8.5, 24, 13.5]];
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" onClick={onClick} style={{ flex: "none", cursor: onClick ? "pointer" : undefined }}>
      <circle cx="40" cy="40" r="38" fill="#064e3b" stroke="#00e676" strokeWidth="3" />
      <text x="32" y="50" fontFamily="'Hind Siliguri',sans-serif" fontSize="34" fontWeight="800" fill="rgba(255,255,255,0.18)">খ</text>
      <text x="54" y="62" fontFamily="'Hind Siliguri',sans-serif" fontSize="22" fontWeight="800" fill="#f59e0b" opacity="0.9">?</text>
      {[[40, 4, 40, 12], [76, 40, 68, 40], [4, 40, 12, 40], [40, 76, 40, 68]].map(([a, b, c, d], i) => (
        <line key={"M" + i} x1={a} y1={b} x2={c} y2={d} stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />
      ))}
      {minor.map(([a, b, c, d], i) => (
        <line key={"m" + i} x1={a} y1={b} x2={c} y2={d} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      ))}
      <line x1="40" y1="40" x2={hx} y2={hy} stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <line x1="40" y1="40" x2={mx} y2={my} stroke="#00e676" strokeWidth="3" strokeLinecap="round" />
      <line x1="40" y1="40" x2={sx} y2={sy} stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="40" r="3" fill="#e11d48" />
      <circle cx="40" cy="40" r="1.5" fill="#064e3b" />
    </svg>
  );
}

// ── লোগোতে চাপলে নামের নিচে ডিজিটাল সময় (বাংলাদেশ সময়) ──
function ClockText() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const { h, mi } = dhaka(now);
  const s = new Date(now).getSeconds();
  const p2 = (n) => String(n).padStart(2, "0");
  return (
    <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#00e676", letterSpacing: 1.5, lineHeight: 1, marginTop: 3 }}>
      {p2(h % 12 || 12)}:{p2(mi)}:{p2(s)} {h >= 12 ? "PM" : "AM"}
    </div>
  );
}

// ── দলের ক্রেস্ট (ছবি না এলে সংক্ষিপ্ত নাম) ──
function Crest({ team, size = 22 }) {
  const [bad, setBad] = useState(false);
  if (!team?.crest || bad)
    return (
      <span className="crest-fb" style={{ width: size, height: size, fontSize: size * 0.34 }}>
        {(team?.tla || team?.short_en || "?").slice(0, 3)}
      </span>
    );
  return <img className="crest" src={team.crest} alt="" width={size} height={size} loading="lazy" onError={() => setBad(true)} />;
}

// ডেটা সোর্সের পুরনো লোগোর বদলে নতুন লোগো (সাইটের নিজের ফাইল, public/leagues)
const EMBLEM_FIX = { CL: "/leagues/CL.png", PL: "/leagues/PL.png", PD: "/leagues/PD.png", BL1: "/leagues/BL1.png", SA: "/leagues/SA.png", FL1: "/leagues/FL1.png" };
function CompIcon({ c, size = 18 }) {
  const [bad, setBad] = useState(false);
  const src = (c && EMBLEM_FIX[c.code]) || c?.emblem;
  if (!src || bad) return null;
  return <img src={src} alt="" width={size} height={size} style={{ objectFit: "contain" }} onError={() => setBad(true)} />;
}

// ── স্ট্যাটাস লেখা ──
function StatusText({ m }) {
  const { t } = useT();
  if (m.status === "PAUSED") return <span className="lv">{t("ht")}</span>;
  if (isLive(m)) return <span className="lv"><i className="dot" />{t("live")}</span>;
  if (isDone(m)) return <>{t("ft")}</>;
  if (m.status === "POSTPONED") return <>{t("postponed")}</>;
  if (m.status === "CANCELLED") return <>{t("cancelled")}</>;
  return null;
}

// ── ম্যাচের সারি ──
function MatchRow({ m, pred, onOpen, badge, plain, sub }) {
  const allFavs = useContext(FavCtx);
  const favs = plain ? [] : allFavs; // "ফলো করা" কার্ডে সবই প্রিয় দল, তাই আলাদা চিহ্ন লাগে না
  const { lang } = useT();
  const showScore = (isLive(m) || isDone(m)) && m.home_score != null;
  const hw = isDone(m) && m.home_score > m.away_score, aw = isDone(m) && m.away_score > m.home_score;
  return (
    <button className={"row" + (favs.includes(m.home_id) || favs.includes(m.away_id) ? " my" : "") + (badge ? " has-badge" : "")} onClick={() => onOpen?.(m)}>
      {badge}
      <div className={"side home" + (hw ? " win" : "")}>
        <span>{favs.includes(m.home_id) && <i className="fav-star">★</i>}{teamShort(m.home, lang)}</span>
        <Crest team={m.home} />
      </div>
      <div className="mid">
        {showScore ? (
          <div className="sc">{num(m.home_score, lang)} - {num(m.away_score, lang)}</div>
        ) : (
          <div className="t" style={isOff(m) ? { textDecoration: "line-through", opacity: 0.6 } : null}>{timeLabel(m.utc_date, lang)}</div>
        )}
        <div className="st">{sub || <StatusText m={m} />}</div>
        {pred && (
          <span className="pred-tag">
            <TargetIcon width={11} height={11} style={{ verticalAlign: -1 }} /> {num(pred.home, lang)}-{num(pred.away, lang)}
            {pred.points != null && ` · +${num(pred.points, lang)}`}
          </span>
        )}
      </div>
      <div className={"side" + (aw ? " win" : "")}>
        <Crest team={m.away} />
        <span>{teamShort(m.away, lang)}{favs.includes(m.away_id) && <i className="fav-star r">★</i>}</span>
      </div>
    </button>
  );
}

// ── প্রতিযোগিতা অনুযায়ী ভাগ করা তালিকা ──
function CompGroups({ matches, preds = {}, onOpen }) {
  const { lang } = useT();
  const nav = useNav();
  const groups = [];
  const idx = {};
  for (const m of matches) {
    const k = m.competition_code;
    if (!(k in idx)) { idx[k] = groups.length; groups.push({ c: m.competition, list: [] }); }
    groups[idx[k]].list.push(m);
  }
  groups.sort((a, b) => (a.c?.sort ?? 99) - (b.c?.sort ?? 99));
  return (
    <div className="groups">
      {groups.map((g) => (
        <div className="card" style={{ marginBottom: 10 }} key={g.c?.code || "x"}>
          <button className="comp-h" onClick={() => g.c && nav.openLeague(g.c.code)}><CompIcon c={g.c} />{compName(g.c, lang)}<span className="comp-go">›</span></button>
          {g.list.map((m) => <MatchRow key={m.id} m={m} pred={preds[m.id]} onOpen={onOpen} />)}
        </div>
      ))}
    </div>
  );
}

// ── প্রতি মিনিটে রেন্ডার (কাউন্টডাউনের জন্য) ──
function useNow(ms = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return now;
}

// ── শেয়ার ──
function shareText(m, lang) {
  const day = dayLabel(dayKey(m.utc_date), lang, { short: false });
  if (lang === "bn")
    return `⚽ ${teamName(m.home, "bn")} বনাম ${teamName(m.away, "bn")}\n🏆 ${compName(m.competition, "bn")}\n🗓 ${day}\n⏰ ${timeLabel(m.utc_date, "bn")} (বাংলাদেশ সময়)\n\nখেলা কখন? → khelakokhon.com`;
  return `⚽ ${teamName(m.home, "en")} vs ${teamName(m.away, "en")}\n🏆 ${compName(m.competition, "en")}\n🗓 ${day}\n⏰ ${timeLabel(m.utc_date, "en")} (Bangladesh time)\n\nkhelakokhon.com`;
}


function Stepper({ v, set }) {
  const { lang } = useT();
  return (
    <div className="stepper">
      <button onClick={() => set(Math.max(0, v - 1))} aria-label="-" disabled={v <= 0}>−</button>
      <div className="v">{num(v, lang)}</div>
      <button onClick={() => set(Math.min(20, v + 1))} aria-label="+">+</button>
    </div>
  );
}

// ── দুই দলের আগের মুখোমুখি লড়াই ──
function H2H({ m }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const [data, setData] = useState(null);
  const [state, setState] = useState("idle");
  const name = (side) => (side?.id === m.home_id ? teamName(m.home, lang) : side?.id === m.away_id ? teamName(m.away, lang) : side?.shortName || side?.name || "?");
  async function load() {
    setState("loading");
    try { setData(await getH2H(m.id, m.home_id, m.away_id)); setState("done"); } catch { setState("error"); }
  }
  if (!m.home_id || !m.away_id) return null;
  // জয়-ড্রয়ের হিসাব আগের ম্যাচগুলো থেকেই গোনা (উৎসের সারাংশে মাঝে মাঝে গরমিল থাকে)
  const all = (data?.matches || []).filter((x) => x.status === "FINISHED" && x.score?.home != null);
  const tally = { h: 0, d: 0, a: 0 };
  for (const x of all) {
    const hs = x.homeTeam?.id === m.home_id ? x.score.home : x.score.away;
    const as = x.homeTeam?.id === m.home_id ? x.score.away : x.score.home;
    tally[hs > as ? "h" : hs < as ? "a" : "d"]++;
  }
  const homeAg = all.length ? { wins: tally.h, draws: tally.d } : null;
  const awayAg = all.length ? { wins: tally.a } : null;
  const past = all.slice(0, 5);
  return (
    <div className="sec" style={{ margin: "16px 0 0" }}>
      {state === "idle" ? (
        <button className="card ms-row" onClick={load}><span>{bn ? "হেড টু হেড" : "Head to head"}</span><span className="comp-go">›</span></button>
      ) : <div className="sec-h"><h2>{bn ? "হেড টু হেড" : "Head to head"}</h2></div>}
      {state === "loading" && <div className="card"><div className="spin" /></div>}
      {state === "error" && <div className="card empty">{bn ? "এখন তথ্যটা পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।" : "Not available right now."}</div>}
      {state === "done" && (
        <div className="card">
          {homeAg && awayAg && (
            <div className="h2h-agg">
              <div><b>{num(homeAg.wins, lang)}</b><span>{teamName(m.home, lang)}</span></div>
              <div><b>{num(homeAg.draws, lang)}</b><span>{bn ? `ড্র (শেষ ${num(all.length, lang)} ম্যাচ)` : `Draws (last ${all.length})`}</span></div>
              <div><b>{num(awayAg.wins, lang)}</b><span>{teamName(m.away, lang)}</span></div>
            </div>
          )}
          {past.length ? past.map((x) => (
            <div className="h2h-row" key={x.id}>
              <span className="muted">{dayLabel(dayKey(x.utcDate), lang, { short: true, abs: true })} {new Date(x.utcDate).getUTCFullYear() !== new Date().getUTCFullYear() ? num(new Date(x.utcDate).getUTCFullYear(), lang) : ""}</span>
              <span className="h2h-score">{name(x.homeTeam)} <b>{num(x.score.home, lang)}-{num(x.score.away, lang)}</b> {name(x.awayTeam)}</span>
            </div>
          )) : <div className="empty">{bn ? "আগে দুই দলের দেখা হওয়ার তথ্য নেই" : "No previous meetings"}</div>}
        </div>
      )}
    </div>
  );
}

// ── ম্যাচের বিস্তারিত (নিচ থেকে ওঠা শিট) ──
// ── ভক্তদের রায়: "কে জিতবে?" ভোট (লগইন ছাড়াই, খেলা শুরুর আগ পর্যন্ত) ──
const voterId = () => {
  let v = ls.get("voter", null);
  if (!v) {
    v = (crypto.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); }));
    ls.set("voter", v);
  }
  return v;
};
// ডেমো: ম্যাচের id থেকে স্থির নমুনা ভোট, সাথে নিজের ভোট
const demoVotes = (id) => {
  const s = Math.abs(Number(id) || 7) % 97, base = [40 + (s * 7) % 60, 12 + (s * 3) % 25, 25 + (s * 11) % 55];
  const mine = ls.get("votes", {})[id];
  if (mine != null) base[mine] += 1;
  return base;
};
async function getVotes(id) {
  if (DEMO) return demoVotes(id);
  const { data, error } = await sb.rpc("match_votes_get", { p_ids: [id] });
  if (error) throw rpcMissing(error) ? Object.assign(new Error("missing"), { missing: true }) : error;
  return data?.[String(id)] || [0, 0, 0];
}
async function castVote(id, pick) {
  if (DEMO) { const v = ls.get("votes", {}); v[id] = pick; ls.set("votes", v); return demoVotes(id); }
  const { data, error } = await sb.rpc("match_vote", { p_match: id, p_voter: voterId(), p_pick: pick });
  if (error) throw error;
  return data?.[String(id)] || [0, 0, 0];
}

function FanVote({ m }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const [counts, setCounts] = useState(null);
  const [mine, setMine] = useState(() => ls.get("votes", {})[m.id] ?? null);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [grow, setGrow] = useState(false);
  useEffect(() => {
    let live = true;
    getVotes(m.id).then((c) => { if (live) { setCounts(c); requestAnimationFrame(() => setGrow(true)); } })
      .catch(() => live && setHidden(true));
    return () => { live = false; };
  }, [m.id]);
  if (hidden) return null;

  const open = canPredict(m);
  const c = counts || [0, 0, 0];
  const total = c[0] + c[1] + c[2];
  const pct = c.map((x) => (total ? Math.round((x * 100) / total) : 0));
  if (total) { const d = 100 - pct[0] - pct[1] - pct[2]; pct[pct.indexOf(Math.max(...pct))] += d; }
  if (!open && counts !== null && !total) return null; // শুরু হয়ে যাওয়া ম্যাচে কেউ ভোট না দিলে কার্ডই নয়
  const lead = total ? pct.indexOf(Math.max(...pct)) : -1;
  const names = [teamName(m.home, lang), bn ? "ড্র" : "Draw", teamName(m.away, lang)];
  const result = isDone(m) && m.home_score != null ? (m.home_score > m.away_score ? 0 : m.home_score < m.away_score ? 2 : 1) : null;

  async function vote(k) {
    if (!open || busy || k === mine) return;
    setBusy(true);
    const prev = mine;
    setMine(k);
    const v = ls.get("votes", {}); v[m.id] = k; ls.set("votes", v);
    // সাথে সাথে বারে দেখাই, সার্ভারের উত্তর এলে ঠিক সংখ্যা
    setCounts((old) => { const n = [...(old || [0, 0, 0])]; if (prev != null) n[prev] = Math.max(0, n[prev] - 1); n[k] += 1; return n; });
    try { setCounts(await castVote(m.id, k)); }
    catch { setMine(prev); const v2 = ls.get("votes", {}); if (prev == null) delete v2[m.id]; else v2[m.id] = prev; ls.set("votes", v2); getVotes(m.id).then(setCounts).catch(() => {}); }
    setBusy(false);
  }

  return (
    <div className="fv">
      <div className="fv-h">
        <div>
          <h3>{bn ? "ভক্তদের রায়" : "Fans' verdict"}</h3>
          <small className="muted">{counts === null ? "…" : total ? (bn ? `${num(total, "bn")} জন ভক্ত ভোট দিয়েছেন` : `${total.toLocaleString()} fan${total === 1 ? "" : "s"} voted`) : open ? (bn ? "প্রথম ভোটটা আপনার হোক" : "Be the first to vote") : (bn ? "কেউ ভোট দেননি" : "No votes")}</small>
        </div>
        <span className={"fv-state" + (open ? " on" : "")}>{open ? <><i />{bn ? "ভোট চলছে" : "Open"}</> : (bn ? "ভোট বন্ধ" : "Closed")}</span>
      </div>
      <div className="fv-opts">
        {[0, 1, 2].map((k) => (
          <button key={k} className={"fv-opt k" + k + (mine === k ? " mine" : "") + (lead === k ? " lead" : "") + (result === k ? " won" : "")} disabled={!open || busy} onClick={() => vote(k)} aria-pressed={mine === k}>
            <span className="fv-ic">{k === 1 ? <span className="fv-x">=</span> : <Crest team={k === 0 ? m.home : m.away} size={30} />}</span>
            <span className="fv-nm">{names[k]}</span>
            <b className="fv-pc">{total ? `${num(pct[k], lang)}%` : "–"}</b>
            {mine === k && <span className="fv-me">{bn ? "আপনার ভোট" : "Your vote"}</span>}
          </button>
        ))}
      </div>
      <div className={"fv-bar" + (total ? "" : " empty")}>
        {[0, 1, 2].map((k) => <span key={k} className={"k" + k} style={{ width: grow && total ? `${pct[k]}%` : total ? "0%" : "33.33%" }} />)}
      </div>
      {result != null && total > 0 ? (
        <div className={"fv-verdict" + (result === lead ? " ok" : "")}>
          {result === lead
            ? (bn ? `ভক্তদের ধারণাই মিলে গেছে! বেশিরভাগ (${num(pct[lead], lang)}%) বলেছিলেন ${lead === 1 ? "ড্র হবে" : names[lead] + " জিতবে"}।` : `The fans called it: ${pct[lead]}% picked ${lead === 1 ? "a draw" : names[lead]}.`)
            : (bn ? `চমক! বেশিরভাগ ভক্ত (${num(pct[lead], lang)}%) বলেছিলেন ${lead === 1 ? "ড্র হবে" : names[lead] + " জিতবে"}।` : `Upset! Most fans (${pct[lead]}%) picked ${lead === 1 ? "a draw" : names[lead]}.`)}
        </div>
      ) : open && mine == null ? (
        <div className="fv-hint muted">{bn ? "এক ট্যাপে ভোট দিন, লগইন লাগবে না। খেলা শুরুর আগ পর্যন্ত বদলাতে পারবেন।" : "Tap to vote, no login needed. You can change it until kickoff."}</div>
      ) : null}
    </div>
  );
}

function MatchSheet({ m, user, pred, onClose, onSave, onLogin, toast }) {
  const { t, lang } = useT();
  const nav = useNav();
  const now = useNow(1000 * 20);
  const [h, setH] = useState(pred?.home ?? 0);
  const [a, setA] = useState(pred?.away ?? 0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [making, setMaking] = useState(false);
  const open = canPredict(m);
  const showScore = (isLive(m) || isDone(m)) && m.home_score != null;

  async function save() {
    setBusy(true); setErr("");
    try { await onSave(m, h, a); toast(pred ? (lang === "bn" ? "প্রেডিকশন বদলানো হয়েছে ✓" : "Prediction updated ✓") : (lang === "bn" ? "প্রেডিকশন জমা হয়েছে ✓" : "Prediction submitted ✓")); onClose(); }
    catch (e) { setErr(e?.message || t("error")); }
    setBusy(false);
  }

  return (
    <div className="veil" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="ms-top">
          <button className="ms-comp" onClick={() => m.competition && nav.openLeague(m.competition.code)}>
            <CompIcon c={m.competition} size={18} /><span>{compName(m.competition, lang)}{m.matchday ? ` · ${t("matchday")} ${num(m.matchday, lang)}` : ""}</span>
          </button>
          <button className="ms-share" disabled={making} aria-label={lang === "bn" ? "শেয়ার" : "Share"} onClick={async () => {
            setMaking(true);
            try { await shareCard(m, { lang, teamName: (tm) => teamName(tm, lang), compName: compName(m.competition, lang) }, toast); }
            catch { toast(lang === "bn" ? "ছবি বানানো গেল না" : "Couldn't make the image"); }
            setMaking(false);
          }}>{making ? <span className="spin sm" /> : <ShareIcon />}</button>
        </div>
        <div className="ms-teams">
          <button className="ms-team" onClick={() => m.home_id && nav.openTeam(m.home_id)}><Crest team={m.home} size={60} /><span>{teamName(m.home, lang)}</span></button>
          <div className="ms-mid">
            {showScore
              ? <div className="ms-score">{num(m.home_score, lang)} - {num(m.away_score, lang)}</div>
              : <div className="ms-time">{timeLabel(m.utc_date, lang)}</div>}
            <div className="ms-date">{showScore ? <StatusText m={m} /> : dayLabel(dayKey(m.utc_date), lang, { short: true })}</div>
          </div>
          <button className="ms-team" onClick={() => m.away_id && nav.openTeam(m.away_id)}><Crest team={m.away} size={60} /><span>{teamName(m.away, lang)}</span></button>
        </div>
        {open && <div className="ms-cd">{t("startsIn")} {countdown(new Date(m.utc_date) - now, lang)} · {t("bdTime")}</div>}

        <FanVote m={m} />

        <div className="sec" style={{ margin: "16px 0 0" }}>
          <div className="sec-h"><h2>{t("yourPick")}</h2>
            {pred?.points != null && <span className={"ptbadge p" + pred.points}>+{num(pred.points, lang)} {t("pts")}</span>}</div>
          {!user ? (
            <button className="btn ghost block" onClick={onLogin}>{t("loginToPredict")}</button>
          ) : open ? (
            <div className="card pick">
              <div className="pred-box">
                <div className="pick-side"><small className="muted">{teamName(m.home, lang)}</small><Stepper v={h} set={setH} /></div>
                <div className="dash">–</div>
                <div className="pick-side"><small className="muted">{teamName(m.away, lang)}</small><Stepper v={a} set={setA} /></div>
              </div>
              <div className="pick-out">{h > a ? (lang === "bn" ? `${teamName(m.home, lang)} জিতবে` : `${teamName(m.home, lang)} win`) : h < a ? (lang === "bn" ? `${teamName(m.away, lang)} জিতবে` : `${teamName(m.away, lang)} win`) : (lang === "bn" ? "ড্র হবে" : "Draw")}</div>
              <div style={{ padding: "0 12px 12px" }}>
                {err && <div className="err">{err}</div>}
                {pred && !(pred.home !== h || pred.away !== a) ? (
                  <div className="pick-done">
                    <span className="pick-ok">✓</span>
                    <span><b>{lang === "bn" ? "প্রেডিকশন দেওয়া আছে" : "Prediction locked in"}</b><small className="muted">{lang === "bn" ? "খেলা শুরুর আগ পর্যন্ত স্কোর বদলে আবার দিতে পারবেন" : "Change the score any time before kickoff"}</small></span>
                  </div>
                ) : (
                  <>
                    <button className="btn block" disabled={busy} onClick={save}>{busy ? "…" : pred ? (lang === "bn" ? "নতুন প্রেডিকশন দিন" : "Update prediction") : (lang === "bn" ? "প্রেডিকশন দিন" : "Submit prediction")}</button>
                    {pred && <button className="link pick-undo" onClick={() => { setH(pred.home); setA(pred.away); }}>{lang === "bn" ? `আগেরটাই থাক (${num(pred.home, lang)}–${num(pred.away, lang)})` : `Keep ${pred.home}–${pred.away}`}</button>}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="card empty">
              {pred ? <b style={{ fontSize: 18, color: "var(--text)" }}>{num(pred.home, lang)} – {num(pred.away, lang)}</b> : null}
              <div style={{ marginTop: pred ? 6 : 0 }}>{t("locked")}</div>
            </div>
          )}
        </div>

        <H2H m={m} />

      </div>
    </div>
  );
}

// ── ফুটার (v1-এর মতো) ──
// ── ফুটার: লোগো, পরিচিতি, সোশ্যাল, লিংকের কলাম (সব থিমে গাঢ়) ──
const MailIcon = (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,6 12,13 2,6" /></svg>;
const FbIcon = (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>;
function Footer({ comps = [] }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const cols = [
    [bn ? "খেলা কখন?" : "Khela Kokhon", [[bn ? "আমাদের কথা" : "About us", () => nav.openPage("about")], [bn ? "কীভাবে কাজ করে" : "How it works", () => nav.openPage("how")], [bn ? "প্রতিষ্ঠাতা" : "Founder", () => nav.openPage("founder")], [bn ? "যোগাযোগ" : "Contact", () => nav.openPage("contact")], [bn ? "গোপনীয়তা নীতি" : "Privacy policy", () => nav.openPage("privacy")]]],
    [bn ? "লিগ" : "Leagues", comps.map((c) => [compName(c, lang), () => nav.openLeague(c.code)])],
    [bn ? "ফিচার" : "Features", [
      [bn ? "ম্যাচের সূচি" : "Fixtures", () => nav.go("matches")],
      [bn ? "প্রেডিকশন ও লিডারবোর্ড" : "Predictions & leaderboard", () => nav.go("predict")],
      [bn ? "বন্ধুদের লিগ" : "Friends' leagues", () => nav.openFriends()],
      [bn ? "দৈনিক চ্যালেঞ্জ" : "Daily challenge", () => nav.openDaily()],
      [bn ? "স্পোর্টস কুইজ" : "Sports quiz", () => nav.openQuiz()],
      [bn ? "জিজ্ঞেস করুন" : "Ask", () => nav.go("ask")],
      [bn ? "দল ও খেলোয়াড় খুঁজুন" : "Search teams & players", () => nav.openSearch()],
      [bn ? "প্রোফাইল" : "Profile", () => nav.go("profile")],
    ]],
  ];
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand"><Logo size={44} /><b>খেলা কখন<span>?</span></b></div>
        <div className="foot-tag">{bn ? "ম্যাচের ঘড়ি আপনার হাতে।" : "The match clock in your hands."}</div>
        <p className="foot-desc">{bn ? "ইউরোপের বড় পাঁচ লিগ আর চ্যাম্পিয়ন্স লিগের সূচি, ফল, টেবিল আর গোলদাতা, সব বাংলাদেশ সময়ে। প্রিয় দলের খেলা, প্রেডিকশন, বন্ধুদের লিগ, লাইভ স্পোর্টস কুইজ আর বাংলায় যেকোনো প্রশ্নের উত্তর, এক জায়গায়।" : "Fixtures, results, tables and top scorers for Europe's top five leagues and the Champions League, all in Bangladesh time. Your teams, predictions, friends' leagues, a live sports quiz and answers to any question in Bangla, in one place."}</p>
        <div className="foot-social">
          <a href="https://www.facebook.com/khelakokhon" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FbIcon /></a>
          <a href="mailto:khelakokhon@gmail.com" aria-label="Email"><MailIcon /></a>
        </div>
        <div className="foot-cols">
          {cols.map(([h, links]) => (
            <div key={h}>
              <h4>{h}</h4>
              {links.map(([label, to]) => typeof to === "string"
                ? <a key={label} href={to} target={to.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{label}</a>
                : <button key={label} onClick={to}>{label}</button>)}
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span>{bn ? "© ২০২৬ খেলা কখন? সকল স্বত্ব সংরক্ষিত।" : "© 2026 Khela Kokhon? All rights reserved."}</span>
          <span>Crafted with <span style={{ color: "#e53935" }}>❤️</span> by <a href="https://www.fb.com/mahbub.tonmoy.71" target="_blank" rel="noopener noreferrer">Mahbub Hasan Tonmoy</a></span>
        </div>
      </div>
    </footer>
  );
}

// ── ফুটারের আলাদা পাতা: আমাদের কথা / কীভাবে কাজ করে / প্রতিষ্ঠাতা ──
function InfoPage({ id, user, goProfile }) {
  const { t, lang } = useT();
  const A = ABOUT[lang === "bn" ? "bn" : "en"];
  const back = <div className="page-head"><button className="back" onClick={() => window.history.back()} aria-label="back">←</button></div>;
  if (id === "founder") return (
    <>
      {back}
      <div className="sec info">
        <div className="founder">
          <img className="founder-photo" src={DEV_PHOTO} alt={A.devName} width="120" height="120" />
          <h1>{A.devName}</h1>
          <div className="muted">{A.devRole}</div>
          <div className="foot-social" style={{ justifyContent: "center", marginTop: 12 }}>
            <a href="mailto:khelakokhon@gmail.com" aria-label="Email"><MailIcon /></a>
            <a href="https://www.facebook.com/mahbub.tonmoy.71/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FbIcon /></a>
          </div>
        </div>
        <p>{A.dev}</p>
      </div>
    </>
  );
  if (id === "privacy") {
    const bn = lang === "bn";
    const parts = bn
      ? [["কী তথ্য রাখা হয়", "Google বা ইমেইল দিয়ে লগইন করলে আপনার নাম, ইমেইল আর প্রোফাইল ছবি রাখা হয়। আপনার প্রিয় দল, ম্যাচের অনুমান আর বন্ধুদের লিগের তথ্যও জমা থাকে। লগইন ছাড়া ব্যবহার করলে কোনো ব্যক্তিগত তথ্য নেওয়া হয় না।"],
         ["কেন রাখা হয়", "শুধু আপনার দল, অনুমান, পয়েন্ট আর লিডারবোর্ড দেখানোর জন্য। লিডারবোর্ড আর বন্ধুদের লিগে অন্যরা শুধু আপনার নাম ও ছবি দেখে, ইমেইল নয়।"],
         ["ফোনে কী জমা থাকে", "ভাষা, থিম, সাম্প্রতিক খোঁজ আর এমন কিছু পছন্দ আপনার ফোনের ব্রাউজারেই থাকে, আমাদের কাছে আসে না।"],
         ["কারও সাথে ভাগ করা হয় না", "আপনার তথ্য বিক্রি করা হয় না, বিজ্ঞাপনদাতা বা অন্য কাউকে দেওয়া হয় না। তথ্য নিরাপদে Supabase-এর সার্ভারে রাখা হয়।"],
         ["তথ্য মুছে ফেলা", "অ্যাকাউন্ট আর সব তথ্য মুছে ফেলতে চাইলে khelakokhon@gmail.com-এ ইমেইল করুন, দ্রুত মুছে দেওয়া হবে।"]]
      : [["What we store", "If you sign in with Google or email, we keep your name, email and profile photo, plus your favourite teams, match predictions and friends' leagues. Nothing personal is collected if you use the site without signing in."],
         ["Why", "Only to show your teams, predictions, points and leaderboards. Others see just your name and photo on leaderboards, never your email."],
         ["On your device", "Language, theme, recent searches and similar preferences stay in your browser and are never sent to us."],
         ["No sharing", "Your data is never sold or given to advertisers or anyone else. It is stored securely on Supabase servers."],
         ["Deleting your data", "To delete your account and all data, email khelakokhon@gmail.com and it will be removed promptly."]];
    return (
      <>
        {back}
        <div className="sec info">
          <h1>{bn ? "গোপনীয়তা নীতি" : "Privacy policy"}</h1>
          <p className="muted">{bn ? "খেলা কখন? (khelakokhon.com) আপনার তথ্য কীভাবে ব্যবহার করে।" : "How Khela Kokhon (khelakokhon.com) uses your information."}</p>
          {parts.map(([h, d]) => <div key={h}><h2>{h}</h2><p>{d}</p></div>)}
        </div>
      </>
    );
  }
  if (id === "contact") {
    const bn = lang === "bn";
    const topics = bn
      ? [["মতামত ও পরামর্শ", "সাইটের কোনো অংশ ভালো লাগলে বা কিছু বদলানো দরকার মনে হলে জানান।"],
         ["ভুল বা সমস্যা", "কোনো সময়, ফল বা নাম ভুল দেখলে, অথবা কিছু কাজ না করলে লিখুন। কোন পাতায় কী দেখছেন, সম্ভব হলে স্ক্রিনশটসহ।"],
         ["নতুন ফিচারের অনুরোধ", "নতুন লিগ, নতুন সুবিধা বা অন্য কোনো ভাবনা থাকলে জানাতে পারেন।"],
         ["সহযোগিতা ও বিজ্ঞাপন", "যৌথ কাজ, স্পনসরশিপ বা বিজ্ঞাপন নিয়ে কথা বলতে চাইলে ইমেইল করুন।"]]
      : [["Feedback", "Tell us what you like or what should change."],
         ["Errors and problems", "Spotted a wrong time, score or name, or something not working? Tell us which page, with a screenshot if you can."],
         ["Feature requests", "New leagues, new features or any other idea."],
         ["Partnerships and ads", "For collaborations, sponsorship or advertising, please email."]];
    return (
      <>
        {back}
        <div className="sec info">
          <h1>{bn ? "যোগাযোগ" : "Contact"}</h1>
          <p>{bn ? "খেলা কখন? একজন মানুষের হাতে বানানো আর চালানো সাইট। আপনার মতামত, প্রশ্ন বা ভুল ধরিয়ে দেওয়া, সবই সাইটটাকে আরও ভালো করে। নিচের যেকোনো উপায়ে লিখতে পারেন, প্রতিটা বার্তা পড়া হয়।" : "Khela Kokhon is built and run by one person. Your feedback, questions and bug reports all make it better. Reach out any way below; every message is read."}</p>
          <div className="contact-cards">
            <a className="card contact-card" href="mailto:khelakokhon@gmail.com">
              <span className="contact-ic"><MailIcon /></span>
              <span><b>{bn ? "ইমেইল" : "Email"}</b><small>khelakokhon@gmail.com</small></span>
            </a>
            <a className="card contact-card" href="https://www.facebook.com/khelakokhon" target="_blank" rel="noopener noreferrer">
              <span className="contact-ic fb"><FbIcon /></span>
              <span><b>{bn ? "ফেসবুক পেজ" : "Facebook page"}</b><small>facebook.com/khelakokhon</small></span>
            </a>
          </div>
          <h2>{bn ? "কী নিয়ে লিখতে পারেন" : "What you can write about"}</h2>
          <div className="contact-topics">
            {topics.map(([h, d]) => <div key={h}><b>{h}</b><p>{d}</p></div>)}
          </div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>{bn ? "ভুল জানানোর সময় কোন ম্যাচ বা পাতা, আর কোন ফোন বা ব্রাউজার ব্যবহার করছেন লিখলে দ্রুত ঠিক করা সহজ হয়।" : "When reporting a problem, mentioning the match or page and your phone or browser helps fix it faster."}</p>
        </div>
      </>
    );
  }
  if (id === "how") return (
    <>
      {back}
      <div className="sec info">
        <h1>{A.howH}</h1>
        <div className="steps">
          {A.steps.map(([h, d], i) => <div key={h}><span className="step-n">{num(i + 1, lang)}</span><b>{h}</b><p>{d}</p></div>)}
        </div>
        <h2>{lang === "bn" ? "পয়েন্টের নিয়ম" : "Scoring"}</h2>
        <p>{t("rules")}</p>
        {!user && <button className="btn" style={{ marginTop: 16 }} onClick={goProfile}>{A.cta} →</button>}
      </div>
    </>
  );
  return (
    <>
      {back}
      <div className="sec info">
        <h1>{A.whatH}</h1>
        <p>{A.what}</p>
        <div className="facts">{A.facts.map(([b, s]) => <div key={s}><b>{b}</b><span>{s}</span></div>)}</div>
        {!user && <button className="btn" style={{ marginTop: 18 }} onClick={goProfile}>{A.cta} →</button>}
      </div>
    </>
  );
}

// ── আইকন ──
const I = (d) => (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);
const SparkIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5 4.6-.5 7-2.9 7.5-7.5z" /><path d="M19 15.5c.2 1.9 1.1 2.8 3 3-1.9.2-2.8 1.1-3 3-.2-1.9-1.1-2.8-3-3 1.9-.2 2.8-1.1 3-3z" opacity=".85" /></svg>
);
const TrophyIcon = I(<><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M16 5h3v2a3 3 0 0 1-3 3M8 5H5v2a3 3 0 0 0 3 3" /><path d="M12 13v4M8 21h8M9 17h6v4H9z" /></>);
const BallIcon = I(<><circle cx="12" cy="12" r="9" /><path d="m12 7 4 3-1.5 4.5h-5L8 10z" /><path d="M12 3v4M21 10.5l-5-.5M18 19l-3.5-4.5M6 19l3.5-4.5M3 10.5l5-.5" /></>);
const TargetIcon = I(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
const UserIcon = I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>);
const ShareIcon = I(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>);
const UsersIcon = I(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c1-3.6 3.6-5.5 6.5-5.5s5.5 1.9 6.5 5.5" /><circle cx="17" cy="9" r="2.8" /><path d="M16.5 14.6c2.4.2 4.2 1.9 5 4.9" /></>);
const QuizIcon = I(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" /><path d="M9.8 7.6a2.3 2.3 0 0 1 4.4.9c0 1.5-2.2 1.9-2.2 3.1" /><path d="M12 14.2v.1" /></>);
const ReplayIcon = I(<><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" /><path d="M3 4v4.5h4.5" /></>);
const PlayIcon = I(<path d="M8 5.5v13l10-6.5z" />);
const SearchIcon = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
const SunIcon = I(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
const MoonIcon = I(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />);

// ════════════════ pages/Home.jsx ════════════════
// ── খেলা কখন? কী / কীভাবে কাজ করে / ডেভেলপার ──
const DEV_PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBAUEBAYFBQUGBgYHCQ4JCQgICRINDQoOFRIWFhUSFBQXGiEcFxgfGRQUHScdHyIjJSUlFhwpLCgkKyEkJST/2wBDAQYGBgkICREJCREkGBQYJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCT/wAARCADwAPADASIAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUCAwYBBwAI/8QAPhAAAgEDAwIFAgQDBwIGAwAAAQIDAAQRBRIhMUEGEyJRYXGBFDJCkSOxwQcVM1JiodEI4RYkQ3Lw8YKisv/EABsBAAIDAQEBAAAAAAAAAAAAAAMEAQIFAAYH/8QALBEAAgIBBAEEAQQBBQAAAAAAAAECEQMEEiExQQUTIlFhFCMycQYzQqGx4f/aAAwDAQACEQMRAD8A8m8S/wBo+oavI6b9qZwMVkptRkl65z7k0MTmo0zPNKbtsHg0uLDHbjVFpuGznJou1vnVwCxxS+vgcVWM2naDtWbyxIeEODn3qxs+YCpI+lZTT9alt8IenStLZXK3O0inYapbrYN5pYsdP7GYd4EEgOSK+j8Qyo2GB+1WXe1bbqBxSVmi/wA4FW0ywyvcjWl6zqNM4rHKjUW3iSNuGOPrTSDU4Zh+YVgdy9pB+9RW+EUm2O4Jb2TJquo0mnq1Kjf0P+XahcZY2j0djHMv5hWU8QT2djOPMlG72HJoFdYu4V5bI+Tg0BDKk92bq6Kl93Cnoo7Vj5tPFPh2aes9dw6rGoxjT/Pg0EGsIIEkazuUj7OU4NPbLVba5hBhkVvjvSiPVYpolQEMo60nvr6Kzn8yAHaevOOc/wAqqsTXgYx+pLSP3FJSj5+zaOY5Vw6A5pRf6JZz8sFAPTIrJ3es3f40XUczooIAjU9BxkURLHLeK93JdS28DEhMsS5rtriEn69g1EZRWPdX39ff4C5vDFq+4QuNy8+k0Guh30MmIZ3x2zzQTyTWHlNt2E5IlHX71ODXfJO+aZ3OegJ5H9DU7peOTLer0m9bobH/AHQ5t31a04kAYe4p5pMzzDLjDVm7bxrZxqYpYbmRex280dpvijTGnw0jQZPHmKRQ5J90a2n1+m9yG3Na/LNScV0VTHMkyh43VlPQg5BqwGus9SmnyiVdqOa6DXEn2BXCtdrtScQKmuYIqyuEVBxHNcaNH6qKngV8BXWRVnhJNcr419Th8Go4a5mvs1yuJR3NOdO1L8LFknkUmHWpHJGKlOis4KapjS91+6ufSHIWo2q3EyedJKYoQcbz1P0HeqtN05rqQM4Plj370+FnFMVkcEqnCL0A+lUlOuhiGLdyymCzE6b3ZooB/mPqapy6lBZJ5duoUY645q6ZFeTZuO1eAq/1qBsYIxudUQH4yTQ277Gar+ItOqXMzfw0kYfI4qX42Rhygz7Z61fJ5ZBVC5HsxxQEyAHhVI/93NSijbXkYw3JismaLIJYnrQL6g0qlX4NdhcLblRxnI4NLdrGQBc8noatFvoiU2lwOLZvMYlj6R3+auku3ZQqMSF4XuBQEkpijjiX8xGatjkRAFZj/wC0f1qL+yYzceEXiLcCzlnP1qOZOdlsR/8AjU1uVJA6D9K0dFO6ryuz5JxUNl6vyCRTY/xYgAO+MVZNcxz8FgCfcDmozzlmPIb/AHoSSNDyANx/2qG7CRk4qky7T9XvdAusxMzwk5KHlW/4Nej6bqMWpWkdzCfS4z9D7V5cJjGNrcj2IpvoGvjSZSCuYX5ZR0+oqk43yjf9D9Zeln7WaXwf/H/h6MDX2aHsruC/hWa2cOjDt2onaaDZ9EhOM4qUXaZ9ur7dXMGvq6yx9k19uNczX2amzrJbqlmpQWs1w2Io2b6CnFn4XuZcNMwQe1XjGUuhbPrMOBXkkkfm6uGu1w02fDzhrmK7XwriUWwxNKwVRkmm0GkiNN9wML/M+1T8MWIuJmlf8qDNML0i4vNzNtih9+mfahzsbwKO1yfZUziJFRE6AYQdz2Bo2OCQQAkrvI6d19/pS43KJJtiVnkY545Yn+gomW5ltIt0xUyEemNei/X3NVZeISkSQqXZgvcnNC3Nyh/wwX++aCEFzdnzrjcI/wDVwD9qhNcx2ylY9ufgVFHOZyW4cZBQY+aAmuBk4xXJbiSYnAJFUNE5HrUD+dXSASm30SW46rnj618koDF2J46CqWUdAKsMZwO4+Kkomwlptp345wAp9qlBmQ+o4B9hzVH5gBg5HSpNuUetiB7Cql0w7zGtz/AiDP8A5m5NWI12+HmcIv8Aq6/YUsW7MIIjAGe55Nd/Fs5/McV1Ft6DZrpIiVQkk/vQxaWU7icfeuZTqEzn5rpZlABAHsBXEOTZMSsBtf1j561HeCp2HFVPME471FGRunBNdR3ueBzoGvTaVdKyk7GOGTtXoVtr8Myg7hzXkhBByp6dvatFptwZ7ZcnleKY0+GGWWyRsaD13PoobY8r6PRo7+GT9Qq3ejjg1g0mmiPpdqPs9Ru3lSNAXZjgAd6Pk9HfcWeg03+YYpcZYtGrWCSRgqAkn2rQ6T4Z3AS3Z+dtEeHNHNrapNdAGZhnB7U83cUgtOsb+XIXXetSn8cDpfZyCCG2ULFGoA+KIBJGaHLEdBXUnJ4IxXSmzAlJydtn5IrhqboVJqBoh5iiNWQRmWVY1BYscACoYpvotrhZLjHIG0H29zXNloq2M7KP8HaeQjEAcyuO/wACqIjJdF2/LApzk9z8VNEaaRoQWAIwf9IP9a7fsFhEFuCEXjihsYVIrjuEhYJAoyxwW7mi2KI3mzEEgftQOY7NAduZOgHtUgcD+IP4h5IJ4Uf81UJdHZJZ75sQqce56Vz+5P1Tu7N/lFSXU4YCSWLf6V4FU3GuMw/hxBfvmpKNrySmt44BgIEA9+TSqdw77UyxPGa7PcS3D+tiSewrqQ7Mov5z1PtUopKV9FXlFsKvTnn3NE21rOzbUBOcdqL06wedwAM44Fbiw8P+SpLRbnRcDHvQp5do1h0u6mzHnTJVQF8q3sB1oGfTG5IDH616QNFLrukTntS660je5AUfXtQPfHXok0edyWjoelffhnxxxW3m0BcHAyaAm0N06LiirOmLy0LXRm0ideh+9dkkCdMM3vTOfTpF420uuLJhkkc9jRYzTFcmCUANniZvUCPmuPFgZQ5HxUHDI2GH71JSyZHbrRBW/slFKTweCK0Ghspib3BrOnH5x2rff2OaXb654vjsLlN6PC5HGQGGCM1D1H6dPLXRGRvY6CLHRL7UMfh7aRx744rceC/CBs2N7fJiQflU9q9QfQLTRbNiERWIwMCkbkDgdKtpfWs2qhJuO1B/S8TyP3J+D7zM/SukgDOaq3DFVSTDb6TzQ5PyboT5gQZNVPIOoNDGQsvqPNVqGz1OKG2dR+dbmxG84oY2Ypi+SapZCTU7mCeix90CpYh2CjPJ6Cm0qrZWqRR4yOny3cn6VXZRBd8zcBRgfFdnPnXQQ8KoyfpV4u+zP1EIwltiXxkWenmQnMkpwPcmueWsKlTy6j/9jUinmyQDOVjy5+MUsS6dRJIxJZ2qWARZIfKl8xhu8scZ7mgmkkkJyxBY5J96tEjSjLZHPQ1LaigeYuR7d65IhysHOFGWBH0rigyHCkAewFEjywMoGx8mq2kZlKoNoPU+9cVoixSD0oA0p6n/AC0Tpli9y+ACxY84r6y0+Sd1jiTc78AfFek+GvCkdlGkkhy3VnPAzQsk6VIa0+Hc7fRLwt4VESpNOgGeQD2rSWFmZ/NuET0EkLn9Q96Mht/xKCGIHyjw79Mj2FM1g8kCMABQAAB0ApOX5NaLXgTNa5jCsAT0I9qok0+Jl24XNNJ09WQfrVJjUc9/egsaXQkn0odhQs2lIy4IFaF4QQef96ElhAJ5OKsmc42ZO80UKTgZ+aSXulDBBQA/zrbXC4HI4pRdRnOCuQe1XjNp0CniTR5vqunGJt23pQbx79x/0Vs9UsxJG2FzWSnHkTOuMArjBp7HO0YeqwKDsXp05Ne1/wDTJojX/iLU70KwNtbAI/bJbkftivFcYr3v/pr19dO0zxBA/LjyzEPYtw3/APIoetjKWJxj26/7Edrl8Uena7qBnmMQb0xkj70mOPepzyGR2c8ljk1STV4JQiorwbuDGscFFEJBxxQcjlH3Y+tXyyY5oeRtymusMWbg+DU2xGuTS+2mKTGFz16Gr7y4wVjXn3rmcnZ4KWqJK9TUPNFcLgjJ61Ay5hUeGt35GAwB/nVEswlmJTgbQWPsAKimTbyID/iMqjPY8/0odg3KDqzAce1Fj0YOsf7rDYpisO5eODmgLX+LIQenQUa5KxmPgAfzoCJzbJKy9SePipoXb6OqViZlY8g8Grgg4aQ/Y1RBL5uGCjeTjOKkoeVjk4A4LHuakraLHHmcDgZq61s5LqVYYF3u3Ax0H1qVva72A5Y1uvDOji2jVvLBZs+rHU/8UOc1EYw43NlmgeFVgVQcmQ43ODg//VbKw0qNHXzPXju5JqFnAYlHAzTKIqFy3SlHO3wasMe1Uw1MIu0AcVGX1d+aBk1a3jfb5qdOSTwKpXX9OU7TcoW69e1Ukm+i8Wl2wqZRig5U2nPIFSk8SaUWEYuYWfpwaGn8QaYh2yXEYPcZoLjJsbhkil2XpyvUmoSRZP1qq31Gzuf8GQEfB4plbmGTGarXgK5LtCWezLHj9qW3FnIjAhSQO2K2FwtnGudw4FIL/WbCHJMqrjualKV8EvJCueBBd2ttOuMbW71ifE2iFGaeLBx129612p+JNKYn+IhPutI5tZs7ljFvBDcAmm8O5c0I6l4MsdlqzAtxg16n/YblbjVWDfojGPua811GAQ3ksY6ZyPpXoX9isgTVb6PfhngBC+4Df0yKevgwtPGstM9hZ898VWzEV8QT2qDBloDZrEH56iqHBxxV0kuPzr9xVJZW5VhUFkwK6RsBk4ZeQa7HOJ4w54bv9aukIOcigh/DkPYGuTK9M8Nr5uRXMiu5A96kImW2+X2oB0O6pWww7uQMhiBVcDBSxOeRir36bAcY6n570WHRkar/AFGDXDl9qg8sc/aq7hQIdi8u2P50VKqbhtGCf9hQ2cyux7HirCxK3iCyMVHpRdg+vc1YoXDHnbGMDjqalAmyI84J4qe0CGNO7NuNcckMtKhJZMgbjyPrXqOmWXkwIMZO0Vg9CgEs0MioxEfLAV6Vp0glhBWN1UDq64JpLO7ZsaSKUS0Msa88YrO63rkwkMEQKjGMDqf+Kf3aSzAiPauOMn+lALYW0GTIilupJoHuKPY28Up8Ixl1NqLRnbA5XvgUpnh1KUZ2MqkccVvL7UbWL+EAGY8BQMsftSDUbm92kpZvGvvJhP50SOeT6QKejgv5SMdNaX4JDZz1rsVldn1HdmrrvVJopDu8ph/pbOKNsbzz1DLRJZJpW0Bx4MMpUmNtBaa3dV5GcVsReNFEvNZrS7eWdlKLTbULO4jg3ergUjP5OzWxpQjRTquqsInAfkjpWA1SS7nkY7jjsKY6hdStKY8nOaDVXlciNDKR154FMYE4dCWqccnDFIsLqc8KTVx0O6UcLlqcmSe1X1i1T4MoBqUWrRh/LlGCeRzkH70w8s/oTjpsL88mP1BJEkHmD1rxzWj/ALN9T/uvxXZOMBLjdC2T/mH/ACBS7xKqyOkyAAEleKh4XKJrunM7bQLhCW9uaYi90bEXF481H6R27hVTB175HtRMeHQEdMVGRMdMUKjVA2G7ofsaGlhJ5Awfii5Uz1OKEeOQcrIaiiQZgyk7qHuOR7GiZHmXsrCh5JgfzoBXHPk8HANSANXM6A4FQLqoJpt4UuxNaht0jiNtLHoQM0QoJQL+pmyaDiJMu49OlMbaMyJuB9zmquNdCWWe6VspjGTIzflXih8+pRjknNESLshKKMsSNx+tU+WwnVSDxXAiySXA2gc9M+1dQktwDgVx1xMygekMCD9qth9KZxwe9QSb/wAG2zNa+YoUFmwSea3cCYUDPHSsh4TxHpyDGCea2tkFZFz25rNyu5NG9p41BM5cQblynH0rPapb3jZWFC7dgK3VtDbRoTIoJoiO2gCNJ5SAkdcUFY1dtjHvOKpI8l0uz1JbkpKG08d5ym9j9+1PNY8J+GLjSZ5Dq8l1e+WfVJJzu+BTzVbWeNme3VHB6DPNZa+ivZGObMk+/FHhmp8IFLTe4rcjya802Z7kBYpSoO3dswMVoPCtnw6zxSKF5DkcEe1aJtA1K9kwIhCvck040zww8XoLEr3Zu9XyZ9y5BYtGscriy/SYI4WRlXCDuaeaixu7UhY1A249I612DSDvCAYVetN4raIRmNh8Ui25GinGNN8nh3iCyntbxwqMzOeMd6e+GND0W4gDanfSI+P8LYVX9/en3i/R1Kl9ucdx2rIpbXmMQTbj/lbvTeLJcfyK6jT1K/DFXj3SdOttUB01hJA6rgoMgEdQaQ2VtKJsIpKjnFaqeC+dtslmT81ZFZuhzIgB9hTCy2qEv0a3WmZ/VrRn01nKkbSDQvhzCaxZM/RJlJ/etXfWQmspI8YyCMVm/DaH/wAQWKFc7plBGP3ouN2gOqwuGSL+z9D28Yhj2oPQRkDPT/tXzEd6+iBSFFJ5CgVB8mqscISH70LIynsaudviqJAT0FcWRRIM9KHkUMOVzV8gk7AChpEkJ5Y/aoOPBohkkmrDHvI9qshh9OTViKuevStCrZkwg1H8sr/DbADnk030G3Et7aW2Awc8jPb2paWDP9KO0+5/Batayk4CyKft0oWaNR47IqKmvqwiz0/8ZPJlcEyEADtg0xvtCht7ZXyWlyCw24ptoNiYfEk1s35PNMqn4YUw8QaraWMjokaSMuRtasqWWSZtx0+NpqjE3OmN+HLKmSeB9KAQFYtnACn9q1WntPfRrJLCqb5PQqj9PSgPFOn/AIC+DRoNkigt9aYw5m3tZm6vTKK3RNP4bc/3bEc85PStzpJYhcYII71514YmP4NY24Kk4rdaXdbIkI9qUycTdmjh+WNUP0gZpQOue1NI7dggU+mk1vfDIppFdmXjOR25qiSZeVpciu7t3jlJ5yep7Gg3XB5UZ+lPrlFEfrGTSyaMITmgtNMbxuMkCQW6SODJ+XPNOYbWBYBsC/XvSQXsPls0ZzgkH4q2zuprlSdxCZ2j/VVop3yDyxtcBrHBO3A+a7b25lbIJarLewaUFpTtHbJ6URHc2VkwXzt574qO2dSivtizWtHMkLB04Ye1eevYGzvGiPvlTXqOs63CVJC5TbgZrzzU7uC4uwQdrVaNXQZO4ptFkMCuu11z80HqOmqrB16fSmVjOjqFJAIq24jWRMda5Npl1ta6Mtc2+ITimvgjwnZCQawRuk3OAD+kn/5/vVV/b7FPFOfBEv8A5S5hz+WTOPqKdwTvgR1UU6b8GjbgVSzYqxmzVLkUcVKpGz3oaTJHLNVz0PI3GDXdnFLL7Mf3qhgw5DkVZI2KoeT5qCTxdlKjAr4IVXPvXUUu2K7KpHHtWjzwjJdcyo5DHubNXXCllR0OCGBI/eop6Ez3qCyCT0dcjFVlzyVyJKKVHoeh3YvItN1Rcb0/8vPj3HTNA67pcj+K0tHb+HcONpPQg0H4E1GM302mTnbHdr6fhx3FbN9NGoNHHfxHzLZh5UqnBP3rGzR2TNrS5vcxp+Tt1YxaPqECSgBEPlKF6Af/AHWf8dqm9GwMcA1o7/TCZ0uGmedACGjdsY+hrM+NFJtopD+ng1XA/nZGqX7bKvDsmYgF9sg1sdOmymB1HFedeH9RWGXGeOg5rb6bdq4yp6812pi7O0eROJooHZec0yt7vYRlsUgjueME1dFcFSSWyOwpVWmPUmaOfUg8Z3cYH70pur85znrQ34gMCf50FdScE/tVm75JhFRITXLTP5cZ5Y9BTRpm0y3t3ZSEUncfmhtAsRNMZXU4HArVTwwGEq6Ky4wVI61avsrkyJNUef8Air+0C7gtzDpkDTzsOAOgrK6Nr3jR7gz3FoHh/MVkG3I+K215pWj21400YUMf05xigr+a3mhCE7cDGRRoQio01YtkybpKm0Bap4ll8oeYrR+nJU9R8Vjf71vrvUBKf4aE4WMj1Ee9NLuxkVDK8hcg+lTS6C9jt7sPNGNwOCfarwxKKK5NQ5SSfRr9NeWKNC5wfY0xN56Rg/vSqC7huYwY3Df0NRac52ngil5IdjILvp8xk5q3wXeBbu5gyAzgMPtSa4uD5bLk0Bo+oSWviOyKbcncDu6YxTOnQpqZ0j1otkdqpepqR5SOSAGUGqJGBztphsAiuRhQssgOc1ZIxxihZGqVZJByD0NVM8cYy1fOc9K+isGnbJzUnHj9scEnFcd971yLAjJrsIBfk07uVtmdUnGMb7K7qQxqF71XCSoHHOc1y5YS3G0dBV0cXtXRS4KT3OTotgm/CzJdLlWRwwI7V7do+o2GqWMM6HO9Qc5rw+UYyvbFW6Zr2oaJk2khaPPqjboPkUlqMPuK4jODItNL59M9tazEkzMzDyx0FYbxbdJctdW6FTsUMo+M1nrn+0q/ktyix7SRjOaW6Dqct7eTCc5lkBH2NK48E48say6zDNbIu2we3Z45wuSAGzWx0m5eFE2nORzWXuIUjuiobAzWg0uQeWpUZPYkUbNyrE9NcZUaeC7bcOg496Ywy7xnOaynnNCy+vHqpxZXe4H1ZGaRnDya2LJzQ8WTdwMgV3yN5BIzQ8DbsZop5hFDvJwBVYhpPjgtn1mDSQsW71EdBQS67cahExWXaob8xPAFYfWdYM1wXYkruPTrili6/PeP+FgJWPptU/m+tN+3wZ/upvlnovm2Mkgd2N1MOuDhf3q+e8iVMG3tVB/TtzWU0XSdS1JGaO5jgRTjrk5p9F4G1KeFZW1DcCOPTVHD7GIZIohd3sYiUQ2duueNxOR+1Z++tYXl8yURSN7AYp8/gu5K5/vBtykjGOKyHiCzl0tJJDfROytgpuwatCPPBGTJGgWaX8FIZreRlAPKE9KcQagl/CsoPqxgisU2om6cBSTkUy0Wd47nZyFPaizx2uROGoqfHRoJ5PQc9qz4vGXWrcqzDDADHXrTTUJxGpyaWeGLf+8PEMW5NyRtvb7dP96nBGuSNXktqKPaLZXNvEJWP5Bx7cVNuFFWw27NAjsQq47mq5Z4VOEBkar0FQNKpPbih3XdwOaMSGe5OAuBX1zcWWkJumdXk/yirElUOncb5fSvzQ+oa5aacnlxeuTtigbnU7/WH2W6tHGe9X2mhRW+Gl/iSn3rv6OPGY1Pl11QUjZ6sziICqrqXEYjHemrdf2Z9RTtvpA0KlnLU2R4/wAOAq+r3oKABR0o0EJFgDk1eTaiV0+NOV2BSllznqaHkVlj3CjJ8F8VTcshjCgc1R8RSrstlgpuTvoUvIWNXWF2bS8jmHGDz9KocHfjHWonOcUN8iCbTs1d6EkmEijIIB/70dptwwXG8g+3xSW0vt+nouAzx+n5xV8NyYgr54zzQZRtUO48ny3I1U0XmQpIjeoY+9W2MkmFJGCDgj2pVYXeVwxJXAKnNNoCojyg5zk0lJVwakHfKH1vcAHB6Dv71LUbndauiZyRgUujnyuSe1WFjKuMmg1zY0nwJrXRkuJWDjKtwfpTnS/B2j2UhmWCN936Ze1EW6pGnpHNSlndEx+ZfpzR1kYv7UexpHbaPGoiFr5IXkbDwKLVNOUei5lAYdA3SshPqUsIOxuPZqXXPiYxDHljPwamtweOSMf5G4ey044U3UzKvON1IdWsvD0JLCDzX6+vmsy3i6ToFPNCSajJduW28nuatGDRE9TjS+KLLq2tpJ2khhC54UAdBQaQLDOGIwfaj7dT1P8AvVdyoLFvartvoSdN7hbqd1kcnmj/AOz5X/HzyLGHLoQM9c//AA0g1ObLEL1Nbb+y78GEmju28mUnep7sB2HzTEIvbwJbt2ZG/sIbm5j8qZydnAAPWjJVs9OjzPIoI/SOpoY3sjqYdOg8qPu+OvzVUWlpI+6eUSyfLVVD6KbjWbu8zFYxeVH03EVC10AzHzbpi56ktToRW9rHltvA4UVSvn6g+1AUjHYVavskrVY4v4NsmfdqsIS2Uu5yR3q2Ux2MflqAZDSmZpL+UQpnaOpqGSeYNo1lKAIr0ce+KGk8Lyu+9LiNh80PPAIxlTVKyzLwHYfQ0XezOc4vhxDhoF0hHCsPg19LYyxfmjbAoJr29h6Tv++arGs3ucM+4fIq0sjl2TjzY4J8EJInaXlSPqKHuAQ2DR66vKpBaNWrjX1tO2ZoMZ9hXOfNg1slFpPlip7fcM1Q0WSelaRYNOuYtqTCN/k0pvrLyXIB3AfqHSq3YPNiUUnEr0wbWdG/K4x96IGYYyjZx2NLw0kR4JBznNO5LQXVulwrHLLx8/FUlXkpjTa4JWl75ahd3HStJpt0HiVSRkVhkkaFirAjHBBprp2qCNNrHPt70DLitcD2m1CTpm2jkVztHSjl/KO1Za11QZGGBHuacwakMBif3NK7GaPupmhtbQyj+tHpopdcnmlFhq8XdgKeQa5GqgZBAqvKLrnoDl8LmZiMCl114IhVSS4z3p/ceJYIoN24Ak1l9U8Yu0pEeAuOc96JHc+gc9q/kLJPC0SSlVZWxz1q1PD8SkFSB8Uvn8RkksoCkdhVb+JPM6HFGqbF1PGmMrjT0hU8DjvWf1CZUV+e1HXXiBJLX83PeslqeombKqep5q2OD8g9Rmgl8Qfd+IuQBkgHrWm09ngCSLlGTBBHas9psZB3FcknitBZhn2pk5Y4xitTDGjJUrdl/iq61XT5Uzf3MkFwoePLn7j7UJpt9LvijZ23Nyea1XjKzzoBkCZktdrKT2HQ1i9BjM10ZpSQqDA570fUYvayUvJOHM5q2zUpe3URCrNIpAzkGnVj4m1O3UAXOVx+oA0ntrK4unBjXco53Z4FMU0xI/4jBZGPRd2FFDcbGFka8jiLXFukLzejnG73rSaXBB+HEysrR9dwPWvObiz1C5Uqbq0hROdqsTgfYUfpYvdPieNNRjaKT8ygH96FLAnzENj1fiR51KzGqySBzRIBJB21GZQRwMUnYEBmlIHNQVw3apXKrgCoJhRVkwUm+giMAjBFEvDCIRwN1AocHNWtKSK6TC4IA88YB4qK7jnBIGKsZt3zUGbykNVRfJdgs0yg4ZAf9jTzQJYp7R4OcI2QD2zSGKKS9uFihjaSRjhVUZJrR6JpM1gJJZhtduNoIOAPpRJQcougOKW2Sfgqv9MDqWjxuzz3zSvyGi5PPODiteI9w9J49qBuLFW34Ug56UvHJ4Y1k06fyQlS5eLJz0q+PV3UAe1QubQx7vSemRS9wVPJoiSYs5zgPF1mQHhj7/SioPE8saldxzjHNZjzNucNk1w3G7rg1zxJkrUyRp31yed+HO0DODS6bUnLHcfv70uNxtjAHp9+5qoyF+T0/nVo40ik9RKXYab0vwD161WZyF3Z6HFB79vNRaXPerUgbm2FXFyzjCnAoeIF29xmoZzkAGi7WLJGBV4rko5WNLKPaoK8ce1PtEiM+oRJj0g5/bmlFoh2ZIx9a0nheFjM83XA28+5rQ00N00ik3tg2O/EBL6Jdb8cR4571jtIRcJb24aSRjuIK4+p5rS+LbjydJaMgrvYKB7ih9Hsfw1qLm4B811AA7qvYUfXP9xJfRGk4iwsTLZKkboISejq3B+M1N7eSfcsTkjOfp/2qCs1ycEKUPGG5yKLt7UWSk/i2jgHVccD4B60qkHbsrh0Tby0+7uCOo+KNSFYDuRUkKjGH5yPYULA818xjt12W4OPMH6qa21nHaJkHcefrV0iP6PNJtE1eD/0kcfBoCeDUoz67V+PYZp1+Ov06TsfrzXRq16v5tjfUVj7vwO7I/bMtK0gP8SF1+q1V5iE88VurFrvUklkFnD5UQ9cjnao+9Gjw3bTReZdWsfK7gsfPHyT0o0IuXSBSxpf7jzrcOxr5ia3cfhfSbhspYREZxzcsP5DFWy+FLG0j81tJgdMf+nO5/n1on6dspHLXB54WCDJ600j8Kate6cL1I41RuVR22sw9/p9a0cfh/Sbi8hnFqDGpzsRztbHuDTfW9QlsbLzo5Qqt+nZkYq8MFcsrOZlNK0x9F0p7qNPOv7jMeE58pR2Hye9NfJFvZIr/nCerI796Z+G7T8VDHduCsMEBuWBXAZzkgfvz9qW6xKYbNjnBIpr29sFL7Ft9tpeAW3lWVQynIPeijbiZeOvY1nfDt75wmgJy0bbl+Qf+9aS3l+ftWBlVSdG7p5b4Ji+axUMd3Wgp9JR42O0e4K0/uIxMP8AKwoCQGIFX4Px3qsMjLzwoyFxbmOQqUIP86pMOOmfvT2+ZMnkGlb+o8CmozbEJ4FFgXlMp6/tXDHIRnOB80cIWPsKmLZT2q+8H7AtETPwBVn4cRruPNHiEDtgVTIu+VUHbk1yk26IliUI2VQw5+tNLWDAHFUwxAdaYW6Z5ycim4IWoIhUKeBkjmtd4ch8qw345cluaysakvtHfpx3rXyyiysgsf6VCjHc1p6KKtzfgDqXworyDakgvr6PdhoLf1kdi3auTy/iJFSMqQOoqsymOIRq6+Y3LZ70dp1jwGYl2J574pfLPfNyD447YqITb28Vpbs8m1VAyTmlcH4jxLd5RWgsIjgkDG6jbi2bW5xbKTFp8JzI3QyEdh8fNHRurRLa6bGoiX0mY/lH0Hc1VIlsvM9ppkSpvVQBwMc/tUreaa5YMkRjQnO6Qc1y20yKFhLJuml7s/P7DtTFMY9O7J7KMVdI4//Z";
const ABOUT = {
  bn: {
    whatH: "খেলা কখন? সম্পর্কে",
    what: "ইউরোপের বড় পাঁচ লিগ আর চ্যাম্পিয়ন্স লিগের সূচি, বাংলাদেশ সময়ে। রাত একটার খেলা, নাকি ভোর চারটার—আলাদা করে হিসাব কষতে হয় না। প্রিয় দল বেছে নিলে তাদের খেলা ম্যাচ পাতার একদম উপরে দেখা যায় কাউন্টডাউনসহ। সাথে আছে লিগ টেবিল, গোলদাতা, দল আর খেলোয়াড়ের পাতা, প্রেডিকশন, বন্ধুদের লিগ, লাইভ স্পোর্টস কুইজ আর বাংলায় প্রশ্ন করলেই উত্তর।",
    facts: [["৬", "প্রতিযোগিতা"], ["১১১", "দল"], ["প্রতিদিন", "হালনাগাদ"]],
    howH: "কীভাবে কাজ করে",
    steps: [
      ["রেজিস্ট্রেশন", "ইমেইল দিয়ে, অথবা এক চাপে Google দিয়ে।"],
      ["দল বাছাই", "সর্বোচ্চ তিনটা প্রিয় দল, তাদের খেলা সবার উপরে।"],
      ["প্রেডিকশন", "কিকঅফের আগ পর্যন্ত যেকোনো ম্যাচের স্কোর অনুমান করুন।"],
      ["পয়েন্ট", "হুবহু স্কোরে ৩, শুধু ফল মিললে ১। সব লিগ মিলিয়ে বা আলাদা লিগে লিডারবোর্ডে জায়গা করে নিন।"],
      ["বন্ধুদের লিগ", "নিজের লিগ খুলে লিংক পাঠান, বন্ধুরা যোগ দিলেই নিজেদের মধ্যে লড়াই।"],
      ["স্পোর্টস কুইজ", "১০টা প্রশ্ন, প্রতিটায় ৩০ সেকেন্ড। একা খেলে নিজেকে যাচাই করুন, বা বন্ধুদের সাথে লাইভ।"],
      ["জিজ্ঞেস করুন", "বাংলায় প্রশ্ন করুন: পরের খেলা, টেবিল, ফর্ম, হেড টু হেড, গোল, কোচ।"],
    ],
    devH: "ডেভেলপার পরিচিতি",
    devName: "মাহবুব হাসান তন্ময়",
    devRole: "প্রতিষ্ঠাতা ও ডেভেলপার",
    dev: "ক্রীড়া লেখক। খেলা৭১-এ সাব-এডিটর হিসেবে কাজ করেছেন, বাংলা ও ইংরেজিতে লিখেছেন ১,৭০০-র বেশি ক্রীড়া প্রতিবেদন। গোপালগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় থেকে বিবিএ শেষ করে এখন একটি বেসরকারি ব্যাংকে কর্মরত। আগ্রহের জায়গা খেলার ইতিহাস। প্রোগ্রামিংয়ে প্রাতিষ্ঠানিক পড়াশোনা নেই; নিজে শিখে বানিয়েছেন খেলা কখন?।",
    cta: "শুরু করুন",
  },
  en: {
    whatH: "What is Khela Kokhon?",
    what: "Fixtures for Europe's top five leagues and the Champions League, in Bangladesh time. No more working out whether a match is at 1 AM or 4 AM. Pick your teams and their matches sit at the top of the Matches page with a countdown. Plus tables, top scorers, team and player pages, predictions, friends' leagues, a live sports quiz and answers to any question in Bangla.",
    facts: [["6", "competitions"], ["111", "teams"], ["Daily", "updates"]],
    howH: "How it works",
    steps: [
      ["Sign up", "With email, or with Google in one tap."],
      ["Pick teams", "Up to three favourites, shown first."],
      ["Predict", "Guess the score of any match until kickoff."],
      ["Score points", "3 for the exact score, 1 for the right result. Climb the overall or per-league leaderboard."],
      ["Friends' leagues", "Start your own league and share the link."],
      ["Sports quiz", "10 questions, 30 seconds each. Solo, or live with friends."],
      ["Ask", "Ask in Bangla: next match, table, form, head to head, goals, coach."],
    ],
    devH: "About the Developer",
    devName: "Mahbub Hasan Tonmoy",
    devRole: "Founder & developer",
    dev: "Sports writer. Former sub-editor at Khela71, with more than 1,700 sports articles in Bangla and English. Holds a BBA from Gopalganj Science and Technology University and now works at a private bank. Has a keen interest in sports history. No formal training in programming; self-taught, he built Khela Kokhon himself.",
    cta: "Get started",
  },
};


// ════════════════ pages/Matches.jsx ════════════════
// ── তারিখের স্ট্রিপ ──
function DateStrip({ day, setDay }) {
  const { lang } = useT();
  const today = dayKey(new Date());
  const ref = useRef(null);
  const days = Array.from({ length: 22 }, (_, i) => addDays(today, i - 7));
  useEffect(() => {
    const strip = ref.current, el = strip?.querySelector(".day.on");
    if (strip && el) strip.scrollLeft = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
  }, [day]);
  return (
    <div className="strip" ref={ref}>
      {days.map((k) => {
        const l = stripLabel(k, lang);
        return (
          <button key={k} className={"day" + (k === day ? " on" : "")} onClick={() => setDay(k)}>
            <div className="a">{l.top}</div>
            <div className="b">{l.bottom}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── একটা দিনের ম্যাচ; ফাঁকা হলে পরের ম্যাচের দিনে যাওয়ার বাটন ──
function DayMatches({ day, setDay, comp = "ALL", preds, onOpen }) {
  const { t, lang } = useT();
  const [list, setList] = useState(null);
  const [next, setNext] = useState(null);

  useEffect(() => {
    let live = true;
    setList(null); setNext(null);
    getMatchesOnDay(day).then((r) => {
      if (!live) return;
      setList(r);
      if (!r.length) getNextMatchTime(dayRangeUTC(day)[1]).then((n) => live && setNext(n)).catch(() => {});
    }).catch(() => live && setList([]));
    return () => { live = false; };
  }, [day]);

  const shown = (list || []).filter((m) => comp === "ALL" || m.competition_code === comp);
  if (list === null) return <div className="card"><div className="spin" /></div>;
  if (shown.length) return <CompGroups matches={shown} preds={preds} onOpen={onOpen} />;
  return (
    <div className="card empty">
      {t("noMatchDay")}
      {next && !list.length && (
        <div style={{ marginTop: 12 }}>
          <button className="btn ghost" style={{ height: 38, fontSize: 14 }} onClick={() => setDay(dayKey(next))}>
            {lang === "bn" ? "পরের খেলা" : "Next matches"}: {dayLabel(dayKey(next), lang)} →
          </button>
        </div>
      )}
    </div>
  );
}

// ── ফলো করা দলের খেলা: একটা কার্ড, ভাঁজ করা যায় ──
// বাম পাশের ছোট চিহ্ন: শেষ / লাইভ / অন্য দিনের তারিখ। আজকের খেলায় কিছু না।
// শুধু শেষ হওয়া খেলায় বাঁয়ে ছোট "শেষ"
function rowBadge(m, t) {
  return isDone(m) ? <span className="rbadge">{t("ft")}</span> : null;
}
// সামনের খেলার দিন, সময়ের নিচে ছোট করে (আজ / রবি, ২২ নভে)
function rowSub(m, lang) {
  if (isLive(m) || m.status === "PAUSED" || isDone(m) || isOff(m)) return null;
  const k = dayKey(m.utc_date), l = stripLabel(k, lang);
  return k === dayKey(new Date()) ? l.top : `${l.top}, ${l.bottom}`;
}

const ChevronIcon = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 15 6-6 6 6" /></svg>
);

function Following({ list, preds, onOpen }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(() => stored("kk_follow_open", "1") === "1");
  const toggle = () => { setOpen(!open); store("kk_follow_open", open ? "0" : "1"); };
  return (
    <div className="card follow">
      <button className="follow-h" onClick={toggle} aria-expanded={open}>
        <span className="fav-star">★</span>
        <b>{t("following")}</b>
        <ChevronIcon className={"chev" + (open ? " up" : "")} />
      </button>
      {open && list.map((m) => <MatchRow key={m.id} m={m} pred={preds[m.id]} onOpen={onOpen} plain badge={rowBadge(m, t)} sub={rowSub(m, lang)} />)}
    </div>
  );
}

// ── ডেস্কটপের সাইডবার: বড় স্ক্রিনেই শুধু তৈরি হয় (মোবাইলে বাড়তি ডেটা নামে না) ──
function useWide(q = "(min-width: 1100px)") {
  const get = () => typeof window !== "undefined" && !!window.matchMedia?.(q).matches;
  const [on, setOn] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia?.(q); if (!mq) return;
    const f = () => setOn(mq.matches);
    mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f));
  }, [q]);
  return on;
}

function SideLeague({ comps, code, setCode }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  const [table, setTable] = useState(null);
  const [scorers, setScorers] = useState(null);
  useEffect(() => {
    let live = true; setTable(null); setScorers(null);
    getStandings(code).then((r) => live && setTable(r)).catch(() => live && setTable([]));
    getScorers(code).then((r) => live && setScorers(r)).catch(() => live && setScorers([]));
    return () => { live = false; };
  }, [code]);
  const c = comps.find((x) => x.code === code);
  const cl = code === "CL";
  return (
    <>
      <div className="side-card">
        <div className="side-h">
          <h3>{bn ? "পয়েন্ট টেবিল" : "Table"}</h3>
          <button className="link" onClick={() => nav.openLeague(code)}>{bn ? "পুরো টেবিল" : "Full table"} →</button>
        </div>
        <div className="side-lgs" role="tablist">
          {comps.map((x) => (
            <button key={x.code} role="tab" aria-selected={x.code === code} title={compName(x, lang)} className={x.code === code ? "on" : ""} onClick={() => setCode(x.code)}>
              <CompIcon c={x} size={18} />
            </button>
          ))}
        </div>
        <div className="side-sub muted">{c ? compName(c, lang) : code}</div>
        {table === null ? <div className="spin" /> : !table.length ? <div className="side-empty muted">{bn ? "টেবিল এখনো আসেনি" : "No table yet"}</div> : (
          <div className="mt">
            <div className="mt-row mt-h muted"><span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "খে" : "P"}</span><span>+/-</span><span>{bn ? "প" : "Pts"}</span></div>
            {table.slice(0, cl ? 8 : 6).map((r) => (
              <button key={r.team_id} className="mt-row" onClick={() => nav.openTeam(r.team_id)}>
                <span className="muted">{num(r.position, lang)}</span>
                <span className="mt-tm"><Crest team={r.team} size={18} /><b>{teamName(r.team, lang)}</b></span>
                <span className="muted">{num(r.played, lang)}</span>
                <span className="muted">{r.gd > 0 ? "+" : ""}{num(r.gd, lang)}</span>
                <span className="mt-pts">{num(r.points, lang)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="side-card">
        <div className="side-h">
          <h3>{bn ? "শীর্ষ গোলদাতা" : "Top scorers"}</h3>
          <button className="link" onClick={() => nav.openLeague(code)}>{bn ? "সব" : "All"} →</button>
        </div>
        {scorers === null ? <div className="spin" /> : !scorers.length ? <div className="side-empty muted">{bn ? "তালিকা এখনো আসেনি" : "Not available yet"}</div> : (
          <div className="mt">
            {scorers.slice(0, 5).map((p, i) => (
              <button key={p.player_id} className="sc-row" onClick={() => nav.openPlayer(p.player_id)}>
                <span className="muted">{num(i + 1, lang)}</span>
                <span className="mt-tm"><Crest team={p.team} size={18} /><span className="sc-nm"><b>{playerName(p.player_name, lang)}</b><small className="muted">{teamName(p.team, lang)}</small></span></span>
                <span className="mt-pts">{num(p.goals, lang)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SideBoard() {
  const { lang, t } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  const [rows, setRows] = useState(null);
  useEffect(() => { getLeaderboard(null).then((r) => setRows(r || [])).catch(() => setRows([])); }, []);
  if (!rows?.length) return null;
  return (
    <div className="side-card">
      <div className="side-h">
        <h3>{bn ? "প্রেডিকশন লিডারবোর্ড" : "Prediction leaders"}</h3>
        <button className="link" onClick={() => nav.go("predict")}>{bn ? "খেলুন" : "Play"} →</button>
      </div>
      <div className="mt">
        {rows.slice(0, 5).map((r, i) => (
          <div key={i} className="sc-row">
            <span className={"rk-b" + (i < 3 ? " r" + (i + 1) : "")}>{num(i + 1, lang)}</span>
            <span className="sc-nm"><b>{r.display_name}</b><small className="muted">{bn ? `${num(r.played, lang)} ম্যাচ · হুবহু ${num(r.exact, lang)}` : `${r.played} played · ${r.exact} exact`}</small></span>
            <span className="mt-pts">{num(r.points, lang)} <small className="muted">{t("pts")}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeSide({ comps, comp, user }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  const [code, setCode] = useState(comp !== "ALL" ? comp : "PL");
  useEffect(() => { if (comp !== "ALL") setCode(comp); }, [comp]);
  return (
    <aside className="home-side">
      <DailyTeaser user={user} side />
      {comps.length > 0 && <SideLeague comps={comps} code={code} setCode={setCode} />}
      <SideBoard />
      <button className="side-card side-ask" onClick={() => nav.go("ask")}>
        <b>{bn ? "যেকোনো প্রশ্ন বাংলায় করুন" : "Ask anything"}</b>
        <span className="muted">{bn ? "“আজ বার্সার খেলা কখন?” · “প্রিমিয়ার লিগে শীর্ষে কে?”" : "“When do Barça play?” · “Who leads the Premier League?”"}</span>
        <span className="side-go">{bn ? "জিজ্ঞেস করুন" : "Ask"} →</span>
      </button>
    </aside>
  );
}

function Matches({ user, myTeams, comps, preds, onOpen, goProfile }) {
  const { t, lang } = useT();
  const [day, setDay] = useState(dayKey(new Date()));
  const [comp, setComp] = useState("ALL");
  const nav = useNav();
  const fav = myTeams?.fav || [];
  const [mine, setMine] = useState(null);
  const wide = useWide();

  // প্রতিটা প্রিয় দলের একটা করে খেলা: চলতি খেলা, নইলে আজ শেষ হওয়া খেলা, নইলে পরের ম্যাচ
  useEffect(() => {
    let live = true;
    if (!fav.length) { setMine([]); return; }
    Promise.all([getTeamMatches(fav, { upcoming: true, limit: 30 }), getTeamMatches(fav, { upcoming: false, limit: 10 })])
      .then(([up, past]) => {
        if (!live) return;
        const today = dayKey(new Date());
        const doneToday = past.filter((m) => dayKey(m.utc_date) === today);
        const picked = [];
        for (const id of fav) {
          const has = (m) => m.home_id === id || m.away_id === id;
          const m = up.find((x) => has(x) && isLive(x)) || doneToday.find(has) || up.find(has);
          if (m && !picked.some((x) => x.id === m.id)) picked.push(m);
        }
        picked.sort((a, b) => new Date(a.utc_date) - new Date(b.utc_date));
        setMine(picked);
      })
      .catch(() => live && setMine([]));
    return () => { live = false; };
  }, [fav.join(",")]);

  return (
    <div className={wide ? "home-grid" : undefined}>
    <div className="home-main">
      {fav.length > 0 && mine?.length > 0 && (
        <div className="sec">
          <Following list={mine} preds={preds} onOpen={onOpen} />
        </div>
      )}

      {!wide && <div className="sec dl-teaser-wrap"><DailyTeaser user={user} /></div>}
      <DateStrip day={day} setDay={setDay} />
      <div className="chips">
        <button className={"chip" + (comp === "ALL" ? " on" : "")} onClick={() => setComp("ALL")}>{t("all")}</button>
        {comps.map((c) => (
          <button key={c.code} className={"chip" + (comp === c.code ? " on" : "")} onClick={() => setComp(c.code)}>
            <CompIcon c={c} size={16} />{compName(c, lang)}
          </button>
        ))}
      </div>
      <div className="sec" style={{ marginTop: 14 }}>
        <div className="sec-h">
          <h2>{dayLabel(day, lang)}</h2>
          {comp !== "ALL" && <button className="link" onClick={() => nav.openLeague(comp)}>{lang === "bn" ? "টেবিল দেখুন" : "Table"} →</button>}
        </div>
        <DayMatches day={day} setDay={setDay} comp={comp} preds={preds} onOpen={onOpen} />
      </div>
    </div>
    {wide && <HomeSide comps={comps} comp={comp} user={user} />}
    </div>
  );
}

// ── সব লিগ এক জায়গায় ──
function Leagues({ comps }) {
  const { t, lang } = useT();
  const nav = useNav();
  return (
    <div className="sec">
      <div className="sec-h"><h2 style={{ fontSize: 19 }}>{t("leagues")}</h2></div>
      {!comps.length ? <Loading /> : (
        <div className="lg-list">
          {comps.map((c) => (
            <button key={c.code} className="lg-card" onClick={() => nav.openLeague(c.code)}>
              <span className="lg-ic" data-c={c.code}><CompIcon c={c} size={30} /></span>
              <span className="lg-nm">
                <b>{compName(c, lang)}</b>
                <small className="muted">{lang === "bn" ? "টেবিল · ম্যাচ · গোলদাতা" : "Table · Matches · Scorers"}</small>
              </span>
              <span className="comp-go">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════ pages/Friends.jsx ════════════════
const inviteText = (l, bn) => {
  const link = `https://khelakokhon.com/join/${l.code}`;
  return bn
    ? `⚽ "${l.name}" প্রেডিকশন লিগে যোগ দিন — খেলা কখন?-এ\n\nলিংক: ${link}\nকোড: ${l.code}`
    : `⚽ Join my "${l.name}" prediction league on Khela Kokhon\n\n${link}\nCode: ${l.code}`;
};

async function shareInvite(l, bn, toast) {
  const text = inviteText(l, bn);
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast(bn ? "আমন্ত্রণ কপি হয়েছে" : "Invite copied"); } catch { /* ignore */ }
}

function Board({ league, user, onBack, onLeft, toast }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const { t } = useT();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [comp, setComp] = useState(null);
  useEffect(() => {
    setRows(null); setErr("");
    leagueBoard(league.id, comp).then(setRows).catch((e) => { setErr(e.missing ? "missing" : e.message); setRows([]); });
  }, [league.id, comp]);

  async function leave() {
    if (!window.confirm(bn ? `"${league.name}" লিগ ছেড়ে দেবেন?` : `Leave "${league.name}"?`)) return;
    await leaveLeague(user, league.id).catch(() => {});
    onLeft();
  }

  return (
    <>
      <div className="fl-head">
        <button className="back" onClick={onBack} aria-label="back">←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{league.name}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{bn ? "কোড" : "Code"}: <b className="code">{league.code}</b> · {num(league.members ?? rows?.length ?? 0, lang)} {bn ? "জন" : "members"}</div>
        </div>
      </div>
      <button className="btn block" style={{ margin: "12px 0" }} onClick={() => shareInvite(league, bn, toast)}>{bn ? "বন্ধুদের আমন্ত্রণ পাঠান" : "Invite friends"}</button>
      <CompFilter value={comp} onChange={setComp} />
      {err && err !== "missing" && <div className="err">{err}</div>}
      {rows === null ? <div className="card"><div className="spin" /></div>
        : err === "missing" || (comp && !rows.some((r) => r.played > 0)) ? <BoardMsg err={err} comp={comp} lang={lang} />
        : <BoardRows rows={comp ? rows.filter((r) => r.played > 0 || r.is_me) : rows} isMe={(r) => r.is_me} lang={lang} t={t} />}
      <button className="link" style={{ color: "var(--red)", marginTop: 14 }} onClick={leave}>{bn ? "লিগ ছেড়ে দিন" : "Leave league"}</button>
    </>
  );
}

function Friends({ user, goProfile, toast, openId, reloadKey }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () => myLeagues().then((r) => { setList(r); if (openId) setOpen(r.find((x) => x.id === openId) || null); }).catch(() => setList([]));
  useEffect(() => { if (user) load(); }, [user?.id, reloadKey]);

  if (!user) return (
    <div className="card empty">
      <div style={{ marginBottom: 12 }}>{bn ? "বন্ধুদের লিগে খেলতে আগে লগইন করুন" : "Log in to play in friends' leagues"}</div>
      <button className="btn" onClick={goProfile}>{bn ? "লগইন" : "Log in"}</button>
    </div>
  );

  if (open) return <Board league={open} user={user} toast={toast} onBack={() => setOpen(null)} onLeft={() => { setOpen(null); load(); }} />;

  async function create(e) {
    e.preventDefault(); setErr("");
    if (name.trim().length < 2) return setErr(bn ? "লিগের একটা নাম দিন" : "Give the league a name");
    setBusy(true);
    try {
      const r = await createLeague(name.trim());
      setName("");
      const fresh = await myLeagues();
      setList(fresh);
      setOpen(fresh.find((x) => x.id === r.id) || { id: r.id, code: r.code, name: name.trim(), members: 1 });
    } catch (e2) { setErr(e2.message || "…"); }
    setBusy(false);
  }

  async function join(e) {
    e.preventDefault(); setErr("");
    if (code.trim().length !== 6) return setErr(bn ? "৬ অক্ষরের কোড দিন" : "Enter the 6-letter code");
    setBusy(true);
    try {
      const r = await joinLeague(code.trim());
      setCode("");
      toast(bn ? `"${r.name}" লিগে যোগ দিয়েছেন` : `Joined "${r.name}"`);
      const fresh = await myLeagues();
      setList(fresh);
      setOpen(fresh.find((x) => x.id === r.id) || null);
    } catch (e2) { setErr(e2.message || "…"); }
    setBusy(false);
  }

  return (
    <>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>
        {bn ? "অফিস, বন্ধু বা পরিবারের জন্য নিজের লিগ খুলুন। সবাই যার যার মতো প্রেডিকশন দেবে, আর লিগের আলাদা লিডারবোর্ডে দেখা যাবে কে এগিয়ে।"
            : "Start a league for your office, friends or family. Everyone predicts as usual; the league has its own leaderboard."}
      </p>
      {list === null ? <div className="card"><div className="spin" /></div> : list.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          {list.map((l) => (
            <button key={l.id} className="fl-row" onClick={() => setOpen(l)}>
              <div className="fl-icon">{l.name.slice(0, 1)}</div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontWeight: 700 }}>{l.name}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{num(l.members, lang)} {bn ? "জন" : "members"} · {bn ? "কোড" : "code"} {l.code}{l.is_owner ? (bn ? " · আপনি খুলেছেন" : " · yours") : ""}</div>
              </div>
              <span className="muted">›</span>
            </button>
          ))}
        </div>
      )}
      {err && <div className="err">{err}</div>}
      <div className="card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{bn ? "নতুন লিগ খুলুন" : "Start a league"}</div>
        <form className="inline-form" onSubmit={create}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={bn ? "যেমন: অফিস লিগ" : "e.g. Office league"} />
          <button className="btn" disabled={busy}>{bn ? "খুলুন" : "Start"}</button>
        </form>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{bn ? "কোড দিয়ে যোগ দিন" : "Join with a code"}</div>
        <form className="inline-form" onSubmit={join}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" style={{ letterSpacing: 3, fontFamily: "Inter, sans-serif", fontWeight: 700 }} />
          <button className="btn" disabled={busy}>{bn ? "যোগ দিন" : "Join"}</button>
        </form>
      </div>
    </>
  );
}

// ════════════════ pages/Predict.jsx ════════════════
function Leaderboard({ me }) {
  const { t, lang } = useT();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [comp, setComp] = useState(null);
  useEffect(() => {
    setRows(null); setErr("");
    getLeaderboard(comp).then(setRows).catch((e) => { setErr(e?.missing ? "missing" : "x"); setRows([]); });
  }, [comp]);
  const isMe = (r) => r.is_me ?? (me && r.display_name === me);
  return (
    <>
      <CompFilter value={comp} onChange={setComp} />
      {rows === null ? <div className="card"><div className="spin" /></div>
        : err === "missing" ? <BoardMsg err={err} comp={comp} lang={lang} />
        : !rows.length ? (comp ? <BoardMsg comp={comp} lang={lang} /> : <div className="card empty">{t("noLeaders")}</div>)
        : <BoardRows rows={rows} isMe={isMe} lang={lang} t={t} />}
    </>
  );
}

function Mine({ user, preds, fav, onOpen, goProfile }) {
  const { t, lang } = useT();
  const [made, setMade] = useState(null);
  const [todo, setTodo] = useState(null);
  const ids = Object.keys(preds).map(Number);

  useEffect(() => {
    let live = true;
    getMatchesByIds(ids).then((r) => live && setMade(r.sort((a, b) => b.utc_date.localeCompare(a.utc_date)))).catch(() => live && setMade([]));
    return () => { live = false; };
  }, [ids.join(",")]);

  useEffect(() => {
    let live = true;
    getTeamMatches(fav, { upcoming: true, limit: 10 })
      .then((r) => live && setTodo(r.filter((m) => canPredict(m) && !preds[m.id]).slice(0, 5)))
      .catch(() => live && setTodo([]));
    return () => { live = false; };
  }, [fav.join(","), ids.join(",")]);

  if (!user) return (
    <div className="card empty">
      <div style={{ marginBottom: 12 }}>{t("loginToPredict")}</div>
      <button className="btn" onClick={goProfile}>{t("login")}</button>
    </div>
  );

  const total = Object.values(preds).reduce((s, p) => s + (p.points || 0), 0);
  return (
    <>
      <div className="card" style={{ display: "flex", padding: "14px 16px", gap: 16, marginBottom: 14 }}>
        <div style={{ flex: 1 }}><div className="muted" style={{ fontSize: 12.5 }}>{t("pts")}</div><div style={{ fontSize: 24, fontWeight: 700 }}>{num(total, lang)}</div></div>
        <div style={{ flex: 1 }}><div className="muted" style={{ fontSize: 12.5 }}>{lang === "bn" ? "প্রেডিকশন" : "Predictions"}</div><div style={{ fontSize: 24, fontWeight: 700 }}>{num(ids.length, lang)}</div></div>
        <div style={{ flex: 1 }}><div className="muted" style={{ fontSize: 12.5 }}>{lang === "bn" ? "হুবহু" : "Exact"}</div><div style={{ fontSize: 24, fontWeight: 700 }}>{num(Object.values(preds).filter((p) => p.points === 3).length, lang)}</div></div>
      </div>

      {todo?.length > 0 && (
        <>
          <div className="sec-h"><h2>{t("upcomingToPredict")}</h2></div>
          <div className="card" style={{ marginBottom: 14 }}>
            {todo.map((m) => <MatchRow key={m.id} m={m} onOpen={onOpen} />)}
          </div>
        </>
      )}

      <div className="sec-h"><h2>{t("myPredictions")}</h2></div>
      {made === null ? <div className="card"><div className="spin" /></div>
        : made.length === 0 ? <div className="card empty">{t("noPredictions")}</div>
        : (
          <div className="card">
            {made.map((m) => (
              <div key={m.id}>
                <div className="muted" style={{ fontSize: 11.5, padding: "8px 14px 0", display: "flex", gap: 6, alignItems: "center" }}>
                  <CompIcon c={m.competition} size={13} /> {dayLabel(dayKey(m.utc_date), lang, { short: true })}
                  <span style={{ flex: 1 }} />
                  {preds[m.id]?.points != null
                    ? <span className={"ptbadge p" + preds[m.id].points}>+{num(preds[m.id].points, lang)}</span>
                    : <span className="ptbadge">{t("pending")}</span>}
                </div>
                <MatchRow m={m} pred={preds[m.id]} onOpen={onOpen} />
              </div>
            ))}
          </div>
        )}
    </>
  );
}

function Predict({ user, profile, preds, fav, onOpen, goProfile, toast, initialTab = "mine", openLeagueId, reloadKey }) {
  const { t, lang } = useT();
  const [tab, setTab] = useState(initialTab);
  const wide = useWide();
  useEffect(() => { setTab(initialTab); }, [initialTab, reloadKey]);
  const bn = lang === "bn";
  // বড় স্ক্রিনে ট্যাব নয়: বাঁয়ে নিজের প্রেডিকশন, ডানে লিডারবোর্ড আর বন্ধুদের লিগ
  if (wide) return (
    <>
      <div className="sec pd-top">
        <GameSwitch on="predict" />
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{t("rules")}</p>
      </div>
      <div className="pg-grid">
        <div className="pg-main">
          <div className="sec"><div className="sec-h"><h2>{bn ? "আমার প্রেডিকশন" : "My predictions"}</h2></div>
            <Mine user={user} preds={preds} fav={fav} onOpen={onOpen} goProfile={goProfile} />
          </div>
        </div>
        <aside className="pg-side">
          <div className="sec"><div className="sec-h"><h2>{bn ? "বন্ধুদের লিগ" : "Friends' leagues"}</h2></div>
            <Friends user={user} goProfile={goProfile} toast={toast} openId={openLeagueId} reloadKey={reloadKey} />
          </div>
          <div className="sec"><div className="sec-h"><h2>{t("leaderboard")}</h2></div>
            <Leaderboard me={profile?.display_name} />
          </div>
        </aside>
      </div>
    </>
  );
  return (
    <div className="sec">
      <GameSwitch on="predict" />
      <div className="seg seg3" style={{ marginBottom: 12 }}>
        <button className={tab === "mine" ? "on" : ""} onClick={() => setTab("mine")}>{lang === "bn" ? "আমার" : "Mine"}</button>
        <button className={tab === "lb" ? "on" : ""} onClick={() => setTab("lb")}>{t("leaderboard")}</button>
        <button className={tab === "friends" ? "on" : ""} onClick={() => setTab("friends")}>{lang === "bn" ? "বন্ধুদের লিগ" : "Friends"}</button>
      </div>
      {tab !== "friends" && <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 12 }}>{t("rules")}</p>}
      {tab === "mine"
        ? <Mine user={user} preds={preds} fav={fav} onOpen={onOpen} goProfile={goProfile} />
        : tab === "lb" ? <Leaderboard me={profile?.display_name} />
        : <Friends user={user} goProfile={goProfile} toast={toast} openId={openLeagueId} reloadKey={reloadKey} />}
    </div>
  );
}

// ════════════════ স্পোর্টস কুইজ (লাইভ) ════════════════
// খেলার সব নিয়ম ডেটাবেসের ফাংশনে (supabase/quiz.sql); এখানে শুধু দেখানো আর প্রতি সেকেন্ডে অবস্থা জানা
const QUIZ_N = 10;
const QUIZ_ERR = {
  "room not found": ["এই কোডের কোনো কুইজ নেই। কোডটা আবার দেখুন।", "No quiz with this code."],
  "already started": ["এই কুইজ শুরু হয়ে গেছে। হোস্ট আবার খেললে যোগ দিতে পারবেন।", "This quiz has already started."],
  "login required": ["কুইজ খেলতে আগে লগইন করুন।", "Log in to play."],
  "time over": ["সময় শেষ!", "Time's up!"],
  "room closed": ["এই কুইজ শেষ হয়ে গেছে, লিংকটি আর চালু নেই।", "This quiz has ended; the link no longer works."],
};
const quizMsg = (e, lang) => { const m = String(e?.message || e); const k = Object.keys(QUIZ_ERR).find((x) => m.includes(x)); return k ? QUIZ_ERR[k][lang === "bn" ? 0 : 1] : (lang === "bn" ? "কিছু একটা গোলমাল হলো, আবার চেষ্টা করুন।" : "Something went wrong."); };

// ডেমো মোড: ব্রাউজারেই নকল কুইজ, দুজন অনুশীলনের সঙ্গীসহ (সাইটের আসল নিয়মের মতোই)
const DEMO_QUIZ_Q = [
  ["১৯৩০ সালের ফিফা বিশ্বকাপ জেতে কোন দেশ?", ["ব্রাজিল", "উরুগুয়ে", "ইতালি", "আর্জেন্টিনা"], 1, "প্রথম বিশ্বকাপের আয়োজক ও চ্যাম্পিয়ন উরুগুয়ে।"],
  ["ক্রিকেট পিচের দৈর্ঘ্য কত গজ?", ["২০ গজ", "২২ গজ", "২৪ গজ", "১৮ গজ"], 1, ""],
  ["অলিম্পিকের প্রতীকে কয়টি রিং থাকে?", ["৪টি", "৬টি", "৫টি", "৭টি"], 2, "পাঁচ মহাদেশের প্রতীক।"],
  ["'এল ক্লাসিকো' কোন দুই ক্লাবের ম্যাচ?", ["রিয়াল মাদ্রিদ ও বার্সেলোনা", "মিলান ও ইন্টার", "লিভারপুল ও এভারটন", "বোকা ও রিভার"], 0, ""],
  ["বাংলাদেশের জাতীয় খেলা কোনটি?", ["ক্রিকেট", "ফুটবল", "কাবাডি (হা-ডু-ডু)", "হকি"], 2, ""],
  ["উইম্বলডন কোন কোর্টে খেলা হয়?", ["ক্লে", "ঘাস", "হার্ড", "কার্পেট"], 1, ""],
  ["২০২২ বিশ্বকাপ জেতে কোন দেশ?", ["ফ্রান্স", "ক্রোয়েশিয়া", "মরক্কো", "আর্জেন্টিনা"], 3, "ফাইনালে টাইব্রেকারে ফ্রান্সকে হারায়।"],
  ["দাবার বোর্ডে মোট কয়টি ঘর?", ["৬৪টি", "৪৮টি", "৮১টি", "১০০টি"], 0, ""],
  ["ক্রিকেটে এক ওভারে কয়টি বৈধ বল?", ["৫টি", "৮টি", "৪টি", "৬টি"], 3, ""],
  ["উসাইন বোল্ট কোন দেশের?", ["যুক্তরাষ্ট্র", "জ্যামাইকা", "কানাডা", "কেনিয়া"], 1, ""],
];
const demoQuiz = {};
function demoQuizCall(fn, a) {
  const now = Date.now(), Q = 30000, GAP = 3000, n = DEMO_QUIZ_Q.length;
  const room = demoQuiz[(a.p_code || "").toUpperCase()];
  const bots = [["রাফি (অনুশীলন)", 0.7], ["নুসরাত (অনুশীলন)", 0.5]];
  if (fn === "quiz_create") {
    const code = Math.random().toString(16).slice(2, 8).toUpperCase();
    demoQuiz[code] = { code, status: "lobby", started: null, next: null, answers: {},
      players: [{ id: "me", name: ls.get("user", {})?.user_metadata?.name || "আপনি", joined: now }, ...bots.map(([nm, sk], i) => ({ id: "b" + i, name: nm, skill: sk, joined: now + i + 1 }))] };
    return code;
  }
  if (!room) throw new Error("room not found");
  // সার্ভারের quiz_progress-এর মতোই: সময় পেরোনো প্রশ্নে "উত্তর দেননি", অনুশীলনের সঙ্গীরা নিজের সময়ে উত্তর দেয়
  const progress = (p) => {
    const list = (room.answers[p.id] ||= []);
    let qstart = list.length ? list[list.length - 1].at + GAP : room.started;
    while (list.length < n) {
      const i = list.length;
      if (p.skill) {
        const d = ((i * 7 + p.id.charCodeAt(1) * 3) % 14 + 3) * 1000;
        if (now >= qstart + d) { list.push({ choice: Math.random() < p.skill ? DEMO_QUIZ_Q[i][2] : (DEMO_QUIZ_Q[i][2] + 1) % 4, ms: d, at: qstart + d }); qstart += d + GAP; continue; }
      }
      if (now >= qstart + Q) { list.push({ choice: null, ms: Q, at: qstart + Q }); qstart += Q + GAP; continue; }
      break;
    }
    return { idx: list.length, qstart };
  };
  if (fn === "quiz_join") return null;
  if (fn === "quiz_start") { room.status = "running"; room.started = now + 3000; return null; }
  if (fn === "quiz_again") { if (!room.next) { room.next = demoQuizCall("quiz_create", {}); room.status = "closed"; } return room.next; }
  if (fn === "quiz_close") { room.status = "closed"; return null; }
  if (fn === "quiz_next") { const l = room.answers.me || [], last = l[l.length - 1]; if (last && now < last.at + GAP) last.at = now - GAP; return null; }
  if (room.status === "closed") return { code: room.code, status: "closed", is_host: true, next_code: room.next, member: true, players: [] };
  const me = room.players[0];
  if (fn === "quiz_answer") {
    if (room.status !== "running") throw new Error("not running");
    const pr = progress(me);
    if (pr.idx !== a.p_index || now < pr.qstart) throw new Error("time over");
    room.answers.me.push({ choice: a.p_choice, ms: now - pr.qstart, at: now });
    return { ok: true };
  }
  // quiz_state
  let ndone = 0, phase = room.status, ends = null, cur = null;
  if (room.status === "running" && now >= room.started) {
    ndone = room.players.filter((p) => { const g = progress(p); return g.idx >= n && now >= g.qstart; }).length;
    if (ndone === room.players.length) { room.status = "finished"; phase = "finished"; }
  }
  if (room.status === "running") {
    if (now < room.started) { phase = "countdown"; ends = room.started; }
    else {
      const pr = progress(me);
      if (pr.idx >= n && !(now < pr.qstart)) phase = "waiting";
      else {
        const reveal = pr.idx > 0 && now < pr.qstart, ci = reveal ? pr.idx - 1 : pr.idx;
        const [qq, opts, ans, ex] = DEMO_QUIZ_Q[ci];
        phase = reveal ? "reveal" : "question"; ends = reveal ? pr.qstart : pr.qstart + Q;
        cur = { index: ci, category: "খেলাধুলা", question: qq, options: opts, started_at: reveal ? null : new Date(pr.qstart).toISOString() };
        if (reveal) { const m = room.answers.me[ci]; cur = { ...cur, answer: ans, explanation: ex, mine: { choice: m.choice, correct: m.choice === ans, ms: m.ms } }; }
      }
    }
  }
  const fin = room.status === "finished";
  const players = room.players.map((p) => {
    const list = room.answers[p.id] || [], show = fin || p.id === "me";
    return { name: p.name, me: p.id === "me", host: p.id === "me", joined: p.joined,
      score: show ? list.filter((x, i) => x.choice === DEMO_QUIZ_Q[i][2]).length : null, ms: show ? list.reduce((t, x) => t + x.ms, 0) : null };
  }).sort((x, y) => (y.score ?? -1) - (x.score ?? -1) || (x.ms ?? 1e9) - (y.ms ?? 1e9) || x.joined - y.joined);
  const review = fin ? DEMO_QUIZ_Q.map(([qq, opts, ans, ex], i) => ({ question: qq, options: opts, answer: ans, explanation: ex, choice: room.answers.me?.[i]?.choice ?? null })) : null;
  return { code: room.code, status: room.status, phase, total: n, finished_count: ndone, q_seconds: 30, gap_seconds: 3,
    started_at: room.started && new Date(room.started).toISOString(), ends_at: ends && new Date(ends).toISOString(), now: new Date(now).toISOString(),
    is_host: true, next_code: room.next, current: cur, review, players };
}
async function quizCall(fn, args = {}) {
  if (DEMO) return demoQuizCall(fn, args);
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(error.message || "error");
  return data;
}
const quizLink = (code) => `${window.location.origin}/quiz/${code}`;
async function shareQuiz(code, bn, toast) {
  const text = bn ? `⚽ খেলা কখন?-এ স্পোর্টস কুইজে চ্যালেঞ্জ! ১০টা প্রশ্ন, প্রতিটায় ৩০ সেকেন্ড। কে জেতে দেখি 😎\n\n${quizLink(code)}\nকোড: ${code}` : `⚽ Sports quiz challenge on Khela Kokhon! 10 questions, 30 seconds each.\n\n${quizLink(code)}\nCode: ${code}`;
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast(bn ? "লিংক কপি হয়েছে, বন্ধুদের পাঠান" : "Link copied"); } catch { /* ignore */ }
}
// র‍্যাঙ্ক: ১–৩ সোনা/রুপা/ব্রোঞ্জ রঙের গোল চিহ্ন, বাকিরা সাধারণ
function RankBadge({ rank, lang, big }) {
  return <span className={"qz-badge r" + Math.min(rank, 4) + (big ? " big" : "")}>{num(rank, lang)}</span>;
}
const Initial = ({ name }) => <span className="qz-ini">{[...(name || "?").trim()][0]}</span>;
const LETTERS = ["ক", "খ", "গ", "ঘ"];
const secTxt = (ms, lang) => (lang === "bn" ? `${num((ms / 1000).toFixed(1), "bn")} সে.` : `${(ms / 1000).toFixed(1)}s`);

// কুইজের শব্দ: ব্রাউজারেই তৈরি হালকা মিউজিক (ফাইল ছাড়া, ফাঁক ছাড়া লুপ) আর সঠিক/ভুলের শব্দ
const quizAudio = (() => {
  let ctx = null, master = null, music = null, timer = null, step = 0, nextT = 0;
  let on = true;
  try { on = localStorage.getItem("kk_quiz_sound") !== "0"; } catch { /* ignore */ }
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], RT = [45, 41, 48, 43];
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };
  const tone = (f, t, dur, type, vol, dest, attack = 0.005) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
  };
  const kick = (t) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.3);
  };
  // ১২০ BPM, প্রতি ধাপ ১৬ভাগ নোট; Am–F–C–G ঘুরে ঘুরে
  const schedule = () => {
    while (nextT < ctx.currentTime + 0.3) {
      const bar = Math.floor(step / 16) % 4, k = step % 16, c = CH[bar], t = nextT;
      if (k % 2 === 0) tone(hz([c[0] + 12, c[2] + 12, c[1] + 24, c[2] + 12][(k / 2) % 4]), t, 0.3, "triangle", k % 4 === 0 ? 0.07 : 0.045, music);
      if (k === 0) c.forEach((m) => tone(hz(m + 12), t, 2.1, "sine", 0.028, music, 0.4));
      if (k === 4 || k === 12) tone(hz(RT[bar]), t, 0.35, "sine", 0.14, music, 0.01);
      if (k === 0 || k === 8) kick(t);
      step++; nextT += 0.125;
    }
  };
  return {
    get on() { return on; },
    setOn(v) {
      on = v; try { localStorage.setItem("kk_quiz_sound", v ? "1" : "0"); } catch { /* ignore */ }
      if (master) master.gain.setTargetAtTime(v ? 1 : 0, ctx.currentTime, 0.05);
    },
    unlock() { ensure(); },
    start() {
      if (timer || !ensure()) return;
      music = ctx.createGain(); music.gain.setValueAtTime(0, ctx.currentTime); music.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2600; music.connect(f); f.connect(master);
      step = 0; nextT = ctx.currentTime + 0.05; schedule(); timer = setInterval(schedule, 100);
    },
    stop() {
      if (!timer) return;
      clearInterval(timer); timer = null;
      const m = music; m.gain.setTargetAtTime(0, ctx.currentTime, 0.25); setTimeout(() => m.disconnect(), 1500);
    },
    sfx(kind) {
      if (!ensure() || !on) return;
      const t = ctx.currentTime;
      if (kind === "ok") { tone(hz(84), t, 0.25, "sine", 0.22); tone(hz(88), t + 0.08, 0.3, "sine", 0.22); tone(hz(91), t + 0.16, 0.45, "sine", 0.2); }
      else if (kind === "bad") { tone(180, t, 0.25, "triangle", 0.18); tone(120, t + 0.12, 0.35, "triangle", 0.18); }
      else if (kind === "win") [72, 76, 79, 84].forEach((m, i) => tone(hz(m), t + i * 0.11, 0.6, "triangle", 0.18));
    },
  };
})();

const SoundIcon = ({ off, ...p }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 9v6h4l5 4V5L8 9z" />{off ? <path d="m16 9 5 6M21 9l-5 6" /> : <><path d="M16 9.5a3.5 3.5 0 0 1 0 5" /><path d="M18.5 7a7 7 0 0 1 0 10" /></>}
  </svg>
);

// রঙিন কাগজের ঝরনা (ফলাফলের পাতায়, ৩.৫ সেকেন্ড)
function Confetti() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, cx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    const W = (cv.width = window.innerWidth * dpr), H = (cv.height = window.innerHeight * dpr);
    const colors = ["#00e676", "#f59e0b", "#ffffff", "#ff4d5e", "#38bdf8", "#facc15"];
    const ps = Array.from({ length: 140 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 16 * dpr, vy: (-Math.random() * 15 - 6) * dpr,
      w: (6 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[(Math.random() * colors.length) | 0],
    }));
    let raf, t0 = performance.now();
    const draw = (t) => {
      const k = (t - t0) / 3500; cx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += 0.45 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.globalAlpha = Math.max(0, 1 - k); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); cx.restore();
      }
      if (k < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

// প্রেডিকশন আর কুইজের মধ্যে বদলানোর বোতাম
function GameSwitch({ on }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  return (
    <div className="game-sw">
      <button className={on === "predict" ? "on" : ""} onClick={() => on !== "predict" && nav.go("predict")}><TargetIcon width={18} height={18} />{bn ? "প্রেডিকশন" : "Predict"}</button>
      <button className={on === "quiz" ? "on" : ""} onClick={() => on !== "quiz" && nav.openQuizArea()}><QuizIcon width={18} height={18} />{bn ? "স্পোর্টস কুইজ" : "Sports quiz"}</button>
    </div>
  );
}

// স্পোর্টস কুইজের ভেতরের দুই ভাগ: দৈনিক চ্যালেঞ্জ আর একা/বন্ধুদের সাথে
function QuizSub({ on }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  return (
    <div className="qz-sub-tabs" role="tablist">
      <button role="tab" aria-selected={on === "daily"} className={on === "daily" ? "on" : ""} onClick={() => on !== "daily" && nav.openDaily()}><CalIcon width={17} height={17} />{bn ? "দৈনিক চ্যালেঞ্জ" : "Daily challenge"}</button>
      <button role="tab" aria-selected={on === "live"} className={on === "live" ? "on" : ""} onClick={() => on !== "live" && nav.openQuiz()}><UsersIcon width={17} height={17} />{bn ? "একা বা বন্ধুদের সাথে" : "Solo or with friends"}</button>
    </div>
  );
}

// ════════════════ দৈনিক চ্যালেঞ্জ ════════════════
// সব নিয়ম ডেটাবেসে (supabase/daily.sql); এখানে দেখানো, সময় গোনা আর ফল সাজানো
const CalIcon = I(<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="m9 15.5 2 2 4-4" /></>);
const FlameIcon = (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M12.6 2.2c.5 2.9-.8 4.6-2.3 6.3C8.6 10.3 6.5 12.4 6.5 15.6A5.6 5.6 0 0 0 12 21.5a5.6 5.6 0 0 0 5.5-5.9c0-2.4-1-4.4-2.5-6 .1 1.6-.5 2.8-1.6 3.4.4-3.7-.3-7.6-.8-10.8z" /></svg>;
const DAILY_Q = 5, DAILY_SEC = 20;
const bdDay = () => new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);

// ব্যাজ: id, বাংলা নাম, ইংরেজি নাম, কীভাবে পাবেন (বাংলা, ইংরেজি), রং, চিহ্ন
const BADGES = [
  ["first", "শুরুটা হলো", "First step", "প্রথম দৈনিক চ্যালেঞ্জ শেষ করুন", "Finish your first daily challenge", ["#34d399", "#059669"], "star"],
  ["streak3", "টানা ৩ দিন", "3-day streak", "পরপর ৩ দিন খেলুন", "Play 3 days in a row", ["#fdba74", "#ea580c"], "flame3"],
  ["streak7", "সপ্তাহজুড়ে", "7-day streak", "পরপর ৭ দিন খেলুন", "Play 7 days in a row", ["#fb923c", "#c2410c"], "flame7"],
  ["streak30", "মাসজুড়ে", "30-day streak", "পরপর ৩০ দিন খেলুন", "Play 30 days in a row", ["#f87171", "#b91c1c"], "flame30"],
  ["perfect", "নিখুঁত দিন", "Perfect day", "এক দিনে ৫টাই সঠিক", "All 5 right in one day", ["#a78bfa", "#6d28d9"], "check"],
  ["perfect5", "নিখুঁত পাঁচ", "Perfect five", "৫টা দিনে ৫টাই সঠিক", "5 perfect days", ["#c084fc", "#7e22ce"], "check5"],
  ["football50", "ফুটবল বিশেষজ্ঞ", "Football expert", "ফুটবলের ৫০টা প্রশ্নে সঠিক উত্তর", "50 football answers right", ["#4ade80", "#15803d"], "ball"],
  ["cricket50", "ক্রিকেট বিশেষজ্ঞ", "Cricket expert", "ক্রিকেটের ৫০টা প্রশ্নে সঠিক উত্তর", "50 cricket answers right", ["#38bdf8", "#0369a1"], "bat"],
  ["week10", "সপ্তাহের সেরা দশ", "Weekly top 10", "কোনো সপ্তাহে শীর্ষ ১০-এ থাকুন", "Finish a week in the top 10", ["#cbd5e1", "#64748b"], "laurel"],
  ["week1", "সপ্তাহের চ্যাম্পিয়ন", "Weekly champion", "কোনো সপ্তাহে প্রথম হন", "Win a week", ["#fde047", "#ca8a04"], "crown"],
];
const badgeOf = (id) => BADGES.find((b) => b[0] === id);

function BadgeIcon({ id, size = 56, locked }) {
  const { lang } = useT();
  const b = badgeOf(id); if (!b) return null;
  const [c1, c2] = locked ? ["#d6dde3", "#9aa7b2"] : b[5];
  const gid = "bg-" + id + (locked ? "-l" : "");
  const glyph = {
    star: <path d="M32 18l4.1 8.4 9.2 1.3-6.7 6.5 1.6 9.2L32 39l-8.2 4.4 1.6-9.2-6.7-6.5 9.2-1.3z" fill="#fff" />,
    check: <path d="M22 32.5l7 7 13-14" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    check5: <><path d="M21 31l6 6 11-12" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /><text x="43" y="45" fontSize="11" fontWeight="900" fill="#fff" textAnchor="middle" fontFamily="Inter, 'Hind Siliguri', sans-serif">×{num(5, lang)}</text></>,
    ball: <><circle cx="32" cy="32" r="12" fill="#fff" /><path d="M32 25.5l5.5 4-2.1 6.5h-6.8l-2.1-6.5z" fill={c2} /><path d="M32 20v5.5M37.5 29.5l5.5-1.8M35.4 36l3.3 4.6M28.6 36l-3.3 4.6M26.5 29.5L21 27.7" stroke={c2} strokeWidth="1.6" /></>,
    bat: <><path d="M38.5 20.5l5 5-13 13-5-5z" fill="#fff" /><path d="M25.5 33.5l5 5-4 4-5-5z" fill="#fff" opacity=".85" /><circle cx="41" cy="40" r="3.6" fill="#fff" /></>,
    laurel: <><path d="M24 22c-4 5-4 14 0 20M40 22c4 5 4 14 0 20" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /><text x="32" y="37.5" fontSize="13" fontWeight="900" fill="#fff" textAnchor="middle" fontFamily="Inter, 'Hind Siliguri', sans-serif">{num(10, lang)}</text></>,
    crown: <path d="M20 40l2.5-14 6 6 3.5-9 3.5 9 6-6 2.5 14z" fill="#fff" />,
  };
  const n = { flame3: "3", flame7: "7", flame30: "30" }[b[6]];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={"bdg" + (locked ? " locked" : "")}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      <path d="M32 3l6.2 4.6 7.7-.3 2.4 7.3 6.4 4.4-2.4 7.3 2.4 7.4-6.4 4.3-2.4 7.4-7.7-.3L32 50.7l-6.2-4.6-7.7.3-2.4-7.4-6.4-4.3 2.4-7.4-2.4-7.3 6.4-4.4 2.4-7.3 7.7.3z" fill={`url(#${gid})`} transform="translate(0 5)" />
      <circle cx="32" cy="32" r="17" fill="rgba(255,255,255,.16)" />
      {n ? <><path d="M32.8 17.5c.6 3.4-.9 5.4-2.7 7.4-2 2.2-4.5 4.6-4.5 8.4A6.4 6.4 0 0 0 32 40a6.4 6.4 0 0 0 6.4-6.8c0-2.8-1.2-5.1-2.9-7 .1 1.9-.6 3.3-1.9 4 .5-4.3-.3-8.9-.8-12.7z" fill="#fff" /><text x="32" y="49" fontSize="9.5" fontWeight="900" fill="#fff" textAnchor="middle" fontFamily="Inter, 'Hind Siliguri', sans-serif">{num(+n, lang)}</text></> : glyph[b[6]]}
      {locked && <g transform="translate(42 42)"><circle r="8" fill="var(--card)" /><path d="M-3 -1v-2a3 3 0 0 1 6 0v2M-4.2 -1h8.4v6h-8.4z" stroke="var(--muted)" strokeWidth="1.6" fill="none" /></g>}
    </svg>
  );
}

// ডেমো মোড: ব্রাউজারেই নকল দৈনিক চ্যালেঞ্জ (সার্ভারের নিয়মেই)
function dailyDemo(fn, a = {}) {
  const day = bdDay(), now = Date.now(), dn = Math.floor(Date.parse(day) / 86400000);
  const set = Array.from({ length: DAILY_Q }, (_, i) => DEMO_QUIZ_Q[(dn * 3 + i) % DEMO_QUIZ_Q.length]);
  const S = ls.get("daily_demo", { plays: {}, badges: [] });
  const save = () => ls.set("daily_demo", S);
  const yest = new Date(Date.parse(day) - 86400000).toISOString().slice(0, 10);
  let pl = S.plays[day];
  const settle = (grace) => {
    if (!pl || pl.finished) return;
    if (pl.qs && now > pl.qs + grace * 1000 && pl.idx < DAILY_Q) { pl.ans.push({ choice: null, ok: false, pts: 0 }); pl.idx++; pl.qs = null; }
    if (pl.idx >= DAILY_Q) {
      pl.finished = true;
      const mult = pl.streak >= 7 ? 1.5 : pl.streak >= 3 ? 1.2 : 1;
      pl.points = Math.round((pl.raw + (pl.correct === DAILY_Q ? 10 : 0)) * mult);
    }
  };
  const award = () => {
    const done = Object.values(S.plays).filter((x) => x.finished), got = [];
    const best = Math.max(0, ...done.map((x) => x.streak)), perf = done.filter((x) => x.correct === DAILY_Q).length;
    [[done.length > 0, "first"], [best >= 3, "streak3"], [best >= 7, "streak7"], [best >= 30, "streak30"], [perf >= 1, "perfect"], [perf >= 5, "perfect5"]]
      .forEach(([ok, id]) => { if (ok && !S.badges.some((b) => b.id === id)) { S.badges.push({ id, at: new Date().toISOString() }); got.push(id); } });
    return got;
  };
  const state = (newb = []) => {
    const cur = pl && !pl.finished && pl.qs ? (() => { const [q, o] = set[pl.idx]; return { index: pl.idx, category: "খেলাধুলা", question: q, options: o, started_at: new Date(pl.qs).toISOString(), seconds: DAILY_SEC }; })() : null;
    const wk = Object.entries(S.plays).reduce((t, [, x]) => t + (x.points ?? x.raw), 0);
    return {
      day, now: new Date(now).toISOString(), next_at: new Date(Date.parse(day) + 18 * 3600000).toISOString(), logged_in: true, players_today: 37 + (dn % 20),
      play: pl ? { idx: pl.idx, finished: !!pl.finished, correct: pl.correct, raw: pl.raw, points: pl.points ?? null, streak: pl.streak, mult: pl.streak >= 7 ? 1.5 : pl.streak >= 3 ? 1.2 : 1, marks: pl.ans.map((x) => x.ok) } : null,
      current: cur,
      review: pl?.finished ? set.map(([q, o, ans, ex], i) => ({ question: q, options: o, answer: ans, explanation: ex, choice: pl.ans[i]?.choice ?? null, pts: pl.ans[i]?.pts ?? 0 })) : null,
      streak: pl ? pl.streak : S.plays[yest]?.streak || 0, best_streak: Math.max(0, ...Object.values(S.plays).map((x) => x.streak)),
      week: { start: day, points: wk, rank: wk ? dailyDemo("daily_week").rows.find((r) => r.is_me)?.rank ?? null : null }, badges: S.badges, new_badges: newb,
    };
  };
  if (fn === "daily_week") {
    const me = Object.values(S.plays).reduce((t, x) => t + (x.points ?? x.raw), 0);
    const rows = DEMO_LEADERS.slice(0, 8).map((r, i) => ({ name: r.display_name, points: [212, 188, 171, 140, 122, 97, 80, 61][i] - (a.p_offset ? 20 : 0), days: 7 - Math.floor(i / 2) }));
    if (!a.p_offset && me) rows.push({ name: "ডেমো খেলোয়াড়", points: me, days: Object.keys(S.plays).length, is_me: true });
    rows.sort((x, y) => y.points - x.points).forEach((r, i) => { r.rank = i + 1; });
    return { start: day, end: day, rows };
  }
  settle(fn === "daily_next" ? DAILY_SEC : DAILY_SEC + 2);
  if (fn === "daily_start" && !pl) { pl = S.plays[day] = { idx: 0, qs: now, correct: 0, raw: 0, streak: (S.plays[yest]?.streak || 0) + 1, ans: [] }; }
  if (fn === "daily_next" && pl && !pl.finished && !pl.qs) pl.qs = now;
  if (fn === "daily_answer") {
    if (!pl || pl.finished || !pl.qs || pl.idx !== a.p_index) throw new Error("time over");
    const [, , ans, ex] = set[pl.idx], el = Math.min(DAILY_SEC * 1000, now - pl.qs), ok = a.p_choice === ans;
    const pts = ok ? 10 + Math.round(5 * (1 - el / (DAILY_SEC * 1000))) : 0;
    pl.ans.push({ choice: a.p_choice, ok, pts }); pl.idx++; pl.qs = null; pl.correct += ok ? 1 : 0; pl.raw += pts;
    settle(DAILY_SEC + 2);
    const newb = pl.finished ? award() : [];
    save();
    return { correct: ok, answer: ans, explanation: ex, pts, ms: el, finished: !!pl.finished, new_badges: newb };
  }
  const newb = award();
  save();
  return state(newb);
}
async function dailyCall(fn, args = {}) {
  if (DEMO) return dailyDemo(fn, args);
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw rpcMissing(error) ? Object.assign(new Error("missing"), { missing: true }) : new Error(error.message || "error");
  return data;
}
// নতুন ব্যাজ একবারই উদযাপন
const seenBadges = () => ls.get("badges_seen", []);
const markBadgesSeen = (ids) => ls.set("badges_seen", [...new Set([...seenBadges(), ...ids])]);

// ── দৈনিক চ্যালেঞ্জের শেয়ার কার্ড (১০৮০×১০৮০) ──
async function makeDailyCard(st, lang) {
  try { await Promise.all([document.fonts.load(`700 60px ${CARD_FONT}`, "খেলা"), document.fonts.load(`500 40px ${CARD_FONT}`, "খেলা")]); } catch { /* ignore */ }
  const W = CARD_W, c = document.createElement("canvas"); c.width = W; c.height = W;
  const ctx = c.getContext("2d"), bn = lang === "bn", pl = st.play;
  const g = ctx.createLinearGradient(0, 0, W, W); g.addColorStop(0, "#0a3d2f"); g.addColorStop(0.55, "#064e3b"); g.addColorStop(1, "#06201a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
  const glow = ctx.createRadialGradient(W * 0.5, W * 0.42, 0, W * 0.5, W * 0.42, W * 0.6); glow.addColorStop(0, "rgba(0,230,118,0.22)"); glow.addColorStop(1, "rgba(0,230,118,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, W);
  clockLogo(ctx, 110, 108, 44);
  ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = `700 50px ${CARD_FONT}`; ctx.fillText("খেলা কখন", 172, 112);
  ctx.fillStyle = "#f59e0b"; ctx.fillText("?", 172 + ctx.measureText("খেলা কখন").width + 4, 112);
  ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = `600 36px ${CARD_FONT}`;
  ctx.fillText(dayLabel(st.day, lang, { short: true, abs: true }), W - 70, 112);
  ctx.textAlign = "center"; ctx.fillStyle = "#00e676"; ctx.font = `700 46px ${CARD_FONT}`; ctx.fillText(bn ? "দৈনিক চ্যালেঞ্জ" : "Daily Challenge", W / 2, 250);
  ctx.fillStyle = "#fff"; ctx.font = `800 210px Inter, ${CARD_FONT}`; ctx.fillText(`${num(pl.correct, lang)}/${num(DAILY_Q, lang)}`, W / 2, 420);
  const sz = 92, gap = 22, x0 = W / 2 - (DAILY_Q * sz + (DAILY_Q - 1) * gap) / 2;
  (pl.marks || []).forEach((ok, i) => {
    const x = x0 + i * (sz + gap), y = 560; ctx.fillStyle = ok ? "#00c853" : "#ef4444";
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, sz, sz, 20) : ctx.rect(x, y, sz, sz); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
    if (ok) { ctx.moveTo(x + 26, y + 48); ctx.lineTo(x + 41, y + 63); ctx.lineTo(x + 67, y + 33); } else { ctx.moveTo(x + 30, y + 30); ctx.lineTo(x + 62, y + 62); ctx.moveTo(x + 62, y + 30); ctx.lineTo(x + 30, y + 62); }
    ctx.stroke();
  });
  ctx.fillStyle = "#fff"; ctx.font = `700 52px ${CARD_FONT}`;
  ctx.fillText(bn ? `${num(pl.points ?? pl.raw, "bn")} পয়েন্ট` : `${pl.points ?? pl.raw} points`, W / 2, 760);
  if (st.streak > 1) { ctx.fillStyle = "#fdba74"; ctx.font = `600 40px ${CARD_FONT}`; ctx.fillText(bn ? `টানা ${num(st.streak, "bn")} দিন` : `${st.streak}-day streak`, W / 2, 830); }
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `500 38px ${CARD_FONT}`; ctx.fillText(bn ? "আপনি পারবেন? আজকের চ্যালেঞ্জ খেলুন" : "Can you beat it? Play today's challenge", W / 2, 940);
  ctx.fillStyle = "#00e676"; ctx.font = `700 40px Inter, ${CARD_FONT}`; ctx.fillText("khelakokhon.com/daily", W / 2, 1000);
  return await new Promise((r) => c.toBlob(r, "image/png"));
}
async function shareDaily(st, lang, toast) {
  const bn = lang === "bn";
  const text = (bn ? `খেলা কখন? দৈনিক চ্যালেঞ্জ: ${num(st.play.correct, "bn")}/${num(DAILY_Q, "bn")} · ${num(st.play.points ?? st.play.raw, "bn")} পয়েন্ট${st.streak > 1 ? ` · টানা ${num(st.streak, "bn")} দিন` : ""}\n` : `Khela Kokhon daily: ${st.play.correct}/${DAILY_Q} · ${st.play.points ?? st.play.raw} pts\n`)
    + (st.play.marks || []).map((x) => (x ? "🟩" : "🟥")).join("") + "\nkhelakokhon.com/daily";
  try {
    const blob = await makeDailyCard(st, lang);
    const file = blob && new File([blob], `khelakokhon-daily-${st.day}.png`, { type: "image/png" });
    if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast(bn ? "ফল কপি হয়েছে, বন্ধুদের পাঠান" : "Result copied"); } catch { /* ignore */ }
}

function useDaily(user) {
  const [st, setSt] = useState(null);
  const off = useRef(0);
  const load = useCallback(() => dailyCall("daily_state").then((s) => { off.current = Date.parse(s.now) - Date.now(); setSt(s); return s; })
    .catch((e) => { setSt({ error: e.missing ? "missing" : "x" }); return null; }), []);
  useEffect(() => { load(); }, [user?.id, load]);
  return [st, setSt, load, off];
}

function NewBadgePop({ ids, onClose }) {
  const { lang } = useT();
  const bn = lang === "bn";
  useEffect(() => { quizAudio.sfx("win"); markBadgesSeen(ids); }, []);
  return (
    <div className="veil bdg-veil" onClick={onClose}>
      <Confetti />
      <div className="bdg-pop" onClick={(e) => e.stopPropagation()}>
        <small>{bn ? (ids.length > 1 ? `${num(ids.length, "bn")}টা নতুন ব্যাজ!` : "নতুন ব্যাজ!") : (ids.length > 1 ? `${ids.length} new badges!` : "New badge!")}</small>
        <div className="bdg-pop-row">{ids.map((id) => <BadgeIcon key={id} id={id} size={ids.length > 1 ? 84 : 112} />)}</div>
        {ids.map((id) => { const b = badgeOf(id); return b && <div key={id} className="bdg-pop-t"><b>{bn ? b[1] : b[2]}</b><span className="muted">{bn ? b[3] : b[4]}</span></div>; })}
        <button className="btn block" onClick={onClose}>{bn ? "দারুণ!" : "Awesome!"}</button>
      </div>
    </div>
  );
}

function BadgeGrid({ have = [], compact }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const got = Object.fromEntries(have.map((b) => [b.id, b.at]));
  return (
    <div className={"bdg-grid" + (compact ? " compact" : "")}>
      {BADGES.map(([id, nb, ne, db, de]) => (
        <div key={id} className={"bdg-cell" + (got[id] ? "" : " off")} title={bn ? db : de}>
          <BadgeIcon id={id} size={compact ? 46 : 54} locked={!got[id]} />
          <b>{bn ? nb : ne}</b>
          <small>{got[id] ? (bn ? "অর্জিত" : "Earned") : (bn ? db : de)}</small>
        </div>
      ))}
    </div>
  );
}

function WeekBoard() {
  const { lang } = useT();
  const bn = lang === "bn";
  const [off, setOff] = useState(0);
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); dailyCall("daily_week", { p_offset: off }).then(setD).catch(() => setD({ rows: [] })); }, [off]);
  const range = d?.start && d?.end && d.start !== d.end ? (() => { const [s, e] = [new Date(d.start + "T00:00:00"), new Date(d.end + "T00:00:00")]; return bn ? `${num(s.getDate(), "bn")} ${BN_MONTHS[s.getMonth()]} – ${num(e.getDate(), "bn")} ${BN_MONTHS[e.getMonth()]}` : `${s.getDate()} ${EN_MONTHS[s.getMonth()]} – ${e.getDate()} ${EN_MONTHS[e.getMonth()]}`; })() : null;
  return (
    <div className="card dl-week">
      <div className="seg" style={{ margin: "12px 12px 6px" }}>
        <button className={off === 0 ? "on" : ""} onClick={() => setOff(0)}>{bn ? "এই সপ্তাহ" : "This week"}</button>
        <button className={off === -1 ? "on" : ""} onClick={() => setOff(-1)}>{bn ? "গত সপ্তাহ" : "Last week"}</button>
      </div>
      {range && <div className="muted dl-range">{range}{off === 0 ? (bn ? " · শুক্রবার রাতে শেষ" : " · ends Friday night") : ""}</div>}
      {d === null ? <div className="spin" /> : !d.rows.length ? <div className="empty muted" style={{ padding: "18px 16px" }}>{bn ? "এখনো কেউ খেলেননি। প্রথম হোন!" : "Nobody yet. Be the first!"}</div> : (
        d.rows.map((r, i) => (
          <div key={i} className={"qz-pl dl-row" + (r.is_me ? " me" : "")}>
            <RankBadge rank={r.rank} lang={lang} />
            <span className="qz-nm">{r.name}{r.is_me ? (bn ? " (আপনি)" : " (you)") : ""}<small className="muted"> · {bn ? `${num(r.days, "bn")} দিন` : `${r.days}d`}</small></span>
            <span className="qz-sc"><b>{num(r.points, lang)}</b><small>{bn ? "পয়েন্ট" : "pts"}</small></span>
          </div>
        ))
      )}
    </div>
  );
}

function DailyPage({ user, goProfile, toast }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const wide = useWide();
  const [st, setSt, load, off] = useDaily(user);
  const [rev, setRev] = useState(null);   // সর্বশেষ প্রশ্নের ফল
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [pop, setPop] = useState(null);
  const [soundOn, setSoundOn] = useState(quizAudio.on);
  const playing = !!st?.play && !st.play.finished;
  const cur = st?.current;

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), playing ? 200 : 1000); return () => clearInterval(t); }, [playing]);
  useEffect(() => { document.documentElement.classList.toggle("quiz-focus", playing); return () => document.documentElement.classList.remove("quiz-focus"); }, [playing]);
  useEffect(() => { if (playing) quizAudio.start(); else quizAudio.stop(); return () => quizAudio.stop(); }, [playing]);
  // নতুন ব্যাজ (সাপ্তাহিক ব্যাজ পরে আসে, তাই যেকোনো সময়)
  useEffect(() => {
    const ids = [...(st?.new_badges || []), ...(st?.badges || []).map((b) => b.id)].filter((id) => !seenBadges().includes(id));
    if (ids.length && !playing) setPop([...new Set(ids)]);
  }, [st?.badges?.length, playing]);

  const nowS = now + (off.current || 0);
  const el = cur ? (nowS - Date.parse(cur.started_at)) / 1000 : 0;
  const left = cur ? Math.max(0, Math.ceil(DAILY_SEC - el)) : 0;
  // সময় শেষ
  useEffect(() => {
    if (cur && !rev && picked == null && left === 0) { quizAudio.sfx("bad"); setRev({ index: cur.index, timeout: true }); }
  }, [left, cur?.index]);

  async function start() {
    if (!user && !DEMO) return goProfile();
    quizAudio.unlock(); setBusy(true);
    try { const s = await dailyCall("daily_start"); off.current = Date.parse(s.now) - Date.now(); setSt(s); setRev(null); setPicked(null); }
    catch (e) { toast(e.message === "login required" ? (bn ? "আগে লগইন করুন" : "Please log in") : (bn ? "শুরু করা গেল না, আবার চেষ্টা করুন" : "Couldn't start")); }
    setBusy(false);
  }
  async function answer(i) {
    if (!cur || rev || picked != null) return;
    quizAudio.unlock(); setPicked(i);
    try {
      const r = await dailyCall("daily_answer", { p_index: cur.index, p_choice: i });
      quizAudio.sfx(r.correct ? "ok" : "bad");
      setRev({ ...r, index: cur.index, choice: i });
      setSt((s) => ({ ...s, play: { ...s.play, correct: s.play.correct + (r.correct ? 1 : 0), raw: s.play.raw + r.pts, marks: [...(s.play.marks || []), r.correct] } }));
    } catch { setRev({ index: cur.index, timeout: true }); }
  }
  async function next() {
    setBusy(true);
    try { const s = await dailyCall(rev?.finished ? "daily_state" : "daily_next"); off.current = Date.parse(s.now) - Date.now(); setSt(s); }
    catch { await load(); }
    setRev(null); setPicked(null); setBusy(false);
  }

  const switcher = <><GameSwitch on="quiz" /><QuizSub on="daily" /></>;
  if (!st) return <div className="sec">{switcher}<Loading /></div>;
  if (st.error) return <div className="sec">{switcher}<div className="card empty">{st.error === "missing" ? (bn ? "দৈনিক চ্যালেঞ্জ খুব শিগগিরই চালু হচ্ছে।" : "The daily challenge is coming soon.") : (bn ? "লোড করা গেল না। একটু পরে আবার চেষ্টা করুন।" : "Couldn't load. Try again shortly.")}</div></div>;

  // ── খেলা চলছে ──
  if (playing && (cur || rev)) {
    const idx = rev ? rev.index : cur.index;
    const marks = st.play.marks || [];
    return (
      <div className="sec qz-play dl-play">
        <div className="qz-top">
          <span className="dl-tag"><CalIcon width={15} height={15} />{bn ? "দৈনিক চ্যালেঞ্জ" : "Daily"}</span>
          <span className="qz-dots">{Array.from({ length: DAILY_Q }, (_, i) => <i key={i} className={i < marks.length ? (marks[i] ? "ok" : "bad") : i === idx ? "cur" : ""} />)}</span>
          <button className="qz-x" onClick={() => { quizAudio.setOn(!soundOn); setSoundOn(!soundOn); }} aria-label={soundOn ? (bn ? "শব্দ বন্ধ" : "Mute") : (bn ? "শব্দ চালু" : "Unmute")}><SoundIcon off={!soundOn} width={16} height={16} /></button>
        </div>
        <div className="qz-sub"><span>{bn ? `প্রশ্ন ${num(idx + 1, "bn")}/${num(DAILY_Q, "bn")}` : `Q ${idx + 1}/${DAILY_Q}`}{cur?.category ? ` · ${cur.category}` : ""}</span><span className="qz-myscore">{num(st.play.raw, lang)} {bn ? "পয়েন্ট" : "pts"}</span></div>
        {cur && !rev && <>
          <div className="qz-timer"><i style={{ width: `${Math.max(0, (DAILY_SEC - el) / DAILY_SEC) * 100}%` }} className={left <= 5 ? "low" : ""} /></div>
          <div className={"qz-left" + (left <= 5 ? " low" : "")}>{num(left, lang)}</div>
        </>}
        {cur && cur.index === idx && (
          <div className="qz-stage" key={idx}>
            <h2 className="qz-q">{cur.question}</h2>
            <div className="qz-opts">
              {cur.options.map((o, i) => {
                const cls = rev && !rev.timeout ? (i === rev.answer ? " right" : i === picked ? " wrong" : " dim") : rev?.timeout ? " dim" : picked === i ? " picked" : picked != null ? " dim" : "";
                return <button key={i} style={{ animationDelay: `${120 + i * 70}ms` }} className={"qz-opt" + cls} disabled={!!rev || picked != null} onClick={() => answer(i)}><span className="qz-l">{bn ? LETTERS[i] : "ABCD"[i]}</span>{o}</button>;
              })}
            </div>
          </div>
        )}
        {rev ? (
          <>
            <div className={"qz-verdict " + (rev.correct ? "ok" : "bad")}>
              <b>{rev.timeout ? (bn ? "সময় শেষ!" : "Time's up!") : rev.correct ? (bn ? `✓ সঠিক! +${num(rev.pts, "bn")} পয়েন্ট` : `✓ Correct! +${rev.pts}`) : (bn ? "✗ ভুল" : "✗ Wrong")}</b>
              {rev.correct && rev.pts > 10 && <span>{bn ? `দ্রুত উত্তরের বোনাস +${num(rev.pts - 10, "bn")}` : `Speed bonus +${rev.pts - 10}`}</span>}
              {rev.explanation && <span>{rev.explanation}</span>}
            </div>
            <button className="btn block qz-next qz-ic-btn" disabled={busy} onClick={next}>
              {rev.finished || idx + 1 >= DAILY_Q ? (bn ? "ফলাফল দেখুন" : "See result") : (bn ? "পরের প্রশ্ন" : "Next question")}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </>
        ) : picked != null ? <div className="qz-wait"><span className="spin sm" />{bn ? "উত্তর জমা হচ্ছে…" : "Locking in…"}</div> : null}
      </div>
    );
  }
  if (playing && !cur) {
    // মাঝপথে ফিরে এলে: পরের প্রশ্ন খোলা হয়নি
    return (
      <div className="sec">{switcher}
        <div className="card dl-hero">
          <div className="dl-hero-ic"><CalIcon width={30} height={30} /></div>
          <h2>{bn ? "চ্যালেঞ্জ চলছে" : "Challenge in progress"}</h2>
          <p className="muted">{bn ? `${num(st.play.idx, "bn")}/${num(DAILY_Q, "bn")} প্রশ্ন শেষ · ${num(st.play.raw, "bn")} পয়েন্ট` : `${st.play.idx}/${DAILY_Q} done · ${st.play.raw} pts`}</p>
          <button className="btn block dl-go" disabled={busy} onClick={next}>{bn ? "পরের প্রশ্নে চলুন" : "Continue"}</button>
        </div>
      </div>
    );
  }

  const nextIn = Math.max(0, Date.parse(st.next_at) - nowS);
  const hms = (() => { const t = Math.floor(nextIn / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s2 = t % 60; return [h, m, s2].map((x) => String(x).padStart(2, "0")).join(":"); })();
  const pl = st.play;
  const mult = (st.streak + (pl ? 0 : 1)) >= 7 ? 1.5 : (st.streak + (pl ? 0 : 1)) >= 3 ? 1.2 : 1;

  const main = pl?.finished ? (
    <>
      {pl.correct >= 4 && <Celebrate code={"daily-" + st.day} />}
      <div className="card dl-done">
        <div className="dl-done-h"><CalIcon width={18} height={18} />{bn ? "আজকের চ্যালেঞ্জ শেষ" : "Today's challenge done"} · {dayLabel(st.day, lang, { short: true, abs: true })}</div>
        <div className="dl-score"><CountUp to={pl.correct} lang={lang} /><small>/{num(DAILY_Q, lang)}</small></div>
        <div className="dl-marks">{(pl.marks || []).map((ok, i) => <span key={i} className={ok ? "ok" : "bad"}>{ok ? "✓" : "✕"}</span>)}</div>
        <div className="dl-pts"><b><CountUp to={pl.points ?? pl.raw} lang={lang} /></b> {bn ? "পয়েন্ট" : "points"}</div>
        <div className="muted dl-break">
          {num(pl.raw, lang)}{pl.correct === DAILY_Q ? ` + ${bn ? "নিখুঁত" : "perfect"} ${num(10, lang)}` : ""}{pl.mult > 1 ? ` × ${num(pl.mult, lang)} (${bn ? "ধারাবাহিকতা" : "streak"})` : ""}
        </div>
        <div className="dl-stats">
          <div><FlameIcon width={20} height={20} className="fl" /><b>{num(st.streak, lang)}</b><small>{bn ? "দিন টানা" : "day streak"}</small></div>
          <div><TrophyIcon width={20} height={20} /><b>{st.week?.rank ? `#${num(st.week.rank, lang)}` : "–"}</b><small>{bn ? "এই সপ্তাহে" : "this week"}</small></div>
          <div><TargetIcon width={20} height={20} /><b>{num(st.week?.points || 0, lang)}</b><small>{bn ? "সপ্তাহের পয়েন্ট" : "week pts"}</small></div>
        </div>
        <button className="btn block dl-share" onClick={() => shareDaily(st, lang, toast)}><ShareIcon width={18} height={18} />{bn ? "ফল শেয়ার করুন" : "Share result"}</button>
        <div className="dl-next">{bn ? "পরের চ্যালেঞ্জ" : "Next challenge in"} <b>{bn ? num(hms, "bn") : hms}</b></div>
      </div>
      {st.review && (
        <details className="card qz-review">
          <summary>{bn ? "আজকের প্রশ্ন আর সঠিক উত্তর" : "Today's questions & answers"}</summary>
          {st.review.map((r, i) => (
            <div key={i} className="qz-rv">
              <b>{num(i + 1, lang)}. {r.question}</b>
              <div className={r.choice === r.answer ? "ok" : "bad"}>{r.choice === r.answer ? "✓ " : "✗ "}{bn ? "সঠিক উত্তর" : "Answer"}: {r.options[r.answer]}{r.choice != null && r.choice !== r.answer ? ` · ${bn ? "আপনার" : "you"}: ${r.options[r.choice]}` : r.choice == null ? ` · ${bn ? "উত্তর দেননি" : "no answer"}` : ` · +${num(r.pts, lang)}`}</div>
              {r.explanation && <small className="muted">{r.explanation}</small>}
            </div>
          ))}
        </details>
      )}
    </>
  ) : (
    <div className="card dl-hero">
      <div className="dl-hero-top">
        <div className="dl-hero-ic"><CalIcon width={30} height={30} /></div>
        <div>
          <h2>{bn ? "আজকের চ্যালেঞ্জ" : "Today's challenge"}</h2>
          <div className="muted" style={{ fontSize: 13.5 }}>{dayLabel(st.day, lang, { abs: true })}</div>
        </div>
      </div>
      <div className="dl-chips">
        <span>{bn ? "৫টা প্রশ্ন" : "5 questions"}</span><span>{bn ? "প্রতিটায় ২০ সেকেন্ড" : "20s each"}</span><span>{bn ? "দিনে একবার" : "Once a day"}</span>
      </div>
      {st.streak > 0 && (
        <div className="dl-streak"><FlameIcon width={22} height={22} /><span><b>{bn ? `টানা ${num(st.streak, "bn")} দিন` : `${st.streak}-day streak`}</b><small>{bn ? (mult > 1 ? `আজ খেললে পয়েন্ট ×${num(mult, "bn")}` : "আজ খেলে ধারাবাহিকতা ধরে রাখুন") : (mult > 1 ? `Play today for ×${mult}` : "Play today to keep it going")}</small></span></div>
      )}
      <button className="btn block dl-go" disabled={busy} onClick={start}>{!user && !DEMO ? (bn ? "লগইন করে খেলুন" : "Log in to play") : (bn ? "চ্যালেঞ্জ শুরু করুন" : "Start the challenge")}</button>
      <div className="muted dl-meta">{st.players_today > 0 ? (bn ? `আজ ${num(st.players_today, "bn")} জন খেলেছেন · ` : `${st.players_today} played today · `) : ""}{bn ? "নতুন চ্যালেঞ্জ রাত ১২টায়" : "New challenge at midnight"}</div>
      <div className="dl-rules">
        <div><b>+১০</b><span>{bn ? "প্রতিটা সঠিক উত্তর" : "each right answer"}</span></div>
        <div><b>+৫</b><span>{bn ? "পর্যন্ত দ্রুততার বোনাস" : "speed bonus, max"}</span></div>
        <div><b>+১০</b><span>{bn ? "৫টাই সঠিক হলে" : "all 5 right"}</span></div>
        <div><b>×১.৫</b><span>{bn ? "টানা ৭ দিন খেললে" : "7-day streak"}</span></div>
      </div>
    </div>
  );

  const side = (
    <>
      <div className="sec"><div className="sec-h"><h2>{bn ? "সাপ্তাহিক র‍্যাঙ্কিং" : "Weekly ranking"}</h2></div><WeekBoard /></div>
      {(user || DEMO) && <div className="sec"><div className="sec-h"><h2>{bn ? "আপনার ব্যাজ" : "Your badges"}</h2><span className="muted" style={{ fontSize: 12.5 }}>{num((st.badges || []).length, lang)}/{num(BADGES.length, lang)}</span></div><div className="card"><BadgeGrid have={st.badges} /></div></div>}
    </>
  );

  return (
    <>
      {pop && <NewBadgePop ids={pop} onClose={() => setPop(null)} />}
      {wide ? (
        <>
          <div className="pg-grid"><div className="pg-main"><div className="sec">{switcher}{main}</div></div><aside className="pg-side">{side}</aside></div>
        </>
      ) : (
        <div className="sec">{switcher}{main}{side}</div>
      )}
    </>
  );
}

// হোমে আজকের চ্যালেঞ্জের ছোট কার্ড
function DailyTeaser({ user, side }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [st] = useDaily(user);
  const [, tick] = useState(0);
  const [hidden, setHidden] = useState(() => ls.get("daily_hide", null) === bdDay());
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30000); return () => clearInterval(t); }, []);
  if (st?.error || hidden) return null;
  const pl = st?.play;
  const done = pl?.finished;
  // বন্ধ করলে শুধু আজকের জন্য; রাত ১২টায় নতুন চ্যালেঞ্জ এলে আবার দেখা যাবে
  const close = (e) => { e.stopPropagation(); ls.set("daily_hide", st?.day || bdDay()); setHidden(true); };
  return (
    <div role="button" tabIndex={0} className={"dl-teaser" + (done ? " done" : " glow") + (side ? " side" : "")} onClick={() => nav.openDaily()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && nav.openDaily()}>
      <span className="dl-t-ic"><CalIcon width={22} height={22} /></span>
      <span className="dl-t-txt">
        <b>{done ? (bn ? `আজকের চ্যালেঞ্জ ✓ ${num(pl.correct, "bn")}/${num(DAILY_Q, "bn")}` : `Today ✓ ${pl.correct}/${DAILY_Q}`) : pl ? (bn ? "চ্যালেঞ্জ চলছে" : "Challenge in progress") : (bn ? "আজকের চ্যালেঞ্জ" : "Today's challenge")}</b>
        <small>{done
          ? (bn ? `${num(pl.points ?? pl.raw, "bn")} পয়েন্ট · পরেরটা ${countdown(Date.parse(st.next_at) - Date.now(), "bn")} পর` : `${pl.points ?? pl.raw} pts · next in ${countdown(Date.parse(st.next_at) - Date.now(), "en")}`)
          : pl ? (bn ? "চালিয়ে যান →" : "Continue →") : (bn ? "৫টা প্রশ্ন · ২ মিনিট · দিনে একবার" : "5 questions · 2 min · once a day")}</small>
      </span>
      {st?.streak > 0 && <span className="dl-t-streak"><FlameIcon width={16} height={16} />{num(st.streak, lang)}</span>}
      {!done && <span className="dl-t-go">{bn ? "খেলুন" : "Play"}</span>}
      <button className="dl-t-x" onClick={close} aria-label={bn ? "আজকের জন্য লুকান" : "Hide for today"} title={bn ? "আজকের জন্য লুকান" : "Hide for today"}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  );
}

// একই কুইজে একবারই উদযাপন (আবার লোড করলে নয়)
function Celebrate({ code }) {
  const [show] = useState(() => { try { if (sessionStorage.getItem("kk_qz_win_" + code)) return false; sessionStorage.setItem("kk_qz_win_" + code, "1"); } catch { /* ignore */ } return true; });
  useEffect(() => { if (show) quizAudio.sfx("win"); }, [show]);
  return show ? <Confetti /> : null;
}

function CountUp({ to, lang }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, t0;
    const step = (t) => { t0 ??= t; const k = Math.min(1, (t - t0) / 700); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{num(v, lang)}</>;
}

function QuizBoard({ players, lang, limit, lobby }) {
  const list = limit ? players.filter((p, i) => i < limit || p.me) : players;
  return (
    <div className="card qz-board">
      {list.map((p) => {
        const rank = players.indexOf(p);
        return (
          <div key={p.name + rank} className={"qz-pl" + (p.me ? " me" : "")}>
            {lobby ? <Initial name={p.name} /> : <RankBadge rank={rank + 1} lang={lang} />}
            <span className="qz-nm">{p.name}{p.me ? (lang === "bn" ? " (আপনি)" : " (you)") : ""}{p.host ? <small> · {lang === "bn" ? "হোস্ট" : "host"}</small> : null}</span>
            {!lobby && <span className="qz-sc"><b>{num(p.score, lang)}</b><small>{secTxt(p.ms, lang)}</small></span>}
          </div>
        );
      })}
    </div>
  );
}

function QuizPage({ code, user, goProfile, toast }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [st, setSt] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [picked, setPicked] = useState({});
  const [, tick] = useState(0);
  const offset = useRef(0);
  const joined = useRef(false);
  const status = useRef(null);
  const reload = useRef(() => {});
  const playing = st?.status === "running";
  useEffect(() => {
    document.documentElement.classList.toggle("quiz-focus", playing);
    return () => document.documentElement.classList.remove("quiz-focus");
  }, [playing]);
  // মিউজিক: খেলা চলাকালীন বাজে, শেষ হলে বা পাতা ছাড়লে থামে
  const [soundOn, setSoundOn] = useState(quizAudio.on);
  useEffect(() => { if (playing && st?.phase !== "waiting") quizAudio.start(); else quizAudio.stop(); }, [playing, st?.phase]);
  useEffect(() => () => quizAudio.stop(), []);
  const toggleSound = () => { quizAudio.unlock(); quizAudio.setOn(!soundOn); setSoundOn(!soundOn); };
  // অগ্রগতির বিন্দু: কোন প্রশ্নে সঠিক/ভুল (এই কুইজের জন্য ফোনে মনে রাখে)
  const [marks, setMarks] = useState({});
  useEffect(() => { try { setMarks(JSON.parse(sessionStorage.getItem("kk_qz_" + code) || "{}")); } catch { setMarks({}); } }, [code]);
  useEffect(() => {
    const c = st?.current;
    if (st?.phase !== "reveal" || !c || marks[c.index]) return;
    const res = c.mine?.choice == null ? "miss" : c.mine.correct ? "ok" : "bad";
    const next = { ...marks, [c.index]: res };
    setMarks(next); try { sessionStorage.setItem("kk_qz_" + code, JSON.stringify(next)); } catch { /* ignore */ }
    quizAudio.sfx(res === "ok" ? "ok" : "bad");
  }, [st?.phase, st?.current?.index]);
  const quit = () => {
    if (window.confirm(bn ? "কুইজ ছেড়ে যাবেন? বাকি প্রশ্নগুলো উত্তর না দেওয়া হিসেবে ধরা হবে।" : "Leave the quiz? Remaining questions count as unanswered.")) nav.openQuiz(null, true);
  };

  // অবস্থা জানা: খেলা চলাকালীন প্রতি সেকেন্ডে, অপেক্ষার সময় একটু ধীরে
  useEffect(() => {
    if (!code) { setSt(null); return; }
    let alive = true, timer;
    setSt(null); setErr(""); setPicked({}); joined.current = false;
    // পরের খোঁজ: সাধারণত ০.৯–১.৬ সেকেন্ডে, কিন্তু ধাপ বদলের (প্রশ্ন শেষ, উত্তর দেখানো শেষ) ঠিক পরেই
    const nextDelay = (s) => {
      if (s.status !== "running") return 1600;
      if (!s.ends_at) return 1200; // নিজে শেষ করে অন্যদের অপেক্ষা
      return Math.max(120, Math.min(900, Date.parse(s.ends_at) - Date.parse(s.now) + 80));
    };
    let last = null;
    const load = async () => {
      clearTimeout(timer);
      try {
        const s = await quizCall("quiz_state", { p_code: code });
        if (!alive) return;
        offset.current = Date.parse(s.now) - Date.now();
        setSt(s); setErr(""); status.current = s.status; last = s;
        if (user && !joined.current && s.status === "lobby" && !s.players.some((p) => p.me)) {
          joined.current = true;
          await quizCall("quiz_join", { p_code: code }).catch((e) => setErr(quizMsg(e, lang)));
        }
        if (s.next_code && (s.member || s.players.some((p) => p.me))) { nav.openQuiz(s.next_code, true); return; }
      } catch (e) { if (alive) setErr(quizMsg(e, lang)); }
      if (alive) timer = setTimeout(load, last ? nextDelay(last) : 1600);
    };
    reload.current = () => alive && load();
    load();
    const t2 = setInterval(() => tick((x) => x + 1), 250);
    return () => { alive = false; clearTimeout(timer); clearInterval(t2); };
  }, [code, user?.id]);

  // solo = একা খেলা: বানিয়েই সঙ্গে সঙ্গে শুরু, অপেক্ষার ঘর ছাড়াই
  async function create(solo) {
    if (!user) { try { localStorage.setItem("kk_quiz", "new"); } catch { /* ignore */ } toast(bn ? "কুইজ খেলতে আগে লগইন করুন" : "Log in to play"); goProfile(); return; }
    setBusy(true);
    try {
      if (solo === true) quizAudio.unlock();
      const c = await quizCall("quiz_create", { n: QUIZ_N });
      if (solo === true) await quizCall("quiz_start", { p_code: c });
      nav.openQuiz(c, true);
    }
    catch (e) { setErr(quizMsg(e, lang)); }
    setBusy(false);
  }
  async function close() {
    setBusy(true);
    try { await quizCall("quiz_close", { p_code: code }); nav.openQuiz(null, true); }
    catch (e) { setErr(quizMsg(e, lang)); }
    setBusy(false);
  }
  async function next() { try { await quizCall("quiz_next", { p_code: code }); } catch { /* ৩ সেকেন্ড পরে এমনিতেই আসবে */ } reload.current(); }
  async function start() { quizAudio.unlock(); setBusy(true); try { await quizCall("quiz_start", { p_code: code }); reload.current(); } catch (e) { setErr(quizMsg(e, lang)); } setBusy(false); }
  async function again() {
    setBusy(true);
    try {
      const c = await quizCall("quiz_again", { p_code: code });
      if (st?.players?.length === 1) await quizCall("quiz_start", { p_code: c }); // একা খেলায় অপেক্ষার ঘর লাগে না
      nav.openQuiz(c, true);
    } catch (e) { setErr(quizMsg(e, lang)); }
    setBusy(false);
  }
  async function answer(i, choice) {
    quizAudio.unlock();
    if (picked[i] != null) return;
    setPicked((p) => ({ ...p, [i]: choice }));
    try { await quizCall("quiz_answer", { p_code: code, p_index: i, p_choice: choice }); reload.current(); }
    catch (e) { toast(quizMsg(e, lang)); }
  }

  // ── শুরুর পাতা ──
  if (!code) return (
    <div className="sec">
      <GameSwitch on="quiz" />
      <QuizSub on="live" />
      <div className="card qz-hero">
        <div className="qz-hero-ic"><QuizIcon width={34} height={34} /></div>
        <h2>{bn ? "স্পোর্টস কুইজ" : "Sports quiz"}</h2>
        <p className="muted">{bn ? "১০টা প্রশ্ন, প্রতিটায় ৩০ সেকেন্ড। একা খেলে নিজেকে যাচাই করুন, বা লিংক পাঠিয়ে বন্ধুদের সাথে লাইভ। সমান স্কোর হলে যে দ্রুত উত্তর দিয়েছে, সে এগিয়ে।" : "10 questions, 30 seconds each. Test yourself solo, or send a link and play live with friends. Ties go to the faster player."}</p>
        <div className="qz-modes">
          <button className="btn block qz-mode" disabled={busy} onClick={() => create(true)}><UserIcon width={20} height={20} /><span><b>{bn ? "একা খেলুন" : "Play solo"}</b><small>{bn ? "নিজেকে যাচাই করুন" : "Test yourself"}</small></span></button>
          <button className="btn ghost block qz-mode" disabled={busy} onClick={() => create(false)}><UsersIcon width={20} height={20} /><span><b>{bn ? "বন্ধুদের সাথে খেলুন" : "Play with friends"}</b><small>{bn ? "লিংক পাঠিয়ে লাইভ" : "Live, by link"}</small></span></button>
        </div>
      </div>
      <div className="card qz-join">
        <b>{bn ? "বন্ধুর কুইজে যোগ দিন" : "Join a friend's quiz"}</b>
        <form onSubmit={(e) => { e.preventDefault(); const c = joinCode.trim().toUpperCase(); if (c.length >= 4) nav.openQuiz(c); }}>
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder={bn ? "কোড লিখুন, যেমন 9A0FFC" : "Enter code"} maxLength={8} autoCapitalize="characters" />
          <button className="btn" disabled={joinCode.trim().length < 4}>{bn ? "যোগ দিন" : "Join"}</button>
        </form>
      </div>
      {err && <div className="err">{err}</div>}
    </div>
  );

  if (!st) return <div className="sec"><GameSwitch on="quiz" />{err ? <div className="card empty">{err}<div style={{ marginTop: 12 }}><button className="btn ghost" onClick={() => nav.openQuiz()}>{bn ? "কুইজের পাতায় ফিরুন" : "Back"}</button></div></div> : <Loading />}</div>;

  const me = st.players.find((p) => p.me);
  const myRank = st.players.indexOf(me);

  // শেষ হওয়া বা বন্ধ কুইজ: লিংক আর চলে না (খেলোয়াড়রা ফল দেখতে পান, হোস্ট বন্ধ করার আগ পর্যন্ত)
  if (st.status === "closed" || (st.status === "finished" && !me)) return (
    <div className="sec">
      <GameSwitch on="quiz" />
      <div className="card qz-hero">
        <div className="qz-hero-ic"><QuizIcon width={34} height={34} /></div>
        <h2>{bn ? "এই কুইজ শেষ হয়ে গেছে" : "This quiz has ended"}</h2>
        <p className="muted">{bn ? "লিংকটি আর চালু নেই। চাইলে নতুন একটা কুইজ শুরু করুন।" : "The link no longer works. Start a new quiz instead."}</p>
        <button className="btn block" onClick={() => nav.openQuiz(null, true)}>{bn ? "নতুন কুইজ খেলুন" : "Play a new quiz"}</button>
      </div>
    </div>
  );
  const el = st.started_at ? (Date.now() + offset.current - Date.parse(st.started_at)) / 1000 : 0;
  const cur = st.current;
  const intoQ = cur?.started_at ? (Date.now() + offset.current - Date.parse(cur.started_at)) / 1000 : 0;
  const left = Math.max(0, Math.ceil(st.q_seconds - intoQ));

  // ── অপেক্ষা (লবি) ──
  if (st.status === "lobby") return (
    <div className="sec">
      <GameSwitch on="quiz" />
      <div className="card qz-lobby">
        <small className="muted">{bn ? "কুইজের কোড" : "Quiz code"}</small>
        <div className="qz-code">{st.code}</div>
        <button className="btn ghost block qz-ic-btn" onClick={() => shareQuiz(st.code, bn, toast)}><ShareIcon width={18} height={18} />{bn ? "বন্ধুদের লিংক পাঠান" : "Send link to friends"}</button>
      </div>
      <div className="sec-h" style={{ marginTop: 14 }}><h2>{bn ? `খেলোয়াড় · ${num(st.players.length, "bn")} জন` : `Players · ${st.players.length}`}</h2></div>
      <QuizBoard players={st.players} lang={lang} lobby />
      {!user ? (
        <div className="card empty">{bn ? "এই কুইজে খেলতে আগে লগইন করুন।" : "Log in to play this quiz."}<div style={{ marginTop: 10 }}><button className="btn" onClick={() => { try { localStorage.setItem("kk_quiz", st.code); } catch { /* ignore */ } goProfile(); }}>{bn ? "লগইন করুন" : "Log in"}</button></div></div>
      ) : st.is_host ? (
        <button className="btn block qz-go qz-ic-btn" disabled={busy} onClick={start}>{busy ? "…" : <><PlayIcon width={18} height={18} />{bn ? (st.players.length > 1 ? "সবাই এসেছে? শুরু করুন" : "একা শুরু করুন") : "Start"}</>}</button>
      ) : <div className="qz-wait"><span className="spin sm" />{bn ? "হোস্ট শুরু করলেই খেলা শুরু হবে…" : "Waiting for the host to start…"}</div>}
      {err && <div className="err">{err}</div>}
    </div>
  );

  // ── শেষ ──
  if (st.status === "finished") return (
    <div className="sec">
      <GameSwitch on="quiz" />
      {me && (me.score >= 8 || (st.players.length > 1 && myRank === 0 && me.score > 0)) && <Celebrate code={st.code} />}
      {me ? (
        <div className="card qz-result">
          <div className="qz-big">{st.players.length > 1 ? <RankBadge rank={myRank + 1} lang={lang} big /> : <span className="qz-badge big r1"><TrophyIcon width={30} height={30} /></span>}</div>
          <h2>{st.players.length > 1 ? (bn ? `আপনি ${num(st.players.length, "bn")} জনের মধ্যে ${ord(myRank + 1, "bn")}` : `You finished ${ord(myRank + 1, "en")} of ${st.players.length}`) : (bn ? "কুইজ শেষ!" : "Quiz over!")}</h2>
          <div className="qz-score"><CountUp to={me.score} lang={lang} /><small>/{num(st.total, lang)}</small></div>
          <div className="muted">{bn ? `সঠিক উত্তর · মোট সময় ${secTxt(me.ms, "bn")}` : `correct · total time ${secTxt(me.ms, "en")}`}</div>
        </div>
      ) : <div className="card empty">{bn ? "কুইজ শেষ। আপনি এই কুইজে ছিলেন না।" : "This quiz is over."}</div>}
      {st.players.length > 1 && <><div className="sec-h" style={{ marginTop: 14 }}><h2>{bn ? "ফলাফল" : "Results"}</h2></div><QuizBoard players={st.players} lang={lang} /></>}
      <div className="qz-actions">
        {st.is_host ? (
          <>
            <button className="btn block qz-ic-btn" disabled={busy} onClick={again}><ReplayIcon width={18} height={18} />{bn ? "আবার খেলুন (নতুন ১০টা প্রশ্ন)" : "Play again"}</button>
            <button className="btn ghost block" disabled={busy} onClick={close}>{bn ? "না, খেলা শেষ করুন" : "No, end the game"}</button>
            {st.players.length > 1 && <small className="muted qz-note">{bn ? "খেলা শেষ করলে এই লিংকটি আর কাজ করবে না।" : "Ending closes this link for everyone."}</small>}
          </>
        ) : (
          <>
            <div className="qz-wait"><span className="spin sm" />{bn ? "হোস্ট আবার খেললে নিজে থেকেই যোগ হয়ে যাবেন" : "You'll join automatically if the host plays again"}</div>
            <button className="btn ghost block" onClick={() => nav.openQuiz(null, true)}>{bn ? "বের হোন" : "Leave"}</button>
          </>
        )}
      </div>
      {st.review && (
        <details className="card qz-review">
          <summary>{bn ? "সব প্রশ্ন আর সঠিক উত্তর দেখুন" : "Review answers"}</summary>
          {st.review.map((r, i) => (
            <div key={i} className="qz-rv">
              <b>{num(i + 1, lang)}. {r.question}</b>
              <div className={r.choice === r.answer ? "ok" : "bad"}>{r.choice === r.answer ? "✓ " : "✗ "}{bn ? "সঠিক উত্তর" : "Answer"}: {r.options[r.answer]}{r.choice != null && r.choice !== r.answer ? ` · ${bn ? "আপনার" : "you"}: ${r.options[r.choice]}` : r.choice == null ? ` · ${bn ? "উত্তর দেননি" : "no answer"}` : ""}</div>
              {r.explanation && <small className="muted">{r.explanation}</small>}
            </div>
          ))}
        </details>
      )}
      {err && <div className="err">{err}</div>}
    </div>
  );

  // ── চলছে ──
  if (st.phase === "countdown") return (
    <div className="sec"><div className="qz-count" key={Math.ceil(-el)}>{num(Math.max(1, Math.ceil(-el)), lang)}</div><p className="muted" style={{ textAlign: "center" }}>{bn ? "প্রস্তুত হোন…" : "Get ready…"}</p></div>
  );
  if (st.phase === "waiting") return (
    <div className="sec">
      <div className="card qz-result">
        <div className="qz-big"><span className="qz-badge big r1"><TrophyIcon width={30} height={30} /></span></div>
        <h2>{bn ? "আপনি সব প্রশ্ন শেষ করেছেন!" : "You're done!"}</h2>
        {me && <div className="qz-score"><CountUp to={me.score} lang={lang} /><small>/{num(st.total, lang)}</small></div>}
        <div className="qz-wait"><span className="spin sm" />{bn ? `অন্যদের শেষ হওয়ার অপেক্ষা · ${num(st.finished_count, "bn")}/${num(st.players.length, "bn")} জন শেষ করেছেন` : `Waiting for others · ${st.finished_count}/${st.players.length} done`}</div>
        <small className="muted">{bn ? "সবাই শেষ করলেই কে কততম, দেখা যাবে।" : "Rankings appear when everyone finishes."}</small>
      </div>
    </div>
  );
  if (st.phase === "watching") return <div className="sec"><GameSwitch on="quiz" /><div className="card empty">{bn ? "খেলা চলছে। আপনি এই কুইজে নেই।" : "A quiz is in progress. You're not in it."}</div></div>;
  if (!cur) return <div className="sec"><Loading /></div>;
  const mine = cur.mine?.choice ?? picked[cur.index];
  const reveal = st.phase === "reveal";
  return (
    <div className="sec qz-play">
      <div className="qz-top">
        <button className="qz-x" onClick={quit} aria-label={bn ? "কুইজ ছেড়ে যান" : "Leave quiz"}>✕</button>
        <span className="qz-dots" aria-label={bn ? `প্রশ্ন ${num(cur.index + 1, "bn")}/${num(st.total, "bn")}` : `Question ${cur.index + 1} of ${st.total}`}>
          {Array.from({ length: st.total }, (_, i) => <i key={i} className={marks[i] || (i === cur.index ? "cur" : "")} />)}
        </span>
        <button className="qz-x" onClick={toggleSound} aria-label={soundOn ? (bn ? "শব্দ বন্ধ" : "Mute") : (bn ? "শব্দ চালু" : "Unmute")}><SoundIcon off={!soundOn} width={16} height={16} /></button>
      </div>
      <div className="qz-sub"><span>{bn ? `প্রশ্ন ${num(cur.index + 1, "bn")}/${num(st.total, "bn")}` : `Q ${cur.index + 1}/${st.total}`} · {cur.category}</span>{me && <span className="qz-myscore">{bn ? "স্কোর" : "Score"} {num(me.score, lang)}</span>}</div>
      <div className="qz-timer"><i style={{ width: reveal ? 0 : `${Math.max(0, (st.q_seconds - intoQ) / st.q_seconds) * 100}%` }} className={left <= 5 && !reveal ? "low" : ""} /></div>
      {!reveal && <div className={"qz-left" + (left <= 5 ? " low" : "")}>{num(left, lang)}</div>}
      <div className="qz-stage" key={cur.index}>
      <h2 className="qz-q">{cur.question}</h2>
      <div className="qz-opts">
        {cur.options.map((o, i) => {
          const cls = reveal ? (i === cur.answer ? " right" : i === mine ? " wrong" : " dim") : mine === i ? " picked" : mine != null ? " dim" : "";
          return <button key={i} style={{ animationDelay: `${120 + i * 70}ms` }} className={"qz-opt" + cls} disabled={!me || reveal || mine != null} onClick={() => answer(cur.index, i)}><span className="qz-l">{bn ? LETTERS[i] : "ABCD"[i]}</span>{o}</button>;
        })}
      </div>
      </div>
      {reveal ? (
        <div className={"qz-verdict " + (mine === cur.answer ? "ok" : "bad")}>
          <b>{mine === cur.answer ? (bn ? "✓ সঠিক!" : "✓ Correct!") : mine == null ? (bn ? "সময় শেষ" : "Time's up") : (bn ? "✗ ভুল" : "✗ Wrong")}</b>
          {cur.explanation && <span>{cur.explanation}</span>}
        </div>
      ) : null}
      {reveal ? (
        <button className="btn block qz-next qz-ic-btn" onClick={next} ref={(el) => el && !el.dataset.seen && (el.dataset.seen = "1", setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60))}>{cur.index + 1 >= st.total ? (bn ? "শেষ করুন" : "Finish") : (bn ? "পরের প্রশ্ন" : "Next question")}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      ) : mine != null ? (
        <div className="qz-wait"><span className="spin sm" />{bn ? "উত্তর জমা হচ্ছে…" : "Locking in…"}</div>
      ) : !me ? <div className="qz-wait">{bn ? "আপনি এই কুইজে নেই, শুধু দেখছেন।" : "You're watching."}</div> : null}
    </div>
  );
}

// ════════════════ pages/Onboarding.jsx ════════════════
const MAX = { fav: 3, rival: 5 };

// প্রিয় (সর্বোচ্চ ৩) আর রাইভাল (সর্বোচ্চ ৫) দল বাছাই। ফোন নম্বর না থাকলে আগে সেটা চায়।
function Onboarding({ initial, comps, needPhone, onDone, onCancel }) {
  const { t, lang } = useT();
  const [step, setStep] = useState(needPhone ? "phone" : "fav");
  const [phone, setPhone] = useState("");
  const [fav, setFav] = useState(initial?.fav || []);
  const rival = (initial?.rival || []).filter((id) => !fav.includes(id)); // পুরনো রাইভাল ডেটা যেমন ছিল থাকে
  const [teams, setTeams] = useState(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { getTeams().then(setTeams).catch(() => setTeams([])); }, []);

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = (teams || []).filter((tm) => !s || [...teamAliases(tm), tm.tla].some((x) => x?.toLowerCase().includes(s)));
    return comps
      .map((c) => ({ c, list: list.filter((tm) => (tm.league || "CL") === c.code).sort((a, b) => teamName(a, lang).localeCompare(teamName(b, lang))) }))
      .filter((g) => g.list.length);
  }, [teams, q, comps, lang]);

  // রাইভাল বাছাই আর নেই — শুধু প্রিয় দল
  const kind = "fav";
  const sel = fav;
  const setSel = setFav;
  const other = [];

  function toggle(id) {
    if (sel.includes(id)) setSel(sel.filter((x) => x !== id));
    else if (sel.length < MAX[kind]) setSel([...sel, id]);
  }

  async function finish() {
    setBusy(true); setErr("");
    try { await onDone({ fav, rival, phone: phone.trim() || undefined }); }
    catch (e) { setErr(e?.message || t("error")); setBusy(false); }
  }

  if (step === "phone") {
    const valid = /^(\+?88)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""));
    return (
      <div className="sec">
        <h2 style={{ fontSize: 20, marginBottom: 4 }}>{t("phoneNeeded")}</h2>
        <p className="muted" style={{ fontSize: 13.5, margin: "0 0 14px" }}>{t("phoneWhy")}</p>
        <label className="field"><span>{t("phone")} <small className="muted">({t("optional")})</small></span>
          <input inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => { setPhone(""); setStep("fav"); }}>{t("skip")}</button>
          <button className="btn" style={{ flex: 1 }} disabled={!valid} onClick={() => setStep("fav")}>{t("next")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sec">
      <h2 style={{ fontSize: 20 }}>{t(kind === "fav" ? "pickFav" : "pickRival")}</h2>
      <p className="muted" style={{ fontSize: 13.5, margin: "4px 0 12px" }}>
        {t(kind === "fav" ? "pickFavSub" : "pickRivalSub")} · {num(sel.length, lang)}/{num(MAX[kind], lang)}
      </p>
      <label className="field" style={{ marginBottom: 4 }}>
        <input placeholder={"🔍 " + t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {teams === null && <div className="spin" />}
      {groups.map((g) => (
        <div key={g.c.code}>
          <div className="lg-h"><CompIcon c={g.c} size={16} />{compName(g.c, lang)}</div>
          <div className="team-grid">
            {g.list.map((tm) => {
              const on = sel.includes(tm.id);
              const taken = other.includes(tm.id);
              return (
                <button key={tm.id} className={"team-pick" + (on ? " " + kind : "")} disabled={taken || (!on && sel.length >= MAX[kind])} onClick={() => toggle(tm.id)}>
                  {on && <span className="mark">{kind === "fav" ? "★" : "⚔"}</span>}
                  <Crest team={tm} size={36} />
                  {teamName(tm, lang)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {err && <div className="err">{err}</div>}
      <div className="sticky-foot">
        <button className="btn ghost" onClick={onCancel}>{t("skip")}</button>
        <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={finish}>{busy ? "…" : t("done")}</button>
      </div>
    </div>
  );
}

// ════════════════ pages/Profile.jsx ════════════════
function AuthForm() {
  const { t } = useT();
  const [mode, setMode] = useState("signup");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setErr(""); setNote("");
    if (mode === "signup") {
      if (!f.name.trim()) return setErr("নাম দিন");
      if (f.password.length < 6) return setErr("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const r = await signUp({ ...f, name: f.name.trim(), });
        if (r.needsConfirm) setNote(t("checkEmail"));
      } else await signIn(f);
    } catch (e2) {
      const m = e2?.message || "";
      setErr(/invalid login/i.test(m) ? "ইমেইল বা পাসওয়ার্ড ভুল" : /registered/i.test(m) ? "এই ইমেইলে আগেই অ্যাকাউন্ট আছে — লগইন করুন" : /confirm/i.test(m) ? "আগে ইমেইলের লিংকে ক্লিক করে অ্যাকাউন্ট চালু করুন" : m || t("error"));
    }
    setBusy(false);
  }

  return (
    <div className="sec">
      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>{t("signup")}</button>
        <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>{t("login")}</button>
      </div>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <label className="field"><span>{t("name")}</span><input value={f.name} onChange={up("name")} autoComplete="name" /></label>
        )}
        <label className="field"><span>{t("email")}</span><input type="email" required value={f.email} onChange={up("email")} autoComplete="email" /></label>
        <label className="field"><span>{t("password")}</span><input type="password" required value={f.password} onChange={up("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
        {err && <div className="err">{err}</div>}
        {note && <div className="note">{note}</div>}
        <button className="btn block" disabled={busy}>{busy ? "…" : t(mode === "signup" ? "signup" : "login")}</button>
      </form>
      <div className="or">{t("or")}</div>
      <button className="btn ghost block" onClick={() => signInGoogle().catch((e) => setErr(e.message))}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {t("google")}
      </button>
    </div>
  );
}

function ProfileBadges({ user }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [st] = useDaily(user);
  if (!st || st.error) return null;
  return (
    <div className="sec">
      <div className="sec-h"><h2>{bn ? "দৈনিক চ্যালেঞ্জের ব্যাজ" : "Daily challenge badges"}</h2><button className="link" onClick={() => nav.openDaily()}>{bn ? "খেলুন" : "Play"} →</button></div>
      <div className="card">
        <div className="pb-stats">
          <div><FlameIcon width={18} height={18} className="fl" /><b>{num(st.streak, lang)}</b><small>{bn ? "এখন টানা" : "current streak"}</small></div>
          <div><TrophyIcon width={18} height={18} /><b>{num(st.best_streak, lang)}</b><small>{bn ? "সেরা ধারাবাহিকতা" : "best streak"}</small></div>
          <div><CalIcon width={18} height={18} /><b>{num((st.badges || []).length, lang)}/{num(BADGES.length, lang)}</b><small>{bn ? "ব্যাজ" : "badges"}</small></div>
        </div>
        <BadgeGrid have={st.badges} compact />
      </div>
    </div>
  );
}

function Profile({ user, profile, myTeams, teamsById, lang, setLang, theme, setTheme, onEditTeams }) {
  const { t } = useT();
  const settings = (
    <div className="sec">
      <div className="sec-h"><h2>{t("settings")}</h2></div>
      <div className="card">
        <div className="kv" style={{ borderTop: 0 }}>{t("language")}
          <div className="seg" style={{ width: 150 }}>
            <button className={lang === "bn" ? "on" : ""} onClick={() => setLang("bn")}>বাংলা</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
        <div className="kv">{t("theme")}
          <div className="seg" style={{ width: 150 }}>
            <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}><MoonIcon width={14} height={14} style={{ verticalAlign: -2 }} /> {t("dark")}</button>
            <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}><SunIcon width={14} height={14} style={{ verticalAlign: -2 }} /> {t("light")}</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return <>{<AuthForm />}{settings}</>;

  const name = profile?.display_name || user.email;
  const nav = useNav();
  const chips = (ids) => ids.map((id) => teamsById[id]).filter(Boolean).map((tm) => (
    <button className="tchip" key={tm.id} onClick={() => nav.openTeam(tm.id)}><Crest team={tm} size={18} />{teamName(tm, lang)}</button>
  ));
  return (
    <>
      <div className="sec">
        <div className="card">
          <div className="prof-head">
            <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{name}</div>
              <div className="muted" style={{ fontSize: 13 }}>{user.email}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h"><h2>{t("myTeams")}</h2><button className="link" onClick={onEditTeams}>{t("edit")}</button></div>
        <div className="card" style={{ paddingTop: 12 }}>
          <div className="muted" style={{ fontSize: 12.5, padding: "0 16px 6px" }}>★ {t("favs")}</div>
          <div className="team-chips">{myTeams.fav.length ? chips(myTeams.fav) : <span className="muted" style={{ fontSize: 13 }}>{lang === "bn" ? "এখনো কোনো প্রিয় দল নেই। যেকোনো দলের পাতায় ☆ চাপুন, বা ওপরে এডিট করুন।" : "No favourites yet. Tap ☆ on any team page, or Edit above."}</span>}</div>
        </div>
      </div>
      <ProfileBadges user={user} />
      {settings}
      <div className="sec">
        <button className="btn ghost block" onClick={signOut}>{t("logout")}</button>
      </div>
    </>
  );
}

// ════════════════ pages/Ask.jsx ════════════════
// ═══════════════════════════════════════════════════════════════
//  "খেলা কখন? জিজ্ঞেস করো" — প্রশ্ন বুঝে সাইটের সূচি থেকে উত্তর
//  কোনো AI বা বাইরের API নেই: দলের নাম আর প্রশ্নের ধরন মিলিয়ে উত্তর বানায়।
// ═══════════════════════════════════════════════════════════════

// দলের ডাকনাম (বাংলা আর ইংরেজি) — name_bn/name_en ছাড়াও এগুলো চেনে
const NICK = {
  86: ["রিয়াল", "রিয়াল মাদ্রিদ", "মাদ্রিদ", "real", "real madrid", "madrid", "rma"],
  81: ["বার্সা", "বার্সেলোনা", "barca", "barça", "barcelona"],
  78: ["অ্যাটলেটিকো", "আতলেতিকো", "এটলেটিকো", "অ্যাতলেতিকো", "atletico", "atleti"],
  66: ["ম্যানইউ", "ম্যান ইউ", "ম্যানচেস্টার ইউনাইটেড", "ইউনাইটেড", "man utd", "man united", "manchester united", "united", "mufc"],
  65: ["ম্যান সিটি", "ম্যানসিটি", "সিটি", "man city", "manchester city", "city"],
  64: ["লিভারপুল", "liverpool", "pool"],
  57: ["আর্সেনাল", "গানার্স", "arsenal", "gunners"],
  61: ["চেলসি", "chelsea"],
  73: ["টটেনহ্যাম", "টটেনহাম", "স্পার্স", "tottenham", "spurs"],
  67: ["নিউক্যাসল", "নিউকাসল", "newcastle"],
  5: ["বায়ার্ন", "বায়ার্ন মিউনিখ", "bayern", "bayern munich"],
  4: ["ডর্টমুন্ড", "dortmund", "bvb"],
  3: ["লেভারকুসেন", "leverkusen"],
  524: ["পিএসজি", "পিএসজির", "psg", "paris saint germain"],
  109: ["জুভেন্টাস", "জুভ", "juventus", "juve"],
  98: ["এসি মিলান", "মিলান", "ac milan", "milan"],
  108: ["ইন্টার", "ইন্টার মিলান", "inter", "inter milan"],
  113: ["নাপোলি", "napoli"],
  100: ["রোমা", "roma"],
  90: ["বেতিস", "betis"],
  92: ["সোসিয়েদাদ", "sociedad"],
};

const COMP_WORDS = {
  CL: ["চ্যাম্পিয়ন্স লিগ", "চ্যাম্পিয়নস লিগ", "ইউসিএল", "champions league", "ucl"],
  PL: ["প্রিমিয়ার লিগ", "ইপিএল", "premier league", "epl"],
  PD: ["লা লিগা", "লালিগা", "la liga", "laliga"],
  BL1: ["বুন্দেসলিগা", "bundesliga"],
  SA: ["সিরি আ", "সিরিয়া", "সিরি এ", "serie a"],
  FL1: ["লিগ আঁ", "লিগ ওয়ান", "ligue 1", "ligue un"],
};

const W = {
  last: ["শেষ", "আগের", "গত", "ফল", "রেজাল্ট", "স্কোর", "জিত", "হার", "হেরে", "ড্র", "last", "result", "score", "won", "lost", "previous"],
  today: ["আজ", "today", "tonight"],
  tomorrow: ["আগামীকাল", "কালকে", "কাল", "tomorrow"],
  yesterday: ["গতকাল", "yesterday"],
};

// সপ্তাহের দিন: রবিবার = 0
const WEEKDAYS = [
  ["রবি", "sunday", "sun"], ["সোম", "monday", "mon"], ["মঙ্গল", "tuesday", "tue"], ["বুধ", "wednesday", "wed"],
  ["বৃহস্পতি", "thursday", "thu"], ["শুক্র", "friday", "fri"], ["শনি", "saturday", "sat"],
];

const norm = (s) => (s || "").normalize("NFC").replace(/[‌‍]/g, "").toLowerCase().replace(/[?!।,.;:"'’()]/g, " ").replace(/\s+/g, " ").trim();
const isBn = (s) => /[ঀ-৿]/.test(s);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// প্রশ্নে কোন কোন দলের নাম আছে (লম্বা নাম আগে, একই জায়গা দুবার নয়)
// সাধারণ ইংরেজি শব্দ, দলের নাম হলেও প্রশ্নে অন্য অর্থে আসে
const STOP = ["nice", "club", "real", "city", "united", "sport", "racing"];

function findTeams(q, teams) {
  // নামের যে শব্দগুলো শুধু একটা দলেরই আছে (বেতিস, সেল্টা, হটস্পার), সেগুলোও চেনে
  const wordOwners = {};
  for (const t of teams)
    for (const w of new Set(teamAliases(t).filter(Boolean).flatMap((x) => norm(x).split(" "))))
      if (w.length >= 3 && !/^\d+$/.test(w)) (wordOwners[w] ||= new Set()).add(t.id);
  const aliases = [];
  for (const t of teams) {
    const words = Object.entries(wordOwners).filter(([, ids]) => ids.size === 1 && ids.has(t.id)).map(([w]) => w);
    const list = new Set([...teamAliases(t), ...(NICK[t.id] || [])].filter(Boolean).map(norm).concat(words));
    for (const a of list) if (a.length >= 3 && !STOP.includes(a)) aliases.push([a, t.id]);
  }
  aliases.sort((x, y) => y[0].length - x[0].length);
  const taken = [];
  const found = [];
  for (const [a, id] of aliases) {
    // বাংলা: শব্দের শুরুতে মিললেই হবে (রিয়ালের, বার্সার); ইংরেজি: পুরো শব্দ
    const re = isBn(a) ? new RegExp("(^|\\s)" + esc(a)) : new RegExp("(^|[^a-z])" + esc(a) + "($|[^a-z])");
    const m = re.exec(q);
    if (!m) continue;
    const start = m.index + m[1].length, end = start + a.length;
    if (taken.some(([s, e]) => start < e && end > s)) continue;
    taken.push([start, end]);
    if (!found.some(([x]) => x === id)) found.push([id, start]);
  }
  // প্রশ্নে যে দল আগে, সে আগে
  return found.sort((a, b) => a[1] - b[1]).map(([id]) => id);
}

// শব্দের শুরুতে মিললে ধরা হবে ("কাল" মিলবে, "গতকাল"-এর ভেতরের "কাল" নয়)
const wordAt = (q, w) => {
  const a = norm(w);
  return (isBn(a) ? new RegExp("(^|\\s)" + esc(a)) : new RegExp("(^|[^a-z])" + esc(a))).test(q);
};
const has = (q, words) => words.some((w) => wordAt(q, w));

function findComp(q) {
  for (const [code, words] of Object.entries(COMP_WORDS)) if (words.some((w) => q.includes(norm(w)))) return code;
  return null;
}

// বাংলা ষষ্ঠী: স্বরচিহ্ন বা ঁ-তে শেষ → র (রোমার, লিগ আঁর); ই/এ-তে শেষ → য়ের (গালাতাসারাইয়ের); অন্য স্বরবর্ণে → র; ব্যঞ্জনে → ের
const poss = (name, lang) => (lang !== "bn" ? `${name}'s`
  : /[\u09BE-\u09CC\u0981]$/.test(name) ? name + "র"
  : /[\u0987\u0988\u098F]$/.test(name) ? name + "য়ের"
  : /[\u0985-\u0994]$/.test(name) ? name + "র"
  : name + "ের");

// ════════ খেলোয়াড়ের প্রশ্ন ════════
const COMP_LABEL = { CL: ["চ্যাম্পিয়ন্স লিগ", "Champions League"], PL: ["প্রিমিয়ার লিগ", "Premier League"], PD: ["লা লিগা", "La Liga"], BL1: ["বুন্দেসলিগা", "Bundesliga"], SA: ["সিরি আ", "Serie A"], FL1: ["লিগ ওয়ান", "Ligue 1"] };
const compLabel = (code, lang) => (COMP_LABEL[code] || [code, code])[lang === "bn" ? 0 : 1];
// একটা দল/খেলোয়াড় যে প্রতিযোগিতাগুলোয় আছে, নাম ধরে: "লা লিগা ও চ্যাম্পিয়ন্স লিগ" (লিগ আগে, ইউসিএল পরে)
const compList = (codes, lang) => {
  const list = [...new Set(codes.filter(Boolean))].sort((a, b) => (a === "CL") - (b === "CL")).map((c) => compLabel(c, lang));
  return list.length < 2 ? list.join("") : list.slice(0, -1).join(", ") + (lang === "bn" ? " ও " : " & ") + list[list.length - 1];
};
// বাংলায় লেখা নাম (এমবাপ্পে) আর ইংরেজি নাম (Mbappé) একই "কঙ্কালে" নামিয়ে মেলানো
const BN2L = {
  "ক": "k", "খ": "k", "গ": "g", "ঘ": "g", "ঙ": "n", "চ": "c", "ছ": "c", "জ": "j", "ঝ": "j", "ঞ": "n",
  "ট": "t", "ঠ": "t", "ড": "d", "ঢ": "d", "ণ": "n", "ত": "t", "থ": "t", "দ": "d", "ধ": "d", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "b", "ম": "m", "য": "j", "র": "r", "ল": "l", "শ": "s", "ষ": "s", "স": "s", "হ": "h",
  "ড়": "r", "ঢ়": "r", "য়": "", "ৎ": "t", "ং": "n", "ঁ": "", "ঃ": "",
};
const skel = (latin) => latin.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/ph/g, "f").replace(/ch|sch|sh|zh/g, "s").replace(/th/g, "t").replace(/[vw]/g, "b").replace(/[zx]/g, "s")
  .replace(/q|ck|c(?=[aou]|$)/g, "k").replace(/c/g, "s").replace(/gu(?=[ei])/g, "g").replace(/j/g, "j").replace(/y/g, "")
  .replace(/[^a-z]/g, "").replace(/[aeiouh]/g, "").replace(/(.)\1+/g, "$1");
// য়, ড়, ঢ় ইউনিকোডে দুই চিহ্নে ভাঙে (য + ়), তাই আগে এক অক্ষরে আনা
const bnPrep = (w) => w.normalize("NFC").replace(/\u09AF\u09BC/g, "Y").replace(/[\u09A1\u09A2]\u09BC/g, "R");
const bnSkel = (word) => skel([...bnPrep(word)].map((ch) => (ch === "Y" ? "" : ch === "R" ? "r" : BN2L[ch] ?? "")).join(""));
// স্বরবর্ণসহ পুরো উচ্চারণ (কঙ্কাল মিললেও উচ্চারণ অনেক আলাদা হলে বাদ: ওসিমেন ≠ Simeone)
const BN_V = { "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou", "য়": "y" };
const sound = (latin) => latin.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/ph/g, "f").replace(/sch|sh|ch|zh/g, "s").replace(/th/g, "t").replace(/[vw]/g, "b").replace(/z/g, "s").replace(/x/g, "ks")
  .replace(/q|ck|c(?=[aou]|$)/g, "k").replace(/c/g, "s").replace(/y/g, "i").replace(/[^a-z]/g, "")
  // ফরাসি "ou" = উ (Courtois → কুর্তোয়া), শব্দের ভেতরের h প্রায় উচ্চারিত হয় না (Osimhen → ওসিমেন)
  .replace(/ou/g, "u").replace(/(?<=[a-z])h/g, "").replace(/(.)\1+/g, "$1");
const bnSound = (word) => sound([...bnPrep(word)].map((ch) => (ch === "Y" ? "y" : ch === "R" ? "r" : ch === "ং" ? "ng" : BN_V[ch] ?? BN2L[ch] ?? "")).join(""));
// শব্দের শেষের বিভক্তি বাদ: এমবাপ্পের, হালান্ডকে, কেইনের
const stripBn = (w) => w.replace(/(দের|এর|ের|কে|রা|ও|র|য়ের|য়)$/u, "");
const lev = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
// জনপ্রিয় ডাকনাম → নামের অংশ
const PLAYER_NICK = {
  "ভিনি": "vinicius", "vini": "vinicius", "ভিনিসিয়ুস": "vinicius", "লেভা": "lewandowski", "লেওয়ানডফস্কি": "lewandowski", "lewa": "lewandowski",
  "কেইন": "kane", "কেন": "kane", "হ্যারি কেইন": "kane", "সালাহ": "salah", "সালা": "salah", "লামিন": "yamal", "ইয়ামাল": "yamal",
  "ডাইক": "dijk", "ভ্যান ডাইক": "dijk", "আলিসন": "alisson", "রদ্রি": "rodri", "ডি ইয়ং": "jong", "গাভি": "gavira", "gavi": "gavira", "পেদ্রি": "pedri", "লাউতারো": "lautaro", "lautaro": "lautaro", "এমবাপে": "mbappe", "সন": "son", "ডি ব্রুইনে": "bruyne", "ব্রুনো": "bruno", "রোনালদো": "ronaldo", "মেসি": "messi", "নেইমার": "neymar",
};
// প্রতিযোগিতা, দিন আর সাধারণ ফুটবল শব্দ কখনো খেলোয়াড়ের নাম হিসেবে ধরা হয় না
const ASK_STOP_EXTRA = ["লিগ", "টেবিল", "পয়েন্ট", "সূচি", "ফল", "ফলাফল", "ড্র", "ডার্বি", "ক্লাসিকো", "সেমিফাইনাল", "ফাইনাল", "কোয়ার্টার", "প্রিমিয়ার", "চ্যাম্পিয়ন্স",
  "ভালো", "খারাপ", "রাত", "রাতে", "দুপুর", "সকাল", "বিকাল", "সন্ধ্যা", "ভোর", "লন্ডন", "নর্থ", "সাউথ", "মৌসুম", "খেলবে", "জিতবে", "জিতেছে", "হেরেছে", "এগিয়ে", "পিছিয়ে",
  "কোনটা", "কারা", "শুরু", "আছে", "খেল", "খেলে", "খেলেন", "খেলছে", "দল", "দলে", "করে", "করেন", "বলো", "জানাও", "দেখাও", "বলুন", "জানান", "দেখান", "আপনার", "আপনি", "আজকে", "গতকাল", "প্রেডিকশন", "আমার", "তোমার", "বাংলাদেশ", "সময়", "ম্যাচগুলো", "খেলাগুলো", "কখন", "কোথায়", "দেখাবে", "চলছে",
  "next", "last", "match", "matches", "result", "results", "table", "derby", "today", "tomorrow", "yesterday", "league", "when", "where", "who", "won", "lost", "goal", "goals"];
const ASK_STOP = ["গোল", "গোলদাতা", "করেছে", "করছে", "কয়টা", "কয়টি", "কত", "কতটা", "কবে", "কখন", "লাস্ট", "শেষ", "পরের", "খেলা", "এই", "মৌসুমে", "সিজনে",
  "অ্যাসিস্ট", "এসিস্ট", "সর্বোচ্চ", "টপ", "স্কোরার", "কে", "কোন", "কেন", "কিনা", "দলে", "বনাম", "আজ", "কাল", "আগামীকাল", "কার", "বেশি", "সবচেয়ে", "মোট", "লিগে", "লিগায়", "পেনাল্টি", "ম্যাচ", "খেলেছে", "দিয়েছে"];

// প্রশ্নে নামটা আছে কিনা, পরে শুধু বিভক্তি থাকতে পারে (কিন ≠ কিনা, এমবাপ্পে = এমবাপ্পের)
const BN_SUFFIX = ["", "র", "ের", "এর", "য়ের", "কে", "ও", "রা", "দের", "য়"];
const bnNameIn = (q, name) => {
  const i = q.indexOf(name);
  if (i < 0 || (i > 0 && q[i - 1] !== " ")) return false;
  const rest = q.slice(i + name.length).split(" ")[0];
  return BN_SUFFIX.includes(rest);
};
function findPlayer(q, scorers, teams) {
  if (!scorers.length) return null;
  const teamWords = new Set(teams.flatMap((t) => [...teamAliases(t), ...(NICK[t.id] || [])].filter(Boolean).flatMap((x) => norm(x).split(" "))));
  // এক খেলোয়াড় অনেক লিগে থাকতে পারে, তাই id ধরে একবার
  const people = [...new Map(scorers.map((r) => [r.player_id, r])).values()];
  const goalsOf = {};
  for (const x of scorers) goalsOf[x.player_id] = (goalsOf[x.player_id] || 0) + (x.goals || 0);
  const latinQ = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // ১) ইংরেজি পুরো নাম বা শেষ নাম
  for (const r of people) {
    const full = norm(r.player_name).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const parts = full.split(" ").filter((w) => w.length >= (goalsOf[r.player_id] ? 4 : 5) && !teamWords.has(w) && !ASK_STOP_EXTRA.includes(w));
    if (latinQ.includes(full) || parts.some((w) => new RegExp("(^|[^a-z])" + esc(w) + "($|[^a-z])").test(latinQ))) return r;
  }
  // ২) ডাকনাম (খেলোয়াড় তালিকায় না থাকলে "নেই" বলার জন্য ডাকনামটা আর কঙ্কাল-মেলায় যায় না)
  const nickUsed = [];
  for (const [nick, part] of Object.entries(PLAYER_NICK))
    if (wordAt(q, nick)) {
      nickUsed.push(norm(nick));
      const r = people.find((x) => norm(x.player_name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(" ").includes(part));
      if (r) return r;
    }
  // ৩ক) পত্রিকার বাংলা নাম হুবহু (পুরো নাম বা নামের শেষ অংশ, বিভক্তিসহ: এমবাপ্পের, কোর্তোয়ার)
  // পুরো নাম মিললে সে-ই; শুধু শেষ অংশ মিললে (মার্তিনেজ) যার গোল বেশি
  let byKey = null;
  for (const r of people) {
    const bnName = PLAYER_BN[r.player_name];
    if (!bnName) continue;
    if (bnNameIn(q, norm(bnName))) return r;
    const parts = norm(bnName).split(" ");
    const key = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
    if (key.length >= 3 && bnNameIn(q, key) && (!byKey || (goalsOf[r.player_id] || 0) > (goalsOf[byKey.player_id] || 0))) byKey = r;
  }
  if (byKey) return byKey;
  // ৩) বাংলা শব্দ → কঙ্কাল মিলিয়ে
  const stopSet = new Set([...ASK_STOP, ...ASK_STOP_EXTRA, ...Object.values(COMP_WORDS).flat().flatMap((x) => norm(x).split(" ")), ...Object.values(W).flat(), ...WEEKDAYS.flat()].map(norm));
  const stopWord = (w) => stopSet.has(w) || [...stopSet].some((sw) => isBn(sw) && sw.length >= 3 && w.startsWith(sw) && w.length - sw.length <= 3);
  const words = q.split(" ").filter((w) => isBn(w) && !nickUsed.some((n) => w.startsWith(n)) && !stopWord(w)).map(stripBn).filter((w) => w.length >= 3 && !stopWord(w) && ![...teamWords].some((t) => isBn(t) && (t.startsWith(w) || (w.startsWith(t) && w.length - t.length <= 2))));
  // শুধু শেষ নাম (বা এক-নামের খেলোয়াড়) — প্রথম নামে মেলালে ভুল হয় (ওসিমেন ≠ Ousmane)
  // মিলের মান = উচ্চারণের দূরত্ব (কম = ভালো); গোল না করা খেলোয়াড়ের ক্ষেত্রে আরও কড়া, কারণ তালিকায় তিন হাজার নাম
  let best = null;
  for (const w of words) {
    const ws = bnSkel(w), wfull = bnSound(w), wv = wfull.replace(/[aeiou]+$/, "");
    if (ws.length < 2) continue;
    for (const r of people) {
      const parts = norm(r.player_name).split(" ");
      const last = parts.length > 1 ? parts.slice(1) : parts;
      const scorer = (goalsOf[r.player_id] || 0) > 0;
      for (const part of last.filter((x) => x.length >= 3)) {
        const ps = skel(part);
        if (ps.length < 2) continue;
        const d = lev(ws, ps);
        const pfull = sound(part), pv = pfull.replace(/[aeiou]+$/, "");
        // শেষের স্বর বাদ দিয়ে আর না দিয়ে, দুভাবেই মিলিয়ে যেটা কাছে (কুর্তোয়া ↔ Courtois)
        const ratio = Math.min(lev(wv, pv) / Math.max(wv.length, pv.length, 1), lev(wfull, pfull) / Math.max(wfull.length, pfull.length, 1));
        const minLen = Math.min(ws.length, ps.length);
        const okD = (minLen >= 5 ? d <= 1 : minLen >= 3 ? d <= 1 : d === 0)
          && ratio <= (!scorer ? (ws.length < 4 ? 0.15 : 0.2) : ws.length < 3 ? 0.2 : 0.3)
          && (minLen >= 4 || ratio <= 0.2);
        if (!okD) continue;
        const sc = ratio + d * 0.05 - Math.min(goalsOf[r.player_id] || 0, 30) * 0.001; // সমান হলে যার গোল বেশি (ইসাক → Isak)
        if (!best || sc < best.sc) best = { r, sc };
      }
    }
  }
  return best?.r || null;
}

async function answerPlayer(q, teams, lang) {
  const bn = lang === "bn";
  const wantTop = has(q, ["সর্বোচ্চ গোলদাতা", "টপ স্কোরার", "সবচেয়ে বেশি গোল", "গোলদাতার তালিকা", "top scorer", "top scorers", "golden boot"]);
  const goalish = has(q, ["গোল", "অ্যাসিস্ট", "এসিস্ট", "পেনাল্টি", "goal", "goals", "assist", "scored", "score"]);
  let scorers;
  try { scorers = await getAllScorers(); } catch { return null; }
  const comp = findComp(q);
  const rank = (code) => scorers.filter((r) => r.competition_code === code).sort((a, b) => b.goals - a.goals || (b.assists || 0) - (a.assists || 0));
  const cName = (code) => compLabel(code, lang);

  if (wantTop) {
    const codes = comp ? [comp] : ["CL", "PL", "PD", "BL1", "SA", "FL1"];
    if (comp) {
      const list = rank(comp).slice(0, 5);
      if (!list.length) return { text: bn ? "এই প্রতিযোগিতার গোলদাতার তালিকা এখনো আসেনি।" : "No scorers list for this competition yet.", matches: [] };
      return { text: bn ? `${poss(cName(comp), "bn")} শীর্ষ গোলদাতা:` : `${cName(comp)} top scorers:`, matches: [], players: list.map((r) => ({ ...r, code: comp })) };
    }
    const tops = codes.map((c) => rank(c)[0] && { ...rank(c)[0], code: c }).filter(Boolean);
    return { text: bn ? "প্রতিটা প্রতিযোগিতার সর্বোচ্চ গোলদাতা:" : "Top scorer in each competition:", matches: [], players: tops };
  }

  // গোলদাতা + ছয় লিগের সব স্কোয়াড (গোল না করা খেলোয়াড়ও)
  let squad = [];
  try { squad = await getAllPlayers(); } catch { /* শুধু গোলদাতা দিয়ে চলবে */ }
  const known = new Set(scorers.map((x) => x.player_id));
  const byTeam = Object.fromEntries(teams.map((t) => [t.id, t]));
  const pool = [...scorers, ...squad.filter(([id]) => !known.has(id)).map(([id, n, tid, pos]) => ({ player_id: id, player_name: n, team_id: tid, team: byTeam[tid], position: pos, goals: 0, competition_code: null }))];
  const found = findPlayer(q, pool, teams);
  const r = found && { ...found, team: found.team || byTeam[found.team_id], position: found.position || squad.find(([id]) => id === found.player_id)?.[3] || null };
  if (!r) {
    // গোলের প্রশ্ন, কিন্তু কোনো দল বা চেনা খেলোয়াড় নেই
    if (goalish && !findTeams(q, teams).length && !has(q, ["আজ", "কাল", "today", "tomorrow"]))
      return { text: bn ? "এই খেলোয়াড়কে খুঁজে পাইনি। ছয় লিগের খেলোয়াড়দের নাম দিয়ে জিজ্ঞেস করুন; নামটা অন্যভাবে লিখে দেখুন, যেমন ইংরেজিতে।" : "Couldn't find that player. Ask about players in the six competitions, or try the name another way, e.g. in English.", matches: [] };
    return null;
  }
  const name = playerName(r.player_name, lang);
  const rows = scorers.filter((x) => x.player_id === r.player_id).sort((a, b) => b.goals - a.goals);
  const posName = posLabel(r.position, lang);
  const club = r.team ? teamName(r.team, lang) + (!rows.length && posName ? `, ${posName}` : "") : null;
  // খেলোয়াড়ের দল কোন কোন প্রতিযোগিতায় খেলে (ঘরোয়া লিগ + চ্যাম্পিয়ন্স লিগে থাকলে)
  const clubComps = async () => {
    const out = [];
    const lg = teams.find((t) => t.id === r.team_id)?.league;
    if (lg && lg !== "CL") out.push(lg);
    try { if ((await getStandings("CL")).some((x) => x.team_id === r.team_id)) out.push("CL"); } catch { /* ইউসিএল জানা না গেলে বাদ */ }
    return out;
  };
  const zeroLine = (code) => scorersComplete(scorers, code)
    ? (bn ? `${cName(code)}: ০ গোল, এই মৌসুমে এখনো গোল পাননি।` : `${cName(code)}: 0 goals so far this season.`)
    : (bn ? `${cName(code)}: গোলের পুরো হিসাব এখনো সাইটে আসেনি।` : `${cName(code)}: full scoring data isn't in yet.`);
  // উত্তরের নিচের খেলোয়াড়-সারি: গোলদাতা হলে তার সারি, না হলে দলের প্রথম প্রতিযোগিতায় ০ (পুরো হিসাব না এলে —)
  const pRow = async (code) => {
    if (rows.length) return { ...(rows.find((x) => x.competition_code === code) || rows[0]), code: code && rows.some((x) => x.competition_code === code) ? code : rows[0].competition_code };
    const c = code || (await clubComps())[0] || null;
    return { ...r, code: c, goals: c && scorersComplete(scorers, c) ? 0 : null };
  };
  const lastGoal = has(q, ["কবে", "লাস্ট", "শেষ গোল", "সর্বশেষ", "last goal", "when"]) && goalish;
  const note = lastGoal ? (bn ? " কোন ম্যাচে কে গোল করেছে সেই তথ্য সাইটের ফ্রি ডেটায় নেই, তাই শেষ গোল কবে বলতে পারছি না।" : " Who scored in each match isn't in the site's free data, so I can't tell when the last goal was.") : "";
  const line = (x) => {
    const pos = rank(x.competition_code).findIndex((y) => y.player_id === x.player_id) + 1;
    return bn
      ? `${cName(x.competition_code)}: ${num(x.goals, "bn")} গোল, ${num(x.assists ?? 0, "bn")} অ্যাসিস্ট${x.played != null ? `, ${num(x.played, "bn")} ম্যাচে` : ""}${x.penalties ? ` (পেনাল্টিতে ${num(x.penalties, "bn")})` : ""}। গোলদাতার তালিকায় ${ord(pos, "bn")}।`
      : `${cName(x.competition_code)}: ${x.goals} goals, ${x.assists ?? 0} assists${x.played != null ? ` in ${x.played} matches` : ""}${x.penalties ? ` (${x.penalties} pens)` : ""}. ${ord(pos, "en")} in the scoring chart.`;
  };

  // খেলোয়াড়ের দলের পরের খেলা
  if (!goalish && has(q, ["পরের", "নেক্সট", "খেলা কবে", "next", "match"]) && r.team_id) {
    const list = await getTeamMatches([r.team_id], { upcoming: true, limit: 3 });
    if (list.length) return { text: (bn ? `${name} খেলেন ${r.team ? teamName(r.team, lang) : club}-এ${posName ? ` (${posName})` : ""}। ` : `${name} plays for ${r.team ? teamName(r.team, lang) : club}${posName ? ` (${posName})` : ""}. `) + describe(list[0], r.team_id, false, lang), matches: list, players: [await pRow()] };
  }

  if (comp) {
    const x = rows.find((y) => y.competition_code === comp);
    if (!x) {
      const plays = (await clubComps()).includes(comp);
      const text = plays
        ? (bn ? `${name}${club ? ` (${club})` : ""}, এই মৌসুমে ` : `${name}${club ? ` (${club})` : ""} this season — `) + zeroLine(comp)
        : (bn ? `${name}-এর দল${club ? ` ${club}` : ""} এই মৌসুমে ${cName(comp)} খেলছে না।` : `${name}'s club${club ? ` ${club}` : ""} isn't in the ${cName(comp)} this season.`);
      return { text: text + note, matches: [], players: [await pRow(plays ? comp : null)] };
    }
    return { text: (bn ? `${name}${club ? ` (${club})` : ""}, এই মৌসুমে ` : `${name}${club ? ` (${club})` : ""} this season — `) + line(x) + note, matches: [], players: [{ ...x, code: comp }] };
  }
  const total = rows.reduce((t, x) => t + x.goals, 0), totalA = rows.reduce((t, x) => t + (x.assists || 0), 0);
  // দল যে প্রতিযোগিতায় খেলে কিন্তু গোলদাতার তালিকায় নেই, সেগুলোও লেখা হবে (০ গোল)
  const extra = (await clubComps()).filter((c) => !rows.some((x) => x.competition_code === c));
  const allCodes = [...rows.map((x) => x.competition_code), ...extra];
  const head = allCodes.length > 1
    ? (bn ? `${name}${club ? ` (${club})` : ""} এই মৌসুমে ${compList(allCodes, "bn")} মিলিয়ে মোট ${num(total, "bn")} গোল, ${num(totalA, "bn")} অ্যাসিস্ট।\n` : `${name}${club ? ` (${club})` : ""}: ${total} goals and ${totalA} assists this season across ${compList(allCodes, "en")}.\n`)
    : (bn ? `${name}${club ? ` (${club})` : ""}, এই মৌসুমে ` : `${name}${club ? ` (${club})` : ""} this season — `);
  if (!allCodes.length) return { text: (bn ? `${name}${club ? ` (${club})` : ""}। এই মৌসুমে এখনো গোলের হিসাব নেই।` : `${name}${club ? ` (${club})` : ""}. No goals recorded this season.`) + note, matches: [], players: [await pRow()] };
  return { text: head + [...rows.map(line), ...extra.map(zeroLine)].join("\n") + note, matches: [], players: rows.length ? rows.map((x) => ({ ...x, code: x.competition_code })) : [await pRow()] };
}

// উত্তর বানানো: { text, matches, players? }

// ════════ জিজ্ঞেস করো: আরও ধরনের প্রশ্ন (টেবিল, ফর্ম, মুখোমুখি, দলের তথ্য, লাইভ, সপ্তাহ, আমার দল) ════════
const AW = {
  table: ["টেবিল", "অবস্থান", "কততম", "কত নম্বর", "কয় নম্বর", "পজিশন", "শীর্ষে", "শীর্ষ", "এক নম্বরে", "লিডার", "এগিয়ে", "পিছিয়ে", "table", "standing", "position", "rank", "top of", "leader", "leading", "ahead"],
  points: ["পয়েন্ট", "points"],
  bottom: ["অবনমন", "রেলিগেশন", "তলানি", "সবার নিচে", "relegation", "bottom"],
  form: ["ফর্ম", "কেমন খেলছে", "শেষ ৫", "শেষ পাঁচ", "শেষ কয়েক", "সাম্প্রতিক", "form", "last 5", "last five", "recent"],
  h2h: ["হেড টু হেড", "হেড-টু-হেড", "মুখোমুখি", "রেকর্ড", "ইতিহাস", "head to head", "h2h", "record", "history"],
  coach: ["কোচ", "ম্যানেজার", "coach", "manager"],
  venue: ["স্টেডিয়াম", "মাঠ", "ভেন্যু", "হোম গ্রাউন্ড", "stadium", "venue", "ground"],
  founded: ["প্রতিষ্ঠা", "প্রতিষ্ঠিত", "founded", "established"],
  squad: ["স্কোয়াড", "দলে কারা", "খেলোয়াড়দের তালিকা", "squad", "players list", "roster"],
  info: ["দলের তথ্য", "তথ্য দাও", "সম্পর্কে", "about", "info"],
  stats: ["পরিসংখ্যান", "কয়টা জয়", "কয়টা জিত", "কয়টা হার", "কয়টা ম্যাচ", "গোল খেয়েছে", "গোল দিয়েছে", "কত গোল", "stats", "statistics", "wins", "conceded", "goals scored"],
  live: ["লাইভ", "এখন চলছে", "চলছে", "এখন কী", "এখন কোন", "live", "right now", "on now", "playing now"],
  week: ["এই সপ্তাহ", "সপ্তাহে", "সামনের সপ্তাহ", "৭ দিন", "সাত দিন", "this week", "next 7", "week"],
  weekend: ["উইকেন্ড", "সপ্তাহান্ত", "weekend"],
  mine: ["আমার দল", "প্রিয় দল", "আমার প্রিয়", "my team", "my teams", "my favourite", "my favorite"],
  help: ["কী কী জিজ্ঞেস", "কি কি জিজ্ঞেস", "কী জিজ্ঞেস", "কি জিজ্ঞেস", "কী পারো", "কি পারো", "কী কী পারো", "কী পারেন", "কি পারেন", "কী কী পারেন", "সাহায্য", "help", "what can"],
  pron: ["তাদের", "ওদের", "ওরা", "তারা", "এদের", "দলটা", "দলটার", "ওই দল", "their", "they", "them", "that team"],
};
// ════════ সাইটের গাইড: "কুইজ কীভাবে খেলব", "প্রেডিকশনের নিয়ম" ইত্যাদির ধাপে ধাপে উত্তর ════════
// key → { w: চেনার শব্দ, alone: শুধু নাম লিখলেই গাইড, bn/en: { title, intro, steps, facts?, tips?, cta } }
const GUIDES = {
  quiz: {
    w: ["কুইজ", "quiz"], alone: true, icon: "quiz",
    bn: { title: "স্পোর্টস কুইজ কীভাবে খেলবেন", intro: "ফুটবল, ক্রিকেট, অলিম্পিক, টেনিস আর বাংলাদেশের খেলাধুলা নিয়ে ১০টা প্রশ্নের দ্রুতগতির খেলা।",
      steps: [["গেম → স্পোর্টস কুইজ", "নিচের মেনুতে \"গেম\", তারপর ওপরে \"স্পোর্টস কুইজ\"। খেলতে লগইন লাগবে।"],
        ["একা নাকি বন্ধুদের সাথে", "\"একা খেলুন\" চাপলে সঙ্গে সঙ্গে শুরু। \"বন্ধুদের সাথে খেলুন\" চাপলে একটা কোড আর লিংক পাবেন, সেটা বন্ধুদের পাঠান।"],
        ["হোস্ট শুরু করেন", "সবাই এলে যিনি কুইজ বানিয়েছেন তিনি \"শুরু করুন\" চাপবেন। ৩–২–১, তারপর সবাই একসাথে শুরু।"],
        ["প্রতি প্রশ্নে ৩০ সেকেন্ড", "চারটা অপশনের একটা বেছে নিন। যে যার নিজের গতিতে এগোবেন, অন্যের জন্য অপেক্ষা নেই।"],
        ["উত্তর দেখে পরের প্রশ্ন", "সঠিক উত্তর আর ছোট ব্যাখ্যা দেখাবে, তারপর \"পরের প্রশ্ন\" চাপুন। ওপরের বিন্দুতে সবুজ মানে সঠিক, লাল মানে ভুল।"],
        ["সবার শেষে ফলাফল", "সবাই শেষ করলে দেখাবে কে কততম। হোস্ট চাইলে \"আবার খেলুন\" (নতুন ১০টা প্রশ্ন), নয়তো \"খেলা শেষ করুন\"।"]],
      facts: [["১০", "প্রশ্ন"], ["৩০ সে.", "প্রতি প্রশ্নে"], ["১", "সঠিক = ১ পয়েন্ট"]],
      tips: ["সমান স্কোর হলে যিনি মোট কম সময়ে উত্তর দিয়েছেন তিনি এগিয়ে। উত্তর না দিলে পুরো ৩০ সেকেন্ড ধরা হয়।", "খেলার মাঝে অন্যদের স্কোর দেখা যায় না, চমকটা শেষে।", "ওপরের স্পিকার বোতামে মিউজিক বন্ধ/চালু করা যায়।"],
      cta: ["এখনই কুইজ খেলুন", "quiz"] },
    en: { title: "How the sports quiz works", intro: "A fast 10-question game on football, cricket, the Olympics, tennis and Bangladesh sport.",
      steps: [["Games → Sports quiz", "Tap Games in the menu, then Sports quiz. You need to be logged in."], ["Solo or with friends", "Play solo starts right away; Play with friends gives you a code and a link to share."], ["Host starts", "When everyone has joined, the host taps Start. 3-2-1 and everyone begins together."], ["30 seconds per question", "Pick one of four options. Everyone goes at their own pace."], ["See the answer, then Next", "The answer and a short explanation appear; tap Next. Dots at the top turn green or red."], ["Results at the end", "When everyone finishes you see the ranking. The host can play again or end the game."]],
      facts: [["10", "questions"], ["30s", "each"], ["1", "point per correct"]], tips: ["Ties go to the faster player.", "Other players' scores stay hidden until the end."], cta: ["Play the quiz", "quiz"] },
  },
  predict: {
    w: ["প্রেডিকশন", "অনুমান", "predict", "prediction"], alone: true, icon: "target",
    bn: { title: "প্রেডিকশন কীভাবে কাজ করে", intro: "খেলা শুরুর আগে স্কোর অনুমান করুন, মিললে পয়েন্ট।",
      steps: [["যেকোনো ম্যাচে চাপুন", "ম্যাচের পাতায় বা দলের পাতায় যেকোনো খেলায় চাপলে ম্যাচের বিস্তারিত খুলবে।"],
        ["স্কোর বসান", "দুই দলের গোল − / + দিয়ে বসান। নিচে দেখাবে কে জিতবে বা ড্র।"],
        ["\"প্রেডিকশন দিন\"", "চাপলেই জমা। কিকঅফের আগ পর্যন্ত যতবার খুশি বদলাতে পারবেন।"],
        ["খেলা শেষে পয়েন্ট", "ম্যাচ শেষ হওয়ার পরের হালনাগাদে পয়েন্ট যোগ হয়, লিডারবোর্ডে দেখা যায়।"]],
      facts: [["৩", "হুবহু স্কোর মিললে"], ["১", "শুধু ফল (জয়/ড্র/হার) মিললে"], ["০", "না মিললে"]],
      tips: ["উদাহরণ: আপনি দিলেন ২–১, খেলা হলো ২–১ → ৩ পয়েন্ট। খেলা হলো ৩–০ → ১ পয়েন্ট (জয়ী দল মিলেছে)। খেলা হলো ১–১ → ০।", "কিকঅফের পর আর প্রেডিকশন দেওয়া বা বদলানো যায় না।"],
      cta: ["প্রেডিকশনে যান", "predict"] },
    en: { title: "How predictions work", intro: "Guess the score before kickoff and earn points.",
      steps: [["Tap any match", "Open any fixture from Matches or a team page."], ["Set the score", "Use − / + for each team."], ["Submit", "Change it as often as you like until kickoff."], ["Points after full time", "Points are added at the next update after the match."]],
      facts: [["3", "exact score"], ["1", "right result"], ["0", "wrong"]], tips: ["Predict 2-1, match ends 3-0 → 1 point."], cta: ["Go to predictions", "predict"] },
  },
  leaderboard: {
    w: ["লিডারবোর্ড", "র‍্যাঙ্কিং", "leaderboard", "ranking"], alone: true, icon: "trophy",
    bn: { title: "লিডারবোর্ড কীভাবে দেখবেন", intro: "প্রেডিকশনের পয়েন্ট দিয়ে সবার র‍্যাঙ্কিং।",
      steps: [["গেম → লিডারবোর্ড", "নিচের মেনুতে \"গেম\", তারপর \"লিডারবোর্ড\"।"], ["লিগ বেছে নিন", "ওপরের ফিল্টারে \"সব\" অথবা প্রিমিয়ার লিগ, লা লিগা, চ্যাম্পিয়ন্স লিগ ইত্যাদি। শুধু সেই লিগের ম্যাচের পয়েন্ট দিয়ে র‍্যাঙ্কিং হবে।"], ["ক্রম কীভাবে", "বেশি পয়েন্ট আগে; সমান হলে বেশি হুবহু স্কোর আগে।"]],
      cta: ["লিডারবোর্ড দেখুন", "predict"] },
    en: { title: "Leaderboards", intro: "Rankings by prediction points.", steps: [["Games → Leaderboard", "Open Games, then Leaderboard."], ["Pick a league", "Filter by All or a single league."], ["Order", "Most points first; ties broken by exact scores."]], cta: ["Open leaderboard", "predict"] },
  },
  friends: {
    w: ["বন্ধুদের লিগ", "প্রাইভেট লিগ", "নিজের লিগ", "লিগ খুল", "লিগে যোগ", "friends league", "private league"], alone: true, icon: "users",
    bn: { title: "বন্ধুদের লিগ কীভাবে খুলবেন", intro: "নিজেদের মধ্যে প্রেডিকশনের লড়াই: অফিস, বন্ধু বা পরিবার।",
      steps: [["গেম → বন্ধুদের লিগ", "নিচের মেনুতে \"গেম\", তারপর \"বন্ধুদের লিগ\"। লগইন লাগবে।"], ["লিগ খুলুন", "একটা নাম দিয়ে \"খুলুন\" চাপুন। ৬ অক্ষরের একটা কোড তৈরি হবে।"], ["আমন্ত্রণ পাঠান", "\"বন্ধুদের আমন্ত্রণ পাঠান\" চাপলে লিংক যাবে। লিংকে চেপে রেজিস্টার করলেই বন্ধু নিজে থেকে লিগে যোগ হবেন।"], ["কোড দিয়েও যোগ", "কেউ কোড দিলে \"কোড দিয়ে যোগ দিন\"-এ লিখে যোগ দিতে পারেন।"], ["লিগের টেবিল", "সদস্যদের প্রেডিকশনের পয়েন্ট দিয়ে র‍্যাঙ্কিং; লিগ ধরে ফিল্টারও করা যায়।"]],
      cta: ["বন্ধুদের লিগে যান", "friends"] },
    en: { title: "Friends' leagues", intro: "Your own prediction league.", steps: [["Games → Friends", "Log in first."], ["Create", "Name it; you get a 6-letter code."], ["Invite", "Share the link; friends who sign up from it join automatically."], ["Join by code", "Or enter a code."], ["Table", "Ranked by members' prediction points."]], cta: ["Open friends' leagues", "friends"] },
  },
  fav: {
    w: ["প্রিয় দল", "ফেভারিট", "favourite", "favorite"], alone: false, icon: "star",
    bn: { title: "প্রিয় দল কীভাবে যোগ করবেন", intro: "প্রিয় দলের পরের খেলা কাউন্টডাউনসহ ম্যাচ পাতার একদম ওপরে।",
      steps: [["দলের পাতায় যান", "যেকোনো ম্যাচে দলের নামে, লিগ টেবিলে, বা সার্চে দল খুঁজে চাপুন।"], ["☆ প্রিয় দলে যোগ করুন", "দলের নামের নিচের বোতামে চাপুন, ★ হয়ে যাবে। আবার চাপলে বাদ।"], ["ম্যাচ পাতায় দেখুন", "এখন থেকে ম্যাচ পাতার ওপরে \"প্রিয় দলের খেলা\"।"]],
      tips: ["সর্বোচ্চ ৩টা প্রিয় দল রাখা যায়।", "প্রোফাইল → আমার দল → এডিট থেকেও একসাথে বদলানো যায়।"], cta: ["দল খুঁজুন", "search"] },
    en: { title: "Favourite teams", intro: "Their next match sits at the top of Matches.", steps: [["Open a team page", "From a match, a table or search."], ["Tap ☆", "It turns ★; tap again to remove."], ["See it on Matches", "Shown at the top with a countdown."]], tips: ["Up to 3 teams."], cta: ["Find a team", "search"] },
  },
  search: {
    w: ["সার্চ", "খুঁজব", "খুঁজবো", "খোঁজ", "search"], alone: false, icon: "search",
    bn: { title: "দল বা খেলোয়াড় কীভাবে খুঁজবেন", intro: "ছয় লিগের সব দল আর খেলোয়াড় এক জায়গায়।",
      steps: [["ওপরের 🔍 চাপুন", "সাইটের যেকোনো পাতা থেকে।"], ["নাম লিখুন", "বাংলা বা ইংরেজি দুইভাবেই চলে, যেমন \"এমবাপ্পে\" বা \"Mbappe\"।"], ["চাপলেই পাতা", "দল, লিগ বা খেলোয়াড়ের পাতা খুলবে; আগের খোঁজ পরে আবার দেখাবে।"]],
      cta: ["এখনই খুঁজুন", "search"] },
    en: { title: "Search", intro: "Every team and player in six leagues.", steps: [["Tap 🔍", "From any page."], ["Type a name", "Bangla or English."], ["Open", "Recent searches are remembered."]], cta: ["Search now", "search"] },
  },
  login: {
    w: ["লগইন", "রেজিস্ট্রেশন", "রেজিস্টার", "অ্যাকাউন্ট", "সাইন আপ", "login", "sign up", "register", "account"], alone: true, icon: "user",
    bn: { title: "অ্যাকাউন্ট আর লগইন", intro: "সূচি, টেবিল আর জিজ্ঞেস করুন লগইন ছাড়াই চলে। প্রেডিকশন, বন্ধুদের লিগ, কুইজ আর প্রিয় দলের জন্য লগইন লাগে।",
      steps: [["প্রোফাইলে যান", "নিচের মেনুতে \"প্রোফাইল\"।"], ["Google দিয়ে এক চাপে", "\"Google দিয়ে চালিয়ে যান\" চাপলেই হয়ে গেল।"], ["অথবা ইমেইল দিয়ে", "নাম, ইমেইল আর পাসওয়ার্ড দিন; ইমেইলে আসা লিংকে চেপে অ্যাকাউন্ট চালু করুন।"]],
      tips: ["মোবাইল নম্বর লাগে না।"], cta: ["প্রোফাইলে যান", "profile"] },
    en: { title: "Account & login", intro: "Fixtures and Ask work without login; predictions, leagues, quiz and favourites need one.", steps: [["Open Profile", ""], ["Continue with Google", "One tap."], ["Or email", "Confirm via the email link."]], cta: ["Open Profile", "profile"] },
  },
  app: {
    w: ["অ্যাপ", "ইনস্টল", "হোম স্ক্রিন", "app", "install"], alone: true, icon: "phone",
    bn: { title: "ফোনে অ্যাপের মতো রাখবেন কীভাবে", intro: "প্লে স্টোরের অ্যাপ শিগগিরই আসছে। এখনই ব্রাউজার থেকে হোম স্ক্রিনে রাখা যায়।",
      steps: [["Chrome-এ সাইট খুলুন", "khelakokhon.com"], ["⋮ মেনু চাপুন", "ওপরে ডানদিকের তিন বিন্দু।"], ["\"Add to Home screen\" / \"Install app\"", "চাপলে হোম স্ক্রিনে খেলা কখন?-এর আইকন বসবে, খুললে অ্যাপের মতো চলবে।"]],
      tips: ["আইফোনে Safari-তে শেয়ার বোতাম → \"Add to Home Screen\"।"], cta: null },
    en: { title: "Install as an app", intro: "The Play Store app is coming; you can add it to your home screen now.", steps: [["Open in Chrome", ""], ["⋮ menu", ""], ["Add to Home screen", ""]], cta: null },
  },
  settings: {
    w: ["ডার্ক", "লাইট মোড", "থিম", "ইংরেজি", "ভাষা", "dark mode", "theme", "language"], alone: true, icon: "moon",
    bn: { title: "থিম আর ভাষা বদলানো", intro: "এক চাপে বদলানো যায়, ফোন মনে রাখে।",
      steps: [["ডার্ক/লাইট", "ওপরে ডানদিকের চাঁদ/সূর্যের বোতাম, বা প্রোফাইল → সেটিংস।"], ["বাংলা/ইংরেজি", "ওপরের \"EN\"/\"বাং\" বোতাম, বা প্রোফাইল → সেটিংস → ভাষা।"]], cta: ["প্রোফাইলে যান", "profile"] },
    en: { title: "Theme & language", intro: "One tap, remembered on your device.", steps: [["Dark/light", "Moon/sun button at the top."], ["Language", "EN/বাং button at the top."]], cta: ["Open Profile", "profile"] },
  },
  privacy: {
    w: ["ডিলিট", "মুছে", "গোপনীয়তা", "আমার তথ্য", "privacy", "delete account"], alone: true, icon: "lock",
    bn: { title: "আপনার তথ্য আর অ্যাকাউন্ট মোছা", intro: "নাম, ইমেইল, প্রিয় দল আর প্রেডিকশন ছাড়া কিছু রাখা হয় না, কারও সাথে ভাগও হয় না।",
      steps: [["কী দেখা যায়", "লিডারবোর্ডে অন্যরা শুধু আপনার নাম আর পয়েন্ট দেখেন, ইমেইল নয়।"], ["মুছতে চাইলে", "khelakokhon@gmail.com-এ ইমেইল করুন, দ্রুত মুছে দেওয়া হবে।"]], cta: ["গোপনীয়তা নীতি", "privacy"] },
    en: { title: "Your data", intro: "Only your name, email, favourites and predictions are stored; never shared.", steps: [["Visibility", "Others see only your name and points."], ["Deletion", "Email khelakokhon@gmail.com."]], cta: ["Privacy policy", "privacy"] },
  },
  contact: {
    w: ["যোগাযোগ", "ফিডব্যাক", "মতামত", "ভুল জানাব", "contact", "feedback"], alone: true, icon: "mail",
    bn: { title: "যোগাযোগ বা ভুল জানানো", intro: "প্রতিটা বার্তা পড়া হয়।", steps: [["ইমেইল", "khelakokhon@gmail.com"], ["ফেসবুক পেজ", "facebook.com/khelakokhon"], ["ভুল দেখলে", "কোন পাতা, কী দেখছেন, পারলে স্ক্রিনশটসহ লিখুন।"]], cta: ["যোগাযোগের পাতা", "contact"] },
    en: { title: "Contact", intro: "Every message is read.", steps: [["Email", "khelakokhon@gmail.com"], ["Facebook", "facebook.com/khelakokhon"]], cta: ["Contact page", "contact"] },
  },
};
const HOW_WORDS = ["কীভাবে", "কিভাবে", "কী করে", "কি করে", "কেমনে", "নিয়ম", "কাজ করে", "করতে হয়", "শুরু করব", "খেলব", "খেলবো", "খেলা যায়", "খেলতে", "যোগ দেব", "যোগ দিব", "যোগ করব", "যোগ করবো", "খুলব", "খুলবো", "বানাব", "বানাবো", "করব", "করবো", "পাব", "পাবো", "রাখব", "রাখবো", "বদলাব", "বদলাবো", "কী", "কি", "how", "rules", "what is", "guide"];
function findGuide(q) {
  const how = has(q, HOW_WORDS);
  for (const [k, g] of Object.entries(GUIDES)) if (g.w.some((w) => q.includes(norm(w))) && (how || g.alone)) return k;
  return null;
}

const HELP_CHIPS = {
  bn: ["কুইজ কীভাবে খেলব", "প্রেডিকশনের নিয়ম", "রিয়ালের পরের খেলা কবে", "লা লিগা টেবিল", "বার্সেলোনার ফর্ম কেমন", "আর্সেনাল টেবিলে কততম", "রিয়াল বনাম বার্সা হেড টু হেড", "লিভারপুলের কোচ কে", "এমবাপ্পে কয়টা গোল করেছে", "এই সপ্তাহের খেলা", "এখন কী খেলা চলছে", "আমার দলের পরের খেলা"],
  en: ["How does the quiz work", "Prediction rules", "Real Madrid next match", "La Liga table", "Barcelona form", "Arsenal table position", "Real vs Barça head to head", "Liverpool coach", "Mbappé goals", "This week's matches", "Live now", "My teams next match"],
};

async function getMatchesRange(from, to) {
  if (DEMO) return demoMatches().filter((m) => m.utc_date >= from && m.utc_date < to);
  return ok(await sb.from("matches").select(MATCH_SELECT).gte("utc_date", from).lt("utc_date", to).order("utc_date").limit(300));
}

// প্রতিযোগিতা অনুযায়ী গুনে: "প্রিমিয়ার লিগ ১০, লা লিগা ৮"
const countByComp = (list, lang) => Object.entries(list.reduce((a, m) => ((a[m.competition_code] = (a[m.competition_code] || 0) + 1), a), {}))
  .sort((x, y) => y[1] - x[1]).map(([c, n]) => `${compLabel(c, lang)} ${num(n, lang)}`).join(", ");

// প্রতিটা উত্তরের পরে পরের প্রশ্নের পরামর্শ
function followups(ids, comp, teams, lang) {
  const bn = lang === "bn";
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
  const nm = (id) => teamName(byId[id], lang);
  if (ids.length >= 2) {
    const [a, b] = [nm(ids[0]), nm(ids[1])];
    return bn ? [`${a} বনাম ${b} হেড টু হেড`, `${a} বনাম ${b} পরের খেলা`, `${a} আর ${b} টেবিলে কে এগিয়ে`] : [`${a} vs ${b} head to head`, `${a} vs ${b} next match`, `${a} vs ${b} table`];
  }
  if (ids.length === 1) {
    const a = nm(ids[0]);
    return bn ? [`${poss(a, "bn")} পরের খেলা`, `${poss(a, "bn")} শেষ ম্যাচের ফল`, `${a} টেবিলে কততম`, `${poss(a, "bn")} ফর্ম কেমন`, `${poss(a, "bn")} পরিসংখ্যান`, `${poss(a, "bn")} কোচ কে`]
      : [`${a} next match`, `${a} last result`, `${a} table position`, `${a} form`, `${a} stats`, `${a} coach`];
  }
  if (comp) {
    const c = compLabel(comp, lang);
    return bn ? [`${c} টেবিল`, `${poss(c, "bn")} সর্বোচ্চ গোলদাতা`, `${poss(c, "bn")} পরের খেলা`, `${poss(c, "bn")} অবনমন অঞ্চল`] : [`${c} table`, `${c} top scorer`, `${c} next matches`, `${c} relegation`];
  }
  return bn ? ["আজ কী খেলা", "আগামীকাল কী খেলা", "এই সপ্তাহের খেলা", "এখন কী খেলা চলছে"] : ["Today's matches", "Tomorrow's matches", "This week's matches", "Live now"];
}

// "লা লিগায়", "প্রিমিয়ার লিগে", "সিরি আ-তে"
const compIn = (code, lang) => { const c = compLabel(code, lang); return lang !== "bn" ? "in " + c : /আ$/.test(c) ? c + "-তে" : /[\u09BE-\u09CC]$/.test(c) ? c + "য়" : c + "ে"; };
// দলের লিগের সারি (প্রতিযোগিতা বলা থাকলে সেটা, না হলে ঘরোয়া লিগ)
async function leagueRow(id, comp) {
  const rows = await getTeamStandings(id);
  return rows.find((r) => r.competition_code === comp) || (!comp && (rows.find((r) => r.competition_code !== "CL") || rows[0])) || null;
}

async function answer(raw, teams, lang, ctx = {}, favIds = []) {
  const q = norm(raw);
  const bn = lang === "bn";
  if (!q) return null;
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
  const nm = (id) => teamName(byId[id], lang);
  const intent = ["help", "table", "bottom", "form", "h2h", "coach", "venue", "founded", "squad", "info", "stats", "live", "week", "weekend"].filter((k) => has(q, AW[k]));
  const is = (k) => intent.includes(k);
  let ids = findTeams(q, teams);
  let comp = findComp(q);
  let fromCtx = false;
  const done = (r, i = ids, c = comp) => r && ({ ...r, chips: r.chips || followups(i, c, teams, lang).filter((x) => norm(x) !== q), ctx: { ids: i, comp: c } });

  const gk = !ids.length ? findGuide(q) : null;
  if (gk) {
    const g = GUIDES[gk][bn ? "bn" : "en"];
    const more = Object.keys(GUIDES).filter((k) => k !== gk).slice(0, 4).map((k) => GUIDES[k][bn ? "bn" : "en"].title);
    return { text: g.intro, guide: { key: gk, icon: GUIDES[gk].icon, ...g }, chips: more, ctx };
  }
  if (is("help") && !ids.length) return {
    text: bn ? "আমি যা বলতে পারি:\n• যেকোনো দলের পরের খেলা আর শেষ ফল (বাংলাদেশ সময়ে)\n• লিগ টেবিল, কোন দল কততম, কত পয়েন্ট\n• দলের ফর্ম, পরিসংখ্যান, কোচ, স্টেডিয়াম, স্কোয়াড\n• দুই দলের হেড টু হেড\n• খেলোয়াড়ের গোল, সর্বোচ্চ গোলদাতা\n• আজ, কাল, এই সপ্তাহে বা উইকেন্ডে কী খেলা, এখন কী চলছে\n• আপনার প্রিয় দলের খেলা\n• সাইটের যেকোনো ফিচার কীভাবে চলে: কুইজ, প্রেডিকশন, বন্ধুদের লিগ, প্রিয় দল, লগইন\nআগের প্রশ্নের দলটাও মনে রাখি, তাই পরে শুধু “ওদের শেষ ফল?” লিখলেও চলবে।"
      : "I can tell you:\n• Any team's next match and last result (Bangladesh time)\n• League tables, positions and points\n• Team form, stats, coach, stadium, squad\n• Head to head between two teams\n• Player goals and top scorers\n• Matches today, tomorrow, this week, the weekend, or live now\n• Your favourite teams' matches\nI also remember the last team you asked about.",
    matches: [], chips: HELP_CHIPS[bn ? "bn" : "en"], ctx,
  };

  // আমার দল
  if (has(q, AW.mine)) {
    if (!favIds.length) return { text: bn ? "আপনি এখনো কোনো প্রিয় দল যোগ করেননি। যেকোনো দলের পাতায় ☆ চাপলে সেই দল যোগ হবে, তারপর এখানে তাদের খেলা বলে দিতে পারব।" : "No favourite teams yet. Tap ☆ on any team page to add one.", matches: [], chips: HELP_CHIPS[bn ? "bn" : "en"].slice(0, 4), ctx };
    ids = favIds;
    const past = has(q, W.last) && !has(q, ["পরের", "নেক্সট", "next", "সামনে"]);
    const list = await getTeamMatches(favIds, { upcoming: !past, limit: 8 });
    return done({ text: list.length ? (bn ? `আপনার প্রিয় দলগুলোর ${past ? "সাম্প্রতিক ফল" : "সামনের খেলা"}:` : `Your teams' ${past ? "recent results" : "upcoming matches"}:`) : (bn ? "আপনার দলগুলোর কোনো খেলা সূচিতে নেই।" : "No matches found for your teams."), matches: list, dated: true }, favIds.length === 1 ? favIds : [], null);
  }

  // আগের প্রশ্নের প্রসঙ্গ: "ওদের শেষ ফল?", "টেবিলে কততম?"
  if (!ids.length && !comp) {
    const pron = has(q, AW.pron);
    const wantsCtx = pron || intent.some((k) => !["live", "week", "weekend", "help"].includes(k)) || has(q, ["পরের", "শেষ ম্যাচ", "শেষ খেলা", "next", "last"]);
    if (wantsCtx && !pron) { const pa = await answerPlayer(q, teams, lang); if (pa) return pa; }
    if (wantsCtx && (ctx.ids?.length || ctx.comp)) { ids = ctx.ids || []; comp = ctx.comp || null; fromCtx = true; }
  }
  const one = ids.length === 1 ? ids[0] : null;

  // লাইভ
  if (is("live") && !ids.length) {
    const now = Date.now();
    const list = (await getMatchesRange(new Date(now - 3 * 3600000).toISOString(), new Date(now + 600000).toISOString())).filter((m) => isLive(m) && (!comp || m.competition_code === comp));
    if (list.length) return done({ text: bn ? `এই মুহূর্তে ${num(list.length, "bn")}টা খেলা চলছে:` : `${list.length} matches live now:`, matches: list });
    const next = await getNextMatchTime(new Date(now).toISOString());
    const nx = next ? (await getMatchesOnDay(dayKey(new Date(next)))).filter((m) => m.utc_date >= new Date(now).toISOString()).slice(0, 4) : [];
    return done({ text: bn ? `এই মুহূর্তে কোনো খেলা চলছে না।${nx.length ? ` পরের খেলা শুরু ${whenText(nx[0].utc_date, "bn")}:` : ""}` : `Nothing live right now.${nx.length ? " Next up:" : ""}`, matches: nx });
  }

  // এই সপ্তাহ / উইকেন্ড
  if ((is("week") || is("weekend")) && !ids.length) {
    const today = dayKey(new Date());
    let from, to, label;
    if (is("weekend")) {
      const [y, mo, d] = today.split("-").map(Number);
      const wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
      const sat = wd === 0 ? addDays(today, -1) : addDays(today, (6 - wd + 7) % 7);
      from = dayRangeUTC(sat)[0]; to = new Date(new Date(dayRangeUTC(addDays(sat, 2))[0]).getTime() + 6 * 3600000).toISOString();
      label = bn ? "এই উইকেন্ডে (শনি–রবি)" : "This weekend";
    } else {
      from = new Date(Date.now() - 3 * 3600000).toISOString(); to = dayRangeUTC(addDays(today, 7))[0];
      label = bn ? "সামনের ৭ দিনে" : "In the next 7 days";
    }
    const list = (await getMatchesRange(from, to)).filter((m) => !isDone(m) || is("weekend")).filter((m) => !comp || m.competition_code === comp);
    if (!list.length) return done({ text: bn ? `${label} কোনো খেলা নেই।` : `${label}: no matches.`, matches: [] });
    return done({ text: bn ? `${label} মোট ${num(list.length, "bn")}টা খেলা (${countByComp(list, "bn")})। প্রথম কয়েকটা:` : `${label}: ${list.length} matches (${countByComp(list, "en")}). First few:`, matches: list.slice(0, 12), dated: true });
  }

  // মুখোমুখি (হেড টু হেড)
  if (ids.length >= 2 && is("h2h")) {
    const [a, b] = ids;
    const fx = [...await getTeamMatches([a], { upcoming: true, limit: 60 }), ...await getTeamMatches([a], { upcoming: false, limit: 60 })];
    const m = fx.find((x) => [x.home_id, x.away_id].includes(b));
    if (!m) return done({ text: bn ? `সাইটের সূচিতে ${nm(a)} আর ${poss(nm(b), "bn")} কোনো ম্যাচ নেই, তাই হেড টু হেড আনতে পারছি না।` : `No ${nm(a)} vs ${nm(b)} match in the fixtures, so no head-to-head.`, matches: [] });
    const h = await getH2H(m.id, m.home_id, m.away_id);
    const rows = (h?.matches || []).filter((x) => x.score?.home != null).slice(0, 8);
    const rec = (id) => { let w = 0, d = 0, l = 0; for (const x of rows) { const me = x.homeTeam?.id === id ? x.score.home : x.score.away, th = x.homeTeam?.id === id ? x.score.away : x.score.home; me > th ? w++ : me < th ? l++ : d++; } return { w, d, l }; };
    const ra = rec(a), rb = rec(b);
    const goals = rows.reduce((s2, x) => s2 + x.score.home + x.score.away, 0);
    if (!rows.length) return done({ text: bn ? `${nm(a)} আর ${poss(nm(b), "bn")} আগের দেখার তথ্য এখন পাওয়া যাচ্ছে না।` : "Head-to-head data isn't available right now.", matches: [m] });
    return done({
      text: bn ? `শেষ ${num(rows.length, "bn")} দেখায় ${nm(a)} জিতেছে ${num(ra.w, "bn")}টা, ${nm(b)} ${num(rb.w, "bn")}টা, ড্র ${num(ra.d, "bn")}টা। মোট গোল ${num(goals, "bn")}টা।`
        : `Last ${rows.length} meetings: ${nm(a)} won ${ra.w}, ${nm(b)} won ${rb.w}, ${ra.d} draws. ${goals} goals in total.`,
      h2h: { a, b, ra, rb, rows }, matches: isDone(m) ? [] : [m],
    });
  }

  // টেবিল: দুই দলের তুলনা
  if (ids.length >= 2 && (is("table") || has(q, AW.points))) {
    const [a, b] = ids;
    const [ra, rb] = await Promise.all([leagueRow(a, comp), leagueRow(b, comp)]);
    if (!ra || !rb) return done({ text: bn ? "দুই দলের টেবিলের তথ্য পাওয়া যায়নি।" : "Couldn't find both teams in a table.", matches: [] });
    const same = ra.competition_code === rb.competition_code;
    const line = (id, r) => `${nm(id)}: ${compLabel(r.competition_code, lang)} ${bn ? ord(r.position, "bn") : ord(r.position, "en")}, ${num(r.points, lang)} ${bn ? "পয়েন্ট" : "pts"} (${num(r.played, lang)} ${bn ? "ম্যাচ" : "played"})`;
    let text = line(a, ra) + "\n" + line(b, rb);
    if (same) {
      const diff = ra.points - rb.points, lead = diff >= 0 ? a : b;
      text += "\n" + (diff === 0 ? (bn ? "দুই দলের পয়েন্ট সমান।" : "Level on points.") : bn ? `${nm(lead)} ${num(Math.abs(diff), "bn")} পয়েন্ট এগিয়ে।` : `${nm(lead)} lead by ${Math.abs(diff)} points.`);
      const table = await getStandings(ra.competition_code);
      return done({ text, table: { code: ra.competition_code, rows: table.filter((r) => [a, b].includes(r.team_id) || r.position === 1), hl: [a, b] } });
    }
    return done({ text, matches: [] });
  }

  // টেবিল / পয়েন্ট / অবনমন: এক দল
  if (one && (is("table") || is("bottom") || has(q, AW.points))) {
    const r = await leagueRow(one, comp);
    if (!r) return done({ text: bn ? `${poss(nm(one), "bn")} টেবিলের তথ্য পাওয়া যায়নি।` : `No table data for ${nm(one)}.`, matches: [] });
    const code = r.competition_code;
    const table = await getStandings(code);
    const total = table.length;
    const leader = table[0];
    const next = table.find((x) => x.position === r.position + 1);
    let text = bn ? `${compIn(code, "bn")} ${nm(one)} এখন ${ord(r.position, "bn")}, ${num(r.played, "bn")} ম্যাচে ${num(r.points, "bn")} পয়েন্ট।` : `${nm(one)} are ${ord(r.position, "en")} in ${compLabel(code, "en")} with ${r.points} points from ${r.played} games.`;
    if (r.position === 1 && next) text += bn ? ` দ্বিতীয় ${teamName(next.team, "bn")} থেকে ${num(r.points - next.points, "bn")} পয়েন্ট এগিয়ে।` : ` ${r.points - next.points} points clear of ${teamName(next.team, "en")}.`;
    else if (leader) text += bn ? ` শীর্ষে থাকা ${teamName(leader.team, "bn")} থেকে ${num(leader.points - r.points, "bn")} পয়েন্ট পিছিয়ে।` : ` ${leader.points - r.points} points behind leaders ${teamName(leader.team, "en")}.`;
    const z = zone(code, r.position, total);
    if (z === "z-down") text += bn ? " এখন অবনমন অঞ্চলে আছে।" : " Currently in the relegation zone.";
    const lo = Math.max(1, Math.min(r.position - 2, total - 4)), hi = lo + 4;
    const rows = table.filter((x) => x.position === 1 || (x.position >= lo && x.position <= hi));
    const cl = !comp && code !== "CL" ? (await getTeamStandings(one)).find((x) => x.competition_code === "CL") : null;
    if (cl) text += bn ? ` চ্যাম্পিয়ন্স লিগে ${ord(cl.position, "bn")}।` : ` ${ord(cl.position, "en")} in the Champions League.`;
    return done({ text, table: { code, rows, hl: [one] } }, [one], comp);
  }

  // টেবিল: পুরো লিগ / অবনমন অঞ্চল
  if (comp && !ids.length && (is("table") || is("bottom") || has(q, AW.points))) {
    const table = await getStandings(comp);
    if (!table.length) return done({ text: bn ? "এই টেবিল এখনো পাওয়া যায়নি।" : "Table not available yet.", matches: [] });
    const total = table.length;
    if (is("bottom")) {
      const down = table.filter((r) => zone(comp, r.position, total) === "z-down");
      const rows = table.slice(-Math.max(down.length + 2, 4));
      return done({ text: bn ? `${poss(compLabel(comp, "bn"), "bn")} নিচের দিকে: ${down.map((r) => teamName(r.team, "bn")).join(", ")} এখন অবনমন অঞ্চলে।` : `${compLabel(comp, "en")} bottom: ${down.map((r) => teamName(r.team, "en")).join(", ")} in the drop zone.`, table: { code: comp, rows, hl: down.map((r) => r.team_id) } });
    }
    const [f, s2] = table;
    return done({
      text: bn ? `${poss(compLabel(comp, "bn"), "bn")} শীর্ষে ${teamName(f.team, "bn")}, ${num(f.played, "bn")} ম্যাচে ${num(f.points, "bn")} পয়েন্ট।${s2 ? ` দ্বিতীয় ${teamName(s2.team, "bn")} (${num(s2.points, "bn")})।` : ""}`
        : `${teamName(f.team, "en")} top ${compLabel(comp, "en")} with ${f.points} points.${s2 ? ` ${teamName(s2.team, "en")} second on ${s2.points}.` : ""}`,
      table: { code: comp, rows: table.slice(0, 8), hl: [] , more: true },
    });
  }

  // ফর্ম
  if (one && is("form")) {
    const list = await getTeamMatches([one], { upcoming: false, limit: 5 });
    if (!list.length) return done({ text: bn ? `${poss(nm(one), "bn")} কোনো ফল এখনো নেই।` : `No results yet for ${nm(one)}.`, matches: [] });
    const res = (m) => { const me = m.home_id === one ? m.home_score : m.away_score, th = m.home_id === one ? m.away_score : m.home_score; return me > th ? "W" : me < th ? "L" : "D"; };
    const rs = list.map(res), c = (k) => rs.filter((x) => x === k).length;
    const gf = list.reduce((a, m) => a + (m.home_id === one ? m.home_score : m.away_score), 0), ga = list.reduce((a, m) => a + (m.home_id === one ? m.away_score : m.home_score), 0);
    const mood = c("W") >= 4 ? (bn ? " দারুণ ছন্দে আছে!" : " Flying!") : c("L") >= 3 ? (bn ? " সময়টা ভালো যাচ্ছে না।" : " A rough patch.") : "";
    return done({ text: bn ? `শেষ ${num(list.length, "bn")} ম্যাচে ${nm(one)}: ${num(c("W"), "bn")} জয়, ${num(c("D"), "bn")} ড্র, ${num(c("L"), "bn")} হার। গোল দিয়েছে ${num(gf, "bn")}, খেয়েছে ${num(ga, "bn")}।${mood}` : `${nm(one)} last ${list.length}: ${c("W")}W ${c("D")}D ${c("L")}L, goals ${gf}-${ga}.${mood}`, form: { id: one, list }, matches: list });
  }

  // পরিসংখ্যান
  if (one && is("stats")) {
    const pa = await answerPlayer(q, teams, lang); if (pa) return pa;
    const rows = await getTeamStandings(one);
    if (!rows.length) return done({ text: bn ? `${poss(nm(one), "bn")} পরিসংখ্যান পাওয়া যায়নি।` : `No stats for ${nm(one)}.`, matches: [] });
    const text = rows.sort((x, y) => (x.competition_code === "CL") - (y.competition_code === "CL")).map((r) => bn
      ? `${compLabel(r.competition_code, "bn")}: ${num(r.played, "bn")} ম্যাচে ${num(r.won, "bn")} জয়, ${num(r.draw, "bn")} ড্র, ${num(r.lost, "bn")} হার। গোল দিয়েছে ${num(r.gf, "bn")}, খেয়েছে ${num(r.ga, "bn")}। ${num(r.points, "bn")} পয়েন্ট, ${ord(r.position, "bn")}।`
      : `${compLabel(r.competition_code, "en")}: P${r.played} W${r.won} D${r.draw} L${r.lost}, goals ${r.gf}-${r.ga}, ${r.points} pts (${ord(r.position, "en")}).`).join("\n");
    return done({ text: (bn ? `${poss(nm(one), "bn")} এই মৌসুম:\n` : `${nm(one)} this season:\n`) + text, stats: rows });
  }

  // দলের তথ্য: কোচ, মাঠ, প্রতিষ্ঠা, স্কোয়াড
  if (one && (is("coach") || is("venue") || is("founded") || is("squad") || is("info"))) {
    const info = await getTeamInfo(one).catch(() => null);
    if (!info) return done({ text: bn ? "দলের তথ্য এখন আনা যাচ্ছে না, একটু পরে চেষ্টা করুন।" : "Team info isn't available right now.", matches: [] });
    const parts = [];
    const all = is("info");
    if ((is("coach") || all) && info.coach?.name) parts.push(bn ? `${poss(nm(one), "bn")} কোচ ${COACH_BN[info.coach.name] || playerName(info.coach.name, "bn")}${info.coach.nationality ? ` (${natName(info.coach.nationality, "bn")})` : ""}।` : `${nm(one)}'s coach is ${info.coach.name}${info.coach.nationality ? ` (${info.coach.nationality})` : ""}.`);
    if ((is("venue") || all) && info.venue) parts.push(bn ? `হোম মাঠ ${info.venue}।` : `Home ground: ${info.venue}.`);
    if ((is("founded") || all) && info.founded) parts.push(bn ? `প্রতিষ্ঠা ${num(info.founded, "bn")} সালে, বয়স ${num(new Date().getFullYear() - info.founded, "bn")} বছর।` : `Founded in ${info.founded}.`);
    if ((is("squad") || all) && info.squad?.length) {
      const cnt = (k) => info.squad.filter((p) => posGroup(p.position) === k).length;
      parts.push(bn ? `স্কোয়াডে ${num(info.squad.length, "bn")} জন: গোলরক্ষক ${num(cnt("G"), "bn")}, ডিফেন্ডার ${num(cnt("D"), "bn")}, মিডফিল্ডার ${num(cnt("M"), "bn")}, ফরোয়ার্ড ${num(cnt("F"), "bn")}।` : `Squad of ${info.squad.length}: ${cnt("G")} GK, ${cnt("D")} DF, ${cnt("M")} MF, ${cnt("F")} FW.`);
    }
    if (!parts.length) parts.push(bn ? "এই তথ্যটা এখন পাওয়া যাচ্ছে না।" : "That detail isn't available.");
    return done({ text: parts.join(" "), teamLink: one, squadLink: is("squad") });
  }

  // বাকি সব (পরের খেলা, শেষ ফল, খেলোয়াড়, দিন): আগের নিয়মে; প্রসঙ্গ থেকে দল এলে সেটা দিয়ে
  const base = await answerBase(raw, teams, lang, fromCtx ? ids : null);
  if (base?.players?.length) {
    // খেলোয়াড়ের উত্তরের পরে: তার দল আর লিগ নিয়ে পরের প্রশ্ন
    const pl = base.players[0], tid = pl.team?.id || pl.team_id, codes = [...new Set(base.players.map((x) => x.code).filter(Boolean))];
    const chips = [
      ...(tid && byId[tid] ? (bn ? [`${poss(nm(tid), "bn")} পরের খেলা`, `${nm(tid)} টেবিলে কততম`] : [`${nm(tid)} next match`, `${nm(tid)} table position`]) : []),
      ...codes.slice(0, 2).map((c) => (bn ? `${poss(compLabel(c, "bn"), "bn")} সর্বোচ্চ গোলদাতা` : `${compLabel(c, "en")} top scorer`)),
    ].filter((x) => norm(x) !== q);
    return { ...base, chips: chips.length ? chips : followups([], null, teams, lang), ctx: { ids: tid ? [tid] : [], comp: null } };
  }
  return done(base, fromCtx ? ids : findTeams(q, teams), comp);
}
// পজিশন → G/D/M/F
const posGroup = (p) => (!p ? "" : /goal/i.test(p) ? "G" : /back|defen/i.test(p) ? "D" : /midfield/i.test(p) ? "M" : "F");

async function answerBase(raw, teams, lang, idsOverride) {
  const q = norm(raw);
  const bn = lang === "bn";
  if (!q) return null;
  const ids = idsOverride?.length ? idsOverride : findTeams(q, teams);
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
  const nm = (id) => teamName(byId[id], lang);
  const wantLast = has(q, W.last) && !has(q, ["পরের", "নেক্সট", "next", "upcoming", "সামনে"]);
  const comp = findComp(q);

  // খেলোয়াড়ের নাম বা গোলদাতার প্রশ্ন আগে
  const pa = idsOverride?.length ? null : await answerPlayer(q, teams, lang);
  if (pa) return pa;

  // দুই দল: একে অপরের বিপক্ষে
  if (ids.length >= 2) {
    const [a, b] = ids;
    const list = await getTeamMatches([a], { upcoming: !wantLast, limit: 60 });
    const m = list.find((x) => [x.home_id, x.away_id].includes(b));
    if (!m) return { text: bn ? `সাইটের সূচিতে ${nm(a)} বনাম ${poss(nm(b), "bn")} ${wantLast ? "সাম্প্রতিক কোনো ম্যাচ" : "সামনে কোনো ম্যাচ"} নেই।` : `No ${wantLast ? "recent" : "upcoming"} ${nm(a)} vs ${nm(b)} match in the fixtures.`, matches: [] };
    return { text: describe(m, null, wantLast, lang), matches: [m] };
  }

  // এক দল
  if (ids.length === 1) {
    const id = ids[0];
    if (wantLast) {
      const [m] = await getTeamMatches([id], { upcoming: false, limit: 1 });
      if (!m) return { text: bn ? `${poss(nm(id), lang)} কোনো ফল এখনো সূচিতে নেই।` : `No results yet for ${nm(id)}.`, matches: [] };
      return { text: describe(m, id, true, lang), matches: [m] };
    }
    const list = await getTeamMatches([id], { upcoming: true, limit: 3 });
    if (!list.length) return { text: bn ? `${poss(nm(id), lang)} সামনে কোনো খেলা সূচিতে নেই।` : `No upcoming matches for ${nm(id)}.`, matches: [] };
    return { text: describe(list[0], id, false, lang) + (list.length > 1 ? (bn ? " এর পরের খেলাগুলোও নিচে দিলাম।" : " The next few are below.") : ""), matches: list };
  }

  // কোনো দল নেই, দিনের প্রশ্ন
  const today = dayKey(new Date());
  let day = has(q, W.yesterday) ? addDays(today, -1) : has(q, W.tomorrow) ? addDays(today, 1) : has(q, W.today) ? today : null;
  if (!day) {
    const wd = WEEKDAYS.findIndex((names) => has(q, names));
    if (wd >= 0) {
      const [y, mo, d] = today.split("-").map(Number);
      const todayWd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
      day = addDays(today, (wd - todayWd + 7) % 7);
    }
  }
  if (day) {
    const list = (await getMatchesOnDay(day)).filter((m) => !comp || m.competition_code === comp);
    const label = dayLabel(day, lang);
    if (!list.length) {
      // সেদিন খেলা না থাকলে পরের খেলার দিন
      const nextT = await getNextMatchTime(dayRangeUTC(day)[1]);
      const nk = nextT && dayKey(new Date(nextT));
      const nl = nk ? (await getMatchesOnDay(nk)).filter((m) => !comp || m.competition_code === comp) : [];
      return { text: bn ? `${label} ${comp ? "এই প্রতিযোগিতার " : ""}কোনো খেলা নেই।${nl.length ? ` পরের খেলা ${dayLabel(nk, "bn")}, মোট ${num(nl.length, "bn")}টা:` : ""}` : `${label}: no matches.${nl.length ? ` Next matchday ${dayLabel(nk, "en")} (${nl.length}):` : ""}`, matches: nl };
    }
    return { text: bn ? `${label} মোট ${num(list.length, "bn")}টা খেলা।` : `${label}: ${list.length} matches.`, matches: list };
  }

  // শুধু প্রতিযোগিতার নাম
  if (comp) {
    const list = await getCompUpcoming(comp, 6);
    if (!list.length) return { text: bn ? "এই প্রতিযোগিতার সামনে কোনো খেলা সূচিতে নেই।" : "No upcoming matches in this competition.", matches: [] };
    return { text: bn ? `${poss(compName(list[0].competition, lang), "bn")} পরের খেলাগুলো:` : `Next ${compName(list[0].competition, lang)} matches:`, matches: list };
  }

  return {
    text: bn
      ? "প্রশ্নটা ধরতে পারিনি। দলের, লিগের বা খেলোয়াড়ের নাম দিয়ে জিজ্ঞেস করুন। নিচের যেকোনোটায় চেপেও দেখতে পারেন।"
      : "I couldn't follow that. Try a team, league or player name, or tap one below.",
    matches: [], chips: HELP_CHIPS[bn ? "bn" : "en"],
  };
}

function describe(m, id, past, lang) {
  const bn = lang === "bn";
  const home = teamName(m.home, lang), away = teamName(m.away, lang);
  const comp = compName(m.competition, lang);
  if (past || isDone(m)) {
    const s = `${num(m.home_score, lang)}-${num(m.away_score, lang)}`;
    return bn ? `${dayLabel(dayKey(m.utc_date), "bn")} (${comp}): ${home} ${s} ${away}।` : `${dayLabel(dayKey(m.utc_date), "en")}, ${comp}: ${home} ${s} ${away}.`;
  }
  if (isLive(m)) return bn ? `${home} বনাম ${away} এখন চলছে: ${num(m.home_score ?? 0, "bn")}-${num(m.away_score ?? 0, "bn")}।` : `${home} vs ${away} is live now.`;
  const opp = id ? (m.home_id === id ? away : home) : null;
  const left = countdown(new Date(m.utc_date) - Date.now(), lang);
  if (bn)
    return id
      ? `${poss(teamName(m.home_id === id ? m.home : m.away, "bn"), "bn")} পরের খেলা ${whenText(m.utc_date, "bn")}, ${poss(opp, "bn")} বিপক্ষে (${comp})। শুরু হতে বাকি ${left}।`
      : `${home} বনাম ${away}: ${whenText(m.utc_date, "bn")} (${comp})। শুরু হতে বাকি ${left}।`;
  return id
    ? `${teamName(m.home_id === id ? m.home : m.away, "en")} vs ${opp}: ${whenText(m.utc_date, "en")} Bangladesh time (${comp}). Kickoff in ${left}.`
    : `${home} vs ${away}: ${whenText(m.utc_date, "en")} Bangladesh time (${comp}). Kickoff in ${left}.`;
}

const EXAMPLES = {
  bn: ["রিয়ালের পরের খেলা কবে", "লা লিগায় এমবাপ্পে কয়টা গোল করেছে", "প্রিমিয়ার লিগের সর্বোচ্চ গোলদাতা", "বার্সার শেষ ম্যাচের ফল", "আজ কী খেলা"],
  en: ["Real Madrid next match", "Mbappé La Liga goals", "Premier League top scorer", "Barça last result", "Today's matches"],
};

// ── সার্চ: লিগ, দল, খেলোয়াড় (টাইপ করতে করতে) ──
const plainMemo = new Map();
const plain = (s) => {
  let v = plainMemo.get(s);
  if (v === undefined) { v = norm(s).normalize("NFD").replace(/[\u0300-\u036f]/g, ""); if (plainMemo.size < 50000) plainMemo.set(s, v); }
  return v;
};
const soundMemo = new Map();
const soundOf = (w) => { let v = soundMemo.get(w); if (v === undefined) { v = sound(w); if (soundMemo.size < 50000) soundMemo.set(w, v); } return v; };
// নামের কোনো শব্দ প্রশ্ন দিয়ে শুরু হয়, বা বাংলা উচ্চারণ প্রায় মেলে → স্কোর (কম = ভালো), না মিললে null
function nameScore(q, names) {
  const pq = plain(q);
  let best = null;
  for (const n of names.filter(Boolean)) {
    const pn = plain(n);
    if (pn === pq) return 0;
    if (pn.startsWith(pq)) best = Math.min(best ?? 9, 1);
    else if (pn.split(" ").some((w) => w.startsWith(pq))) best = Math.min(best ?? 9, 2);
    else if (!isBn(pq) && pq.length >= 3 && pn.includes(pq)) best = Math.min(best ?? 9, 3);
    else if (isBn(pq) && !isBn(pn) && pq.length >= 3) {
      // বাংলায় লেখা, নাম ইংরেজিতে: উচ্চারণের শুরুটা মেলাই (এমবা → mbappe, হালান্ড → haaland)
      const qv = bnSound(pq.replace(/\s+/g, ""));
      for (const v of new Set([qv, qv.replace(/^[aeiou]/, "")])) {
        if (v.length < 3) continue;
        for (const w of pn.split(" ")) {
          const wv = soundOf(w);
          const d = lev(v, wv.slice(0, v.length));
          // কাছের মিল আগে (ওসিমেন → Osimhen আগে, Semenyo পরে)
          if (wv.length >= 3 && d <= (v.length >= 5 ? 1 : 0)) best = Math.min(best ?? 9, 4 + d * 0.3 + (v === qv ? 0 : 0.1) + Math.abs(wv.length - v.length) * 0.01);
        }
      }
    }
  }
  return best;
}

// সাম্প্রতিক খোঁজ: এই ফোনেই জমা থাকে
const loadRecent = () => { try { const a = JSON.parse(localStorage.getItem("kk_recent") || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
const saveRecent = (a) => { try { localStorage.setItem("kk_recent", JSON.stringify(a)); } catch { /* ignore */ } };
function SearchSheet({ comps, teams, onClose }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState(loadRecent);
  // ফলে চাপলে সাম্প্রতিক তালিকার শুরুতে (একই জিনিস দুবার নয়, সর্বোচ্চ ৬টা)
  const go = (item, open) => {
    const next = [item, ...recent.filter((x) => !(x.k === item.k && x.id === item.id))].slice(0, 6);
    saveRecent(next); open();
  };
  const [scorers, setScorers] = useState([]);
  const [squadPlayers, setSquadPlayers] = useState([]);
  useEffect(() => { getAllScorers().then(setScorers).catch(() => {}); getAllPlayers().then(setSquadPlayers).catch(() => {}); }, []);
  // গোলদাতা + ছয় লিগের সব স্কোয়াড, একজন একবার; প্রতিজনের খোঁজার নাম আগে থেকে বানানো
  const people = useMemo(() => {
    const byTeam = Object.fromEntries(teams.map((t) => [t.id, t]));
    const map = new Map();
    for (const r of scorers) if (!map.has(r.player_id)) map.set(r.player_id, { ...r, team: r.team || byTeam[r.team_id] });
    for (const [id, name, teamId, pos] of squadPlayers) {
      const old = map.get(id);
      if (old) { old.position ||= pos; continue; }
      map.set(id, { player_id: id, player_name: name, team_id: teamId, team: byTeam[teamId], position: pos });
    }
    const nickFor = {};
    for (const [n, part] of Object.entries(PLAYER_NICK)) (nickFor[part] ||= []).push(n);
    return [...map.values()].map((r) => ({ ...r, names: [r.player_name, PLAYER_BN[r.player_name], ...plain(r.player_name).split(" ").flatMap((w) => nickFor[w] || [])].filter(Boolean) }));
  }, [scorers, squadPlayers, teams]);
  useEffect(() => { document.documentElement.style.overflow = "hidden"; return () => { document.documentElement.style.overflow = ""; }; }, []);

  const query = q.trim();
  const pick = (list, names, max) => {
    const out = list.map((x) => [x, nameScore(query, names(x))]).filter(([, sc]) => sc != null).sort((a, b) => a[1] - b[1]).slice(0, max);
    return Object.assign(out.map(([x]) => x), { top: out.length ? out[0][1] : 99 });
  };
  const players = people;
  const res = query.length < 2 ? null : {
    comps: pick(comps, (c) => [c.name_bn, c.name_en, c.code, ...(COMP_WORDS[c.code] || [])], 6),
    teams: pick(teams, (t) => [...teamAliases(t), t.tla, ...(NICK[t.id] || [])], 8),
    players: pick(players, (r) => r.names, 8),
  };
  const empty = res && !res.comps.length && !res.teams.length && !res.players.length;
  // খেলোয়াড়ের ছবি: টাইপ থামলে একবারে আনা
  const [, bump] = useState(0);
  const pids = (res?.players || []).map((r) => r.player_id).filter((x) => !(x in photoMemo)).join(",");
  useEffect(() => {
    if (!pids) return;
    const t = setTimeout(() => getPhotos({ ids: pids }).then(() => bump((x) => x + 1)).catch(() => {}), 350);
    return () => clearTimeout(t);
  }, [pids]);

  return (
    <div className="search-ov">
      <div className="search-top">
        <button className="back" onClick={onClose} aria-label="back">←</button>
        <div className="search-box">
          <SearchIcon width={18} height={18} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={bn ? "লিগ, দল বা যেকোনো খেলোয়াড় খুঁজুন" : "Search leagues, teams, any player"} enterKeyHint="search" />
          {q && <button className="search-x" onClick={() => setQ("")} aria-label="clear">×</button>}
        </div>
      </div>
      <div className="search-body">
        {!res && recent.length > 0 && (
          <>
            <div className="lg-h s-recent-h">{bn ? "সাম্প্রতিক খোঁজ" : "Recent"}<button onClick={() => { setRecent([]); saveRecent([]); }}>{bn ? "মুছে ফেলুন" : "Clear"}</button></div>
            <div className="card">{recent.map((x) => {
              if (x.k === "c") { const c = comps.find((y) => y.code === x.id); return c && <button key={"c" + x.id} className="s-row" onClick={() => go(x, () => nav.openLeague(c.code))}><span className="s-ic" data-c={c.code}><CompIcon c={c} size={22} /></span><b>{compName(c, lang)}</b></button>; }
              if (x.k === "t") { const t = teams.find((y) => y.id === x.id); return t && <button key={"t" + x.id} className="s-row" onClick={() => go(x, () => nav.openTeam(t.id))}><Crest team={t} size={28} /><span className="s-txt"><b>{teamName(t, lang)}</b>{t.league && <small className="muted">{compLabel(t.league, lang)}</small>}</span></button>; }
              const t = teams.find((y) => y.id === x.team);
              return <button key={"p" + x.id} className="s-row" onClick={() => go(x, () => nav.openPlayer(x.id))}><Avatar url={photoMemo[x.id]} name={x.name} team={t} size={36} /><span className="s-txt"><b>{playerName(x.name, lang)}</b><small className="muted">{t ? teamName(t, lang) : ""}</small></span></button>;
            })}</div>
          </>
        )}
        {empty && <div className="card empty">{bn ? "কিছু পাওয়া যায়নি। অন্য বানানে বা ইংরেজিতে লিখে দেখুন।" : "Nothing found. Try another spelling."}</div>}
        {res && [["comps", res.comps.top], ["teams", res.teams.top], ["players", res.players.top]].filter(([k]) => res[k].length).sort((x, y) => x[1] - y[1]).map(([k]) => (
          <Fragment key={k}>{k === "comps" ? (<>

          <div className="lg-h">{bn ? "লিগ" : "Leagues"}</div>
          <div className="card">{res.comps.map((c) => (
            <button key={c.code} className="s-row" onClick={() => go({ k: "c", id: c.code }, () => nav.openLeague(c.code))}><span className="s-ic" data-c={c.code}><CompIcon c={c} size={22} /></span><b>{compName(c, lang)}</b></button>
          ))}</div>
        
          </>) : k === "teams" ? (<>

          <div className="lg-h">{bn ? "দল" : "Teams"}</div>
          <div className="card">{res.teams.map((t) => (
            <button key={t.id} className="s-row" onClick={() => go({ k: "t", id: t.id }, () => nav.openTeam(t.id))}>
              <Crest team={t} size={28} />
              <span className="s-txt"><b>{teamName(t, lang)}</b>{t.league && <small className="muted">{compLabel(t.league, lang)}</small>}</span>
            </button>
          ))}</div>
        
          </>) : (<>

          <div className="lg-h">{bn ? "খেলোয়াড়" : "Players"}</div>
          <div className="card">{res.players.map((r) => (
            <button key={r.player_id} className="s-row" onClick={() => go({ k: "p", id: r.player_id, name: r.player_name, team: r.team_id }, () => nav.openPlayer(r.player_id))}>
              <Avatar url={photoMemo[r.player_id]} name={r.player_name} team={r.team} size={36} />
              <span className="s-txt"><b>{playerName(r.player_name, lang)}</b><small className="muted">{[r.team ? teamName(r.team, lang) : "", posLabel(r.position, lang) || ""].filter(Boolean).join(" · ")}</small></span>
            </button>
          ))}</div>
        
          </>)}</Fragment>
        ))}
      </div>
    </div>
  );
}

// ── জিজ্ঞেস করো: আলাদা পাতা (/ask) ──
// মাইকে বলে জিজ্ঞেস (যে ব্রাউজারে আছে)
const SpeechRec = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// গাইডের ইনফোগ্রাফিক: আইকন, ধাপের সিঁড়ি, মূল সংখ্যা, টিপস আর "এখনই চেষ্টা করুন"
const LockIcon = I(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
const PhoneIcon = I(<><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>);
const GUIDE_ICON = { quiz: QuizIcon, target: TargetIcon, trophy: TrophyIcon, users: UsersIcon, search: SearchIcon, user: UserIcon, phone: PhoneIcon, moon: MoonIcon, lock: LockIcon, mail: MailIcon };
function GuideCard({ g, lang }) {
  const nav = useNav();
  const Ic = GUIDE_ICON[g.icon];
  const act = { quiz: () => nav.openQuiz(), predict: () => nav.go("predict"), friends: () => nav.openFriends(), search: () => nav.openSearch(), profile: () => nav.go("profile"), privacy: () => nav.openPage("privacy"), contact: () => nav.openPage("contact") };
  return (
    <div className="guide">
      <div className="guide-h"><span className="guide-ic">{Ic ? <Ic width={22} height={22} /> : "★"}</span><b>{g.title}</b></div>
      {g.facts && <div className="guide-facts">{g.facts.map(([v, l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div>}
      <ol className="guide-steps">
        {g.steps.map(([h, d], i) => (
          <li key={i} style={{ animationDelay: `${i * 70}ms` }}><span className="guide-n">{num(i + 1, lang)}</span><div><b>{h}</b>{d && <p>{d}</p>}</div></li>
        ))}
      </ol>
      {g.tips?.length > 0 && <div className="guide-tips"><b>{lang === "bn" ? "মনে রাখুন" : "Good to know"}</b>{g.tips.map((t) => <p key={t}>{t}</p>)}</div>}
      {g.cta && act[g.cta[1]] && <button className="btn block guide-cta" onClick={act[g.cta[1]]}>{g.cta[0]} →</button>}
    </div>
  );
}

// উত্তরের ভেতরের ছোট টেবিল
function AskTable({ t, lang }) {
  const nav = useNav();
  const bn = lang === "bn";
  let prev = 0;
  return (
    <div className="card ask-tbl" style={{ marginTop: 8 }}>
      <div className="tbl tbl-h ask"><span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "খে" : "P"}</span><span>+/-</span><span>{bn ? "প" : "Pts"}</span></div>
      {t.rows.map((r) => {
        const gapRow = prev > 0 && r.position > prev + 1; prev = r.position;
        return (
          <Fragment key={r.team_id}>
            {gapRow && <div className="ask-gap">⋯</div>}
            <button className={"tbl ask " + (t.hl.includes(r.team_id) ? "hl " : "") + zone(t.code, r.position, 99)} onClick={() => nav.openTeam(r.team_id)}>
              <span className="pos">{num(r.position, lang)}</span>
              <span className="tm"><Crest team={r.team} size={20} /><b>{teamName(r.team, lang)}</b></span>
              <span>{num(r.played, lang)}</span><span>{r.gd > 0 ? "+" : ""}{num(r.gd, lang)}</span><span className="pts">{num(r.points, lang)}</span>
            </button>
          </Fragment>
        );
      })}
      <button className="ask-more" onClick={() => nav.openLeague(t.code)}>{bn ? "পুরো টেবিল দেখুন →" : "Full table →"}</button>
    </div>
  );
}

function AskPage({ teams, preds, onOpen, chat, setChat }) {
  const { lang } = useT();
  const nav = useNav();
  const favIds = useContext(FavCtx);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  // আগের প্রশ্নের দল বা লিগ মনে রাখা
  const ctx = [...chat].reverse().find((m) => m.ctx && (m.ctx.ids?.length || m.ctx.comp))?.ctx || {};
  function listen() {
    if (!SpeechRec) return;
    if (listening) { recRef.current?.stop(); return; }
    const r = new SpeechRec();
    r.lang = lang === "bn" ? "bn-BD" : "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const t = e.results?.[0]?.[0]?.transcript; if (t) ask(t); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r; setListening(true);
    try { r.start(); } catch { setListening(false); }
  }
  const endRef = useRef(null);
  useEffect(() => { if (chat.length || busy) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [chat, busy]);
  // কিবোর্ড খুললে নিচের ন্যাভ লুকায়, যাতে লেখার ঘর কিবোর্ডের ঠিক ওপরে বসে
  const kbTimer = useRef(null);
  const kb = (on) => {
    clearTimeout(kbTimer.current);
    if (on) document.documentElement.classList.add("kb-open");
    else kbTimer.current = setTimeout(() => document.documentElement.classList.remove("kb-open"), 150);
  };
  useEffect(() => () => { clearTimeout(kbTimer.current); document.documentElement.classList.remove("kb-open"); }, []);

  async function ask(text) {
    const t = text.trim();
    if (!t || busy) return;
    setQ(""); setBusy(true);
    setChat((c) => [...c, { me: t }]);
    try {
      const a = await answer(t, teams, lang, ctx, favIds);
      setChat((c) => [...c, a || { text: "…", matches: [] }]);
    } catch {
      setChat((c) => [...c, { text: lang === "bn" ? "দুঃখিত, এখন উত্তর আনা যাচ্ছে না। একটু পরে চেষ্টা করুন।" : "Sorry, couldn't fetch that right now.", matches: [] }]);
    }
    setBusy(false);
  }

  return (
    <div className="ask-page">
        <div className="ask-head"><span className="ask-orb sm"><SparkIcon /></span>{lang === "bn" ? "খেলা কখন? জিজ্ঞেস করুন" : "Ask Khela Kokhon"}
          {chat.length > 0 && <button className="ask-new" onClick={() => setChat([])}>{lang === "bn" ? "নতুন করে" : "New chat"}</button>}
        </div>
        <div className="ask-body">
          {chat.length === 0 && (
            <>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>
                {lang === "bn" ? "দল, লিগ বা খেলোয়াড় নিয়ে যা খুশি জিজ্ঞেস করুন: সূচি, ফল, টেবিল, ফর্ম, হেড টু হেড, গোল, কোচ, স্টেডিয়াম। সময় বলব বাংলাদেশ সময়ে।" : "Ask anything about teams, leagues or players: fixtures, results, tables, form, head to head, goals, coach, stadium."}
              </p>
              <div className="ask-ex">
                {[...HELP_CHIPS[lang === "bn" ? "bn" : "en"], lang === "bn" ? "কী কী জিজ্ঞেস করা যায়" : "What can I ask?"].map((e) => <button key={e} className="chip" onClick={() => ask(e)}>{e}</button>)}
              </div>
            </>
          )}
          {chat.map((m, i) => m.me ? (
            <div key={i} className="bubble me">{m.me}</div>
          ) : (
            <div key={i} className="bubble bot">
              <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
              {m.players?.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  {m.players.map((x) => (
                    <button key={x.player_id + x.code} className="ask-pl" onClick={() => nav.openPlayer(x.player_id)}>
                      <Crest team={x.team} size={26} />
                      <span className="ask-pl-n"><b>{playerName(x.player_name, lang)}</b><small className="muted">{x.code ? compLabel(x.code, lang) : x.team ? teamName(x.team, lang) : ""}</small></span>
                      <span className="ask-pl-g">{x.goals == null ? "—" : num(x.goals, lang)}<small>{lang === "bn" ? "গোল" : "goals"}</small></span>
                    </button>
                  ))}
                </div>
              )}
              {m.guide && <GuideCard g={m.guide} lang={lang} />}
              {m.table && <AskTable t={m.table} lang={lang} />}
              {m.form && (
                <div className="form-row" style={{ marginTop: 10 }}>
                  {[...m.form.list].reverse().map((x) => { const me = x.home_id === m.form.id ? x.home_score : x.away_score, th = x.home_id === m.form.id ? x.away_score : x.home_score; const r = me > th ? "W" : me < th ? "L" : "D";
                    return <button key={x.id} className={"badge big " + r + (lang === "bn" ? " word" : "")} onClick={() => onOpen(x)}>{RES[r][lang === "bn" ? 0 : 1]}</button>; })}
                </div>
              )}
              {m.h2h && (
                <div className="card ask-h2h" style={{ marginTop: 8 }}>
                  <div className="h2h-bar">
                    <span style={{ flex: m.h2h.ra.w || 0.001 }} className="a">{m.h2h.ra.w ? num(m.h2h.ra.w, lang) : ""}</span>
                    <span style={{ flex: m.h2h.ra.d || 0.001 }} className="d">{m.h2h.ra.d ? num(m.h2h.ra.d, lang) : ""}</span>
                    <span style={{ flex: m.h2h.rb.w || 0.001 }} className="b">{m.h2h.rb.w ? num(m.h2h.rb.w, lang) : ""}</span>
                  </div>
                  <div className="h2h-legend"><span><i className="a" />{teamName(teams.find((t) => t.id === m.h2h.a), lang)}</span><span><i className="d" />{lang === "bn" ? "ড্র" : "Draw"}</span><span><i className="b" />{teamName(teams.find((t) => t.id === m.h2h.b), lang)}</span></div>
                  {m.h2h.rows.map((x) => {
                    const hn = teams.find((t) => t.id === x.homeTeam?.id), an = teams.find((t) => t.id === x.awayTeam?.id);
                    return <div key={x.id} className="ah-row"><small className="muted">{(() => { const [y, mo, d] = dayKey(x.utcDate).split("-").map(Number); return lang === "bn" ? `${num(d, "bn")} ${BN_MONTHS[mo - 1].slice(0, 4)} ’${num(String(y).slice(2), "bn")}` : `${d} ${EN_MONTHS[mo - 1].slice(0, 3)} ’${String(y).slice(2)}`; })()}</small><span>{hn ? teamName(hn, lang) : x.homeTeam?.shortName || x.homeTeam?.name}</span><b>{num(x.score.home, lang)}–{num(x.score.away, lang)}</b><span>{an ? teamName(an, lang) : x.awayTeam?.shortName || x.awayTeam?.name}</span></div>;
                  })}
                </div>
              )}
              {m.matches?.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  {m.dated ? <DatedRows list={m.matches.slice(0, 12)} preds={preds} onOpen={onOpen} /> : m.matches.slice(0, 8).map((x) => <MatchRow key={x.id} m={x} pred={preds[x.id]} onOpen={onOpen} />)}
                </div>
              )}
              {m.teamLink && <button className="chip" style={{ marginTop: 8 }} onClick={() => nav.openTeam(m.teamLink)}>{lang === "bn" ? (m.squadLink ? "পুরো স্কোয়াড দেখুন →" : "দলের পাতা খুলুন →") : (m.squadLink ? "Full squad →" : "Open team page →")}</button>}
              {i === chat.length - 1 && m.chips?.length > 0 && (
                <div className="ask-ex ask-follow">{m.chips.slice(0, 6).map((e) => <button key={e} className="chip" onClick={() => ask(e)}>{e}</button>)}</div>
              )}
            </div>
          ))}
          {busy && <div className="bubble bot muted">…</div>}
          <div ref={endRef} />
        </div>
        <form className="ask-input" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => kb(true)} onBlur={() => kb(false)} enterKeyHint="send" placeholder={listening ? (lang === "bn" ? "শুনছি… বলুন" : "Listening…") : lang === "bn" ? "যেমন: বার্সার ফর্ম কেমন" : "e.g. Barcelona form"} />
          {SpeechRec && <button type="button" className={"ask-mic" + (listening ? " on" : "")} onClick={listen} aria-label="voice"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg></button>}
          <button className="btn" disabled={!q.trim() || busy}>{lang === "bn" ? "পাঠান" : "Send"}</button>
        </form>
    </div>
  );
}

// ════════════════ pages/League.jsx ════════════════
const ord = (n, lang) => {
  if (lang !== "bn") return n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");
  const special = { 1: "১ম", 2: "২য়", 3: "৩য়", 4: "৪র্থ", 5: "৫ম", 6: "৬ষ্ঠ", 7: "৭ম", 8: "৮ম", 9: "৯ম", 10: "১০ম" };
  return special[n] || num(n, "bn") + "তম";
};

// টেবিলের রঙের দাগ: চ্যাম্পিয়ন্স লিগে প্রথম ৮ সরাসরি, ৯–২৪ প্লে-অফ; লিগে প্রথম ৪ ইউসিএল, শেষ ৩ অবনমন
function zone(code, pos, total) {
  if (code === "CL") return pos <= 8 ? "z-up" : pos <= 24 ? "z-mid" : "";
  if (pos <= 4) return "z-up";
  const down = code === "BL1" || code === "FL1" ? 2 : 3;
  return pos > total - down ? "z-down" : "";
}

function Loading() { return <div className="card"><div className="spin" /></div>; }

function DatedRows({ list, preds, onOpen }) {
  const { lang } = useT();
  return list.map((m) => (
    <div key={m.id}>
      <div className="muted" style={{ fontSize: 11.5, padding: "8px 14px 0" }}>{dayLabel(dayKey(m.utc_date), lang, { short: true })}</div>
      <MatchRow m={m} pred={preds[m.id]} onOpen={onOpen} />
    </div>
  ));
}

// ═════════ লিগের পাতা ═════════
// মোবাইলে টেবিল/ম্যাচ/গোলদাতা ট্যাবে; বড় স্ক্রিনে সব একসাথে (বাঁয়ে টেবিল, ডানে বাকিটা)
function League({ code, comps, preds, onOpen }) {
  const { lang } = useT();
  const nav = useNav();
  const wide = useWide();
  const c = comps.find((x) => x.code === code) || { code, name_bn: code, name_en: code };
  const [tab, setTab] = useState("table");
  const [table, setTable] = useState(null);
  const [scorers, setScorers] = useState(null);
  const [games, setGames] = useState(null);
  const bn = lang === "bn";

  useEffect(() => { setTable(null); getStandings(code).then(setTable).catch(() => setTable([])); }, [code]);
  useEffect(() => {
    if ((wide || tab === "scorers") && scorers === null) getScorers(code).then(setScorers).catch(() => setScorers([]));
    if ((wide || tab === "matches") && games === null)
      Promise.all([getCompUpcoming(code, 10), getCompRecent(code, 10)]).then(([up, past]) => setGames({ up, past })).catch(() => setGames({ up: [], past: [] }));
  }, [tab, code, wide]);

  const notYet = bn ? "এখনো আসেনি। প্রতিদিন সকালে হালনাগাদ হয়।" : "Not available yet. Updated every morning.";

  const tableBlock = table === null ? <Loading /> : !table.length ? <div className="card empty">{bn ? "টেবিল " : "Table "}{notYet}</div> : (
    <>
      <div className="card">
        <div className="tbl tbl-h">
          <span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "খে" : "P"}</span><span>{bn ? "জ" : "W"}</span><span>{bn ? "ড্র" : "D"}</span><span>{bn ? "হা" : "L"}</span><span>+/-</span><span>{bn ? "প" : "Pts"}</span>
        </div>
        {table.map((r) => (
          <button key={r.team_id} className={"tbl " + zone(code, r.position, table.length)} onClick={() => nav.openTeam(r.team_id)}>
            <span className="pos">{num(r.position, lang)}</span>
            <span className="tm"><Crest team={r.team} size={20} /><b>{teamName(r.team, lang)}</b></span>
            <span>{num(r.played, lang)}</span><span>{num(r.won, lang)}</span><span>{num(r.draw, lang)}</span><span>{num(r.lost, lang)}</span>
            <span>{r.gd > 0 ? "+" : ""}{num(r.gd, lang)}</span>
            <span className="pts">{num(r.points, lang)}</span>
          </button>
        ))}
      </div>
      <div className="legend">
        {code === "CL"
          ? <><i className="z-up" />{bn ? "শেষ ষোলোয় সরাসরি" : "Round of 16"} <i className="z-mid" />{bn ? "প্লে-অফ" : "Play-offs"}</>
          : <><i className="z-up" />{bn ? "চ্যাম্পিয়ন্স লিগ" : "Champions League"} <i className="z-down" />{bn ? "অবনমন" : "Relegation"}</>}
      </div>
    </>
  );

  const gamesBlock = (n) => games === null ? <Loading /> : (
    <>
      <div className="sec-h"><h2>{bn ? "সামনের খেলা" : "Upcoming"}</h2></div>
      {games.up.length ? <div className="card"><DatedRows list={games.up.slice(0, n)} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "সামনে কোনো খেলা নেই" : "No upcoming matches"}</div>}
      <div className="sec-h" style={{ marginTop: 16 }}><h2>{bn ? "সাম্প্রতিক ফল" : "Recent results"}</h2></div>
      {games.past.length ? <div className="card"><DatedRows list={games.past.slice(0, n)} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "কোনো ফল নেই" : "No results"}</div>}
    </>
  );

  const scorersBlock = (n) => scorers === null ? <Loading /> : !scorers.length ? <div className="card empty">{bn ? "গোলদাতার তালিকা " : "Scorers "}{notYet}</div> : (
    <div className="card">
      <div className="scr scr-h"><span>#</span><span>{bn ? "খেলোয়াড়" : "Player"}</span><span>{bn ? "অ্যাসিস্ট" : "Ast"}</span><span>{bn ? "গোল" : "Goals"}</span></div>
      {scorers.slice(0, n).map((s, i) => (
        <div className="scr" key={s.player_id}>
          <span className="pos">{num(i + 1, lang)}</span>
          <span className="pl">
            <button className="pl-name" onClick={() => nav.openPlayer(s.player_id)}><b>{playerName(s.player_name, lang)}</b></button>
            <button className="pl-team" onClick={() => s.team_id && nav.openTeam(s.team_id)}><Crest team={s.team} size={14} />{teamName(s.team, lang)}</button>
          </span>
          <span className="muted">{num(s.assists ?? 0, lang)}</span>
          <span className="pts">{num(s.goals, lang)}</span>
        </div>
      ))}
    </div>
  );

  const head = (
    <div className="page-head">
      <button className="back" onClick={() => window.history.back()} aria-label="back">←</button>
      <CompIcon c={c} size={34} />
      <h1>{compName(c, lang)}</h1>
    </div>
  );

  if (wide) return (
    <>
      {head}
      <div className="pg-grid">
        <div className="pg-main">
          <div className="sec"><div className="sec-h"><h2>{bn ? "পয়েন্ট টেবিল" : "Table"}</h2></div>{tableBlock}</div>
        </div>
        <aside className="pg-side">
          <div className="sec"><div className="sec-h"><h2>{bn ? "শীর্ষ গোলদাতা" : "Top scorers"}</h2></div>{scorersBlock(10)}</div>
          <div className="sec">{gamesBlock(5)}</div>
        </aside>
      </div>
    </>
  );

  return (
    <>
      {head}
      <div className="sec" style={{ marginTop: 10 }}>
        <div className="seg seg3">
          {[["table", bn ? "টেবিল" : "Table"], ["matches", bn ? "ম্যাচ" : "Matches"], ["scorers", bn ? "গোলদাতা" : "Scorers"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>
      {tab === "table" && <div className="sec">{tableBlock}</div>}
      {tab === "matches" && <div className="sec">{gamesBlock(10)}</div>}
      {tab === "scorers" && <div className="sec">{scorersBlock(20)}</div>}
    </>
  );
}

// ═════════ দলের পাতা ═════════
const RES = { W: ["জয়", "W"], D: ["ড্র", "D"], L: ["হার", "L"] };

const POS = [
  ["GK", /goal/i, "গোলরক্ষক", "Goalkeepers"],
  ["DEF", /back|defen/i, "ডিফেন্ডার", "Defenders"],
  ["MID", /midfield/i, "মিডফিল্ডার", "Midfielders"],
  ["FWD", /wing|forward|offen|striker|attack/i, "ফরোয়ার্ড", "Forwards"],
];
const posOf = (p) => (POS.find(([, re]) => re.test(p || "")) || ["OTH"])[0];
const age = (dob) => {
  if (!dob) return null;
  const d = new Date(dob), n = new Date();
  return n.getFullYear() - d.getFullYear() - (n < new Date(n.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
};

function Squad({ info, lang, photos = {} }) {
  const bn = lang === "bn";
  const nav = useNav();
  if (info === null) return <div className="card"><div className="spin" /></div>;
  if (info === false || !info.squad?.length) return <div className="card empty">{bn ? "খেলোয়াড় তালিকা এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।" : "Squad isn't available right now. Try again later."}</div>;
  const groups = [...POS.map(([k, , b, e]) => [k, bn ? b : e]), ["OTH", bn ? "অন্যান্য" : "Others"]]
    .map(([k, label]) => [label, info.squad.filter((p) => posOf(p.position) === k)])
    .filter(([, list]) => list.length);
  return (
    <>
      {info.coach && (
        <div className="card info-row"><span className="muted">{bn ? "কোচ" : "Coach"}</span><b>{info.coach.name}</b></div>
      )}
      {groups.map(([label, list]) => (
        <div key={label}>
          <div className="lg-h">{label} <span className="muted" style={{ fontWeight: 500 }}>({num(list.length, lang)})</span></div>
          <div className="card">
            {list.map((p) => (
              <button className="sq" key={p.id} onClick={() => nav.openPlayer(p.id)}>
                <span className="sq-av"><Avatar url={photos[p.id]} name={p.name} /></span>
                <b>{playerName(p.name, lang)}</b>
                <span className="muted">{[p.position, natName(p.nationality, lang)].filter(Boolean).join(" · ")}</span>
                <span className="sq-age">{age(p.dateOfBirth) != null ? `${num(age(p.dateOfBirth), lang)} ${bn ? "বছর" : "y"}` : ""}<i className="sq-go">›</i></span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ছোট গোল ছবি; ছবি না থাকলে বা না এলে নামের আদ্যক্ষর (বা দলের লোগো)
function Avatar({ url, name, team, size = 34 }) {
  const [tries, setTries] = useState(0);
  const src = tries === 0 ? smallPhoto(url) : tries === 1 ? photoFallback(smallPhoto(url)) : null;
  if (url && src) return <img className="av" src={src} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setTries((t) => t + 1)} style={{ width: size, height: size }} />;
  if (team) return <span className="av av-fb" style={{ width: size, height: size }}><Crest team={team} size={Math.round(size * 0.62)} /></span>;
  const ini = (name || "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return <span className="av av-fb" style={{ width: size, height: size, fontSize: size * 0.36 }}>{ini}</span>;
}

// ════════════════ pages/Player.jsx ════════════════
// ছবি না পেলে বা না এলে জার্সি নম্বর
function PlayerPhoto({ p, lang }) {
  const [tries, setTries] = useState(0);
  const src = tries === 0 ? p.photo?.url : tries === 1 ? photoFallback(p.photo?.url) : null;
  const shirt = p.shirtNumber != null ? num(p.shirtNumber, lang) : (p.name || "?").slice(0, 1);
  if (!src) return <div className="pl-avatar">{shirt}</div>;
  return (
    <div className="pl-photo-wrap">
      <img className="pl-photo" src={src} alt={p.name} width="112" height="112" decoding="async" onError={() => setTries((t) => t + 1)} />
      {p.shirtNumber != null && <span className="pl-shirt">{shirt}</span>}
    </div>
  );
}
// football-data-র Offence/Defence/Midfield পরিচিত নামে
const POS_EN = { Offence: "Forward", Defence: "Defender", Midfield: "Midfielder" };
const posLabel = (pos, lang) => (pos ? (lang === "bn" ? POS_BN[pos] : POS_EN[pos]) || pos : null);
const POS_BN = {
  Goalkeeper: "গোলরক্ষক", Defence: "ডিফেন্ডার", Midfield: "মিডফিল্ডার", Offence: "ফরোয়ার্ড",
  "Centre-Back": "সেন্টার-ব্যাক", "Left-Back": "লেফট-ব্যাক", "Right-Back": "রাইট-ব্যাক",
  "Defensive Midfield": "ডিফেন্সিভ মিডফিল্ডার", "Central Midfield": "সেন্ট্রাল মিডফিল্ডার", "Attacking Midfield": "অ্যাটাকিং মিডফিল্ডার",
  "Left Midfield": "লেফট মিডফিল্ডার", "Right Midfield": "রাইট মিডফিল্ডার",
  "Left Winger": "লেফট উইঙ্গার", "Right Winger": "রাইট উইঙ্গার", "Centre-Forward": "সেন্টার-ফরোয়ার্ড",
};
function Player({ id, teamsById, comps }) {
  const { lang } = useT();
  const wide = useWide();
  const bn = lang === "bn";
  const nav = useNav();
  const [p, setP] = useState(null);
  const [scoring, setScoring] = useState([]);
  const [allSc, setAllSc] = useState([]);
  useEffect(() => {
    let live = true;
    getPlayer(id).then((d) => live && setP(d)).catch(() => live && setP(false));
    getPlayerScoring(id).then((r) => live && setScoring(r)).catch(() => {});
    getAllScorers().then((r) => live && setAllSc(r)).catch(() => {});
    return () => { live = false; };
  }, [id]);

  const back = <div className="page-head"><button className="back" onClick={() => window.history.back()} aria-label="back">←</button></div>;
  if (p === null) return <>{back}<div className="sec"><Loading /></div></>;
  if (p === false) return <>{back}<div className="sec"><div className="card empty">{bn ? "খেলোয়াড়ের তথ্য এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।" : "Player info isn't available right now. Try again later."}</div></div></>;

  const team = p.team ? { ...(teamsById[p.team.id] || {}), ...p.team, crest: teamsById[p.team.id]?.crest || p.team.crest } : null;
  const a = age(p.dateOfBirth);
  const st = p.stats;
  // যে প্রতিযোগিতায় খেলেছে কিন্তু গোল নেই, সেগুলোও সারিতে (০, বা পুরো হিসাব না এলে —)
  const playedIn = [...new Set([...(st?.competitions || "").split(",").filter(Boolean), teamsById[p.team?.id]?.league].filter((c) => c && c in COMP_LABEL))];
  const compRows = [...scoring, ...playedIn.filter((c) => !scoring.some((r) => r.competition_code === c))
    .map((c) => ({ competition_code: c, goals: scorersComplete(allSc, c) ? 0 : null, assists: scorersComplete(allSc, c) ? 0 : null, played: null }))]
    .sort((a, b) => (a.competition_code === "CL") - (b.competition_code === "CL"));
  const sum = (k) => scoring.reduce((t, r) => t + (r[k] || 0), 0);
  const tiles = [
    st && [bn ? "ম্যাচ" : "Matches", st.matches],
    scoring.length > 0 && [bn ? "গোল" : "Goals", sum("goals")],
    scoring.length > 0 && [bn ? "অ্যাসিস্ট" : "Assists", sum("assists")],
    scoring.length > 0 && [bn ? "পেনাল্টি গোল" : "Penalty goals", sum("penalties")],
  ].filter(Boolean);
  const compOf = (code) => comps.find((c) => c.code === code);
  const born = p.dateOfBirth && (() => { const [y, m, d] = p.dateOfBirth.split("-").map(Number); return bn ? `${num(d, "bn")} ${BN_MONTHS[m - 1]} ${num(y, "bn")}` : `${d} ${EN_MONTHS[m - 1]} ${y}`; })();
  const contract = team?.contractUntil && (() => { const [y, m] = team.contractUntil.split("-").map(Number); return bn ? `${BN_MONTHS[(m || 6) - 1]} ${num(y, "bn")}` : `${EN_MONTHS[(m || 6) - 1]} ${y}`; })();
  const info = [
    [bn ? "পজিশন" : "Position", posLabel(p.position, lang)],
    [bn ? "বয়স" : "Age", a != null ? `${num(a, lang)} ${bn ? "বছর" : ""}`.trim() : null],
    [bn ? "জন্ম" : "Born", born],
    [bn ? "দেশ" : "Nationality", natName(p.nationality, lang)],
    [bn ? "জার্সি" : "Shirt", p.shirtNumber != null ? num(p.shirtNumber, lang) : null],
    [bn ? "চুক্তি" : "Contract until", contract],
  ].filter(([, v]) => v);

  return (
    <>
      {back}
      <div className={"team-hero" + (wide ? " row" : "")}>
        <PlayerPhoto p={p} lang={lang} />
        <div className="th-name">
        <h1>{playerName(p.name, lang)}</h1>
        {lang === "bn" && PLAYER_BN[p.name] && <div className="muted" style={{ fontSize: 13 }}>{p.name}</div>}
        </div>
        {team && (
          <button className="chip" onClick={() => nav.openTeam(team.id)}><Crest team={team} size={18} />{teamName(team, lang) || team.shortName || team.name}</button>
        )}
      </div>

      {p.photo?.url && (
        <p className="pl-credit"><a href={p.photo.page} target="_blank" rel="noopener noreferrer">{bn ? "ছবি: Wikimedia Commons" : "Photo: Wikimedia Commons"}</a></p>
      )}
      <div className={wide ? "pg-grid" : undefined}>
      <div className={wide ? "pg-main" : undefined}>
      {(st || scoring.length > 0) && (
        <div className="sec">
          <div className="sec-h"><h2>{bn ? "এই মৌসুমে" : "This season"}</h2><span className="muted" style={{ fontSize: 12 }}>{compList([...(st?.competitions || "").split(","), ...scoring.map((r) => r.competition_code)], lang)}</span></div>
          <div className="card stat-grid" style={{ gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}>
            {tiles.map(([l, v]) => <div key={l}><b>{num(v, lang)}</b><span>{l}</span></div>)}
          </div>
          {!scoring.length && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>{bn ? "এই মৌসুমে এখনো গোল নেই, তাই গোল-অ্যাসিস্টের হিসাব দেখানো হয়নি।" : "No goals yet this season, so no goal/assist figures."}</p>}
        </div>
      )}

      {compRows.length > 0 && (
        <div className="sec">
          <div className="sec-h"><h2>{bn ? "প্রতিযোগিতা অনুযায়ী" : "By competition"}</h2></div>
          <div className="card">
            <div className="scr scr-h"><span /><span style={{ textAlign: "left" }}>{bn ? "প্রতিযোগিতা" : "Competition"}</span><span>{bn ? "অ্যাসিস্ট" : "Ast"}</span><span>{bn ? "গোল" : "Goals"}</span></div>
            {compRows.map((r) => (
              <button className="scr" key={r.competition_code} onClick={() => nav.openLeague(r.competition_code)}>
                <span><CompIcon c={compOf(r.competition_code)} size={18} /></span>
                <span className="pl"><b>{compName(compOf(r.competition_code), lang) || r.competition_code}</b>{r.played != null && <span className="muted" style={{ fontSize: 12 }}>{num(r.played, lang)} {bn ? "ম্যাচ" : "matches"}</span>}</span>
                <span className="muted">{r.assists == null ? "—" : num(r.assists, lang)}</span>
                <span className="pts">{r.goals == null ? "—" : num(r.goals, lang)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!st && !scoring.length && (
        <div className="sec"><div className="card empty">{bn ? "এই মৌসুমের পরিসংখ্যান এখনো পাওয়া যায়নি।" : "No stats for this season yet."}</div></div>
      )}
      </div>
      <div className={wide ? "pg-side" : undefined}>
      {info.length > 0 && (
        <div className="sec">
          <div className="sec-h"><h2>{bn ? "পরিচয়" : "Profile"}</h2></div>
          <div className="card">
            {info.map(([k, v]) => <div className="info-row" key={k}><span className="muted">{k}</span><b>{v}</b></div>)}
          </div>
        </div>
      )}
      </div>
      </div>
    </>
  );
}

function Team({ id, teamsById, preds, onOpen, isFav, onToggleFav }) {
  const { lang } = useT();
  const nav = useNav();
  const wide = useWide();
  const bn = lang === "bn";
  const [pos, setPos] = useState(null);
  const [up, setUp] = useState(null);
  const [past, setPast] = useState(null);
  const [tab, setTab] = useState("overview");
  const [info, setInfo] = useState(null);
  const [photos, setPhotos] = useState({});
  // স্কোয়াড ট্যাব খুললে ছবি আনা (প্রথমবার একটু সময় লাগে, পরে জমা থেকে)
  useEffect(() => {
    if (!info) return; // দলের পাতা খুললেই পেছনে ছবি আনা শুরু, স্কোয়াড ট্যাবে যাওয়ার আগেই
    let live = true;
    setPhotos({ ...photoMemo });
    getPhotos({ team: id }).then((d) => live && setPhotos(d)).catch(() => {});
    return () => { live = false; };
  }, [!!info, id]);
  const team = teamsById[id] || up?.map((m) => (m.home_id === id ? m.home : m.away))[0] || past?.map((m) => (m.home_id === id ? m.home : m.away))[0];

  useEffect(() => {
    setPos(null); setUp(null); setPast(null);
    getTeamStandings(id).then((r) => setPos(r.sort((a, b) => (a.competition_code === "CL") - (b.competition_code === "CL")))).catch(() => setPos([]));
    getTeamMatches([id], { upcoming: true, limit: 6 }).then(setUp).catch(() => setUp([]));
    getTeamMatches([id], { upcoming: false, limit: 6 }).then(setPast).catch(() => setPast([]));
    setInfo(null);
    getTeamInfo(id).then(setInfo).catch(() => setInfo(false));
  }, [id]);

  const res = (m) => {
    const me = m.home_id === id ? m.home_score : m.away_score, them = m.home_id === id ? m.away_score : m.home_score;
    return me > them ? "W" : me < them ? "L" : "D";
  };
  const form = (past || []).slice(0, 5).reverse();
  const main = pos?.[0];

  return (
    <>
      <div className="page-head">
        <button className="back" onClick={() => window.history.back()} aria-label="back">←</button>
      </div>
      <div className={"team-hero" + (wide ? " row" : "")}>
        <Crest team={team} size={84} />
        <div className="th-name">
        <h1>{teamName(team, lang)}</h1>
        {team && bn && <div className="muted" style={{ fontSize: 13 }}>{teamName(team, "en")}</div>}
        </div>
        {team && onToggleFav && (
          <button className={"fav-btn" + (isFav ? " on" : "")} onClick={() => onToggleFav(id)}>
            <span>{isFav ? "★" : "☆"}</span>{isFav ? (bn ? "প্রিয় দল" : "Favourite") : (bn ? "প্রিয় দলে যোগ করুন" : "Add to favourites")}
          </button>
        )}
        {pos?.length > 0 && (
          <div className="team-pos">
            {pos.map((p) => (
              <button key={p.competition_code} className="chip" onClick={() => nav.openLeague(p.competition_code)}>
                <CompIcon c={p.competition} size={16} />{compName(p.competition, lang)} · {ord(p.position, lang)}
              </button>
            ))}
          </div>
        )}
      </div>

      {!wide && (
      <div className="sec" style={{ marginTop: 14 }}>
        <div className="seg">
          <button className={tab === "overview" ? "on" : ""} onClick={() => setTab("overview")}>{bn ? "এক নজরে" : "Overview"}</button>
          <button className={tab === "squad" ? "on" : ""} onClick={() => setTab("squad")}>{bn ? "খেলোয়াড়" : "Squad"}</button>
        </div>
      </div>
      )}

      <div className={wide ? "pg-grid" : undefined}>
      {!wide && tab === "squad" ? <div className="sec"><Squad info={info} lang={lang} photos={photos} /></div> : (<div className={wide ? "pg-main" : undefined}>
      {main && (
        <div className="sec">
          {pos.map((st) => (
            <div key={st.competition_code} style={{ marginBottom: 10 }}>
              <div className="sec-h"><h2 className="my-h"><CompIcon c={st.competition} size={16} />{compLabel(st.competition_code, lang)}{st.position ? <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}> · {ord(st.position, lang)}</span> : null}</h2></div>
              <div className="card stat-row">
                {[[bn ? "খেলা" : "Played", st.played], [bn ? "জয়" : "Won", st.won], [bn ? "ড্র" : "Drawn", st.draw], [bn ? "হার" : "Lost", st.lost], [bn ? "গোল" : "Goals", `${num(st.gf, lang)}-${num(st.ga, lang)}`], [bn ? "পয়েন্ট" : "Points", st.points]].map(([l, v]) => (
                  <div key={l}><b>{typeof v === "number" ? num(v, lang) : v}</b><span>{l}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {form.length > 0 && (
        <div className="sec">
          <div className="sec-h"><h2>{bn ? "শেষ পাঁচ ম্যাচের ফর্ম" : "Form (last 5)"}</h2><span className="muted" style={{ fontSize: 12 }}>{compList(form.map((m) => m.competition_code), lang)}</span></div>
          <div className="form-row">
            {form.map((m) => { const r = res(m); return <button key={m.id} className={"badge big " + r + (bn ? " word" : "")} onClick={() => onOpen(m)}>{RES[r][bn ? 0 : 1]}</button>; })}
          </div>
        </div>
      )}

      <div className="sec">
        <div className="sec-h"><h2>{bn ? "সামনের খেলা" : "Upcoming"}</h2></div>
        {up === null ? <Loading /> : up.length ? <div className="card"><DatedRows list={up} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "সামনে কোনো খেলা সূচিতে নেই" : "No upcoming fixtures"}</div>}
      </div>
      <div className="sec">
        <div className="sec-h"><h2>{bn ? "সাম্প্রতিক ফল" : "Recent results"}</h2></div>
        {past === null ? <Loading /> : past.length ? <div className="card"><DatedRows list={past} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "কোনো ফল নেই" : "No results"}</div>}
      </div>
      {!wide && info && (info.venue || info.founded) && (
        <div className="sec">
          <div className="card">
            {info.venue && <div className="info-row"><span className="muted">{bn ? "মাঠ" : "Stadium"}</span><b>{info.venue}</b></div>}
            {info.founded && <div className="info-row"><span className="muted">{bn ? "প্রতিষ্ঠা" : "Founded"}</span><b>{num(info.founded, lang)}</b></div>}
            {info.coach && <div className="info-row"><span className="muted">{bn ? "কোচ" : "Coach"}</span><b>{info.coach.name}</b></div>}
          </div>
        </div>
      )}
      </div>)}
      {wide && (
        <aside className="pg-side">
          {info && (info.venue || info.founded) && (
            <div className="sec">
              <div className="sec-h"><h2>{bn ? "ক্লাবের তথ্য" : "Club info"}</h2></div>
              <div className="card">
                {info.venue && <div className="info-row"><span className="muted">{bn ? "মাঠ" : "Stadium"}</span><b>{info.venue}</b></div>}
                {info.founded && <div className="info-row"><span className="muted">{bn ? "প্রতিষ্ঠা" : "Founded"}</span><b>{num(info.founded, lang)}</b></div>}
              </div>
            </div>
          )}
          <div className="sec">
            <div className="sec-h"><h2>{bn ? "খেলোয়াড়" : "Squad"}</h2>{info?.squad?.length ? <span className="muted" style={{ fontSize: 12.5 }}>{num(info.squad.length, lang)} {bn ? "জন" : "players"}</span> : null}</div>
            <Squad info={info} lang={lang} photos={photos} />
          </div>
        </aside>
      )}
      </div>
    </>
  );
}

// ═════════ লিগের সারি (হোম আর ম্যাচ পাতায়) ═════════
// ════════════════ App.jsx ════════════════
const TABS = [
  { id: "matches", path: "/", Icon: BallIcon },
  { id: "leagues", path: "/leagues", Icon: TrophyIcon },
  { id: "ask", path: "/ask", Icon: SparkIcon, center: true },
  { id: "predict", path: "/predict", Icon: TargetIcon },
  { id: "profile", path: "/profile", Icon: UserIcon },
];
const tabFromPath = () => TABS.find((x) => x.path === window.location.pathname)?.id || "matches"; // পুরনো /matches লিংকও ম্যাচে যায়
// /league/PL বা /team/86 হলে সেই পাতা
// ফুটারের আলাদা পাতা
const PAGE_PATHS = { about: "about", "how-it-works": "how", founder: "founder", contact: "contact", privacy: "privacy" };
const PAGE_URL = { about: "/about", how: "/how-it-works", founder: "/founder", contact: "/contact", privacy: "/privacy" };
const viewFromPath = () => {
  const [, kind, id] = window.location.pathname.split("/");
  if (kind === "league" && id) return { kind: "league", code: id.toUpperCase() };
  if (kind === "team" && /^\d+$/.test(id || "")) return { kind: "team", id: +id };
  if (kind === "player" && /^\d+$/.test(id || "")) return { kind: "player", id: +id };
  if (kind === "quiz") return { kind: "quiz", code: id && /^[A-Za-z0-9]{4,8}$/.test(id) ? id.toUpperCase() : null };
  if (kind === "daily" && !id) return { kind: "daily" };
  if (PAGE_PATHS[kind] && !id) return { kind: "page", id: PAGE_PATHS[kind] };
  return null;
};
const stored = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

// ডেস্কটপে হেডারের ভেতরে একই ট্যাবগুলো
function DeskNav({ tab, go }) {
  const { t } = useT();
  const nav = useNav();
  return (
    <nav className="dnav">
      {TABS.map(({ id, Icon }) => (
        <button key={id} className={tab === id ? "on" : ""} onClick={() => (id === "predict" ? nav.openGames() : go(id))}>
          <Icon />{t(id)}
        </button>
      ))}
    </nav>
  );
}

function Nav({ tab, go }) {
  const { t } = useT();
  const nav = useNav();
  return (
    <nav className="nav">
      <div className="nav-in">
        {TABS.map(({ id, Icon, center }) => center ? (
          <button key={id} className={"nav-ask" + (tab === id ? " on" : "")} onClick={() => go(id)}>
            <span className="ask-orb"><Icon /></span>{t(id)}
          </button>
        ) : (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => (id === "predict" ? nav.openGames() : go(id))}>
            <Icon />{t(id)}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  const [lang, setLangS] = useState(() => stored("kk_lang", "bn"));
  const [theme, setThemeS] = useState(() => stored("kk_theme", "light"));
  const [tab, setTab] = useState(() => (/^\/(quiz|daily)/.test(window.location.pathname) ? "predict" : tabFromPath()));
  const [view, setView] = useState(viewFromPath);
  const [comps, setComps] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myTeams, setMyTeams] = useState({ fav: [], rival: [] });
  const [preds, setPreds] = useState({});
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showClock, setShowClock] = useState(false);
  const [askChat, setAskChat] = useState([]); // ট্যাব বদলালেও কথোপকথন থাকে
  const [predTab, setPredTab] = useState({ tab: "mine", league: null, key: 0 });

  const setLang = (v) => { setLangS(v); store("kk_lang", v); };
  const setTheme = (v) => { setThemeS(v); store("kk_theme", v); };
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0c1311" : "#eef2f1");
  }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const toast = useCallback((m, ms = 2200) => { setToastMsg(m); setTimeout(() => setToastMsg(""), ms); }, []);

  // ── ট্যাব আর ফোনের ব্যাক বাটন ──
  // "খেলা কখন?" লেখায় চাপলে একদম শুরুর পাতা: আজকের ম্যাচ, সব ফিল্টার আগের মতো, উপরে
  const [homeKey, setHomeKey] = useState(0);
  const goHome = () => { setSheet(null); setSearching(false); setHomeKey((k) => k + 1); go("matches"); };
  const go = (id) => {
    const p = TABS.find((x) => x.id === id).path;
    if (window.location.pathname !== p) window.history.pushState({}, "", p);
    setTab(id); setView(null); setEditing(false); window.scrollTo(0, 0);
  };
  useEffect(() => {
    const onPop = () => { setSheet(null); setSearching(false); setView(viewFromPath()); if (!viewFromPath()) setTab(tabFromPath()); window.scrollTo(0, 0); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // লিগ/দলের পাতা খোলা (ম্যাচের শিট খোলা থাকলে সেটা বন্ধ করে)
  const openView = (path, v) => {
    if (window.history.state?.sheet) window.history.replaceState({}, "", path);
    else window.history.pushState({}, "", path);
    setSheet(null); setSearching(false); setEditing(false); setView(v); window.scrollTo(0, 0);
  };
  const nav = {
    openLeague: (code) => openView(`/league/${code}`, { kind: "league", code }),
    openTeam: (id) => openView(`/team/${id}`, { kind: "team", id }),
    openPlayer: (id) => openView(`/player/${id}`, { kind: "player", id }),
    openPage: (id) => openView(PAGE_URL[id], { kind: "page", id }),
    // কুইজ: /quiz (শুরুর পাতা) বা /quiz/কোড; replace = ইতিহাসে নতুন ধাপ না যোগ করে
    openFriends: () => { setPredTab((p) => ({ tab: "friends", league: null, key: p.key + 1 })); go("predict"); },
    openSearch: () => { setSheet(null); setSearching(true); },
    openDaily: () => { setTab("predict"); openView("/daily", { kind: "daily" }); },
    // গেম ট্যাব: শেষবার যেখানে ছিলেন সেখানে (প্রথমবার প্রেডিকশন)
    openGames: () => { const g = ls.get("game_last", "predict"); if (g === "daily") nav.openDaily(); else if (g === "quiz") nav.openQuiz(); else go("predict"); },
    // স্পোর্টস কুইজ বোতাম: কুইজের ভেতরের শেষ ভাগে (প্রথমবার দৈনিক চ্যালেঞ্জ)
    openQuizArea: () => (ls.get("quiz_last", "daily") === "quiz" ? nav.openQuiz() : nav.openDaily()),
    openQuiz: (code, replace) => {
      setTab("predict");
      const path = code ? `/quiz/${code}` : "/quiz";
      if (replace) { window.history.replaceState({}, "", path); setSheet(null); setView({ kind: "quiz", code: code || null }); window.scrollTo(0, 0); }
      else openView(path, { kind: "quiz", code: code || null });
    },
    go,
  };

  useEffect(() => {
    const g = view?.kind === "daily" ? "daily" : view?.kind === "quiz" ? "quiz" : !view && tab === "predict" ? "predict" : null;
    if (g) ls.set("game_last", g);
    if (g === "daily" || g === "quiz") ls.set("quiz_last", g);
  }, [view?.kind, tab]);
  const openMatch = (m) => { window.history.pushState({ sheet: 1 }, ""); setSheet(m); };
  const [searching, setSearching] = useState(false);
  const openSearch = () => { window.history.pushState({ sheet: 1 }, ""); setSearching(true); };
  const closeSearch = () => { if (window.history.state?.sheet) window.history.back(); else setSearching(false); };
  const closeMatch = () => { if (window.history.state?.sheet) window.history.back(); else setSheet(null); };

  // ── সাধারণ ডেটা ──
  useEffect(() => {
    getCompetitions().then(setComps).catch(() => {});
    getTeams().then((ts) => setTeamsById(Object.fromEntries(ts.map((x) => [x.id, x])))).catch(() => {});
  }, []);

  // ── লগইন ──
  useEffect(() => {
    getUser().then(setUser);
    return onAuth(setUser);
  }, []);
  useEffect(() => {
    if (!user) { setProfile(null); setMyTeams({ fav: [], rival: [] }); setPreds({}); return; }
    getProfile(user).then(setProfile).catch(() => {});
    getMyTeams(user).then(setMyTeams).catch(() => {});
    getMyPredictions(user).then(setPreds).catch(() => {});
  }, [user?.id]);

  // আমন্ত্রণ লিংক: /join/ABC123 → লগইন থাকলে যোগ দেয়, না থাকলে লগইনের পর
  useEffect(() => {
    const m = window.location.pathname.match(/^\/join\/([A-Za-z0-9]{6})$/);
    // ?/# অংশ রেখে দিই: ইমেইল বা Google থেকে ফেরার লগইনের তথ্য ওখানেই থাকে
    if (m) { store("kk_join", m[1].toUpperCase()); window.history.replaceState({}, "", "/predict" + window.location.search + window.location.hash); setTab("predict"); }
  }, []);
  // কুইজ খেলতে গিয়ে লগইন করলে, লগইনের পর সেই কুইজে ফেরা
  useEffect(() => {
    const c = user && pendingQuiz();
    if (!c) return;
    try { localStorage.removeItem("kk_quiz"); } catch { /* ignore */ }
    nav.openQuiz(c === "new" ? null : c);
  }, [user?.id]);
  const [joinedLeague, setJoinedLeague] = useState(null);
  useEffect(() => {
    const metaCode = user?.user_metadata?.join;
    const code = pendingJoin() || metaCode;
    if (!code) return;
    if (!user) { setTab("profile"); window.history.replaceState({}, "", "/profile"); toast(lang === "bn" ? "আমন্ত্রণ পেয়েছেন! রেজিস্টার বা লগইন করলেই লিগে যোগ হয়ে যাবেন" : "You're invited! Sign up or log in and you'll join the league automatically", 5000); return; }
    try { localStorage.removeItem("kk_join"); } catch { /* ignore */ }
    if (metaCode && !DEMO) sb.auth.updateUser({ data: { join: null } }).catch(() => {});
    joinLeague(code)
      .then((r) => {
        toast(lang === "bn" ? `"${r.name}" লিগে যোগ দিয়েছেন 🎉` : `Joined "${r.name}" 🎉`);
        setJoinedLeague(r.id);
        setPredTab((p) => ({ tab: "friends", league: r.id, key: p.key + 1 })); go("predict");
      })
      .catch((e) => toast(e.message || "…"));
  }, [user?.id]);

  // সাইটে কোথাও "?ask" থাকলে সরাসরি জিজ্ঞেস-বক্স খোলে
  // লগইন (যেমন Google) ব্যর্থ হলে Supabase ঠিকানায় ?error=… দিয়ে ফেরত পাঠায়: পরিষ্কার করে জানাই
  useEffect(() => {
    const q = new URLSearchParams(window.location.search), h = new URLSearchParams(window.location.hash.slice(1));
    const err = q.get("error_description") || h.get("error_description") || q.get("error") || h.get("error");
    if (!err) return;
    console.warn("auth error:", err);
    window.history.replaceState({}, "", "/profile"); setTab("profile");
    toast(lang === "bn" ? "লগইন হয়নি। একটু পরে আবার চেষ্টা করুন, অথবা ইমেইল দিয়ে লগইন করুন।" : "Login failed. Please try again later, or use email.", 6000);
  }, []);
  useEffect(() => { if (new URLSearchParams(window.location.search).has("ask")) { window.history.replaceState({}, "", "/ask"); setTab("ask"); } }, []);

  // কুইজের লিংকে এলে দল বাছাই পরে, যাতে লাইভ কুইজের শুরু মিস না হয়
  // দল বাছাইয়ের পাতা শুধু প্রোফাইলের "এডিট" চাপলে; নতুনদের সরাসরি সাইটে
  const onboarding = user && profile && editing;

  // দলের পাতা থেকে প্রিয় দল যোগ/বাদ (সর্বোচ্চ ৩টা)
  async function toggleFav(id) {
    if (!user) { toast(lang === "bn" ? "প্রিয় দল যোগ করতে আগে লগইন করুন" : "Log in to add favourites"); go("profile"); return; }
    const has = myTeams.fav.includes(id);
    if (!has && myTeams.fav.length >= MAX.fav) { toast(lang === "bn" ? `সর্বোচ্চ ${num(MAX.fav, "bn")}টা প্রিয় দল রাখা যায়। প্রোফাইল থেকে বদলাতে পারবেন।` : `Up to ${MAX.fav} favourites. Change them in Profile.`); return; }
    const next = { fav: has ? myTeams.fav.filter((x) => x !== id) : [...myTeams.fav, id], rival: (myTeams.rival || []).filter((x) => x !== id) };
    setMyTeams(next);
    try { await saveMyTeams(user, next); toast(has ? (lang === "bn" ? "প্রিয় দল থেকে বাদ দেওয়া হয়েছে" : "Removed from favourites") : (lang === "bn" ? "প্রিয় দলে যোগ হয়েছে ★" : "Added to favourites ★")); }
    catch { setMyTeams(myTeams); toast(lang === "bn" ? "সেভ করা গেল না, আবার চেষ্টা করুন" : "Couldn't save"); }
  }
  async function finishOnboarding({ fav, rival, phone }) {
    await saveMyTeams(user, { fav, rival });
    const p = await updateProfile(user, { onboarded: true, ...(phone ? { phone } : {}) });
    setProfile(p); setMyTeams({ fav, rival }); setEditing(false);
    // আমন্ত্রণে এসে থাকলে দল বাছার পর সরাসরি সেই লিগে
    if (joinedLeague) { setPredTab((x) => ({ tab: "friends", league: joinedLeague, key: x.key + 1 })); setJoinedLeague(null); go("predict"); }
    else go("matches");
  }
  async function skipOnboarding() {
    const p = await updateProfile(user, { onboarded: true }).catch(() => profile);
    setProfile(p); setEditing(false);
  }

  async function onSavePrediction(m, h, a) {
    const p = await savePrediction(user, m.id, h, a);
    setPreds((x) => ({ ...x, [m.id]: p }));
  }

  return (
    <LangCtx.Provider value={lang}>
    <NavCtx.Provider value={nav}>
    <FavCtx.Provider value={myTeams.fav}>
      <div className="app">
        <header className="top">
          <div className="brand">
            <Logo size={36} onClick={() => setShowClock((v) => !v)} />
            <button onClick={goHome} aria-label={lang === "bn" ? "হোম" : "Home"} style={{ textAlign: "left", fontWeight: 700, fontSize: 19, lineHeight: 1.1 }}>
              <span>খেলা কখন<b>?</b></span>
              {showClock && <ClockText />}
            </button>
          </div>
          {!onboarding && <DeskNav tab={view ? null : tab} go={go} />}
          <div className="sp" />
          <button className="pill-btn round" onClick={openSearch} aria-label={lang === "bn" ? "খুঁজুন" : "Search"}><SearchIcon width={17} height={17} /></button>
          <button className="pill-btn" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>{lang === "bn" ? "EN" : "বাং"}</button>
          <button className="pill-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="theme">
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>
        </header>
        {DEMO && <div className="demo-bar">{lang === "bn" ? "ডেমো মোড — নমুনা ডেটা দেখানো হচ্ছে" : "Demo mode — sample data"}</div>}

        <main className={"main v-" + (onboarding ? "onboarding" : view?.kind || tab) + (!onboarding && ((!view && (tab === "matches" || tab === "leagues")) || view?.kind === "league" || view?.kind === "team" || view?.kind === "player" || view?.kind === "daily" || (!view && tab === "predict")) ? " wide" : " narrow")}>
        {onboarding ? (
          <Onboarding
            key={editing ? "edit" : "first"}
            initial={myTeams}
            comps={comps}
            needPhone={false}
            onDone={finishOnboarding}
            onCancel={editing ? () => setEditing(false) : skipOnboarding}
          />
        ) : view?.kind === "league" ? (
          <League key={view.code} code={view.code} comps={comps} preds={preds} onOpen={openMatch} />
        ) : view?.kind === "team" ? (
          <Team key={view.id} id={view.id} teamsById={teamsById} preds={preds} onOpen={openMatch} isFav={myTeams.fav.includes(view.id)} onToggleFav={toggleFav} />
        ) : view?.kind === "page" ? (
          <InfoPage key={view.id} id={view.id} user={user} goProfile={() => go("profile")} />
        ) : view?.kind === "daily" ? (
          <DailyPage user={user} goProfile={() => go("profile")} toast={toast} />
        ) : view?.kind === "quiz" ? (
          <QuizPage code={view.code} user={user} goProfile={() => go("profile")} toast={toast} />
        ) : view?.kind === "player" ? (
          <Player key={view.id} id={view.id} teamsById={teamsById} comps={comps} />
        ) : tab === "matches" ? (
          <Matches key={homeKey} user={user} myTeams={myTeams} comps={comps} preds={preds} onOpen={openMatch} goProfile={() => go("profile")} />
        ) : tab === "leagues" ? (
          <Leagues comps={comps} />
        ) : tab === "ask" ? (
          <AskPage teams={Object.values(teamsById)} preds={preds} onOpen={openMatch} chat={askChat} setChat={setAskChat} />
        ) : tab === "predict" ? (
          <Predict user={user} profile={profile} preds={preds} fav={myTeams.fav} onOpen={openMatch} goProfile={() => go("profile")} toast={toast} initialTab={predTab.tab} openLeagueId={predTab.league} reloadKey={predTab.key} />
        ) : (
          <Profile user={user} profile={profile} myTeams={myTeams} teamsById={teamsById} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} onEditTeams={() => { setEditing(true); window.scrollTo(0, 0); }} />
        )}
        </main>

        {/* ফুটার তথ্যের পাতাগুলোয়; গেম, কুইজ আর জিজ্ঞেস করুন-এ নয় (অ্যাপের মতো পরিষ্কার) */}
        {!onboarding && view?.kind !== "quiz" && view?.kind !== "daily" && !(!view && (tab === "ask" || tab === "predict")) && <Footer comps={comps} />}
      </div>

      {!onboarding && <Nav tab={tab} go={go} />}
      {searching && <SearchSheet comps={comps} teams={Object.values(teamsById)} onClose={closeSearch} />}
      {sheet && (
        <MatchSheet
          key={sheet.id}
          m={sheet} user={user} pred={preds[sheet.id]} toast={toast}
          onClose={closeMatch}
          onSave={onSavePrediction}
          onLogin={() => { setSheet(null); go("profile"); }}
        />
      )}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </FavCtx.Provider>
    </NavCtx.Provider>
    </LangCtx.Provider>
  );
}
