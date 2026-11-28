// খেলা কখন? v2 — পুরো অ্যাপ এক ফাইলে
import { Fragment, Suspense, createContext, lazy, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { matchReport } from "./report.js";
import { clubBn } from "./clubsBn.js";
import { FAQ } from "./faq.js";
import "./app.css";
import { PLAYER_BN, AF_FULL_EN, AF_NAME_BN, BD_PLAYERS_BN, trName, asciiLow, bnPlayer } from "./playersBn.js";

// ════════════════ স্টাইল ════════════════
// স্টাইল আলাদা ফাইলে (src/app.css): জাভাস্ক্রিপ্টের বাইরে, আলাদা নামে আর ফোনে জমা থাকে

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
const natName = (n, lang) => (lang === "bn" ? NAT_BN[n] || (n === "Bangladesh" ? "বাংলাদেশ" : n) : n);
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
// নির্ধারিত সময়ের ৩০ মিনিট পরেও খেলা শুরুর খবর নেই (দেরি, পিছিয়ে যাওয়া, বা ডেটার উৎস লাইভ খবর দিচ্ছে না)
const noNews = (m) => !!m && !isLive(m) && !isDone(m) && !isOff(m) && m.status !== "PAUSED" && Date.now() - Date.parse(m.utc_date) > 30 * 60000;
// নকআউট ম্যাচ (টাইব্রেকার হতে পারে): লিগ/গ্রুপ পর্ব নয় এমন রাউন্ড
// জাতীয় দলের ম্যাচে লিগের বদলে আসল টুর্নামেন্ট: "বাংলাদেশ · সাফ চ্যাম্পিয়নশিপ"
const mComp = (m, lang) => (m?.competition_code === "BAN" && m.group_name ? `${lang === "bn" ? "বাংলাদেশ" : "Bangladesh"} · ${lang === "bn" ? m.group_name : (NT_EN[m.group_name] || m.group_name)}` : compName(m?.competition, lang));
const NT_EN = { "বিশ্বকাপ বাছাই": "World Cup qualifier", "এশিয়ান কাপ বাছাই": "Asian Cup qualifier", "এশিয়ান কাপ": "Asian Cup", "সাফ চ্যাম্পিয়নশিপ": "SAFF Championship", "এশিয়ান গেমস": "Asian Games", "প্রীতি ম্যাচ": "Friendly", "কিংস কাপ": "King's Cup", "আমন্ত্রণমূলক টুর্নামেন্ট": "Invitational", "ফিফা আসিয়ান কাপ": "FIFA ASEAN Cup", "ফিফা সিরিজ": "FIFA Series" };
const isKnockout = (m) => (DEMO && typeof window !== "undefined" && window.__kkKO) || !!m?.stage && !/regular|league stage|league phase|group|^league [a-d]|^league - |REGULAR_SEASON|LEAGUE_STAGE|GROUP_STAGE/i.test(m.stage);
// খেলা চলার সময় এখনকার স্কোর ধরে প্রেডিকশনের পয়েন্ট (শেষ হলে আসল পয়েন্ট)
const predPts = (pred, m) => {
  if (!pred) return null;
  if (pred.points != null) return { v: pred.points, live: false };
  if (m && isLive(m) && m.home_score != null && m.away_score != null) {
    const v = pred.home === m.home_score && pred.away === m.away_score ? 3 : Math.sign(pred.home - pred.away) === Math.sign(m.home_score - m.away_score) ? 1 : 0;
    return { v, live: true };
  }
  return null;
};
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
    ctx.fillStyle = "#064e3b"; ctx.font = `800 ${size * 0.32}px Inter, 'Hind Siliguri', sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((team?.tla || team?.short_en || "?").slice(0, 3), cx, cy);
  }
  ctx.restore();
}

// শেয়ার কার্ডের গোলদাতা: [[নাম, "১২', ৪৫'"], …] প্রতিটা দিকের
function cardScorers(L, sd, lang) {
  const by = new Map();
  for (const e of (L?.events || []).filter((g) => g.t === "Goal" && !/Missed/i.test(g.d || "") && !isSO(g) && g.s === sd)) {
    const k = e.p || "?", tag = /Own/i.test(e.d || "") ? (lang === "bn" ? " (আ.)" : " (OG)") : /Penalty/i.test(e.d || "") ? (lang === "bn" ? " (পে.)" : " (P)") : "";
    (by.get(k) || by.set(k, []).get(k)).push(minuteTxt(e.m ?? 0, e.x, lang) + tag);
  }
  return [...by].map(([n, ms]) => [shortName(n, lang), ms.join(", ")]);
}
async function makeCard(m, { lang = "bn", teamName, compName, L, pred }) {
  try { await Promise.all([document.fonts.load(`700 60px ${CARD_FONT}`, "খেলা০১২৩৪৫৬৭৮৯."), document.fonts.load(`500 40px ${CARD_FONT}`, "খেলা০১২৩৪৫৬৭৮৯.")]); } catch { /* ignore */ }
  const [hImg, aImg] = await Promise.all([loadImg(proxied(m.home?.crest)), loadImg(proxied(m.away?.crest))]);
  const c = document.createElement("canvas");
  // প্রেডিকশন থাকলে ৪:৫ (ফেসবুক ফিডে বড় দেখায়), নইলে বর্গ
  const CH = pred ? 1350 : CARD_W;
  c.width = CARD_W; c.height = CH;
  const ctx = c.getContext("2d");
  const bn = lang === "bn";

  // পটভূমি
  const g = ctx.createLinearGradient(0, 0, CARD_W, CH);
  g.addColorStop(0, "#0a3d2f"); g.addColorStop(0.5, "#064e3b"); g.addColorStop(1, "#06201a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, CARD_W, CH);
  const glow = ctx.createRadialGradient(CARD_W * 0.85, 0, 0, CARD_W * 0.85, 0, CARD_W * 0.8);
  glow.addColorStop(0, "rgba(0,230,118,0.30)"); glow.addColorStop(1, "rgba(0,230,118,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, CARD_W, CH);

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
    ctx.font = bn ? `700 104px ${CARD_FONT}` : `800 96px Inter, 'Hind Siliguri', sans-serif`; ctx.fillStyle = "#fff";
    ctx.fillText(`${num(m.home_score, lang)} - ${num(m.away_score, lang)}`, CARD_W / 2, cy);
    ctx.font = `600 36px ${CARD_FONT}`; ctx.fillStyle = "#7dffb8";
    ctx.fillText(isLive(m) ? (bn ? "লাইভ" : "LIVE") : (bn ? "খেলা শেষ" : "Full time"), CARD_W / 2, cy + 80);
  } else {
    ctx.font = `600 44px ${CARD_FONT}`; ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(bn ? "বনাম" : "vs", CARD_W / 2, cy);
  }

  // সময়ের বাক্স (খেলা শেষ বা চলমান হলে গোলদাতা)
  const bx = 90, by = 680, bw2 = CARD_W - 180, bh = 250;
  ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(bx, by, bw2, bh, 36); ctx.fill(); ctx.stroke();
  const hs = done ? cardScorers(L, "h", lang) : [], as = done ? cardScorers(L, "a", lang) : [];
  if (hs.length || as.length) {
    const rows = Math.max(hs.length, as.length), lh = Math.min(52, 200 / Math.max(rows, 1)), fs = Math.min(36, lh * 0.72);
    const y0 = by + bh / 2 - ((Math.min(rows, 4) - 1) * lh) / 2;
    const col = (list, x, align) => list.slice(0, 4).forEach(([n, ms], i) => {
      ctx.textAlign = align; const txt = `${n}  ${ms}`; ctx.fillStyle = "#fff"; fitText(ctx, txt, bw2 / 2 - 70, fs, 600); ctx.fillText(txt, x, y0 + i * lh);
    });
    col(hs, CARD_W / 2 - 40, "right"); col(as, CARD_W / 2 + 40, "left");
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.moveTo(CARD_W / 2, by + 40); ctx.lineTo(CARD_W / 2, by + bh - 40); ctx.stroke();
    ctx.textAlign = "center";
  } else {
  const { h } = dhaka(m.utc_date);
  const dayText = !done && bn && h < 6 ? whenText(m.utc_date, "bn", { abs: true }).replace(/ রাত .*$/, "") : dayLabel(dayKey(m.utc_date), lang, { abs: true });
  ctx.fillStyle = "rgba(255,255,255,0.85)"; fitText(ctx, dayText, bw2 - 80, 44, 600); ctx.fillText(dayText, CARD_W / 2, by + 62);
  ctx.fillStyle = "#00e676"; ctx.font = `700 100px ${CARD_FONT}`; ctx.fillText(timeLabel(m.utc_date, lang), CARD_W / 2, by + 150);
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `500 32px ${CARD_FONT}`; ctx.fillText(bn ? "বাংলাদেশ সময়" : "Bangladesh time", CARD_W / 2, by + 218);
  }

  // আমার প্রেডিকশন
  if (pred) {
    const py = 975, ph = 250;
    ctx.fillStyle = "rgba(245,158,11,0.13)"; ctx.strokeStyle = "rgba(245,158,11,0.65)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(bx, py, bw2, ph, 36); ctx.fill(); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = "#fcd34d"; ctx.font = `600 38px ${CARD_FONT}`;
    ctx.fillText(bn ? "আমার প্রেডিকশন" : "My prediction", CARD_W / 2, py + 56);
    const sc = bn ? `${num(pred.home, "bn")} - ${num(pred.away, "bn")}` : `${pred.home} - ${pred.away}`;
    ctx.fillStyle = "#fff"; ctx.font = bn ? `700 100px ${CARD_FONT}` : `800 96px Inter, 'Hind Siliguri', sans-serif`; ctx.fillText(sc, CARD_W / 2, py + 140);
    let foot;
    if (pred.points != null) foot = pred.points > 0 ? (bn ? `ঠিক হয়েছে · +${num(pred.points, "bn")} পয়েন্ট` : `Nailed it · +${pred.points} pts`) : (bn ? "এবার মেলেনি" : "Not this time");
    else if (pred.pen_pick) foot = bn ? `টাইব্রেকারে জিতবে ${teamName(pred.pen_pick === 1 ? m.home : m.away)}` : `${teamName(pred.pen_pick === 1 ? m.home : m.away)} win on pens`;
    else foot = bn ? "আপনার প্রেডিকশন কী?" : "What's yours?";
    ctx.fillStyle = pred.points > 0 ? "#7dffb8" : "rgba(255,255,255,0.8)"; fitText(ctx, foot, bw2 - 80, 40, 600); ctx.fillText(foot, CARD_W / 2, py + 212);
  }

  // নিচে ঠিকানা
  ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `600 34px Inter, 'Hind Siliguri', sans-serif`;
  ctx.fillText("khelakokhon.com", CARD_W / 2, CH - 62);

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
  T(524, "PSG", "PSG", "পিএসজি", "FL1"), T(516, "Marseille", "OM", "মার্শেই", "FL1"), T(548, "Monaco", "ASM", "মোনাকো", "FL1"), T(523, "Lyon", "OL", "লিওঁ", "FL1"),
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

// ── একবার আনা তথ্য মনে রাখা: পরেরবার সাথে সাথে দেখায়, পেছনে নতুনটা এনে বদলায় ──
// "p:" দিয়ে শুরু হলে ফোনেও জমা থাকে (৬ ঘণ্টা), যাতে অ্যাপ খুললেই শেষ দেখা তালিকা চোখে পড়ে
const MEMO = new Map();
const keep = {
  get(k) {
    if (MEMO.has(k)) return MEMO.get(k);
    if (k.startsWith("p:")) {
      try { const v = JSON.parse(localStorage.getItem("kkc_" + k) || "null"); if (v && Date.now() - v.t < 6 * 3600000) { MEMO.set(k, v.d); return v.d; } } catch { /* নেই */ }
    }
    return undefined;
  },
  set(k, d) {
    MEMO.set(k, d);
    if (!k.startsWith("p:")) return;
    try {
      // একই ধরনের পুরনো জমা (অন্য দিন) মুছে জায়গা রাখা
      const kind = k.split(":")[1];
      for (let i = localStorage.length - 1; i >= 0; i--) { const x = localStorage.key(i); if (x && x.startsWith("kkc_p:" + kind + ":") && x !== "kkc_" + k) localStorage.removeItem(x); }
      localStorage.setItem("kkc_" + k, JSON.stringify({ t: Date.now(), d }));
    } catch { /* জায়গা না থাকলে শুধু মেমরিতে */ }
  },
};
// অ্যাপ প্রথম তথ্যসহ আঁকা হলে স্প্ল্যাশ সরানোর সংকেত (index.html শোনে)
let kkReadySent = false;
const kkReady = () => { if (kkReadySent) return; kkReadySent = true; try { requestAnimationFrame(() => window.dispatchEvent(new Event("kk-ready"))); } catch { /* */ } };

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

// ── লাইভ বিস্তারিত (API-Football → match_live): মিনিট, স্কোর, ঘটনা, লাইনআপ, পরিসংখ্যান ──
const AF_PLAY = ["1H", "2H", "ET", "BT", "P", "LIVE", "INT", "SUSP"];
const AF_DONE = ["FT", "AET", "PEN"];
// match_live পুরনো হয়ে গেলে (সিঙ্ক থেমে গেলে) সেটার ওপর ভরসা নয়; শেষ হওয়া ম্যাচের ফল অবশ্য থাকে
const liveFresh = (L) => L && L.status && (AF_DONE.includes(L.status) || Date.now() - Date.parse(L.updated_at || 0) < 10 * 60000);
// football-data-এর ম্যাচের ওপর API-Football-এর নতুন তথ্য বসানো (স্কোর, অবস্থা, মিনিট)
function mergeLive(m, L) {
  if (!liveFresh(L) || m.status === "FINISHED" && !AF_DONE.includes(L.status)) return m;
  const st = AF_PLAY.includes(L.status) ? "IN_PLAY" : L.status === "HT" ? "PAUSED" : AF_DONE.includes(L.status) ? "FINISHED" : null;
  if (!st) return m;
  return { ...m, status: st, home_score: L.home_goals ?? m.home_score, away_score: L.away_goals ?? m.away_score, minute: st === "IN_PLAY" ? L.elapsed : null, minute_x: L.extra || null, af_status: L.status };
}
async function getLiveFor(ids) {
  if (DEMO || !ids.length) return {};
  const { data, error } = await sb.from("match_live").select("match_id,status,elapsed,extra,home_goals,away_goals,updated_at").in("match_id", ids);
  if (error) return {};
  return Object.fromEntries((data || []).map((r) => [r.match_id, r]));
}
async function getLiveFull(id) {
  if (DEMO) return (typeof window !== "undefined" && window.__kkLive) || null; // ডেমোতে পরীক্ষার জন্য
  const { data, error } = await sb.from("match_live").select("*").eq("match_id", id).maybeSingle();
  return error ? null : data;
}
async function withLive(list) {
  const L = await getLiveFor(list.map((m) => m.id)).catch(() => ({}));
  return list.map((m) => mergeLive(m, L[m.id]));
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
  const r = ok(await sb.from("standings").select("*, team:teams(*)").eq("competition_code", code).order("position"));
  keep.set("st:" + code, r);
  return r;
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
      if (j && j.v === 4 && Date.now() - j.t < 86400000 && Array.isArray(j.data)) allPlayersP = Promise.resolve(j.data);
    } catch { /* ignore */ }
    // ছয় লিগ (football-data) + API-Football-এর লিগগুলো (সৌদি, এমএলএস…), একসাথে
    const afSq = fetch("/api/live?squads=4").then((r) => (r.ok ? r.json() : [])).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);
    allPlayersP ||= Promise.all([extra({ type: "players" }), afSq]).then(([a, b]) => [...a, ...b]).then((data) => { try { localStorage.setItem("kk_players", JSON.stringify({ t: Date.now(), v: 4, data })); } catch { /* ignore */ } return data; })
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
const backTo = () => window.location.origin + (pendingJoin() ? `/join/${pendingJoin()}` : pendingQuiz() ? `/quiz/play${pendingQuiz() === "new" ? "" : "/" + pendingQuiz()}` : "");

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
  // লগআউট হলে ফোনে জমা রাখা তথ্য (অফলাইনের জন্য) মুছে ফেলা
  try { await caches.delete("data"); } catch { /* না থাকলে কিছু নয় */ }
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
  const rows = ok(await sb.from("predictions").select("*").eq("user_id", user.id));
  return Object.fromEntries(rows.map((r) => [r.match_id, r]));
}

// penPick: খেলা টাইব্রেকারে গেলে কে জিতবে (১ ঘরের দল, ২ অতিথি); দুই লেগে মোট গোল সমান হলেও। না দিলে ঘরটা পাঠানোই হয় না
async function savePrediction(user, matchId, home, away, penPick) {
  if (DEMO) { const p = ls.get("preds", {}); p[matchId] = { match_id: matchId, home, away, pen_pick: penPick ?? null, points: null }; ls.set("preds", p); return p[matchId]; }
  const row = { user_id: user.id, match_id: matchId, home, away, ...(penPick !== undefined ? { pen_pick: penPick ?? null } : {}) };
  return ok(await sb.from("predictions").upsert(row, { onConflict: "user_id,match_id" }).select("*").single());
}

// comp না দিলে সব লিগ মিলিয়ে; দিলে শুধু সেই লিগের ম্যাচের পয়েন্ট
// (লিগ অনুযায়ী হিসাবের ফাংশন ডেটাবেসে না থাকলে "missing" error)
const rpcMissing = (e) => /PGRST202|could not find the function|does not exist/i.test((e?.code || "") + " " + (e?.message || ""));
async function getLeaderboard(comp, wk = null) {
  if (wk !== null) return weekBoard("get_leaderboard_v3", { lim: 50, comp, wk });
  if (DEMO) return comp ? DEMO_LEADERS.filter((_, i) => (i + comp.length) % 3).map((r) => ({ ...r, points: Math.round(r.points / 3), exact: Math.round(r.exact / 3), played: Math.round(r.played / 3) })) : DEMO_LEADERS;
  // সব লিগ মিলিয়েও নতুন ফাংশন (ছবিসহ); ডেটাবেসে না থাকলে পুরনোটা
  const { data, error } = await sb.rpc("get_leaderboard_comp", { lim: 50, comp });
  if (error && !comp && rpcMissing(error)) return ok(await sb.rpc("get_leaderboard", { lim: 50 }));
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

async function leagueBoard(id, comp, wk = null) {
  if (wk !== null) return weekBoard("pleague_board_v3", { p_id: String(id), comp, wk });
  if (DEMO) { const b = demoLeagues().find((x) => x.id === id)?.board || []; return comp ? b.map((r) => ({ ...r, points: Math.round(r.points / 2), exact: Math.round(r.exact / 2), played: Math.round(r.played / 2) })) : b; }
  const { data, error } = await sb.rpc("pleague_board_comp", { p_id: String(id), comp });
  if (error && !comp && rpcMissing(error)) return rpc("pleague_board", { p_id: id });
  if (error) throw rpcMissing(error) ? Object.assign(new Error("missing"), { missing: true }) : error;
  return data;
}

// সাপ্তাহিক বোর্ড (শনি–শুক্র, বাংলাদেশ সময়): wk 0 = এই সপ্তাহ, -1 = গত সপ্তাহ
async function weekBoard(fn, args) {
  if (DEMO) return DEMO_LEADERS.slice(0, 6).map((r, i) => ({ ...r, points: Math.max(0, 14 - i * 2 - (args.wk ? 1 : 0)), exact: Math.max(0, 3 - i), played: 6 }));
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw rpcMissing(error) ? Object.assign(new Error("missing"), { missing: true }) : error;
  return data;
}
// সপ্তাহের তারিখ: "১৭–২৩ নভেম্বর"
function weekRangeLabel(wk, lang) {
  const k = dayKey(new Date()), [y, m, d] = k.split("-").map(Number);
  const wd = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 1) % 7; // শনিবার = ০
  const mon = addDays(k, -wd + 7 * wk), sun = addDays(mon, 6);
  const p = (x) => x.split("-").map(Number);
  const [, m1, d1] = p(mon), [, m2, d2] = p(sun), bn = lang === "bn", M = bn ? BN_MONTHS : EN_MONTHS;
  return m1 === m2 ? `${num(d1, lang)}–${num(d2, lang)} ${M[m2 - 1]}` : `${num(d1, lang)} ${M[m1 - 1]} – ${num(d2, lang)} ${M[m2 - 1]}`;
}
// সিজন / এই সপ্তাহ / গত সপ্তাহ
function PeriodSeg({ value, onChange }) {
  const { lang } = useT(), bn = lang === "bn";
  const opts = [[null, bn ? "সিজন" : "Season"], [0, bn ? "এই সপ্তাহ" : "This week"], [-1, bn ? "গত সপ্তাহ" : "Last week"]];
  return (
    <div className="seg lb-period">
      {opts.map(([v, l]) => <button key={String(v)} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}
    </div>
  );
}
// সপ্তাহের সেরা: গত সপ্তাহের বোর্ডের ওপরে
function WeekTop({ rows, wk, lang }) {
  const bn = lang === "bn";
  const best = rows?.[0]?.points > 0 ? rows.filter((r) => r.points === rows[0].points && r.exact === rows[0].exact) : [];
  return (
    <div className="wk-head">
      <span className="muted">{weekRangeLabel(wk, lang)}{wk === 0 ? (bn ? " · চলছে" : " · in progress") : ""}</span>
      {wk === -1 && best.length > 0 && (
        <div className="wk-best">
          <span className="wk-crown">★</span>
          <div style={{ minWidth: 0 }}>
            <small>{bn ? "সপ্তাহের সেরা প্রেডিক্টর" : "Predictor of the week"}</small>
            <b>{best.map((r) => r.display_name + (r.is_me ? (bn ? " (আপনি)" : " (you)") : "")).join(", ")}</b>
          </div>
          <span className="wk-pts">{num(best[0].points, lang)} <small>{bn ? "পয়েন্ট" : "pts"}</small></span>
        </div>
      )}
    </div>
  );
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
          <UserAvatar src={r.avatar} name={r.display_name} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>{r.display_name}{isMe(r) ? (lang === "bn" ? " (আপনি)" : " (you)") : ""}{r.live > 0 && <i className="lv-dot" style={{ marginLeft: 6 }} title={lang === "bn" ? "খেলা চলছে" : "Live"} />}</div>
            <div className="sub">{lang === "bn" ? `${num(r.played, lang)} ম্যাচ · হুবহু ${num(r.exact, lang)}` : `${r.played} played · ${r.exact} exact`}</div>
          </div>
          <div className="pt">{num(r.points, lang)} <span className="sub">{t("pts")}</span></div>
        </div>
      ))}
      {rows.some((r) => r.live > 0) && <div className="muted lb-live-note"><i className="lv-dot" />{lang === "bn" ? "খেলা চলছে · এখনকার স্কোর ধরে পয়েন্ট, শেষ হলে চূড়ান্ত" : "Live · points as it stands, final at full time"}</div>}
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
  if (id >= 10000000) { const r = await fetch(`/api/live?team=${id}`); if (!r.ok) throw new Error("team"); return r.json(); }
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
  if (matchId >= 100000000) { const r = await fetch(`/api/live?h2h=${matchId}`); if (!r.ok) throw new Error("h2h"); return r.json(); }
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
  516: ["Marseille", "মার্শেই"],
  519: ["Auxerre", "অক্সের"],
  521: ["Lille", "লিল"],
  522: ["Nice", "নিস"],
  523: ["Lyon", "লিওঁ"],
  524: ["Paris Saint-Germain", "পিএসজি"],
  525: ["Lorient", "লরিয়াঁ"],
  529: ["Rennes", "রেনে"],
  531: ["Troyes", "ত্রোয়া"],
  532: ["Angers", "অঁজে"],
  533: ["Le Havre", "লে আভ্র"],
  535: ["Le Mans", "লে মাঁ"],
  546: ["Lens", "লাঁস"],
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
    : lang === "bn" ? clubBn(team.short_en) || clubBn(team.name_en) || team.name_bn || (team.id >= 10000000 && team.short_en ? NAT_BN[team.short_en] || trName(team.short_en.replace(/\b(FC|SC|CF|AFC|CD|SD|UD|AC|SAD|SFC|FK|SK|BK)\b\.?/g, "").trim()) : null) || team.short_en || team.name_en : team.short_en || team.name_en;
// খোঁজার জন্য দলের সব নাম
const teamAliases = (t) => [t.name_bn, clubBn(t.short_en), t.name_en, t.short_en, ...(TEAM_NAMES[t.id] || []), ...(TEAM_SHORT[t.id] || [])];
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
// এক শব্দের লম্বা নাম (অলিম্পিয়াকোস) দুই লাইনে ভাঙে না, তাই একটু ছোট অক্ষরে
const oneLong = (n) => !!n && !/\s/.test(n) && n.length > 9;
const teamShort = (team, lang) => (team && TEAM_SHORT[team.id] ? TEAM_SHORT[team.id][lang === "bn" ? 1 : 0] : teamName(team, lang));
// বাংলায় লিগ আঁ নয়, লিগ ওয়ান (ডেটাবেসের নাম যা-ই থাকুক)
const COMP_BN_FIX = { FL1: "লিগ ওয়ান" };
const compName = (c, lang) => (c ? (lang === "bn" ? COMP_BN_FIX[c.code] || c.name_bn : c.name_en) : "");

// খেলোয়াড়ের বাংলা নাম (পত্রিকার বানান): গোলদাতা তালিকার উপরের দিক, পরিচিত তারকা আর বড় ১৪ দলের পুরো স্কোয়াড; বাকিরা ইংরেজিতে
const playerName = (name, lang) => (lang === "bn" && PLAYER_BN[name]) || name;
// খেলোয়াড়ের সারি ধরে নাম: API-Football-এর খেলোয়াড় (আইডি ১ কোটি+) হলে বাংলা রূপান্তর
const pName = (r, lang) => (r && r.player_id >= 10000000 ? bnPlayer(r.player_name, lang) : playerName(r?.player_name, lang));

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
// বাইরের লোগো/ছবি নিজেদের ডোমেইন থেকে ছোট করে (/api/img, CDN-এ জমা): দেখানোর মাপের দ্বিগুণ (রেটিনা)
const IMG_HOSTS = /^https:\/\/(crests\.football-data\.org|media(-\d)?\.api-sports\.io)\//;
const imgUrl = (src, px) => (src && !DEMO && IMG_HOSTS.test(src) ? `/api/img?u=${encodeURIComponent(src)}&w=${Math.round(px * 2)}` : src);
// ছোট করা ছবি না এলে আসলটা, তাও না এলে বিকল্প (tries: ০ ছোট, ১ আসল, ২ বাদ)
function useImgTries(key) { const [t, setT] = useState(0); useEffect(() => setT(0), [key]); return [t, () => setT((x) => x + 1)]; }
// ডার্ক মোডে কালো লোগো (প্রিমিয়ার লিগের সিংহ, লিগ ওয়ান, কালো ক্লাব-লোগো) ব্যাকগ্রাউন্ডে মিশে যায়।
// লোগো এলে একবার পিক্সেল দেখে: বেশিরভাগ কালো আর রংহীন হলে "inv" (ডার্কে সাদা করে উল্টানো),
// কালো কিন্তু রঙিন হলে "plate" (পেছনে হালকা গোল চাকতি)। নিজেদের সার্ভারের ছবিই পড়া যায়; বাকিগুলো যেমন আছে।
const dkMemo = new Map();
function markDark(e) {
  const img = e.currentTarget, key = img.currentSrc || img.src;
  if (dkMemo.has(key)) { const v = dkMemo.get(key); if (v) img.dataset.dk = v; return; }
  let v = "";
  try {
    const N = 32, c = document.createElement("canvas"); c.width = c.height = N;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, N, N);
    const d = x.getImageData(0, 0, N, N).data;
    let n = 0, dark = 0, light = 0, sat = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 140) continue;
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      n++; if (lum < 0.15) dark++; if (lum > 0.7) light++; sat += mx ? (mx - mn) / mx : 0;
    }
    if (n > 20 && dark / n > 0.5 && light / n < 0.18) v = sat / n < 0.3 ? "inv" : "plate";
  } catch { v = ""; }
  dkMemo.set(key, v);
  if (v) img.dataset.dk = v;
}
function Crest({ team, size = 22 }) {
  const [tries, fail] = useImgTries(team?.crest);
  const src = !team?.crest ? null : tries === 0 ? imgUrl(team.crest, size) : tries === 1 && imgUrl(team.crest, size) !== team.crest ? team.crest : null;
  if (!src)
    return (
      <span className="crest-fb" style={{ width: size, height: size, fontSize: size * 0.34 }}>
        {(team?.tla || team?.short_en || "?").slice(0, 3)}
      </span>
    );
  return <img className="crest" src={src} alt="" width={size} height={size} loading="lazy" decoding="async" onError={fail} onLoad={markDark} />;
}

// ডেটা সোর্সের পুরনো লোগোর বদলে নতুন লোগো (সাইটের নিজের ফাইল, public/leagues)
const EMBLEM_FIX = { CL: "/leagues/CL.png", PL: "/leagues/PL.png", PD: "/leagues/PD.png", BL1: "/leagues/BL1.png", SA: "/leagues/SA.png", FL1: "/leagues/FL1.png", BPL: "/leagues/BPL.svg", BFC: "/leagues/BFC.svg" };
function CompIcon({ c, size = 18 }) {
  const raw = (c && EMBLEM_FIX[c.code]) || c?.emblem;
  const [tries, fail] = useImgTries(raw);
  const src = !raw ? null : tries === 0 ? imgUrl(raw, size) : tries === 1 && imgUrl(raw, size) !== raw ? raw : null;
  if (!src) return null;
  return <img src={src} alt="" width={size} height={size} style={{ objectFit: "contain" }} decoding="async" onError={fail} onLoad={markDark} />;
}

// ── স্ট্যাটাস লেখা ──
const minuteTxt = (mi, x, lang) => `${num(mi, lang)}${x ? "+" + num(x, lang) : ""}'`;
function StatusText({ m }) {
  const { t, lang } = useT();
  if (m.status === "PAUSED") return <span className="lv">{t("ht")}</span>;
  if (isLive(m) && m.minute != null) return <span className="lv lv-pill">{minuteTxt(m.minute, m.minute_x, lang)}</span>;
  if (isLive(m)) return <span className="lv"><i className="dot" />{t("live")}</span>;
  if (isDone(m)) return <>{t("ft")}</>;
  if (m.status === "POSTPONED") return <>{t("postponed")}</>;
  if (m.status === "CANCELLED") return <>{t("cancelled")}</>;
  return null;
}

// ── ম্যাচের সারি ──
function MatchRow({ m, pred, onOpen, badge: badge0, plain, sub }) {
  const allFavs = useContext(FavCtx);
  const favs = plain ? [] : allFavs; // "ফলো করা" কার্ডে সবই প্রিয় দল, তাই আলাদা চিহ্ন লাগে না
  const { t, lang } = useT();
  const badge = badge0 === undefined ? rowBadge(m, t, lang) : badge0;
  const showScore = (isLive(m) || isDone(m)) && m.home_score != null;
  const hw = isDone(m) && m.home_score > m.away_score, aw = isDone(m) && m.away_score > m.home_score;
  return (
    <button className={"row has-badge" + (favs.includes(m.home_id) || favs.includes(m.away_id) ? " my" : "")} onClick={() => onOpen?.(m)}>
      {badge}
      <div className={"side home" + (hw ? " win" : "")}>
        <span className={oneLong(teamShort(m.home, lang)) ? "lw" : undefined}>{teamShort(m.home, lang)}</span>
        <span className="crw"><Crest team={m.home} />{favs.includes(m.home_id) && <i className="fav-pin">★</i>}</span>
      </div>
      <div className="mid">
        {showScore ? (
          <div className="sc">{num(m.home_score, lang)} - {num(m.away_score, lang)}</div>
        ) : (
          <><div className="t" style={isOff(m) ? { textDecoration: "line-through", opacity: 0.6 } : null}>{timeLabel(m.utc_date, lang)}</div>
          {noNews(m) && <div className="nn">{lang === "bn" ? "শুরুর খবর নেই" : "No kick-off info"}</div>}</>
        )}
        {sub ? <div className="st">{sub}</div> : null}
        {pred && (
          <span className="pred-tag">
            <TargetIcon width={11} height={11} style={{ verticalAlign: -1 }} /> {num(pred.home, lang)}-{num(pred.away, lang)}
            {(() => { const q = predPts(pred, m); return q ? <span className={q.live ? "pt-live" : undefined}>{` · +${num(q.v, lang)}`}</span> : null; })()}
          </span>
        )}
      </div>
      <div className={"side" + (aw ? " win" : "")}>
        <span className="crw"><Crest team={m.away} />{favs.includes(m.away_id) && <i className="fav-pin">★</i>}</span>
        <span className={oneLong(teamShort(m.away, lang)) ? "lw" : undefined}>{teamShort(m.away, lang)}</span>
      </div>
    </button>
  );
}

// ── ফলো করা লিগ: ম্যাচ ট্যাবে আগে দেখায় (ফোনে মনে থাকে) ──
// লগিন থাকলে অ্যাকাউন্টেও রাখা হয় (profiles.follow_lg), যাতে সব ডিভাইসে একই থাকে
const lgSubs = new Set();
let lgUser = null;
const getFollowLg = () => { const v = ls.get("follow_lg", []); return Array.isArray(v) ? v : []; };
const setFollowLgLocal = (n) => { ls.set("follow_lg", n); lgSubs.forEach((f) => f(n)); };
async function syncFollowLg(user, profile) {
  lgUser = user || null;
  if (!user || DEMO || !profile) return;
  const remote = Array.isArray(profile.follow_lg) ? profile.follow_lg : null;
  const local = getFollowLg();
  if (remote && remote.length) { if (JSON.stringify(remote) !== JSON.stringify(local)) setFollowLgLocal(remote); }
  else if (local.length && "follow_lg" in profile) sb.from("profiles").update({ follow_lg: local }).eq("id", user.id).then(() => {}, () => {});
}
function useFollowLg() {
  const [v, setV] = useState(getFollowLg);
  useEffect(() => { lgSubs.add(setV); return () => lgSubs.delete(setV); }, []);
  const save = (n) => {
    setFollowLgLocal(n);
    if (lgUser && !DEMO) sb.from("profiles").update({ follow_lg: n }).eq("id", lgUser.id).then(() => {}, () => {});
  };
  const toggle = (code) => { const cur = getFollowLg(); const n = cur.includes(code) ? cur.filter((x) => x !== code) : [...cur, code]; save(n); return !cur.includes(code); };
  // ফলো করা লিগের ক্রম বদলানো: d = -1 (ওপরে) বা +1 (নিচে)
  const move = (code, d) => { const n = [...getFollowLg()]; const i = n.indexOf(code), j = i + d; if (i < 0 || j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; save(n); };
  return [v, toggle, move];
}
// ফলো করা লিগ আগে (যে ক্রমে ফলো করেছেন), তারপর বাকিগুলো স্বাভাবিক ক্রমে
const lgRank = (follow, c) => { const i = follow.indexOf(c?.code); return i >= 0 ? i - 1000 : (c?.sort ?? 99); };
const orderComps = (comps, follow) => [...comps].sort((a, b) => lgRank(follow, a) - lgRank(follow, b));

// ── প্রতিযোগিতা অনুযায়ী ভাগ করা তালিকা ──
function CompGroups({ matches, preds = {}, onOpen }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  // কোন লিগ ভাঁজ করা (ব্যবহারকারীর পছন্দ মনে থাকে)
  const [shut, setShut] = useState(() => { const v = ls.get("cg_shut", []); return Array.isArray(v) ? v : []; });
  const toggle = (k) => setShut((x) => { const n = x.includes(k) ? x.filter((y) => y !== k) : [...x, k]; ls.set("cg_shut", n); return n; });
  const [follow] = useFollowLg();
  const groups = [];
  const idx = {};
  for (const m of matches) {
    const k = m.competition_code;
    if (!(k in idx)) { idx[k] = groups.length; groups.push({ c: m.competition, list: [] }); }
    groups[idx[k]].list.push(m);
  }
  // লাইভ খেলা সবার আগে, তারপর সামনের খেলা, শেষ হওয়া (আর স্থগিত) নিচে (FotMob-এর মতো)
  // লিগের ভেতরেও একই ক্রম; একই ধাপে সময় ধরে। খেলা শেষ হলে নিজে থেকেই নিচে নামে।
  const stage = (m) => (isLive(m) ? 0 : isDone(m) || isOff(m) ? 2 : 1);
  for (const g of groups) {
    g.list.sort((a, b) => stage(a) - stage(b) || Date.parse(a.utc_date) - Date.parse(b.utc_date));
    g.stage = Math.min(...g.list.map(stage));
  }
  groups.sort((a, b) => a.stage - b.stage || lgRank(follow, a.c) - lgRank(follow, b.c));
  return (
    <div className="groups">
      {groups.map((g) => {
        const k = g.c?.code || "x";
        const off = shut.includes(k);
        const live = g.list.filter(isLive).length;
        const bodyId = "cg-" + k;
        return (
          <div className={"card cg" + (off ? " shut" : "")} style={{ marginBottom: 10 }} key={k}>
            <div className="comp-h cg-h">
              {g.c
                ? <button className="cg-link" onClick={() => nav.openLeague(g.c.code)}><CompIcon c={g.c} /><span className="cg-nm">{compName(g.c, lang)}</span></button>
                : <span className="cg-link"><CompIcon c={g.c} /><span className="cg-nm">{compName(g.c, lang)}</span></span>}
              <button className="cg-tog" onClick={() => toggle(k)} aria-expanded={!off} aria-controls={bodyId} aria-label={off ? (bn ? "ম্যাচগুলো দেখান" : "Show matches") : (bn ? "ম্যাচগুলো লুকান" : "Hide matches")}>
                {live > 0 && <span className="cg-live" title={bn ? "লাইভ" : "Live"}>{num(live, lang)}/{num(g.list.length, lang)}</span>}
                {off && !live && <span className="cg-n">{num(g.list.length, lang)}</span>}
                <ChevronIcon className="cg-chev" width={18} height={18} />
              </button>
            </div>
            <div className="cg-body" id={bodyId}><div>{g.list.map((m) => <MatchRow key={m.id} m={m} pred={preds[m.id]} onOpen={onOpen} />)}</div></div>
          </div>
        );
      })}
    </div>
  );
}

// ── প্রতি মিনিটে রেন্ডার (কাউন্টডাউনের জন্য) ──
// ঘড়ির মতো কাউন্টডাউন: ০৩:১২:০৫ (এক দিনের বেশি হলে "২ দিন ০৩:১২:০৫")
const pad2 = (v, lang) => num(String(v).padStart(2, "0"), lang);
function clockDown(ms, lang = "bn") {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), mi = Math.floor((t % 3600) / 60), se = t % 60;
  const hms = `${pad2(h, lang)}:${pad2(mi, lang)}:${pad2(se, lang)}`;
  return d > 0 ? `${num(d, lang)} ${lang === "bn" ? "দিন" : "d"} ${hms}` : hms;
}
// চলমান খেলার ঘড়ি মিনিট:সেকেন্ড। উৎস প্রতি মিনিটে শুধু মিনিট দেয়, তাই শেষ হালনাগাদ থেকে সেকেন্ড গোনা
// (হালনাগাদ থেমে গেলে ঘড়ি এক মিনিটের বেশি এগোয় না); যোগ করা সময়ে "৪৫+২'"
function LiveClock({ m, L, lang }) {
  const now = useNow(1000);
  if (m.status === "PAUSED") return <span className="lv">{lang === "bn" ? "বিরতি" : "HT"}</span>;
  if (!isLive(m) || m.minute == null) return <StatusText m={m} />;
  const cap = L?.status === "1H" ? 45 : L?.status === "2H" ? 90 : L?.status === "ET" ? 120 : 999;
  if (m.minute_x || m.minute >= cap) return <span className="lv"><i className="dot" />{minuteTxt(m.minute, m.minute_x, lang)}</span>;
  const since = Math.max(0, Math.min(119, Math.floor((now - Date.parse(L?.updated_at || now)) / 1000)));
  const mm = Math.min(cap, m.minute + Math.floor(since / 60)), ss = since % 60;
  return <span className="lv mp-clock"><i className="dot" />{pad2(mm, lang)}:{pad2(ss, lang)}</span>;
}
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
        <b>{bn ? "ভক্তদের রায়" : "Fans' verdict"}</b>
        <span className="muted">{counts === null ? "…" : total ? (bn ? `${num(total, "bn")} ভোট` : `${total.toLocaleString()} vote${total === 1 ? "" : "s"}`) : open ? (bn ? "প্রথম ভোটটা দিন" : "Be the first") : ""}</span>
        <span className={"fv-state" + (open ? " on" : "")}>{open ? <><i />{bn ? "এক ট্যাপে ভোট" : "Tap to vote"}</> : (bn ? "ভোট বন্ধ" : "Closed")}</span>
      </div>
      <div className="fv-opts">
        {[0, 1, 2].map((k) => (
          <button key={k} className={"fv-opt k" + k + (mine === k ? " mine" : "") + (lead === k ? " lead" : "") + (result === k ? " won" : "")} disabled={!open || busy} onClick={() => vote(k)} aria-pressed={mine === k} title={names[k]} aria-label={`${names[k]}${total ? ` ${pct[k]}%` : ""}`}>
            {k === 1 ? <span className="fv-nm">{bn ? "ড্র" : "Draw"}</span> : <Crest team={k === 0 ? m.home : m.away} size={24} />}
            <b className="fv-pc">{total ? `${num(pct[k], lang)}%` : "–"}</b>
          </button>
        ))}
      </div>
      <div className={"fv-bar" + (total ? "" : " novote")}>
        {[0, 1, 2].map((k) => <span key={k} className={"k" + k} style={{ width: grow && total ? `${pct[k]}%` : total ? "0%" : "33.33%" }} />)}
      </div>
      {result != null && total > 0 && (
        <div className={"fv-verdict" + (result === lead ? " ok" : "")}>
          {result === lead
            ? (bn ? `ভক্তদের ধারণাই মিলেছে · ${num(pct[lead], lang)}% বলেছিলেন ${lead === 1 ? "ড্র হবে" : teamShort(lead === 0 ? m.home : m.away, lang) + " জিতবে"}` : `Fans called it · ${pct[lead]}% picked ${lead === 1 ? "a draw" : teamShort(lead === 0 ? m.home : m.away, lang)}`)
            : (bn ? `চমক! ${num(pct[lead], lang)}% ভক্ত বলেছিলেন ${lead === 1 ? "ড্র হবে" : teamShort(lead === 0 ? m.home : m.away, lang) + " জিতবে"}` : `Upset! ${pct[lead]}% picked ${lead === 1 ? "a draw" : teamShort(lead === 0 ? m.home : m.away, lang)}`)}
        </div>
      )}
    </div>
  );
}

// ════════════════ ম্যাচ সেন্টার: ঘটনা, লাইনআপ, পরিসংখ্যান (API-Football) ════════════════
const EvIcon = ({ e }) => {
  const d = e.d || "";
  if (e.t === "Goal") {
    const miss = /Missed/i.test(d), own = /Own/i.test(d);
    return <SoccerBall size={19} own={own} miss={miss} className="ev-ic" />;
  }
  if (e.t === "Card") {
    const red = /Red/i.test(d), second = /Second/i.test(d);
    return (
      <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true" className="ev-ic">
        {second && <rect x="1" y="1" width="9" height="13" rx="1.5" fill="#facc15" />}
        <rect x={second ? 5 : 3} y={second ? 4 : 2} width="9" height="13" rx="1.5" fill={red || second ? "#ef4444" : "#facc15"} />
      </svg>
    );
  }
  if (e.t === "subst") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ev-ic">
      <path d="M7 4v13M3.5 13.5L7 17l3.5-3.5" stroke="#ef4444" /><path d="M17 20V7M13.5 10.5L17 7l3.5 3.5" stroke="#16a34a" />
    </svg>
  );
  return (
    <svg className="ev-ic ev-var" width="22" height="22" viewBox="0 0 24 24" aria-label="VAR">
      <rect x="1.8" y="3.6" width="20.4" height="13.6" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <text x="12" y="13.1" textAnchor="middle" fontFamily="Inter, 'Hind Siliguri', sans-serif" fontWeight="800" fontSize="6.8" fill="currentColor" letterSpacing="-.2">VAR</text>
      <path d="M12 17.2v3M8.2 20.6h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

const EV_BN = {
  "Own Goal": "আত্মঘাতী গোল", Penalty: "পেনাল্টি থেকে", "Missed Penalty": "পেনাল্টি মিস",
  "Yellow Card": "হলুদ কার্ড", "Red Card": "লাল কার্ড", "Second Yellow card": "দ্বিতীয় হলুদ, লাল কার্ড",
  "Goal cancelled": "গোল বাতিল", "Penalty confirmed": "পেনাল্টি নিশ্চিত", "Penalty cancelled": "পেনাল্টি বাতিল",
  "Goal Disallowed - offside": "অফসাইডে গোল বাতিল", "Card upgrade": "কার্ড বদল", "Goal confirmed": "গোল বহাল",
};

// বদলি: কে নামলেন, কে উঠলেন (মাঠে থাকা খেলোয়াড়ের তালিকা ধরে, যাতে উৎসের ক্রম যা-ই হোক ঠিক থাকে)
function subPairs(L) {
  const on = new Set([...(L.lineups?.h?.xi || []), ...(L.lineups?.a?.xi || [])].map((p) => p.id));
  const out = new Map();
  [...(L.events || [])].sort((x, y) => (x.m ?? 0) + (x.x ?? 0) / 100 - ((y.m ?? 0) + (y.x ?? 0) / 100)).forEach((e) => {
    if (e.t !== "subst") return;
    let offP = { n: e.p, id: e.pid }, inP = { n: e.a, id: e.aid };
    if (!on.has(offP.id) && on.has(inP.id)) [offP, inP] = [inP, offP];
    on.delete(offP.id); on.add(inP.id);
    out.set(e, { off: offP.n, in: inP.n });
  });
  return out;
}

// টাইব্রেকারের শট (উৎস এগুলোকে "Goal" বলে, মন্তব্যে "Penalty Shootout") — নিয়মিত গোল থেকে আলাদা
const isSO = (e) => /shootout/i.test(e?.c || "");
function Shootout({ L, m, lang, card }) {
  const bn = lang === "bn";
  const so = (L.events || []).filter(isSO);
  if (!so.length) return null;
  let h = 0, a = 0;
  const rows = so.map((e, i) => {
    const ok = !/Missed/i.test(e.d || "");
    if (ok) { if (e.s === "a") a++; else h++; }
    return (
      <div key={i} className={"so-r " + (e.s === "a" ? "so-a" : "so-h")}>
        <span className="so-n">{bnPlayer(e.p, lang)}</span>
        <SoccerBall size={16} miss={!ok} />
        <span className="so-sc">{num(h, lang)}–{num(a, lang)}</span>
      </div>
    );
  });
  const head = <div className="so-h-row"><b>{bn ? "টাইব্রেকার" : "Penalty shootout"}</b><span>{teamName(m.home, lang)} {num(m.pen_home ?? h, lang)}–{num(m.pen_away ?? a, lang)} {teamName(m.away, lang)}</span></div>;
  return card ? <div className="cm so-card">{head}<div className="so-list">{rows}</div></div> : <div className="so-box">{head}<div className="so-list">{rows}</div></div>;
}
function MatchEvents({ L, m, lang }) {
  const bn = lang === "bn";
  const subs = useMemo(() => subPairs(L), [L]);
  const ev = [...(L.events || [])].filter((e) => !isSO(e)).sort((x, y) => (x.m ?? 0) - (y.m ?? 0) || (x.x ?? 0) - (y.x ?? 0));
  if (!ev.length) return <div className="mc-empty muted">{bn ? "এখনো কোনো ঘটনা নেই" : "No events yet"}</div>;
  // গোলের পর চলমান স্কোর
  let h = 0, a = 0;
  const rows = [];
  let htShown = false;
  for (const e of ev) {
    if (!htShown && (e.m ?? 0) > 45) { rows.push(<div key="ht" className="ev-sep"><span>{bn ? "বিরতি" : "Half time"}</span></div>); htShown = true; }
    const goal = e.t === "Goal" && !/Missed/i.test(e.d || "");
    if (goal) { if (e.s === "h") h++; else if (e.s === "a") a++; }
    const sp = subs.get(e);
    const main = sp ? sp.in : e.p;
    const sub = sp ? (bn ? `মাঠ ছাড়লেন ${bnPlayer(sp.off, lang)}` : `Off: ${sp.off}`)
      : e.t === "Goal" && e.a && !/Own|Missed/i.test(e.d || "") ? (bn ? `অ্যাসিস্ট: ${bnPlayer(e.a, lang)}` : `Assist: ${e.a}`)
      : EV_BN[e.d] && (bn ? EV_BN[e.d] : e.d !== "Normal Goal" ? e.d : null);
    rows.push(
      <div key={rows.length} className={"ev " + (e.s === "a" ? "ev-a" : "ev-h") + (goal ? " goal" : "")}>
        <span className="ev-min">{minuteTxt(e.m ?? 0, e.x, lang)}</span>
        <EvIcon e={e} />
        <span className="ev-txt"><b>{main ? bnPlayer(main, lang) : "—"}</b>{sub ? <small className="muted">{e.t === "Goal" && e.a && !/Own|Missed/i.test(e.d || "") ? <BootIcon size={12} className="ev-boot" /> : null}{e.t === "Var" ? "VAR · " : ""}{sub}</small> : null}</span>
        {goal ? <span className="ev-sc">{num(h, lang)} - {num(a, lang)}</span> : <span />}
      </div>
    );
  }
  if (AF_DONE.includes(L.status)) rows.push(<div key="ft" className="ev-sep"><span>{bn ? "খেলা শেষ" : "Full time"} · {num(m.home_score ?? h, lang)} - {num(m.away_score ?? a, lang)}</span></div>);
  return <div className="ev-list">{rows}<Shootout L={L} m={m} lang={lang} /></div>;
}

const STAT_ORDER = [
  ["Ball Possession", "বল দখল"], ["expected_goals", "এক্সপেক্টেড গোল (xG)"], ["Total Shots", "মোট শট"], ["Shots on Goal", "লক্ষ্যে শট"],
  ["Shots insidebox", "বক্সের ভেতর থেকে শট"], ["Corner Kicks", "কর্নার"], ["Goalkeeper Saves", "গোলরক্ষকের সেভ"], ["Total passes", "মোট পাস"],
  ["Passes %", "পাসের নির্ভুলতা"], ["Fouls", "ফাউল"], ["Offsides", "অফসাইড"], ["Yellow Cards", "হলুদ কার্ড"], ["Red Cards", "লাল কার্ড"],
];
const statNum = (v) => (v == null ? 0 : parseFloat(String(v).replace("%", "")) || 0);
function MatchStats({ L, lang }) {
  const bn = lang === "bn";
  const S = L.stats || [];
  const rows = STAT_ORDER.map(([k, b]) => [S.find((x) => x.k === k), bn ? b : k === "expected_goals" ? "Expected goals (xG)" : k]).filter(([x]) => x && (x.h != null || x.a != null));
  if (!rows.length) return <div className="mc-empty muted">{bn ? "পরিসংখ্যান এখনো আসেনি" : "No stats yet"}</div>;
  const show = (v) => (v == null ? num(0, lang) : num(String(v), lang));
  return (
    <div className="st-list">
      {rows.map(([x, label]) => {
        const h = statNum(x.h), a = statNum(x.a), t = h + a || 1;
        const pos = x.k === "Ball Possession";
        return (
          <div key={x.k} className="st-row">
            <div className="st-top"><b className={h > a ? "hi" : ""}>{show(x.h)}</b><span>{label}</span><b className={a > h ? "hi" : ""}>{show(x.a)}</b></div>
            {pos
              ? <div className="st-split"><i className="h" style={{ width: `${(h / t) * 100}%` }} /><i className="a" style={{ width: `${(a / t) * 100}%` }} /></div>
              : <div className="st-bars"><span><i className={"h" + (h >= a ? " lead" : "")} style={{ width: `${(h / t) * 100}%` }} /></span><span><i className={"a" + (a >= h ? " lead" : "")} style={{ width: `${(a / t) * 100}%` }} /></span></div>}
          </div>
        );
      })}
    </div>
  );
}

// ── ফুটবলের আইকন (সাদা-কালো, পঞ্চভুজ): গোলদাতা, ঘটনা, লাইনআপে ──
const BALL_RIM = ["12.00,5.00 7.82,1.96 9.41,-2.96 14.59,-2.96 16.18,1.96", "18.66,9.84 20.26,4.92 25.43,4.92 27.03,9.84 22.84,12.88", "16.11,17.66 21.29,17.66 22.89,22.58 18.70,25.62 14.52,22.58", "7.89,17.66 9.48,22.58 5.30,25.62 1.11,22.58 2.71,17.66", "5.34,9.84 1.16,12.88 -3.03,9.84 -1.43,4.92 3.74,4.92"];
let ballSeq = 0;
function SoccerBall({ size = 16, own, miss, className = "" }) {
  const id = useMemo(() => "sb" + ++ballSeq, []);
  const ink = own ? "#dc2626" : "#1f2937";
  // সাদা বল, ভেতরে কালো প্যাচ; প্যাচ কিনারা ছোঁয় না আর বাইরে আলাদা দাগ, তাই ডার্ক মোডেও গোল বলই দেখায়
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={"sball " + className}>
      <defs><clipPath id={id}><circle cx="12" cy="12" r="10.2" /></clipPath></defs>
      <circle cx="12" cy="12" r="11.2" fill="#fff" />
      <g clipPath={`url(#${id})`} fill={ink}>
        {BALL_RIM.map((pt, i) => <polygon key={i} points={pt} />)}
      </g>
      <path d="M12.00 8.10L12.00 4.60 M15.71 10.79L19.04 9.71 M14.29 15.16L16.35 17.99 M9.71 15.16L7.65 17.99 M8.29 10.79L4.96 9.71" stroke={ink} strokeWidth="1.4" />
      <polygon points="12.00,8.10 15.71,10.79 14.29,15.16 9.71,15.16 8.29,10.79" fill={ink} />
      <circle className="sb-ring" cx="12" cy="12" r="10.9" fill="none" strokeWidth="1.1" />
      {miss && <path d="M4 4l16 16" stroke="#dc2626" strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
}
// অ্যাসিস্টের আইকন: ফুটবল বুট (পাশ থেকে, তলায় স্টাড)
const BootIcon = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={"boot " + className}>
    <circle cx="12" cy="12" r="11.4" fill="#fff" stroke="#1f2937" strokeWidth="1" />
    <g transform="translate(0 -1.6)" fill="#1f2937">
      <path d="M4.3 8.6H8.2c.9 0 1.5.5 2.2 1.2l1.3 1.3c.8.7 2.2 1.1 4.3 1.4 2.7.3 4.4 1.2 4.4 2.5v.7H3.3v-5c0-1.2.4-2.1 1-2.1z" />
      <rect x="3.1" y="16.4" width="17.6" height="1.2" rx=".6" />
      <path d="M5 17.6v1.3M8.2 17.6v1.3M14.4 17.6v1.3M17.8 17.6v1.3" stroke="#1f2937" strokeWidth="1.6" strokeLinecap="round" />
      {size >= 16 && <path d="M9.4 10.6l1-.9M10.9 11.9l1-.9M12.5 12.9l.9-.8" stroke="#fff" strokeWidth=".85" strokeLinecap="round" />}
    </g>
  </svg>
);
const BootMini = ({ n, size = 12 }) => (
  <span className="ball-mini"><BootIcon size={size} />{n > 1 ? <b>×{n}</b> : null}</span>
);
const BallMini = ({ n, size = 12 }) => (
  <span className="ball-mini"><SoccerBall size={size} />{n > 1 ? <b>×{n}</b> : null}</span>
);
const rateCls = (r) => (r >= 8 ? "r-top" : r >= 7 ? "r-hi" : r >= 6 ? "r-ok" : "r-lo");
const rateTxt = (r, lang) => num(r.toFixed(1), lang);
const unEnt = (s) => (s || "").replace(/&(amp|apos|quot|#39);/g, (_, k) => ({ amp: "&", apos: "'", quot: '"', "#39": "'" })[k]);
// মাঠ আর গোলদাতার সারির জন্য ছোট নাম (বাংলায় পদবি)
const shortName = (n, lang) => { if (lang !== "bn") return lastName(n); const b = bnPlayer(unEnt(n), lang); const w = b.split(" "); return w.length > 1 && !/^(দি|দে|ডি|ভান|আল|এল|বেন)$/.test(w[w.length - 2]) ? w[w.length - 1] : w.slice(-2).join(" "); };
const lastName = (n0) => { const n = unEnt(n0); const p = (n || "").split(" "); return p.length > 1 && /\.$/.test(p[0]) ? p.slice(1).join(" ") : p[p.length - 1] || n; };
// লাইনআপের প্লেয়ারদের বয়স, দেশ আর সিজনের গোল-অ্যাসিস্ট (দল ধরে, একবার এনে জমা)
const tsCache = {};
function useTeamStats(tid, season, on) {
  const k = tid + ":" + season;
  const [d, setD] = useState(tsCache[k] || null);
  useEffect(() => {
    if (!on || !tid || DEMO) return;
    if (tsCache[k]) { setD(tsCache[k]); return; }
    let a = true;
    fetch(`/api/live?tstats=${tid}&season=${season}`).then((r) => (r.ok ? r.json() : {})).then((x) => { tsCache[k] = x || {}; a && setD(tsCache[k]); }).catch(() => a && setD({}));
    return () => { a = false; };
  }, [k, on]);
  return d;
}
// দেশের নাম → পতাকার কোড (flagcdn)
const NAT_ISO = { Spain: "es", France: "fr", Germany: "de", Italy: "it", England: "gb-eng", Scotland: "gb-sct", Wales: "gb-wls", "Northern Ireland": "gb-nir", Ireland: "ie", Portugal: "pt", Brazil: "br", Argentina: "ar", Netherlands: "nl", Belgium: "be", Croatia: "hr", Uruguay: "uy", Colombia: "co", Norway: "no", Denmark: "dk", Sweden: "se", Switzerland: "ch", Austria: "at", Poland: "pl", Serbia: "rs", Turkey: "tr", "Türkiye": "tr", Ukraine: "ua", Russia: "ru", "Czech Republic": "cz", Czechia: "cz", Slovakia: "sk", Slovenia: "si", Hungary: "hu", Romania: "ro", Greece: "gr", Bulgaria: "bg", Albania: "al", Kosovo: "xk", Georgia: "ge", Armenia: "am", Finland: "fi", Iceland: "is", Morocco: "ma", Algeria: "dz", Tunisia: "tn", Egypt: "eg", Senegal: "sn", Nigeria: "ng", Ghana: "gh", "Ivory Coast": "ci", "Côte d'Ivoire": "ci", Cameroon: "cm", Mali: "ml", "Guinea": "gn", "Burkina Faso": "bf", "DR Congo": "cd", "Congo DR": "cd", Gabon: "ga", "South Africa": "za", Japan: "jp", "South Korea": "kr", "Korea Republic": "kr", Australia: "au", "Saudi Arabia": "sa", Iran: "ir", Qatar: "qa", "United Arab Emirates": "ae", USA: "us", "United States": "us", Canada: "ca", Mexico: "mx", Chile: "cl", Peru: "pe", Ecuador: "ec", Paraguay: "py", Venezuela: "ve", Bolivia: "bo", "Costa Rica": "cr", Jamaica: "jm", Honduras: "hn", Panama: "pa", "Bosnia and Herzegovina": "ba", "North Macedonia": "mk", Montenegro: "me", Bangladesh: "bd", India: "in", Nepal: "np", Bhutan: "bt", "Sri Lanka": "lk", Pakistan: "pk", Uzbekistan: "uz", China: "cn", Israel: "il", "Cape Verde": "cv", "Cape Verde Islands": "cv", Zambia: "zm", Zimbabwe: "zw", Kenya: "ke", Angola: "ao", Mozambique: "mz", "New Zealand": "nz", Haiti: "ht", "Guinea-Bissau": "gw", "Equatorial Guinea": "gq", Benin: "bj", Togo: "tg", Luxembourg: "lu", Cyprus: "cy", Malta: "mt", Lithuania: "lt", Latvia: "lv", Estonia: "ee", Belarus: "by", Moldova: "md", Kazakhstan: "kz", Iraq: "iq", Jordan: "jo", Syria: "sy", Lebanon: "lb", Oman: "om", Bahrain: "bh", Kuwait: "kw", Libya: "ly", Sudan: "sd", Ethiopia: "et", Uganda: "ug", Tanzania: "tz", Rwanda: "rw", Comoros: "km", Madagascar: "mg", Mauritania: "mr", Gambia: "gm", "Sierra Leone": "sl", Liberia: "lr", Niger: "ne", Chad: "td", Burundi: "bi", Curacao: "cw", "Curaçao": "cw", Suriname: "sr", Guyana: "gy", "Trinidad and Tobago": "tt", "El Salvador": "sv", Guatemala: "gt", Nicaragua: "ni", Cuba: "cu", "Dominican Republic": "do", "Faroe Islands": "fo", Andorra: "ad", "San Marino": "sm", Liechtenstein: "li", Gibraltar: "gi", Azerbaijan: "az", Tajikistan: "tj", Kyrgyzstan: "kg", Turkmenistan: "tm", Afghanistan: "af", Thailand: "th", Vietnam: "vn", Indonesia: "id", Malaysia: "my", Philippines: "ph", Singapore: "sg", Myanmar: "mm" };
const flagUrl = (nat) => (NAT_ISO[nat] ? `https://flagcdn.com/w40/${NAT_ISO[nat]}.png` : null);

function PitchMan({ p, st, side, mode = "r", ts }) {
  const { lang } = useT();
  const [noPic, setNoPic] = useState(false);
  const nav = useNav();
  return (
    <button className={"pm pm-" + side} onClick={() => p.id && nav.openPlayer(10000000 + p.id)}>
      <span className="pm-shirt">{p.id && !noPic ? <img src={imgUrl(`https://media.api-sports.io/football/players/${p.id}.png`, 38)} alt="" loading="lazy" onError={() => setNoPic(true)} /> : (p.no ?? "")}
        {mode === "r" && st?.r ? <em className={"pm-r " + rateCls(st.r)}>{rateTxt(st.r, lang)}</em> : null}
        {mode === "age" && ts?.age != null ? <em className="pm-x">{num(ts.age, lang)}</em> : null}
        {mode === "nat" && flagUrl(ts?.nat) ? <em className="pm-flag"><img src={flagUrl(ts.nat)} alt={ts.nat} loading="lazy" /></em> : null}
        {st?.cap ? <em className="pm-c">C</em> : null}
        {st?.g ? <em className="pm-g"><BallMini n={st.g} /></em> : null}
        {st?.as ? <em className="pm-as"><BootMini n={st.as} /></em> : null}
        {st?.rc ? <em className="pm-card red" /> : st?.yc ? <em className="pm-card" /> : null}
      </span>
      {mode === "s" && ts ? (
        <span className="pm-ss">
          <span><SoccerBall size={11} />{num(ts.g || 0, lang)}</span>
          <span><BootIcon size={11} />{num(ts.a || 0, lang)}</span>
        </span>
      ) : null}
      <span className="pm-n">{shortName(p.n, lang)}</span>
    </button>
  );
}
function TeamHalf({ T, side, P, mode, TS }) {
  const rows = {};
  for (const p of T.xi) { const [r, c] = (p.g || "").split(":").map(Number); if (!r || !c) return null; (rows[r] ||= []).push({ ...p, c }); }
  const keys = Object.keys(rows).map(Number).sort((x, y) => x - y);
  const n = keys.length;
  return keys.map((r, i) => {
    const list = rows[r].sort((x, y) => x.c - y.c);
    // ঘরের দল নিচে (গোলরক্ষক একদম নিচে), অতিথি দল ওপরে; মুখোমুখি দেখাতে এক দিকের সারি উল্টো
    // প্রতিটা অর্ধে সারিগুলো সমান দূরে; মাঝরেখার কাছে ফাঁকা রাখা যাতে দুই দলের খেলোয়াড় একে অপরের ওপর না পড়ে
    const y = side === "h" ? 93 - (i / Math.max(1, n - 1)) * 36 : 5 + (i / Math.max(1, n - 1)) * 36;
    const w = Math.min(25, 100 / list.length - 1);
    return list.map((p, j) => {
      const x = ((j + 0.5) / list.length) * 100;
      // API-Football-এ কলাম ১ = দলের বাঁ দিক; ঘরের দল ওপরের দিকে খেলে, তাই বাঁ দিক পর্দার বাঁয়ে, অতিথির উল্টো
      return <div key={p.id || p.n} className="pm-wrap" style={{ left: `${side === "h" ? x : 100 - x}%`, top: `${y}%`, width: `${w}%` }}><PitchMan p={p} st={P?.[p.id]} side={side} mode={mode} ts={TS?.[p.id]} /></div>;
    });
  });
}
function MatchLineups({ L, m, lang }) {
  const bn = lang === "bn";
  const nav = useNav();
  const { h, a } = L.lineups || {};
  const [mode, setMode] = useState("r");
  const tsH = useTeamStats(h?.tid, m.season, mode !== "r");
  const tsA = useTeamStats(a?.tid, m.season, mode !== "r");
  if (!h?.xi?.length || !a?.xi?.length) return <div className="mc-empty muted">{bn ? "লাইনআপ সাধারণত খেলা শুরুর প্রায় এক ঘণ্টা আগে আসে" : "Lineups usually arrive about an hour before kickoff"}</div>;
  const P = L.players || {};
  const grid = h.xi.every((p) => p.g) && a.xi.every((p) => p.g);
  const best = Object.entries(P).filter(([, s]) => s.r).sort((x, y) => y[1].r - x[1].r)[0];
  const allP = [...h.xi, ...h.sub, ...a.xi, ...a.sub];
  const bestP = best && AF_DONE.includes(L.status) ? allP.find((p) => String(p.id) === best[0]) : null;
  const hasTid = !!(h.tid && a.tid);
  const avg = (T) => { const r = T.xi.map((p) => P[p.id]?.r).filter(Boolean); return r.length >= 8 ? r.reduce((x, y) => x + y, 0) / r.length : null; };
  const avgH = avg(h), avgA = avg(a);
  const modes = [["r", bn ? "রেটিং" : "Rating"], ["s", bn ? "সিজন" : "Season"], ["age", bn ? "বয়স" : "Age"], ["nat", bn ? "দেশ" : "Country"]];
  const subList = (T, side) => (
    <div className="lu-subs">
      <div className="lu-h"><Crest team={side === "h" ? m.home : m.away} size={18} /><b>{teamShort(side === "h" ? m.home : m.away, lang)}</b>{T.coach && <small className="muted">{bn ? "কোচ" : "Coach"}: {T.coach}</small>}</div>
      {T.sub.map((p) => { const s = P[p.id]; return (
        <button key={p.id || p.n} className={"lu-p" + (s?.min ? " played" : "")} onClick={() => p.id && nav.openPlayer(10000000 + p.id)}>
          <span className="lu-no">{p.no ?? ""}</span><span className="lu-n">{bnPlayer(p.n, lang)}</span>
          {s?.g ? <span className="lu-ev"><BallMini n={s.g} /></span> : null}
          {s?.r ? <em className={"pm-r " + rateCls(s.r)}>{rateTxt(s.r, lang)}</em> : null}
        </button>
      ); })}
    </div>
  );
  return (
    <>
      {bestP && (
        <div className="lu-best"><span className={"pm-r big " + rateCls(best[1].r)}>{rateTxt(best[1].r, lang)}</span>
          <span><small className="muted">{bn ? "ম্যাচ সেরা" : "Player of the match"}</small><b>{bnPlayer(bestP.n, lang)}</b></span></div>
      )}
      {grid ? (
        <div className="pitch-card">
          {hasTid && <div className="lu-modes">{modes.map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>)}</div>}
          <div className="pitch-team">{avgA ? <em className={"pm-r " + rateCls(avgA)}>{rateTxt(avgA, lang)}</em> : null}<Crest team={m.away} size={20} /><b>{teamShort(m.away, lang)}</b><span>{num(a.f || "", lang)}</span></div>
          <div className="pitch">
            <div className="pitch-lines" aria-hidden="true"><i className="half" /><i className="circle" /><i className="spot" /><i className="pbox pb-t" /><i className="pbox pb-b" /><i className="gbox gb-t" /><i className="gbox gb-b" /></div>
            <TeamHalf T={a} side="a" P={P} mode={mode} TS={tsA} />
            <TeamHalf T={h} side="h" P={P} mode={mode} TS={tsH} />
          </div>
          <div className="pitch-team">{avgH ? <em className={"pm-r " + rateCls(avgH)}>{rateTxt(avgH, lang)}</em> : null}<Crest team={m.home} size={20} /><b>{teamShort(m.home, lang)}</b><span>{num(h.f || "", lang)}</span></div>
        </div>
      ) : (
        <div className="lu-cols">{[["h", h], ["a", a]].map(([sd, T]) => (
          <div key={sd} className="lu-subs"><div className="lu-h"><b>{teamShort(sd === "h" ? m.home : m.away, lang)}</b><small className="muted">{T.f}</small></div>
            {T.xi.map((p) => <button key={p.id || p.n} className="lu-p played" onClick={() => p.id && nav.openPlayer(10000000 + p.id)}><span className="lu-no">{p.no}</span><span className="lu-n">{bnPlayer(p.n, lang)}</span>{P[p.id]?.r ? <em className={"pm-r " + rateCls(P[p.id].r)}>{rateTxt(P[p.id].r, lang)}</em> : null}</button>)}
          </div>))}</div>
      )}
      <div className="sec-h" style={{ margin: "14px 0 6px" }}><h2>{bn ? "বদলি খেলোয়াড়" : "Substitutes"}</h2></div>
      <div className="lu-cols">{subList(h, "h")}{subList(a, "a")}</div>
    </>
  );
}

function MatchCenter({ L, m }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const hasEv = (L.events || []).length > 0, hasLu = !!(L.lineups?.h?.xi?.length), hasSt = !!(L.stats || []).length;
  const tabs = [hasEv || isLive(m) || isDone(m) ? ["ev", bn ? "ঘটনা" : "Events"] : null, hasLu ? ["lu", bn ? "লাইনআপ" : "Lineups"] : null, hasSt ? ["st", bn ? "পরিসংখ্যান" : "Stats"] : null].filter(Boolean);
  const [tab, setTab] = useState(null);
  if (!tabs.length) return null;
  const cur = tabs.some(([k]) => k === tab) ? tab : tabs[0][0];
  return (
    <div className="mc">
      {tabs.length > 1 && <div className="seg mc-seg">{tabs.map(([k, l]) => <button key={k} className={cur === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>}
      <div className="mc-body">
        {cur === "ev" && <MatchEvents L={L} m={m} lang={lang} />}
        {cur === "lu" && <MatchLineups L={L} m={m} lang={lang} />}
        {cur === "st" && <MatchStats L={L} lang={lang} />}
      </div>
    </div>
  );
}

// স্কোরের নিচে গোলদাতা (FotMob-এর মতো): একই খেলোয়াড়ের সব গোল এক সারিতে
function Scorers({ L, lang }) {
  const bn = lang === "bn";
  const goals = (L?.events || []).filter((e) => e.t === "Goal" && !/Missed/i.test(e.d || "") && !isSO(e));
  if (!goals.length) return null;
  const side = (sd) => {
    const by = new Map();
    for (const e of goals.filter((g) => g.s === sd)) {
      const k = e.p || "";
      const tag = /Own/i.test(e.d || "") ? (bn ? " (আত্মঘাতী)" : " (OG)") : /Penalty/i.test(e.d || "") ? (bn ? " (পেনাল্টি)" : " (P)") : "";
      (by.get(k) || by.set(k, []).get(k)).push(minuteTxt(e.m ?? 0, e.x, lang) + tag);
    }
    return [...by].map(([n, ms]) => sd === "h"
      ? <div key={n}>{n && <b>{shortName(n, lang)}</b>} <span>{ms.join(", ")}</span> <SoccerBall size={13} /></div>
      : <div key={n}><SoccerBall size={13} /> {n && <b>{shortName(n, lang)}</b>} <span>{ms.join(", ")}</span></div>);
  };
  return (
    <div className="ms-goals">
      <div className="h">{side("h")}</div>
      <div className="a">{side("a")}</div>
    </div>
  );
}

// ── ধারাভাষ্য: প্রতিটা ঘটনা আলাদা কার্ডে (নতুনটা ওপরে), খেলোয়াড়ের ছবি-নম্বর আর বাংলায় এক লাইনের বর্ণনা ──
function CmPlayer({ id, name, team, no, lang, badge }) {
  const nav = useNav();
  const [bad, setBad] = useState(false);
  return (
    <button className="cm-pl" onClick={() => id && nav.openPlayer(10000000 + id)}>
      <Crest team={team} size={26} />
      <span className="cm-pl-n">{no != null && <small>{num(no, lang)}</small>}<b>{bnPlayer(name, lang)}</b></span>
      <span className="cm-ph">{id && !bad ? <img src={imgUrl(`https://media.api-sports.io/football/players/${id}.png`, 40)} alt="" loading="lazy" onError={() => setBad(true)} /> : <i>{(bnPlayer(name, lang) || "?").slice(0, 1)}</i>}{badge && <em>{badge}</em>}</span>
    </button>
  );
}
function MatchCommentary({ L, m, lang }) {
  const bn = lang === "bn";
  const subs = useMemo(() => subPairs(L), [L]);
  const noOf = useMemo(() => { const o = {}; for (const T of [L.lineups?.h, L.lineups?.a]) for (const p of [...(T?.xi || []), ...(T?.sub || [])]) o[p.id] = p.no; return o; }, [L]);
  const ev = [...(L.events || [])].filter((e) => !isSO(e)).sort((x, y) => (x.m ?? 0) - (y.m ?? 0) || (x.x ?? 0) - (y.x ?? 0));
  if (!ev.length) return <div className="card empty">{bn ? "খেলা শুরু হলে এখানে প্রতিটা মুহূর্ত আসবে" : "Moments appear here once the match starts"}</div>;
  const tn = (sd) => teamName(sd === "h" ? m.home : m.away, lang);
  const team = (sd) => (sd === "h" ? m.home : m.away);
  let h = 0, a = 0;
  const cards = [];
  for (const e of ev) {
    const sd = e.s === "a" ? "a" : "h", other = sd === "h" ? "a" : "h";
    const mt = minuteTxt(e.m ?? 0, e.x, lang);
    const d = e.d || "";
    if (e.t === "Goal" && !/Missed/i.test(d)) {
      const own = /Own/i.test(d), pen = /Penalty/i.test(d);
      const before = sd === "h" ? h - a : a - h;
      if (sd === "h") h++; else a++;
      const sc = `${num(h, lang)}–${num(a, lang)}`;
      const line = bn
        ? `${own ? `আত্মঘাতী গোল! ${tn(sd)} পেল উপহারের গোল` : (e.p ? `${bnPlayer(e.p, lang)}${pen ? " পেনাল্টি থেকে" : ""} গোল করলেন` : "গোল")}। ${before === 0 ? `${tn(sd)} এগিয়ে গেল` : before === -1 ? `${tn(sd)} সমতায় ফিরল` : before < -1 ? `${tn(sd)} ব্যবধান কমাল` : `${tn(sd)} ব্যবধান বাড়াল`} (${sc})।`
        : `${own ? `Own goal! ${tn(sd)} benefit` : (e.p ? `${e.p} scores${pen ? " from the spot" : ""}` : "Goal")}. ${before === 0 ? `${tn(sd)} take the lead` : before === -1 ? `${tn(sd)} equalise` : before < -1 ? `${tn(sd)} pull one back` : `${tn(sd)} extend the lead`} (${sc}).`;
      cards.push(
        <div key={cards.length} className="cm cm-goal">
          <div className="cm-h"><span className="cm-min">{mt}</span><b>{own ? (bn ? "আত্মঘাতী গোল!" : "Own goal!") : (bn ? "গোল!" : "Goal!")}</b><span className="cm-sc">{sc}</span></div>
          <CmPlayer id={e.pid} name={e.p} team={own ? team(other) : team(sd)} no={noOf[e.pid]} lang={lang} badge={<SoccerBall size={18} own={own} />} />
          <p className="cm-txt">{line}</p>
          {e.a && !own && (
            <>
              <div className="cm-sub-h"><BootIcon size={16} /> {bn ? "অ্যাসিস্ট" : "Assist"}</div>
              <CmPlayer id={e.aid} name={e.a} team={team(sd)} no={noOf[e.aid]} lang={lang} badge={<BootIcon size={18} />} />
            </>
          )}
        </div>
      );
    } else if (e.t === "Goal") {
      cards.push(<div key={cards.length} className="cm"><div className="cm-h"><span className="cm-min">{mt}</span><b>{bn ? "পেনাল্টি মিস" : "Penalty missed"}</b></div><CmPlayer id={e.pid} name={e.p} team={team(sd)} no={noOf[e.pid]} lang={lang} badge={<SoccerBall size={18} miss />} /></div>);
    } else if (e.t === "Card") {
      const red = /Red|Second/i.test(d);
      cards.push(
        <div key={cards.length} className={"cm" + (red ? " cm-red" : "")}>
          <div className="cm-h"><span className="cm-min">{mt}</span><b>{bn ? (/Second/i.test(d) ? "দ্বিতীয় হলুদ, লাল কার্ড" : red ? "লাল কার্ড" : "হলুদ কার্ড") : d}</b><EvIcon e={e} /></div>
          <CmPlayer id={e.pid} name={e.p} team={team(sd)} no={noOf[e.pid]} lang={lang} />
          {e.c && <p className="cm-txt muted">{e.c}</p>}
        </div>
      );
    } else if (e.t === "subst") {
      const sp = subs.get(e) || { in: e.a, off: e.p };
      const inId = sp.in === e.p ? e.pid : e.aid, offId = sp.in === e.p ? e.aid : e.pid;
      cards.push(
        <div key={cards.length} className="cm">
          <div className="cm-h"><span className="cm-min">{mt}</span><b>{bn ? `বদলি · ${tn(sd)}` : `Substitution · ${tn(sd)}`}</b></div>
          <div className="cm-subs">
            <div className="cm-in"><span className="cm-arr in">↑</span><CmPlayer id={inId} name={sp.in} team={team(sd)} no={noOf[inId]} lang={lang} /></div>
            <div className="cm-out"><span className="cm-arr out">↓</span><CmPlayer id={offId} name={sp.off} team={team(sd)} no={noOf[offId]} lang={lang} /></div>
          </div>
        </div>
      );
    } else {
      cards.push(<div key={cards.length} className="cm"><div className="cm-h"><span className="cm-min">{mt}</span><b>VAR</b></div><p className="cm-txt">{bn ? EV_BN[d] || d : d}{e.p ? ` · ${bnPlayer(e.p, lang)}` : ""}</p></div>);
    }
  }
  if ((L.events || []).some(isSO)) cards.push(<Shootout key="so" L={L} m={m} lang={lang} card />);
  if (AF_DONE.includes(L.status)) cards.push(<div key="ft" className="cm cm-mark"><b>{bn ? "খেলা শেষ" : "Full time"}</b><span>{teamName(m.home, lang)} {num(m.home_score ?? h, lang)}–{num(m.away_score ?? a, lang)} {teamName(m.away, lang)}</span></div>);
  return <div className="cm-list">{cards.filter(Boolean).reverse()}</div>;
}

// ম্যাচের পাতা খোলা থাকলে লাইভ বিস্তারিত আনা, খেলা চললে প্রতি মিনিটে নতুন করে
// খেলা শেষে বাংলায় ম্যাচ রিপোর্ট (গোল, কার্ড, স্ট্যাটস থেকে নিজে থেকে লেখা; report.js)
function MatchReport({ m, L, lang }) {
  const [full, setFull] = useState(false);
  const bn = lang === "bn";
  const r = useMemo(() => (L?.events ? matchReport(m, L, { lang, tn: (t) => teamName(t, lang), pn: (n) => (bn ? bnPlayer(n, "bn") : n), comp: mComp(m, lang) }) : null), [m?.id, m?.status, m?.home_score, m?.away_score, L, lang]);
  if (!r) return null;
  const show = full ? r.paras : r.paras.slice(0, 2);
  return (
    <article className="card mrep">
      <div className="mrep-k">{bn ? "ম্যাচ রিপোর্ট" : "Match report"}</div>
      <h3>{r.title}</h3>
      {show.map((p, i) => <p key={i}>{p}</p>)}
      {r.paras.length > 2 && <button className="link" onClick={() => setFull(!full)}>{full ? (bn ? "কম দেখুন" : "Show less") : (bn ? "পুরোটা পড়ুন" : "Read more")}</button>}
    </article>
  );
}
// খেলা শেষে বাংলায় ম্যাচ রিপোর্ট
function useMatchLive(m) {
  const [L, setL] = useState(null);
  useEffect(() => {
    if (!m?.id) return;
    let alive = true;
    let asked = false;
    const pull = () => {
      if (document.visibilityState !== "visible") return;
      getLiveFull(m.id).then((r) => {
        if (!alive) return;
        setL(r);
        // শেষ হওয়া পুরনো ম্যাচের বিস্তারিত না থাকলে একবার আনিয়ে নেওয়া (সার্ভার জমিয়ে রাখে)
        if (!DEMO && !asked && !r?.events && m.status === "FINISHED" && Date.now() - Date.parse(m.utc_date) > 2 * 3600000) {
          asked = true;
          fetch(`/api/live?match=${m.id}`).then((x) => x.json()).then((d) => alive && d?.row && setL(d.row)).catch(() => {});
        }
      }).catch(() => {});
    };
    pull();
    const t0 = Date.parse(m.utc_date), near = Date.now() > t0 - 90 * 60000 && Date.now() < t0 + 4 * 3600000;
    const i = near ? setInterval(pull, 60000) : null;
    document.addEventListener("visibilitychange", pull);
    return () => { alive = false; if (i) clearInterval(i); document.removeEventListener("visibilitychange", pull); };
  }, [m?.id]);
  return L;
}

// ── ম্যাচের পুরো পাতা (/match/আইডি): উপরে স্কোর, নিচে ট্যাব — সংক্ষেপ, লাইনআপ, টেবিল, পরিসংখ্যান, মুখোমুখি ──
function MatchTable({ m, lang }) {
  const nav = useNav();
  const bn = lang === "bn";
  const code = m.competition_code;
  const [table, setTable] = useState(() => keep.get("st:" + code) ?? null);
  // খেলা চলার সময় টেবিল প্রতি মিনিটে নতুন (গোল হলেই পয়েন্ট বদলায়)
  useEffect(() => {
    let a = true;
    const load = (first) => getStandings(code).then((r) => a && setTable(r)).catch(() => a && first && setTable([]));
    load(true);
    const iv = everyMin(() => load(false));
    return () => { a = false; iv(); };
  }, [code]);
  if (table === null) return <Loading />;
  if (!table.length) return <div className="card empty">{bn ? "এই প্রতিযোগিতার টেবিল এখনো আসেনি" : "No table yet"}</div>;
  const mine = (id) => id === m.home_id || id === m.away_id;
  return (
    <div className="card">
      <div className="tbl tbl-h">
        <span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "ম্যাচ" : "P"}</span><span>{bn ? "জয়" : "W"}</span><span>{bn ? "ড্র" : "D"}</span><span>{bn ? "হার" : "L"}</span><span>+/-</span><span>{bn ? "পয়েন্ট" : "Pts"}</span>
      </div>
      {table.map((r) => (
        <button key={r.team_id} className={"tbl " + zone(code, r.position, table.length) + (mine(r.team_id) ? " tbl-me" : "")} onClick={() => nav.openTeam(r.team_id)}>
          <span className="pos">{num(r.position, lang)}</span>
          <span className="tm"><Crest team={r.team} size={20} /><b>{teamName(r.team, lang)}</b></span>
          <span>{num(r.played, lang)}</span><span>{num(r.won, lang)}</span><span>{num(r.draw, lang)}</span><span>{num(r.lost, lang)}</span>
          <span>{r.gd > 0 ? "+" : ""}{num(r.gd, lang)}</span>
          <span className="pts">{num(r.points, lang)}</span>
        </button>
      ))}
    </div>
  );
}

// ═════════ নকআউট: দুই লেগ, এমএলএসের ৩ ম্যাচের সিরিজ, রাউন্ডের সব জোড়া ═════════
// এমএলএস কাপ রাউন্ড ওয়ান: ৩ ম্যাচের সিরিজ (ঘরে-বাইরে-ঘরে), ড্র হলে সাথে সাথে টাইব্রেকার, আগে ২ জয় যার সে ওঠে
// রাউন্ডের নাম বাংলায় (football-data আর API-Football দুই ধরনের নামই)
const STAGE_BN = [[/wild.?card/i, "ওয়াইল্ড কার্ড"], [/round of 32|last.?32/i, "শেষ ৩২"], [/round of 16|last.?16|round one/i, "শেষ ষোলো"], [/quarter/i, "কোয়ার্টার ফাইনাল"],
  [/conference semi/i, "কনফারেন্স সেমিফাইনাল"], [/conference final/i, "কনফারেন্স ফাইনাল"], [/semi/i, "সেমিফাইনাল"], [/play.?off/i, "প্লে-অফ"], [/^final$|^FINAL$/i, "ফাইনাল"]];
const stageLabel = (st, lang) => {
  if (!st) return "";
  if (lang === "bn") { const hit = STAGE_BN.find(([re]) => re.test(st)); if (hit) return hit[1]; }
  return st.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
};
const isBo3 = (m) => m?.competition_code === "MLS" && /round of 16|round one/i.test(m?.stage || "");
async function getStageMatches(m) {
  if (DEMO || !m?.stage) return [];
  return ok(await sb.from("matches").select(MATCH_SELECT).eq("competition_code", m.competition_code).eq("season", m.season).eq("stage", m.stage).order("utc_date"));
}
// একটা জোড়ার সব ম্যাচ থেকে: সিরিজের জয় বা মোট গোল
const pairKey = (x) => [x.home_id, x.away_id].sort((a, b) => a - b).join("-");
function tieOf(list, a, b, bo3) {
  const games = list.filter((x) => (x.home_id === a && x.away_id === b) || (x.home_id === b && x.away_id === a)).sort((x, y) => x.utc_date.localeCompare(y.utc_date));
  const out = { games, a, b, wa: 0, wb: 0, ga: 0, gb: 0, played: 0 };
  for (const g of games) {
    if (!(isDone(g) || isLive(g)) || g.home_score == null) continue;
    const sa = g.home_id === a ? g.home_score : g.away_score, sb_ = g.home_id === a ? g.away_score : g.home_score;
    out.ga += sa; out.gb += sb_;
    if (!isDone(g)) continue;
    out.played++;
    let w = sa > sb_ ? "a" : sb_ > sa ? "b" : null;
    if (!w && g.pen_home != null && g.pen_away != null && g.pen_home !== g.pen_away) {
      const pa = g.home_id === a ? g.pen_home : g.pen_away, pb = g.home_id === a ? g.pen_away : g.pen_home;
      w = pa > pb ? "a" : "b";
    }
    if (w === "a") out.wa++; else if (w === "b") out.wb++;
  }
  out.bo3 = bo3;
  out.done = bo3 ? out.wa >= 2 || out.wb >= 2 : games.length > 0 && games.every(isDone);
  out.winner = bo3 ? (out.wa >= 2 ? a : out.wb >= 2 ? b : null) : null;
  return out;
}
const ORD_BN = ["প্রথম", "দ্বিতীয়", "তৃতীয়"], ORD_EN = ["1st", "2nd", "3rd"];
function useStage(m) {
  const [list, setList] = useState(null);
  const key = m && isKnockout(m) ? `${m.competition_code}|${m.season}|${m.stage}` : null;
  useEffect(() => {
    if (!key) { setList(null); return; }
    let a = true;
    const load = () => getStageMatches(m).then((r) => a && setList(r)).catch(() => a && setList([]));
    load();
    const iv = everyMin(() => load());
    return () => { a = false; iv(); };
  }, [key]);
  return list;
}
// ম্যাচের ওপরে ছোট লেখা: "সিরিজের ম্যাচ ১" / "প্রথম লেগ", আর নিচে সিরিজ বা মোট স্কোর
function TieLine({ m, list, lang, where }) {
  const bn = lang === "bn";
  if (!list?.length || !m.home_id) return null;
  const bo3 = isBo3(m);
  const T = tieOf(list, m.home_id, m.away_id, bo3);
  const i = T.games.findIndex((x) => x.id === m.id);
  if (i < 0 || (!bo3 && T.games.length < 2)) return null;
  if (where === "top") {
    const label = bo3 ? (bn ? `সিরিজের ম্যাচ ${num(i + 1, lang)}` : `Game ${i + 1} of 3`) : (bn ? `${ORD_BN[i] || num(i + 1, lang)} লেগ` : `${ORD_EN[i] || i + 1} leg`);
    return <div className="mp-leg">{label}</div>;
  }
  const H = teamShort(m.home, lang), A = teamShort(m.away, lang);
  if (bo3) {
    const wH = T.wa, wA = T.wb;
    if (!T.played) return <div className="mp-tie">{bn ? "৩ ম্যাচের সিরিজ · আগে ২ জয়ে পরের রাউন্ড" : "Best of 3 · first to 2 wins"}</div>;
    const lead = T.winner ? (bn ? `${teamShort(T.winner === m.home_id ? m.home : m.away, lang)} পরের রাউন্ডে` : `${teamShort(T.winner === m.home_id ? m.home : m.away, lang)} advance`) : null;
    return <div className="mp-tie">{bn ? "সিরিজ" : "Series"} · {H} {num(wH, lang)}–{num(wA, lang)} {A}{lead ? ` · ${lead}` : ""}</div>;
  }
  if (i === 0) return null;
  return <div className="mp-tie">{bn ? "দুই লেগ মিলিয়ে" : "Aggregate"} · {H} {num(T.ga, lang)}–{num(T.gb, lang)} {A}</div>;
}
// নকআউট ট্যাব: এই রাউন্ডের সব জোড়া
function KnockoutTab({ m, list, lang, onOpen }) {
  const bn = lang === "bn";
  if (list === null) return <Loading />;
  const bo3 = isBo3(m);
  const seen = new Map();
  for (const x of list) if (x.home_id && x.away_id && !seen.has(pairKey(x))) seen.set(pairKey(x), x);
  const ties = [...seen.values()].map((first) => ({ first, T: tieOf(list, first.home_id, first.away_id, bo3) }));
  if (!ties.length) return <div className="card empty">{bn ? "এই রাউন্ডের তথ্য এখনো আসেনি" : "No round data yet"}</div>;
  const cur = pairKey(m);
  return (
    <>
      <div className="ko-h">{bo3 ? (bn ? "রাউন্ড ওয়ান" : "Round One") : stageLabel(m.stage, lang)}{bo3 ? <span className="muted">{bn ? " · ৩ ম্যাচের সিরিজ" : " · best of 3"}</span> : null}</div>
      <div className="ko-grid">
        {ties.map(({ first, T }) => {
          const tA = first.home, tB = first.away;
          const next = T.games.find((g) => !isDone(g)) || T.games[T.games.length - 1];
          const live = T.games.some(isLive);
          const mid = bo3 ? (T.played || live ? `${num(T.wa, lang)} – ${num(T.wb, lang)}` : dayLabel(dayKey(next.utc_date), lang, { short: true }))
            : (T.games.some((g) => isDone(g) || isLive(g)) ? `${num(T.ga, lang)} – ${num(T.gb, lang)}` : dayLabel(dayKey(next.utc_date), lang, { short: true }));
          const winA = bo3 ? T.winner === T.a : T.done && T.ga > T.gb, winB = bo3 ? T.winner === T.b : T.done && T.gb > T.ga;
          return (
            <button key={pairKey(first)} className={"ko-tie" + (pairKey(first) === cur ? " on" : "")} onClick={() => onOpen?.(next)}>
              <span className={"ko-t" + (winB ? " out" : "")}><Crest team={tA} size={22} /><b>{teamShort(tA, lang)}</b></span>
              <span className={"ko-m" + (/\d\s*–\s*\d|[০-৯]\s*–\s*[০-৯]/.test(mid) ? "" : " d")}>{live && <i className="lv-dot" />}{mid}</span>
              <span className={"ko-t" + (winA ? " out" : "")}><Crest team={tB} size={22} /><b>{teamShort(tB, lang)}</b></span>
            </button>
          );
        })}
      </div>
      {bo3 && <div className="muted ko-note">{bn ? "প্রতি ম্যাচে ড্র হলে অতিরিক্ত সময় নেই, সাথে সাথে টাইব্রেকার। আগে ২ ম্যাচ যে জেতে, সে পরের রাউন্ডে।" : "No extra time: a draw goes straight to penalties. First to 2 wins advances."}</div>}
    </>
  );
}
// এই প্রেডিকশনে খেলা টাইব্রেকারে যাবে কি না, আর কোন নিয়মে (প্রতিযোগিতা ধরে)
//  • দুই লেগ: প্রথম লেগে কখনো টাইব্রেকার নয়; দ্বিতীয় লেগে দুই লেগ মিলিয়ে সমান হলে অতিরিক্ত ৩০ মিনিট, তারপর টাইব্রেকার
//  • এমএলএস রাউন্ড ওয়ান (৩ ম্যাচের সিরিজ) আর কারাবাও কাপ (ফাইনাল বাদে): ৯০ মিনিটে ড্র হলে সরাসরি টাইব্রেকার
//  • বাকি এক ম্যাচের নকআউট: ৯০ মিনিটে ড্র হলে অতিরিক্ত ৩০ মিনিট, তারপর টাইব্রেকার
function penCase(m, list, h, a, bn) {
  if (!isKnockout(m) || !m.home_id) return null;
  const bo3 = isBo3(m);
  const T = list?.length ? tieOf(list, m.home_id, m.away_id, bo3) : null;
  const legs = !bo3 && T && T.games.length >= 2;
  if (legs) {
    const i = T.games.findIndex((x) => x.id === m.id);
    if (i <= 0) return null;                                   // প্রথম লেগ
    const firsts = T.games.slice(0, i);
    if (!firsts.every((g) => isDone(g) && g.home_score != null)) return null;
    const pre = firsts.reduce((acc, g) => { acc.h += g.home_id === m.home_id ? g.home_score : g.away_score; acc.a += g.home_id === m.home_id ? g.away_score : g.home_score; return acc; }, { h: 0, a: 0 });
    if (pre.h + h !== pre.a + a) return null;
    return { q: bn ? `দুই লেগ মিলিয়ে ${num(pre.h + h, "bn")}–${num(pre.a + a, "bn")}। অতিরিক্ত ৩০ মিনিটের পরও সমান থাকলে টাইব্রেকারে কে জিতবে?` : `That's ${pre.h + h}–${pre.a + a} on aggregate. If still level after extra time, who wins the shootout?` };
  }
  if (h !== a) return null;
  const straight = bo3 || (m.competition_code === "EFL" && !/final/i.test(m.stage || "")) || (m.competition_code === "EFL" && /semi/i.test(m.stage || ""));
  return { q: straight
    ? (bn ? "ড্র হলে অতিরিক্ত সময় নেই, সরাসরি টাইব্রেকার। কে জিতবে?" : "A draw goes straight to penalties. Who wins the shootout?")
    : (bn ? "৯০+৩০ মিনিটে নিষ্পত্তি না হলে টাইব্রেকারে কে জিতবে?" : "If it's still level after extra time, who wins the shootout?") };
}

// বিরতির পর দ্বিতীয়ার্ধ কখন: শুরু + ৪৫ + প্রথমার্ধের যোগ করা সময় + ১৫ মিনিট (আনুমানিক)
function HtCountdown({ m, L, lang }) {
  const now = useNow(1000);
  if (m.status !== "PAUSED" || !/HT/.test(L?.status || "HT")) return null;
  const start = L?.lineups?.ht ? Date.parse(L.lineups.ht) : Date.parse(m.utc_date) + (45 + (L?.extra || 2) + 1) * 60000;
  const left = start + 15 * 60000 - now;
  if (left <= 0 || left > 20 * 60000) return null;
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  return <div className="mp-cd">{lang === "bn" ? `দ্বিতীয়ার্ধ শুরু ${pad2(mm, lang)}:${pad2(ss, lang)} পর` : `${pad2(mm, lang)}:${pad2(ss, lang)} until second half`}</div>;
}

function MatchPage({ id, m: mInit, user, pred, onSave, onLogin, toast }) {
  const { t, lang } = useT();
  const bn = lang === "bn";
  const [m0, setM0] = useState(mInit && mInit.id === id ? mInit : null);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (m0) return;
    getMatchesByIds([id]).then((r) => (r[0] ? setM0(r[0]) : setGone(true))).catch(() => setGone(true));
  }, [id]);
  const L = useMatchLive(m0);
  const m = useMemo(() => (m0 ? mergeLive(m0, L) : null), [m0, L]);
  const stageList = useStage(m0);
  const favTeamIds = useContext(FavCtx) || [];
  const pfMap = usePushFollows(user);
  const nav = useNav();
  const now = useNow(1000);
  const [h, setH] = useState(pred?.home ?? 0);
  const [a, setA] = useState(pred?.away ?? 0);
  const [pen, setPen] = useState(pred?.pen_pick ?? null);
  useEffect(() => { if (pred) { setH(pred.home); setA(pred.away); setPen(pred.pen_pick ?? null); } }, [pred?.home, pred?.away, pred?.pen_pick]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [making, setMaking] = useState(false);
  const [tab, setTab] = useState("ov");
  useEffect(() => { if (m) document.title = `${teamName(m.home, lang)} বনাম ${teamName(m.away, lang)} · খেলা কখন?`; return () => { document.title = "খেলা কখন? - Football Live Scores"; }; }, [m?.id, lang]);

  if (gone) return <div className="card empty" style={{ marginTop: 16 }}>{bn ? "ম্যাচটা খুঁজে পাওয়া গেল না" : "Match not found"}</div>;
  if (!m) return <Loading />;
  const open = canPredict(m);
  const ko = isKnockout(m);
  const pc = penCase(m, stageList, h, a, bn);
  const showScore = (isLive(m) || isDone(m)) && m.home_score != null;

  async function save() {
    setBusy(true); setErr("");
    if (pc && !pen) { setErr(bn ? "ড্র দিলে টাইব্রেকারে কে জিতবে, সেটাও বেছে নিন" : "Pick who wins the shootout"); setBusy(false); return; }
    try { await onSave(m, h, a, ko ? (pc ? pen : null) : undefined); toast(pred ? (bn ? "প্রেডিকশন বদলানো হয়েছে ✓" : "Prediction updated ✓") : (bn ? "প্রেডিকশন জমা হয়েছে ✓" : "Prediction submitted ✓")); }
    catch (e) { setErr(e?.message || t("error")); }
    setBusy(false);
  }
  const back = () => (window.history.state?.inApp ? window.history.back() : nav.go("matches"));

  const tabs = [
    ["ov", bn ? "সংক্ষেপ" : "Overview"],
    ["cm", bn ? "ধারাভাষ্য" : "Commentary"],
    ["lu", bn ? "লাইনআপ" : "Lineups"],
    ["tb", bn ? "টেবিল" : "Table"],
    ["st", bn ? "পরিসংখ্যান" : "Stats"],
    ["h2h", bn ? "মুখোমুখি" : "H2H"],
    ...(isKnockout(m) ? [["ko", bn ? "নকআউট" : "Knockout"]] : []),
  ];
  const hasEv = (L?.events || []).length > 0;

  return (
    <div className="mp">
      <div className="mp-head">
        <div className="ms-top">
          <button className="mp-back" onClick={back} aria-label={bn ? "পেছনে" : "Back"}><ChevronIcon style={{ transform: "rotate(-90deg)" }} /></button>
          <button className="ms-comp" onClick={() => m.competition && nav.openLeague(m.competition.code)}>
            <CompIcon c={m.competition} size={18} /><span>{mComp(m, lang)}{isKnockout(m) ? ` · ${isBo3(m) ? (bn ? "রাউন্ড ওয়ান" : "Round One") : stageLabel(m.stage, lang)}` : m.matchday ? ` · ${t("matchday")} ${num(m.matchday, lang)}` : ""}</span>
          </button>
          {!isDone(m) && !isOff(m) && <BellBtn user={user} kind="match" id={m.id} base={[m.home_id, m.away_id].some((t) => (pfMap["team:" + t] !== undefined ? pfMap["team:" + t] : favTeamIds.includes(t)))} onLogin={onLogin} toast={toast} className="ms-share" />}
          <button className="ms-share" disabled={making} aria-label={bn ? "শেয়ার" : "Share"} onClick={async () => {
            setMaking(true);
            try { await shareCard(m, { lang, teamName: (tm) => teamName(tm, lang), compName: mComp(m, lang), L, pred: pred || null }, toast); }
            catch { toast(bn ? "ছবি বানানো গেল না" : "Couldn't make the image"); }
            setMaking(false);
          }}>{making ? <span className="spin sm" /> : <ShareIcon />}</button>
        </div>
        <div className="ms-teams">
          <button className="ms-team" onClick={() => m.home_id && nav.openTeam(m.home_id)}><Crest team={m.home} size={42} /><span>{teamName(m.home, lang)}</span></button>
          <div className="ms-mid">
            <TieLine m={m} list={stageList} lang={lang} where="top" />
            {showScore
              ? <div className="ms-score">{num(m.home_score, lang)} - {num(m.away_score, lang)}</div>
              : <div className="ms-time">{timeLabel(m.utc_date, lang)}</div>}
            {!showScore && noNews(m) && <div className="nn big">{bn ? "নির্ধারিত সময় পেরিয়েছে, শুরুর খবর এখনো আসেনি" : "Past kick-off time, no start info yet"}</div>}
            <div className={"ms-date" + (isDone(m) ? " mp-ft" : "")}>{showScore ? <LiveClock m={m} L={L} lang={lang} /> : dayLabel(dayKey(m.utc_date), lang, { short: true })}</div>
            <HtCountdown m={m} L={L} lang={lang} />
            {m.pen_home != null && m.pen_away != null && <div className="mp-pen">{bn ? `টাইব্রেকারে ${num(m.pen_home, lang)}–${num(m.pen_away, lang)}` : `Pens ${m.pen_home}–${m.pen_away}`}</div>}
            {open && !isLive(m) && <div className="mp-cd">{clockDown(new Date(m.utc_date) - now, lang)}</div>}
          </div>
          <button className="ms-team" onClick={() => m.away_id && nav.openTeam(m.away_id)}><Crest team={m.away} size={42} /><span>{teamName(m.away, lang)}</span></button>
        </div>
        <TieLine m={m} list={stageList} lang={lang} />
        <Scorers L={L} lang={lang} />
      </div>

      <div className="mp-tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      <div className="mp-body">
        {tab === "ov" && (
          <>
            <MatchReport m={m} L={L} lang={lang} />
            {hasEv && <div className="mc-body" style={{ marginBottom: 12 }}><MatchEvents L={L} m={m} lang={lang} /></div>}
            {open && <div className="ms-cd">{t("startsIn")} {countdown(new Date(m.utc_date) - now, lang)} · {t("bdTime")}</div>}
            <FanVote m={m} />
        <div className="sec" style={{ margin: "16px 0 0" }}>
          <div className="sec-h"><h2>{t("yourPick")}</h2>
            {(() => { const q = predPts(pred, m); return q ? <span className={"ptbadge p" + q.v + (q.live ? " live" : "")}>{q.live && <i className="lv-dot" />}+{num(q.v, lang)} {t("pts")}{q.live ? (bn ? " · এখন পর্যন্ত" : " · so far") : ""}</span> : null; })()}</div>
          {!user ? (
            <button className="btn ghost block" onClick={onLogin}>{t("loginToPredict")}</button>
          ) : open ? (
            <div className="card pick">
              <div className="pred-box">
                <div className="pick-side"><small className="muted">{teamName(m.home, lang)}</small><Stepper v={h} set={setH} /></div>
                <div className="dash">–</div>
                <div className="pick-side"><small className="muted">{teamName(m.away, lang)}</small><Stepper v={a} set={setA} /></div>
              </div>
              {pc && (
                <div className="pen-pick">
                  <div className="pen-q">{pc.q}</div>
                  <div className="pen-rule muted">{bn ? `স্কোর আর জয়ী দুটোই ঠিক হলে ${num(5, lang)}, শুধু টাইব্রেকারের জয়ী ঠিক হলে ${num(4, lang)} পয়েন্ট` : "Score and winner right: 5 · shootout winner right: 4"}</div>
                  <div className="pen-opts">
                    {[[1, m.home], [2, m.away]].map(([k, t]) => <button key={k} className={"pen-opt" + (pen === k ? " on" : "")} onClick={() => setPen(k)}><Crest team={t} size={20} />{teamName(t, lang)}</button>)}
                  </div>
                </div>
              )}
              <div className="pick-out">{h > a ? (lang === "bn" ? `${teamName(m.home, lang)} জিতবে` : `${teamName(m.home, lang)} win`) : h < a ? (lang === "bn" ? `${teamName(m.away, lang)} জিতবে` : `${teamName(m.away, lang)} win`) : (lang === "bn" ? "ড্র হবে" : "Draw")}</div>
              <div style={{ padding: "0 12px 12px" }}>
                {err && <div className="err">{err}</div>}
                {pred && !(pred.home !== h || pred.away !== a) && (!pc || (pred.pen_pick ?? null) === pen) ? (
                  <div className="pick-done">
                    <span className="pick-ok">✓</span>
                    <span className="pick-txt"><b>{lang === "bn" ? "প্রেডিকশন দেওয়া আছে" : "Prediction saved"}</b><small className="muted">{lang === "bn" ? "খেলা শুরুর আগে বদলাতে পারবেন" : "Editable until kickoff"}</small></span>
                    <button className="pick-share" disabled={making} aria-label={bn ? "প্রেডিকশন শেয়ার" : "Share prediction"} onClick={async () => {
                      setMaking(true);
                      try { await shareCard(m, { lang, teamName: (tm) => teamName(tm, lang), compName: mComp(m, lang), L, pred }, toast); }
                      catch { toast(bn ? "ছবি বানানো গেল না" : "Couldn't make the image"); }
                      setMaking(false);
                    }}>{making ? <span className="spin sm" /> : <ShareIcon />}<span>{bn ? "শেয়ার" : "Share"}</span></button>
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
            <div className="sec" style={{ margin: "16px 0 0" }}>
              <div className="sec-h"><h2>{bn ? "ম্যাচের তথ্য" : "Match info"}</h2></div>
              <div className="card mp-info">
                <div><CalIcon width={16} height={16} /><span>{dayLabel(dayKey(m.utc_date), lang)} · {timeLabel(m.utc_date, lang)} <small className="muted">({t("bdTime")})</small></span></div>
                <div><TrophyIcon width={16} height={16} /><span>{mComp(m, lang)}{isKnockout(m) ? ` · ${isBo3(m) ? (bn ? "রাউন্ড ওয়ান" : "Round One") : stageLabel(m.stage, lang)}` : m.matchday ? ` · ${t("matchday")} ${num(m.matchday, lang)}` : ""}</span></div>
              </div>
            </div>
          </>
        )}
        {tab === "lu" && (L?.lineups?.h?.xi?.length ? <div className="mc-body"><MatchLineups L={L} m={m} lang={lang} /></div>
          : <div className="card empty">{bn ? "লাইনআপ সাধারণত খেলা শুরুর প্রায় এক ঘণ্টা আগে আসে" : "Lineups usually arrive about an hour before kickoff"}</div>)}
        {tab === "cm" && (L ? <MatchCommentary L={L} m={m} lang={lang} /> : <div className="card empty">{bn ? "খেলা শুরু হলে এখানে প্রতিটা মুহূর্ত আসবে" : "Moments appear here once the match starts"}</div>)}
        {tab === "tb" && <MatchTable m={m} lang={lang} />}
        {tab === "st" && ((L?.stats || []).length ? <div className="mc-body"><MatchStats L={L} lang={lang} /></div>
          : <div className="card empty">{bn ? "খেলা শুরু হলে পরিসংখ্যান দেখা যাবে" : "Stats appear once the match starts"}</div>)}
        {tab === "h2h" && <H2H m={m} />}
        {tab === "ko" && <KnockoutTab m={m} list={stageList} lang={lang} onOpen={(x) => x && x.id !== m.id && nav.openMatch?.(x)} />}
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
    [bn ? "খেলা কখন?" : "Khela Kokhon", [[bn ? "আমাদের কথা" : "About us", () => nav.openPage("about")], [bn ? "কীভাবে কাজ করে" : "How it works", () => nav.openPage("how")], [bn ? "প্রশ্নোত্তর" : "FAQ", () => nav.openPage("faq")], [bn ? "প্রতিষ্ঠাতা" : "Founder", () => nav.openPage("founder")], [bn ? "যোগাযোগ" : "Contact", () => nav.openPage("contact")], [bn ? "গোপনীয়তা" : "Privacy", () => nav.openPage("privacy")]]],
    // সব লিগ নয়, জনপ্রিয় কয়েকটা, বাকিগুলো "সব লিগ" পাতায়
    [bn ? "লিগ" : "Leagues", [...["CL", "PL", "PD", "BPL"].map((code) => comps.find((c) => c.code === code)).filter(Boolean).map((c) => [compName(c, lang), () => nav.openLeague(c.code)]),
      [bn ? "সব লিগ →" : "All leagues →", () => nav.go("leagues")]]],
    [bn ? "ফিচার" : "Features", [
      [bn ? "ম্যাচের সূচি" : "Fixtures", () => nav.go("matches")],
      [bn ? "প্রেডিকশন" : "Predictions", () => nav.go("predict")],
      [bn ? "বন্ধুদের লিগ" : "Friends' leagues", () => nav.openFriends()],
      [bn ? "দৈনিক চ্যালেঞ্জ" : "Daily challenge", () => nav.openDaily()],
      [bn ? "কুইজ" : "Quiz", () => nav.openQuiz()],
      [bn ? "জিজ্ঞেস করুন" : "Ask", () => nav.go("ask")],
    ]],
  ];
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-about">
        <div className="foot-brand"><Logo size={36} /><b>খেলা কখন<span>?</span></b></div>
        <div className="foot-tag">{bn ? "ম্যাচের ঘড়ি আপনার হাতে" : "The match clock in your hands"}</div>
        <p className="foot-desc">{bn ? "ইউরোপের ফুটবল থেকে দেশের মাঠ, সব ম্যাচের তথ্য এক প্ল্যাটফর্মে। সাথে আছে জ্ঞান ঝালিয়ে নেওয়ার কুইজ, দৈনিক চ্যালেঞ্জ আর প্রেডিকশন গেম।" : "From European football to the game at home, every match on one platform. Plus quizzes to sharpen your knowledge, a daily challenge and a prediction game."}</p>
        <div className="foot-social">
          <a href="https://www.facebook.com/khelakokhon" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FbIcon /></a>
          <a href="mailto:khelakokhon@gmail.com" aria-label="Email"><MailIcon /></a>
        </div>
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
  const ck = (day === dayKey(new Date()) ? "p:day:" : "day:") + day;
  const [list, setList] = useState(() => keep.get(ck) ?? null);
  const [next, setNext] = useState(null);
  useEffect(() => { if (list !== null) kkReady(); }, [list !== null]);

  useEffect(() => {
    let live = true;
    setList(keep.get(ck) ?? null); setNext(null);
    getMatchesOnDay(day).then(withLive).then((r) => {
      keep.set(ck, r);
      if (!live) return;
      setList(r);
      if (!r.length) getNextMatchTime(dayRangeUTC(day)[1]).then((n) => live && setNext(n)).catch(() => {});
    }).catch(() => live && setList([]));
    return () => { live = false; };
  }, [day]);

  // খেলা চলার সময় পাতা খোলা থাকলে চুপচাপ নতুন স্কোর আনা (প্রতি মিনিটে, আর অ্যাপে ফিরে এলেই)
  const busy = (list || []).some((m) => {
    if (isLive(m)) return true;
    if (m.status === "FINISHED" || m.status === "POSTPONED" || m.status === "CANCELLED") return false;
    const t0 = Date.parse(m.utc_date), n = Date.now();
    return t0 - n < 15 * 60000 && n - t0 < 3 * 3600000;
  });
  useEffect(() => {
    if (!busy) return;
    let alive = true;
    const pull = () => { if (document.visibilityState === "visible") getMatchesOnDay(day).then(withLive).then((r) => { keep.set(ck, r); alive && setList(r); }).catch(() => {}); };
    const i = setInterval(pull, 60000);
    document.addEventListener("visibilitychange", pull);
    return () => { alive = false; clearInterval(i); document.removeEventListener("visibilitychange", pull); };
  }, [busy, day]);

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
// সারির বাঁ পাশে অবস্থা (FotMob-এর মতো): চলমান হলে সবুজে মিনিট, বিরতি, শেষ, স্থগিত
function rowBadge(m, t, lang = "bn") {
  if (m.status === "PAUSED") return <span className="rbadge live">{lang === "bn" ? "বিরতি" : "HT"}</span>;
  if (isLive(m)) return <span className="rbadge live">{m.minute != null ? minuteTxt(m.minute, m.minute_x, lang).replace("'", "") : (lang === "bn" ? "লাইভ" : "LIVE")}</span>;
  if (isDone(m)) return <span className="rbadge">{t("ft")}</span>;
  if (m.status === "POSTPONED") return <span className="rbadge">{lang === "bn" ? "স্থগিত" : "PP"}</span>;
  if (m.status === "CANCELLED") return <span className="rbadge">{lang === "bn" ? "বাতিল" : "C"}</span>;
  return null;
}

const ChevronIcon = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 15 6-6 6 6" /></svg>
);

// প্রিয় দলের কার্ডে কবে খেলা: সামনের হলে আজ / কাল / বুধ, ২৫ নভে; শেষ হলে আজ / গতকাল / শনি, ২১ নভে
function followSub(m, lang) {
  if (isLive(m) || m.status === "PAUSED" || isOff(m)) return null;
  const k = dayKey(m.utc_date), today = dayKey(new Date()), bn = lang === "bn";
  if (k === today) return bn ? "আজ" : "Today";
  if (k === addDays(today, 1)) return bn ? "আগামীকাল" : "Tomorrow";
  if (k === addDays(today, -1)) return bn ? "গতকাল" : "Yesterday";
  const l = stripLabel(k, lang); return `${l.top}, ${l.bottom}`;
}
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
      {open && list.map((m) => <MatchRow key={m.id} m={m} pred={preds[m.id]} onOpen={onOpen} plain badge={rowBadge(m, t, lang)} sub={followSub(m, lang)} />)}
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
  const [table, setTable] = useState(() => keep.get("st:" + code) ?? null);
  const [scorers, setScorers] = useState(null);
  useEffect(() => {
    let live = true; setTable(keep.get("st:" + code) ?? null); setScorers(null);
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
        <label className="side-sel">
          <CompIcon c={c} size={18} />
          <select value={code} onChange={(e) => setCode(e.target.value)} aria-label={bn ? "লিগ বাছুন" : "Choose league"}>
            {comps.filter((x) => TABLE_CODES.includes(x.code)).map((x) => <option key={x.code} value={x.code}>{compName(x, lang)}</option>)}
          </select>
          <ChevronIcon width={14} height={14} style={{ transform: "rotate(180deg)" }} />
        </label>
        {table === null ? <div className="spin" /> : !table.length ? <div className="side-empty muted">{bn ? "টেবিল এখনো আসেনি" : "No table yet"}</div> : (
          <div className="mt">
            <div className="mt-row mt-h muted"><span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "ম্যাচ" : "P"}</span><span>+/-</span><span>{bn ? "পয়েন্ট" : "Pts"}</span></div>
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
                <span className="mt-tm"><Crest team={p.team} size={18} /><span className="sc-nm"><b>{pName(p, lang)}</b><small className="muted">{teamName(p.team, lang)}</small></span></span>
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
          <div key={i} className={"sc-row lbr" + (r.is_me ? " me" : "")}>
            <span className={"rk-b" + (i < 3 ? " r" + (i + 1) : "")}>{num(i + 1, lang)}</span>
            <UserAvatar src={r.avatar} name={r.display_name} size={28} />
            <span className="sc-nm"><b>{r.display_name}</b><small className="muted">{bn ? `${num(r.played, lang)} ম্যাচ · হুবহু ${num(r.exact, lang)}` : `${r.played} played · ${r.exact} exact`}</small></span>
            <span className="mt-pts">{num(r.points, lang)} <small className="muted">{t("pts")}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ডেস্কটপের বাঁ পাশের লিগের তালিকা (হোমে ফিল্টার, অন্য পাতায় লিগে যাওয়ার পথ) ──
function LeagueRail({ comps, active, onPick, all }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const [follow] = useFollowLg();
  const mine = follow.map((c) => comps.find((x) => x.code === c)).filter(Boolean);
  const rest = orderComps(comps.filter((c) => !follow.includes(c.code)), []);
  const item = (c) => (
    <button key={c.code} className={"rail-i" + (active === c.code ? " on" : "")} onClick={() => onPick(c.code)}>
      <span className="rail-ic"><CompIcon c={c} size={18} /></span><span className="rail-nm">{compName(c, lang)}</span>
    </button>
  );
  return (
    <aside className="rail">
      {all && <button className={"rail-i rail-all" + (active === "ALL" ? " on" : "")} onClick={() => onPick("ALL")}><span className="rail-ic"><BallIcon width={17} height={17} /></span><span className="rail-nm">{bn ? "সব ম্যাচ" : "All matches"}</span></button>}
      {mine.length > 0 && <><div className="rail-h">{bn ? "আমার লিগ" : "Following"}</div>{mine.map(item)}</>}
      <div className="rail-h">{mine.length ? (bn ? "আরও লিগ" : "More leagues") : (bn ? "লিগ" : "Leagues")}</div>
      {rest.map(item)}
    </aside>
  );
}

// যেসব প্রতিযোগিতার এক টেবিল আছে (কাপ/নকআউট বাদ)
const TABLE_CODES = ["PL", "PD", "BL1", "SA", "FL1", "CL", "UEL", "UECL", "BPL", "SPL", "MLS"];
function HomeSide({ comps, comp, user }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  const [code, setCode] = useState(comp !== "ALL" && TABLE_CODES.includes(comp) ? comp : "PL");
  useEffect(() => { if (comp !== "ALL" && TABLE_CODES.includes(comp)) setCode(comp); }, [comp]);
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

// এই মুহূর্তে চলা সব খেলা (সব লিগ মিলিয়ে); প্রতি মিনিটে নতুন করে
function useLiveNow() {
  const [list, setList] = useState(null);
  useEffect(() => {
    let alive = true;
    const pull = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      getMatchesRange(new Date(now - 4 * 3600000).toISOString(), new Date(now + 5 * 60000).toISOString())
        .then((r) => withLive(r.filter((m) => m.status !== "FINISHED" || isLive(m))))
        .then((r) => alive && setList(r.filter(isLive))).catch(() => alive && setList([]));
    };
    pull();
    const i = setInterval(pull, 60000);
    document.addEventListener("visibilitychange", pull);
    return () => { alive = false; clearInterval(i); document.removeEventListener("visibilitychange", pull); };
  }, []);
  return list;
}

function Matches({ user, myTeams, comps, preds, onOpen, goProfile }) {
  const { t, lang } = useT();
  const [follow] = useFollowLg();
  const [day, setDay0] = useState(dayKey(new Date()));
  const [liveOn, setLiveOn] = useState(false);
  const liveNow = useLiveNow();
  const setDay = (d) => { setLiveOn(false); setDay0(d); };
  const [comp, setComp] = useState("ALL");
  const nav = useNav();
  const fav = myTeams?.fav || [];
  const mineKey = "p:mine:" + fav.join(",");
  const [mine, setMine] = useState(() => keep.get(mineKey) ?? null);
  const wide = useWide();
  const mid = useWide("(min-width: 960px)");   // ৯৬০–১০৯৯: ম্যাচ + ডান পাশের তথ্য (লিগের তালিকা ছাড়া)

  // প্রতিটা প্রিয় দলের একটা করে খেলা: চলতি খেলা, নইলে আজ শেষ হওয়া খেলা, নইলে পরের ম্যাচ
  useEffect(() => {
    let live = true;
    if (!fav.length) { setMine([]); return; }
    const c = keep.get(mineKey); if (c) setMine(c);
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
        keep.set(mineKey, picked);
        setMine(picked);
      })
      .catch(() => live && setMine([]));
    return () => { live = false; };
  }, [fav.join(",")]);

  return (
    <div className={mid ? "home-grid" : undefined}>
    {wide && <LeagueRail comps={comps} active={comp} onPick={setComp} all />}
    <div className="home-main">
      {fav.length > 0 && mine?.length > 0 && (
        <div className="sec">
          <Following list={mine} preds={preds} onOpen={onOpen} />
        </div>
      )}
      {/* প্রথমবার: প্রিয় দলের খেলা আসার আগে জায়গা রাখা, যাতে নিচের তালিকা লাফিয়ে না নামে */}
      {fav.length > 0 && mine === null && <div className="sec"><div className="card fol-ph" style={{ height: 56 + Math.min(fav.length, 3) * 44 }} /></div>}

      {!mid && <div className="sec dl-teaser-wrap"><DailyTeaser user={user} /></div>}
      <div className={liveOn ? "ds-off" : undefined}><DateStrip day={day} setDay={setDay} /></div>
      {!wide && <div className="chips">
        <button className={"chip" + (comp === "ALL" ? " on" : "")} onClick={() => setComp("ALL")}>{t("all")}</button>
        {orderComps(comps, follow).map((c) => (
          <button key={c.code} className={"chip" + (comp === c.code ? " on" : "")} onClick={() => setComp(c.code)}>
            <CompIcon c={c} size={16} />{compName(c, lang)}
          </button>
        ))}
      </div>}
      <div className="sec" style={{ marginTop: 14 }}>
        <div className="sec-h">
          <h2>{liveOn ? (lang === "bn" ? "এখন চলছে" : "Live now") : dayLabel(day, lang)}</h2>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {comp !== "ALL" && !liveOn && <button className="link" onClick={() => nav.openLeague(comp)}>{lang === "bn" ? "টেবিল" : "Table"} →</button>}
            <button className={"live-tg" + (liveOn ? " on" : "") + (liveNow?.length ? " has" : "")} aria-pressed={liveOn} onClick={() => setLiveOn((x) => !x)}>
              <i />{lang === "bn" ? "লাইভ" : "Live"}{liveNow?.length ? <b>{num(liveNow.length, lang)}</b> : null}
            </button>
          </span>
        </div>
        {liveOn ? (() => {
          const shown = (liveNow || []).filter((m) => comp === "ALL" || m.competition_code === comp);
          return liveNow === null ? <div className="card"><div className="spin" /></div>
            : shown.length ? <CompGroups matches={shown} preds={preds} onOpen={onOpen} />
            : <div className="card empty">{lang === "bn" ? "এই মুহূর্তে কোনো খেলা চলছে না" : "No matches live right now"}</div>;
        })() : <DayMatches day={day} setDay={setDay} comp={comp} preds={preds} onOpen={onOpen} />}
      </div>
    </div>
    {mid && <HomeSide comps={comps} comp={comp} user={user} />}
    </div>
  );
}

// ── সব লিগ এক জায়গায় ──
function Leagues({ comps, toast }) {
  const { t, lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [follow, toggle, move] = useFollowLg();
  const mine = follow.map((c) => comps.find((x) => x.code === c)).filter(Boolean);
  const rest = orderComps(comps.filter((c) => !follow.includes(c.code)), []);
  const flip = (c) => { const now = toggle(c.code); toast?.(now ? (bn ? `${compName(c, lang)} ফলো করছেন` : `Following ${compName(c, lang)}`) : (bn ? "ফলো বাদ দেওয়া হয়েছে" : "Unfollowed")); };
  const [edit, setEdit] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => { if (!mine.length) setEdit(false); }, [mine.length]);
  // খোঁজা: বাংলা, ইংরেজি বা চলতি নাম ("ইপিএল", "ucl")
  const query = q.trim();
  const found = query ? comps.map((c) => [c, nameScore(query, [c.name_bn, c.name_en, COMP_BN_FIX[c.code], c.code, ...(COMP_WORDS[c.code] || [])].filter(Boolean))])
    .filter(([, sc]) => sc != null).sort((a, b) => a[1] - b[1]).map(([c]) => c) : null;
  const row = (c, i, followed) => (
    <div key={c.code} className="lgx">
      <button className="lgx-open" onClick={() => !edit && nav.openLeague(c.code)} disabled={edit && followed}>
        <span className="lgx-ic"><CompIcon c={c} size={22} /></span>
        <span className="lgx-nm">{compName(c, lang)}</span>
      </button>
      {followed ? (edit ? (
        <span className="lgx-ord">
          <button aria-label={bn ? "ওপরে" : "Move up"} disabled={i === 0} onClick={() => move(c.code, -1)}><ChevronIcon width={16} height={16} /></button>
          <button aria-label={bn ? "নিচে" : "Move down"} disabled={i === mine.length - 1} onClick={() => move(c.code, 1)}><ChevronIcon width={16} height={16} style={{ transform: "rotate(180deg)" }} /></button>
          <button className="lgx-rm" aria-label={bn ? "ফলো বাদ" : "Unfollow"} onClick={() => flip(c)}>−</button>
        </span>
      ) : <ChevronIcon className="lgx-go" width={15} height={15} style={{ transform: "rotate(90deg)" }} />)
        : <button className="lgx-add" aria-label={bn ? "ফলো" : "Follow"} onClick={() => flip(c)}>+</button>}
    </div>
  );
  return (
    <div className="sec">
      <div className="sec-h"><h2 style={{ fontSize: 19 }}>{t("leagues")}</h2></div>
      <div className="search-box lg-find">
        <SearchIcon width={18} height={18} />
        <input value={q} onChange={(e) => { setQ(e.target.value); setEdit(false); }} placeholder={bn ? "লিগ খুঁজুন" : "Find leagues"} enterKeyHint="search" aria-label={bn ? "লিগ খুঁজুন" : "Find leagues"} />
        {q && <button className="search-x" onClick={() => setQ("")} aria-label="clear">×</button>}
      </div>
      {!comps.length ? <Loading /> : found ? (
        found.length ? <div className="card lgx-card">{found.map((c, i) => row(c, i, follow.includes(c.code)))}</div>
          : <div className="card empty">{bn ? `"${query}" নামে কোনো লিগ পাওয়া যায়নি` : `No league matches "${query}"`}</div>
      ) : (
        <>
          <div className="lgx-h"><span>{bn ? "আমার লিগ" : "Following"}</span>{mine.length > 0 && <button className="link" onClick={() => setEdit(!edit)}>{edit ? (bn ? "হয়ে গেছে" : "Done") : (bn ? "সাজান" : "Edit")}</button>}</div>
          {mine.length ? (
            <>
              <div className="card lgx-card">{mine.map((c, i) => row(c, i, true))}</div>
              {edit && <div className="muted lgx-tip">{bn ? "এই ক্রমেই ম্যাচ ট্যাবে খেলা দেখাবে" : "Matches show in this order"}</div>}
            </>
          ) : <div className="muted lgx-tip">{bn ? "+ চেপে পছন্দের লিগ ফলো করুন। ম্যাচ ট্যাবে সেগুলো আগে দেখাবে।" : "Tap + to follow. Followed leagues show first on Matches."}</div>}
          {rest.length > 0 && <>
            <div className="lgx-h" style={{ marginTop: 18 }}><span>{mine.length ? (bn ? "আরও লিগ" : "More leagues") : (bn ? "সব লিগ" : "All leagues")}</span></div>
            <div className="card lgx-card">{rest.map((c, i) => row(c, i, false))}</div>
          </>}
        </>
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
  const [wk, setWk] = useState(null);
  useEffect(() => {
    const ck = `lb:${league.id}:${comp}:${wk}`;
    setRows(keep.get(ck) ?? null); setErr("");
    let a = true;
    leagueBoard(league.id, comp, wk).then((r) => { keep.set(ck, r); a && setRows(r); }).catch((e) => { if (!a) return; setErr(e.missing ? "missing" : e.message); setRows([]); });
    const iv = everyMin(() => leagueBoard(league.id, comp, wk).then((r) => a && r && setRows(r)).catch(() => {}));
    return () => { a = false; iv(); };
  }, [league.id, comp, wk]);

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
      <PeriodSeg value={wk} onChange={setWk} />
      <CompFilter value={comp} onChange={setComp} />
      {err && err !== "missing" && <div className="err">{err}</div>}
      {wk !== null && rows && !err && <WeekTop rows={rows} wk={wk} lang={lang} />}
      {rows === null ? <div className="card"><div className="spin" /></div>
        : err === "missing" && wk !== null ? <div className="card empty">{bn ? "সাপ্তাহিক লিডারবোর্ড খুব শিগগিরই চালু হচ্ছে।" : "Weekly leaderboard is coming soon."}</div>
        : err === "missing" || ((comp || wk !== null) && !rows.some((r) => r.played > 0)) ? (wk !== null ? <div className="card empty">{wk === 0 ? (bn ? "এই সপ্তাহে লিগের কেউ এখনো পয়েন্ট পায়নি।" : "No points in this league this week yet.") : (bn ? "গত সপ্তাহে লিগের কেউ পয়েন্ট পায়নি।" : "No points last week.")}</div> : <BoardMsg err={err} comp={comp} lang={lang} />)
        : <BoardRows rows={comp || wk !== null ? rows.filter((r) => r.played > 0 || r.is_me) : rows} isMe={(r) => r.is_me} lang={lang} t={t} />}
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
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" style={{ letterSpacing: 3, fontFamily: "Inter, 'Hind Siliguri', sans-serif", fontWeight: 700 }} />
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
  const [wk, setWk] = useState(null);
  useEffect(() => {
    const ck = `gb:${comp}:${wk}`;
    setRows(keep.get(ck) ?? null); setErr("");
    let a = true;
    getLeaderboard(comp, wk).then((r) => { keep.set(ck, r); a && setRows(r); }).catch((e) => { if (!a) return; setErr(e?.missing ? "missing" : "x"); setRows([]); });
    // রিয়েল টাইম: প্রতি মিনিটে নতুন (খেলা চলার সময় পয়েন্ট বদলায়)
    const iv = everyMin(() => getLeaderboard(comp, wk).then((r) => a && r && setRows(r)).catch(() => {}));
    return () => { a = false; iv(); };
  }, [comp, wk]);
  const isMe = (r) => r.is_me ?? (me && r.display_name === me);
  const bn = lang === "bn";
  return (
    <>
      <PeriodSeg value={wk} onChange={setWk} />
      <CompFilter value={comp} onChange={setComp} />
      {wk !== null && rows && !err && <WeekTop rows={rows} wk={wk} lang={lang} />}
      {rows === null ? <div className="card"><div className="spin" /></div>
        : err === "missing" ? (wk !== null ? <div className="card empty">{bn ? "সাপ্তাহিক লিডারবোর্ড খুব শিগগিরই চালু হচ্ছে।" : "Weekly leaderboard is coming soon."}</div> : <BoardMsg err={err} comp={comp} lang={lang} />)
        : !rows.length ? (wk !== null ? <div className="card empty">{wk === 0 ? (bn ? "এই সপ্তাহে এখনো কেউ পয়েন্ট পায়নি। প্রেডিক্ট করে শুরু করুন।" : "No points this week yet.") : (bn ? "গত সপ্তাহে কেউ পয়েন্ট পায়নি।" : "No points last week.")}</div> : comp ? <BoardMsg comp={comp} lang={lang} /> : <div className="card empty">{t("noLeaders")}</div>)
        : <BoardRows rows={rows} isMe={isMe} lang={lang} t={t} />}
    </>
  );
}

function Mine({ user, preds, fav, onOpen, goProfile }) {
  const { t, lang } = useT();
  const ids = Object.keys(preds).map(Number);
  const mk = "made:" + ids.join(","), tk = "todo:" + fav.join(",") + "|" + ids.join(",");
  const [made, setMade] = useState(() => keep.get(mk) ?? null);
  const [todo, setTodo] = useState(() => keep.get(tk) ?? null);

  useEffect(() => {
    let live = true;
    const load = (first) => getMatchesByIds(ids).then((r) => { const v = r.sort((a, b) => b.utc_date.localeCompare(a.utc_date)); keep.set(mk, v); live && setMade(v); }).catch(() => live && first && setMade((x) => x ?? []));
    load(true);
    // খেলা চলার সময় স্কোর আর এখন পর্যন্ত পয়েন্ট প্রতি মিনিটে
    const iv = everyMin(() => load(false));
    return () => { live = false; iv(); };
  }, [ids.join(",")]);

  useEffect(() => {
    let live = true;
    getTeamMatches(fav, { upcoming: true, limit: 10 })
      .then((r) => { const v = r.filter((m) => canPredict(m) && !preds[m.id]).slice(0, 5); keep.set(tk, v); live && setTodo(v); })
      .catch(() => live && setTodo([]));
    return () => { live = false; };
  }, [fav.join(","), ids.join(",")]);

  if (!user) return (
    <div className="card empty">
      <div style={{ marginBottom: 12 }}>{t("loginToPredict")}</div>
      <button className="btn" onClick={goProfile}>{t("login")}</button>
    </div>
  );

  // খেলা চলার ম্যাচের এখন পর্যন্ত পয়েন্টও যোগ (রিয়েল টাইম)
  const total = Object.values(preds).reduce((s, p) => s + (p.points || 0), 0) + (made || []).reduce((s, m) => { const q = predPts(preds[m.id], m); return s + (q?.live ? q.v : 0); }, 0);
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
                  {(() => { const q = predPts(preds[m.id], m); return q
                    ? <span className={"ptbadge p" + q.v + (q.live ? " live" : "")}>{q.live && <i className="lv-dot" />}+{num(q.v, lang)}</span>
                    : <span className="ptbadge">{t("pending")}</span>; })()}
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
// র‍্যাঙ্ক: ১–৩ সোনা/রুপা/ব্রোঞ্জ রঙের গোল চিহ্ন, বাকিরা সাধারণ
function RankBadge({ rank, lang, big }) {
  return <span className={"qz-badge r" + Math.min(rank, 4) + (big ? " big" : "")}>{num(rank, lang)}</span>;
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
// ── পপআপ খোলা থাকলে ফোনের ব্যাক বাটনে শুধু পপআপ বন্ধ (পাতা পেছনে যায় না) ──
// খোলার সময় ইতিহাসে একটা ধাপ যোগ; ব্যাক চাপলে সেই ধাপ সরে পপআপ বন্ধ। বোতাম চেপে বন্ধ করলে ধাপটা নিজেই সরানো হয়।
const modalStack = [];
function useBackClose(open, onClose) {
  const cb = useRef(onClose); cb.current = onClose;
  useEffect(() => {
    if (!open) return;
    const me = { closed: false };
    modalStack.push(me);
    window.history.pushState({ ...(window.history.state || {}), kkModal: modalStack.length }, "");
    const onPop = () => { if (modalStack[modalStack.length - 1] !== me) return; me.closed = true; modalStack.pop(); cb.current(); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (!me.closed) { me.closed = true; const i = modalStack.indexOf(me); if (i >= 0) modalStack.splice(i, 1); window.__kkSkipPop = (window.__kkSkipPop || 0) + 1; window.history.back(); }
    };
  }, [open]);
}

// ── ব্যাজের লেভেল (supabase/badge_levels.sql-এর সাথে মিল রেখে) ──
// প্রতিটা ব্যাজে ধাপ: সবুজ → ব্রোঞ্জ → রুপা → সোনা → প্লাটিনাম → হীরা → কিংবদন্তি; শেষ ধাপের পরে নির্দিষ্ট ব্যবধানে একটা করে তারা
const LV_METRICS = [
  { m: "streak", bn: "টানা খেলা", en: "Streak", glyph: "flame", steps: [3, 7, 14, 30, 60, 100, 180, 365], star: 365, ubn: "দিন টানা", uen: "days in a row" },
  { m: "perfect", bn: "পারফেক্ট ডে", en: "Perfect days", glyph: "check", steps: [1, 5, 10, 25, 50, 100, 250], star: 250, ubn: "দিন", uen: "days" },
  { m: "days", bn: "মোট খেলা", en: "Days played", glyph: "cal", steps: [1, 10, 50, 100, 200, 365, 500], star: 250, ubn: "দিন", uen: "days" },
  { m: "football", bn: "ফুটবল বিশেষজ্ঞ", en: "Football expert", glyph: "ball", steps: [50, 150, 500, 1000, 2500], star: 2500, ubn: "সঠিক উত্তর", uen: "right answers" },
  { m: "cricket", bn: "ক্রিকেট বিশেষজ্ঞ", en: "Cricket expert", glyph: "bat", steps: [50, 150, 500, 1000, 2500], star: 2500, ubn: "সঠিক উত্তর", uen: "right answers" },
  { m: "week", bn: "সাপ্তাহিক সেরা দশ", en: "Weekly top 10", glyph: "laurel", steps: [1, 5, 10, 25], star: 25, ubn: "বার", uen: "times" },
];
const LV_TIERS = [null, ["সবুজ", "Green", "#34d399", "#059669"], ["ব্রোঞ্জ", "Bronze", "#f0b37e", "#9a5b2c"], ["রুপা", "Silver", "#e5e7eb", "#8b98a9"], ["সোনা", "Gold", "#fde047", "#ca8a04"],
  ["প্লাটিনাম", "Platinum", "#a5f3fc", "#0e7490"], ["হীরা", "Diamond", "#c4b5fd", "#6d28d9"], ["কিংবদন্তি", "Legend", "#fda4af", "#be123c"]];
const lvMeta = (m) => LV_METRICS.find((x) => x.m === m);
// কোন ধাপের রং: শেষ ধাপ সবসময় কিংবদন্তি
const lvTier = (meta, level) => (level <= 0 ? null : LV_TIERS[level >= meta.steps.length ? 7 : Math.min(level, 6)]);
function lvOf(meta, v = 0) {
  const n = meta.steps.length, last = meta.steps[n - 1];
  const level = meta.steps.filter((x) => v >= x).length;
  const stars = level === n ? Math.floor((v - last) / meta.star) : 0;
  const next = level < n ? meta.steps[level] : last + (stars + 1) * meta.star;
  const prev = level === 0 ? 0 : level < n ? meta.steps[level - 1] : last + stars * meta.star;
  return { v, level, stars, next, prev, pct: Math.max(0, Math.min(1, (v - prev) / Math.max(1, next - prev))) };
}
// 'lv:perfect:3' / 'lv:perfect:s2' → { meta, level, stars }
const lvParse = (id) => { const [, m, x] = String(id).split(":"); const meta = lvMeta(m); if (!meta) return null; return x?.[0] === "s" ? { meta, level: meta.steps.length, stars: +x.slice(1) } : { meta, level: +x, stars: 0 }; };
function LevelIcon({ m, level = 0, stars = 0, size = 56 }) {
  const { lang } = useT();
  const meta = lvMeta(m); if (!meta) return null;
  const t = lvTier(meta, level), locked = !t;
  const [c1, c2] = locked ? ["#d6dde3", "#9aa7b2"] : [t[2], t[3]];
  const gid = `lv-${m}-${level}-${size}`;
  const legend = t && t === LV_TIERS[7];
  const g = {
    flame: <path d="M32.8 17.5c.6 3.4-.9 5.4-2.7 7.4-2 2.2-4.5 4.6-4.5 8.4A6.4 6.4 0 0 0 32 40a6.4 6.4 0 0 0 6.4-6.8c0-2.8-1.2-5.1-2.9-7 .1 1.9-.6 3.3-1.9 4 .5-4.3-.3-8.9-.8-12.7z" fill="#fff" />,
    check: <path d="M22 31.5l7 7 13-14" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    cal: <><rect x="21" y="21" width="22" height="19" rx="3.5" fill="none" stroke="#fff" strokeWidth="3" /><path d="M21 27h22M26.5 18v5M37.5 18v5" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></>,
    ball: <><circle cx="32" cy="31" r="11" fill="#fff" /><path d="M32 25l5 3.6-1.9 5.9h-6.2L27 28.6z" fill={c2} /></>,
    bat: <><path d="M38.5 19.5l5 5-13 13-5-5z" fill="#fff" /><path d="M25.5 32.5l5 5-4 4-5-5z" fill="#fff" opacity=".85" /><circle cx="41" cy="39" r="3.4" fill="#fff" /></>,
    laurel: <><path d="M24 21c-4 5-4 14 0 20M40 21c4 5 4 14 0 20" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /><text x="32" y="36" fontSize="12" fontWeight="900" fill="#fff" textAnchor="middle" fontFamily="Inter, 'Hind Siliguri', sans-serif">{num(10, lang)}</text></>,
  }[meta.glyph];
  const lbl = level > 0 ? meta.steps[Math.min(level, meta.steps.length) - 1] : meta.steps[0];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={"bdg" + (locked ? " locked" : "") + (legend ? " legend" : "")}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
      <path d="M32 3l6.2 4.6 7.7-.3 2.4 7.3 6.4 4.4-2.4 7.3 2.4 7.4-6.4 4.3-2.4 7.4-7.7-.3L32 50.7l-6.2-4.6-7.7.3-2.4-7.4-6.4-4.3 2.4-7.4-2.4-7.3 6.4-4.4 2.4-7.3 7.7.3z" fill={`url(#${gid})`} transform="translate(0 5)" stroke={legend ? "#fff7" : "none"} strokeWidth="1.5" />
      <circle cx="32" cy="31" r="17" fill="rgba(255,255,255,.16)" />
      {g}
      {meta.glyph !== "laurel" && <text x="32" y="50" fontSize="9" fontWeight="900" fill="#fff" textAnchor="middle" fontFamily="Inter, 'Hind Siliguri', sans-serif">{num(lbl, lang)}</text>}
      {stars > 0 && <g><circle cx="50" cy="13" r="8.5" fill="#f59e0b" stroke="var(--card)" strokeWidth="2" /><text x="50" y="16.5" fontSize="9" fontWeight="900" fill="#fff" textAnchor="middle" fontFamily="Inter, 'Hind Siliguri', sans-serif">★{stars > 1 ? num(stars, lang) : ""}</text></g>}
      {locked && <g transform="translate(42 42)"><circle r="8" fill="var(--card)" /><path d="M-3 -1v-2a3 3 0 0 1 6 0v2M-4.2 -1h8.4v6h-8.4z" stroke="var(--muted)" strokeWidth="1.6" fill="none" /></g>}
    </svg>
  );
}
// নিজের অগ্রগতি (লেভেলের জন্য); SQL না থাকলে null → আগের ব্যাজ দেখায়
function useDailyProgress(user, key) {
  const [p, setP] = useState(undefined);
  useEffect(() => {
    if (DEMO) { const S = ls.get("daily_demo", { plays: {} }); const done = Object.values(S.plays).filter((x) => x.finished);
      setP({ streak: Math.max(0, ...done.map((x) => x.streak)), perfect: done.filter((x) => x.correct === DAILY_Q).length, days: done.length, football: 12, cricket: 4, week: 0, champ: 0 }); return; }
    if (!user) { setP(null); return; }
    sb.rpc("daily_my_progress").then(({ data, error }) => setP(error ? null : data), () => setP(null));
  }, [user?.id, key]);
  return p;
}
function shareLevel(meta, lv, bn) {
  const t = lvTier(meta, lv.level);
  const text = bn ? `খেলা কখন?-এর দৈনিক চ্যালেঞ্জে আমার "${meta.bn}" ব্যাজ এখন ${t ? t[0] : ""} (${num(lv.v, "bn")} ${meta.ubn})। আপনিও খেলুন: https://khelakokhon.com/quiz/daily`
    : `My "${meta.en}" badge on Khela Kokhon is now ${t ? t[1] : ""} (${lv.v} ${meta.uen}). Play the daily challenge: https://khelakokhon.com/quiz/daily`;
  if (navigator.share) navigator.share({ text }).catch(() => {}); else navigator.clipboard?.writeText(text);
}
// ৬টা লেভেলওয়ালা ব্যাজ
function LevelBadges({ progress, have = [], compact }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const [open, setOpen] = useState(null);
  const when = Object.fromEntries(have.map((b) => [b.id, b.at]));
  const dt = (iso) => { if (!iso) return ""; const d = new Date(iso); return bn ? `${num(d.getDate(), "bn")} ${BN_MONTHS[d.getMonth()]} ${num(d.getFullYear(), "bn")}` : `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
  const sel = open && lvMeta(open);
  const slv = sel && lvOf(sel, progress[sel.m] || 0);
  useBackClose(!!open, () => setOpen(null));
  return (
    <>
      <div className={"lvb-grid" + (compact ? " compact" : "")}>
        {LV_METRICS.map((meta) => {
          const lv = lvOf(meta, progress[meta.m] || 0), t = lvTier(meta, lv.level);
          return (
            <button key={meta.m} className={"lvb-cell" + (t ? "" : " off")} onClick={() => setOpen(meta.m)}>
              <LevelIcon m={meta.m} level={lv.level} stars={lv.stars} size={compact ? 50 : 56} />
              <b>{bn ? meta.bn : meta.en}</b>
              <small className="lvb-tier" style={t ? { color: t[3] } : null}>{t ? `${bn ? t[0] : t[1]}${lv.stars ? ` ★${num(lv.stars, lang)}` : ""}` : (bn ? "এখনো নেই" : "Not yet")} · {num(lv.v, lang)}</small>
              <i className="lvb-bar"><em style={{ width: `${Math.round(lv.pct * 100)}%`, background: t ? t[3] : "var(--muted)" }} /></i>
              <small className="muted">{bn ? `${num(lv.next, "bn")}-এর পথে, আর ${num(lv.next - lv.v, "bn")}` : `${lv.next - lv.v} to ${lv.next}`}</small>
              {meta.m === "week" && progress.champ > 0 && <small className="lvb-champ">{bn ? `চ্যাম্পিয়ন ×${num(progress.champ, "bn")}` : `Champion ×${progress.champ}`}</small>}
            </button>
          );
        })}
      </div>
      {sel && (
        <div className="veil bdg-veil" onClick={() => setOpen(null)}>
          <div className="bdg-pop lvb-pop" onClick={(e) => e.stopPropagation()}>
            <LevelIcon m={sel.m} level={slv.level} stars={slv.stars} size={96} />
            <div className="bdg-pop-t"><b>{bn ? sel.bn : sel.en}</b><span className="muted">{bn ? `এখন পর্যন্ত ${num(slv.v, "bn")} ${sel.ubn}` : `${slv.v} ${sel.uen} so far`}</span></div>
            <div className="lvb-steps">
              {sel.steps.map((x, i) => {
                const lvl = i + 1, t = lvTier(sel, lvl), got = slv.level >= lvl;
                return (
                  <div key={x} className={"lvb-step" + (got ? " got" : "")}>
                    <LevelIcon m={sel.m} level={got ? lvl : 0} size={30} />
                    <span><b>{bn ? t[0] : t[1]}</b><small className="muted">{num(x, lang)} {bn ? sel.ubn : sel.uen}</small></span>
                    <em>{got ? (dt(when[`lv:${sel.m}:${lvl}`]) || (bn ? "অর্জিত" : "Earned")) : (bn ? `আর ${num(x - slv.v, "bn")}` : `${x - slv.v} to go`)}</em>
                  </div>
                );
              })}
              <div className="muted lvb-more">{bn ? `এরপর প্রতি ${num(sel.star, "bn")}-এ একটা করে ★` : `Then a ★ every ${sel.star}`}</div>
            </div>
            <div className="adm-actions">
              {slv.level > 0 && <button className="btn ghost" onClick={() => shareLevel(sel, slv, bn)}>{bn ? "শেয়ার করুন" : "Share"}</button>}
              <button className="btn" onClick={() => setOpen(null)}>{bn ? "ঠিক আছে" : "OK"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


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
      pl.points = pl.raw + (pl.correct === DAILY_Q ? 10 : 0);   // স্ট্রিকে গুণ নেই: সবাই সমান সুযোগে
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
function useDaily(user) {
  const [st, setSt] = useState(null);
  const off = useRef(0);
  const load = useCallback(() => dailyCall("daily_state").then((s) => { off.current = Date.parse(s.now) - Date.now(); setSt(s); return s; })
    .catch((e) => { setSt({ error: e.missing ? "missing" : "x" }); return null; }), []);
  useEffect(() => { load(); }, [user?.id, load]);
  return [st, setSt, load, off];
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

function ProfileBadges({ st, user }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const prog = useDailyProgress(user, st?.badges?.length);
  if (!st || st.error) return null;
  const lvTotal = prog ? LV_METRICS.reduce((n, mt) => n + lvOf(mt, prog[mt.m] || 0).level, 0) : 0;
  const lvMax = LV_METRICS.reduce((n, mt) => n + mt.steps.length, 0);
  return (
    <div className="sec" id="my-badges">
      <div className="sec-h"><h2>{bn ? "দৈনিক চ্যালেঞ্জের ব্যাজ" : "Daily challenge badges"}</h2><button className="link" onClick={() => nav.openDaily()}>{bn ? "খেলুন" : "Play"} →</button></div>
      <div className="card">
        <div className="pb-stats">
          <div><FlameIcon width={18} height={18} className="fl" /><b>{num(st.streak, lang)}</b><small>{bn ? "এখন টানা" : "current streak"}</small></div>
          <div><TrophyIcon width={18} height={18} /><b>{num(st.best_streak, lang)}</b><small>{bn ? "সেরা ধারাবাহিকতা" : "best streak"}</small></div>
          <div><CalIcon width={18} height={18} /><b>{prog ? `${num(lvTotal, lang)}/${num(lvMax, lang)}` : `${num((st.badges || []).length, lang)}/${num(BADGES.length, lang)}`}</b><small>{prog ? (bn ? "ধাপ" : "levels") : (bn ? "ব্যাজ" : "badges")}</small></div>
        </div>
        {prog ? <LevelBadges progress={prog} have={st.badges} compact /> : <BadgeGrid have={st.badges} compact />}
      </div>
    </div>
  );
}

// ছবি ছোট করে (১২৮px JPEG, ~৬ KB; লিডারবোর্ডেও যায়) প্রোফাইলেই রাখা — আলাদা স্টোরেজ লাগে না
function shrinkPhoto(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => {
      const S = 128, c = document.createElement("canvas"); c.width = c.height = S;
      const m = Math.min(img.width, img.height), x = c.getContext("2d");
      x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
      URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("img")); };
    img.src = url;
  });
}
const googlePhoto = (user) => user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

function UserAvatar({ src, name, size }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  return (
    <div className="avatar" style={size ? { width: size, height: size, fontSize: Math.round(size * 0.42) } : undefined}>
      {src && !bad ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBad(true)} /> : (name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

const CamIcon = (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>;

// ── ফোনে নোটিফিকেশন: প্রিয় দলের খেলা শুরু, গোল, খেলা শেষ ──
const VAPID_PUBLIC = "BFMXdQT5h_0cIPpPhwS5-piYi92NJHudRI63NzcxCBfCDO1JD2pK_DC-njO_aQx1DRVWsx4LKhSNs-62SRrl9OM";
const b64u = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
const pushOk = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
const standalone = () => window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;
// ── নোটিফিকেশন চালুর অনুরোধ: প্রিয় দল বাছা বা প্রেডিকশনের পর, ভদ্রভাবে ──
// "এখন না" বললে ৭ দিন, দ্বিতীয়বার থেকে ৩০ দিন আর আসে না। অনুমতি আগেই দেওয়া/আটকানো থাকলে আসে না।
const pushAskReady = () => {
  if (DEMO || !pushOk() || Notification.permission !== "default") return false;
  if (isIOS() && !standalone()) return false;   // আইফোনের ব্রাউজারে ওয়েব নোটিফিকেশন চলে না
  return Date.now() > (ls.get("push_ask_until", 0) || 0);
};
function PushAsk({ ask, user, onClose, toast }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const [busy, setBusy] = useState(false);
  useBackClose(!!ask, onClose);
  if (!ask) return null;
  const later = () => {
    const n = (ls.get("push_ask_no", 0) || 0) + 1;
    ls.set("push_ask_no", n);
    ls.set("push_ask_until", Date.now() + (n > 1 ? 30 : 7) * 86400000);
    onClose();
  };
  const yes = async () => {
    setBusy(true);
    const r = await enablePush(user);
    setBusy(false);
    if (r === "ok") { ls.set("push_ask_until", Date.now() + 3650 * 86400000); toast(bn ? "নোটিফিকেশন চালু হয়েছে" : "Notifications on"); onClose(); }
    else if (r === "blocked") { ls.set("push_ask_until", Date.now() + 30 * 86400000); toast(bn ? "ব্রাউজারে নোটিফিকেশন আটকানো আছে। সাইটের সেটিংস থেকে চালু করুন" : "Notifications are blocked in your browser settings", 4200); onClose(); }
    else if (r === "dismissed") later();
    else { toast(bn ? "চালু করা গেল না, পরে প্রোফাইল থেকে চেষ্টা করুন" : "Couldn't turn on; try again from Profile"); onClose(); }
  };
  const team = ask.team;
  return (
    <div className="veil" onClick={later}>
      <div className="sheet push-ask" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="pa-ic"><BellIcon on size={26} /></div>
        <h3>{bn ? (team ? `${team}-এর গোলের খবর সাথে সাথে?` : "গোলের খবর সাথে সাথে পেতে চান?") : (team ? `Get ${team} goals instantly?` : "Get goal alerts instantly?")}</h3>
        <p className="muted">{bn ? "খেলা শুরু, প্রতিটা গোল আর ফুলটাইমের খবর ফোনে চলে আসবে। প্রেডিকশনের ফলও। যখন খুশি প্রোফাইল থেকে বন্ধ করা যায়।" : "Kick-off, every goal and full-time, plus your prediction results. Turn off anytime in Profile."}</p>
        <button className="btn block" disabled={busy} onClick={yes}>{busy ? "…" : bn ? "চালু করুন" : "Turn on"}</button>
        <button className="btn ghost block" onClick={later}>{bn ? "এখন না" : "Not now"}</button>
      </div>
    </div>
  );
}

// ── 🔔 ম্যাচ বা দলের নোটিফিকেশন (প্রিয় দল ছাড়াও) ──
// এই ফোনে নোটিফিকেশন চালু করা (অনুমতি + ঠিকানা জমা)। ফেরত: "ok" | "blocked" | "dismissed" | "unsupported" | "error"
async function enablePush(user) {
  if (!pushOk() || DEMO) return "unsupported";
  try {
    if (Notification.permission === "denied") return "blocked";
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm === "denied") return "blocked";
    if (perm !== "granted") return "dismissed";
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) }));
    const j = sub.toJSON();
    const { error } = await sb.from("push_subs").upsert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" });
    return error ? "error" : "ok";
  } catch { return "error"; }
}
const pfStore = { uid: null, map: null, subs: new Set(), loading: null };
async function loadPushFollows(user) {
  if (!user || DEMO) return {};
  if (pfStore.uid === user.id && pfStore.map) return pfStore.map;
  if (pfStore.loading && pfStore.uid === user.id) return pfStore.loading;
  pfStore.uid = user.id;
  pfStore.loading = sb.from("push_follow").select("kind,target_id,enabled").eq("user_id", user.id).then(({ data }) => {
    pfStore.map = Object.fromEntries((data || []).map((r) => [r.kind + ":" + r.target_id, r.enabled]));
    pfStore.subs.forEach((f) => f({ ...pfStore.map }));
    return pfStore.map;
  });
  return pfStore.loading;
}
function usePushFollows(user) {
  const [map, setMap] = useState(pfStore.uid === user?.id && pfStore.map ? pfStore.map : {});
  useEffect(() => { pfStore.subs.add(setMap); if (user) loadPushFollows(user).then((m) => setMap({ ...m })); return () => pfStore.subs.delete(setMap); }, [user?.id]);
  return map;
}
async function savePushFollow(user, kind, id, val) {
  const k = kind + ":" + id;
  pfStore.map = { ...(pfStore.map || {}) };
  if (val === null) { delete pfStore.map[k]; await sb.from("push_follow").delete().eq("user_id", user.id).eq("kind", kind).eq("target_id", id); }
  else { pfStore.map[k] = val; await sb.from("push_follow").upsert({ user_id: user.id, kind, target_id: id, enabled: val }, { onConflict: "user_id,kind,target_id" }); }
  pfStore.subs.forEach((f) => f({ ...pfStore.map }));
}
const BellIcon = ({ on, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
    {!on && <path d="M3 3l18 18" opacity="0" />}
  </svg>
);
// kind: "match" (দলের হিসাবে আগে থেকে চালু থাকতে পারে, তখন বন্ধও করা যায়) বা "team"
function BellBtn({ user, kind, id, base = false, onLogin, toast, className = "" }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const map = usePushFollows(user);
  const [busy, setBusy] = useState(false);
  const k = kind + ":" + id;
  const on = map[k] !== undefined ? map[k] : base;
  async function click() {
    if (!user) { toast?.(bn ? "নোটিফিকেশন পেতে আগে লগিন করুন" : "Log in to get notifications"); onLogin?.(); return; }
    setBusy(true);
    try {
      if (!on) {
        const r = await enablePush(user);
        if (r !== "ok") {
          toast?.(r === "blocked" ? (bn ? "ব্রাউজারে এই সাইটের নোটিফিকেশন বন্ধ। প্রোফাইল → নোটিফিকেশনে কীভাবে খুলবেন দেখুন" : "Notifications are blocked. See Profile → Notifications")
            : r === "dismissed" ? (bn ? "অনুমতির বার্তায় “Allow” চাপুন" : "Tap “Allow” when asked")
            : r === "unsupported" ? (bn ? "এই ব্রাউজারে নোটিফিকেশন চলে না" : "This browser doesn't support notifications")
            : (bn ? "চালু করা গেল না, একটু পরে আবার চেষ্টা করুন" : "Couldn't turn on, try again later"));
          setBusy(false); return;
        }
      }
      const next = !on;
      // ম্যাচ: দলের হিসাবের সমান হলে আলাদা করে রাখার দরকার নেই
      await savePushFollow(user, kind, id, next === base ? null : next);
      toast?.(next ? (kind === "match" ? (bn ? "এই ম্যাচের নোটিফিকেশন চালু" : "Match alerts on") : (bn ? "এই দলের সব খেলার নোটিফিকেশন চালু" : "Team alerts on"))
        : (kind === "match" ? (bn ? "এই ম্যাচের নোটিফিকেশন বন্ধ" : "Match alerts off") : (bn ? "এই দলের নোটিফিকেশন বন্ধ" : "Team alerts off")));
    } catch { toast?.(bn ? "নোটিফিকেশন এখনো চালু হয়নি, শিগগিরই আসছে" : "Notifications aren't live yet"); }
    setBusy(false);
  }
  return (
    <button className={"bell-btn" + (on ? " on" : "") + (className ? " " + className : "")} disabled={busy} onClick={click}
      aria-pressed={on} aria-label={on ? (bn ? "নোটিফিকেশন বন্ধ করুন" : "Turn off alerts") : (bn ? "নোটিফিকেশন চালু করুন" : "Turn on alerts")}>
      {busy ? <span className="spin sm" /> : <BellIcon on={on} />}
    </button>
  );
}

// ── অ্যাকাউন্ট মোছা (প্লে স্টোরের শর্ত): নিশ্চিত হতে "মুছুন" লিখতে হয় ──
function DeleteAccount({ bn, toast }) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const word = bn ? "ডিলিট একাউন্ট" : "DELETE ACCOUNT";
  // বানানের ছোটখাটো তফাত মেনে নেওয়া: একাউন্ট/অ্যাকাউন্ট, বাড়তি ফাঁকা, ইংরেজি বড়-ছোট হাতের অক্ষর
  const okWord = (t) => { const x = t.trim().replace(/\s+/g, " ").toLowerCase().replace("অ্যাকাউন্ট", "একাউন্ট").replace("এ্যাকাউন্ট", "একাউন্ট"); return x === "ডিলিট একাউন্ট" || x === "delete account"; };
  async function go() {
    setBusy(true);
    try {
      const { data } = await sb.auth.getSession();
      const r = await fetch("/api/account", { method: "POST", headers: { Authorization: "Bearer " + (data?.session?.access_token || "") } }).then((x) => x.json());
      if (!r.ok) throw new Error(r.error || "x");
      try { localStorage.clear(); } catch { /* ignore */ }
      await signOut().catch(() => {});
      toast(bn ? "আপনার অ্যাকাউন্ট আর সব তথ্য মুছে ফেলা হয়েছে" : "Your account and data have been deleted");
      setTimeout(() => location.assign("/"), 1200);
    } catch { toast(bn ? "মোছা গেল না। khelakokhon@gmail.com-এ লিখুন, আমরা মুছে দেব" : "Couldn't delete. Email khelakokhon@gmail.com and we'll do it"); setBusy(false); }
  }
  if (!open) return <button className="del-acc-link" onClick={() => setOpen(true)}>{bn ? "অ্যাকাউন্ট মুছুন" : "Delete account"}</button>;
  return (
    <div className="card del-acc">
      <b>{bn ? "অ্যাকাউন্ট স্থায়ীভাবে মুছবেন?" : "Delete your account permanently?"}</b>
      <p className="muted">{bn ? "আপনার প্রোফাইল, প্রিয় দল, সব প্রেডিকশন ও পয়েন্ট, বন্ধুদের লিগের সদস্যপদ, কুইজ আর দৈনিক চ্যালেঞ্জের রেকর্ড, ব্যাজ আর নোটিফিকেশন সব মুছে যাবে। এটা আর ফেরানো যাবে না।" : "Your profile, teams, predictions and points, league memberships, quiz and daily-challenge records, badges and notifications will all be deleted. This can't be undone."}</p>
      <label className="muted">{bn ? `নিশ্চিত করতে লিখুন: ${word}` : `Type ${word} to confirm`}</label>
      <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={word} />
      <div className="del-acc-btns">
        <button className="btn ghost" onClick={() => { setOpen(false); setTxt(""); }} disabled={busy}>{bn ? "থাক" : "Cancel"}</button>
        <button className="btn danger" onClick={go} disabled={busy || !okWord(txt)}>{busy ? "…" : (bn ? "স্থায়ীভাবে মুছুন" : "Delete permanently")}</button>
      </div>
    </div>
  );
}

function PushCard({ user, hasFav, toast, bn }) {
  const [row, setRow] = useState(undefined); // undefined = দেখা হচ্ছে, null = বন্ধ
  const [busy, setBusy] = useState(false);
  // ব্রাউজারে এই সাইটের নোটিফিকেশন আগে বন্ধ করা থাকলে ব্রাউজার আর জিজ্ঞেস করে না; তখন কীভাবে খুলবেন তা দেখানো
  const [blocked, setBlocked] = useState(() => pushOk() && Notification.permission === "denied");
  useEffect(() => {
    if (!pushOk() || DEMO) { setRow(null); return; }
    let a = true;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub || Notification.permission !== "granted") { a && setRow(null); return; }
        const { data } = await sb.from("push_subs").select("*").eq("endpoint", sub.endpoint).maybeSingle();
        a && setRow(data || null);
      } catch { a && setRow(null); }
    })();
    return () => { a = false; };
  }, [user?.id]);
  async function turnOn() {
    setBusy(true);
    try {
      if (Notification.permission === "denied") { setBlocked(true); setBusy(false); return; }
      const perm = await Notification.requestPermission();
      if (perm === "denied") { setBlocked(true); setBusy(false); return; }
      if (perm !== "granted") { toast(bn ? "অনুমতির বার্তায় “Allow” চাপুন" : "Tap “Allow” when the browser asks"); setBusy(false); return; }
      setBlocked(false);
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) }));
      const j = sub.toJSON();
      const { data, error } = await sb.from("push_subs").upsert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: "endpoint" }).select().single();
      if (error) throw error;
      setRow(data);
      toast(bn ? "নোটিফিকেশন চালু হয়েছে" : "Notifications on");
    } catch (e) {
      const missing = /push_subs|relation|schema cache|PGRST/i.test(String(e?.message || e?.code || ""));
      toast(missing ? (bn ? "নোটিফিকেশন এখনো চালু হয়নি, শিগগিরই আসছে" : "Notifications aren't live yet, coming soon") : (bn ? "চালু করা গেল না, একটু পরে আবার চেষ্টা করুন" : "Couldn't turn on, try again later"));
    }
    setBusy(false);
  }
  async function turnOff() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await sb.from("push_subs").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); }
      setRow(null);
      toast(bn ? "নোটিফিকেশন বন্ধ" : "Notifications off");
    } catch { toast(bn ? "বন্ধ করা গেল না" : "Couldn't turn off"); }
    setBusy(false);
  }
  async function pref(k) {
    const prefs = { start: true, goal: true, end: true, day: true, pred: true, predres: true, news: true, daily: true, ...(row.prefs || {}) };
    prefs[k] = !prefs[k];
    setRow({ ...row, prefs });
    await sb.from("push_subs").update({ prefs }).eq("id", row.id);
  }
  const P = { start: true, goal: true, end: true, day: true, pred: true, predres: true, news: true, daily: true, ...(row?.prefs || {}) };
  return (
    <div className="sec">
      <div className="sec-h"><h2>{bn ? "নোটিফিকেশন" : "Notifications"}</h2></div>
      <div className="card push-card">
        {!pushOk() ? (
          <div className="muted push-note">{isIOS() && !standalone()
            ? (bn ? "আইফোনে: Safari-তে শেয়ার বোতাম চেপে “Add to Home Screen” দিন, তারপর হোম স্ক্রিনের খেলা কখন থেকে এখানে এসে চালু করুন।" : "On iPhone: in Safari tap Share → Add to Home Screen, then open it from the home screen and turn this on.")
            : (bn ? "এই ব্রাউজারে নোটিফিকেশন চলে না। Chrome দিয়ে খুলে দেখুন।" : "This browser doesn't support notifications. Try Chrome.")}</div>
        ) : (
          <>
            <div className="push-top">
              <div><b>{bn ? "প্রিয় দলের খেলার খবর" : "Your teams' match alerts"}</b><small className="muted">{bn ? "খেলা শুরু, প্রতিটা গোল, খেলা শেষ, আর দরকারি সময়ে মনে করিয়ে দেওয়া" : "Kick-off, goals, full time, plus timely reminders"}</small></div>
              <button className={"tgl" + (row ? " on" : "")} disabled={busy || row === undefined} onClick={row ? turnOff : turnOn} aria-pressed={!!row} aria-label={bn ? "নোটিফিকেশন" : "Notifications"}><i /></button>
            </div>
            {row && (
              <div className="push-prefs">
                {[["start", bn ? "খেলা শুরু" : "Kick-off"], ["goal", bn ? "গোল" : "Goals"], ["end", bn ? "খেলা শেষ" : "Full time"], ["day", bn ? "আজ খেলা আছে" : "Match day"], ["pred", bn ? "প্রেডিকশন মনে করানো" : "Prediction reminder"], ["predres", bn ? "প্রেডিকশনের ফল" : "Prediction results"], ["news", bn ? "ঘোষণা" : "Announcements"], ["daily", bn ? "দৈনিক চ্যালেঞ্জ" : "Daily challenge"]].map(([k, l]) => (
                  <button key={k} className={"chip" + (P[k] ? " on" : "")} onClick={() => pref(k)}>{P[k] ? "✓ " : ""}{l}</button>
                ))}
              </div>
            )}
            {blocked && !row && (
              <div className="push-help">
                <b>{bn ? "এই ব্রাউজারে নোটিফিকেশন বন্ধ করা আছে" : "Notifications are blocked in this browser"}</b>
                <ol>
                  <li>{bn ? "ওপরে ঠিকানার ঘরের বাঁ পাশের চিহ্নে চাপুন (তালা বা সেটিংসের চিহ্ন)" : "Tap the icon at the left of the address bar (lock or settings)"}</li>
                  <li>{bn ? "“অনুমতি” বা “Permissions” থেকে “Notifications” খুলে “Allow” করুন" : "Open Permissions → Notifications and choose Allow"}</li>
                  <li>{bn ? "পাতাটা রিফ্রেশ করে আবার এই বোতাম চাপুন" : "Refresh the page and tap the switch again"}</li>
                </ol>
                <small className="muted">{bn ? "হোম স্ক্রিনে ইনস্টল করা থাকলে: ফোনের সেটিংস → অ্যাপস → খেলা কখন → নোটিফিকেশন চালু করুন" : "If installed on your home screen: phone Settings → Apps → Khela Kokhon → Notifications"}</small>
              </div>
            )}
            {row && !hasFav && <div className="muted push-note">{bn ? "এখনো কোনো প্রিয় দল নেই। ওপরে প্রিয় দল যোগ করলে তাদের খেলার খবর আসবে।" : "No favourite teams yet. Add some above to get their alerts."}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ═════════ অ্যাডমিন প্যানেল (/admin): শুধু প্রতিষ্ঠাতার অ্যাকাউন্টে, সাইটের অবস্থা এক নজরে ═════════
const ADMIN_IDS = ["b9593729-5ea4-44f4-9083-7cf4d19721ee"];
function Profile({ user, profile, setProfile, toast, myTeams, teamsById, lang, setLang, theme, setTheme, onEditTeams }) {
  const [editName, setEditName] = useState(null);   // নাম বদলানো (হুক সব রিটার্নের আগে)
  const { t } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [st] = useDaily(user);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  async function pickPhoto(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast(bn ? "শুধু ছবির ফাইল দিন" : "Please choose an image"); return; }
    setBusy(true);
    try { const d = await shrinkPhoto(f); setProfile(await updateProfile(user, { avatar_url: d })); toast(bn ? "ছবি বদলানো হয়েছে" : "Photo updated"); }
    catch { toast(bn ? "ছবি সেভ করা গেল না, আবার চেষ্টা করুন" : "Couldn't save the photo"); }
    setBusy(false);
  }
  async function removePhoto() {
    setBusy(true);
    try { setProfile(await updateProfile(user, { avatar_url: null })); toast(bn ? "ছবি সরানো হয়েছে" : "Photo removed"); }
    catch { toast(bn ? "সরানো গেল না, আবার চেষ্টা করুন" : "Couldn't remove"); }
    setBusy(false);
  }
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
  async function saveName() {
    const v = (editName || "").replace(/\s+/g, " ").trim();
    if (v.length < 2) { toast(bn ? "নাম অন্তত ২ অক্ষরের হতে হবে" : "Name must be at least 2 characters"); return; }
    if (v === profile?.display_name) { setEditName(null); return; }
    setBusy(true);
    try { const p = await updateProfile(user, { display_name: v }); setProfile(p); setEditName(null); toast(bn ? "নাম বদলানো হয়েছে" : "Name updated"); }
    catch { toast(bn ? "নাম সেভ করা গেল না, আবার চেষ্টা করুন" : "Couldn't save the name"); }
    setBusy(false);
  }
  const own = profile?.avatar_url || null;
  const photo = own || googlePhoto(user);
  // অর্জিত ব্যাজ, বড়টা আগে (তালিকার শেষের দিকেরগুলো কঠিন)
  const earned = st && !st.error ? BADGES.map((b) => b[0]).filter((id) => (st.badges || []).some((x) => x.id === id)).reverse() : [];
  // লেভেল চালু থাকলে: প্রতি ব্যাজের সবচেয়ে উঁচু ধাপ, উঁচুটা আগে
  const topLv = (() => {
    const best = {};
    for (const b of (st && !st.error && st.badges) || []) { const L = String(b.id).startsWith("lv:") && lvParse(b.id); if (!L) continue; const sc = L.level * 1000 + L.stars; if (!best[L.meta.m] || sc > best[L.meta.m].sc) best[L.meta.m] = { ...L, sc }; }
    return Object.values(best).sort((a, b) => b.sc - a.sc);
  })();
  const chips = (ids) => ids.map((id) => teamsById[id]).filter(Boolean).map((tm) => (
    <button className="tchip" key={tm.id} onClick={() => nav.openTeam(tm.id)}><Crest team={tm} size={18} />{teamName(tm, lang)}</button>
  ));
  return (
    <>
      <div className="sec">
        <div className="card">
          <div className="prof-head">
            <button className={"av-wrap" + (busy ? " busy" : "")} onClick={() => fileRef.current?.click()} disabled={busy} aria-label={bn ? "প্রোফাইলের ছবি বদলান" : "Change profile photo"}>
              <UserAvatar src={photo} name={name} />
              <span className="av-cam"><CamIcon /></span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
            <div style={{ minWidth: 0 }}>
              {editName !== null ? (
                <form className="name-edit" onSubmit={(e) => { e.preventDefault(); saveName(); }}>
                  <input autoFocus value={editName} maxLength={30} onChange={(e) => setEditName(e.target.value)} placeholder={bn ? "আপনার নাম" : "Your name"} aria-label={bn ? "নাম" : "Name"} />
                  <div className="name-edit-a">
                    <button type="button" className="btn ghost" onClick={() => setEditName(null)} disabled={busy}>{bn ? "বাতিল" : "Cancel"}</button>
                    <button type="submit" className="btn" disabled={busy}>{bn ? "সেভ" : "Save"}</button>
                  </div>
                  <small className="muted">{bn ? "লিডারবোর্ড আর বন্ধুদের লিগে এই নাম দেখাবে (২–৩০ অক্ষর)" : "Shown on leaderboards and friends' leagues (2–30 characters)"}</small>
                </form>
              ) : (
              <div className="prof-name">
                <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{name}</span>
                <button className="name-pen" onClick={() => setEditName(profile?.display_name || "")} aria-label={bn ? "নাম বদলান" : "Edit name"} title={bn ? "নাম বদলান" : "Edit name"}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="m13.5 6.5 4 4" /></svg>
                </button>
                {(topLv.length > 0 || earned.length > 0) && (
                  <button className="prof-bdg" onClick={() => document.getElementById("my-badges")?.scrollIntoView({ behavior: "smooth", block: "start" })} aria-label={bn ? "আমার ব্যাজ" : "My badges"}>
                    {topLv.length ? topLv.slice(0, 6).map((L) => <LevelIcon key={L.meta.m} m={L.meta.m} level={L.level} stars={L.stars} size={24} />) : earned.slice(0, 5).map((id) => <BadgeIcon key={id} id={id} size={22} />)}
                  </button>
                )}
              </div>
              )}
              <div className="muted" style={{ fontSize: 13, overflowWrap: "anywhere" }}>{user.email}</div>
              {own && <button className="av-rm" onClick={removePhoto} disabled={busy}>{bn ? (googlePhoto(user) ? "Google-এর ছবিতে ফিরুন" : "ছবি সরান") : (googlePhoto(user) ? "Use Google photo" : "Remove photo")}</button>}
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
      {ADMIN_IDS.includes(user?.id) && <div className="sec"><a className="btn block admin-btn" href="/admin" onClick={(e) => { e.preventDefault(); history.pushState({}, "", "/admin"); dispatchEvent(new PopStateEvent("popstate")); }}>অ্যাডমিন প্যানেল · শুধু আপনি দেখছেন</a></div>}
      <PushCard user={user} hasFav={myTeams.fav.length > 0} toast={toast} bn={bn} />
      <ProfileBadges st={st} user={user} />
      {settings}
      <div className="sec">
        <button className="btn ghost block" onClick={signOut}>{t("logout")}</button>
        <DeleteAccount bn={bn} toast={toast} />
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
  SPL: ["সৌদি প্রো লিগ", "সৌদি লিগ", "সৌদি", "saudi pro league", "saudi league", "roshn"],
  MLS: ["এমএলএস", "মেজর লিগ সকার", "আমেরিকান লিগ", "mls", "major league soccer"],
  UECL: ["কনফারেন্স লিগ", "কনফারেন্স", "conference league", "uecl"],
  UNL: ["নেশনস লিগ", "নেশন্স লিগ", "nations league", "unl"],
  EURO: ["ইউরো", "ইউরোপিয়ান চ্যাম্পিয়নশিপ", "euro", "euros", "european championship"],
  FAC: ["এফএ কাপ", "এফএকাপ", "fa cup"],
  EFL: ["কারাবাও কাপ", "লিগ কাপ", "ইএফএল কাপ", "carabao cup", "efl cup", "league cup"],
  CDR: ["কোপা দেল রে", "কোপা দেল রেই", "copa del rey"],
  BFC: ["ফেডারেশন কাপ", "ফেড কাপ", "বাংলাদেশ ফেডারেশন কাপ", "federation cup", "fed cup"],
  CCC: ["কনকাকাফ", "কনকাকাফ চ্যাম্পিয়ন্স কাপ", "concacaf", "concacaf champions cup"],
  ACL: ["এএফসি চ্যাম্পিয়ন্স লিগ", "এশিয়ান চ্যাম্পিয়ন্স লিগ", "এএফসি", "afc champions league", "acl"],
  UEL: ["ইউরোপা লিগ", "ইউরোপা", "europa league", "europa", "uel"],
  BPL: ["বাংলাদেশ ফুটবল লিগ", "বিএফএল", "বাংলাদেশ প্রিমিয়ার লিগ", "বিপিএল ফুটবল", "বাংলাদেশ লিগ", "বাংলাদেশের লিগ", "bangladesh football league", "bfl", "bangladesh premier league", "bangladesh league", "bpl"],
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
const COMP_ORDER = ["CL", "PL", "PD", "BL1", "SA", "FL1", "BPL", "BFC", "SPL", "MLS", "UEL", "UECL", "UNL", "EURO", "FAC", "EFL", "CDR", "CCC", "ACL"];
const COMP_LABEL = {
  BAN: ["জাতীয় দল", "National team"], CL: ["চ্যাম্পিয়ন্স লিগ", "Champions League"], PL: ["প্রিমিয়ার লিগ", "Premier League"], PD: ["লা লিগা", "La Liga"], BL1: ["বুন্দেসলিগা", "Bundesliga"], SA: ["সিরি আ", "Serie A"], FL1: ["লিগ ওয়ান", "Ligue 1"], SPL: ["সৌদি প্রো লিগ", "Saudi Pro League"], MLS: ["এমএলএস", "MLS"],
  UECL: ["কনফারেন্স লিগ", "Conference League"], UNL: ["নেশনস লিগ", "Nations League"], EURO: ["ইউরো", "Euro"], FAC: ["এফএ কাপ", "FA Cup"],
  EFL: ["কারাবাও কাপ", "Carabao Cup"], CDR: ["কোপা দেল রে", "Copa del Rey"], BFC: ["ফেডারেশন কাপ", "Federation Cup"], CCC: ["কনকাকাফ চ্যাম্পিয়ন্স কাপ", "CONCACAF Champions Cup"], ACL: ["এএফসি চ্যাম্পিয়ন্স লিগ", "AFC Champions League"],
  UEL: ["ইউরোপা লিগ", "Europa League"], BPL: ["বাংলাদেশ ফুটবল লিগ", "Bangladesh Football League"] };
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
    const full = norm(AF_FULL_EN[r.player_name] || r.player_name).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
    // API-Football-এর খেলোয়াড় (সৌদি, এমএলএস…): বাংলা নাম তালিকা বা উচ্চারণ থেকে
    const bnName = PLAYER_BN[r.player_name] || (r.player_id >= 10000000 ? bnPlayer(r.player_name, "bn") : null);
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

// ── খেলোয়াড়ের পুরো মৌসুম (ক্লাব + জাতীয় দল, সব প্রতিযোগিতা) API-Football থেকে ──
const pfCache = {};
async function playerSeasonFull(pid) {
  if (DEMO || !pid) return null;
  if (pfCache[pid] !== undefined) return pfCache[pid];
  try {
    let af = pid >= 10000000 ? pid - 10000000 : 0;
    if (!af) { const r = await fetch(`/api/live?resolve=${pid}`).then((x) => x.json()); af = r?.id ? (r.id >= 10000000 ? r.id - 10000000 : r.id) : 0; }
    if (!af) return (pfCache[pid] = null);
    const d = await fetch(`/api/live?player=${10000000 + af}`).then((x) => (x.ok ? x.json() : null));
    return (pfCache[pid] = d?.comps?.length ? d : null);
  } catch { return null; }
}
const LG_BN = [[/world cup - qual/i, "বিশ্বকাপ বাছাই"], [/club world cup/i, "ক্লাব বিশ্বকাপ"], [/world cup/i, "বিশ্বকাপ"], [/friendl/i, "প্রীতি ম্যাচ"], [/super ?cup|supercopa|supercoppa/i, "সুপার কাপ"], [/euro.*qual/i, "ইউরো বাছাই"], [/leagues cup/i, "লিগস কাপ"], [/copa am[eé]rica/i, "কোপা আমেরিকা"], [/africa cup|afcon/i, "আফ্রিকান নেশনস কাপ"], [/asian cup/i, "এশিয়ান কাপ"], [/king'?s cup|copa del rey/i, "কোপা দেল রে"], [/fa cup/i, "এফএ কাপ"], [/league cup|efl cup/i, "কারাবাও কাপ"], [/saff/i, "সাফ চ্যাম্পিয়নশিপ"]];
const lgLabel = (c, lang) => (c.code ? compLabel(c.code, lang) : lang === "bn" ? (LG_BN.find(([re]) => re.test(c.league || ""))?.[1] || c.league) : c.league);
function playerFullAnswer(d, r, comp, teams, lang) {
  const bn = lang === "bn";
  const n = (x) => num(x ?? 0, lang);
  const ourTeam = (t) => (t?.id && teams.find((x) => x.id === t.id)) || teams.find((x) => norm(x.name_en || "") === norm(t?.name || "") || norm(x.short_en || "") === norm(t?.name || "")) || { short_en: t?.name, crest: t?.logo };
  const tName = (t) => { const o = ourTeam(t); return o?.id ? teamName(o, lang) : natName(t?.name, lang) || t?.name; };
  const comps = d.comps.filter((c) => (c.apps || 0) > 0 || (c.goals || 0) > 0);
  const name = pName(r, lang);
  if (comp) {
    const c = comps.find((x) => x.code === comp);
    if (!c) return null;
    return {
      text: bn ? `${name} (${tName(c.team)}), এই মৌসুমে ${lgLabel(c, lang)}: ${n(c.goals)} গোল, ${n(c.assists)} অ্যাসিস্ট, ${n(c.apps)} ম্যাচে${c.rating ? `, গড় রেটিং ${num(c.rating, lang)}` : ""}।`
        : `${name} (${tName(c.team)}) this season in the ${lgLabel(c, lang)}: ${c.goals ?? 0} goals, ${c.assists ?? 0} assists in ${c.apps ?? 0} matches${c.rating ? `, average rating ${c.rating}` : ""}.`,
      matches: [], players: [{ ...r, team: ourTeam(c.team), code: comp, goals: c.goals ?? 0 }],
    };
  }
  // দল ধরে ভাগ: আগে ক্লাব, তারপর জাতীয় দল
  const groups = new Map();
  for (const c of comps) { const k = c.team?.af || c.team?.name; if (!groups.has(k)) groups.set(k, { team: c.team, list: [] }); groups.get(k).list.push(c); }
  const ordered = [...groups.values()].sort((a, b) => (b.team?.af === d.team?.af) - (a.team?.af === d.team?.af));
  const G = comps.reduce((t, c) => t + (c.goals || 0), 0), A = comps.reduce((t, c) => t + (c.assists || 0), 0), M = comps.reduce((t, c) => t + (c.apps || 0), 0);
  const who = ordered.map((g) => tName(g.team)).join(" · ");
  const head = bn ? `${name} (${who}), এই মৌসুমে সব মিলিয়ে ${n(G)} গোল, ${n(A)} অ্যাসিস্ট, ${n(M)} ম্যাচে।` : `${name} (${who}): ${G} goals and ${A} assists in ${M} matches this season, all competitions.`;
  const lines = ordered.map((g) => `${tName(g.team)}: ` + g.list.map((c) => bn
    ? `${lgLabel(c, lang)} ${n(c.goals)} গোল${c.assists ? `, ${n(c.assists)} অ্যাসিস্ট` : ""} (${n(c.apps)} ম্যাচ)`
    : `${lgLabel(c, lang)} ${c.goals ?? 0} goals${c.assists ? `, ${c.assists} assists` : ""} (${c.apps ?? 0} apps)`).join(" · "));
  return {
    text: [head, ...lines].join("\n"),
    matches: [],
    players: comps.sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 6).map((c) => ({ ...r, player_id: r.player_id, team: ourTeam(c.team), code: c.code || null, label: lgLabel(c, lang), goals: c.goals ?? 0 })),
  };
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
    const codes = comp ? [comp] : [...new Set(scorers.map((r) => r.competition_code))].sort((a, b) => (COMP_ORDER.indexOf(a) + 1 || 99) - (COMP_ORDER.indexOf(b) + 1 || 99));
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
  const name = pName(r, lang);
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

  // পুরো মৌসুম (ক্লাব + জাতীয় দল, সব প্রতিযোগিতা) পাওয়া গেলে সেটাই, নইলে আগের হিসাব
  const full = await playerSeasonFull(r.player_id);
  if (full) { const ans = playerFullAnswer(full, r, comp, teams, lang); if (ans) return { ...ans, text: ans.text + note }; }

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
    bn: { title: "প্রেডিকশন কীভাবে কাজ করে", intro: "খেলা শুরুর আগে স্কোর প্রেডিক্ট করুন, মিললে পয়েন্ট।",
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
  const comp = mComp(m, lang);
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
// একাধিক শব্দের খোঁজ ("লিওনেল মেসি", "ronaldo nassr"): প্রতিটা শব্দ আলাদা মিলিয়ে, সব শব্দ মিললে
function nameScore(q, names) {
  const words = plain(q).split(" ").filter((w) => w.length >= 2);
  if (words.length > 1) {
    const whole = nameScore1(q, names);
    let worst = 0;
    for (const w of words) { const sc = nameScore1(w, names); if (sc == null) { worst = null; break; } worst = Math.max(worst, sc); }
    return whole != null ? Math.min(whole, worst ?? 99) : worst == null ? null : worst + 0.5;
  }
  return nameScore1(q, names);
}
function nameScore1(q, names) {
  const pq = plain(q);
  let best = null;
  for (const n of names.filter(Boolean)) {
    const pn = plain(n);
    if (pn === pq) return 0;
    if (pn.startsWith(pq)) best = Math.min(best ?? 9, 1);
    else if (pn.split(" ").some((w) => w.startsWith(pq))) best = Math.min(best ?? 9, 2);
    else if (pq.length >= (isBn(pq) ? 2 : 3) && pn.includes(pq)) best = Math.min(best ?? 9, 3);
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
    return [...map.values()].map((r) => ({ ...r, names: [r.player_name, PLAYER_BN[r.player_name], r.player_id >= 10000000 ? bnPlayer(r.player_name, "bn") : null, AF_FULL_EN[r.player_name], ...plain(r.player_name).split(" ").flatMap((w) => nickFor[w] || [])].filter(Boolean) }));
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
              return <button key={"p" + x.id} className="s-row" onClick={() => go(x, () => nav.openPlayer(x.id))}><Avatar url={photoMemo[x.id]} name={x.name} team={t} size={36} /><span className="s-txt"><b>{x.id >= 10000000 ? bnPlayer(x.name, lang) : playerName(x.name, lang)}</b><small className="muted">{t ? teamName(t, lang) : ""}</small></span></button>;
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
              <span className="s-txt"><b>{r.player_id >= 10000000 ? bnPlayer(r.player_name, lang) : pName(r, lang)}</b><small className="muted">{[r.team ? teamName(r.team, lang) : "", posLabel(r.position, lang) || ""].filter(Boolean).join(" · ")}</small></span>
            </button>
          ))}</div>
        
          </>)}</Fragment>
        ))}
      </div>
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

function DatedRows({ list, preds, onOpen, comp }) {
  const { lang } = useT();
  return list.map((m) => (
    <div key={m.id}>
      <div className="muted dr-h">
        <span>{dayLabel(dayKey(m.utc_date), lang, { short: true })}</span>
        {comp && m.competition_code && <span className="dr-c"><CompIcon c={m.competition || { code: m.competition_code }} size={13} />{m.competition_code === "BAN" && m.group_name ? (lang === "bn" ? m.group_name : NT_EN[m.group_name] || m.group_name) : compLabel(m.competition_code, lang)}</span>}
      </div>
      <MatchRow m={m} pred={preds[m.id]} onOpen={onOpen} />
    </div>
  ));
}

// ═════════ লিগের পাতা ═════════
// মোবাইলে টেবিল/ম্যাচ/গোলদাতা ট্যাবে; বড় স্ক্রিনে সব একসাথে (বাঁয়ে টেবিল, ডানে বাকিটা)
// ── লিগের পাতা (FotMob-এর মতো): টেবিল · ম্যাচ · খেলোয়াড় · দল · মৌসুম ──
const lgCache = {}, lgAt = {};
function useLgInfo(code, kind, on = true) {
  const k = code + ":" + kind;
  const [d, setD] = useState(lgCache[k] ?? null);
  useEffect(() => {
    if (DEMO) { setD(false); return; }
    if (!on) return;
    let a = true;
    const load = () => fetch(`/api/live?lg=${code}&kind=${kind}`).then((r) => (r.ok ? r.json() : false)).then((x) => { if (x || lgCache[k] === undefined) { lgCache[k] = x; lgAt[k] = Date.now(); } a && setD(lgCache[k]); }).catch(() => a && lgCache[k] === undefined && setD(false));
    // টেবিল রিয়েল টাইম: পাতা খোলা থাকলে প্রতি মিনিটে নতুন করে (গোল হলেই পয়েন্ট বদলায়)
    if (lgCache[k] === undefined || (kind === "table" && Date.now() - (lgAt[k] || 0) > 30000)) load(); else setD(lgCache[k]);
    const iv = kind === "table" ? everyMin(() => load()) : null;
    return () => { a = false; if (iv) iv(); };
  }, [k, on]);
  return d;
}
// টেবিলের রঙ আর ব্যাখ্যা (উৎসের "description" থেকে)
const zoneOf = (desc) => !desc ? null : /relegation/i.test(desc) ? "z-rel" : /europa/i.test(desc) ? "z-el" : /conference/i.test(desc) ? "z-ecl" : /champions|1\/8|round of 16|next round/i.test(desc) ? "z-cl" : "z-po";
const zoneBn = (desc, bn) => {
  if (!bn) return desc;
  if (/relegation/i.test(desc)) return /round|play/i.test(desc) ? "অবনমন প্লে-অফ" : "অবনমন";
  if (/afc champions/i.test(desc)) return "এএফসি চ্যাম্পিয়ন্স লিগ";
  if (/europa/i.test(desc)) return /qualif/i.test(desc) ? "ইউরোপা লিগ বাছাই" : "ইউরোপা লিগ";
  if (/conference/i.test(desc)) return /qualif/i.test(desc) ? "কনফারেন্স লিগ বাছাই" : "কনফারেন্স লিগ";
  if (/champions league/i.test(desc)) return /qualif/i.test(desc) ? "চ্যাম্পিয়ন্স লিগ বাছাই" : "চ্যাম্পিয়ন্স লিগ";
  if (/1\/8|round of 16|next round/i.test(desc)) return "শেষ ষোলো";
  if (/play/i.test(desc)) return "প্লে-অফ";
  return desc;
};
function TeamCell({ r, teamsById, lang, size = 20 }) {
  const nav = useNav();
  const ours = (r.id && teamsById?.[r.id]) || findTeam(teamsById, r.name) || (r.id && teamsById && Object.keys(teamsById).length === 0 ? { id: r.id, short_en: r.name, crest: r.logo } : null);
  const inner = <><Crest team={ours?.crest ? ours : { short_en: r.name, crest: r.logo }} size={size} /><b>{ours ? teamName(ours, lang) || r.name : r.name}</b></>;
  return ours ? <span className="tm tm-link" role="link" tabIndex={0} onClick={(e) => { e.stopPropagation(); nav.openTeam(ours.id); }}>{inner}</span> : <span className="tm">{inner}</span>;
}
const FORM = { W: ["জ", "w"], D: ["ড্র", "d"], L: ["হা", "l"] };

function LgTable({ code, teamsById, lang, fallback, hl }) {
  const bn = lang === "bn";
  const d = useLgInfo(code, "table");
  const [mode, setMode] = useState("short");
  const [venue, setVenue] = useState("all");
  if (d === null) return <Loading />;
  if (!d || !d.groups?.length) return fallback;
  const descs = [...new Set(d.groups.flat().map((r) => r.desc).filter(Boolean))];
  const rowsOf = (g) => venue === "all" ? g : [...g].map((r) => { const v = r[venue]; return { ...r, all: v, pts: (v.w || 0) * 3 + (v.d || 0), gd: (v.gf || 0) - (v.ga || 0) }; })
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || (b.all.gf || 0) - (a.all.gf || 0)).map((r, i) => ({ ...r, rank: i + 1 }));
  return (
    <>
      <div className="lgt-bar">
        <div className="seg lgt-seg">{[["short", bn ? "সংক্ষেপ" : "Short"], ["full", bn ? "পূর্ণ" : "Full"], ["form", bn ? "ফর্ম" : "Form"]].map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>)}</div>
        <div className="seg lgt-seg">{[["all", bn ? "সব" : "All"], ["home", bn ? "হোম" : "Home"], ["away", bn ? "অ্যাওয়ে" : "Away"]].map(([k, l]) => <button key={k} className={venue === k ? "on" : ""} onClick={() => setVenue(k)}>{l}</button>)}</div>
      </div>
      {d.groups.map((g, gi) => (
        <div key={gi} className="card lgt" style={{ marginBottom: 10 }}>
          {d.groups.length > 1 && g[0]?.group && <div className="lgt-group">{bn ? g[0].group.replace(/^Group\s*/i, "গ্রুপ ") : g[0].group}</div>}
          <div className={"lgt-row lgt-h m-" + mode}>
            <span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "ম্যাচ" : "P"}</span>
            {mode === "full" && <><span>{bn ? "জয়" : "W"}</span><span>{bn ? "ড্র" : "D"}</span><span>{bn ? "হার" : "L"}</span><span className="c-gl">{bn ? "গোল" : "Goals"}</span></>}
            {mode === "form" ? <span className="lgt-form-h">{bn ? "শেষ ৫ ম্যাচ" : "Last 5"}</span> : <span>+/-</span>}
            <span>{bn ? "পয়েন্ট" : "Pts"}</span>
          </div>
          {rowsOf(g).map((r) => (
            <div key={r.af} className={"lgt-row m-" + mode + " " + (venue === "all" ? zoneOf(r.desc) || "" : "") + (hl && (r.id === hl || findTeam(teamsById, r.name)?.id === hl) ? " me" : "")}>
              <span className="pos">{num(r.rank, lang)}</span>
              <span className="lgt-tm"><TeamCell r={r} teamsById={teamsById} lang={lang} />{r.live && <i className="lgt-live" title={bn ? "খেলা চলছে" : "Playing now"} />}</span>
              <span>{num(r.all.p ?? 0, lang)}</span>
              {mode === "full" && <><span>{num(r.all.w ?? 0, lang)}</span><span>{num(r.all.d ?? 0, lang)}</span><span>{num(r.all.l ?? 0, lang)}</span><span className="muted c-gl">{num(r.all.gf ?? 0, lang)}-{num(r.all.ga ?? 0, lang)}</span></>}
              {mode === "form" ? <span className="lgt-form">{(r.form || "").slice(-5).split("").map((f, i) => <i key={i} className={"f-" + (FORM[f]?.[1] || "x")}>{bn ? FORM[f]?.[0] || f : f}</i>)}</span>
                : <span>{r.gd > 0 ? "+" : ""}{num(r.gd ?? 0, lang)}</span>}
              <span className="pts">{num(r.pts ?? 0, lang)}</span>
            </div>
          ))}
        </div>
      ))}
      {d.live && <div className="lgt-legend"><span><i className="lgt-live" style={{ marginLeft: 0 }} />{bn ? "খেলা চলছে · এখনকার স্কোর ধরে পয়েন্ট" : "Playing now · points as it stands"}</span></div>}
      {venue === "all" && descs.length > 0 && (
        <div className="lgt-legend">{[...new Map(descs.map((x) => [zoneBn(x, bn), x])).entries()].map(([label, x]) => <span key={label}><i className={zoneOf(x)} />{label}</span>)}</div>
      )}
    </>
  );
}

function LeaderCard({ title, list, lang, unit, fmt }) {
  const [all, setAll] = useState(false);
  const nav = useNav();
  const bn = lang === "bn";
  if (!list?.length) return null;
  return (
    <div className="card ldr">
      <div className="ldr-h"><b>{title}</b>{list.length > 3 && <button className="link" onClick={() => setAll((x) => !x)}>{all ? (bn ? "কম দেখুন" : "Less") : (bn ? "সব দেখুন" : "See all")}</button>}</div>
      {(all ? list : list.slice(0, 3)).map((r, i) => (
        <button key={r.id || r.af || i} className="ldr-r" onClick={() => r.id && r.id >= 10000000 && !r.af ? nav.openPlayer(r.id) : r.onOpen?.()}>
          <span className="ldr-n muted">{num(i + 1, lang)}</span>
          {r.photo !== undefined ? <PhotoDot src={r.photo} name={r.label || r.name} /> : <Crest team={r.crestTeam} size={26} />}
          <span className="ldr-nm"><b>{r.label || r.name}</b>{r.sub && <small className="muted">{r.sub}</small>}</span>
          <span className={"ldr-v" + (i === 0 ? " top" : "")}>{fmt ? fmt(r.v) : num(r.v, lang)}{unit ? <small> {unit}</small> : null}</span>
        </button>
      ))}
    </div>
  );
}
function PhotoDot({ src, name }) {
  const [bad, setBad] = useState(false);
  return src && !bad ? <img className="ldr-ph" src={src} alt="" width="30" height="30" loading="lazy" onError={() => setBad(true)} /> : <span className="ldr-ph ldr-ph-fb">{(name || "?").slice(0, 1)}</span>;
}

// বাংলাদেশ জাতীয় দলের পাতা: /bangladesh (বা লিগ তালিকা থেকে) — দলের পাতাই, সব টুর্নামেন্টের ম্যাচ মিলিয়ে
let bdTeamId = null;
function BangladeshPage({ favs, ...props }) {
  const [id, setId] = useState(bdTeamId);
  const { lang } = useT();
  useEffect(() => {
    if (id || DEMO) return;
    sb.from("teams").select("id").eq("name_en", "Bangladesh").gte("id", 10000000).limit(1)
      .then(({ data }) => { bdTeamId = data?.[0]?.id || false; setId(bdTeamId); }, () => setId(false));
  }, []);
  if (id) return <Team key={id} id={id} isFav={favs.includes(id)} {...props} />;
  if (id === false || DEMO) return <div className="card empty">{lang === "bn" ? "বাংলাদেশ জাতীয় দলের তথ্য শিগগিরই আসছে।" : "Bangladesh national team coming soon."}</div>;
  return <div className="card"><div className="spin" /></div>;
}
function League({ code, comps, preds, onOpen, teamsById }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const c = comps.find((x) => x.code === code) || { code, name_bn: code, name_en: code };
  const [tab, setTab] = useState("table");
  const tbl = useLgInfo(code, "table");
  const pl = useLgInfo(code, "players", tab === "stats");
  const ss = useLgInfo(code, "seasons", tab === "seasons");
  const [games, setGames] = useState(null);
  useEffect(() => { if (tab === "matches" && games === null) Promise.all([getCompUpcoming(code, 15), getCompRecent(code, 15)]).then(([up, past]) => setGames({ up, past })).catch(() => setGames({ up: [], past: [] })); }, [tab]);
  useEffect(() => { document.title = `${compName(c, lang)} · খেলা কখন?`; return () => { document.title = "খেলা কখন? - Football Live Scores"; }; }, [code, lang]);
  // বাংলাদেশ ফুটবল লিগের মৌসুম API শেষ বছর দিয়ে চিহ্নিত করে (২০২৭ = ২০২৬–২৭)
  const seTxt = (se0) => { const se = se0 && code === "BPL" ? se0 - 1 : se0; return se ? (bn ? `${num(se, "bn")}–${num(String((se + 1) % 100).padStart(2, "0"), "bn")}` : `${se}/${String((se + 1) % 100).padStart(2, "0")}`) : ""; };
  const tabs = [["table", bn ? "টেবিল" : "Table"], ["matches", bn ? "ম্যাচ" : "Matches"], ["stats", bn ? "পরিসংখ্যান" : "Stats"], ...(code === "CL" ? [] : [["seasons", bn ? "মৌসুম" : "Seasons"]])];
  const [sub, setSub] = useState("players");
  const allRows = tbl && tbl.groups ? tbl.groups.flat() : [];
  const teamItem = (r, v) => { const ours = (r.id && teamsById?.[r.id]) || findTeam(teamsById, r.name); return { af: r.af, name: r.name, label: ours ? teamName(ours, lang) || r.name : r.name, crestTeam: ours?.crest ? ours : { short_en: r.name, crest: r.logo }, v, onOpen: ours ? () => nav.openTeam(ours.id) : null }; };
  const top = (f, asc) => allRows.filter((r) => r.all?.p).map((r) => teamItem(r, f(r))).sort((a, b) => (asc ? a.v - b.v : b.v - a.v));
  const tName = (t) => { const ours = t?.af && (teamsById?.[10000000 + t.af] || findTeam(teamsById, t.name)); return ours ? teamName(ours, lang) || t.name : t?.name; };
  const pItems = (list) => (list || []).map((r) => ({ ...r, label: bnPlayer(r.name, lang, r.full), sub: tName(r.team) }));
  const dec1 = (v) => num(v.toFixed(1), lang);
  return (
    <div className="lg-page">
      <div className="lg-hero">
        <button className="afp-back" onClick={() => window.history.back()} aria-label="back"><ChevronIcon style={{ transform: "rotate(-90deg)" }} /></button>
        <div className="lg-hero-id">
          <span className="lg-hero-ic"><CompIcon c={c} size={40} /></span>
          <div><h1>{compName(c, lang)}</h1><small>{[tbl?.country && (tbl.country === "World" ? (bn ? (["CL", "UEL", "UECL", "UNL", "EURO"].includes(code) ? "ইউরোপ" : "আন্তর্জাতিক") : (["CL", "UEL", "UECL", "UNL", "EURO"].includes(code) ? "Europe" : "International")) : natName(tbl.country, lang)), seTxt(tbl?.season)].filter(Boolean).join(" · ")}</small></div>
        </div>
      </div>
      <div className="mp-tabs afp-tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      <div className="sec">
        {tab === "table" && <LgTable code={code} teamsById={teamsById} lang={lang} fallback={<LeagueClassic code={code} comps={comps} preds={preds} onOpen={onOpen} onlyTable />} />}
        {tab === "matches" && (games === null ? <Loading /> : (
          <>
            <div className="sec-h"><h2>{bn ? "সামনের খেলা" : "Upcoming"}</h2></div>
            {games.up.length ? <div className="card"><DatedRows list={games.up} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "সামনে কোনো খেলা নেই" : "No upcoming matches"}</div>}
            <div className="sec-h" style={{ marginTop: 16 }}><h2>{bn ? "সাম্প্রতিক ফল" : "Recent results"}</h2></div>
            {games.past.length ? <div className="card"><DatedRows list={games.past} preds={preds} onOpen={onOpen} /></div> : <div className="card empty">{bn ? "কোনো ফল নেই" : "No results"}</div>}
          </>
        ))}
        {tab === "stats" && <div className="seg lgt-seg" style={{ marginBottom: 12 }}>{[["players", bn ? "খেলোয়াড়" : "Players"], ["teams", bn ? "দল" : "Teams"]].map(([k, l]) => <button key={k} className={sub === k ? "on" : ""} onClick={() => setSub(k)}>{l}</button>)}</div>}
        {tab === "stats" && sub === "players" && (pl === null ? <Loading /> : !pl ? <div className="card empty">{bn ? "খেলোয়াড়ের পরিসংখ্যান এখন পাওয়া যাচ্ছে না" : "Player stats unavailable"}</div> : (
          <div className="ldr-grid">
            <LeaderCard title={bn ? "গোল" : "Goals"} list={pItems(pl.goals)} lang={lang} />
            <LeaderCard title={bn ? "অ্যাসিস্ট" : "Assists"} list={pItems(pl.assists)} lang={lang} />
            <LeaderCard title={bn ? "হলুদ কার্ড" : "Yellow cards"} list={pItems(pl.yellow)} lang={lang} />
            <LeaderCard title={bn ? "লাল কার্ড" : "Red cards"} list={pItems(pl.red)} lang={lang} />
          </div>
        ))}
        {tab === "stats" && sub === "teams" && (tbl === null ? <Loading /> : !allRows.length ? <div className="card empty">{bn ? "দলের পরিসংখ্যান এখন পাওয়া যাচ্ছে না" : "Team stats unavailable"}</div> : (
          <div className="ldr-grid">
            <LeaderCard title={bn ? "সবচেয়ে বেশি গোল" : "Most goals"} list={top((r) => r.all.gf || 0)} lang={lang} />
            <LeaderCard title={bn ? "ম্যাচপ্রতি গোল" : "Goals per match"} list={top((r) => (r.all.gf || 0) / r.all.p)} lang={lang} fmt={dec1} />
            <LeaderCard title={bn ? "ম্যাচপ্রতি সবচেয়ে কম গোল খেয়েছে" : "Fewest conceded per match"} list={top((r) => (r.all.ga || 0) / r.all.p, true)} lang={lang} fmt={dec1} />
            <LeaderCard title={bn ? "সবচেয়ে বেশি জয়" : "Most wins"} list={top((r) => r.all.w || 0)} lang={lang} />
            <LeaderCard title={bn ? "ঘরের মাঠে সেরা (পয়েন্ট)" : "Best at home (pts)"} list={top((r) => (r.home?.w || 0) * 3 + (r.home?.d || 0))} lang={lang} />
            <LeaderCard title={bn ? "প্রতিপক্ষের মাঠে সেরা (পয়েন্ট)" : "Best away (pts)"} list={top((r) => (r.away?.w || 0) * 3 + (r.away?.d || 0))} lang={lang} />
          </div>
        ))}
        {tab === "seasons" && (ss === null ? <Loading /> : !ss || !ss.list?.length ? <div className="card empty">{bn ? "আগের মৌসুমের তথ্য পাওয়া যায়নি" : "No past seasons"}</div> : (
          <div className="ldr-grid">
            {ss.list.map((x) => (
              <div key={x.season} className="card ldr">
                <div className="ldr-h"><b>{seTxt(x.season)}</b></div>
                {[[x.first, bn ? "চ্যাম্পিয়ন" : "Winner"], [x.second, bn ? "রানার্স-আপ" : "Runner-up"]].filter(([r]) => r).map(([r, l], i) => {
                  const it = teamItem(r, r.pts);
                  return (
                    <button key={i} className="ldr-r" onClick={() => it.onOpen?.()}>
                      <span className="ldr-n">{i === 0 ? <TrophyIcon width={18} height={18} style={{ color: "#d4a017" }} /> : <span className="muted">{num(2, lang)}</span>}</span>
                      <Crest team={it.crestTeam} size={26} />
                      <span className="ldr-nm"><b>{it.label}</b><small className="muted">{l}</small></span>
                      <span className="ldr-v">{num(r.pts, lang)}<small> {bn ? "প" : "pts"}</small></span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
function LeagueClassic({ code, comps, preds, onOpen, onlyTable }) {
  const { lang } = useT();
  const nav = useNav();
  const wide = useWide();
  const c = comps.find((x) => x.code === code) || { code, name_bn: code, name_en: code };
  const [tab, setTab] = useState("table");
  const [table, setTable] = useState(() => keep.get("st:" + code) ?? null);
  const [scorers, setScorers] = useState(null);
  const [games, setGames] = useState(null);
  const bn = lang === "bn";

  useEffect(() => { setTable(keep.get("st:" + code) ?? null); getStandings(code).then(setTable).catch(() => setTable((x) => x ?? [])); }, [code]);
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
          <span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "ম্যাচ" : "P"}</span><span>{bn ? "জয়" : "W"}</span><span>{bn ? "ড্র" : "D"}</span><span>{bn ? "হার" : "L"}</span><span>+/-</span><span>{bn ? "পয়েন্ট" : "Pts"}</span>
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

  if (onlyTable) return tableBlock;

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
            <button className="pl-name" onClick={() => nav.openPlayer(s.player_id)}><b>{pName(s, lang)}</b></button>
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
                <span className="sq-av"><Avatar url={photos[p.id] || p.photo} name={p.name} /></span>
                <b>{playerName(p.name, lang)}</b>
                <span className="muted">{[p.number != null ? `#${num(p.number, lang)}` : null, posLabel(p.position, lang), natName(p.nationality, lang)].filter(Boolean).join(" · ")}</span>
                <span className="sq-age">{(age(p.dateOfBirth) ?? p.age) != null ? `${num(age(p.dateOfBirth) ?? p.age, lang)} ${bn ? "বছর" : "y"}` : ""}<i className="sq-go">›</i></span>
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
// ── যেকোনো লিগের খেলোয়াড়ের পাতা (API-Football; আইডি ১ কোটি+) ──
async function getAfPlayer(id) {
  const r = await fetch(`/api/live?player=${id}`);
  if (!r.ok) throw new Error("player");
  return r.json();
}
// "E. Haaland" → "Erling Haaland" (পুরো নাম থাকলে বাংলা নামের তালিকায় মেলে)
// "E. Haaland" → "Erling Haaland", "L. Messi" → "Lionel Messi"; আদ্যক্ষর না থাকলে উৎসের নামই ("Cristiano Ronaldo")
const afFullName = (p) => { const m = /^[A-Z]\.\s+(.+)$/.exec(p.name || ""); return m && p.first ? `${p.first.split(" ")[0]} ${m[1]}` : p.name; };
const nrm = (x) => (x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(fc|cf|afc|sc|ac)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
// API-Football-এর দলের নাম → আমাদের দলের তালিকার দল (বড় ছয় লিগের জন্য, যাতে দলের পাতায় যাওয়া যায়)
const findTeam = (teamsById, name) => { const n = nrm(name); if (!n) return null; return Object.values(teamsById || {}).find((t) => nrm(t.short_en) === n || nrm(t.name_en) === n || nrm(t.name_en).startsWith(n + " ")) || null; };
function AfPlayer({ id, comps, teamsById }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [p, setP] = useState(null);
  const [badPic, setBadPic] = useState(false);
  const [tab, setTab] = useState("pr");
  const [games, setGames] = useState(null);
  const [career, setCareer] = useState(null);
  const [lg, setLg] = useState("all");
  useEffect(() => { let a = true; setP(null); getAfPlayer(id).then((d) => a && setP(d)).catch(() => a && setP(false)); return () => { a = false; }; }, [id]);
  useEffect(() => { if (p?.name) document.title = `${bnPlayer(p.name, lang, afFullName(p))} · খেলা কখন?`; return () => { document.title = "খেলা কখন? - Football Live Scores"; }; }, [p?.name, lang]);
  // ম্যাচ আর ক্যারিয়ার শুধু সেই ট্যাব খুললে আনা
  useEffect(() => {
    if (tab === "mt" && games === null && p?.teams) fetch(`/api/live?pmatches=${id}&teams=${p.teams.join(",")}`).then((r) => r.json()).then((d) => setGames(Array.isArray(d) ? d : [])).catch(() => setGames([]));
    if (tab === "cr" && career === null) fetch(`/api/live?pcareer=${id}`).then((r) => r.json()).then((d) => setCareer(Array.isArray(d) ? d : [])).catch(() => setCareer([]));
  }, [tab, p?.teams?.join(",")]);
  const back = <div className="page-head"><button className="back" onClick={() => window.history.back()} aria-label="back">←</button></div>;
  if (p === null) return <>{back}<div className="sec"><Loading /></div></>;
  if (p === false) return <>{back}<div className="sec"><div className="card empty">{bn ? "খেলোয়াড়ের তথ্য এখন পাওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।" : "Player info isn't available right now."}</div></div></>;

  const C = p.comps || [];
  const tot = (k) => C.reduce((t, c) => t + (c[k] || 0), 0);
  const mins = tot("minutes");
  const rated = C.filter((c) => c.rating);
  const rating = rated.length ? rated.reduce((t, c) => t + c.rating * c.minutes, 0) / (rated.reduce((t, c) => t + c.minutes, 0) || 1) : null;
  const gk = p.position === "Goalkeeper";
  const tiles = [[bn ? "ম্যাচ" : "Apps", num(tot("apps"), lang)], gk ? [bn ? "সেভ" : "Saves", num(tot("saves"), lang)] : [bn ? "গোল" : "Goals", num(tot("goals"), lang)],
    gk ? [bn ? "গোল খেয়েছেন" : "Conceded", num(tot("conceded"), lang)] : [bn ? "অ্যাসিস্ট" : "Assists", num(tot("assists"), lang)],
    rating ? [bn ? "গড় রেটিং" : "Avg rating", num(rating.toFixed(2), lang)] : [bn ? "মিনিট" : "Minutes", num(mins, lang)]];
  const born = p.born && (() => { const [y, m, d] = p.born.split("-").map(Number); return bn ? `${num(d, "bn")} ${BN_MONTHS[m - 1]} ${num(y, "bn")}` : `${d} ${EN_MONTHS[m - 1]} ${y}`; })();
  const info = [
    [bn ? "পজিশন" : "Position", posLabel(p.position, lang)],
    [bn ? "বয়স" : "Age", p.age != null ? `${num(p.age, lang)} ${bn ? "বছর" : ""}`.trim() : null],
    [bn ? "জন্ম" : "Born", born && (p.birthplace ? `${born}, ${p.birthplace}` : born)],
    [bn ? "দেশ" : "Nationality", natName(p.nationality, lang)],
    [bn ? "উচ্চতা" : "Height", p.height && (bn ? num(p.height.replace(" cm", ""), "bn") + " সেমি" : p.height)],
    [bn ? "ওজন" : "Weight", p.weight && (bn ? num(p.weight.replace(" kg", ""), "bn") + " কেজি" : p.weight)],
    [bn ? "জার্সি" : "Shirt", p.number != null ? num(p.number, lang) : null],
  ].filter(([, v]) => v);
  const compOf = (code) => comps.find((c) => c.code === code);
  const teamLink = p.team ? ((p.team.id && teamsById?.[p.team.id]) || findTeam(teamsById, p.team.name)) : null;
  const logo = (src) => (src ? <img src={src} alt="" width="18" height="18" style={{ objectFit: "contain" }} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} /> : null);
  const lgName = (code, name) => (code && compOf(code) ? compName(compOf(code), lang) : name);
  const RES = { W: bn ? "জ" : "W", D: bn ? "ড্র" : "D", L: bn ? "হা" : "L" };
  const tabs = [["pr", bn ? "পরিচয়" : "Profile"], ["mt", bn ? "ম্যাচ" : "Matches"], ["st", bn ? "পরিসংখ্যান" : "Stats"], ["cr", bn ? "ক্যারিয়ার" : "Career"]];
  const seasonTxt = (se) => (bn ? `${num(se, "bn")}–${num(String((se + 1) % 100).padStart(2, "0"), "bn")}` : `${se}/${String((se + 1) % 100).padStart(2, "0")}`);

  return (
    <div className="afp-page">
      <div className="afp-head">
        <button className="afp-back" onClick={() => window.history.back()} aria-label="back"><ChevronIcon style={{ transform: "rotate(-90deg)" }} /></button>
        <div className="afp-id">
          {p.photo && !badPic
            ? <img className="afp-ph" src={p.photo} alt="" width="64" height="64" onError={() => setBadPic(true)} />
            : <span className="afp-ph afp-ph-fb">{p.number != null ? num(p.number, lang) : (p.name || "?").slice(0, 1)}</span>}
          <div style={{ minWidth: 0 }}>
            <h1>{bnPlayer(p.name, lang, afFullName(p))}{p.injured && <span className="pl-inj">{bn ? "ইনজুরিতে" : "Injured"}</span>}</h1>
            {p.team && (teamLink
              ? <button className="afp-team" onClick={() => nav.openTeam(teamLink.id)}><Crest team={teamLink.crest ? teamLink : { ...teamLink, crest: p.team.logo }} size={16} />{teamName(teamLink, lang) || p.team.name}</button>
              : <span className="afp-team"><Crest team={{ crest: p.team.logo, short_en: p.team.name }} size={16} />{p.team.name}</span>)}
          </div>
        </div>
      </div>
      <div className="mp-tabs afp-tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === "pr" && (
        <>
          {C.length > 0 && (
            <div className="sec">
              <div className="sec-h"><h2>{bn ? "এই মৌসুমে" : "This season"}</h2></div>
              <div className="card stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>{tiles.map(([l, v]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div>
            </div>
          )}
          {info.length > 0 && (
            <div className="sec">
              <div className="sec-h"><h2>{bn ? "পরিচয়" : "Profile"}</h2></div>
              <div className="card">{info.map(([k, v]) => <div className="info-row" key={k}><span className="muted">{k}</span><b>{v}</b></div>)}</div>
            </div>
          )}
        </>
      )}

      {tab === "mt" && (games === null ? <div className="sec"><Loading /></div> : !games.length ? <div className="sec"><div className="card empty">{bn ? "সাম্প্রতিক ম্যাচ পাওয়া যায়নি" : "No recent matches"}</div></div> : (() => {
        const lgs = [...new Map(games.map((g) => [g.league, g])).values()];
        const shown = games.filter((g) => lg === "all" || g.league === lg);
        return (
          <div className="sec">
            {lgs.length > 1 && (
              <div className="chips" style={{ marginBottom: 10 }}>
                <button className={"chip" + (lg === "all" ? " on" : "")} onClick={() => setLg("all")}>{bn ? "সব" : "All"}</button>
                {lgs.map((g) => <button key={g.league} className={"chip" + (lg === g.league ? " on" : "")} onClick={() => setLg(g.league)}>{lgName(g.code, g.league)}</button>)}
              </div>
            )}
            <div className="card">
              {shown.map((g, i) => (
                <button key={i} className="pmr" onClick={() => g.id && nav.openMatch({ id: g.id })} disabled={!g.id}>
                  <span className="pmr-top muted"><span>{dayLabel(dayKey(g.date), lang, { short: true })}</span><span>{lgName(g.code, g.league)}</span></span>
                  <span className="pmr-main">
                    {logo(g.opp.logo)}
                    <span className="pmr-opp"><b>{g.opp.name}</b><small>{g.home ? (bn ? "হোম" : "Home") : (bn ? "অ্যাওয়ে" : "Away")} · {g.team.name}</small></span>
                    {g.res && <span className={"pmr-res r" + g.res}>{RES[g.res]} {num(g.gf, lang)}-{num(g.ga, lang)}</span>}
                    <span className="pmr-me">
                      {g.goals > 0 && <BallMini n={g.goals} />}
                      {g.assists > 0 && <BootMini n={g.assists} />}
                      {g.rc ? <i className="pmr-card red" /> : g.yc ? <i className="pmr-card" /> : null}
                      {g.bench ? <small className="muted">{bn ? "বেঞ্চে" : "Bench"}</small> : g.min != null && <small className="muted">{num(g.min, lang)}'</small>}
                      {g.rating ? <em className={"pm-r " + rateCls(g.rating)}>{num(g.rating.toFixed(1), lang)}</em> : null}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })())}

      {tab === "st" && (C.length > 0 ? (
        <div className="sec">
          <div className="card">
            <div className="scr scr-h afp"><span /><span style={{ textAlign: "left" }}>{bn ? "প্রতিযোগিতা" : "Competition"}</span><span>{bn ? "ম্যাচ" : "Apps"}</span><span>{gk ? (bn ? "সেভ" : "Sv") : (bn ? "গোল" : "G")}</span><span>{gk ? (bn ? "খেয়েছেন" : "GA") : (bn ? "অ্যা." : "A")}</span><span>{bn ? "রেটিং" : "Rtg"}</span></div>
            {C.map((c, i) => {
              const cc = c.code && compOf(c.code);
              return (
                <button className="scr afp" key={i} onClick={() => cc && nav.openLeague(c.code)} disabled={!cc}>
                  <span>{cc ? <CompIcon c={cc} size={18} /> : logo(c.logo)}</span>
                  <span className="pl"><b>{cc ? compName(cc, lang) : c.league}</b>{c.team?.name && <span className="muted" style={{ fontSize: 12 }}>{c.team.name} · {num(c.minutes, lang)} {bn ? "মিনিট" : "min"}</span>}</span>
                  <span>{num(c.apps, lang)}</span>
                  <span className="pts">{num(gk ? c.saves || 0 : c.goals, lang)}</span>
                  <span className="muted">{num(gk ? c.conceded || 0 : c.assists, lang)}</span>
                  <span>{c.rating ? <em className={"pm-r " + rateCls(c.rating)}>{num(c.rating.toFixed(1), lang)}</em> : "—"}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : <div className="sec"><div className="card empty">{bn ? "এই মৌসুমের পরিসংখ্যান এখনো পাওয়া যায়নি।" : "No stats yet."}</div></div>)}

      {tab === "cr" && (career === null ? <div className="sec"><Loading /></div> : !career.length ? <div className="sec"><div className="card empty">{bn ? "ক্যারিয়ারের তথ্য পাওয়া যায়নি" : "No career data"}</div></div> : (
        <div className="sec">
          <div className="card">
            <div className="scr scr-h afp"><span /><span style={{ textAlign: "left" }}>{bn ? "দল · মৌসুম" : "Team · Season"}</span><span>{bn ? "ম্যাচ" : "Apps"}</span><span>{bn ? "গোল" : "G"}</span><span>{bn ? "অ্যা." : "A"}</span><span>{bn ? "রেটিং" : "Rtg"}</span></div>
            {(() => { const R = career.filter((r) => r.apps != null); const t = (k) => R.reduce((a, r) => a + (r[k] || 0), 0); return R.length ? (
              <div className="scr afp cr-tot"><span /><span className="pl"><b>{bn ? "ক্যারিয়ারে মোট" : "Career total"}</b><span className="muted" style={{ fontSize: 12 }}>{bn ? "ক্লাব ও জাতীয় দল" : "Club & country"}</span></span><span>{num(t("apps"), lang)}</span><span className="pts">{num(t("goals"), lang)}</span><span className="muted">{num(t("assists"), lang)}</span><span /></div>
            ) : null; })()}
            {career.map((r, i) => (
              <div className="scr afp" key={i}>
                <span>{logo(r.team.logo)}</span>
                <span className="pl"><b>{r.team.name}</b><span className="muted" style={{ fontSize: 12 }}>{seasonTxt(r.season)}</span></span>
                <span>{r.apps == null ? "—" : num(r.apps, lang)}</span>
                <span className="pts">{r.goals == null ? "—" : num(r.goals, lang)}</span>
                <span className="muted">{r.assists == null ? "—" : num(r.assists, lang)}</span>
                <span>{r.rating ? <em className={"pm-r " + rateCls(r.rating)}>{num(r.rating.toFixed(1), lang)}</em> : "—"}</span>
              </div>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
}

// যেকোনো খেলোয়াড়ের পাতা: বড় ছয় লিগের খেলোয়াড়কে API-Football-এ খুঁজে নতুন পাতায়; না মিললে আগের পাতা
const resolved = {};
function PlayerAny({ id, comps, teamsById }) {
  const [af, setAf] = useState(id >= 10000000 ? id : DEMO ? 0 : resolved[id] ?? null);
  useEffect(() => {
    if (af !== null) return;
    let a = true;
    fetch(`/api/live?resolve=${id}`).then((r) => r.json()).then((d) => { resolved[id] = d?.id || 0; a && setAf(resolved[id]); }).catch(() => a && setAf(0));
    return () => { a = false; };
  }, [id]);
  if (af === null) return <><div className="page-head"><button className="back" onClick={() => window.history.back()} aria-label="back">←</button></div><div className="sec"><Loading /></div></>;
  return af ? <AfPlayer id={af} comps={comps} teamsById={teamsById} /> : <Player id={id} teamsById={teamsById} comps={comps} />;
}

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
  Defender: "ডিফেন্ডার", Midfielder: "মিডফিল্ডার", Attacker: "ফরোয়ার্ড",
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

function Team({ id, teamsById, preds, onOpen, isFav, onToggleFav, user, toast, onLogin }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  const [pos, setPos] = useState(null);
  const [up, setUp] = useState(null);
  const [past, setPast] = useState(null);
  const [tab, setTab] = useState("overview");
  const [cf, setCf] = useState("all");
  const [info, setInfo] = useState(null);
  const [photos, setPhotos] = useState({});
  useEffect(() => {
    if (!info) return; // দলের পাতা খুললেই পেছনে ছবি আনা শুরু, স্কোয়াড ট্যাবে যাওয়ার আগেই
    if (id >= 10000000) return; // API-Football-এর স্কোয়াডে ছবি আগেই থাকে
    let live = true;
    setPhotos({ ...photoMemo });
    getPhotos({ team: id }).then((d) => live && setPhotos(d)).catch(() => {});
    return () => { live = false; };
  }, [!!info, id]);
  const team = teamsById[id] || up?.map((m) => (m.home_id === id ? m.home : m.away))[0] || past?.map((m) => (m.home_id === id ? m.home : m.away))[0];

  useEffect(() => {
    setPos(null); setUp(null); setPast(null); setTab("overview"); setCf("all");
    getTeamStandings(id).then((r) => setPos(r.sort((a, b) => (a.competition_code === "CL") - (b.competition_code === "CL")))).catch(() => setPos([]));
    getTeamMatches([id], { upcoming: true, limit: 30 }).then(setUp).catch(() => setUp([]));
    getTeamMatches([id], { upcoming: false, limit: 40 }).then(setPast).catch(() => setPast([]));
    setInfo(null);
    getTeamInfo(id).then(setInfo).catch(() => setInfo(false));
  }, [id]);

  const res = (m) => {
    const me = m.home_id === id ? m.home_score : m.away_score, them = m.home_id === id ? m.away_score : m.home_score;
    return me > them ? "W" : me < them ? "L" : "D";
  };
  const form = (past || []).slice(0, 5).reverse();
  const next = (up || [])[0];
  // সব প্রতিযোগিতার রেকর্ড (এই মৌসুমের ফল থেকে)
  const rec = (past || []).reduce((a, m) => { a[res(m)]++; const me = m.home_id === id; a.gf += (me ? m.home_score : m.away_score) || 0; a.ga += (me ? m.away_score : m.home_score) || 0; return a; }, { W: 0, D: 0, L: 0, gf: 0, ga: 0 });
  const compsIn = [...new Set([...(up || []), ...(past || [])].map((m) => m.competition_code).filter(Boolean))];
  const byComp = (list) => (cf === "all" ? list : list.filter((m) => m.competition_code === cf));
  const tabs = [["overview", bn ? "এক নজরে" : "Overview"], ["matches", bn ? "ম্যাচ" : "Matches"], ...(pos?.length ? [["table", bn ? "টেবিল" : "Table"]] : []), ["squad", bn ? "খেলোয়াড়" : "Squad"]];
  const infoRows = info ? [
    [bn ? "মাঠ" : "Stadium", info.venue && [info.venue, info.city].filter(Boolean).join(", ")],
    [bn ? "দর্শক ধারণক্ষমতা" : "Capacity", info.capacity && num(info.capacity, lang)],
    [bn ? "প্রতিষ্ঠা" : "Founded", info.founded && num(info.founded, lang)],
    [bn ? "কোচ" : "Coach", info.coach?.name],
  ].filter(([, v]) => v) : [];

  return (
    <>
      <div className="page-head">
        <button className="back" onClick={() => window.history.back()} aria-label="back">←</button>
      </div>
      <div className="team-hero row">
        <Crest team={team} size={72} />
        <div className="th-name">
          <h1>{teamName(team, lang)}</h1>
          {team && bn && <div className="muted" style={{ fontSize: 13 }}>{teamName(team, "en")}</div>}
        </div>
        {team && (
          <div className="team-acts">
            <BellBtn user={user} kind="team" id={id} base={!!isFav} toast={toast} onLogin={onLogin} className="team-bell" />
        {onToggleFav && (
          <button className={"fav-btn" + (isFav ? " on" : "")} onClick={() => onToggleFav(id)}>
            <span>{isFav ? "★" : "☆"}</span>{isFav ? (bn ? "প্রিয় দল" : "Favourite") : (bn ? "প্রিয় দলে যোগ করুন" : "Add to favourites")}
          </button>
        )}
          </div>
        )}
      </div>
      {pos?.length > 0 && (
        <div className="team-pos">
          {pos.map((p) => (
            <button key={p.competition_code} className="chip" onClick={() => nav.openLeague(p.competition_code)}>
              <CompIcon c={p.competition} size={16} />{compName(p.competition, lang)} · {ord(p.position, lang)}
            </button>
          ))}
        </div>
      )}

      <div className="mp-tabs team-tabs" role="tablist">
        {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === "overview" && (
        <>
          <div className="sec">
            <div className="sec-h"><h2>{bn ? "পরের ম্যাচ" : "Next match"}</h2></div>
            {up === null ? <Loading /> : next ? <div className="card"><DatedRows list={[next]} preds={preds} onOpen={onOpen} comp /></div> : <div className="card empty">{bn ? "সামনে কোনো খেলা সূচিতে নেই" : "No upcoming fixtures"}</div>}
          </div>
          {form.length > 0 && (
            <div className="sec">
              <div className="sec-h"><h2>{bn ? "শেষ পাঁচ ম্যাচের ফর্ম" : "Form (last 5)"}</h2><span className="muted" style={{ fontSize: 12 }}>{compList(form.map((m) => m.competition_code), lang)}</span></div>
              <div className="form-row">
                {form.map((m) => { const r = res(m); return <button key={m.id} className={"badge big " + r + (bn ? " word" : "")} onClick={() => onOpen(m)}>{RES[r][bn ? 0 : 1]}</button>; })}
              </div>
            </div>
          )}
          {(past || []).length > 0 && (
            <div className="sec">
              <div className="sec-h"><h2>{bn ? "এই মৌসুম, সব প্রতিযোগিতা" : "This season, all competitions"}</h2></div>
              <div className="card stat-row">
                {[[bn ? "খেলা" : "Played", past.length], [bn ? "জয়" : "Won", rec.W], [bn ? "ড্র" : "Drawn", rec.D], [bn ? "হার" : "Lost", rec.L], [bn ? "গোল" : "Goals", `${num(rec.gf, lang)}-${num(rec.ga, lang)}`]].map(([l, v]) => (
                  <div key={l}><b>{typeof v === "number" ? num(v, lang) : v}</b><span>{l}</span></div>
                ))}
              </div>
            </div>
          )}
          {(pos || []).map((st) => (
            <div className="sec" key={st.competition_code}>
              <div className="sec-h"><h2 className="my-h"><CompIcon c={st.competition} size={16} />{compLabel(st.competition_code, lang)}{st.position ? <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}> · {ord(st.position, lang)}</span> : null}</h2></div>
              <div className="card stat-row">
                {[[bn ? "খেলা" : "Played", st.played], [bn ? "জয়" : "Won", st.won], [bn ? "ড্র" : "Drawn", st.draw], [bn ? "হার" : "Lost", st.lost], [bn ? "গোল" : "Goals", `${num(st.gf, lang)}-${num(st.ga, lang)}`], [bn ? "পয়েন্ট" : "Points", st.points]].map(([l, v]) => (
                  <div key={l}><b>{typeof v === "number" ? num(v, lang) : v}</b><span>{l}</span></div>
                ))}
              </div>
            </div>
          ))}
          <div className="sec">
            <div className="sec-h"><h2>{bn ? "সাম্প্রতিক ফল" : "Recent results"}</h2>{(past || []).length > 3 && <button className="link" onClick={() => setTab("matches")}>{bn ? "সব ম্যাচ" : "All matches"}</button>}</div>
            {past === null ? <Loading /> : past.length ? <div className="card"><DatedRows list={past.slice(0, 3)} preds={preds} onOpen={onOpen} comp /></div> : <div className="card empty">{bn ? "কোনো ফল নেই" : "No results"}</div>}
          </div>
          {infoRows.length > 0 && (
            <div className="sec">
              <div className="sec-h"><h2>{bn ? "ক্লাবের তথ্য" : "Club info"}</h2></div>
              <div className="card">{infoRows.map(([l, v]) => <div key={l} className="info-row"><span className="muted">{l}</span><b>{v}</b></div>)}</div>
            </div>
          )}
        </>
      )}

      {tab === "matches" && (
        <>
          {compsIn.length > 1 && (
            <div className="team-cf">
              <button className={"chip" + (cf === "all" ? " on" : "")} onClick={() => setCf("all")}>{bn ? "সব" : "All"}</button>
              {compsIn.map((c) => <button key={c} className={"chip" + (cf === c ? " on" : "")} onClick={() => setCf(c)}>{compLabel(c, lang)}</button>)}
            </div>
          )}
          <div className="sec">
            <div className="sec-h"><h2>{bn ? "সামনের খেলা" : "Upcoming"}</h2></div>
            {up === null ? <Loading /> : byComp(up).length ? <div className="card"><DatedRows list={byComp(up)} preds={preds} onOpen={onOpen} comp /></div> : <div className="card empty">{bn ? "সামনে কোনো খেলা সূচিতে নেই" : "No upcoming fixtures"}</div>}
          </div>
          <div className="sec">
            <div className="sec-h"><h2>{bn ? "ফল" : "Results"}</h2></div>
            {past === null ? <Loading /> : byComp(past).length ? <div className="card"><DatedRows list={byComp(past)} preds={preds} onOpen={onOpen} comp /></div> : <div className="card empty">{bn ? "কোনো ফল নেই" : "No results"}</div>}
          </div>
        </>
      )}

      {tab === "table" && (pos || []).map((st) => (
        <div className="sec" key={st.competition_code}>
          <div className="sec-h"><h2 className="my-h"><CompIcon c={st.competition} size={16} />{compLabel(st.competition_code, lang)}</h2><button className="link" onClick={() => nav.openLeague(st.competition_code)}>{bn ? "লিগের পাতা" : "League page"}</button></div>
          <LgTable code={st.competition_code} teamsById={teamsById} lang={lang} hl={id} fallback={<div className="card empty">{bn ? "টেবিল এখন পাওয়া যাচ্ছে না" : "Table unavailable"}</div>} />
        </div>
      ))}

      {tab === "squad" && <div className="sec"><Squad info={info} lang={lang} photos={photos} /></div>}
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
const PAGE_PATHS = { about: "about", "how-it-works": "how", founder: "founder", contact: "contact", privacy: "privacy", faq: "faq" };
const PAGE_URL = { about: "/about", how: "/how-it-works", founder: "/founder", contact: "/contact", privacy: "/privacy", faq: "/faq" };
const viewFromPath = () => {
  const [, kind, id] = window.location.pathname.split("/");
  if (kind === "league" && id) return { kind: "league", code: id.toUpperCase() };
  if (kind === "bangladesh" && !id) return { kind: "league", code: "BAN" };
  if (kind === "team" && /^\d+$/.test(id || "")) return { kind: "team", id: +id };
  if (kind === "player" && /^\d+$/.test(id || "")) return { kind: "player", id: +id };
  if (kind === "match" && /^\d+$/.test(id || "")) return { kind: "match", id: +id };
  // স্পোর্টস কুইজ: /quiz/daily (দৈনিক চ্যালেঞ্জ), /quiz/play (একা বা বন্ধুদের সাথে), /quiz/play/কোড (কুইজ রুম)
  // পুরনো লিংক /daily আর /quiz/কোড-ও চলে; শুধু /quiz হলে শেষবার যে ভাগে ছিলেন
  const isCode = (x) => x && /^[A-Za-z0-9]{4,8}$/.test(x);
  if (kind === "quiz") {
    const sub = (id || "").toLowerCase(), code = window.location.pathname.split("/")[3];
    if (sub === "daily") return { kind: "daily" };
    if (sub === "play") return { kind: "quiz", code: isCode(code) ? code.toUpperCase() : null };
    if (!id) return ls.get("quiz_last", "daily") === "quiz" ? { kind: "quiz", code: null } : { kind: "daily" };
    return { kind: "quiz", code: isCode(id) ? id.toUpperCase() : null };
  }
  if (kind === "daily" && !id) return { kind: "daily" };
  if (PAGE_PATHS[kind] && !id) return { kind: "page", id: PAGE_PATHS[kind] };
  if (kind === "admin" && !id) return { kind: "admin" };
  return null;
};
// পাতার আসল ঠিকানা (পুরনো লিংক খুললে ঠিকানার ঘরে এটা বসে যায়)
const quizPath = (v) => (v?.kind === "daily" ? "/quiz/daily" : v?.kind === "quiz" ? (v.code ? `/quiz/play/${v.code}` : "/quiz/play") : null);
// প্রতি মিনিটে নতুন তথ্য, আর অ্যাপে ফিরলেই সাথে সাথে (পাতা রিফ্রেশ করতে হয় না); ফেরত দেয় থামানোর ফাংশন
function everyMin(fn, ms = 60000) {
  const run = () => { if (!document.hidden) fn(); };
  const iv = setInterval(run, ms);
  addEventListener("online", run);
  document.addEventListener("visibilitychange", run);
  return () => { clearInterval(iv); removeEventListener("online", run); document.removeEventListener("visibilitychange", run); };
}
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

// ── সাইটে কাটানো সময় (অ্যাডমিনের "ব্যবহার" ট্যাবের জন্য; প্রাইভেসি পলিসিতে লেখা আছে) ──
// সাইট খোলা আর স্ক্রিনে সামনে থাকলেই শুধু গোনা; প্রতি ৩০ সেকেন্ডে একবার, পেছনে গেলে থামে
// লগইন থাকলে সার্ভার নিজেই চেনে; না থাকলে ফোনের একটা বেনামি আইডি (নাম বা ব্যক্তিগত তথ্য নয়)
const actSection = (p) => {
  const k = p.split("/")[1] || "";
  return { "": "matches", leagues: "leagues", league: "league", team: "team", match: "match", player: "player", predict: "predict", quiz: "quiz", daily: "quiz", ask: "ask", profile: "profile", bangladesh: "bangladesh", join: "predict", admin: "admin" }[k] || "pages";
};
function actRef() {
  try {
    const got = localStorage.getItem("kk_ref"); if (got) return null; // শুধু প্রথমবার পাঠানো হয়
    const q = new URLSearchParams(location.search).get("utm_source");
    const r = document.referrer || "";
    const v = q ? q.toLowerCase().slice(0, 20)
      : matchMedia("(display-mode: standalone)").matches ? "app"
      : /facebook|fb\.|messenger/i.test(r) ? "facebook" : /google\./i.test(r) ? "google" : /bing\.|duckduckgo|yahoo/i.test(r) ? "search"
      : /t\.co|twitter|x\.com/i.test(r) ? "x" : /youtube/i.test(r) ? "youtube" : /instagram/i.test(r) ? "instagram"
      : r && !r.includes(location.host) ? "other" : "direct";
    localStorage.setItem("kk_ref", v);
    return v;
  } catch { return null; }
}
function actDev() {
  try { let d = localStorage.getItem("kk_dev"); if (!d) { d = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem("kk_dev", d); } return d; } catch { return null; }
}
function actSid() {
  try {
    const now = Date.now(), last = +sessionStorage.getItem("kk_sid_t") || 0;
    let s = sessionStorage.getItem("kk_sid");
    if (!s || now - last > 30 * 60000) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("kk_sid", s); }
    sessionStorage.setItem("kk_sid_t", String(now));
    return s;
  } catch { return "x"; }
}
const actPlatform = () => { const u = navigator.userAgent; const os = /Android/i.test(u) ? "android" : /iPhone|iPad|iPod/i.test(u) ? "ios" : "desktop"; try { return matchMedia("(display-mode: standalone)").matches ? os + "-app" : os; } catch { return os; } };
function useActivity(userId) {
  useEffect(() => {
    if (DEMO || !sb) return;
    let since = document.visibilityState === "visible" ? Date.now() : null;
    const send = () => {
      if (since == null) return;
      const sec = Math.round((Date.now() - since) / 1000);
      since = document.visibilityState === "visible" ? Date.now() : null;
      if (sec < 3) return;
      sb.rpc("log_activity", { p_dev: actDev(), p_sec: Math.min(sec, 60), p_sec_name: actSection(location.pathname), p_sid: actSid(), p_ref: actRef(), p_platform: actPlatform() }).then(() => {}, () => {});
    };
    const iv = setInterval(() => { if (document.visibilityState === "visible") send(); }, 30000);
    const vis = () => { if (document.visibilityState === "visible") { if (since == null) since = Date.now(); } else send(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", vis); send(); };
  }, [userId]);
}

// কম ব্যবহৃত বড় পাতা: প্রথম খোলায় নামে না, সেই পাতায় গেলে তখন (মূল কোড ছোট থাকে)
// পাতার আলাদা অংশ (কুইজ, প্রশ্ন, তথ্য) নামাতে না পারলে: সাধারণত পুরোনো খোলা ট্যাব, আর সার্ভারে নতুন সংস্করণ এসে পুরোনো ফাইল সরে গেছে।
// তখন একবার নিজে থেকেই নতুন সংস্করণ নামিয়ে আনা (বারবার নয়: ২ মিনিটে একবার), এরর পর্দা না দেখিয়ে
const CHUNK_RE = /dynamically imported module|Importing a module script failed|error loading dynamically imported|ChunkLoadError|Loading chunk/i;
const lazyPick = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })).catch((e) => {
  const last = +(sessionStorage.getItem("kk_chunk_reload") || 0);
  if (CHUNK_RE.test(String(e?.message || e)) && Date.now() - last > 120000) {
    try { sessionStorage.setItem("kk_chunk_reload", String(Date.now())); } catch { /* ignore */ }
    location.reload();
    return new Promise(() => {});   // রিলোড হওয়া পর্যন্ত লোডিংই দেখাবে
  }
  throw e;
}));
const AskPage = lazyPick(() => import("./Ask.jsx"), "AskPage");
const AdminApp = lazyPick(() => import("./Admin.jsx"), "AdminApp");
const QuizPage = lazyPick(() => import("./Quiz.jsx"), "QuizPage");
const DailyPage = lazyPick(() => import("./Quiz.jsx"), "DailyPage");
const InfoPage = lazyPick(() => import("./Info.jsx"), "InfoPage");

export default function App() {
  // হোম ছাড়া অন্য পাতায় খুললেও স্প্ল্যাশ বেশিক্ষণ না থাকে
  useEffect(() => { const t = setTimeout(kkReady, 1200); return () => clearTimeout(t); }, []);
  // অ্যাপ খোলার একটু পরে, ফাঁকা সময়ে: ফলো করা লিগের টেবিল আগেই এনে রাখা (পরে খুললে সাথে সাথে দেখায়)
  useEffect(() => {
    if (DEMO) return;
    const t = setTimeout(() => {
      const codes = getFollowLg().filter((c) => TABLE_CODES.includes(c)).slice(0, 6);
      codes.forEach((c, i) => setTimeout(() => { if (!keep.get("st:" + c)) getStandings(c).catch(() => {}); }, i * 700));
    }, 3500);
    return () => clearTimeout(t);
  }, []);
  const deskWide = useWide();
  const [lang, setLangS] = useState(() => stored("kk_lang", "bn"));
  const [theme, setThemeS] = useState(() => (stored("kk_theme", "light") === "dark" ? "dark" : "light"));
  // নেট চলে গেলে ছোট একটা লেখা (তথ্য তখন ফোনে জমা থাকা শেষ সংস্করণ থেকে)
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    addEventListener("online", on); addEventListener("offline", off);
    return () => { removeEventListener("online", on); removeEventListener("offline", off); };
  }, []);
  const [tab, setTab] = useState(() => (/^\/(quiz|daily)/.test(window.location.pathname) ? "predict" : tabFromPath()));
  const [view, setView] = useState(viewFromPath);
  const [comps, setComps] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [user, setUser] = useState(null);
  useActivity(user?.id);
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
    const onPop = () => {
      // পপআপ বন্ধের জন্য ব্যাক (বা বোতামে বন্ধ করার পর ইতিহাস ঠিক করা): পাতা যেমন আছে থাকবে
      if (window.__kkSkipPop) { window.__kkSkipPop--; return; }
      if (modalStack.length) return;
      setSheet(null); setSearching(false); setView(viewFromPath()); if (!viewFromPath()) setTab(tabFromPath()); window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // লিগ/দলের পাতা খোলা (ম্যাচের শিট খোলা থাকলে সেটা বন্ধ করে)
  const openView = (path, v) => {
    if (window.history.state?.sheet) window.history.replaceState({ inApp: 1 }, "", path);
    else window.history.pushState({ inApp: 1 }, "", path);
    setSheet(null); setSearching(false); setEditing(false); setView(v); window.scrollTo(0, 0);
  };
  const nav = {
    openLeague: (code) => openView(code === "BAN" ? "/bangladesh" : `/league/${code}`, { kind: "league", code }),
    openTeam: (id) => openView(`/team/${id}`, { kind: "team", id }),
    // আইডি ১ কোটি+ = API-Football-এর খেলোয়াড় (যেকোনো লিগ)
    openPlayer: (id) => openView(`/player/${id}`, { kind: "player", id }),
    openPage: (id) => openView(PAGE_URL[id], { kind: "page", id }),
    openMatch: (m) => openView(`/match/${m.id}`, { kind: "match", id: m.id, m: m.home ? m : undefined }),
    // কুইজ: /quiz (শুরুর পাতা) বা /quiz/কোড; replace = ইতিহাসে নতুন ধাপ না যোগ করে
    openFriends: () => { setPredTab((p) => ({ tab: "friends", league: null, key: p.key + 1 })); go("predict"); },
    openSearch: () => { setSheet(null); setSearching(true); },
    openDaily: () => { setTab("predict"); openView("/quiz/daily", { kind: "daily" }); },
    // গেম ট্যাব: শেষবার যেখানে ছিলেন সেখানে (প্রথমবার প্রেডিকশন)
    openGames: () => { const g = ls.get("game_last", "predict"); if (g === "daily") nav.openDaily(); else if (g === "quiz") nav.openQuiz(); else go("predict"); },
    // স্পোর্টস কুইজ বোতাম: কুইজের ভেতরের শেষ ভাগে (প্রথমবার দৈনিক চ্যালেঞ্জ)
    openQuizArea: () => (ls.get("quiz_last", "daily") === "quiz" ? nav.openQuiz() : nav.openDaily()),
    openQuiz: (code, replace) => {
      setTab("predict");
      const path = code ? `/quiz/play/${code}` : "/quiz/play";
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
  // ম্যাচ এখন নিজের পাতায় (/match/আইডি), যাতে লিংক শেয়ার করা যায়
  const openMatch = (m) => openView(`/match/${m.id}`, { kind: "match", id: m.id, m });
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
    if (!user) { lgUser = null; setProfile(null); setMyTeams({ fav: [], rival: [] }); setPreds({}); return; }
    getProfile(user).then((p) => { setProfile(p); syncFollowLg(user, p); }).catch(() => {});
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
  useEffect(() => {
    const want = quizPath(view);
    if (want && window.location.pathname !== want) window.history.replaceState(window.history.state, "", want + window.location.search + window.location.hash);
  }, [view]);
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
  // নোটিফিকেশনের অনুরোধ: সুযোগ এলে (একটু পরে, যাতে আগের টোস্ট দেখা যায়)
  const [pushAsk, setPushAsk] = useState(null);
  const askPush = (team) => { if (user && pushAskReady()) setTimeout(() => setPushAsk({ team: team || null }), 900); };
  async function toggleFav(id) {
    if (!user) { toast(lang === "bn" ? "প্রিয় দল যোগ করতে আগে লগইন করুন" : "Log in to add favourites"); go("profile"); return; }
    const has = myTeams.fav.includes(id);
    if (!has && myTeams.fav.length >= MAX.fav) { toast(lang === "bn" ? `সর্বোচ্চ ${num(MAX.fav, "bn")}টা প্রিয় দল রাখা যায়। প্রোফাইল থেকে বদলাতে পারবেন।` : `Up to ${MAX.fav} favourites. Change them in Profile.`); return; }
    const next = { fav: has ? myTeams.fav.filter((x) => x !== id) : [...myTeams.fav, id], rival: (myTeams.rival || []).filter((x) => x !== id) };
    setMyTeams(next);
    try { await saveMyTeams(user, next); if (!has) askPush(teamName(teamsById[id], lang)); toast(has ? (lang === "bn" ? "প্রিয় দল থেকে বাদ দেওয়া হয়েছে" : "Removed from favourites") : (lang === "bn" ? "প্রিয় দলে যোগ হয়েছে ★" : "Added to favourites ★")); }
    catch { setMyTeams(myTeams); toast(lang === "bn" ? "সেভ করা গেল না, আবার চেষ্টা করুন" : "Couldn't save"); }
  }
  async function finishOnboarding({ fav, rival, phone }) {
    await saveMyTeams(user, { fav, rival });
    const p = await updateProfile(user, { onboarded: true, ...(phone ? { phone } : {}) });
    setProfile(p); setMyTeams({ fav, rival }); setEditing(false);
    if (fav?.length) askPush(teamName(teamsById[fav[0]], lang));
    // আমন্ত্রণে এসে থাকলে দল বাছার পর সরাসরি সেই লিগে
    if (joinedLeague) { setPredTab((x) => ({ tab: "friends", league: joinedLeague, key: x.key + 1 })); setJoinedLeague(null); go("predict"); }
    else go("matches");
  }
  async function skipOnboarding() {
    const p = await updateProfile(user, { onboarded: true }).catch(() => profile);
    setProfile(p); setEditing(false);
  }

  async function onSavePrediction(m, h, a, penPick) {
    const p = await savePrediction(user, m.id, h, a, penPick);
    setPreds((x) => ({ ...x, [m.id]: p }));
    askPush(null);
  }

  // ডেস্কটপে বাঁ পাশে লিগের তালিকা: হোম, প্রেডিকশন, দৈনিক চ্যালেঞ্জ, লিগ ট্যাব আর জিজ্ঞেস করুন বাদে
  const railPage = deskWide && !onboarding && !((!view && ["matches", "predict", "leagues", "ask"].includes(tab)) || view?.kind === "daily");
  // অ্যাডমিন: সাইটের মেনু ছাড়া আলাদা পাতা
  if (view?.kind === "admin") return (
    <LangCtx.Provider value="bn">
      <Suspense fallback={<Loading />}><AdminApp user={user} toast={toast} goProfile={() => go("profile")} onExit={() => go("matches")} /></Suspense>
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </LangCtx.Provider>
  );
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
        {offline && <div className="demo-bar off-bar">{lang === "bn" ? "ইন্টারনেট নেই · শেষবার দেখা তথ্য দেখাচ্ছে" : "You're offline · showing last saved data"}</div>}
        {DEMO && <div className="demo-bar">{lang === "bn" ? "ডেমো মোড — নমুনা ডেটা দেখানো হচ্ছে" : "Demo mode — sample data"}</div>}

        <div className={railPage ? "rail-wrap" : undefined}>
        {railPage && <LeagueRail comps={comps} active={view?.kind === "league" ? view.code : null} onPick={(c) => nav.openLeague(c)} />}
        <main className={"main v-" + (onboarding ? "onboarding" : view?.kind || tab) + (!onboarding && ((!view && tab === "matches") || view?.kind === "daily" || (!view && tab === "predict")) ? " wide" : " narrow")}>
        {onboarding ? (
          <Onboarding
            key={editing ? "edit" : "first"}
            initial={myTeams}
            comps={comps}
            needPhone={false}
            onDone={finishOnboarding}
            onCancel={editing ? () => setEditing(false) : skipOnboarding}
          />
        ) : view?.kind === "league" && view.code === "BAN" ? (
          <BangladeshPage teamsById={teamsById} preds={preds} onOpen={openMatch} favs={myTeams.fav} onToggleFav={toggleFav} user={user} toast={toast} onLogin={() => go("profile")} />
        ) : view?.kind === "league" ? (
          <League key={view.code} code={view.code} comps={comps} preds={preds} onOpen={openMatch} teamsById={teamsById} />
        ) : view?.kind === "team" ? (
          <Team key={view.id} id={view.id} teamsById={teamsById} preds={preds} onOpen={openMatch} isFav={myTeams.fav.includes(view.id)} onToggleFav={toggleFav} user={user} toast={toast} onLogin={() => go("profile")} />
        ) : view?.kind === "page" ? (
          <Suspense fallback={<Loading />}><InfoPage key={view.id} id={view.id} user={user} goProfile={() => go("profile")} /></Suspense>
        ) : view?.kind === "daily" ? (
          <Suspense fallback={<Loading />}><DailyPage user={user} goProfile={() => go("profile")} toast={toast} /></Suspense>

        ) : view?.kind === "quiz" ? (
          <Suspense fallback={<Loading />}><QuizPage code={view.code} user={user} goProfile={() => go("profile")} toast={toast} /></Suspense>
        ) : view?.kind === "player" ? (
          <PlayerAny key={view.id} id={view.id} comps={comps} teamsById={teamsById} />
        ) : view?.kind === "match" ? (
          <MatchPage key={view.id} id={view.id} m={view.m} user={user} pred={preds[view.id]} toast={toast} onSave={onSavePrediction} onLogin={() => go("profile")} />
        ) : tab === "matches" ? (
          <Matches key={homeKey} user={user} myTeams={myTeams} comps={comps} preds={preds} onOpen={openMatch} goProfile={() => go("profile")} />
        ) : tab === "leagues" ? (
          <Leagues comps={comps} toast={toast} />
        ) : tab === "ask" ? (
          <Suspense fallback={<Loading />}><AskPage teams={Object.values(teamsById)} preds={preds} onOpen={openMatch} chat={askChat} setChat={setAskChat} /></Suspense>
        ) : tab === "predict" ? (
          <Predict user={user} profile={profile} preds={preds} fav={myTeams.fav} onOpen={openMatch} goProfile={() => go("profile")} toast={toast} initialTab={predTab.tab} openLeagueId={predTab.league} reloadKey={predTab.key} />
        ) : (
          <Profile user={user} profile={profile} setProfile={setProfile} toast={toast} myTeams={myTeams} teamsById={teamsById} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} onEditTeams={() => { setEditing(true); window.scrollTo(0, 0); }} />
        )}
        </main>
        </div>

        {/* ফুটার তথ্যের পাতাগুলোয়; গেম, কুইজ আর জিজ্ঞেস করুন-এ নয় (অ্যাপের মতো পরিষ্কার) */}
        {!onboarding && view?.kind !== "quiz" && view?.kind !== "daily" && !(!view && (tab === "ask" || tab === "predict")) && <Footer comps={comps} />}
      </div>

      {!onboarding && <Nav tab={tab} go={go} />}
      {searching && <SearchSheet comps={comps} teams={Object.values(teamsById)} onClose={closeSearch} />}
      <PushAsk ask={pushAsk} user={user} toast={toast} onClose={() => setPushAsk(null)} />
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </FavCtx.Provider>
    </NavCtx.Provider>
    </LangCtx.Provider>
  );
}


// আলাদা করা পাতাগুলোর (Ask, Admin, Quiz…) দরকারি জিনিস
export { BN_DAYS_SHORT, BN_MONTHS, BadgeGrid, BadgeIcon, CARD_FONT, CARD_W, CalIcon, Crest, DAILY_Q, DAILY_SEC, DEMO, DEMO_QUIZ_Q, DatedRows, EN_MONTHS, FavCtx, FbIcon, FlameIcon, Friends, GameSwitch, HELP_CHIPS, I, League, Leagues, LevelBadges, LevelIcon, Loading, Logo, MailIcon, MatchRow, MoonIcon, PlayIcon, Predict, Profile, QuizIcon, RES, RankBadge, ReplayIcon, S, SearchIcon, ShareIcon, SparkIcon, TargetIcon, Team, TrophyIcon, UserAvatar, UserIcon, UsersIcon, W, answer, badgeOf, clockLogo, compLabel, countdown, dailyCall, dayKey, dayLabel, everyMin, has, ls, lvParse, lvTier, num, ok, ord, pName, rpc, sb, shortName, store, stored, teamName, timeLabel, useBackClose, useDaily, useDailyProgress, useNav, useT, useWide, zone };