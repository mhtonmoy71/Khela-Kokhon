// ═══════════════════════════════════════════════════════════════
//  /api/extra — দরকার পড়লে football-data.org থেকে আনে, তারপর Supabase-এ জমিয়ে রাখে
//    ?type=team&id=86        → দলের খেলোয়াড় তালিকা, কোচ, মাঠ (৭ দিন জমা থাকে)
//    ?type=h2h&match=123456  → দুই দলের আগের মুখোমুখি লড়াই (৩ দিন জমা থাকে)
//    ?type=crest&u=<লিংক>    → দলের লোগো নিজের ঠিকানা দিয়ে (শেয়ার-কার্ডের ছবির জন্য)
//  একই জিনিস বারবার চাইলে football-data-এ আর যায় না, তাই ফ্রি সীমার মধ্যে থাকে।
// ═══════════════════════════════════════════════════════════════
const FD = "https://api.football-data.org/v4";
const DAY = 86400000;

async function sb(path, { method = "GET", body, prefer } = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.status === 204 || method !== "GET" ? null : r.json();
}

const trimTeam = (d) => ({
  id: d.id, name: d.name, venue: d.venue || null, founded: d.founded || null, clubColors: d.clubColors || null, website: d.website || null,
  coach: d.coach?.name ? { name: d.coach.name, nationality: d.coach.nationality || null } : null,
  squad: (d.squad || []).map((p) => ({ id: p.id, name: p.name, position: p.position || null, dateOfBirth: p.dateOfBirth || null, nationality: p.nationality || null })),
});

const side = (t) => (t ? { id: t.id, name: t.name, shortName: t.shortName || null, crest: t.crest || null } : null);
const trimH2H = (d) => ({
  aggregates: d.aggregates ? {
    numberOfMatches: d.aggregates.numberOfMatches, totalGoals: d.aggregates.totalGoals,
    homeTeam: d.aggregates.homeTeam && { id: d.aggregates.homeTeam.id, wins: d.aggregates.homeTeam.wins, draws: d.aggregates.homeTeam.draws, losses: d.aggregates.homeTeam.losses },
    awayTeam: d.aggregates.awayTeam && { id: d.aggregates.awayTeam.id, wins: d.aggregates.awayTeam.wins, draws: d.aggregates.awayTeam.draws, losses: d.aggregates.awayTeam.losses },
  } : null,
  matches: (d.matches || []).map((m) => ({
    id: m.id, utcDate: m.utcDate, status: m.status,
    competition: m.competition ? { code: m.competition.code, name: m.competition.name } : null,
    homeTeam: side(m.homeTeam), awayTeam: side(m.awayTeam),
    score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
  })),
});

async function crest(req, res) {
  let url;
  try { url = new URL(String(req.query.u || "")); } catch { return res.status(400).send("bad url"); }
  if (url.protocol !== "https:" || url.hostname !== "crests.football-data.org") return res.status(400).send("not allowed");
  const r = await fetch(url.toString()).catch(() => null);
  if (!r || !r.ok) return res.status(404).send("not found");
  const type = r.headers.get("content-type") || (url.pathname.endsWith(".svg") ? "image/svg+xml" : "image/png");
  if (!/^image\//.test(type)) return res.status(400).send("not an image");
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", "public, max-age=604800, s-maxage=2592000");
  return res.status(200).send(Buffer.from(await r.arrayBuffer()));
}

export default async function handler(req, res) {
  const q = req.query || {};
  if (q.type === "crest") return crest(req, res);

  let cacheKey, fdPath, maxAge, trim, check;
  if (q.type === "team" && /^\d{1,7}$/.test(q.id || "")) {
    cacheKey = `team:${q.id}`; fdPath = `/teams/${q.id}`; maxAge = 7 * DAY; trim = trimTeam; check = `teams?id=eq.${q.id}&select=id`;
  } else if (q.type === "h2h" && /^\d{1,9}$/.test(q.match || "")) {
    cacheKey = `h2h:${q.match}`; fdPath = `/matches/${q.match}/head2head?limit=10`; maxAge = 3 * DAY; trim = trimH2H; check = `matches?id=eq.${q.match}&select=id`;
  } else {
    return res.status(400).json({ ok: false, error: "bad request" });
  }

  try {
    const [cached] = await sb(`api_cache?key=eq.${encodeURIComponent(cacheKey)}&select=data,updated_at`);
    if (cached && Date.now() - new Date(cached.updated_at).getTime() < maxAge) {
      res.setHeader("Cache-Control", "public, s-maxage=3600");
      return res.status(200).json({ ok: true, data: cached.data });
    }
    // শুধু সাইটের ডাটাবেসে থাকা দল বা ম্যাচের জন্যই football-data-তে যাবে
    const exists = await sb(check);
    if (!exists.length) return res.status(404).json({ ok: false, error: "not found" });

    const r = await fetch(FD + fdPath, { headers: { "X-Auth-Token": process.env.FD_KEY } });
    if (!r.ok) {
      if (cached) return res.status(200).json({ ok: true, data: cached.data, stale: true });
      return res.status(r.status === 429 ? 503 : 502).json({ ok: false, error: `source ${r.status}` });
    }
    const data = trim(await r.json());
    await sb("api_cache?on_conflict=key", { method: "POST", body: { key: cacheKey, data, updated_at: new Date().toISOString() }, prefer: "resolution=merge-duplicates,return=minimal" });
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 120) });
  }
}
