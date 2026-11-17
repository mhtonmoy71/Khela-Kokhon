// খেলা কখন? v2 — পুরো অ্যাপ এক ফাইলে
import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// ════════════════ স্টাইল ════════════════
const CSS = `
:root, [data-theme="dark"] {
  --bg: #0c1311; --card: #151f1c; --card2: #1c2925; --line: rgba(255,255,255,.07);
  --text: #eef5f2; --muted: #8ea39b; --green: #00e676; --greenDim: rgba(0,230,118,.12);
  --amber: #f59e0b; --red: #ff4d5e; --brand: #064e3b; --shadow: 0 8px 30px rgba(0,0,0,.35);
}
[data-theme="light"] {
  --bg: #eef2f1; --card: #ffffff; --card2: #f4f7f6; --line: rgba(0,0,0,.08);
  --text: #0e1a16; --muted: #5f726b; --green: #00875a; --greenDim: #e1f5ec;
  --amber: #c27803; --red: #d92d3c; --brand: #064e3b; --shadow: 0 8px 30px rgba(0,0,0,.08);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: var(--bg); color: var(--text); }
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
.btn { height: 44px; padding: 0 18px; border-radius: 12px; background: var(--green); color: #04130d; font-weight: 700; font-size: 15px;
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
.day.on .a, .day.on .b { color: #04130d; }
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
.ptbadge.p3 { background: var(--green); color: #04130d; }
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
.foot { text-align: center; padding: 30px 16px 24px; margin-top: 24px; border-top: 1px solid var(--line); }
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
.bubble { max-width: 92%; padding: 10px 13px; border-radius: 16px; font-size: 14.5px; line-height: 1.6; }
.bubble.me { align-self: flex-end; background: var(--green); color: #04130d; border-bottom-right-radius: 5px; }
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
.team-pos { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
.stat-row { display: grid; grid-template-columns: repeat(6, 1fr); padding: 12px 6px; text-align: center; }
.stat-row b { display: block; font-size: 16px; }
.stat-row span { font-size: 11px; color: var(--muted); }
.form-row { display: flex; gap: 8px; }
.badge.big { width: 38px; height: 38px; border-radius: 10px; font-size: 15px; }
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
.sq { display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto; column-gap: 10px; padding: 10px 14px; border-bottom: 1px solid var(--line); }
.sq:last-child { border-bottom: 0; }
.sq b { font-weight: 600; font-size: 14px; font-family: Inter, "Hind Siliguri", sans-serif; }
.sq .muted { grid-column: 1; font-size: 12px; }
.sq-age { grid-column: 2; grid-row: 1 / span 2; align-self: center; font-size: 13px; color: var(--muted); }
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

/* সরু দাগ ছাড়া, FotMob-এর মতো পরিষ্কার কার্ড */
.card { border: 0; }
.row, .comp-h, .follow-h { border-bottom: 0; }
.follow-h { padding: 14px 16px; }
.row { position: relative; }
.row.has-badge { padding-left: 50px; }
.row.has-badge .mid .st { display: none; }
.mid .st { white-space: nowrap; }
.rbadge { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 32px; padding: 3px 0; border-radius: 8px; background: var(--card2);
  color: var(--muted); font-size: 10.5px; font-weight: 700; text-align: center; line-height: 1.2; white-space: nowrap; overflow: hidden; }

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
/* মাঝখানের উঁচু গোল "জিজ্ঞেস করো" বাটন */
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
.ask-page .ask-input { position: sticky; bottom: calc(92px + env(safe-area-inset-bottom)); background: var(--bg); padding: 10px 0; border-top: 0; }
.toast { bottom: calc(100px + env(safe-area-inset-bottom)); }

/* ══════ ডেস্কটপ (১০২৪px বা তার বেশি চওড়া স্ক্রিন) ══════ */
.dnav { display: none; }
@media (min-width: 1024px) {
  .app { max-width: 1200px; padding: 0 24px 40px; }
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
  ask: ["জিজ্ঞেস করো", "Ask"],
  myTeamGames: ["তোমার দলের খেলা", "Your teams"],
  following: ["ফলো করা দল", "Following"],
  predict: ["প্রেডিকশন", "Predict"],
  profile: ["প্রোফাইল", "Profile"],
  nextMatch: ["পরের খেলা", "Next match"],
  yourTeams: ["তোমার দলের সামনের ম্যাচ", "Your teams — upcoming"],
  rivalWatch: ["রাইভালদের খবর", "Rival watch"],
  todayBig: ["আজকের খেলা", "Today's matches"],
  seeAll: ["সব দেখো", "See all"],
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
  yourPick: ["তোমার প্রেডিকশন", "Your prediction"],
  save: ["সেভ করো", "Save"],
  saved: ["সেভ হয়েছে", "Saved"],
  locked: ["কিকঅফের পর প্রেডিকশন বন্ধ", "Predictions close at kickoff"],
  loginToPredict: ["প্রেডিকশন দিতে লগইন করো", "Log in to predict"],
  myPredictions: ["আমার প্রেডিকশন", "My predictions"],
  leaderboard: ["লিডারবোর্ড", "Leaderboard"],
  rules: ["হুবহু স্কোর মিললে ৩ পয়েন্ট, শুধু ফল (জয়/ড্র/হার) মিললে ১ পয়েন্ট। পয়েন্ট বসে ম্যাচ শেষের পরের সিঙ্কে।", "Exact score = 3 pts, correct result = 1 pt. Points are added at the next sync after the match."],
  noPredictions: ["এখনো কোনো প্রেডিকশন দাওনি। যেকোনো ম্যাচে ট্যাপ করে শুরু করো।", "No predictions yet. Tap any match to start."],
  noLeaders: ["এখনো কারও পয়েন্ট হয়নি", "No points yet"],
  pts: ["পয়েন্ট", "pts"],
  pending: ["অপেক্ষায়", "Pending"],
  upcomingToPredict: ["প্রেডিকশন দাও", "Make your picks"],
  login: ["লগইন", "Log in"],
  signup: ["রেজিস্ট্রেশন", "Sign up"],
  logout: ["লগআউট", "Log out"],
  name: ["নাম", "Name"],
  email: ["ইমেইল", "Email"],
  phone: ["মোবাইল নম্বর", "Mobile number"],
  password: ["পাসওয়ার্ড", "Password"],
  google: ["Google দিয়ে চালিয়ে যাও", "Continue with Google"],
  or: ["অথবা", "or"],
  checkEmail: ["ইমেইলে একটা লিংক পাঠানো হয়েছে। সেটায় ক্লিক করে অ্যাকাউন্ট চালু করো।", "We emailed you a link. Click it to activate your account."],
  pickFav: ["প্রিয় দল বেছে নাও", "Pick your favourite teams"],
  pickFavSub: ["সর্বোচ্চ ৩টা — এদের খেলা ম্যাচ পাতার একদম উপরে দেখাবে", "Up to 3 — their matches show at the top of Matches"],
  pickRival: ["রাইভাল দল বেছে নাও", "Pick your rivals"],
  pickRivalSub: ["সর্বোচ্চ ৫টা — এদের ফলও নজরে রাখবে", "Up to 5 — keep an eye on them too"],
  phoneNeeded: ["তোমার মোবাইল নম্বর দাও", "Add your mobile number"],
  search: ["দল খোঁজো", "Search teams"],
  next: ["পরের ধাপ", "Next"],
  back: ["পেছনে", "Back"],
  done: ["শেষ", "Done"],
  skip: ["এখন না", "Skip"],
  myTeams: ["আমার দল", "My teams"],
  favs: ["প্রিয়", "Favourites"],
  rivals: ["রাইভাল", "Rivals"],
  edit: ["বদলাও", "Edit"],
  settings: ["সেটিংস", "Settings"],
  language: ["ভাষা", "Language"],
  theme: ["থিম", "Theme"],
  dark: ["ডার্ক", "Dark"],
  light: ["লাইট", "Light"],
  ctaTitle: ["তোমার দলের খেলা কখন?", "When does your team play?"],
  ctaBody: ["প্রিয় দল বেছে নাও — পরের খেলার সময় বাংলাদেশ সময়ে, কাউন্টডাউনসহ হোমেই দেখাবে।", "Pick your teams and their next match shows up right here, in Bangladesh time."],
  ctaBtn: ["শুরু করো", "Get started"],
  noUpcoming: ["সামনে কোনো ম্যাচের সূচি নেই", "No upcoming fixtures"],
  lastResult: ["শেষ ফল", "Last result"],
  next2: ["পরের ম্যাচ", "Next"],
  demo: ["ডেমো মোড — নমুনা ডেটা দেখানো হচ্ছে", "Demo mode — sample data"],
  error: ["কিছু একটা ঠিকমতো হয়নি", "Something went wrong"],
  loading: ["লোড হচ্ছে…", "Loading…"],
  matchday: ["ম্যাচডে", "Matchday"],
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
  { code: "FL1", name_en: "Ligue 1", name_bn: "লিগ আঁ", emblem: "https://crests.football-data.org/FL1.png", sort: 6 },
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

async function signUp({ name, email, phone, password }) {
  if (DEMO) return demoLogin({ id: "demo", email, user_metadata: { name, phone } });
  const data = ok(await sb.auth.signUp({ email, password, options: { data: { name, phone }, emailRedirectTo: window.location.origin } }));
  return { user: data.session ? data.user : null, needsConfirm: !data.session };
}

async function signIn({ email, password }) {
  if (DEMO) return demoLogin({ id: "demo", email, user_metadata: { name: email.split("@")[0] } });
  return ok(await sb.auth.signInWithPassword({ email, password }));
}

async function signInGoogle() {
  if (DEMO) return demoLogin({ id: "demo", email: "demo@gmail.com", user_metadata: { name: "ডেমো ইউজার" } });
  ok(await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } }));
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

async function getLeaderboard() {
  if (DEMO) return DEMO_LEADERS;
  return ok(await sb.rpc("get_leaderboard", { lim: 50 }));
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
    const l = { id: code, name, code, board: [{ display_name: "তুমি", points: 0, exact: 0, played: 0, is_me: true }, ...DEMO_LEADERS.slice(0, 3)] };
    ls.set("pleagues", [l, ...demoLeagues()]);
    return { id: l.id, code };
  }
  return (await rpc("create_pleague", { p_name: name }))[0];
}

async function joinLeague(code) {
  if (DEMO) { const l = demoLeagues().find((x) => x.code === code.toUpperCase()); if (!l) throw new Error("এই কোডের কোনো লিগ নেই"); return l; }
  return (await rpc("join_pleague", { p_code: code }))[0];
}

async function leagueBoard(id) {
  if (DEMO) return demoLeagues().find((x) => x.id === id)?.board || [];
  return rpc("pleague_board", { p_id: id });
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

async function getH2H(matchId, homeId, awayId) {
  if (DEMO) return {
    aggregates: { numberOfMatches: 5, totalGoals: 14, homeTeam: { id: homeId, wins: 2, draws: 1, losses: 2 }, awayTeam: { id: awayId, wins: 2, draws: 1, losses: 2 } },
    matches: [0, 1, 2, 3, 4].map((i) => ({ id: i, utcDate: `202${5 - (i >> 1)}-0${(i % 9) + 1}-12T19:00:00Z`, competition: { code: "PD" }, homeTeam: { id: i % 2 ? awayId : homeId }, awayTeam: { id: i % 2 ? homeId : awayId }, score: { home: i % 3, away: (i + 1) % 3 } })),
  };
  return extra({ type: "h2h", match: matchId });
}

// ════════════════ components.jsx ════════════════
// লিগ বা দলের পাতায় যাওয়ার জন্য (App থেকে আসে)
const NavCtx = createContext({ openLeague: () => {}, openTeam: () => {} });
// প্রিয় দলের id-গুলো — ম্যাচের সারিতে ★ দেখাতে
const FavCtx = createContext([]);
const useNav = () => useContext(NavCtx);

const teamName = (team, lang) =>
  !team ? (lang === "bn" ? "নির্ধারিত হয়নি" : "TBD") : lang === "bn" ? team.name_bn || team.short_en || team.name_en : team.short_en || team.name_en;
const compName = (c, lang) => (c ? (lang === "bn" ? c.name_bn : c.name_en) : "");

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

function CompIcon({ c, size = 18 }) {
  const [bad, setBad] = useState(false);
  if (!c?.emblem || bad) return null;
  return <img src={c.emblem} alt="" width={size} height={size} onError={() => setBad(true)} />;
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
        <span>{favs.includes(m.home_id) && <i className="fav-star">★</i>}{teamName(m.home, lang)}</span>
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
            🎯 {num(pred.home, lang)}-{num(pred.away, lang)}
            {pred.points != null && ` · +${num(pred.points, lang)}`}
          </span>
        )}
      </div>
      <div className={"side" + (aw ? " win" : "")}>
        <Crest team={m.away} />
        <span>{teamName(m.away, lang)}{favs.includes(m.away_id) && <i className="fav-star r">★</i>}</span>
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

async function shareMatch(m, lang, toast) {
  const text = shareText(m, lang);
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast?.(lang === "bn" ? "কপি হয়েছে — যেখানে খুশি পেস্ট করো" : "Copied"); } catch { /* ignore */ }
}

function Stepper({ v, set }) {
  return (
    <div className="stepper">
      <button onClick={() => set(Math.max(0, v - 1))} aria-label="-">−</button>
      <div className="v">{v}</div>
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
      <div className="sec-h"><h2>{bn ? "মুখোমুখি" : "Head to head"}</h2></div>
      {state === "idle" && <button className="btn ghost block" onClick={load}>{bn ? "আগের লড়াইগুলো দেখো" : "Show previous meetings"}</button>}
      {state === "loading" && <div className="card"><div className="spin" /></div>}
      {state === "error" && <div className="card empty">{bn ? "এখন তথ্যটা পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করো।" : "Not available right now."}</div>}
      {state === "done" && (
        <div className="card">
          {homeAg && awayAg && (
            <div className="h2h-agg">
              <div><b>{num(homeAg.wins, lang)}</b><span>{teamName(m.home, lang)}</span></div>
              <div><b>{num(homeAg.draws, lang)}</b><span>{bn ? `ড্র (শেষ ${num(all.length, lang)} লড়াই)` : `Draws (last ${all.length})`}</span></div>
              <div><b>{num(awayAg.wins, lang)}</b><span>{teamName(m.away, lang)}</span></div>
            </div>
          )}
          {past.length ? past.map((x) => (
            <div className="h2h-row" key={x.id}>
              <span className="muted">{dayLabel(dayKey(x.utcDate), lang, { short: true, abs: true })} {new Date(x.utcDate).getUTCFullYear() !== new Date().getUTCFullYear() ? num(new Date(x.utcDate).getUTCFullYear(), lang) : ""}</span>
              <span className="h2h-score">{name(x.homeTeam)} <b>{num(x.score.home, lang)}-{num(x.score.away, lang)}</b> {name(x.awayTeam)}</span>
            </div>
          )) : <div className="empty">{bn ? "আগে কোনো লড়াইয়ের তথ্য নেই" : "No previous meetings"}</div>}
        </div>
      )}
    </div>
  );
}

// ── ম্যাচের বিস্তারিত (নিচ থেকে ওঠা শিট) ──
function MatchSheet({ m, user, pred, onClose, onSave, onLogin, toast }) {
  const { t, lang } = useT();
  const nav = useNav();
  const now = useNow(1000 * 20);
  const [h, setH] = useState(pred?.home ?? 1);
  const [a, setA] = useState(pred?.away ?? 1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [making, setMaking] = useState(false);
  const open = canPredict(m);
  const showScore = (isLive(m) || isDone(m)) && m.home_score != null;

  async function save() {
    setBusy(true); setErr("");
    try { await onSave(m, h, a); toast(t("saved")); onClose(); }
    catch (e) { setErr(e?.message || t("error")); }
    setBusy(false);
  }

  return (
    <div className="veil" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="hero" style={{ boxShadow: "none" }}>
          <button className="hero-top" onClick={() => m.competition && nav.openLeague(m.competition.code)}><CompIcon c={m.competition} size={16} />{compName(m.competition, lang)}
            {m.matchday ? <> · {t("matchday")} {num(m.matchday, lang)}</> : null} ›</button>
          <div className="hero-teams">
            <button className="hero-team" onClick={() => m.home_id && nav.openTeam(m.home_id)}><Crest team={m.home} size={56} />{teamName(m.home, lang)}</button>
            <div className="hero-vs">
              {showScore ? <div style={{ fontFamily: "Inter", fontSize: 30, fontWeight: 800, opacity: 1 }}>{num(m.home_score, lang)} - {num(m.away_score, lang)}</div> : t("vs")}
              <div style={{ fontSize: 12, marginTop: 4 }}><StatusText m={m} /></div>
            </div>
            <button className="hero-team" onClick={() => m.away_id && nav.openTeam(m.away_id)}><Crest team={m.away} size={56} />{teamName(m.away, lang)}</button>
          </div>
          <div className="hero-time">
            <div className="big">{timeLabel(m.utc_date, lang)}</div>
            <div className="when">{dayLabel(dayKey(m.utc_date), lang)} · {t("bdTime")}</div>
          </div>
          {open && (
            <div className="cd"><span>{t("startsIn")} <b>{countdown(new Date(m.utc_date) - now, lang)}</b></span></div>
          )}
        </div>

        <div className="sec" style={{ margin: "16px 0 0" }}>
          <div className="sec-h"><h2>{t("yourPick")}</h2>
            {pred?.points != null && <span className={"ptbadge p" + pred.points}>+{num(pred.points, lang)} {t("pts")}</span>}</div>
          {!user ? (
            <button className="btn ghost block" onClick={onLogin}>{t("loginToPredict")}</button>
          ) : open ? (
            <div className="card">
              <div className="pred-box">
                <Stepper v={h} set={setH} />
                <div className="dash">–</div>
                <Stepper v={a} set={setA} />
              </div>
              <div style={{ padding: "0 12px 12px" }}>
                {err && <div className="err">{err}</div>}
                <button className="btn block" disabled={busy} onClick={save}>{busy ? "…" : t("save")}</button>
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

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn block" style={{ flex: 1 }} disabled={making} onClick={async () => {
            setMaking(true);
            try { await shareCard(m, { lang, teamName: (tm) => teamName(tm, lang), compName: compName(m.competition, lang) }, toast); }
            catch { toast(lang === "bn" ? "ছবি বানানো গেল না" : "Couldn't make the image"); }
            setMaking(false);
          }}>
            🖼️ {making ? "…" : lang === "bn" ? "ছবি শেয়ার" : "Share image"}
          </button>
          <button className="btn ghost" style={{ flex: 1 }} onClick={() => shareMatch(m, lang, toast)}>
            <ShareIcon /> {lang === "bn" ? "লেখা শেয়ার" : "Share text"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ফুটার (v1-এর মতো) ──
function Footer() {
  const { lang } = useT();
  return (
    <footer className="foot">
      <div className="foot-made">Crafted with <span style={{ color: "#e53935" }}>❤️</span> by Mahbub Hasan Tonmoy</div>
      <div className="foot-links">
        <a href="mailto:khelakokhon@gmail.com" style={{ color: "var(--green)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,6 12,13 2,6" /></svg>
          khelakokhon@gmail.com
        </a>
        <a href="https://www.facebook.com/khelakokhon" target="_blank" rel="noopener noreferrer" style={{ color: "#1877f2" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#1877f2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
          khelakokhon
        </a>
      </div>
      <div className="foot-copy">{lang === "bn" ? "© ২০২৬ খেলা কখন? সকল স্বত্ব সংরক্ষিত।" : "© 2026 Khela Kokhon? All rights reserved."}</div>
    </footer>
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
const SunIcon = I(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
const MoonIcon = I(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />);

// ════════════════ pages/Home.jsx ════════════════
// ── খেলা কখন? কী / কীভাবে কাজ করে / ডেভেলপার ──
const DEV_PHOTO = "data:image/jpeg;base64,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";
const ABOUT = {
  bn: {
    whatH: "খেলা কখন? কী",
    what: "ইউরোপের বড় পাঁচ লিগ আর চ্যাম্পিয়ন্স লিগের সূচি, বাংলাদেশ সময়ে। রাত একটার খেলা, নাকি ভোর চারটার—আলাদা করে হিসাব কষতে হয় না। প্রিয় দল বেছে নিলে তাদের খেলা ম্যাচ পাতার একদম উপরে দেখা যায় কাউন্টডাউনসহ।",
    facts: [["৬", "প্রতিযোগিতা"], ["১১১", "দল"], ["প্রতিদিন", "হালনাগাদ"]],
    howH: "কীভাবে কাজ করে",
    steps: [
      ["রেজিস্ট্রেশন", "ইমেইল আর মোবাইল নম্বর দিয়ে, অথবা Google দিয়ে।"],
      ["দল বাছাই", "সর্বোচ্চ তিনটা প্রিয় দল।"],
      ["প্রেডিকশন", "কিকঅফের আগ পর্যন্ত যেকোনো ম্যাচের স্কোর অনুমান করো।"],
      ["পয়েন্ট", "হুবহু স্কোরে ৩, শুধু ফল মিললে ১। জায়গা করে নাও লিডারবোর্ডে।"],
    ],
    devH: "এবাউট দ্য ডেভেলপার",
    devName: "মাহবুব হাসান তন্ময়",
    devRole: "প্রতিষ্ঠাতা ও ডেভেলপার",
    dev: "ক্রীড়া লেখক। খেলা৭১-এ সাব-এডিটর হিসেবে কাজ করেছেন, বাংলা ও ইংরেজিতে লিখেছেন ১,৭০০-র বেশি ক্রীড়া প্রতিবেদন। গোপালগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয় থেকে বিবিএ শেষ করে এখন একটি বেসরকারি ব্যাংকে কর্মরত। আগ্রহের জায়গা খেলার ইতিহাস। প্রোগ্রামিংয়ে প্রাতিষ্ঠানিক পড়াশোনা নেই; নিজে শিখে বানিয়েছেন খেলা কখন?।",
    cta: "শুরু করো",
  },
  en: {
    whatH: "What is Khela Kokhon?",
    what: "Fixtures for Europe's top five leagues and the Champions League, in Bangladesh time. No more working out whether a match is at 1 AM or 4 AM. Pick your teams and their matches sit at the top of the Matches page with a countdown.",
    facts: [["6", "competitions"], ["111", "teams"], ["Daily", "updates"]],
    howH: "How it works",
    steps: [
      ["Sign up", "With email and mobile number, or with Google."],
      ["Pick teams", "Up to three favourites."],
      ["Predict", "Guess the score of any match until kickoff."],
      ["Score points", "3 for the exact score, 1 for the right result. Climb the leaderboard."],
    ],
    devH: "About the Developer",
    devName: "Mahbub Hasan Tonmoy",
    devRole: "Founder & developer",
    dev: "Sports writer. Former sub-editor at Khela71, with more than 1,700 sports articles in Bangla and English. Holds a BBA from Gopalganj Science and Technology University and now works at a private bank. Has a keen interest in sports history. No formal training in programming; self-taught, he built Khela Kokhon himself.",
    cta: "Get started",
  },
};

function About({ goProfile, user }) {
  const { lang } = useT();
  const A = ABOUT[lang === "bn" ? "bn" : "en"];
  const [more, setMore] = useState(false);
  return (
    <div className="sec about-wrap">
      <div className="about-blk">
        <h3>{A.whatH}</h3>
        <p>{A.what}</p>
      </div>

      <div className="about-blk">
        <h3>{A.howH}</h3>
        <div className="steps">
          {A.steps.map(([h, d], i) => (
            <div key={h}><span className="step-n">{num(i + 1, lang)}</span><b>{h}</b><p>{d}</p></div>
          ))}
        </div>
        {!user && <button className="link" style={{ marginTop: 10 }} onClick={goProfile}>{A.cta} →</button>}
      </div>

      <div className="about-blk">
        <h3>{A.devH}</h3>
        <div className="dev-mini">
          <img className="dev-photo" src={DEV_PHOTO} alt={A.devName} width="52" height="52" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b>{A.devName}</b>
            <div className="muted" style={{ fontSize: 12.5 }}>{A.devRole}</div>
          </div>
          <div className="dev-links">
            <a href="mailto:khelakokhon@gmail.com" aria-label="Email" title="khelakokhon@gmail.com">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><polyline points="22,6 12,13 2,6" /></svg>
            </a>
            <a href="https://www.facebook.com/mahbub.tonmoy.71/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook" className="fb">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
            </a>
          </div>
        </div>
        <p className={more ? "" : "clamp"}>{A.dev}</p>
        {!more && <button className="link" onClick={() => setMore(true)}>{lang === "bn" ? "আরও পড়ো" : "Read more"}</button>}
      </div>
    </div>
  );
}

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

function Matches({ user, myTeams, comps, preds, onOpen, goProfile }) {
  const { t, lang } = useT();
  const [day, setDay] = useState(dayKey(new Date()));
  const [comp, setComp] = useState("ALL");
  const nav = useNav();
  const fav = myTeams?.fav || [];
  const [mine, setMine] = useState(null);

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
    <>
      {fav.length === 0 && (
        <div className="sec">
          <button className="slim" onClick={goProfile}>
            <span className="slim-star">★</span>
            <span>{lang === "bn" ? "প্রিয় দল বেছে নাও, তাদের পরের খেলা এখানে সবার উপরে দেখাবে" : "Pick your teams to see their next match here"}</span>
            <span className="muted">›</span>
          </button>
        </div>
      )}
      {fav.length > 0 && mine?.length > 0 && (
        <div className="sec">
          <Following list={mine} preds={preds} onOpen={onOpen} />
        </div>
      )}

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
          {comp !== "ALL" && <button className="link" onClick={() => nav.openLeague(comp)}>{lang === "bn" ? "টেবিল দেখো" : "Table"} →</button>}
        </div>
        <DayMatches day={day} setDay={setDay} comp={comp} preds={preds} onOpen={onOpen} />
      </div>

      <About goProfile={goProfile} user={user} />
    </>
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
    ? `⚽ "${l.name}" প্রেডিকশন লিগে যোগ দাও — খেলা কখন?-এ\n\nলিংক: ${link}\nকোড: ${l.code}`
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
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => { leagueBoard(league.id).then(setRows).catch((e) => { setErr(e.message); setRows([]); }); }, [league.id]);

  async function leave() {
    if (!window.confirm(bn ? `"${league.name}" লিগ ছেড়ে দেবে?` : `Leave "${league.name}"?`)) return;
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
      <button className="btn block" style={{ margin: "12px 0" }} onClick={() => shareInvite(league, bn, toast)}>{bn ? "বন্ধুদের আমন্ত্রণ পাঠাও" : "Invite friends"}</button>
      {err && <div className="err">{err}</div>}
      {rows === null ? <div className="card"><div className="spin" /></div> : (
        <div className="card">
          {rows.map((r, i) => (
            <div className="lb" key={i} style={r.is_me ? { background: "var(--greenDim)" } : null}>
              <div className={"rk" + (i < 3 ? " top" : "")}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : num(i + 1, lang)}</div>
              <div>
                <div style={{ fontWeight: 600 }}>{r.display_name}{r.is_me ? (bn ? " (তুমি)" : " (you)") : ""}</div>
                <div className="sub">{bn ? `${num(r.played, lang)} ম্যাচ · হুবহু ${num(r.exact, lang)}` : `${r.played} played · ${r.exact} exact`}</div>
              </div>
              <div className="pt">{num(r.points, lang)} <span className="sub">{bn ? "পয়েন্ট" : "pts"}</span></div>
            </div>
          ))}
        </div>
      )}
      <button className="link" style={{ color: "var(--red)", marginTop: 14 }} onClick={leave}>{bn ? "লিগ ছেড়ে দাও" : "Leave league"}</button>
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
      <div style={{ marginBottom: 12 }}>{bn ? "বন্ধুদের লিগে খেলতে আগে লগইন করো" : "Log in to play in friends' leagues"}</div>
      <button className="btn" onClick={goProfile}>{bn ? "লগইন" : "Log in"}</button>
    </div>
  );

  if (open) return <Board league={open} user={user} toast={toast} onBack={() => setOpen(null)} onLeft={() => { setOpen(null); load(); }} />;

  async function create(e) {
    e.preventDefault(); setErr("");
    if (name.trim().length < 2) return setErr(bn ? "লিগের একটা নাম দাও" : "Give the league a name");
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
    if (code.trim().length !== 6) return setErr(bn ? "৬ অক্ষরের কোড দাও" : "Enter the 6-letter code");
    setBusy(true);
    try {
      const r = await joinLeague(code.trim());
      setCode("");
      toast(bn ? `"${r.name}" লিগে যোগ দিয়েছ` : `Joined "${r.name}"`);
      const fresh = await myLeagues();
      setList(fresh);
      setOpen(fresh.find((x) => x.id === r.id) || null);
    } catch (e2) { setErr(e2.message || "…"); }
    setBusy(false);
  }

  return (
    <>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>
        {bn ? "অফিস, বন্ধু বা পরিবারের জন্য নিজের লিগ খোলো। সবাই যার যার মতো প্রেডিকশন দেবে, আর লিগের আলাদা লিডারবোর্ডে দেখা যাবে কে এগিয়ে।"
            : "Start a league for your office, friends or family. Everyone predicts as usual; the league has its own leaderboard."}
      </p>
      {list === null ? <div className="card"><div className="spin" /></div> : list.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          {list.map((l) => (
            <button key={l.id} className="fl-row" onClick={() => setOpen(l)}>
              <div className="fl-icon">{l.name.slice(0, 1)}</div>
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <div style={{ fontWeight: 700 }}>{l.name}</div>
                <div className="muted" style={{ fontSize: 12.5 }}>{num(l.members, lang)} {bn ? "জন" : "members"} · {bn ? "কোড" : "code"} {l.code}{l.is_owner ? (bn ? " · তুমি খুলেছ" : " · yours") : ""}</div>
              </div>
              <span className="muted">›</span>
            </button>
          ))}
        </div>
      )}
      {err && <div className="err">{err}</div>}
      <div className="card" style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{bn ? "নতুন লিগ খোলো" : "Start a league"}</div>
        <form className="inline-form" onSubmit={create}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={bn ? "যেমন: অফিস লিগ" : "e.g. Office league"} />
          <button className="btn" disabled={busy}>{bn ? "খোলো" : "Start"}</button>
        </form>
      </div>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{bn ? "কোড দিয়ে যোগ দাও" : "Join with a code"}</div>
        <form className="inline-form" onSubmit={join}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" style={{ letterSpacing: 3, fontFamily: "Inter, sans-serif", fontWeight: 700 }} />
          <button className="btn" disabled={busy}>{bn ? "যোগ দাও" : "Join"}</button>
        </form>
      </div>
    </>
  );
}

// ════════════════ pages/Predict.jsx ════════════════
function Leaderboard({ me }) {
  const { t, lang } = useT();
  const [rows, setRows] = useState(null);
  useEffect(() => { getLeaderboard().then(setRows).catch(() => setRows([])); }, []);
  if (rows === null) return <div className="card"><div className="spin" /></div>;
  if (!rows.length) return <div className="card empty">{t("noLeaders")}</div>;
  return (
    <div className="card">
      {rows.map((r, i) => (
        <div className="lb" key={i} style={me && r.display_name === me ? { background: "var(--greenDim)" } : null}>
          <div className={"rk" + (i < 3 ? " top" : "")}>{i < 3 ? ["🥇", "🥈", "🥉"][i] : num(i + 1, lang)}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{r.display_name}</div>
            <div className="sub">
              {lang === "bn" ? `${num(r.played, lang)} ম্যাচ · হুবহু ${num(r.exact, lang)}` : `${r.played} played · ${r.exact} exact`}
            </div>
          </div>
          <div className="pt">{num(r.points, lang)} <span className="sub">{t("pts")}</span></div>
        </div>
      ))}
    </div>
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
  useEffect(() => { setTab(initialTab); }, [initialTab, reloadKey]);
  return (
    <div className="sec">
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
    const list = (teams || []).filter((tm) => !s || [tm.name_bn, tm.name_en, tm.short_en, tm.tla].some((x) => x?.toLowerCase().includes(s)));
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
        <h2 style={{ fontSize: 20, marginBottom: 14 }}>{t("phoneNeeded")}</h2>
        <label className="field"><span>{t("phone")}</span>
          <input inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <button className="btn block" disabled={!valid} onClick={() => setStep("fav")}>{t("next")}</button>
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
      if (!f.name.trim()) return setErr("নাম দাও");
      if (!/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ""))) return setErr("সঠিক মোবাইল নম্বর দাও (01XXXXXXXXX)");
      if (f.password.length < 6) return setErr("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const r = await signUp({ ...f, name: f.name.trim(), phone: f.phone.replace(/[\s-]/g, "") });
        if (r.needsConfirm) setNote(t("checkEmail"));
      } else await signIn(f);
    } catch (e2) {
      const m = e2?.message || "";
      setErr(/invalid login/i.test(m) ? "ইমেইল বা পাসওয়ার্ড ভুল" : /registered/i.test(m) ? "এই ইমেইলে আগেই অ্যাকাউন্ট আছে — লগইন করো" : /confirm/i.test(m) ? "আগে ইমেইলের লিংকে ক্লিক করে অ্যাকাউন্ট চালু করো" : m || t("error"));
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
        {mode === "signup" && (
          <label className="field"><span>{t("phone")}</span><input inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={up("phone")} autoComplete="tel" /></label>
        )}
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
              {profile?.phone && <div className="muted" style={{ fontSize: 13 }}>{profile.phone}</div>}
            </div>
          </div>
        </div>
      </div>
      <div className="sec">
        <div className="sec-h"><h2>{t("myTeams")}</h2><button className="link" onClick={onEditTeams}>{t("edit")}</button></div>
        <div className="card" style={{ paddingTop: 12 }}>
          <div className="muted" style={{ fontSize: 12.5, padding: "0 16px 6px" }}>★ {t("favs")}</div>
          <div className="team-chips">{myTeams.fav.length ? chips(myTeams.fav) : <span className="muted" style={{ fontSize: 13 }}>—</span>}</div>
        </div>
      </div>
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
    for (const w of new Set([t.name_bn, t.name_en, t.short_en].filter(Boolean).flatMap((x) => norm(x).split(" "))))
      if (w.length >= 3 && !/^\d+$/.test(w)) (wordOwners[w] ||= new Set()).add(t.id);
  const aliases = [];
  for (const t of teams) {
    const words = Object.entries(wordOwners).filter(([, ids]) => ids.size === 1 && ids.has(t.id)).map(([w]) => w);
    const list = new Set([t.name_bn, t.name_en, t.short_en, ...(NICK[t.id] || [])].filter(Boolean).map(norm).concat(words));
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
    if (!found.includes(id)) found.push(id);
  }
  return found;
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

const poss = (name, lang) => (lang !== "bn" ? `${name}'s` : /[\u09BE-\u09CC]$/.test(name) ? name + "র" : name + "ের");

// উত্তর বানানো: { text, matches }
async function answer(raw, teams, lang) {
  const q = norm(raw);
  const bn = lang === "bn";
  if (!q) return null;
  const ids = findTeams(q, teams);
  const byId = Object.fromEntries(teams.map((t) => [t.id, t]));
  const nm = (id) => teamName(byId[id], lang);
  const wantLast = has(q, W.last) && !has(q, ["পরের", "নেক্সট", "next", "upcoming", "সামনে"]);
  const comp = findComp(q);

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
    if (!list.length) return { text: bn ? `${label} ${comp ? "এই প্রতিযোগিতার " : ""}কোনো খেলা নেই।` : `${label}: no matches.`, matches: [] };
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
      ? "প্রশ্নটা ধরতে পারিনি। দলের নাম দিয়ে জিজ্ঞেস করো, যেমন: “রিয়ালের পরের খেলা কবে”, “বার্সার শেষ ম্যাচের ফল”, “আজ কী খেলা”, “লিভারপুল বনাম ম্যানইউ কবে”।"
      : "I couldn't follow that. Try a team name, e.g. “Real Madrid next match”, “Barça last result”, “today's matches”, “Liverpool vs Man United”.",
    matches: [],
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
  bn: ["রিয়ালের পরের খেলা কবে", "বার্সার শেষ ম্যাচের ফল", "আজ কী খেলা", "লিভারপুল বনাম ম্যানইউ কবে", "চ্যাম্পিয়ন্স লিগ"],
  en: ["Real Madrid next match", "Barça last result", "Today's matches", "Liverpool vs Man United", "Champions League"],
};

// ── জিজ্ঞেস করো: আলাদা পাতা (/ask) ──
function AskPage({ teams, preds, onOpen, chat, setChat }) {
  const { lang } = useT();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { if (chat.length || busy) endRef.current?.scrollIntoView({ block: "end" }); }, [chat, busy]);

  async function ask(text) {
    const t = text.trim();
    if (!t || busy) return;
    setQ(""); setBusy(true);
    setChat((c) => [...c, { me: t }]);
    try {
      const a = await answer(t, teams, lang);
      setChat((c) => [...c, a || { text: "…", matches: [] }]);
    } catch {
      setChat((c) => [...c, { text: lang === "bn" ? "দুঃখিত, এখন উত্তর আনা যাচ্ছে না। একটু পরে চেষ্টা করো।" : "Sorry, couldn't fetch that right now.", matches: [] }]);
    }
    setBusy(false);
  }

  return (
    <div className="ask-page">
        <div className="ask-head"><span className="ask-orb sm"><SparkIcon /></span>{lang === "bn" ? "খেলা কখন? জিজ্ঞেস করো" : "Ask Khela Kokhon"}</div>
        <div className="ask-body">
          {chat.length === 0 && (
            <>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>
                {lang === "bn" ? "দলের নাম লিখে জিজ্ঞেস করো, সূচি দেখে বাংলাদেশ সময়ে বলে দেব।" : "Ask about any team and get the answer in Bangladesh time."}
              </p>
              <div className="ask-ex">
                {EXAMPLES[lang === "bn" ? "bn" : "en"].map((e) => <button key={e} className="chip" onClick={() => ask(e)}>{e}</button>)}
              </div>
            </>
          )}
          {chat.map((m, i) => m.me ? (
            <div key={i} className="bubble me">{m.me}</div>
          ) : (
            <div key={i} className="bubble bot">
              <div>{m.text}</div>
              {m.matches?.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  {m.matches.slice(0, 8).map((x) => <MatchRow key={x.id} m={x} pred={preds[x.id]} onOpen={onOpen} />)}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="bubble bot muted">…</div>}
          <div ref={endRef} />
        </div>
        <form className="ask-input" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "bn" ? "যেমন: রিয়ালের পরের খেলা কবে" : "e.g. Real Madrid next match"} />
          <button className="btn" disabled={!q.trim() || busy}>{lang === "bn" ? "পাঠাও" : "Send"}</button>
        </form>
    </div>
  );
}

// ════════════════ pages/League.jsx ════════════════
const ord = (n, lang) => {
  if (lang !== "bn") return n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th");
  const special = { 1: "১ম", 2: "২য়", 3: "৩য়", 4: "৪র্থ", 6: "৬ষ্ঠ" };
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
function League({ code, comps, preds, onOpen }) {
  const { lang } = useT();
  const nav = useNav();
  const c = comps.find((x) => x.code === code) || { code, name_bn: code, name_en: code };
  const [tab, setTab] = useState("table");
  const [table, setTable] = useState(null);
  const [scorers, setScorers] = useState(null);
  const [games, setGames] = useState(null);
  const bn = lang === "bn";

  useEffect(() => { setTable(null); getStandings(code).then(setTable).catch(() => setTable([])); }, [code]);
  useEffect(() => {
    if (tab === "scorers" && scorers === null) getScorers(code).then(setScorers).catch(() => setScorers([]));
    if (tab === "matches" && games === null)
      Promise.all([getCompUpcoming(code, 10), getCompRecent(code, 10)]).then(([up, past]) => setGames({ up, past })).catch(() => setGames({ up: [], past: [] }));
  }, [tab, code]);

  const notYet = bn ? "এখনো আসেনি। প্রতিদিন সকালে হালনাগাদ হয়।" : "Not available yet. Updated every morning.";

  return (
    <>
      <div className="page-head">
        <button className="back" onClick={() => window.history.back()} aria-label="back">←</button>
        <CompIcon c={c} size={34} />
        <h1>{compName(c, lang)}</h1>
      </div>
      <div className="sec" style={{ marginTop: 10 }}>
        <div className="seg seg3">
          {[["table", bn ? "টেবিল" : "Table"], ["matches", bn ? "ম্যাচ" : "Matches"], ["scorers", bn ? "গোলদাতা" : "Scorers"]].map(([k, l]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      {tab === "table" && (
        <div className="sec">
          {table === null ? <Loading /> : !table.length ? <div className="card empty">{bn ? "টেবিল " : "Table "}{notYet}</div> : (
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
          )}
        </div>
      )}

      {tab === "matches" && (
        <div className="sec">
          {games === null ? <Loading /> : (
            <>
              <div className="sec-h"><h2>{bn ? "সামনের খেলা" : "Upcoming"}</h2></div>
              {games.up.length ? <div className="card"><DatedRows list={games.up} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "সামনে কোনো খেলা নেই" : "No upcoming matches"}</div>}
              <div className="sec-h" style={{ marginTop: 16 }}><h2>{bn ? "সাম্প্রতিক ফল" : "Recent results"}</h2></div>
              {games.past.length ? <div className="card"><DatedRows list={games.past} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "কোনো ফল নেই" : "No results"}</div>}
            </>
          )}
        </div>
      )}

      {tab === "scorers" && (
        <div className="sec">
          {scorers === null ? <Loading /> : !scorers.length ? <div className="card empty">{bn ? "গোলদাতার তালিকা " : "Scorers "}{notYet}</div> : (
            <div className="card">
              <div className="scr scr-h"><span>#</span><span>{bn ? "খেলোয়াড়" : "Player"}</span><span>{bn ? "অ্যাসিস্ট" : "Ast"}</span><span>{bn ? "গোল" : "Goals"}</span></div>
              {scorers.map((s, i) => (
                <div className="scr" key={s.player_id}>
                  <span className="pos">{num(i + 1, lang)}</span>
                  <span className="pl">
                    <b>{s.player_name}</b>
                    <button className="pl-team" onClick={() => s.team_id && nav.openTeam(s.team_id)}><Crest team={s.team} size={14} />{teamName(s.team, lang)}</button>
                  </span>
                  <span className="muted">{num(s.assists ?? 0, lang)}</span>
                  <span className="pts">{num(s.goals, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ═════════ দলের পাতা ═════════
const RES = { W: ["জ", "W"], D: ["ড", "D"], L: ["হ", "L"] };

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

function Squad({ info, lang }) {
  const bn = lang === "bn";
  if (info === null) return <div className="card"><div className="spin" /></div>;
  if (info === false || !info.squad?.length) return <div className="card empty">{bn ? "খেলোয়াড় তালিকা এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করো।" : "Squad isn't available right now. Try again later."}</div>;
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
              <div className="sq" key={p.id}>
                <b>{p.name}</b>
                <span className="muted">{[p.position, p.nationality].filter(Boolean).join(" · ")}</span>
                <span className="sq-age">{age(p.dateOfBirth) != null ? `${num(age(p.dateOfBirth), lang)} ${bn ? "বছর" : "y"}` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function Team({ id, teamsById, preds, onOpen }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  const [pos, setPos] = useState(null);
  const [up, setUp] = useState(null);
  const [past, setPast] = useState(null);
  const [tab, setTab] = useState("overview");
  const [info, setInfo] = useState(null);
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
      <div className="team-hero">
        <Crest team={team} size={84} />
        <h1>{teamName(team, lang)}</h1>
        {team && bn && <div className="muted" style={{ fontSize: 13 }}>{team.name_en}</div>}
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

      <div className="sec" style={{ marginTop: 14 }}>
        <div className="seg">
          <button className={tab === "overview" ? "on" : ""} onClick={() => setTab("overview")}>{bn ? "ওভারভিউ" : "Overview"}</button>
          <button className={tab === "squad" ? "on" : ""} onClick={() => setTab("squad")}>{bn ? "খেলোয়াড়" : "Squad"}</button>
        </div>
      </div>

      {tab === "squad" ? <div className="sec"><Squad info={info} lang={lang} /></div> : (<>
      {main && (
        <div className="sec">
          <div className="card stat-row">
            {[[bn ? "খেলা" : "Played", main.played], [bn ? "জয়" : "Won", main.won], [bn ? "ড্র" : "Drawn", main.draw], [bn ? "হার" : "Lost", main.lost], [bn ? "গোল" : "Goals", `${num(main.gf, lang)}-${num(main.ga, lang)}`], [bn ? "পয়েন্ট" : "Points", main.points]].map(([l, v]) => (
              <div key={l}><b>{typeof v === "number" ? num(v, lang) : v}</b><span>{l}</span></div>
            ))}
          </div>
        </div>
      )}

      {form.length > 0 && (
        <div className="sec">
          <div className="sec-h"><h2>{bn ? "শেষ পাঁচ ম্যাচের ফর্ম" : "Form (last 5)"}</h2></div>
          <div className="form-row">
            {form.map((m) => { const r = res(m); return <button key={m.id} className={"badge big " + r} onClick={() => onOpen(m)}>{RES[r][bn ? 0 : 1]}</button>; })}
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
      {info && (info.venue || info.founded) && (
        <div className="sec">
          <div className="card">
            {info.venue && <div className="info-row"><span className="muted">{bn ? "মাঠ" : "Stadium"}</span><b>{info.venue}</b></div>}
            {info.founded && <div className="info-row"><span className="muted">{bn ? "প্রতিষ্ঠা" : "Founded"}</span><b>{num(info.founded, lang)}</b></div>}
            {info.coach && <div className="info-row"><span className="muted">{bn ? "কোচ" : "Coach"}</span><b>{info.coach.name}</b></div>}
          </div>
        </div>
      )}
      </>)}
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
const viewFromPath = () => {
  const [, kind, id] = window.location.pathname.split("/");
  if (kind === "league" && id) return { kind: "league", code: id.toUpperCase() };
  if (kind === "team" && /^\d+$/.test(id || "")) return { kind: "team", id: +id };
  return null;
};
const stored = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

// ডেস্কটপে হেডারের ভেতরে একই ট্যাবগুলো
function DeskNav({ tab, go }) {
  const { t } = useT();
  return (
    <nav className="dnav">
      {TABS.map(({ id, Icon }) => (
        <button key={id} className={tab === id ? "on" : ""} onClick={() => go(id)}>
          <Icon />{t(id)}
        </button>
      ))}
    </nav>
  );
}

function Nav({ tab, go }) {
  const { t } = useT();
  return (
    <nav className="nav">
      <div className="nav-in">
        {TABS.map(({ id, Icon, center }) => center ? (
          <button key={id} className={"nav-ask" + (tab === id ? " on" : "")} onClick={() => go(id)}>
            <span className="ask-orb"><Icon /></span>{t(id)}
          </button>
        ) : (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => go(id)}>
            <Icon />{t(id)}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  const [lang, setLangS] = useState(() => stored("kk_lang", "bn"));
  const [theme, setThemeS] = useState(() => stored("kk_theme", "dark"));
  const [tab, setTab] = useState(tabFromPath);
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

  const toast = useCallback((m) => { setToastMsg(m); setTimeout(() => setToastMsg(""), 2200); }, []);

  // ── ট্যাব আর ফোনের ব্যাক বাটন ──
  const go = (id) => {
    const p = TABS.find((x) => x.id === id).path;
    if (window.location.pathname !== p) window.history.pushState({}, "", p);
    setTab(id); setView(null); setEditing(false); window.scrollTo(0, 0);
  };
  useEffect(() => {
    const onPop = () => { setSheet(null); setView(viewFromPath()); if (!viewFromPath()) setTab(tabFromPath()); window.scrollTo(0, 0); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // লিগ/দলের পাতা খোলা (ম্যাচের শিট খোলা থাকলে সেটা বন্ধ করে)
  const openView = (path, v) => {
    if (window.history.state?.sheet) window.history.replaceState({}, "", path);
    else window.history.pushState({}, "", path);
    setSheet(null); setEditing(false); setView(v); window.scrollTo(0, 0);
  };
  const nav = {
    openLeague: (code) => openView(`/league/${code}`, { kind: "league", code }),
    openTeam: (id) => openView(`/team/${id}`, { kind: "team", id }),
  };

  const openMatch = (m) => { window.history.pushState({ sheet: 1 }, ""); setSheet(m); };
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
    if (m) { store("kk_join", m[1].toUpperCase()); window.history.replaceState({}, "", "/predict"); setTab("predict"); }
  }, []);
  useEffect(() => {
    let code = null;
    try { code = localStorage.getItem("kk_join"); } catch { /* ignore */ }
    if (!code) return;
    if (!user) { setTab("profile"); window.history.replaceState({}, "", "/profile"); toast(lang === "bn" ? "লিগে যোগ দিতে আগে লগইন করো" : "Log in to join the league"); return; }
    try { localStorage.removeItem("kk_join"); } catch { /* ignore */ }
    joinLeague(code)
      .then((r) => { toast(lang === "bn" ? `"${r.name}" লিগে যোগ দিয়েছ` : `Joined "${r.name}"`); setPredTab((p) => ({ tab: "friends", league: r.id, key: p.key + 1 })); go("predict"); })
      .catch((e) => toast(e.message || "…"));
  }, [user?.id]);

  // সাইটে কোথাও "?ask" থাকলে সরাসরি জিজ্ঞেস-বক্স খোলে
  useEffect(() => { if (new URLSearchParams(window.location.search).has("ask")) { window.history.replaceState({}, "", "/ask"); setTab("ask"); } }, []);

  const onboarding = user && profile && (!profile.onboarded || editing);

  async function finishOnboarding({ fav, rival, phone }) {
    await saveMyTeams(user, { fav, rival });
    const p = await updateProfile(user, { onboarded: true, ...(phone ? { phone } : {}) });
    setProfile(p); setMyTeams({ fav, rival }); setEditing(false);
    go("matches");
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
            <button onClick={() => go("matches")} style={{ textAlign: "left", fontWeight: 700, fontSize: 19, lineHeight: 1.1 }}>
              <span>খেলা কখন<b>?</b></span>
              {showClock && <ClockText />}
            </button>
          </div>
          {!onboarding && <DeskNav tab={view ? null : tab} go={go} />}
          <div className="sp" />
          <button className="pill-btn" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>{lang === "bn" ? "EN" : "বাং"}</button>
          <button className="pill-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="theme">
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>
        </header>
        {DEMO && <div className="demo-bar">{lang === "bn" ? "ডেমো মোড — নমুনা ডেটা দেখানো হচ্ছে" : "Demo mode — sample data"}</div>}

        <main className={"main v-" + (onboarding ? "onboarding" : view?.kind || tab) + (!onboarding && !view && (tab === "matches" || tab === "leagues") ? " wide" : " narrow")}>
        {onboarding ? (
          <Onboarding
            key={editing ? "edit" : "first"}
            initial={myTeams}
            comps={comps}
            needPhone={!profile.phone}
            onDone={finishOnboarding}
            onCancel={editing ? () => setEditing(false) : skipOnboarding}
          />
        ) : view?.kind === "league" ? (
          <League key={view.code} code={view.code} comps={comps} preds={preds} onOpen={openMatch} />
        ) : view?.kind === "team" ? (
          <Team key={view.id} id={view.id} teamsById={teamsById} preds={preds} onOpen={openMatch} />
        ) : tab === "matches" ? (
          <Matches user={user} myTeams={myTeams} comps={comps} preds={preds} onOpen={openMatch} goProfile={() => go("profile")} />
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

        {!(tab === "ask" && !view && !onboarding) && <Footer />}
      </div>

      {!onboarding && <Nav tab={tab} go={go} />}
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
