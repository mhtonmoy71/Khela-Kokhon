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
.nav-in { max-width: 520px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); }
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
  pickFavSub: ["সর্বোচ্চ ৩টা — এদের খেলা হোমে সবার আগে দেখাবে", "Up to 3 — shown first on Home"],
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
function dayLabel(key, lang = "bn", { short = false } = {}) {
  const today = dayKey(new Date());
  const rel = { [today]: ["আজ", "Today"], [addDays(today, 1)]: ["আগামীকাল", "Tomorrow"], [addDays(today, -1)]: ["গতকাল", "Yesterday"] }[key];
  if (rel && !short) return lang === "bn" ? rel[0] : rel[1];
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

// ════════════════ components.jsx ════════════════
const teamName = (team, lang) =>
  !team ? (lang === "bn" ? "নির্ধারিত হয়নি" : "TBD") : lang === "bn" ? team.name_bn || team.short_en || team.name_en : team.short_en || team.name_en;
const compName = (c, lang) => (c ? (lang === "bn" ? c.name_bn : c.name_en) : "");

// ── লোগো (আগের ঘড়ির লোগো) ──
function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill="#064e3b" stroke="#00e676" strokeWidth="3" />
      {[[40, 4, 40, 12], [76, 40, 68, 40], [4, 40, 12, 40], [40, 76, 40, 68]].map(([a, b, c, d], i) => (
        <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="rgba(255,255,255,.5)" strokeWidth="2.5" />
      ))}
      <line x1="40" y1="40" x2="40" y2="24" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <line x1="40" y1="40" x2="55" y2="32" stroke="#00e676" strokeWidth="3" strokeLinecap="round" />
      <circle cx="40" cy="40" r="3" fill="#e11d48" />
    </svg>
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
function MatchRow({ m, pred, onOpen }) {
  const { lang } = useT();
  const showScore = (isLive(m) || isDone(m)) && m.home_score != null;
  const hw = isDone(m) && m.home_score > m.away_score, aw = isDone(m) && m.away_score > m.home_score;
  return (
    <button className="row" onClick={() => onOpen?.(m)}>
      <div className={"side home" + (hw ? " win" : "")}>
        <span>{teamName(m.home, lang)}</span>
        <Crest team={m.home} />
      </div>
      <div className="mid">
        {showScore ? (
          <div className="sc">{num(m.home_score, lang)} - {num(m.away_score, lang)}</div>
        ) : (
          <div className="t" style={isOff(m) ? { textDecoration: "line-through", opacity: 0.6 } : null}>{timeLabel(m.utc_date, lang)}</div>
        )}
        <div className="st"><StatusText m={m} /></div>
        {pred && (
          <span className="pred-tag">
            🎯 {num(pred.home, lang)}-{num(pred.away, lang)}
            {pred.points != null && ` · +${num(pred.points, lang)}`}
          </span>
        )}
      </div>
      <div className={"side" + (aw ? " win" : "")}>
        <Crest team={m.away} />
        <span>{teamName(m.away, lang)}</span>
      </div>
    </button>
  );
}

// ── প্রতিযোগিতা অনুযায়ী ভাগ করা তালিকা ──
function CompGroups({ matches, preds = {}, onOpen }) {
  const { lang } = useT();
  const groups = [];
  const idx = {};
  for (const m of matches) {
    const k = m.competition_code;
    if (!(k in idx)) { idx[k] = groups.length; groups.push({ c: m.competition, list: [] }); }
    groups[idx[k]].list.push(m);
  }
  groups.sort((a, b) => (a.c?.sort ?? 99) - (b.c?.sort ?? 99));
  return groups.map((g) => (
    <div className="card" style={{ marginBottom: 10 }} key={g.c?.code || "x"}>
      <div className="comp-h"><CompIcon c={g.c} />{compName(g.c, lang)}</div>
      {g.list.map((m) => <MatchRow key={m.id} m={m} pred={preds[m.id]} onOpen={onOpen} />)}
    </div>
  ));
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

// ── ম্যাচের বিস্তারিত (নিচ থেকে ওঠা শিট) ──
function MatchSheet({ m, user, pred, onClose, onSave, onLogin, toast }) {
  const { t, lang } = useT();
  const now = useNow(1000 * 20);
  const [h, setH] = useState(pred?.home ?? 1);
  const [a, setA] = useState(pred?.away ?? 1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
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
          <div className="hero-top"><CompIcon c={m.competition} size={16} />{compName(m.competition, lang)}
            {m.matchday ? <> · {t("matchday")} {num(m.matchday, lang)}</> : null}</div>
          <div className="hero-teams">
            <div className="hero-team"><Crest team={m.home} size={56} />{teamName(m.home, lang)}</div>
            <div className="hero-vs">
              {showScore ? <div style={{ fontFamily: "Inter", fontSize: 30, fontWeight: 800, opacity: 1 }}>{num(m.home_score, lang)} - {num(m.away_score, lang)}</div> : t("vs")}
              <div style={{ fontSize: 12, marginTop: 4 }}><StatusText m={m} /></div>
            </div>
            <div className="hero-team"><Crest team={m.away} size={56} />{teamName(m.away, lang)}</div>
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

        <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => shareMatch(m, lang, toast)}>
          <ShareIcon /> {t("share")}
        </button>
      </div>
    </div>
  );
}

// ── আইকন ──
const I = (d) => (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);
const HomeIcon = I(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></>);
const BallIcon = I(<><circle cx="12" cy="12" r="9" /><path d="m12 7 4 3-1.5 4.5h-5L8 10z" /><path d="M12 3v4M21 10.5l-5-.5M18 19l-3.5-4.5M6 19l3.5-4.5M3 10.5l5-.5" /></>);
const TargetIcon = I(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
const UserIcon = I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>);
const ShareIcon = I(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>);
const SunIcon = I(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
const MoonIcon = I(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />);

// ════════════════ pages/Home.jsx ════════════════
function NextHero({ m, onOpen }) {
  const { t, lang } = useT();
  const now = useNow(30000);
  const live = isLive(m);
  return (
    <button className="hero" style={{ width: "100%", textAlign: "inherit" }} onClick={() => onOpen(m)}>
      <div className="hero-top"><CompIcon c={m.competition} size={16} />{compName(m.competition, lang)}</div>
      <div className="hero-teams">
        <div className="hero-team"><Crest team={m.home} size={60} />{teamName(m.home, lang)}</div>
        <div className="hero-vs">
          {live && m.home_score != null
            ? <div style={{ fontFamily: "Inter", fontSize: 30, fontWeight: 800 }}>{num(m.home_score, lang)} - {num(m.away_score, lang)}</div>
            : t("vs")}
        </div>
        <div className="hero-team"><Crest team={m.away} size={60} />{teamName(m.away, lang)}</div>
      </div>
      <div className="hero-time">
        <div className="big">{timeLabel(m.utc_date, lang)}</div>
        <div className="when">{dayLabel(dayKey(m.utc_date), lang)} · {t("bdTime")}</div>
      </div>
      <div className="cd">
        {live
          ? <span><i className="dot" />{t("live")}</span>
          : <span>{t("startsIn")} <b>{countdown(new Date(m.utc_date) - now, lang)}</b></span>}
      </div>
    </button>
  );
}

function resultFor(m, teamId) {
  const mine = m.home_id === teamId ? m.home_score : m.away_score;
  const theirs = m.home_id === teamId ? m.away_score : m.home_score;
  return mine > theirs ? "W" : mine < theirs ? "L" : "D";
}
const RES_BN = { W: "জ", D: "ড", L: "হ" };

function RivalWatch({ rivals, teamsById, onOpen }) {
  const { t, lang } = useT();
  const [data, setData] = useState(null);
  useEffect(() => {
    let live = true;
    Promise.all([getTeamMatches(rivals, { upcoming: false, limit: 20 }), getTeamMatches(rivals, { upcoming: true, limit: 30 })])
      .then(([past, next]) => live && setData({ past, next }))
      .catch(() => live && setData({ past: [], next: [] }));
    return () => { live = false; };
  }, [rivals.join(",")]);
  if (!data) return <div className="card"><div className="spin" /></div>;
  return (
    <div className="card">
      {rivals.map((id) => {
        const last = data.past.find((m) => m.home_id === id || m.away_id === id);
        const next = data.next.find((m) => m.home_id === id || m.away_id === id);
        const team = last ? (last.home_id === id ? last.home : last.away) : next ? (next.home_id === id ? next.home : next.away) : teamsById[id];
        const r = last && resultFor(last, id);
        const opp = last && (last.home_id === id ? last.away : last.home);
        return (
          <button className="rival" key={id} style={{ width: "100%", textAlign: "inherit" }} onClick={() => (last || next) && onOpen(last || next)}>
            <Crest team={team} size={26} />
            <div className="nm">
              {teamName(team, lang)}
              <div className="res" style={{ textAlign: "left", fontWeight: 400 }}>
                {next ? `${t("next2")}: ${teamName(next.home_id === id ? next.away : next.home, lang)} · ${dayLabel(dayKey(next.utc_date), lang, { short: true })}` : t("noUpcoming")}
              </div>
            </div>
            {last && (
              <div className="res">
                {num(last.home_id === id ? last.home_score : last.away_score, lang)}-{num(last.home_id === id ? last.away_score : last.home_score, lang)}{" "}
                {lang === "bn" ? "বনাম" : "vs"} {teamName(opp, lang)}
              </div>
            )}
            {r && <span className={"badge " + r}>{lang === "bn" ? RES_BN[r] : r}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Home({ user, myTeams, teamsById, preds, onOpen, goProfile, goMatches }) {
  const { t, lang } = useT();
  const [mine, setMine] = useState(null);
  const [today, setToday] = useState(null);
  const fav = myTeams?.fav || [];
  const rival = myTeams?.rival || [];

  useEffect(() => {
    let live = true;
    getMatchesOnDay(dayKey(new Date())).then((r) => live && setToday(r)).catch(() => live && setToday([]));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let live = true;
    if (!fav.length) { setMine([]); return; }
    getTeamMatches(fav, { upcoming: true, limit: 8 }).then((r) => live && setMine(r)).catch(() => live && setMine([]));
    return () => { live = false; };
  }, [fav.join(",")]);

  const hero = mine?.[0];
  return (
    <>
      {fav.length === 0 ? (
        <div className="sec">
          <div className="card cta">
            <Logo size={46} />
            <div style={{ flex: 1 }}>
              <h3>{t("ctaTitle")}</h3>
              <p>{t("ctaBody")}</p>
              <button className="btn" style={{ marginTop: 12, height: 40 }} onClick={goProfile}>{t("ctaBtn")}</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="sec">
            <div className="sec-h"><h2>{t("nextMatch")}</h2></div>
            {mine === null ? <div className="card"><div className="spin" /></div>
              : hero ? <NextHero m={hero} onOpen={onOpen} />
              : <div className="card empty">{t("noUpcoming")}</div>}
          </div>
          {mine?.length > 1 && (
            <div className="sec">
              <div className="sec-h"><h2>{t("yourTeams")}</h2></div>
              <div className="card">
                {mine.slice(1, 6).map((m) => (
                  <div key={m.id}>
                    <div className="muted" style={{ fontSize: 11.5, padding: "8px 14px 0", display: "flex", gap: 6, alignItems: "center" }}>
                      <CompIcon c={m.competition} size={13} /> {dayLabel(dayKey(m.utc_date), lang, { short: true })}
                    </div>
                    <MatchRow m={m} pred={preds[m.id]} onOpen={onOpen} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {rival.length > 0 && (
        <div className="sec">
          <div className="sec-h"><h2>{t("rivalWatch")}</h2></div>
          <RivalWatch rivals={rival} teamsById={teamsById} onOpen={onOpen} />
        </div>
      )}

      <div className="sec">
        <div className="sec-h">
          <h2>{t("todayBig")} {today?.length ? <span className="muted" style={{ fontWeight: 500 }}>({num(today.length, lang)})</span> : null}</h2>
          <button className="link" onClick={goMatches}>{t("seeAll")} →</button>
        </div>
        {today === null ? <div className="card"><div className="spin" /></div>
          : today.length === 0 ? <div className="card empty">{t("noMatchDay")}</div>
          : <CompGroups matches={today} preds={preds} onOpen={onOpen} />}
      </div>
    </>
  );
}

// ════════════════ pages/Matches.jsx ════════════════
function Matches({ comps, preds, onOpen }) {
  const { t, lang } = useT();
  const today = dayKey(new Date());
  const [day, setDay] = useState(today);
  const [comp, setComp] = useState("ALL");
  const [list, setList] = useState(null);
  const stripRef = useRef(null);
  const days = Array.from({ length: 22 }, (_, i) => addDays(today, i - 7));

  useEffect(() => {
    const el = stripRef.current?.querySelector(".day.on");
    el?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [day]);

  useEffect(() => {
    let live = true;
    setList(null);
    getMatchesOnDay(day).then((r) => live && setList(r)).catch(() => live && setList([]));
    return () => { live = false; };
  }, [day]);

  const shown = (list || []).filter((m) => comp === "ALL" || m.competition_code === comp);

  return (
    <>
      <div className="strip" ref={stripRef}>
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
      <div className="chips">
        <button className={"chip" + (comp === "ALL" ? " on" : "")} onClick={() => setComp("ALL")}>{t("all")}</button>
        {comps.map((c) => (
          <button key={c.code} className={"chip" + (comp === c.code ? " on" : "")} onClick={() => setComp(c.code)}>
            <CompIcon c={c} size={16} />{compName(c, lang)}
          </button>
        ))}
      </div>
      <div className="sec">
        <div className="sec-h"><h2>{dayLabel(day, lang)}</h2></div>
        {list === null ? <div className="card"><div className="spin" /></div>
          : shown.length === 0 ? <div className="card empty">{t("noMatchDay")}</div>
          : <CompGroups matches={shown} preds={preds} onOpen={onOpen} />}
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

function Predict({ user, profile, preds, fav, onOpen, goProfile }) {
  const { t } = useT();
  const [tab, setTab] = useState("mine");
  return (
    <div className="sec">
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={tab === "mine" ? "on" : ""} onClick={() => setTab("mine")}>{t("myPredictions")}</button>
        <button className={tab === "lb" ? "on" : ""} onClick={() => setTab("lb")}>{t("leaderboard")}</button>
      </div>
      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 12 }}>{t("rules")}</p>
      {tab === "mine"
        ? <Mine user={user} preds={preds} fav={fav} onOpen={onOpen} goProfile={goProfile} />
        : <Leaderboard me={profile?.display_name} />}
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
  const [rival, setRival] = useState(initial?.rival || []);
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

  const kind = step === "rival" ? "rival" : "fav";
  const sel = kind === "fav" ? fav : rival;
  const setSel = kind === "fav" ? setFav : setRival;
  const other = kind === "fav" ? rival : fav;

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
        {kind === "fav"
          ? <button className="btn ghost" onClick={onCancel}>{t("skip")}</button>
          : <button className="btn ghost" onClick={() => setStep("fav")}>{t("back")}</button>}
        {kind === "fav"
          ? <button className="btn" style={{ flex: 1 }} onClick={() => { setQ(""); setStep("rival"); window.scrollTo(0, 0); }}>{t("next")}</button>
          : <button className="btn" style={{ flex: 1 }} disabled={busy} onClick={finish}>{busy ? "…" : t("done")}</button>}
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
  const chips = (ids) => ids.map((id) => teamsById[id]).filter(Boolean).map((tm) => (
    <span className="tchip" key={tm.id}><Crest team={tm} size={18} />{teamName(tm, lang)}</span>
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
          <div className="muted" style={{ fontSize: 12.5, padding: "0 16px 6px" }}>⚔ {t("rivals")}</div>
          <div className="team-chips">{myTeams.rival.length ? chips(myTeams.rival) : <span className="muted" style={{ fontSize: 13 }}>—</span>}</div>
        </div>
      </div>
      {settings}
      <div className="sec">
        <button className="btn ghost block" onClick={signOut}>{t("logout")}</button>
      </div>
    </>
  );
}

// ════════════════ App.jsx ════════════════
const TABS = [
  { id: "home", path: "/", Icon: HomeIcon },
  { id: "matches", path: "/matches", Icon: BallIcon },
  { id: "predict", path: "/predict", Icon: TargetIcon },
  { id: "profile", path: "/profile", Icon: UserIcon },
];
const tabFromPath = () => TABS.find((x) => x.path === window.location.pathname)?.id || "home";
const stored = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

function Nav({ tab, go }) {
  const { t } = useT();
  return (
    <nav className="nav">
      <div className="nav-in">
        {TABS.map(({ id, Icon }) => (
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
  const [comps, setComps] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myTeams, setMyTeams] = useState({ fav: [], rival: [] });
  const [preds, setPreds] = useState({});
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

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
    setTab(id); setEditing(false); window.scrollTo(0, 0);
  };
  useEffect(() => {
    const onPop = () => { setSheet(null); setTab(tabFromPath()); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
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

  const onboarding = user && profile && (!profile.onboarded || editing);

  async function finishOnboarding({ fav, rival, phone }) {
    await saveMyTeams(user, { fav, rival });
    const p = await updateProfile(user, { onboarded: true, ...(phone ? { phone } : {}) });
    setProfile(p); setMyTeams({ fav, rival }); setEditing(false);
    go("home");
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
      <div className="app">
        <header className="top">
          <button className="brand" onClick={() => go("home")}><Logo size={30} /><span>খেলা কখন<b>?</b></span></button>
          <div className="sp" />
          <button className="pill-btn" onClick={() => setLang(lang === "bn" ? "en" : "bn")}>{lang === "bn" ? "EN" : "বাং"}</button>
          <button className="pill-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="theme">
            {theme === "dark" ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>
        </header>
        {DEMO && <div className="demo-bar">{lang === "bn" ? "ডেমো মোড — নমুনা ডেটা দেখানো হচ্ছে" : "Demo mode — sample data"}</div>}

        {onboarding ? (
          <Onboarding
            key={editing ? "edit" : "first"}
            initial={myTeams}
            comps={comps}
            needPhone={!profile.phone}
            onDone={finishOnboarding}
            onCancel={editing ? () => setEditing(false) : skipOnboarding}
          />
        ) : tab === "home" ? (
          <Home user={user} myTeams={myTeams} teamsById={teamsById} preds={preds} onOpen={openMatch} goProfile={() => go("profile")} goMatches={() => go("matches")} />
        ) : tab === "matches" ? (
          <Matches comps={comps} preds={preds} onOpen={openMatch} />
        ) : tab === "predict" ? (
          <Predict user={user} profile={profile} preds={preds} fav={myTeams.fav} onOpen={openMatch} goProfile={() => go("profile")} />
        ) : (
          <Profile user={user} profile={profile} myTeams={myTeams} teamsById={teamsById} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} onEditTeams={() => { setEditing(true); window.scrollTo(0, 0); }} />
        )}

        <div style={{ textAlign: "center", fontSize: 11.5, padding: "28px 16px 8px" }} className="muted">
          খেলা কখন? · khelakokhon.com
        </div>
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
    </LangCtx.Provider>
  );
}
