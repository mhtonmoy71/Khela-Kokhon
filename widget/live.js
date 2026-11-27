// খেলা কখন? লাইভ স্কোর উইজেট: নিউজ পোর্টালে iframe হয়ে বসে (embed.js দিয়ে)
// ?leagues=PL,CL  ?theme=light|dark  ?lang=bn|en  — প্রতি মিনিটে নিজে থেকে হালনাগাদ
import { clubBn } from "../src/clubsBn.js";

const SB = "https://chgegfcnfzihmytgbhjh.supabase.co/rest/v1/";
const KEY = "sb_publishable_sDXbz8NdgoVRcM8YRLNf1w_exWVBe96";
const SITE = "https://khelakokhon.com";
const q = new URLSearchParams(location.search);
const lang = q.get("lang") === "en" ? "en" : "bn";
const bn = lang === "bn";
if (q.get("theme") === "dark") document.documentElement.dataset.theme = "dark";
const DEFAULT = ["BAN", "CL", "PL", "PD", "BL1", "SA", "FL1", "UEL", "BPL", "BFC"];
const leagues = (q.get("leagues") || "").split(",").map((x) => x.trim().toUpperCase()).filter((x) => /^[A-Z0-9]{2,5}$/.test(x));
const want = leagues.length ? leagues : DEFAULT;
const src = (() => { try { return document.referrer ? new URL(document.referrer).hostname : "direct"; } catch { return "direct"; } })();

const D = "০১২৩৪৫৬৭৮৯";
const n = (x) => (bn ? String(x).replace(/\d/g, (d) => D[d]) : String(x));
const COMP_FIX = { FL1: "লিগ ওয়ান" };
const compName = (c) => (bn ? COMP_FIX[c?.code] || c?.name_bn : c?.name_en) || c?.code || "";
const teamName = (t) => (!t ? "" : bn ? clubBn(t.short_en) || clubBn(t.name_en) || t.name_bn || t.short_en : t.short_en || t.name_en);
// লোগো নিজেদের ইমেজ প্রক্সি দিয়ে (ছোট করা, CDN-এ জমা; বাইরের সাইট আটকালেও চলে)
const img = (u, px) => (u ? `${SITE}/api/img?u=${encodeURIComponent(u)}&w=${px * 2}` : "");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// বাংলাদেশ সময়ের আজকের দিন (UTC-তে শুরু আর শেষ)
const BD = 6 * 3600000;
const dayStart = Math.floor((Date.now() + BD) / 86400000) * 86400000 - BD;
const iso = (t) => new Date(t).toISOString();
const clock = (u) => {
  const d = new Date(Date.parse(u) + BD), h = d.getUTCHours(), m = String(d.getUTCMinutes()).padStart(2, "0");
  if (!bn) return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
  const part = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
  return `${part} ${n(h % 12 || 12)}:${n(m)}`;
};

const get = (path) => fetch(SB + path, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then((r) => (r.ok ? r.json() : []));
const T = "name_bn,name_en,short_en,crest";

async function load() {
  const ms = await get(`matches?select=id,utc_date,status,home_score,away_score,competition_code,home:teams!matches_home_fk(${T}),away:teams!matches_away_fk(${T}),competition:competitions(code,name_bn,name_en,emblem,sort)` +
    `&competition_code=in.(${want.join(",")})&utc_date=gte.${iso(dayStart)}&utc_date=lt.${iso(dayStart + 86400000)}&order=utc_date&limit=200`);
  // API-Football-এর চলমান তথ্য (মিনিট, স্কোর): ১০ মিনিটের বেশি পুরনো হলে বাদ
  const ids = ms.map((m) => m.id);
  const lv = ids.length ? await get(`match_live?select=match_id,status,elapsed,extra,home_goals,away_goals,updated_at&match_id=in.(${ids.join(",")})`) : [];
  const L = Object.fromEntries(lv.map((r) => [r.match_id, r]));
  const PLAY = ["1H", "2H", "ET", "BT", "P", "LIVE", "INT"], DONE = ["FT", "AET", "PEN"];
  return ms.map((m) => {
    const r = L[m.id];
    if (!r || !r.status || (!DONE.includes(r.status) && Date.now() - Date.parse(r.updated_at || 0) > 600000)) return m;
    if (m.status === "FINISHED" && !DONE.includes(r.status)) return m;
    const st = PLAY.includes(r.status) ? "IN_PLAY" : r.status === "HT" ? "PAUSED" : DONE.includes(r.status) ? "FINISHED" : null;
    if (!st) return m;
    return { ...m, status: st, home_score: r.home_goals ?? m.home_score, away_score: r.away_goals ?? m.away_score, minute: st === "IN_PLAY" ? r.elapsed : null, extra: r.extra };
  });
}

const isLive = (m) => ["IN_PLAY", "PAUSED", "LIVE"].includes(m.status);
const isDone = (m) => m.status === "FINISHED";
const isOff = (m) => ["POSTPONED", "CANCELLED", "SUSPENDED"].includes(m.status);
const stage = (m) => (isLive(m) ? 0 : isDone(m) || isOff(m) ? 2 : 1);

function statusText(m) {
  if (m.status === "PAUSED") return [bn ? "বিরতি" : "HT", "live"];
  if (isLive(m)) return [m.minute != null ? `${n(m.minute)}${m.extra ? "+" + n(m.extra) : ""}'` : bn ? "লাইভ" : "LIVE", "live"];
  if (isDone(m)) return [bn ? "শেষ" : "FT", ""];
  if (isOff(m)) return [bn ? "স্থগিত" : "PP", ""];
  return ["", ""];
}

function render(list) {
  const w = document.getElementById("w");
  const groups = {};
  for (const m of list) (groups[m.competition_code] ||= { c: m.competition, list: [] }).list.push(m);
  const gs = Object.values(groups);
  for (const g of gs) { g.list.sort((a, b) => stage(a) - stage(b) || Date.parse(a.utc_date) - Date.parse(b.utc_date)); g.stage = Math.min(...g.list.map(stage)); }
  gs.sort((a, b) => a.stage - b.stage || want.indexOf(a.c?.code) - want.indexOf(b.c?.code));
  const live = list.filter(isLive).length;
  const utm = `utm_source=widget&utm_medium=${encodeURIComponent(src)}`;
  const row = (m) => {
    const [st, cls] = statusText(m);
    const show = (isLive(m) || isDone(m)) && m.home_score != null;
    const hw = isDone(m) && m.home_score > m.away_score, aw = isDone(m) && m.away_score > m.home_score;
    const crest = (t) => (t?.crest ? `<img src="${esc(img(t.crest, 20))}" alt="" loading="lazy" width="20" height="20">` : "");
    return `<a class="r" href="${SITE}/match/${m.id}?${utm}" target="_blank" rel="noopener">
      <div class="st ${cls}">${esc(st)}</div>
      <div class="tm h${hw ? " win" : ""}"><span>${esc(teamName(m.home))}</span>${crest(m.home)}</div>
      <div class="sc${show ? (isLive(m) ? " live" : "") : " t"}">${show ? `${n(m.home_score)} - ${n(m.away_score)}` : esc(clock(m.utc_date))}</div>
      <div class="tm${aw ? " win" : ""}">${crest(m.away)}<span>${esc(teamName(m.away))}</span></div></a>`;
  };
  w.innerHTML = `
    <div class="top"><b>${bn ? "আজকের খেলা" : "Today's matches"}</b>${live ? `<span class="lv-n"><i></i>${bn ? "লাইভ" : "Live"} ${n(live)}</span>` : `<span>${bn ? "বাংলাদেশ সময়" : "Bangladesh time"}</span>`}</div>
    ${gs.length ? gs.map((g) => `<div class="g-h">${g.c?.emblem ? `<img src="${esc(img(g.c.emblem, 18))}" alt="" width="18" height="18">` : ""}${esc(compName(g.c))}</div>${g.list.map(row).join("")}`).join("")
      : `<div class="empty">${bn ? "আজ এই লিগগুলোতে কোনো খেলা নেই" : "No matches today in these leagues"}</div>`}
    <div class="ft"><span>${bn ? "প্রতি মিনিটে হালনাগাদ" : "Updates every minute"}</span><a href="${SITE}/?${utm}" target="_blank" rel="noopener">${bn ? "তথ্য: খেলা কখন<b>?</b>" : "Data: Khela Kokhon<b>?</b>"}</a></div>`;
  // যে পাতায় বসানো, সেখানে iframe-এর উচ্চতা মেলানো (embed.js শোনে)
  sendH();
}
// উইজেটের আসল উচ্চতা (পাতার নয়), যাতে নিচে ফাঁকা না থাকে
function sendH() { try { parent.postMessage({ kk: "h", id: q.get("id"), h: Math.ceil(document.getElementById("w").getBoundingClientRect().height) + 1 }, "*"); } catch { /* একা খোলা হলে কিছু নয় */ } }

async function tick() { try { render(await load()); } catch { /* নেট না থাকলে আগেরটাই থাকে */ } }
tick();
setInterval(() => { if (!document.hidden) tick(); }, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
addEventListener("resize", sendH);
addEventListener("load", sendH);
