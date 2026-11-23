// ═══════════════════════════════════════════════════════════════
//  /api/admin — শুধু অ্যাডমিনের (প্রতিষ্ঠাতার) জন্য: সাইটের অবস্থা এক নজরে (/admin পাতা)
//  GET: ব্যবহারকারী, নোটিফিকেশন, প্রেডিকশন, লাইভ আপডেট, API-Football-এর মেয়াদ, ধরা পড়া ভুল
//  POST {fix: fp}: একটা ভুল "ঠিক হয়েছে" (তালিকা থেকে মুছে ফেলা)
//  লগিন টোকেন দিয়ে যাচাই; ADMIN_UIDS-এ না থাকলে ৪০৩
// ═══════════════════════════════════════════════════════════════
const ADMIN_UIDS = (process.env.ADMIN_UIDS || "b9593729-5ea4-44f4-9083-7cf4d19721ee").split(",").map((x) => x.trim()).filter(Boolean);
const base = () => process.env.SUPABASE_URL.replace(/\/$/, "");
const H = () => ({ apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` });
const get = (p) => fetch(`${base()}/rest/v1/${p}`, { headers: H() }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
// সারির সংখ্যা (পুরো তালিকা না এনে)
const count = (p) => fetch(`${base()}/rest/v1/${p}`, { headers: { ...H(), Prefer: "count=exact", Range: "0-0" } })
  .then((r) => parseInt((r.headers.get("content-range") || "").split("/")[1], 10) || 0).catch(() => null);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ ok: false, error: "login" });
  const me = await fetch(`${base()}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!me?.id) return res.status(401).json({ ok: false, error: "login" });
  if (!ADMIN_UIDS.includes(me.id)) return res.status(403).json({ ok: false, error: "forbidden" });
  try {
    if (req.method === "POST") {
      let b = req.body; if (typeof b === "string") b = JSON.parse(b || "{}");
      if (b?.fix) await fetch(`${base()}/rest/v1/client_errors?fp=eq.${encodeURIComponent(String(b.fix).slice(0, 40))}`, { method: "DELETE", headers: { ...H(), Prefer: "return=minimal" } });
      if (b?.fixAll) await fetch(`${base()}/rest/v1/client_errors?fp=neq.__`, { method: "DELETE", headers: { ...H(), Prefer: "return=minimal" } });
      return res.status(200).json({ ok: true });
    }
    const now = Date.now(), day = new Date(now - 86400000).toISOString(), week = new Date(now - 7 * 86400000).toISOString();
    const [users, users7, subs, pred24, predAll, leagues, errors, lastLive, lastErr, liveNow] = await Promise.all([
      count("profiles?select=id"), count(`profiles?select=id&created_at=gte.${week}`), get("push_subs?select=user_id"),
      count(`predictions?select=user_id&created_at=gte.${day}`), count("predictions?select=user_id"), count("pleagues?select=id"),
      get("client_errors?select=fp,msg,src,url,ua,build,count,first_seen,last_seen&order=last_seen.desc&limit=40"),
      get("sync_log?select=ok,detail,created_at&mode=eq.live&order=created_at.desc&limit=1"),
      get("sync_log?select=detail,created_at&mode=eq.live&ok=eq.false&order=created_at.desc&limit=1"),
      count("matches?select=id&status=in.(IN_PLAY,PAUSED)"),
    ]);
    let af = null;
    try {
      const r = await fetch("https://v3.football.api-sports.io/status", { headers: { "x-apisports-key": process.env.APIF_KEY } }).then((x) => x.json());
      const st = r?.response;
      if (st) af = { plan: st.subscription?.plan, active: st.subscription?.active, end: st.subscription?.end, days: st.subscription?.end ? Math.ceil((Date.parse(st.subscription.end) - now) / 86400000) : null, used: st.requests?.current, limit: st.requests?.limit_day };
    } catch { /* দেখানো যাবে না */ }
    return res.status(200).json({
      ok: true,
      users, users7, pushUsers: new Set(subs.map((x) => x.user_id)).size, pushDevices: subs.length,
      pred24, predAll, leagues, liveNow, af,
      live: lastLive[0] ? { ok: lastLive[0].ok, at: lastLive[0].created_at } : null,
      lastLiveError: lastErr[0] || null,
      errors,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
