// ═══════════════════════════════════════════════════════════════
//  /api/sync — football-data.org (ফ্রি টায়ার) থেকে সূচি ও ফল এনে Supabase-এ রাখে
//
//  ভিজিটররা কখনো সরাসরি football-data.org-এ যায় না; সবাই Supabase থেকে পড়ে।
//  তাই সাইটে যত লোকই আসুক, API কল হয় শুধু এই ফাংশন চললে।
//
//  দুই মোড:
//    /api/sync              → full: ৬টা প্রতিযোগিতার পুরো মৌসুম (৬টা কল) — দিনে একবার
//    /api/sync?mode=quick   → quick: গতকাল থেকে আগামীকালের ম্যাচ (১টা কল) — চাইলে ঘনঘন
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
  // ── প্রিমিয়ার লিগ ──
  57: ["Arsenal", "আর্সেনাল"],
  58: ["Aston Villa", "অ্যাস্টন ভিলা"],
  61: ["Chelsea", "চেলসি"],
  62: ["Everton", "এভারটন"],
  63: ["Fulham", "ফুলহ্যাম"],
  64: ["Liverpool", "লিভারপুল"],
  65: ["Manchester City", "ম্যানচেস্টার সিটি"],
  66: ["Manchester United", "ম্যানচেস্টার ইউনাইটেড"],
  67: ["Newcastle", "নিউক্যাসল"],
  71: ["Sunderland", "সান্ডারল্যান্ড"],
  73: ["Tottenham", "টটেনহ্যাম"],
  76: ["Wolverhampton", "উলভস"],
  322: ["Hull", "হাল সিটি"],
  341: ["Leeds", "লিডস ইউনাইটেড"],
  349: ["Ipswich", "ইপসউইচ টাউন"],
  351: ["Nottingham", "নটিংহ্যাম ফরেস্ট"],
  354: ["Crystal Palace", "ক্রিস্টাল প্যালেস"],
  397: ["Brighton", "ব্রাইটন"],
  402: ["Brentford", "ব্রেন্টফোর্ড"],
  563: ["West Ham", "ওয়েস্ট হ্যাম"],
  1044: ["Bournemouth", "বোর্নমাউথ"],
  1076: ["Coventry", "কভেন্ট্রি সিটি"],

  // ── লা লিগা ──
  77: ["Athletic", "অ্যাথলেটিক ক্লাব"],
  78: ["Atl", "অ্যাটলেটিকো মাদ্রিদ"],
  79: ["Osasuna", "ওসাসুনা"],
  80: ["Espanyol", "এসপানিওল"],
  81: ["Barcelona", "বার্সেলোনা"],
  82: ["Getafe", "হেতাফে"],
  84: ["Málaga", "মালাগা"],
  86: ["Real Madrid", "রিয়াল মাদ্রিদ"],
  87: ["Rayo", "রায়ো ভায়েকানো"],
  88: ["Levante", "লেভান্তে"],
  90: ["Betis", "রিয়াল বেতিস"],
  92: ["Sociedad", "রিয়াল সোসিয়েদাদ"],
  94: ["Villarreal", "ভিয়ারিয়াল"],
  95: ["Valencia", "ভালেন্সিয়া"],
  263: ["Alavés", "আলাভেস"],
  285: ["Elche", "এলচে"],
  558: ["Celta", "সেল্টা ভিগো"],
  559: ["Sevilla", "সেভিয়া"],
  560: ["Deportivo", "দেপোর্তিভো লা করুনিয়া"],
  5335: ["Santander", "রেসিং সান্তান্দের"],

  // ── বুন্দেসলিগা ──
  1: ["Köln", "কোলন"],
  2: ["Hoffenheim", "হফেনহাইম"],
  3: ["Leverkusen", "লেভারকুসেন"],
  4: ["Dortmund", "ডর্টমুন্ড"],
  5: ["Bayern", "বায়ার্ন মিউনিখ"],
  6: ["Schalke", "শালকে"],
  7: ["Hamburg", "হামবুর্গ"],
  10: ["Stuttgart", "স্টুটগার্ট"],
  12: ["Bremen", "ভেরডার ব্রেমেন"],
  15: ["Mainz", "মাইনৎস"],
  16: ["Augsburg", "আউগসবুর্গ"],
  17: ["Freiburg", "ফ্রাইবুর্গ"],
  18: ["Gladbach", "মনশেনগ্লাডবাখ"],
  19: ["Frankfurt", "ফ্রাঙ্কফুর্ট"],
  28: ["Union Berlin", "উনিয়ন বার্লিন"],
  29: ["Paderborn", "পাডারবর্ন"],
  719: ["Elversberg", "এলভার্সবার্গ"],
  721: ["Leipzig", "লাইপজিগ"],

  // ── সিরি আ ──
  98: ["Milan", "এসি মিলান"],
  99: ["Fiorentina", "ফিওরেন্টিনা"],
  100: ["Roma", "রোমা"],
  102: ["Atalanta", "আতালান্তা"],
  103: ["Bologna", "বোলোনিয়া"],
  104: ["Cagliari", "কালিয়ারি"],
  107: ["Genoa", "জেনোয়া"],
  108: ["Inter", "ইন্টার মিলান"],
  109: ["Juventus", "জুভেন্টাস"],
  110: ["Lazio", "লাৎসিও"],
  112: ["Parma", "পারমা"],
  113: ["Napoli", "নাপোলি"],
  115: ["Udinese", "উদিনেসে"],
  454: ["Venezia", "ভেনেৎসিয়া"],
  470: ["Frosinone", "ফ্রোসিনোনে"],
  471: ["Sassuolo", "সাসুয়োলো"],
  586: ["Torino", "তোরিনো"],
  5890: ["Lecce", "লেচে"],
  5911: ["Monza", "মনৎসা"],
  7397: ["Como", "কোমো"],

  // ── লিগ আঁ ──
  511: ["Toulouse", "তুলুজ"],
  512: ["Brest", "ব্রেস্ত"],
  516: ["Marseille", "মার্সেই"],
  519: ["Auxerre", "অক্সের"],
  521: ["Lille", "লিল"],
  522: ["Nice", "নিস"],
  523: ["Lyon", "লিওঁ"],
  524: ["Paris Saint", "পিএসজি"],
  525: ["Lorient", "লরিয়াঁ"],
  529: ["Rennais", "রেনে"],
  531: ["Troyes", "ত্রোয়া"],
  532: ["Angers", "অঁজে"],
  533: ["Havre", "লা আভ্র"],
  535: ["Mans", "লো মাঁ"],
  546: ["Lens", "লঁস"],
  548: ["Monaco", "মোনাকো"],
  576: ["Strasbourg", "স্ত্রাসবুর্গ"],
  1045: ["Paris FC", "প্যারিস এফসি"],

  // ── চ্যাম্পিয়ন্স লিগের অন্যান্য দল ──
  498: ["Sporting", "স্পোর্টিং লিসবন"],
  503: ["Porto", "পোর্তো"],
  610: ["Galatasaray", "গালাতাসারাই"],
  613: ["Fenerbah", "ফেনারবাহচে"],
  674: ["PSV", "পিএসভি"],
  675: ["Feyenoord", "ফেইনুর্ড"],
  678: ["Ajax", "আয়াক্স"],
  851: ["Brugge", "ক্লাব ব্রুগ"],
  930: ["Slavia", "স্লাভিয়া প্রাগ"],
  1887: ["Shakh", "শাখতার দোনেৎস্ক"],
  1899: ["AEK", "এইকে এথেন্স"],
  1903: ["Benfica", "বেনফিকা"],
  2016: ["LASK", "লাস্ক লিনৎস"],
  5720: ["Viking", "ভাইকিং"],
  5721: ["Bod", "বোডো/গ্লিম্ট"],
  7509: ["Slovan", "স্লোভান ব্রাতিস্লাভা"],
  10233: ["Sabah", "সাবাহ"],
};


const FD = "https://api.football-data.org/v4";
export const COMPETITIONS = ["CL", "PL", "PD", "BL1", "SA", "FL1"];

const ymd = (d) => d.toISOString().slice(0, 10);

async function fdGet(path, key) {
  const r = await fetch(FD + path, { headers: { "X-Auth-Token": key } });
  if (!r.ok) throw new Error(`football-data ${path} → ${r.status} ${await r.text().catch(() => "")}`.slice(0, 300));
  return r.json();
}

function bnName(team) {
  const entry = TEAMS_BN[team.id];
  if (!entry) return null;
  const [check, bn] = entry;
  const en = `${team.name || ""} ${team.shortName || ""}`.toLowerCase();
  return en.includes(check.toLowerCase()) ? bn : null;
}

// football-data-এর ম্যাচ তালিকা → teams ও matches সারি
export function transform(fdMatches, fallbackComp) {
  const teams = new Map();
  const matches = [];
  for (const m of fdMatches) {
    const code = m.competition?.code || fallbackComp;
    if (!COMPETITIONS.includes(code)) continue;
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (t && t.id && !teams.has(t.id)) {
        teams.set(t.id, {
          id: t.id,
          name_en: t.name || t.shortName || `Team ${t.id}`,
          short_en: t.shortName || t.name || null,
          tla: t.tla || null,
          name_bn: bnName(t),
          crest: t.crest || null,
          updated_at: new Date().toISOString(),
        });
      }
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

export async function runSync(mode = "full") {
  const key = process.env.FD_KEY;
  if (!key) throw new Error("FD_KEY সেট করা নেই");
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
  const mode = q.mode === "quick" ? "quick" : "full";
  try {
    const result = await runSync(mode);
    await sb("sync_log", { body: { mode, ok: true, detail: JSON.stringify(result) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    await sb("sync_log", { body: { mode, ok: false, detail: String(e.message || e) }, prefer: "return=minimal" }).catch(() => {});
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
}
