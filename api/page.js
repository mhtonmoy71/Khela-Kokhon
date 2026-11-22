// ═══════════════════════════════════════════════════════════════
//  /match/ID খুললে: সাইটের index.html, কিন্তু শিরোনাম, বর্ণনা আর শেয়ারের ছবি সেই ম্যাচের
//  (ফেসবুক, মেসেঞ্জার, হোয়াটসঅ্যাপ লিংকের প্রিভিউ এখান থেকে নেয়; ব্যবহারকারীর কাছে সাইট আগের মতোই)
// ═══════════════════════════════════════════════════════════════
const SITE = "https://khelakokhon.com";
const BN = "০১২৩৪৫৬৭৮৯", bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
let shell = null, shellAt = 0;
async function getShell() {
  if (shell && Date.now() - shellAt < 300000) return shell;
  const r = await fetch(SITE + "/index.html", { headers: { "x-kk-shell": "1" } });
  shell = await r.text(); shellAt = Date.now();
  return shell;
}
async function getMatch(id) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const T = "name_en,short_en,name_bn";
  const r = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/matches?select=id,utc_date,status,home_score,away_score,home:teams!matches_home_fk(${T}),away:teams!matches_away_fk(${T}),competition:competitions(name_bn,name_en)&id=eq.${id}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const [m] = await r.json(); return m || null;
}
async function sbGet(path) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return r.ok ? r.json() : [];
}
const tn = (t) => t?.name_bn || t?.short_en || t?.name_en || "";
const BD = 6 * 3600000;
const DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
function whenBn(iso) {
  const d = new Date(Date.parse(iso) + BD), h = d.getUTCHours(), mi = d.getUTCMinutes();
  const part = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
  return `${DAYS[d.getUTCDay()]}, ${bn(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]} · ${part} ${bn(h % 12 || 12)}:${bn(String(mi).padStart(2, "0"))} (বাংলাদেশ সময়)`;
}
function setMeta(html, { title, desc, image, url }) {
  const rep = (re, val) => { html = html.replace(re, (all, a, b) => a + esc(val) + b); };
  rep(/(<title>)[^<]*(<\/title>)/, title);
  rep(/(<meta name="description" content=")[^"]*(")/, desc);
  rep(/(<meta property="og:title" content=")[^"]*(")/, title);
  rep(/(<meta property="og:description" content=")[^"]*(")/, desc);
  rep(/(<meta property="og:image" content=")[^"]*(")/, image);
  rep(/(<meta property="og:url" content=")[^"]*(")/, url);
  rep(/(<link rel="canonical" href=")[^"]*(")/, url);
  rep(/(<meta name="twitter:title" content=")[^"]*(")/, title);
  rep(/(<meta name="twitter:description" content=")[^"]*(")/, desc);
  rep(/(<meta name="twitter:image" content=")[^"]*(")/, image);
  return html;
}
// ── /sitemap.xml: গুগলকে সব পাতার ঠিকানা জানানো (লিগ, দল, আশেপাশের ম্যাচ, সাধারণ পাতা) ──
async function sitemap(res) {
  const now = Date.now(), day = 86400000, iso = (t) => new Date(t).toISOString();
  const [comps, teams, matches] = await Promise.all([
    sbGet("competitions?select=code"),
    sbGet("teams?select=id&name_bn=not.is.null&limit=5000"),
    sbGet(`matches?select=id,utc_date,status&utc_date=gte.${iso(now - 10 * day)}&utc_date=lte.${iso(now + 21 * day)}&limit=5000`),
  ]);
  const u = (loc, freq, pri) => `<url><loc>${SITE}${loc}</loc><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`;
  const urls = [
    u("/", "always", "1.0"), u("/leagues", "daily", "0.8"), u("/quiz/daily", "daily", "0.6"), u("/predict", "daily", "0.6"), u("/ask", "weekly", "0.5"),
    u("/about", "monthly", "0.4"), u("/how-it-works", "monthly", "0.4"), u("/founder", "monthly", "0.3"), u("/contact", "yearly", "0.3"), u("/privacy", "yearly", "0.2"),
    ...comps.map((c) => u(`/league/${c.code}`, "hourly", "0.9")),
    ...teams.map((t) => u(`/team/${t.id}`, "daily", "0.6")),
    ...matches.map((m) => u(`/match/${m.id}`, m.status === "FINISHED" ? "weekly" : "hourly", "0.7")),
  ];
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, max-age=0");
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
}
// ── /league/CODE আর /team/ID: শিরোনাম, বর্ণনা, শেয়ারের ছবি সেই লিগ বা দলের ──
async function leagueMeta(code) {
  const [c] = await sbGet(`competitions?select=code,name_bn,name_en&code=eq.${encodeURIComponent(code)}`);
  if (!c) return null;
  const n = c.name_bn || c.name_en;
  return { title: `${n}: লাইভ স্কোর, পয়েন্ট টেবিল, ফিক্সচার · খেলা কখন?`,
    desc: `${n}-এর সব ম্যাচ বাংলাদেশ সময়ে, লাইভ স্কোর, রিয়েল টাইম পয়েন্ট টেবিল, গোলদাতা আর অ্যাসিস্টের তালিকা। খেলা কখন?-এ।`,
    image: `${SITE}/api/og?league=${encodeURIComponent(c.code)}`, url: `${SITE}/league/${c.code}` };
}
async function teamMeta(id) {
  const [t] = await sbGet(`teams?select=id,name_bn,name_en,short_en&id=eq.${id}`);
  if (!t) return null;
  const n = t.name_bn || t.short_en || t.name_en;
  return { title: `${n}: পরের ম্যাচ, রেজাল্ট, স্কোয়াড · খেলা কখন?`,
    desc: `${n}-এর পরের ম্যাচ কখন (বাংলাদেশ সময়), সাম্প্রতিক রেজাল্ট, পয়েন্ট টেবিল আর স্কোয়াড। ম্যাচ শুরু আর গোলের নোটিফিকেশন পেতে খেলা কখন?-এ দলটি ফলো করুন।`,
    image: `${SITE}/api/og?team=${t.id}`, url: `${SITE}/team/${t.id}` };
}

export default async function handler(req, res) {
  const q = req.query || {};
  if (q.sitemap) { try { return await sitemap(res); } catch { return res.status(500).send("sitemap error"); } }
  const id = parseInt(q.m, 10);
  let html;
  try { html = await getShell(); } catch { return res.status(302).setHeader("Location", "/").end(); }
  try {
    const m = id > 0 ? await getMatch(id) : null;
    if (m) {
      const played = ["IN_PLAY", "PAUSED", "FINISHED"].includes(m.status) && m.home_score != null;
      const comp = m.competition?.name_bn || m.competition?.name_en || "";
      const title = played ? `${tn(m.home)} ${bn(m.home_score)}–${bn(m.away_score)} ${tn(m.away)} · ${comp}` : `${tn(m.home)} বনাম ${tn(m.away)} · ${comp}`;
      const desc = played
        ? (m.status === "FINISHED" ? "খেলা শেষ। গোল, লাইনআপ, রেটিং আর স্ট্যাটস দেখুন খেলা কখন?-এ।" : "খেলা চলছে। লাইভ স্কোর, কমেন্ট্রি আর স্ট্যাটস দেখুন খেলা কখন?-এ।")
        : `${whenBn(m.utc_date)}। স্কোর প্রেডিক্ট করুন, লাইভ স্কোর দেখুন খেলা কখন?-এ।`;
      const ver = played ? `${m.status}-${m.home_score}-${m.away_score}` : "s";
      html = setMeta(html, { title: title + " · খেলা কখন?", desc, image: `${SITE}/api/og?match=${m.id}&v=${ver}`, url: `${SITE}/match/${m.id}` });
    }
    else if (q.l && /^[A-Za-z0-9]{2,6}$/.test(q.l)) { const mt = await leagueMeta(q.l.toUpperCase()); if (mt) html = setMeta(html, mt); }
    else if (/^\d+$/.test(q.t || "")) { const mt = await teamMeta(+q.t); if (mt) html = setMeta(html, mt); }
  } catch { /* না পেলে সাধারণ পাতা */ }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, max-age=0");
  return res.status(200).send(html);
}
