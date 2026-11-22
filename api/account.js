// ═══════════════════════════════════════════════════════════════
//  POST /api/account  (Authorization: Bearer <ব্যবহারকারীর লগিন টোকেন>)
//  ব্যবহারকারী নিজের অ্যাকাউন্ট আর সব তথ্য মুছে ফেলেন (প্লে স্টোরের শর্ত)
//  টোকেন দিয়ে কে, সেটা Supabase থেকে যাচাই; তারপর সব টেবিল থেকে তাঁর সারি, শেষে লগিন নিজেই
// ═══════════════════════════════════════════════════════════════
const base = () => process.env.SUPABASE_URL.replace(/\/$/, "");
const svc = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
async function del(path) {
  const r = await fetch(`${base()}/rest/v1/${path}`, { method: "DELETE", headers: { apikey: svc(), Authorization: `Bearer ${svc()}`, Prefer: "return=minimal" } });
  return r.ok || r.status === 404 || r.status === 400; // টেবিল/কলাম না থাকলে চুপচাপ এগোনো
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ ok: false, error: "login" });
  try {
    const me = await fetch(`${base()}/auth/v1/user`, { headers: { apikey: svc(), Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : null));
    const uid = me?.id;
    if (!uid) return res.status(401).json({ ok: false, error: "login" });
    const u = `eq.${uid}`;
    // ব্যবহারকারীর সব তথ্য (ক্রম: যেগুলো অন্যটার ওপর নির্ভর করে আগে)
    for (const path of [
      `quiz_answers?user_id=${u}`, `quiz_players?user_id=${u}`, `quiz_rooms?host=${u}`,
      `daily_answers?user_id=${u}`, `daily_plays?user_id=${u}`, `user_badges?user_id=${u}`,
      `match_votes?user_id=${u}`, `push_follow?user_id=${u}`, `push_subs?user_id=${u}`,
      `predictions?user_id=${u}`, `user_teams?user_id=${u}`, `pleague_members?user_id=${u}`,
      `pleagues?owner=${u}`, `pleagues?owner_id=${u}`, `pleagues?created_by=${u}`,
      `profiles?id=${u}`,
    ]) await del(path).catch(() => {});
    // শেষে লগিন অ্যাকাউন্ট
    const r = await fetch(`${base()}/auth/v1/admin/users/${uid}`, { method: "DELETE", headers: { apikey: svc(), Authorization: `Bearer ${svc()}` } });
    if (!r.ok) return res.status(500).json({ ok: false, error: `auth ${r.status}: ${(await r.text()).slice(0, 160)}` });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
