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
  SPL: { id: 307, en: "Saudi Pro League", bn: "সৌদি প্রো লিগ", sort: 7, squads: true },
  MLS: { id: 253, en: "MLS", bn: "এমএলএস", sort: 8, squads: true },
  UECL: { id: 848, en: "Conference League", bn: "কনফারেন্স লিগ", sort: 9 },
  UNL: { id: 5, en: "UEFA Nations League", bn: "নেশনস লিগ", sort: 10 },
  EURO: { id: 4, en: "UEFA Euro", bn: "ইউরো", sort: 11 },
  FAC: { id: 45, en: "FA Cup", bn: "এফএ কাপ", sort: 12 },
  EFL: { id: 48, en: "Carabao Cup", bn: "কারাবাও কাপ", sort: 13 },
  CDR: { id: 143, en: "Copa del Rey", bn: "কোপা দেল রে", sort: 14 },
  CCC: { id: 16, en: "CONCACAF Champions Cup", bn: "কনকাকাফ চ্যাম্পিয়ন্স কাপ", sort: 15, squads: true },
  ACL: { id: 17, en: "AFC Champions League Elite", bn: "এএফসি চ্যাম্পিয়ন্স লিগ", sort: 16, squads: true },
  UEL: { id: 3, en: "Europa League", bn: "ইউরোপা লিগ", sort: 9 },
  // বাংলাদেশ প্রিমিয়ার লিগ: আইডি দেশ ধরে খুঁজে নেওয়া হয় (country + নাম)
  // বাংলাদেশ ফেডারেশন কাপ
  BFC: { id: 811, en: "Federation Cup", bn: "ফেডারেশন কাপ", sort: 8, squads: true, ownTable: "groups" },
  BPL: { id: null, find: { country: "Bangladesh", name: /premier/i }, en: "Bangladesh Football League", bn: "বাংলাদেশ ফুটবল লিগ", sort: 7, squads: true, ownTable: true },
};
export const MOFF = 100000000, TOFF = 10000000, POFF = 10000000;
// বড় দলগুলোর বাংলা নাম (API-Football-এর নামের অংশ → বাংলা); বাকিগুলো ইংরেজিতে
const AF_TEAMS_BN = [
  ["Bashundhara", "বসুন্ধরা কিংস"], ["Abahani Chittagong", "চট্টগ্রাম আবাহনী"], ["Chittagong Abahani", "চট্টগ্রাম আবাহনী"], ["Chattogram Abahani", "চট্টগ্রাম আবাহনী"], ["Abahani", "ঢাকা আবাহনী"],
  ["Mohammedan", "মোহামেডান"], ["Fortis", "ফর্টিস এফসি"], ["Rahmatganj", "রহমতগঞ্জ"], ["Rahmatgonj", "রহমতগঞ্জ"], ["PWD", "পিডব্লিউডি"], ["Brothers Union", "ব্রাদার্স ইউনিয়ন"],
  ["Police", "পুলিশ এফসি"], ["City Club", "সিটি ক্লাব"], ["Chattogram", "চট্টগ্রাম"], ["Fakirerpool", "ফকিরেরপুল"], ["Dhaka Wanderers", "ঢাকা ওয়ান্ডারার্স"], ["Sheikh Russel", "শেখ রাসেল"],
  ["Sheikh Jamal", "শেখ জামাল"], ["Arambagh", "আরামবাগ"], ["Muktijoddha", "মুক্তিযোদ্ধা"], ["Uttar Baridhara", "উত্তর বারিধারা"], ["Saif Sporting", "সাইফ স্পোর্টিং"],
  ["Al-Hilal", "আল হিলাল"], ["Al-Nassr", "আল নাসর"], ["Al-Ittihad", "আল ইত্তিহাদ"], ["Al-Ahli", "আল আহলি"],
  ["Al-Qadisiyah", "আল কাদসিয়া"], ["Al-Ettifaq", "আল ইত্তিফাক"], ["Al-Shabab", "আল শাবাব"], ["Al-Taawoun", "আল তাউন"],
  ["Al-Fateh", "আল ফাতেহ"], ["Al-Fayha", "আল ফাইহা"], ["Al-Khaleej", "আল খালিজ"], ["Al-Riyadh", "আল রিয়াদ"],
  ["Inter Miami", "ইন্টার মায়ামি"], ["Los Angeles Galaxy", "এলএ গ্যালাক্সি"], ["Los Angeles FC", "লস অ্যাঞ্জেলেস এফসি"],
  ["New York City", "নিউ ইয়র্ক সিটি"], ["New York Red Bulls", "নিউ ইয়র্ক রেড বুলস"], ["Seattle Sounders", "সিয়াটল সাউন্ডার্স"],
  ["Atlanta United", "আটলান্টা ইউনাইটেড"], ["Columbus Crew", "কলম্বাস ক্রু"], ["FC Cincinnati", "এফসি সিনসিনাটি"],
  ["Philadelphia Union", "ফিলাডেলফিয়া ইউনিয়ন"], ["Orlando City", "অরল্যান্ডো সিটি"], ["Toronto FC", "টরন্টো এফসি"],
];
const afBn = (name) => AF_TEAMS_BN.find(([k]) => (name || "").toLowerCase().includes(k.toLowerCase()))?.[1] || null;
const AF_STATUS = (st) => (["NS", "TBD"].includes(st) ? "TIMED" : st === "HT" ? "PAUSED" : ["FT", "AET", "PEN"].includes(st) ? "FINISHED"
  : st === "PST" ? "POSTPONED" : ["CANC", "ABD", "AWD", "WO"].includes(st) ? "CANCELLED" : "IN_PLAY");
// লোগো না এলে দেখানোর তিন অক্ষর: "Al-Hilal" → HIL, "Inter Miami" → INT
const afTla = (n) => { const w = (dec(n) || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[\s-]+/).filter((x) => x && !/^(al|fc|sc|cf|cd|ac|club|de|the)$/i.test(x)); return (w[0] || n || "?").replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || null; };
const afTeamRow = (t) => ({ id: TOFF + t.id, name_en: dec(t.name), short_en: dec(t.name), tla: afTla(t.name), name_bn: afBn(t.name), crest: t.logo || null, updated_at: new Date().toISOString() });

// টাইব্রেকারের ফল রাখার ঘর (pen_home/pen_away) ডাটাবেসে আছে কিনা — SQL চালানোর আগেও যেন সিঙ্ক না ভাঙে
let penCols = null;
async function hasPen() {
  // "আছে" মনে রাখা হয়; "নেই" হলে প্রতিবার আবার দেখা (SQL চালানোর পরপরই যেন কাজ শুরু করে)
  if (!penCols) penCols = await sb("matches?select=pen_home&limit=1").then(() => true).catch(() => false);
  return penCols;
}

async function upsertRows(table, rows, conflict = "id") {
  for (let i = 0; i < rows.length; i += 500)
    await sb(`${table}?on_conflict=${conflict}`, { method: "POST", body: rows.slice(i, i + 500), prefer: "resolution=merge-duplicates,return=minimal" });
}

// দিনে একবার: চলতি মৌসুমের পুরো সূচি, পয়েন্ট টেবিল আর শীর্ষ গোলদাতা (প্রতি লিগে ৪টা কল)
export async function syncAfLeagues(only) {
  if (!process.env.APIF_KEY) throw new Error("APIF_KEY সেট করা নেই");
  calls = 0;
  const out = {};
  // একই ক্লাব দুই উৎসে: এফএ কাপের আর্সেনাল = প্রিমিয়ার লিগের আর্সেনাল।
  // API-Football-এর দলের নাম আমাদের (football-data) দলের সাথে নিখুঁত আর একমাত্র মিললে সেই দলেরই আইডি ব্যবহার
  const fdTeams = await sb(`teams?select=id,name_en,short_en,name_bn&id=lt.${TOFF}`).catch(() => []);
  const fdMemo = new Map();
  const fdOf = (t) => {
    if (fdMemo.has(t.id)) return fdMemo.get(t.id);
    let best = null, n = 0;
    // "Leeds United" = "Leeds", "Ipswich Town" = "Ipswich": সাধারণ শব্দ বাদ দিয়েও মেলানো (একমাত্র মিল হলেই)
    const GEN = /\b(united|town|city|hotspur|albion|wanderers|county|rovers|athletic)\b/gi;
    for (const x of fdTeams) {
      const names = [x.name_en, x.short_en].filter(Boolean);
      if (sim([...names, ...names.map((y) => y.replace(GEN, " ").trim()).filter(Boolean)], t.name) >= 0.999) { best = x; n++; }
    }
    const r = n === 1 ? best : null;
    fdMemo.set(t.id, r);
    return r;
  };
  const tid = (t) => (t?.id ? fdOf(t)?.id ?? TOFF + t.id : null);
  const merged = new Set();
  const teamRowX = (t) => afTeamRow(t);
  const needRow = (t) => { if (fdOf(t)) { merged.add(TOFF + t.id); return false; } return true; };
  for (const [code, L] of Object.entries(AF_LEAGUES)) {
    if (only && !only.includes(code)) continue;
    try {
      if (!L.id && L.find) {
        const list = await af(`/leagues?country=${encodeURIComponent(L.find.country)}&type=league`);
        const hit = list.find((x) => L.find.name.test(x.league?.name || ""));
        if (!hit) { out[code] = "league not found"; continue; }
        L.id = hit.league.id;
      }
      const [lg] = await af(`/leagues?id=${L.id}&current=true`);
      const season = lg?.seasons?.find((x) => x.current)?.year;
      if (!season) { out[code] = "no season"; continue; }
      await upsertRows("competitions", [{ code, name_en: L.en, name_bn: L.bn, emblem: lg.league?.logo || null, sort: L.sort }], "code");
      const fx = await af(`/fixtures?league=${L.id}&season=${season}&timezone=UTC`);
      const teams = new Map();
      for (const f of fx) for (const t of [f.teams.home, f.teams.away]) if (t?.id && needRow(t)) teams.set(t.id, teamRowX(t));
      await upsertRows("teams", [...teams.values()]);
      const pen = await hasPen();
      await upsertRows("matches", fx.map((f) => ({
        ...(pen ? { pen_home: f.score?.penalty?.home ?? null, pen_away: f.score?.penalty?.away ?? null } : {}),
        id: MOFF + f.fixture.id, competition_code: code, season, matchday: parseInt((f.league?.round || "").match(/(\d+)\s*$/)?.[1], 10) || null,
        stage: f.league?.round || null, group_name: null, utc_date: new Date(f.fixture.timestamp * 1000).toISOString(),
        status: AF_STATUS(f.fixture.status?.short), home_id: tid(f.teams.home), away_id: tid(f.teams.away),
        home_score: f.goals?.home ?? null, away_score: f.goals?.away ?? null, updated_at: new Date().toISOString(),
      })));
      // টেবিল: এমএলএস-এর দুই কনফারেন্স মিলিয়ে পয়েন্ট অনুযায়ী একটা তালিকা
      const [st] = await af(`/standings?league=${L.id}&season=${season}`);
      let rowsAll = (st?.league?.standings || []).flat().filter((r) => r.team?.id);
      // কয়েক গ্রুপের টেবিল এক তালিকায় মেশানো যায় না
      if (L.ownTable === "groups") { if ((st?.league?.standings || []).length !== 1) rowsAll = []; }
      else if (L.ownTable && staleTable(rowsAll, fx)) rowsAll = tableFromFixtures(fx);
      const seen = new Set();
      const rows = rowsAll.filter((r) => !seen.has(r.team.id) && seen.add(r.team.id))
        .sort((a, b) => b.points - a.points || b.goalsDiff - a.goalsDiff || (b.all?.goals?.for || 0) - (a.all?.goals?.for || 0));
      if (rows.length) {
        await upsertRows("teams", rows.filter((r) => !teams.has(r.team.id) && needRow(r.team)).map((r) => teamRowX(r.team)));
        await sb(`standings?competition_code=eq.${code}`, { method: "DELETE", prefer: "return=minimal" });
        await sb("standings", { method: "POST", prefer: "return=minimal", body: rows.map((r, i) => ({
          competition_code: code, team_id: tid(r.team), position: i + 1, played: r.all?.played ?? 0, won: r.all?.win ?? 0, draw: r.all?.draw ?? 0,
          lost: r.all?.lose ?? 0, gf: r.all?.goals?.for ?? 0, ga: r.all?.goals?.against ?? 0, gd: r.goalsDiff ?? 0, points: r.points ?? 0,
          form: r.form || null, updated_at: new Date().toISOString(),
        })) });
      }
      const sc = await af(`/players/topscorers?league=${L.id}&season=${season}`);
      if (sc.length) {
        await upsertRows("teams", sc.map((r) => r.statistics?.[0]?.team).filter((t) => t?.id && !teams.has(t.id) && needRow(t)).map(teamRowX));
        await sb(`scorers?competition_code=eq.${code}`, { method: "DELETE", prefer: "return=minimal" });
        const ps = new Set();
        await sb("scorers", { method: "POST", prefer: "return=minimal", body: sc.filter((r) => r.player?.id && !ps.has(r.player.id) && ps.add(r.player.id)).map((r) => {
          const x = r.statistics?.[0] || {};
          return { competition_code: code, player_id: POFF + r.player.id, player_name: dec(r.player.name), nationality: r.player.nationality || null,
            team_id: x.team?.id ? tid(x.team) : null, played: x.games?.appearences ?? null, goals: x.goals?.total ?? 0,
            assists: x.goals?.assists ?? 0, penalties: x.penalty?.scored ?? 0, updated_at: new Date().toISOString() };
        }) });
      }
      out[code] = { season, matches: fx.length, table: rows.length, scorers: sc.length };
    } catch (e) { out[code] = "error: " + String(e.message || e).slice(0, 120); }
  }
  // আগে আলাদা করে রাখা একই ক্লাবের বাড়তি সারি মুছে ফেলা (কোথাও ব্যবহার না হলে)
  let removed = 0;
  for (const id of merged) {
    try { await sb(`teams?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" }); removed++; } catch { /* কোথাও (প্রিয় দল) ব্যবহার হচ্ছে */ }
  }
  out.merged = merged.size; out.removed = removed;
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
    pen: f.score?.penalty?.home != null ? [f.score.penalty.home, f.score.penalty.away] : null,
    events, lineups, stats,
    players: Object.keys(players).length ? players : null,
  };
}


// ── ফোনে নোটিফিকেশন (Web Push): প্রিয় দলের খেলা শুরু, গোল, খেলা শেষ ──
// Vercel-এ VAPID_PRIVATE_KEY লাগে; না থাকলে চুপচাপ কিছু পাঠায় না
export const VAPID_PUBLIC = "BFMXdQT5h_0cIPpPhwS5-piYi92NJHudRI63NzcxCBfCDO1JD2pK_DC-njO_aQx1DRVWsx4LKhSNs-62SRrl9OM";
const BN_D = "০১২৩৪৫৬৭৮৯", bnN = (n) => String(n).replace(/\d/g, (d) => BN_D[d]);
const tnm = (t) => t?.name_bn || t?.short_en || t?.name_en || "";
async function sendPushes(notes) {
  if (!notes.length || !process.env.VAPID_PRIVATE_KEY) return 0;
  // একই ঘটনা দুবার না যায়: push_log-এ আগে দাবি করে নেওয়া (unique match_id+ev)
  let claimed = [];
  try {
    claimed = await sb("push_log?on_conflict=match_id,ev", { method: "POST", body: notes.map((n) => ({ match_id: n.mid, ev: n.ev })), prefer: "resolution=ignore-duplicates,return=representation" });
  } catch { return 0; }
  const ok = new Set(claimed.map((r) => r.match_id + "|" + r.ev));
  const todo = notes.filter((n) => ok.has(n.mid + "|" + n.ev));
  if (!todo.length) return 0;
  const teamIds = [...new Set(todo.flatMap((n) => [n.hid, n.aid]).filter(Boolean))];
  const fans = await sb(`user_teams?select=user_id,team_id&kind=eq.fav&team_id=in.(${teamIds.join(",")})`);
  if (!fans.length) return 0;
  const users = [...new Set(fans.map((f) => f.user_id))];
  const subs = await sb(`push_subs?select=id,user_id,endpoint,p256dh,auth,prefs&user_id=in.(${users.join(",")})`);
  if (!subs.length) return 0;
  const { default: webpush } = await import("web-push");
  webpush.setVapidDetails("https://khelakokhon.com", VAPID_PUBLIC, process.env.VAPID_PRIVATE_KEY);
  const dead = [];
  let sent = 0;
  const jobs = [];
  for (const n of todo) {
    const who = new Set(fans.filter((f) => f.team_id === n.hid || f.team_id === n.aid).map((f) => f.user_id));
    for (const sub of subs.filter((x) => who.has(x.user_id) && (x.prefs?.[n.kind] ?? true))) {
      jobs.push(webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: n.title, body: n.body, url: `/match/${n.mid}`, tag: `m${n.mid}-${n.kind}` }), { TTL: n.kind === "goal" ? 600 : 1800, urgency: "high" })
        .then(() => { sent++; }, (e) => { if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(sub.id); }));
    }
  }
  await Promise.all(jobs);
  if (dead.length) await sb(`push_subs?id=in.(${dead.join(",")})`, { method: "DELETE", prefer: "return=minimal" }).catch(() => {});
  return sent;
}
// আগের আর এখনকার অবস্থা মিলিয়ে কী ঘটল
function pushNotes(m, prev, s) {
  const out = [];
  if (!m?.home_id || !prev) return out;
  const H = tnm(m.home), A = tnm(m.away), pst = prev.status;
  const sc = `${H} ${bnN(s.home_goals ?? 0)}–${bnN(s.away_goals ?? 0)} ${A}`;
  const base = { mid: m.id, hid: m.home_id, aid: m.away_id };
  if (s.status === "1H" && (!pst || ["NS", "TBD"].includes(pst)) && (s.elapsed ?? 0) <= 15)
    out.push({ ...base, kind: "start", ev: "start", title: "খেলা শুরু", body: `${H} বনাম ${A}` });
  const was = (prev.home_goals ?? 0) + (prev.away_goals ?? 0), nowG = (s.home_goals ?? 0) + (s.away_goals ?? 0);
  if (pst && nowG > was && s.status !== "P") {
    const g = [...(s.events || [])].reverse().find((e) => e.t === "Goal" && !/Missed/i.test(e.d || "") && !/shootout/i.test(e.c || ""));
    const who = g?.p ? ` · ${g.p}${g.m != null ? ` ${bnN(g.m)}${g.x ? "+" + bnN(g.x) : ""}'` : ""}` : "";
    out.push({ ...base, kind: "goal", ev: `g${s.home_goals}-${s.away_goals}`, title: `গোল! ${sc}`, body: `${who.replace(/^ · /, "")}` || sc });
  }
  if (pst && FINAL.slice(0, 3).includes(s.status) && !FINAL.includes(pst)) {
    const pens = s.pen ? ` (টাইব্রেকারে ${bnN(s.pen[0])}–${bnN(s.pen[1])})` : "";
    out.push({ ...base, kind: "end", ev: "end", title: "খেলা শেষ", body: sc + pens });
  }
  return out;
}

// ── খেলা শেষ হলেই পয়েন্ট টেবিল (ডাটাবেসের standings) ম্যাচের ফল থেকে নতুন করে হিসাব ──
// আগে শুধু রাতে একবার আপডেট হতো। এক টেবিলের লিগগুলোই (গ্রুপের প্রতিযোগিতা আর নকআউট কাপ বাদ)।
const TABLE_LEAGUES = ["PL", "PD", "BL1", "SA", "FL1", "CL", "UEL", "UECL", "BPL", "SPL", "MLS"];
export async function refreshStandings(codes) {
  const out = {};
  for (const code of codes.filter((c) => TABLE_LEAGUES.includes(c))) {
    try {
      const [last] = await sb(`matches?select=season&competition_code=eq.${code}&order=season.desc&limit=1`);
      if (!last?.season) continue;
      let ms = await sb(`matches?select=id,home_id,away_id,home_score,away_score,status,utc_date,stage&competition_code=eq.${code}&season=eq.${last.season}&order=utc_date&limit=2000`);
      if (["CL", "UEL", "UECL"].includes(code)) ms = ms.filter((m) => /LEAGUE_STAGE|league/i.test(m.stage || ""));
      // টেবিলে শুধু নিয়মিত মৌসুম (এমএলএসের প্লে-অফের মতো নকআউট ম্যাচ বাদ)
      if (ms.some((m) => /regular.?season/i.test(m.stage || ""))) ms = ms.filter((m) => /regular.?season/i.test(m.stage || ""));
      if (!ms.length) continue;
      const prev = await sb(`standings?select=team_id,position&competition_code=eq.${code}`);
      const prevPos = Object.fromEntries(prev.map((r) => [r.team_id, r.position]));
      const T = new Map();
      const get = (id) => { if (!T.has(id)) T.set(id, { team_id: id, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, points: 0, res: [] }); return T.get(id); };
      for (const m of ms) { if (m.home_id) get(m.home_id); if (m.away_id) get(m.away_id); }
      // চলমান ম্যাচ এখনকার স্কোর ধরে (গোল হলেই টেবিল বদলায়)
      for (const m of ms.filter((x) => ["FINISHED", "IN_PLAY", "PAUSED"].includes(x.status) && x.home_score != null && x.away_score != null && x.home_id && x.away_id)) {
        for (const [id, f, a] of [[m.home_id, m.home_score, m.away_score], [m.away_id, m.away_score, m.home_score]]) {
          const r = get(id), k = f > a ? "W" : f < a ? "L" : "D";
          r.played++; r.gf += f; r.ga += a; r[k === "W" ? "won" : k === "L" ? "lost" : "draw"]++; r.points += k === "W" ? 3 : k === "D" ? 1 : 0; r.res.push(k);
        }
      }
      // সমান হলে আগের টেবিলের ক্রম রাখা (হেড-টু-হেডের মতো নিয়ম আগের টেবিলে থাকে)
      const rows = [...T.values()].sort((x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || (prevPos[x.team_id] ?? 99) - (prevPos[y.team_id] ?? 99));
      const now = new Date().toISOString();
      await sb(`standings?competition_code=eq.${code}`, { method: "DELETE", prefer: "return=minimal" });
      await sb("standings", { method: "POST", prefer: "return=minimal", body: rows.map((r, i) => ({
        competition_code: code, team_id: r.team_id, position: i + 1, played: r.played, won: r.won, draw: r.draw, lost: r.lost,
        gf: r.gf, ga: r.ga, gd: r.gf - r.ga, points: r.points, form: r.res.slice(-5).join(",") || null, updated_at: now,
      })) });
      out[code] = rows.length;
    } catch (e) { out[code] = "error: " + String(e.message || e).slice(0, 80); }
  }
  return out;
}

export async function runLive() {
  if (!process.env.APIF_KEY) throw new Error("APIF_KEY সেট করা নেই");
  calls = 0;
  const now = Date.now();
  const from = new Date(now - AFTER).toISOString(), to = new Date(now + BEFORE).toISOString();
  const T = "name_en,short_en,name_bn";
  const win = await sb(`matches?select=id,competition_code,utc_date,status,home_id,away_id,home:teams!matches_home_fk(${T}),away:teams!matches_away_fk(${T})&utc_date=gte.${from}&utc_date=lte.${to}&status=not.in.(POSTPONED,CANCELLED)`);
  if (!win.length) return { calls, window: 0 };
  const have = await sb(`match_live?select=match_id,af_id,status,home_goals,away_goals,map_tried_at,final_seen_at&match_id=in.(${win.map((m) => m.id).join(",")})`);
  const byId = Object.fromEntries(have.map((r) => [r.match_id, r]));
  for (const m of win) if (AF_LEAGUES[m.competition_code]) byId[m.id] = { ...byId[m.id], af_id: m.id - MOFF };
  const rows = [];
  const fixUp = [];
  const notes = [];

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
      // সব লিগের ম্যাচের অবস্থা আর স্কোর এখান থেকেই (football-data-র ফ্রি স্তর খেলা চলা বা শেষ হওয়া দেরিতে জানায়)
      // শুধু শুরু হয়ে গেলে লেখা হয়; শুরুর আগের অবস্থা football-data-ই রাখে
      const { pen: penSc, ...sNoPen } = s;
      try { notes.push(...pushNotes(wm, prev?.status !== undefined || prev?.home_goals !== undefined ? prev : null, s)); } catch { /* নোটিফিকেশন ঐচ্ছিক */ }
      const ast = AF_STATUS(s.status);
      if (wm && (AF_LEAGUES[wm.competition_code] || ["IN_PLAY", "PAUSED", "FINISHED"].includes(ast)) && (ast !== wm.status || true))
        fixUp.push({ id: mid, status: ast, home_score: s.home_goals, away_score: s.away_goals, pen: penSc });
      rows.push({
        match_id: mid, ...sNoPen,
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
  // আগেই শেষ হয়ে যাওয়া (আর আনা বন্ধ) ম্যাচ, যার অবস্থা ডাটাবেসে এখনো "শুরু হয়নি": জমা থাকা ফল দিয়ে ঠিক করা
  for (const m of win) {
    const r = byId[m.id];
    if (r?.status && ["FT", "AET", "PEN"].includes(r.status) && m.status !== "FINISHED" && !fixUp.some((x) => x.id === m.id))
      fixUp.push({ id: m.id, status: "FINISHED", home_score: r.home_goals, away_score: r.away_goals });
  }
  // ম্যাচের অবস্থা আর স্কোর (প্রেডিকশনের পয়েন্টের জন্য)
  const pen = fixUp.length ? await hasPen() : false;
  for (const x of fixUp) await sb(`matches?id=eq.${x.id}`, { method: "PATCH", body: { status: x.status, home_score: x.home_score, away_score: x.away_score, ...(pen && x.pen ? { pen_home: x.pen[0], pen_away: x.pen[1] } : {}), updated_at: new Date().toISOString() }, prefer: "return=minimal" });
  if (fixUp.some((x) => x.status === "FINISHED")) await sb("rpc/score_predictions", { method: "POST", body: {} }).catch(() => {});
  const pushed = await sendPushes(notes).catch(() => 0);
  // খেলা শেষ হওয়া লিগের পয়েন্ট টেবিল সাথে সাথে
  const doneCodes = [...new Set(fixUp.map((x) => win.find((m) => m.id === x.id)?.competition_code).filter(Boolean))];
  if (doneCodes.length) await refreshStandings(doneCodes).catch(() => {});
  return { calls, window: win.length, mapped: Object.values(byId).filter((r) => r?.af_id).length, updated: out.length, notes: notes.length, pushed };
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
  const { pen: _p, ...sl } = slim(f);
  const row = { match_id: id, map_tried_at: new Date().toISOString(), ...sl, final_seen_at: new Date(0).toISOString(), updated_at: new Date().toISOString() };
  await sb("match_live?on_conflict=match_id", { method: "POST", body: [row], prefer: "resolution=merge-duplicates,return=minimal" });
  return row;
}

// API-Football-এর লিগের মুখোমুখি রেকর্ড (football-data-এর মতো আকারে, যাতে সাইটের একই অংশ দেখাতে পারে)
async function h2hAf(id) {
  const [m] = await sb(`matches?select=id,home_id,away_id,competition_code&id=eq.${id}`);
  if (!m || !AF_LEAGUES[m.competition_code]) return null;
  // দলের API-Football আইডি ম্যাচ থেকেই (বড় ক্লাবের আইডি এখন আমাদের নিজের)
  const [fxm] = await af(`/fixtures?id=${m.id - MOFF}`);
  if (!fxm) return null;
  const fx = await af(`/fixtures/headtohead?h2h=${fxm.teams.home.id}-${fxm.teams.away.id}&last=10&timezone=UTC`);
  return { matches: fx.map((f) => ({
    id: MOFF + f.fixture.id, utcDate: new Date(f.fixture.timestamp * 1000).toISOString(), status: AF_STATUS(f.fixture.status?.short),
    competition: { code: Object.keys(AF_LEAGUES).find((k) => AF_LEAGUES[k].id === f.league?.id) || null, name: f.league?.name },
    homeTeam: { id: f.teams.home.id === fxm.teams.home.id ? m.home_id : f.teams.home.id === fxm.teams.away.id ? m.away_id : TOFF + f.teams.home.id, name: dec(f.teams.home.name) },
    awayTeam: { id: f.teams.away.id === fxm.teams.home.id ? m.home_id : f.teams.away.id === fxm.teams.away.id ? m.away_id : TOFF + f.teams.away.id, name: dec(f.teams.away.name) },
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

// ক্যারিয়ার: প্রতিটা মৌসুমে কোন দলে, আর সেই মৌসুমের ম্যাচ, গোল, অ্যাসিস্ট, রেটিং (সব মৌসুম একসাথে আনা; ৭ দিন জমা)
let careerPartial = false;
async function playerCareerAf(afId) {
  careerPartial = false;
  const teams = await af(`/players/teams?player=${afId}`);
  const rows = [];
  for (const t of teams) for (const se of t.seasons || []) rows.push({ season: se, team: { af: t.team?.id, name: dec(t.team?.name), logo: t.team?.logo } });
  rows.sort((a, b) => b.season - a.season);
  const recent = [...new Set(rows.map((r) => r.season))].slice(0, 25);
  // একসাথে বেশি অনুরোধে API সীমা ছাড়ায়, তাই ৬টা করে; ব্যর্থ হলে একবার আবার
  const one = (se) => af(`/players?id=${afId}&season=${se}`).then((r) => [se, r[0]?.statistics || []]);
  const by = {};
  let failed = 0;
  for (let i = 0; i < recent.length; i += 6) {
    for (const [se, st] of await Promise.all(recent.slice(i, i + 6).map((se) => one(se).catch(() => one(se)).catch(() => { failed++; return [se, null]; })))) by[se] = st;
  }
  careerPartial = failed > 0;
  return rows.map((r) => {
    const st = (by[r.season] || []).filter((x) => x.team?.id === r.team.af);
    if (by[r.season] === null) return { ...r, apps: null };
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

// ── লিগের পাতা: টেবিল (সব/ঘরে/বাইরে, ফর্ম), খেলোয়াড়ের শীর্ষ তালিকা, আগের মৌসুমের চ্যাম্পিয়ন ──
async function afLeagueId(code) {
  const L = AF_LEAGUES[code];
  if (LEAGUE[code] || L?.id) return LEAGUE[code] || L.id;
  if (L?.find) {
    const list = await af(`/leagues?country=${encodeURIComponent(L.find.country)}&type=league`);
    const hit = list.find((x) => L.find.name.test(x.league?.name || ""));
    if (hit) L.id = hit.league.id;
    return L.id || null;
  }
  return null;
}
async function currentSeason(lid) {
  const [lg] = await af(`/leagues?id=${lid}&current=true`);
  return { season: lg?.seasons?.find((x) => x.current)?.year || null, country: lg?.country?.name || null, logo: lg?.league?.logo || null };
}
// API-এর টেবিল অনেক সময় গত মৌসুমের থেকে যায় (যেমন বাংলাদেশ লিগ)। তখন ম্যাচের ফল থেকে টেবিল বানাই।
const FT_SHORT = ["FT", "AET", "PEN"];
function tableFromFixtures(fx) {
  const T = new Map();
  const blank = () => ({ played: 0, win: 0, draw: 0, lose: 0, goals: { for: 0, against: 0 } });
  const get = (t) => { if (!T.has(t.id)) T.set(t.id, { team: { id: t.id, name: t.name, logo: t.logo }, all: blank(), home: blank(), away: blank(), points: 0, goalsDiff: 0, res: [] }); return T.get(t.id); };
  const done = fx.filter((f) => FT_SHORT.includes(f.fixture?.status?.short)).sort((a, b) => a.fixture.timestamp - b.fixture.timestamp);
  for (const f of fx) for (const t of [f.teams?.home, f.teams?.away]) if (t?.id) get(t);
  for (const f of done) {
    const h = f.goals?.home ?? 0, a = f.goals?.away ?? 0;
    for (const [t, side, gf, ga] of [[f.teams.home, "home", h, a], [f.teams.away, "away", a, h]]) {
      const r = get(t), k = gf > ga ? "win" : gf < ga ? "lose" : "draw";
      for (const b of [r.all, r[side]]) { b.played++; b[k]++; b.goals.for += gf; b.goals.against += ga; }
      r.points += k === "win" ? 3 : k === "draw" ? 1 : 0; r.goalsDiff += gf - ga; r.res.push(k === "win" ? "W" : k === "draw" ? "D" : "L");
    }
  }
  const rows = [...T.values()].sort((x, y) => y.points - x.points || y.goalsDiff - x.goalsDiff || y.all.goals.for - x.all.goals.for || x.team.name.localeCompare(y.team.name));
  return rows.map((r, i) => ({ ...r, rank: i + 1, form: r.res.slice(-5).reverse().join("") || null }));
}
// গ্রুপ পর্ব: কে কার সাথে খেলছে দেখে দলগুলোকে গ্রুপে ভাগ করে প্রতিটার টেবিল (গ্রুপ A, B …)
function groupTablesFromFixtures(fx) {
  const gfx = fx.filter((f) => /group/i.test(f.league?.round || "") && f.teams?.home?.id && f.teams?.away?.id);
  if (!gfx.length) return [];
  const par = new Map(), find = (x) => { while (par.get(x) !== x) x = par.get(x); return x; };
  for (const f of gfx) for (const t of [f.teams.home.id, f.teams.away.id]) if (!par.has(t)) par.set(t, t);
  for (const f of gfx) { const a = find(f.teams.home.id), b = find(f.teams.away.id); if (a !== b) par.set(b, a); }
  const order = [];
  for (const f of [...gfx].sort((a, b) => a.fixture.timestamp - b.fixture.timestamp)) { const r = find(f.teams.home.id); if (!order.includes(r)) order.push(r); }
  return order.map((root, i) => tableFromFixtures(gfx.filter((f) => find(f.teams.home.id) === root)).map((r) => ({ ...r, group: `Group ${String.fromCharCode(65 + i)}` })));
}
// API-এর টেবিলের ম্যাচসংখ্যা ফিক্সচারের সাথে না মিললে বা দল আলাদা হলে সেটা পুরনো
function staleTable(rows, fx) {
  if (!rows.length) return true;
  const ids = new Set(fx.flatMap((f) => [f.teams?.home?.id, f.teams?.away?.id]));
  if (rows.some((r) => !ids.has(r.team?.id))) return true;
  const played = rows.reduce((n, r) => n + (r.all?.played || 0), 0);
  return played !== 2 * fx.filter((f) => FT_SHORT.includes(f.fixture?.status?.short)).length;
}
const tRow = (r, code) => ({
  rank: r.rank, af: r.team?.id, id: AF_LEAGUES[code] ? TOFF + r.team.id : null, name: dec(r.team?.name), logo: r.team?.logo,
  pts: r.points, gd: r.goalsDiff, form: r.form || null, desc: r.description || null, group: r.group || null,
  all: { p: r.all?.played, w: r.all?.win, d: r.all?.draw, l: r.all?.lose, gf: r.all?.goals?.for, ga: r.all?.goals?.against },
  home: { p: r.home?.played, w: r.home?.win, d: r.home?.draw, l: r.home?.lose, gf: r.home?.goals?.for, ga: r.home?.goals?.against },
  away: { p: r.away?.played, w: r.away?.win, d: r.away?.draw, l: r.away?.lose, gf: r.away?.goals?.for, ga: r.away?.goals?.against },
});
const pRow = (r, key) => {
  const x = r.statistics?.[0] || {};
  const v = key === "goals" ? x.goals?.total : key === "assists" ? x.goals?.assists : key === "yellow" ? x.cards?.yellow : x.cards?.red;
  const full = r.player.firstname && r.player.lastname ? `${dec(r.player.firstname).split(" ")[0]} ${dec(r.player.lastname)}` : null;
  return { id: POFF + r.player.id, name: dec(r.player.name), full, photo: r.player.photo, team: { af: x.team?.id, name: dec(x.team?.name), logo: x.team?.logo }, apps: x.games?.appearences ?? null, v: v ?? 0 };
};

// ── লিগের পাতার টেবিল আমাদের নিজের ফল থেকে (রিয়েল টাইম: চলমান ম্যাচ এখনকার স্কোর ধরে) ──
// API-এর টেবিল থেকে শুধু অবস্থানের রং (চ্যাম্পিয়ন্স লিগ, অবনমন ইত্যাদি) নেওয়া হয়, অবস্থান ধরে।
const OWN_LG = ["PL", "PD", "BL1", "SA", "FL1", "CL", "UEL", "UECL", "SPL", "BPL"];
async function ownLeagueTable(code, afGroups) {
  const [last] = await sb(`matches?select=season&competition_code=eq.${code}&order=season.desc&limit=1`);
  if (!last?.season) return null;
  const TS = "id,name_en,short_en,crest";
  let ms = await sb(`matches?select=id,home_id,away_id,home_score,away_score,status,utc_date,stage,home:teams!matches_home_fk(${TS}),away:teams!matches_away_fk(${TS})&competition_code=eq.${code}&season=eq.${last.season}&order=utc_date&limit=2000`);
  if (["CL", "UEL", "UECL"].includes(code)) ms = ms.filter((m) => /LEAGUE_STAGE|league/i.test(m.stage || ""));
  if (ms.some((m) => /regular.?season/i.test(m.stage || ""))) ms = ms.filter((m) => /regular.?season/i.test(m.stage || ""));
  if (!ms.length) return null;
  const prev = await sb(`standings?select=team_id,position&competition_code=eq.${code}`).catch(() => []);
  const prevPos = Object.fromEntries(prev.map((r) => [r.team_id, r.position]));
  const blank = () => ({ p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  const T = new Map();
  const get = (t) => { if (!T.has(t.id)) T.set(t.id, { t, all: blank(), home: blank(), away: blank(), pts: 0, res: [], live: false }); return T.get(t.id); };
  for (const m of ms) { if (m.home?.id) get(m.home); if (m.away?.id) get(m.away); }
  for (const m of ms) {
    if (!["FINISHED", "IN_PLAY", "PAUSED"].includes(m.status) || m.home_score == null || m.away_score == null || !m.home?.id || !m.away?.id) continue;
    const live = m.status !== "FINISHED";
    for (const [t, side, f, a] of [[m.home, "home", m.home_score, m.away_score], [m.away, "away", m.away_score, m.home_score]]) {
      const r = get(t), k = f > a ? "w" : f < a ? "l" : "d";
      for (const b of [r.all, r[side]]) { b.p++; b[k]++; b.gf += f; b.ga += a; }
      r.pts += k === "w" ? 3 : k === "d" ? 1 : 0; r.res.push(k.toUpperCase()); if (live) r.live = true;
    }
  }
  const rows = [...T.values()].sort((x, y) => y.pts - x.pts || (y.all.gf - y.all.ga) - (x.all.gf - x.all.ga) || y.all.gf - x.all.gf || (prevPos[x.t.id] ?? 99) - (prevPos[y.t.id] ?? 99));
  const descAt = {};
  for (const r of (afGroups || []).flat()) if (r.rank && r.description) descAt[r.rank] = r.description;
  return [rows.map((r, i) => ({
    rank: i + 1, af: r.t.id, id: r.t.id, name: r.t.short_en || r.t.name_en, logo: r.t.crest, pts: r.pts, gd: r.all.gf - r.all.ga,
    form: r.res.slice(-5).reverse().join("") || null, desc: descAt[i + 1] || null, group: null, live: r.live,
    all: r.all, home: r.home, away: r.away,
  }))];
}
async function leagueInfo(code, kind) {
  const lid = await afLeagueId(code);
  if (!lid) return null;
  const cur = await currentSeason(lid);
  const se = cur.season;
  if (kind === "table") {
    const [st] = await af(`/standings?league=${lid}&season=${se}`);
    let groups = st?.league?.standings || [];
    if (AF_LEAGUES[code]?.ownTable) {
      const fx = await af(`/fixtures?league=${lid}&season=${se}&timezone=UTC`);
      if (AF_LEAGUES[code].ownTable === "groups") { if (!groups.length) groups = groupTablesFromFixtures(fx); }
      else if (staleTable(groups.flat(), fx)) groups = [tableFromFixtures(fx)];
    }
    if (OWN_LG.includes(code)) {
      const own = await ownLeagueTable(code, groups).catch(() => null);
      if (own?.[0]?.length) return { season: se, country: cur.country, live: own[0].some((r) => r.live), groups: own };
    }
    return { season: se, country: cur.country, groups: groups.map((g) => g.map((r) => tRow(r, code))) };
  }
  if (kind === "players") {
    const [g, a, y, rd] = await Promise.all(["topscorers", "topassists", "topyellowcards", "topredcards"].map((k) => af(`/players/${k}?league=${lid}&season=${se}`).catch(() => [])));
    return { season: se, goals: g.map((r) => pRow(r, "goals")), assists: a.map((r) => pRow(r, "assists")), yellow: y.map((r) => pRow(r, "yellow")), red: rd.map((r) => pRow(r, "red")) };
  }
  if (kind === "seasons") {
    if (code === "CL") return { season: se, list: [] };      // নকআউট প্রতিযোগিতা: টেবিলের প্রথম মানে চ্যাম্পিয়ন নয়
    const yrs = Array.from({ length: 6 }, (_, i) => se - 1 - i);
    const list = [];
    for (const y of yrs) {
      try {
        const [st] = await af(`/standings?league=${lid}&season=${y}`);
        const g = st?.league?.standings?.[0] || [];
        if (g.length) list.push({ season: y, first: tRow(g[0], code), second: g[1] ? tRow(g[1], code) : null });
      } catch { /* সেই মৌসুম বাদ */ }
    }
    return { season: se, list };
  }
  return null;
}

// সার্চের জন্য: API-Football-এর লিগগুলোর (সৌদি, এমএলএস…) সব দলের স্কোয়াড, [আইডি, নাম, দল, পজিশন]
async function afSquads() {
  // শুধু ঘরোয়া লিগের ক্লাব (সৌদি, এমএলএস); কাপের বড় দলগুলোর খেলোয়াড় এমনিতেই আছে
  const codes = Object.keys(AF_LEAGUES).filter((k) => AF_LEAGUES[k].squads);
  const ms = await sb(`matches?select=home_id,away_id&competition_code=in.(${codes.join(",")})`);
  const ids = [...new Set(ms.flatMap((m) => [m.home_id, m.away_id]).filter((x) => x >= TOFF && x < MOFF))].map((x) => x - TOFF);
  const out = [];
  let failed = 0;
  // ৫টা করে, ব্যর্থ হলে একটু থেমে আবার (API-র সেকেন্ডপ্রতি সীমা)
  const one = (t) => af(`/players/squads?team=${t}`).catch(() => new Promise((ok) => setTimeout(ok, 1200)).then(() => af(`/players/squads?team=${t}`))).catch(() => { failed++; return []; });
  for (let i = 0; i < ids.length; i += 5) {
    const got = await Promise.all(ids.slice(i, i + 5).map(one));
    got.forEach((r, k) => { for (const p of r[0]?.players || []) out.push([POFF + p.id, dec(p.name), TOFF + ids[i + k], p.position || null]); });
  }
  out.failed = failed;
  return out;
}

export default async function handler(req, res) {
  const q0 = req.query || {};
  if (q0.squads) {
    try {
      const d = await afSquads();
      // কোনো দল বাদ পড়লে বেশিক্ষণ জমা নয়
      res.setHeader("Cache-Control", d.failed ? "public, s-maxage=300, max-age=300" : "public, s-maxage=604800, max-age=86400");
      return res.status(200).json(d);
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
  if (q0.lgs) {
    // একটি দেশের সব লিগ (কোন লিগ কোন আইডিতে আছে দেখার জন্য)
    try {
      const list = await af(`/leagues?country=${encodeURIComponent(String(q0.lgs).slice(0, 40))}`);
      res.setHeader("Cache-Control", "public, s-maxage=3600, max-age=600");
      return res.status(200).json(list.map((x) => ({ id: x.league?.id, name: x.league?.name, type: x.league?.type, logo: x.league?.logo,
        seasons: (x.seasons || []).slice(-3).map((z) => ({ y: z.year, start: z.start, end: z.end, cur: z.current })) })));
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
  if (q0.lg) {
    const code = String(q0.lg).toUpperCase(), kind = String(q0.kind || "table");
    try {
      const d = await leagueInfo(code, kind);
      if (!d) return res.status(404).json({ ok: false });
      res.setHeader("Cache-Control", `public, s-maxage=${kind === "seasons" ? 2592000 : kind === "players" ? 21600 : 30}, max-age=${kind === "table" ? 20 : 3600}`);
      return res.status(200).json(d);
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
  if (q0.team) {
    // API-Football-এর দলের তথ্য: মাঠ, প্রতিষ্ঠা, কোচ, স্কোয়াড (ছবিসহ)
    const id = parseInt(q0.team, 10);
    if (!(id > TOFF && id < 2 * TOFF)) return res.status(400).json({ ok: false });
    try {
      const t = id - TOFF;
      const [[ti], [sq], co] = await Promise.all([af(`/teams?id=${t}`), af(`/players/squads?team=${t}`).catch(() => []), af(`/coachs?team=${t}`).catch(() => [])]);
      const coach = co.find((c) => (c.career || []).some((x) => x.team?.id === t && !x.end)) || null;
      const d = {
        id, venue: ti?.venue?.name || null, city: ti?.venue?.city || null, capacity: ti?.venue?.capacity || null, founded: ti?.team?.founded || null, country: ti?.team?.country || null,
        coach: coach ? { name: dec(coach.name), nationality: coach.nationality || null, photo: coach.photo || null } : null,
        squad: (sq?.players || []).map((p) => ({ id: POFF + p.id, name: dec(p.name), position: p.position || null, number: p.number ?? null, age: p.age ?? null, photo: p.photo || null })),
      };
      res.setHeader("Cache-Control", d.squad.length ? "public, s-maxage=86400, max-age=21600" : "public, s-maxage=600, max-age=300");
      return res.status(200).json(d);
    } catch (e) { return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) }); }
  }
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
      // কোনো মৌসুম আনা না গেলে বেশিক্ষণ জমা রাখা নয়, যাতে পরের বার পুরোটা আসে
      const long = q0.pcareer && !careerPartial;
      res.setHeader("Cache-Control", `public, s-maxage=${long ? 604800 : q0.pcareer ? 600 : 21600}, max-age=${long ? 86400 : 600}`);
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
    const result = q0.mode === "leagues" ? await syncAfLeagues(q0.only ? String(q0.only).toUpperCase().split(",") : null)
      : q0.mode === "tables" ? { mode: "tables", ...(await refreshStandings(q0.only ? String(q0.only).toUpperCase().split(",") : TABLE_LEAGUES)) }
      : await runLive();
    if (result.calls) await sb("sync_log", { method: "POST", body: { mode: q0.mode === "leagues" ? "leagues" : "live", ok: true, detail: JSON.stringify(result) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    await sb("sync_log", { method: "POST", body: { mode: "live", ok: false, detail: String(e.message || e) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
