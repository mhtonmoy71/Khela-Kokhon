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

// ── শুধু API-Football থেকে আসা লিগ (football-data-এ নেই): সূচি, টেবিল, গোলদাতা সবই এখান থেকে ──
// আইডি আলাদা রাখতে: ম্যাচ = ১০ কোটি + API-Football-এর আইডি, দল ও খেলোয়াড় = ১ কোটি + আইডি
export const AF_LEAGUES = {
  SPL: { id: 307, en: "Saudi Pro League", bn: "সৌদি প্রো লিগ", sort: 7 },
  MLS: { id: 253, en: "MLS", bn: "এমএলএস", sort: 8 },
};
export const MOFF = 100000000, TOFF = 10000000, POFF = 10000000;
// বড় দলগুলোর বাংলা নাম (API-Football-এর নামের অংশ → বাংলা); বাকিগুলো ইংরেজিতে
const AF_TEAMS_BN = [
  ["Al-Hilal", "আল হিলাল"], ["Al-Nassr", "আল নাসর"], ["Al-Ittihad", "আল ইত্তিহাদ"], ["Al-Ahli", "আল আহলি"],
  ["Al-Qadisiyah", "আল কাদসিয়া"], ["Al-Ettifaq", "আল ইত্তিফাক"], ["Al-Shabab", "আল শাবাব"], ["Al-Taawoun", "আল তাউন"],
  ["Al-Fateh", "আল ফাতেহ"], ["Al-Fayha", "আল ফাইহা"], ["Al-Khaleej", "আল খালিজ"], ["Al-Riyadh", "আল রিয়াদ"],
  ["Inter Miami", "ইন্টার মায়ামি"], ["Los Angeles Galaxy", "এলএ গ্যালাক্সি"], ["Los Angeles FC", "লস অ্যাঞ্জেলেস এফসি"],
  ["New York City", "নিউ ইয়র্ক সিটি"], ["New York Red Bulls", "নিউ ইয়র্ক রেড বুলস"], ["Seattle Sounders", "সিয়াটল সাউন্ডার্স"],
  ["Atlanta United", "আটলান্টা ইউনাইটেড"], ["Columbus Crew", "কলম্বাস ক্রু"], ["FC Cincinnati", "এফসি সিনসিনাটি"],
  ["Philadelphia Union", "ফিলাডেলফিয়া ইউনিয়ন"], ["Orlando City", "অরল্যান্ডো সিটি"], ["Toronto FC", "টরন্টো এফসি"],
];
const afBn = (name) => AF_TEAMS_BN.find(([k]) => (name || "").toLowerCase().startsWith(k.toLowerCase()))?.[1] || null;
const AF_STATUS = (st) => (["NS", "TBD"].includes(st) ? "TIMED" : st === "HT" ? "PAUSED" : ["FT", "AET", "PEN"].includes(st) ? "FINISHED"
  : st === "PST" ? "POSTPONED" : ["CANC", "ABD", "AWD", "WO"].includes(st) ? "CANCELLED" : "IN_PLAY");
// লোগো না এলে দেখানোর তিন অক্ষর: "Al-Hilal" → HIL, "Inter Miami" → INT
const afTla = (n) => { const w = (dec(n) || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[\s-]+/).filter((x) => x && !/^(al|fc|sc|cf|cd|ac|club|de|the)$/i.test(x)); return (w[0] || n || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || null; };
const afTeamRow = (t) => ({ id: TOFF + t.id, name_en: dec(t.name), short_en: dec(t.name), tla: afTla(t.name), name_bn: afBn(t.name), crest: t.logo || null, updated_at: new Date().toISOString() });

async function upsertRows(table, rows, conflict = "id") {
  for (let i = 0; i < rows.length; i += 500)
    await sb(`${table}?on_conflict=${conflict}`, { method: "POST", body: rows.slice(i, i + 500), prefer: "resolution=merge-duplicates,return=minimal" });
}

// দিনে একবার: চলতি মৌসুমের পুরো সূচি, পয়েন্ট টেবিল আর শীর্ষ গোলদাতা (প্রতি লিগে ৪টা কল)
export async function syncAfLeagues() {
  if (!process.env.APIF_KEY) throw new Error("APIF_KEY সেট করা নেই");
  calls = 0;
  const out = {};
  for (const [code, L] of Object.entries(AF_LEAGUES)) {
    try {
      const [lg] = await af(`/leagues?id=${L.id}&current=true`);
      const season = lg?.seasons?.find((x) => x.current)?.year;
      if (!season) { out[code] = "no season"; continue; }
      await upsertRows("competitions", [{ code, name_en: L.en, name_bn: L.bn, emblem: lg.league?.logo || null, sort: L.sort }], "code");
      const fx = await af(`/fixtures?league=${L.id}&season=${season}&timezone=UTC`);
      const teams = new Map();
      for (const f of fx) for (const t of [f.teams.home, f.teams.away]) if (t?.id) teams.set(t.id, afTeamRow(t));
      await upsertRows("teams", [...teams.values()]);
      await upsertRows("matches", fx.map((f) => ({
        id: MOFF + f.fixture.id, competition_code: code, season, matchday: parseInt((f.league?.round || "").match(/(\d+)\s*$/)?.[1], 10) || null,
        stage: f.league?.round || null, group_name: null, utc_date: new Date(f.fixture.timestamp * 1000).toISOString(),
        status: AF_STATUS(f.fixture.status?.short), home_id: TOFF + f.teams.home.id, away_id: TOFF + f.teams.away.id,
        home_score: f.goals?.home ?? null, away_score: f.goals?.away ?? null, updated_at: new Date().toISOString(),
      })));
      // টেবিল: এমএলএস-এর দুই কনফারেন্স মিলিয়ে পয়েন্ট অনুযায়ী একটা তালিকা
      const [st] = await af(`/standings?league=${L.id}&season=${season}`);
      const rowsAll = (st?.league?.standings || []).flat().filter((r) => r.team?.id);
      const seen = new Set();
      const rows = rowsAll.filter((r) => !seen.has(r.team.id) && seen.add(r.team.id))
        .sort((a, b) => b.points - a.points || b.goalsDiff - a.goalsDiff || (b.all?.goals?.for || 0) - (a.all?.goals?.for || 0));
      if (rows.length) {
        await upsertRows("teams", rows.filter((r) => !teams.has(r.team.id)).map((r) => afTeamRow(r.team)));
        await sb(`standings?competition_code=eq.${code}`, { method: "DELETE", prefer: "return=minimal" });
        await sb("standings", { method: "POST", prefer: "return=minimal", body: rows.map((r, i) => ({
          competition_code: code, team_id: TOFF + r.team.id, position: i + 1, played: r.all?.played ?? 0, won: r.all?.win ?? 0, draw: r.all?.draw ?? 0,
          lost: r.all?.lose ?? 0, gf: r.all?.goals?.for ?? 0, ga: r.all?.goals?.against ?? 0, gd: r.goalsDiff ?? 0, points: r.points ?? 0,
          form: r.form || null, updated_at: new Date().toISOString(),
        })) });
      }
      const sc = await af(`/players/topscorers?league=${L.id}&season=${season}`);
      if (sc.length) {
        await upsertRows("teams", sc.map((r) => r.statistics?.[0]?.team).filter((t) => t?.id && !teams.has(t.id)).map(afTeamRow));
        await sb(`scorers?competition_code=eq.${code}`, { method: "DELETE", prefer: "return=minimal" });
        const ps = new Set();
        await sb("scorers", { method: "POST", prefer: "return=minimal", body: sc.filter((r) => r.player?.id && !ps.has(r.player.id) && ps.add(r.player.id)).map((r) => {
          const x = r.statistics?.[0] || {};
          return { competition_code: code, player_id: POFF + r.player.id, player_name: dec(r.player.name), nationality: r.player.nationality || null,
            team_id: x.team?.id ? TOFF + x.team.id : null, played: x.games?.appearences ?? null, goals: x.goals?.total ?? 0,
            assists: x.goals?.assists ?? 0, penalties: x.penalty?.scored ?? 0, updated_at: new Date().toISOString() };
        }) });
      }
      out[code] = { season, matches: fx.length, table: rows.length, scorers: sc.length };
    } catch (e) { out[code] = "error: " + String(e.message || e).slice(0, 120); }
  }
  return { mode: "leagues", calls, ...out };
}

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
  for (const m of win) if (AF_LEAGUES[m.competition_code]) byId[m.id] = { ...byId[m.id], af_id: m.id - MOFF };
  const rows = [];
  const fixUp = [];

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
      const wm = want.find((x) => x.id === mid);
      if (wm && AF_LEAGUES[wm.competition_code]) fixUp.push({ id: mid, status: AF_STATUS(s.status), home_score: s.home_goals, away_score: s.away_goals });
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
  // শুধু API-Football-এর লিগ: ম্যাচের অবস্থা আর স্কোরও এখান থেকে (প্রেডিকশনের পয়েন্টের জন্য)
  for (const x of fixUp) await sb(`matches?id=eq.${x.id}`, { method: "PATCH", body: { status: x.status, home_score: x.home_score, away_score: x.away_score, updated_at: new Date().toISOString() }, prefer: "return=minimal" });
  if (fixUp.some((x) => x.status === "FINISHED")) await sb("rpc/score_predictions", { method: "POST", body: {} }).catch(() => {});
  return { calls, window: win.length, mapped: Object.values(byId).filter((r) => r?.af_id).length, updated: out.length };
}

// ── শেষ হওয়া একটা ম্যাচ কেউ খুললে: আগে আনা না থাকলে একবার এনে রাখা (পরে আর কখনো API-তে যায় না) ──
export async function fetchOne(id) {
  if (!process.env.APIF_KEY) throw new Error("APIF_KEY সেট করা নেই");
  calls = 0;
  const T = "name_en,short_en";
  const [m] = await sb(`matches?select=id,competition_code,utc_date,status,home:teams!matches_home_fk(${T}),away:teams!matches_away_fk(${T})&id=eq.${id}`);
  const isAf = !!AF_LEAGUES[m?.competition_code];
  if (!m || !(LEAGUE[m.competition_code] || isAf)) return null;
  const [have] = await sb(`match_live?select=*&match_id=eq.${id}`);
  if (have?.events && have.final_seen_at) return have;                       // আগেই আছে
  // শুধু শেষ হওয়া ম্যাচ (চলমানগুলো প্রতি মিনিটের কাজ দেখে); শুরুর ২ ঘণ্টার আগে নয়
  if (m.status !== "FINISHED" || Date.now() - Date.parse(m.utc_date) < 2 * 3600000) return have || null;
  let afId = have?.af_id || (isAf ? id - MOFF : null);
  if (!afId) {
    if (have?.map_tried_at && Date.now() - Date.parse(have.map_tried_at) < RETRY_MAP) return have;
    const fx = await af(`/fixtures?league=${LEAGUE[m.competition_code]}&season=${seasonOf(m.utc_date)}&date=${m.utc_date.slice(0, 10)}&timezone=UTC`);
    afId = pickFixture(m, fx)?.fixture.id || null;
    if (!afId) {
      await sb("match_live?on_conflict=match_id", { method: "POST", body: [{ match_id: id, map_tried_at: new Date().toISOString() }], prefer: "resolution=merge-duplicates,return=minimal" });
      return null;
    }
  }
  const [f] = await af(`/fixtures?ids=${afId}&timezone=UTC`);
  if (!f) return null;
  const row = { match_id: id, map_tried_at: new Date().toISOString(), ...slim(f), final_seen_at: new Date(0).toISOString(), updated_at: new Date().toISOString() };
  await sb("match_live?on_conflict=match_id", { method: "POST", body: [row], prefer: "resolution=merge-duplicates,return=minimal" });
  return row;
}

// API-Football-এর লিগের মুখোমুখি রেকর্ড (football-data-এর মতো আকারে, যাতে সাইটের একই অংশ দেখাতে পারে)
async function h2hAf(id) {
  const [m] = await sb(`matches?select=id,home_id,away_id,competition_code&id=eq.${id}`);
  if (!m || !AF_LEAGUES[m.competition_code]) return null;
  const fx = await af(`/fixtures/headtohead?h2h=${m.home_id - TOFF}-${m.away_id - TOFF}&last=10&timezone=UTC`);
  return { matches: fx.map((f) => ({
    id: MOFF + f.fixture.id, utcDate: new Date(f.fixture.timestamp * 1000).toISOString(), status: AF_STATUS(f.fixture.status?.short),
    competition: { code: Object.keys(AF_LEAGUES).find((k) => AF_LEAGUES[k].id === f.league?.id) || null, name: f.league?.name },
    homeTeam: { id: TOFF + f.teams.home.id, name: dec(f.teams.home.name) }, awayTeam: { id: TOFF + f.teams.away.id, name: dec(f.teams.away.name) },
    score: { home: f.goals?.home ?? null, away: f.goals?.away ?? null },
  })).sort((a, b) => b.utcDate.localeCompare(a.utcDate)) };
}

// খেলোয়াড়ের পাতা (যেকোনো লিগের): পরিচয় আর এই মৌসুমের প্রতিযোগিতা অনুযায়ী হিসাব
async function playerAf(afId) {
  const now = new Date(), y = now.getUTCFullYear();
  // ইউরোপের মৌসুম জুলাইয়ে শুরু; এমএলএস-এর মতো লিগে ক্যালেন্ডার বছর, তাই দুটোই চেষ্টা
  const seasons = [...new Set([now.getUTCMonth() >= 6 ? y : y - 1, y])];
  let got = null;
  for (const se of seasons) {
    const [r] = await af(`/players?id=${afId}&season=${se}`);
    if (r && (!got || (r.statistics || []).some((x) => x.games?.appearences))) got = r;
    if (got && (got.statistics || []).some((x) => x.games?.appearences)) break;
  }
  if (!got) return null;
  const p = got.player || {};
  const ourCode = (lid) => Object.entries(LEAGUE).find(([, v]) => v === lid)?.[0] || Object.entries(AF_LEAGUES).find(([, v]) => v.id === lid)?.[0] || null;
  const comps = (got.statistics || []).map((x) => ({
    code: ourCode(x.league?.id), league: x.league?.name || null, logo: x.league?.logo || null, season: x.league?.season || null,
    team: x.team ? { af: x.team.id, id: AF_LEAGUES[ourCode(x.league?.id)] ? TOFF + x.team.id : null, name: dec(x.team.name), logo: x.team.logo } : null,
    apps: x.games?.appearences ?? 0, starts: x.games?.lineups ?? 0, minutes: x.games?.minutes ?? 0, number: x.games?.number ?? null,
    position: x.games?.position || null, rating: x.games?.rating ? Math.round(parseFloat(x.games.rating) * 100) / 100 : null,
    goals: x.goals?.total ?? 0, assists: x.goals?.assists ?? 0, saves: x.goals?.saves ?? null, conceded: x.goals?.conceded ?? null,
    yc: x.cards?.yellow ?? 0, rc: x.cards?.red ?? 0, pen: x.penalty?.scored ?? 0,
  })).filter((c) => c.apps || c.minutes).sort((a, b) => b.minutes - a.minutes);
  const main = comps[0] || null;
  return {
    id: POFF + afId, af: afId, name: dec(p.name), first: dec(p.firstname), last: dec(p.lastname), age: p.age ?? null,
    born: p.birth?.date || null, birthplace: [p.birth?.place, p.birth?.country].filter(Boolean).join(", ") || null,
    nationality: p.nationality || null, height: p.height || null, weight: p.weight || null, injured: !!p.injured, photo: p.photo || null,
    position: main?.position || (got.statistics || [])[0]?.games?.position || null, number: main?.number ?? null,
    team: main?.team || (got.statistics || [])[0]?.team && { af: got.statistics[0].team.id, name: dec(got.statistics[0].team.name), logo: got.statistics[0].team.logo, id: null },
    comps,
    teams: [...new Set(comps.map((c) => c.team?.af).filter(Boolean))].slice(0, 2),
  };
}

// খেলোয়াড়ের সাম্প্রতিক ম্যাচ (ক্লাব + জাতীয় দল): প্রতিটায় ফল, মিনিট, রেটিং, গোল, অ্যাসিস্ট
const ourCodeOf = (lid) => Object.entries(LEAGUE).find(([, v]) => v === lid)?.[0] || Object.entries(AF_LEAGUES).find(([, v]) => v.id === lid)?.[0] || null;
async function playerMatchesAf(afId, teamIds) {
  const per = teamIds.length > 1 ? 6 : 10;
  const lists = await Promise.all(teamIds.slice(0, 2).map((t) => af(`/fixtures?team=${t}&last=${per}&timezone=UTC`)));
  const ids = [...new Set(lists.flat().map((f) => f.fixture.id))].slice(0, 20);
  if (!ids.length) return [];
  const full = await af(`/fixtures?ids=${ids.join("-")}&timezone=UTC`);
  return full.map((f) => {
    let st = null, team = null;
    for (const tp of f.players || []) { const x = (tp.players || []).find((q) => q.player?.id === afId); if (x) { st = x.statistics?.[0] || {}; team = tp.team; } }
    if (!team) team = [f.teams.home, f.teams.away].find((t) => teamIds.includes(t.id)) || f.teams.home;
    const home = f.teams.home.id === team.id, opp = home ? f.teams.away : f.teams.home;
    const gf = home ? f.goals?.home : f.goals?.away, ga = home ? f.goals?.away : f.goals?.home;
    const r = parseFloat(st?.games?.rating);
    const inSquad = !!st || (f.lineups || []).some((l) => [...(l.startXI || []), ...(l.substitutes || [])].some((q) => q.player?.id === afId));
    return {
      id: AF_LEAGUES[ourCodeOf(f.league?.id)] ? MOFF + f.fixture.id : null, date: new Date(f.fixture.timestamp * 1000).toISOString(),
      league: f.league?.name || null, round: f.league?.round || null, code: ourCodeOf(f.league?.id), team: { name: dec(team.name), logo: team.logo },
      opp: { name: dec(opp.name), logo: opp.logo }, home, gf: gf ?? null, ga: ga ?? null,
      res: gf == null || ga == null ? null : gf > ga ? "W" : gf < ga ? "L" : "D",
      min: st?.games?.minutes ?? null, rating: Number.isFinite(r) ? r : null, goals: st?.goals?.total || 0, assists: st?.goals?.assists || 0,
      yc: st?.cards?.yellow || 0, rc: st?.cards?.red || 0, bench: inSquad && !st?.games?.minutes, squad: inSquad,
    };
  }).filter((x) => x.squad).sort((a, b) => b.date.localeCompare(a.date));
}

// ক্যারিয়ার: কোন মৌসুমে কোন দলে; সাম্প্রতিক ৪ মৌসুমের ম্যাচ, গোল, অ্যাসিস্ট, রেটিং
async function playerCareerAf(afId) {
  const teams = await af(`/players/teams?player=${afId}`);
  const rows = [];
  for (const t of teams) for (const se of t.seasons || []) rows.push({ season: se, team: { af: t.team?.id, name: dec(t.team?.name), logo: t.team?.logo } });
  rows.sort((a, b) => b.season - a.season);
  const recent = [...new Set(rows.map((r) => r.season))].slice(0, 4);
  const stats = await Promise.all(recent.map((se) => af(`/players?id=${afId}&season=${se}`).then((r) => [se, r[0]?.statistics || []]).catch(() => [se, []])));
  const by = Object.fromEntries(stats);
  return rows.map((r) => {
    const st = (by[r.season] || []).filter((x) => x.team?.id === r.team.af);
    if (!st.length) return { ...r, apps: null };
    const sum = (f) => st.reduce((t, x) => t + (f(x) || 0), 0);
    const mins = sum((x) => x.games?.minutes);
    const rated = st.filter((x) => x.games?.rating);
    const rm = rated.reduce((t, x) => t + (x.games.minutes || 0), 0);
    return { ...r, apps: sum((x) => x.games?.appearences), goals: sum((x) => x.goals?.total), assists: sum((x) => x.goals?.assists), minutes: mins,
      rating: rm ? Math.round(rated.reduce((t, x) => t + parseFloat(x.games.rating) * (x.games.minutes || 0), 0) / rm * 100) / 100 : null };
  }).filter((r) => r.apps !== 0);
}

// football-data-এর খেলোয়াড় → API-Football-এর খেলোয়াড় (নাম + জন্মতারিখ মিলিয়ে), যাতে বড় ছয় লিগেও নতুন পাতা
const asciiName = (x) => (x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ø/g, "o").replace(/[ßđłæ]/g, (c) => ({ ß: "ss", đ: "d", ł: "l", æ: "ae" })[c]);
async function resolveFd(fdId) {
  const r = await fetch(`https://api.football-data.org/v4/persons/${fdId}`, { headers: { "X-Auth-Token": process.env.FD_KEY } });
  if (!r.ok) return null;
  const fp = await r.json();
  const dob = fp.dateOfBirth || null;
  const words = asciiName(fp.name).split(/\s+/).filter((w) => w.length >= 3);
  const tries = [...new Set([words[words.length - 1], words[0], ...words.slice(1, -1)].filter(Boolean))].slice(0, 3);
  const nm = asciiName(fp.name).toLowerCase();
  for (const w of tries) {
    let list = [];
    try { list = await af(`/players/profiles?search=${encodeURIComponent(w)}`); } catch { list = []; }
    const cands = list.map((x) => x.player || x).filter((x) => x?.id);
    // জন্মতারিখ মিললে নিশ্চিত; না থাকলে পুরো নামের মিল
    const hit = (dob && cands.find((x) => x.birth?.date === dob)) || cands.find((x) => asciiName(`${x.firstname || ""} ${x.lastname || ""}`).toLowerCase() === nm || asciiName(x.name).toLowerCase() === nm);
    if (hit) return hit.id;
  }
  return null;
}

export default async function handler(req, res) {
  const q0 = req.query || {};
  if (q0.resolve) {
    const id = parseInt(q0.resolve, 10);
    if (!(id > 0 && id < POFF)) return res.status(400).json({ ok: false });
    try {
      const afId = await resolveFd(id);
      res.setHeader("Cache-Control", afId ? "public, s-maxage=2592000, max-age=604800" : "public, s-maxage=86400, max-age=3600");   // মিলে গেলে ৩০ দিন জমা
      return res.status(200).json({ ok: true, id: afId ? POFF + afId : null });
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
  if (q0.pmatches || q0.pcareer) {
    const id = parseInt(q0.pmatches || q0.pcareer, 10);
    if (!(id > POFF)) return res.status(400).json({ ok: false });
    try {
      let d;
      if (q0.pcareer) d = await playerCareerAf(id - POFF);
      else {
        const teams = String(q0.teams || "").split(",").map((x) => parseInt(x, 10)).filter(Boolean).slice(0, 2);
        d = teams.length ? await playerMatchesAf(id - POFF, teams) : [];
      }
      res.setHeader("Cache-Control", `public, s-maxage=${q0.pcareer ? 86400 : 21600}, max-age=1800`);
      return res.status(200).json(d);
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
  if (q0.player) {
    const id = parseInt(q0.player, 10);
    if (!(id > POFF)) return res.status(400).json({ ok: false });
    try {
      const d = await playerAf(id - POFF);
      if (!d) return res.status(404).json({ ok: false });
      res.setHeader("Cache-Control", "public, s-maxage=43200, max-age=1800");   // দিনে দুবারের বেশি API-তে যায় না
      return res.status(200).json(d);
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
  if (q0.h2h) {
    const id = parseInt(q0.h2h, 10);
    try {
      const d = id >= MOFF ? await h2hAf(id) : null;
      if (!d) return res.status(404).json({ ok: false });
      res.setHeader("Cache-Control", "public, s-maxage=86400, max-age=3600");   // দিনে একবারই API-তে যায়
      return res.status(200).json(d);
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
  if (q0.match) {
    // সবার জন্য খোলা, কিন্তু প্রতি ম্যাচে জীবনে একবারই API-তে যায়
    const id = parseInt(q0.match, 10);
    if (!id) return res.status(400).json({ ok: false });
    try {
      const row = await fetchOne(id);
      res.setHeader("Cache-Control", row?.events ? "public, max-age=86400" : "no-store");
      return res.status(200).json({ ok: true, row, calls });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
    }
  }
  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || "";
  if (secret && auth !== `Bearer ${secret}` && (req.query || {}).secret !== secret) return res.status(401).json({ ok: false, error: "unauthorized" });
  try {
    const result = q0.mode === "leagues" ? await syncAfLeagues() : await runLive();
    if (result.calls) await sb("sync_log", { method: "POST", body: { mode: q0.mode === "leagues" ? "leagues" : "live", ok: true, detail: JSON.stringify(result) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    await sb("sync_log", { method: "POST", body: { mode: "live", ok: false, detail: String(e.message || e) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
