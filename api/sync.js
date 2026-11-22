// ═══════════════════════════════════════════════════════════════
//  /api/sync — football-data.org (ফ্রি টায়ার) থেকে সূচি ও ফল এনে Supabase-এ রাখে
//
//  ভিজিটররা কখনো সরাসরি football-data.org-এ যায় না; সবাই Supabase থেকে পড়ে।
//  তাই সাইটে যত লোকই আসুক, API কল হয় শুধু এই ফাংশন চললে।
//
//  দুই মোড:
//    /api/sync              → full: ৬টা প্রতিযোগিতার পুরো মৌসুম (৬টা কল) — দিনে একবার
//    /api/sync?mode=quick   → quick: গতকাল থেকে আগামীকালের ম্যাচ (১টা কল) — চাইলে ঘনঘন
//    /api/sync?mode=tables  → ৬টা লিগের পয়েন্ট টেবিল (৬টা কল) — দিনে একবার
//    /api/sync?mode=scorers → ৬টা লিগের শীর্ষ গোলদাতা (৬টা কল) — দিনে একবার
//  (ফ্রি টায়ারে মিনিটে ১০টা কল, তাই full/tables/scorers আলাদা সময়ে চলে — vercel.json দেখুন)
//
//  দরকারি Environment Variables (Vercel → Settings → Environment Variables):
//    FD_KEY                     football-data.org API key
//    SUPABASE_URL               https://xxxx.supabase.co
//    SUPABASE_SERVICE_ROLE_KEY  Supabase → Settings → API → service_role (গোপন!)
//    CRON_SECRET                যেকোনো লম্বা র‍্যান্ডম লেখা
// ═══════════════════════════════════════════════════════════════
// football-data.org team id → [ইংরেজি নামের অংশ, বাংলা নাম]
// ইংরেজি অংশটা নিরাপত্তার জন্য: id ভুল হলে নাম না মিললে বাংলা নাম বসবে না।
// নতুন দল যোগ করতে: Supabase-এর teams টেবিলে name_en দিয়ে খুঁজে id নিন।
// তালিকায় না থাকলে সাইটে ইংরেজি সংক্ষিপ্ত নাম দেখাবে।
const TEAMS_BN = {
  // id: [ইংরেজি নামের অংশ (যাচাইয়ের জন্য), বাংলা নাম (পত্রিকার বানান), দেখানোর ইংরেজি নাম]
  57: ["Arsenal", "আর্সেনাল", "Arsenal"],
  58: ["Aston Villa", "অ্যাস্টন ভিলা", "Aston Villa"],
  61: ["Chelsea", "চেলসি", "Chelsea"],
  62: ["Everton", "এভারটন", "Everton"],
  63: ["Fulham", "ফুলহাম", "Fulham"],
  64: ["Liverpool", "লিভারপুল", "Liverpool"],
  65: ["Manchester City", "ম্যানচেস্টার সিটি", "Manchester City"],
  66: ["Manchester United", "ম্যানচেস্টার ইউনাইটেড", "Manchester United"],
  67: ["Newcastle", "নিউক্যাসল", "Newcastle"],
  71: ["Sunderland", "সান্ডারল্যান্ড", "Sunderland"],
  73: ["Tottenham", "টটেনহাম", "Tottenham"],
  76: ["Wolverhampton", "উলভারহ্যাম্পটন", "Wolverhampton"],
  322: ["Hull", "হাল সিটি", "Hull City"],
  341: ["Leeds", "লিডস ইউনাইটেড", "Leeds United"],
  349: ["Ipswich", "ইপসউইচ টাউন", "Ipswich Town"],
  351: ["Nottingham", "নটিংহাম ফরেস্ট", "Nottingham Forest"],
  354: ["Crystal Palace", "ক্রিস্টাল প্যালেস", "Crystal Palace"],
  397: ["Brighton", "ব্রাইটন", "Brighton"],
  402: ["Brentford", "ব্রেন্টফোর্ড", "Brentford"],
  563: ["West Ham", "ওয়েস্ট হাম", "West Ham"],
  1044: ["Bournemouth", "বোর্নমাউথ", "Bournemouth"],
  1076: ["Coventry", "কভেন্ট্রি সিটি", "Coventry City"],
  77: ["Athletic", "অ্যাথলেটিক বিলবাও", "Athletic Bilbao"],
  78: ["Atl", "আতলেতিকো মাদ্রিদ", "Atlético Madrid"],
  79: ["Osasuna", "ওসাসুনা", "Osasuna"],
  80: ["Espanyol", "এস্পানিওল", "Espanyol"],
  81: ["Barcelona", "বার্সেলোনা", "Barcelona"],
  82: ["Getafe", "হেতাফে", "Getafe"],
  84: ["Málaga", "মালাগা", "Málaga"],
  86: ["Real Madrid", "রিয়াল মাদ্রিদ", "Real Madrid"],
  87: ["Rayo", "রায়ো ভায়েকানো", "Rayo Vallecano"],
  88: ["Levante", "লেভান্তে", "Levante"],
  90: ["Betis", "রিয়াল বেতিস", "Real Betis"],
  92: ["Sociedad", "রিয়াল সোসিয়েদাদ", "Real Sociedad"],
  94: ["Villarreal", "ভিয়ারিয়াল", "Villarreal"],
  95: ["Valencia", "ভালেন্সিয়া", "Valencia"],
  263: ["Alavés", "আলাভেস", "Alavés"],
  285: ["Elche", "এলচে", "Elche"],
  558: ["Celta", "সেল্তা ভিগো", "Celta Vigo"],
  559: ["Sevilla", "সেভিয়া", "Sevilla"],
  560: ["Deportivo", "দেপোর্তিভো লা করুনিয়া", "Deportivo La Coruña"],
  5335: ["Santander", "রেসিং সান্তান্দের", "Racing Santander"],
  1: ["Köln", "কোলন", "Köln"],
  2: ["Hoffenheim", "হফেনহাইম", "Hoffenheim"],
  3: ["Leverkusen", "বায়ার লেভারকুসেন", "Bayer Leverkusen"],
  4: ["Dortmund", "বরুসিয়া ডর্টমুন্ড", "Borussia Dortmund"],
  5: ["Bayern", "বায়ার্ন মিউনিখ", "Bayern Munich"],
  6: ["Schalke", "শালকে", "Schalke 04"],
  7: ["Hamburg", "হামবুর্গ", "Hamburg"],
  10: ["Stuttgart", "স্টুটগার্ট", "Stuttgart"],
  12: ["Bremen", "ভেরডার ব্রেমেন", "Werder Bremen"],
  15: ["Mainz", "মাইনৎস", "Mainz"],
  16: ["Augsburg", "আউগসবুর্গ", "Augsburg"],
  17: ["Freiburg", "ফ্রাইবুর্গ", "Freiburg"],
  18: ["Gladbach", "বরুসিয়া মনশেনগ্লাডবাখ", "Borussia Mönchengladbach"],
  19: ["Frankfurt", "আইনট্রাখট ফ্রাঙ্কফুর্ট", "Eintracht Frankfurt"],
  28: ["Union Berlin", "উনিয়ন বার্লিন", "Union Berlin"],
  29: ["Paderborn", "পাডারবর্ন", "Paderborn"],
  719: ["Elversberg", "এলভার্সবার্গ", "Elversberg"],
  721: ["Leipzig", "আরবি লাইপজিগ", "RB Leipzig"],
  98: ["Milan", "এসি মিলান", "AC Milan"],
  99: ["Fiorentina", "ফিওরেন্তিনা", "Fiorentina"],
  100: ["Roma", "রোমা", "Roma"],
  102: ["Atalanta", "আতালান্তা", "Atalanta"],
  103: ["Bologna", "বোলোনিয়া", "Bologna"],
  104: ["Cagliari", "কালিয়ারি", "Cagliari"],
  107: ["Genoa", "জেনোয়া", "Genoa"],
  108: ["Inter", "ইন্টার মিলান", "Inter Milan"],
  109: ["Juventus", "জুভেন্টাস", "Juventus"],
  110: ["Lazio", "লাৎসিও", "Lazio"],
  112: ["Parma", "পারমা", "Parma"],
  113: ["Napoli", "নাপোলি", "Napoli"],
  115: ["Udinese", "উদিনেসে", "Udinese"],
  454: ["Venezia", "ভেনেৎসিয়া", "Venezia"],
  470: ["Frosinone", "ফ্রোসিনোনে", "Frosinone"],
  471: ["Sassuolo", "সাসুয়োলো", "Sassuolo"],
  586: ["Torino", "তোরিনো", "Torino"],
  5890: ["Lecce", "লেচে", "Lecce"],
  5911: ["Monza", "মনৎসা", "Monza"],
  7397: ["Como", "কোমো", "Como"],
  511: ["Toulouse", "তুলুজ", "Toulouse"],
  512: ["Brest", "ব্রেস্ত", "Brest"],
  516: ["Marseille", "মার্সেই", "Marseille"],
  519: ["Auxerre", "অক্সের", "Auxerre"],
  521: ["Lille", "লিল", "Lille"],
  522: ["Nice", "নিস", "Nice"],
  523: ["Lyon", "লিওঁ", "Lyon"],
  524: ["Paris Saint", "পিএসজি", "Paris Saint-Germain"],
  525: ["Lorient", "লরিয়াঁ", "Lorient"],
  529: ["Rennais", "রেন", "Rennes"],
  531: ["Troyes", "ত্রোয়া", "Troyes"],
  532: ["Angers", "অঁজে", "Angers"],
  533: ["Havre", "লে আভ্র", "Le Havre"],
  535: ["Mans", "লে মাঁ", "Le Mans"],
  546: ["Lens", "লঁস", "Lens"],
  548: ["Monaco", "মোনাকো", "Monaco"],
  576: ["Strasbourg", "স্ত্রাসবুর্গ", "Strasbourg"],
  1045: ["Paris FC", "প্যারিস এফসি", "Paris FC"],
  498: ["Sporting", "স্পোর্টিং লিসবন", "Sporting CP"],
  503: ["Porto", "পোর্তো", "Porto"],
  610: ["Galatasaray", "গালাতাসারাই", "Galatasaray"],
  613: ["Fenerbah", "ফেনারবাহচে", "Fenerbahçe"],
  674: ["PSV", "পিএসভি আইন্দহোভেন", "PSV Eindhoven"],
  675: ["Feyenoord", "ফেইনুর্ড", "Feyenoord"],
  678: ["Ajax", "আয়াক্স", "Ajax"],
  851: ["Brugge", "ক্লাব ব্রুগা", "Club Brugge"],
  930: ["Slavia", "স্লাভিয়া প্রাগ", "Slavia Prague"],
  1887: ["Shakh", "শাখতার দোনেৎস্ক", "Shakhtar Donetsk"],
  1899: ["AEK", "এইকে এথেন্স", "AEK Athens"],
  1903: ["Benfica", "বেনফিকা", "Benfica"],
  2016: ["LASK", "লাস্ক", "LASK"],
  5720: ["Viking", "ভাইকিং", "Viking"],
  5721: ["Bod", "বোডো/গ্লিমট", "Bodø/Glimt"],
  7509: ["Slovan", "স্লোভান ব্রাতিস্লাভা", "Slovan Bratislava"],
  10233: ["Sabah", "সাবাহ", "Sabah"],
};


const FD = "https://api.football-data.org/v4";
export const COMPETITIONS = ["CL", "PL", "PD", "BL1", "SA", "FL1"];

const ymd = (d) => d.toISOString().slice(0, 10);

async function fdGet(path, key) {
  const r = await fetch(FD + path, { headers: { "X-Auth-Token": key } });
  if (!r.ok) throw new Error(`football-data ${path} → ${r.status} ${await r.text().catch(() => "")}`.slice(0, 300));
  return r.json();
}

function namesFor(team) {
  const entry = TEAMS_BN[team.id];
  if (!entry) return null;
  const [check, bn, en] = entry;
  const fd = `${team.name || ""} ${team.shortName || ""}`.toLowerCase();
  return fd.includes(check.toLowerCase()) ? { bn, en } : null;
}
const bnName = (team) => namesFor(team)?.bn || null;

const teamRow = (t) => ({
  id: t.id,
  name_en: t.name || t.shortName || `Team ${t.id}`,
  short_en: namesFor(t)?.en || t.shortName || t.name || null,
  tla: t.tla || null,
  name_bn: bnName(t),
  crest: t.crest || null,
  updated_at: new Date().toISOString(),
});

// football-data-এর ম্যাচ তালিকা → teams ও matches সারি
export function transform(fdMatches, fallbackComp) {
  const teams = new Map();
  const matches = [];
  for (const m of fdMatches) {
    const code = m.competition?.code || fallbackComp;
    if (!COMPETITIONS.includes(code)) continue;
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (t && t.id && !teams.has(t.id)) teams.set(t.id, teamRow(t));
    }
    const ft = m.score?.fullTime || {};
    matches.push({
      id: m.id,
      competition_code: code,
      season: m.season?.startDate ? parseInt(m.season.startDate.slice(0, 4), 10) : null,
      matchday: m.matchday ?? null,
      stage: m.stage || null,
      group_name: m.group || null,
      utc_date: m.utcDate,
      status: m.status,
      home_id: m.homeTeam?.id || null,
      away_id: m.awayTeam?.id || null,
      home_score: ft.home ?? null,
      away_score: ft.away ?? null,
      updated_at: new Date().toISOString(),
    });
  }
  return { teams: [...teams.values()], matches };
}

async function sb(path, { method = "POST", body, prefer } = {}) {
  const url = process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`supabase ${path} → ${r.status} ${await r.text().catch(() => "")}`.slice(0, 300));
  return r.status === 204 ? null : r.json().catch(() => null);
}

async function upsert(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    await sb(`${table}?on_conflict=id`, {
      body: rows.slice(i, i + 500),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  }
}

// পয়েন্ট টেবিল: প্রতিটা লিগের পুরনো সারি মুছে নতুন বসায়
async function syncTables(key) {
  const out = {};
  await Promise.all(COMPETITIONS.map(async (c) => {
    try {
      const d = await fdGet(`/competitions/${c}/standings`, key);
      const tables = (d.standings || []).filter((x) => x.type === "TOTAL");
      const rows = tables.flatMap((tb) => tb.table || []).filter((r) => r.team?.id);
      if (!rows.length) { out[c] = 0; return; }
      await upsert("teams", [...new Map(rows.map((r) => [r.team.id, teamRow(r.team)])).values()]);
      await sb(`standings?competition_code=eq.${c}`, { method: "DELETE", prefer: "return=minimal" });
      await sb("standings", {
        body: rows.map((r) => ({
          competition_code: c, team_id: r.team.id, position: r.position, played: r.playedGames,
          won: r.won, draw: r.draw, lost: r.lost, gf: r.goalsFor, ga: r.goalsAgainst, gd: r.goalDifference,
          points: r.points, form: r.form || null, updated_at: new Date().toISOString(),
        })),
        prefer: "return=minimal",
      });
      out[c] = rows.length;
    } catch (e) { out[c] = "error: " + String(e.message || e).slice(0, 80); }
  }));
  return { mode: "tables", ...out };
}

// গোলদাতা: প্রতিটা লিগে যারা অন্তত ১ গোল করেছে, সবাই (বড় limit না নিলে নিচের দিকে ছোট সংখ্যায় পিছিয়ে পড়ে)
async function fetchScorers(c, key) {
  for (const limit of [500, 200, 100, 20]) {
    try { return await fdGet(`/competitions/${c}/scorers?limit=${limit}`, key); }
    catch (e) { if (limit === 20 || / 429 /.test(e.message)) throw e; } // সীমা ছাড়ালে ছোট limit-এ আবার চেষ্টা নয়
  }
}
async function syncScorers(key) {
  const out = {};
  await Promise.all(COMPETITIONS.map(async (c) => {
    try {
      const d = await fetchScorers(c, key);
      const rows = (d.scorers || []).filter((r) => r.player?.id);
      if (!rows.length) { out[c] = 0; return; }
      const teams = rows.map((r) => r.team).filter((t) => t?.id);
      if (teams.length) await upsert("teams", [...new Map(teams.map((t) => [t.id, teamRow(t)])).values()]);
      await sb(`scorers?competition_code=eq.${c}`, { method: "DELETE", prefer: "return=minimal" });
      const seen = new Set();
      await sb("scorers", {
        body: rows.filter((r) => !seen.has(r.player.id) && seen.add(r.player.id)).map((r) => ({
          competition_code: c, player_id: r.player.id, player_name: r.player.name, nationality: r.player.nationality || null,
          team_id: r.team?.id || null, played: r.playedMatches ?? null, goals: r.goals ?? 0,
          assists: r.assists ?? 0, penalties: r.penalties ?? 0, updated_at: new Date().toISOString(),
        })),
        prefer: "return=minimal",
      });
      out[c] = rows.length;
    } catch (e) { out[c] = "error: " + String(e.message || e).slice(0, 80); }
  }));
  return { mode: "scorers", ...out };
}

export async function runSync(mode = "full") {
  const key = process.env.FD_KEY;
  if (!key) throw new Error("FD_KEY সেট করা নেই");
  if (mode === "tables") return syncTables(key);
  if (mode === "scorers") return syncScorers(key);
  let fdMatches = [];
  if (mode === "quick") {
    const now = new Date();
    const from = new Date(now.getTime() - 86400000);
    const to = new Date(now.getTime() + 86400000);
    const data = await fdGet(`/matches?dateFrom=${ymd(from)}&dateTo=${ymd(to)}`, key);
    fdMatches = data.matches || [];
  } else {
    // ৬টা কল একসঙ্গে — ফ্রি টায়ারের সীমা মিনিটে ১০টা
    const all = await Promise.all(
      COMPETITIONS.map((c) =>
        fdGet(`/competitions/${c}/matches`, key).then((d) =>
          (d.matches || []).map((m) => ({ ...m, competition: m.competition || { code: c } }))
        )
      )
    );
    fdMatches = all.flat();
  }
  const { teams, matches } = transform(fdMatches);
  await upsert("teams", teams);      // আগে দল, কারণ matches দলের id-র ওপর নির্ভর করে
  // টাইব্রেকারের ফল (ঘর থাকলে)
  const pen = await sb("matches?select=pen_home&limit=1", { method: "GET" }).then(() => true).catch(() => false);
  if (pen) for (const m of matches) { const fm = fdMatches.find((x) => x.id === m.id); m.pen_home = fm?.score?.penalties?.home ?? null; m.pen_away = fm?.score?.penalties?.away ?? null; }
  // football-data কখনো চলমান বা শেষ হওয়া ম্যাচকে আবার "শুরু হয়নি" (TIMED) বলে পাঠায়;
  // API-Football আগেই এগিয়ে থাকা অবস্থা আর স্কোর লিখে থাকলে সেটা পেছনে ফেরানো হয় না
  const RANK = { SCHEDULED: 0, TIMED: 0, IN_PLAY: 1, PAUSED: 1, FINISHED: 2 };
  const ids = matches.map((m) => m.id);
  const have = {};
  for (let i = 0; i < ids.length; i += 300) {
    const r = await sb(`matches?select=id,status,home_score,away_score${pen ? ",pen_home,pen_away" : ""}&id=in.(${ids.slice(i, i + 300).join(",")})&status=in.(IN_PLAY,PAUSED,FINISHED)`, { method: "GET" }).catch(() => []);
    for (const x of r || []) have[x.id] = x;
  }
  for (const m of matches) {
    const old = have[m.id];
    if (old && (RANK[old.status] ?? -1) > (RANK[m.status] ?? -1)) { m.status = old.status; m.home_score = old.home_score; m.away_score = old.away_score; if (pen) { m.pen_home = old.pen_home ?? m.pen_home ?? null; m.pen_away = old.pen_away ?? m.pen_away ?? null; } }
  }
  await upsert("matches", matches);
  const scored = await sb("rpc/score_predictions", { body: {} });
  return { mode, teams: teams.length, matches: matches.length, scored };
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || "";
  const q = req.query || {};
  if (secret && auth !== `Bearer ${secret}` && q.secret !== secret) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }
  const mode = ["quick", "tables", "scorers"].includes(q.mode) ? q.mode : "full";
  try {
    const result = await runSync(mode);
    // লাইভ আপডেট থেমে আছে কিনা আলাদা পথ থেকে দেখা (লাইভ কাজটাই বন্ধ হলে সে নিজে জানাতে পারে না)
    if (mode === "quick") { try { const { checkLiveStale } = await import("./live.js"); result.live = await checkLiveStale(); } catch { /* ঐচ্ছিক */ } }
    await sb("sync_log", { body: { mode, ok: true, detail: JSON.stringify(result) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    await sb("sync_log", { body: { mode, ok: false, detail: String(e.message || e) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
