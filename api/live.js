// ═══════════════════════════════════════════════════════════════
//  /api/live — API-Football (পেইড) থেকে চলমান ম্যাচের বিস্তারিত এনে Supabase-এর match_live-এ রাখে
//
//  Supabase-এর ঘড়ি (pg_cron) প্রতি মিনিটে এটা ডাকে। আশেপাশে খেলা না থাকলে API-তে কোনো কল হয় না।
//  খেলা থাকলে: শুরুর ৭৫ মিনিট আগে থেকে (লাইনআপ) শেষের পর ২০ মিনিট পর্যন্ত (চূড়ান্ত রেটিং)।
//    • কোন ম্যাচ API-Football-এর কোন ম্যাচ, সেটা একবার মিলিয়ে রাখা হয় (লিগ + সময় + দলের নাম)
//    • প্রতি কলে ২০টা পর্যন্ত ম্যাচের মিনিট, স্কোর, ঘটনা, লাইনআপ, পরিসংখ্যান, খেলোয়াড়ের রেটিং
//  সূচি আর প্রেডিকশনের পয়েন্ট আগের মতো football-data.org থেকেই (/api/sync); এটা শুধু ওপরে বাড়তি তথ্য।
//
//  Environment Variables: APIF_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET
// ═══════════════════════════════════════════════════════════════
const AF = "https://v3.football.api-sports.io";
const LEAGUE = { CL: 2, PL: 39, PD: 140, BL1: 78, SA: 135, FL1: 61 };
const BEFORE = 75 * 60000, AFTER = 4 * 3600000, SETTLE = 20 * 60000, RETRY_MAP = 30 * 60000;
export const FINAL = ["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO", "PST"];

async function sb(path, { method = "GET", body, prefer } = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`supabase ${path.split("?")[0]} → ${r.status} ${await r.text().catch(() => "")}`.slice(0, 300));
  return r.status === 204 || method !== "GET" ? null : r.json();
}

let calls = 0;
async function af(path) {
  calls++;
  const r = await fetch(AF + path, { headers: { "x-apisports-key": process.env.APIF_KEY } });
  if (!r.ok) throw new Error(`api-football ${path} → ${r.status}`);
  const d = await r.json();
  // API-Football ভুল হলেও ২০০ দেয়; ভুলটা errors-এ থাকে (যেমন কল শেষ, ভুল key)
  const errs = d.errors && (Array.isArray(d.errors) ? d.errors : Object.values(d.errors));
  if (errs && errs.length) throw new Error("api-football: " + errs.join("; ").slice(0, 200));
  return d.response || [];
}

// ── দলের নাম মেলানো: দুই উৎসে বানান আলাদা (FC Bayern München / Bayern Munich, Wolverhampton / Wolves) ──
const STOP = new Set(["fc", "cf", "afc", "ac", "sc", "ssc", "as", "ss", "us", "cd", "rc", "rcd", "sv", "vfb", "vfl", "tsg", "fsv", "bsc", "club", "de", "del", "la", "le", "calcio", "football", "futbol", "balompie", "hotspur", "and", "1", "04", "05", "1899", "1846", "1907", "1909", "1910", "1913", "sad", "olympique"]);
export const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").toLowerCase()
  .replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
function sim(names, afName) {
  const b = norm(afName);
  let best = 0;
  for (const n of names) {
    const a = norm(n);
    if (!a.length || !b.length) continue;
    let hit = 0;
    for (const x of a) if (b.some((y) => x === y || (x.length >= 4 && y.length >= 4 && (x.startsWith(y.slice(0, 4)) || y.startsWith(x.slice(0, 4)))))) hit++;
    best = Math.max(best, hit / Math.max(a.length, b.length));
  }
  return best;
}
const teamNames = (t) => [t?.name_en, t?.short_en].filter(Boolean);

// আমাদের এক ম্যাচ ↔ API-Football-এর সম্ভাব্য ম্যাচগুলো (একই লিগ, ২০ মিনিটের মধ্যে শুরু): দুই দলের নাম মিলিয়ে সেরাটা
export function pickFixture(m, fixtures) {
  const t0 = Date.parse(m.utc_date);
  let best = null, bestS = 0, second = 0;
  for (const f of fixtures) {
    if (Math.abs(f.fixture.timestamp * 1000 - t0) > 20 * 60000) continue;
    const s = sim(teamNames(m.home), f.teams.home.name) + sim(teamNames(m.away), f.teams.away.name);
    if (s > bestS) { second = bestS; bestS = s; best = f; } else if (s > second) second = s;
  }
  return best && bestS >= 0.5 && bestS > second ? best : null;
}

const seasonOf = (iso) => { const d = new Date(iso); return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; };

// API-Football নামের ভেতরে HTML চিহ্ন পাঠায় (যেমন O&apos;Reilly)
const ENT = { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", "#39": "'" };
const dec = (s) => (s == null ? null : String(s).replace(/&(amp|apos|quot|lt|gt|#39);/g, (_, k) => ENT[k]));

// ── API-Football-এর বড় উত্তর থেকে শুধু দরকারি অংশ (ডেটাবেস আর ফোনের ডেটা হালকা রাখতে) ──
export function slim(f) {
  const side = (id) => (id === f.teams.home.id ? "h" : id === f.teams.away.id ? "a" : null);
  const events = (f.events || []).map((e) => ({
    m: e.time?.elapsed ?? null, x: e.time?.extra ?? null, s: side(e.team?.id),
    t: e.type, d: e.detail, p: dec(e.player?.name), pid: e.player?.id || null, a: dec(e.assist?.name), aid: e.assist?.id || null, c: e.comments || null,
  }));
  const lu = (l) => l && ({
    f: l.formation || null, coach: dec(l.coach?.name),
    xi: (l.startXI || []).map(({ player: p }) => ({ id: p.id, n: dec(p.name), no: p.number, pos: p.pos, g: p.grid || null })),
    sub: (l.substitutes || []).map(({ player: p }) => ({ id: p.id, n: dec(p.name), no: p.number, pos: p.pos })),
  });
  const L = f.lineups || [];
  const lineups = L.length ? { h: lu(L.find((l) => side(l.team?.id) === "h")), a: lu(L.find((l) => side(l.team?.id) === "a")) } : null;
  const S = f.statistics || [];
  const sh = S.find((x) => side(x.team?.id) === "h")?.statistics || [], sa = S.find((x) => side(x.team?.id) === "a")?.statistics || [];
  const stats = sh.length || sa.length ? [...new Set([...sh, ...sa].map((x) => x.type))].map((k) => ({
    k, h: sh.find((x) => x.type === k)?.value ?? null, a: sa.find((x) => x.type === k)?.value ?? null,
  })) : null;
  const players = {};
  for (const tp of f.players || []) for (const { player: p, statistics: st } of tp.players || []) {
    const s0 = (st && st[0]) || {};
    const r = parseFloat(s0.games?.rating);
    players[p.id] = {
      r: Number.isFinite(r) ? r : null, min: s0.games?.minutes ?? null, cap: !!s0.games?.captain,
      g: s0.goals?.total || 0, as: s0.goals?.assists || 0, yc: s0.cards?.yellow || 0, rc: s0.cards?.red || 0,
    };
  }
  return {
    af_id: f.fixture.id,
    status: f.fixture.status?.short || null,
    elapsed: f.fixture.status?.elapsed ?? null,
    extra: f.fixture.status?.extra ?? null,
    home_goals: f.goals?.home ?? null,
    away_goals: f.goals?.away ?? null,
    events, lineups, stats,
    players: Object.keys(players).length ? players : null,
  };
}

export async function runLive() {
  if (!process.env.APIF_KEY) throw new Error("APIF_KEY সেট করা নেই");
  calls = 0;
  const now = Date.now();
  const from = new Date(now - AFTER).toISOString(), to = new Date(now + BEFORE).toISOString();
  const T = "name_en,short_en";
  const win = await sb(`matches?select=id,competition_code,utc_date,status,home:teams!matches_home_fk(${T}),away:teams!matches_away_fk(${T})&utc_date=gte.${from}&utc_date=lte.${to}&status=not.in.(POSTPONED,CANCELLED)`);
  if (!win.length) return { calls, window: 0 };
  const have = await sb(`match_live?select=match_id,af_id,status,map_tried_at,final_seen_at&match_id=in.(${win.map((m) => m.id).join(",")})`);
  const byId = Object.fromEntries(have.map((r) => [r.match_id, r]));
  const rows = [];

  // ১) এখনো না মেলানো ম্যাচ: লিগ + দিন ধরে একবার আনা (না মিললে ৩০ মিনিট পরে আবার চেষ্টা)
  const unmapped = win.filter((m) => !byId[m.id]?.af_id && LEAGUE[m.competition_code]
    && !(byId[m.id]?.map_tried_at && now - Date.parse(byId[m.id].map_tried_at) < RETRY_MAP));
  const groups = {};
  for (const m of unmapped) (groups[`${m.competition_code}|${m.utc_date.slice(0, 10)}`] ||= []).push(m);
  for (const [k, ms] of Object.entries(groups)) {
    const [code, date] = k.split("|");
    const fx = await af(`/fixtures?league=${LEAGUE[code]}&season=${seasonOf(ms[0].utc_date)}&date=${date}&timezone=UTC`);
    for (const m of ms) {
      const f = pickFixture(m, fx);
      const row = { match_id: m.id, map_tried_at: new Date().toISOString(), ...(f ? { af_id: f.fixture.id } : {}) };
      byId[m.id] = { ...byId[m.id], ...row };
      rows.push(row);
    }
  }

  // ২) মেলানো ম্যাচগুলোর বিস্তারিত (শেষ হওয়ার ২০ মিনিট পর থামে, যাতে চূড়ান্ত রেটিং আসে)
  const want = win.filter((m) => {
    const r = byId[m.id];
    if (!r?.af_id) return false;
    return !(r.final_seen_at && now - Date.parse(r.final_seen_at) > SETTLE);
  });
  const ids = want.map((m) => byId[m.id].af_id);
  const back = {};
  for (const m of want) back[byId[m.id].af_id] = m.id;
  for (let i = 0; i < ids.length; i += 20) {
    for (const f of await af(`/fixtures?ids=${ids.slice(i, i + 20).join("-")}&timezone=UTC`)) {
      const mid = back[f.fixture.id]; if (!mid) continue;
      const s = slim(f);
      const prev = byId[mid];
      rows.push({
        match_id: mid, ...s,
        final_seen_at: FINAL.includes(s.status) ? (prev?.final_seen_at || new Date().toISOString()) : null,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // একই ম্যাচের দুই সারি (মেলানো + বিস্তারিত) এক করে লেখা
  const merged = {};
  for (const r of rows) merged[r.match_id] = { ...merged[r.match_id], ...r };
  const out = Object.values(merged);
  // PostgREST-এ একসাথে লিখতে সব সারিতে একই কলাম লাগে, তাই কলাম অনুযায়ী ভাগ করে লেখা
  // (শুধু মেলানোর সারি বিস্তারিত কলাম ছোঁয় না, তাই আগের ডেটা মোছে না)
  const byShape = {};
  for (const r of out) (byShape[Object.keys(r).sort().join(",")] ||= []).push(r);
  for (const list of Object.values(byShape)) {
    await sb("match_live?on_conflict=match_id", { method: "POST", body: list, prefer: "resolution=merge-duplicates,return=minimal" });
  }
  return { calls, window: win.length, mapped: Object.values(byId).filter((r) => r?.af_id).length, updated: out.length };
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || "";
  if (secret && auth !== `Bearer ${secret}` && (req.query || {}).secret !== secret) return res.status(401).json({ ok: false, error: "unauthorized" });
  try {
    const result = await runLive();
    if (result.calls) await sb("sync_log", { method: "POST", body: { mode: "live", ok: true, detail: JSON.stringify(result) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    await sb("sync_log", { method: "POST", body: { mode: "live", ok: false, detail: String(e.message || e) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
