// ═══════════════════════════════════════════════════════════════
//  /api/admin — শুধু অ্যাডমিনের (প্রতিষ্ঠাতার) জন্য: সাইটের অবস্থা এক নজরে (/admin পাতা)
//  GET: ব্যবহারকারী, নোটিফিকেশন, প্রেডিকশন, লাইভ আপডেট, API-Football-এর মেয়াদ, ধরা পড়া ভুল
//  POST {fix: fp} / {fixAll}: ভুল "ঠিক হয়েছে" (তালিকা থেকে মুছে ফেলা)
//  POST {broadcast: {title, body, url}}: নোটিফিকেশন চালু থাকা সবাইকে ঘোষণা
//  POST {run: "..."}: এখনই আপডেট (লিগ, টেবিল, গোলদাতা, বাংলাদেশ, রিমাইন্ডার) — নিজেদের ক্রন পথই CRON_SECRET দিয়ে ডাকা
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
      if (b?.broadcast) {
        const title = String(b.broadcast.title || "").trim().slice(0, 80), body = String(b.broadcast.body || "").trim().slice(0, 200);
        let url = String(b.broadcast.url || "/").trim(); if (!url.startsWith("/")) url = "/";
        if (!title) return res.status(400).json({ ok: false, error: "শিরোনাম দিন" });
        const subs = await get("push_subs?select=user_id");
        const users = [...new Set(subs.map((x) => x.user_id))];
        const only = b.broadcast.test ? [me.id] : users;
        const stamp = Date.now().toString(36);
        const { pushToUsers } = await import("./live.js");
        const sent = await pushToUsers(only.map((u) => ({ uid: u, mid: 0, ev: `bc:${stamp}:${u}`, kind: "news", title, body, url, tag: "bc" + stamp })));
        return res.status(200).json({ ok: true, users: only.length, sent });
      }
      if (b?.run) {
        const RUNS = { "fd-quick": "/api/sync?mode=quick", "fd-full": "/api/sync", "fd-tables": "/api/sync?mode=tables", "fd-scorers": "/api/sync?mode=scorers",
          "af-all": "/api/live?mode=leagues", "af-tables": "/api/live?mode=tables", remind: "/api/live?mode=remind" };
        const r = String(b.run);
        const path = RUNS[r] || (/^af:[A-Z0-9]{2,5}$/.test(r) ? `/api/live?mode=leagues&only=${r.slice(3)}` : null);
        if (!path) return res.status(400).json({ ok: false, error: "unknown" });
        const host = req.headers["x-forwarded-host"] || req.headers.host || "khelakokhon.com";
        const out = await fetch(`https://${host}${path}`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }).then((x) => x.json()).catch((e) => ({ ok: false, error: String(e.message || e) }));
        return res.status(200).json({ ok: out?.ok !== false, result: out });
      }
      return res.status(200).json({ ok: true });
    }
    const now = Date.now(), day = new Date(now - 86400000).toISOString(), week = new Date(now - 7 * 86400000).toISOString();
    // লগিন অ্যাকাউন্ট (Supabase auth): মোট আর কবে খোলা
    const authUsers = async () => {
      const all = [];
      for (let page = 1; page <= 20; page++) {
        const r = await fetch(`${base()}/auth/v1/admin/users?page=${page}&per_page=1000`, { headers: H() }).then((x) => (x.ok ? x.json() : null)).catch(() => null);
        const list = r?.users || [];
        all.push(...list);
        if (list.length < 1000) break;
      }
      return all;
    };
    const [au, subs, pred24, predAll, leagues, errors, lastLive, lastErr, liveNow, pred7] = await Promise.all([
      authUsers(), get("push_subs?select=user_id"),
      count(`predictions?select=user_id&created_at=gte.${day}`), count("predictions?select=user_id"), count("pleagues?select=id"),
      get("client_errors?select=fp,msg,src,url,ua,build,count,first_seen,last_seen&order=last_seen.desc&limit=40"),
      get("match_live?select=updated_at&order=updated_at.desc&limit=1"),
      get("sync_log?select=*&mode=eq.live&ok=eq.false&order=id.desc&limit=1"),
      count("matches?select=id&status=in.(IN_PLAY,PAUSED)"),
      get(`predictions?select=created_at&created_at=gte.${week}&limit=20000`),
    ]);
    // গত ৭ দিন, দিন ধরে (বাংলাদেশ সময়): নতুন অ্যাকাউন্ট আর প্রেডিকশন
    const bdDay = (t) => new Date(Date.parse(t) + 6 * 3600000).toISOString().slice(0, 10);
    const days = [...Array(7)].map((_, i) => bdDay(new Date(now - (6 - i) * 86400000).toISOString()));
    const daily = days.map((d) => ({ d, users: au.filter((u) => bdDay(u.created_at) === d).length, preds: pred7.filter((p) => p.created_at && bdDay(p.created_at) === d).length }));
    // নতুন ইউজার (নাম প্রোফাইল থেকে)
    const recent = [...au].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 15);
    const profs = recent.length ? await get(`profiles?select=id,display_name&id=in.(${recent.map((u) => u.id).join(",")})`) : [];
    const pushSet = new Set(subs.map((x) => x.user_id));
    const recentUsers = recent.map((u) => ({ name: profs.find((p) => p.id === u.id)?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || "নাম নেই",
      at: u.created_at, last: u.last_sign_in_at, via: u.app_metadata?.provider || "email", push: pushSet.has(u.id) }));
    let af = null;
    try {
      const r = await fetch("https://v3.football.api-sports.io/status", { headers: { "x-apisports-key": process.env.APIF_KEY } }).then((x) => x.json());
      const st = r?.response;
      if (st) af = { plan: st.subscription?.plan, active: st.subscription?.active, end: st.subscription?.end, days: st.subscription?.end ? Math.ceil((Date.parse(st.subscription.end) - now) / 86400000) : null, used: st.requests?.current, limit: st.requests?.limit_day };
    } catch { /* দেখানো যাবে না */ }
    return res.status(200).json({
      ok: true,
      users: au.length, users7: au.filter((u) => Date.parse(u.created_at) >= Date.parse(week)).length, users24: au.filter((u) => Date.parse(u.created_at) >= Date.parse(day)).length,
      active7: au.filter((u) => u.last_sign_in_at && Date.parse(u.last_sign_in_at) >= Date.parse(week)).length,
      pushUsers: new Set(subs.map((x) => x.user_id)).size, pushDevices: subs.length,
      pred24, predAll, leagues, liveNow, af,
      // লাইভ আপডেট: শেষ কখন কোনো ম্যাচের বিস্তারিত হালনাগাদ হয়েছে
      live: lastLive[0] ? { at: lastLive[0].updated_at } : null,
      lastLiveError: lastErr[0] || null,
      errors, daily, recentUsers,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
