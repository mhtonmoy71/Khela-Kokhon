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
  rep(/(<meta name="twitter:title" content=")[^"]*(")/, title);
  rep(/(<meta name="twitter:description" content=")[^"]*(")/, desc);
  rep(/(<meta name="twitter:image" content=")[^"]*(")/, image);
  return html;
}
export default async function handler(req, res) {
  const id = parseInt((req.query || {}).m, 10);
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
  } catch { /* না পেলে সাধারণ পাতা */ }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, max-age=0");
  return res.status(200).send(html);
}
