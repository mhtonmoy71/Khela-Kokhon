// ═══════════════════════════════════════════════════════════════
//  /api/og?match=ID — ম্যাচের লিংক শেয়ার করলে ফেসবুক/মেসেঞ্জারে যে ছবি দেখায় (১২০০×৬৩০)
//  দুই দলের লোগো, স্কোর বা সময়, প্রতিযোগিতা। বাংলা যুক্তাক্ষর এই ছবি-ইঞ্জিনে ভাঙে, তাই ছবিতে ইংরেজি নাম;
//  শিরোনাম আর বর্ণনা বাংলায় থাকে পাতার meta-তে (/api/page)।
// ═══════════════════════════════════════════════════════════════
import { ImageResponse } from "@vercel/og";

const SITE = "https://khelakokhon.com";
// ছবি-ইঞ্জিনের নিয়ম: একাধিক সন্তান থাকলে div-এ display:flex লাগে, তাই সব div-এ ধরে নেওয়া
const h = (type, props, ...children) => {
  const kids = children.flat().filter((c) => c !== null && c !== undefined && c !== false && c !== "");
  const style = type === "div" ? { display: "flex", ...(props?.style || {}) } : props?.style;
  return { type, props: { ...props, ...(style ? { style } : {}), children: kids.length === 1 ? kids[0] : kids } };
};
let fontCache = null;
async function fonts() {
  if (fontCache) return fontCache;
  const get = (w) => fetch(`https://cdn.jsdelivr.net/npm/@fontsource/inter@5.1.0/files/inter-latin-${w}-normal.woff`).then((r) => r.arrayBuffer());
  const [b, x] = await Promise.all([get(700), get(800)]);
  fontCache = [{ name: "Inter", data: b, weight: 700, style: "normal" }, { name: "Inter", data: x, weight: 800, style: "normal" }];
  return fontCache;
}
async function dataUri(url) {
  if (!url) return null;
  try {
    const r = await fetch(url); if (!r.ok) return null;
    const type = r.headers.get("content-type") || (url.endsWith(".svg") ? "image/svg+xml" : "image/png");
    return `data:${type};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch { return null; }
}
async function getMatch(id) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const T = "name_en,short_en,crest";
  const r = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/matches?select=id,utc_date,status,home_score,away_score,pen_home,pen_away,stage,home:teams!matches_home_fk(${T}),away:teams!matches_away_fk(${T}),competition:competitions(name_en,emblem,code)&id=eq.${id}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  const [m] = await r.json(); return m || null;
}
const BD = 6 * 3600000;
function when(iso) {
  const d = new Date(Date.parse(iso) + BD);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
  return { day, time };
}

export default async function handler(req, res) {
  const id = parseInt((req.query || {}).match, 10);
  try {
    const m = id > 0 ? await getMatch(id) : null;
    const [f, hc, ac, logo] = await Promise.all([fonts(), dataUri(m?.home?.crest), dataUri(m?.away?.crest), dataUri(SITE + "/icon-192x192.png")]);
    const played = m && ["IN_PLAY", "PAUSED", "FINISHED"].includes(m.status) && m.home_score != null;
    const status = !m ? "" : m.status === "FINISHED" ? "FULL TIME" : m.status === "PAUSED" ? "HALF TIME" : m.status === "IN_PLAY" ? "LIVE" : "";
    const w = m ? when(m.utc_date) : null;
    const team = (t, crest) => h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", width: 340 } },
      h("div", { style: { width: 190, height: 190, borderRadius: 95, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" } },
        crest ? h("img", { src: crest, width: 130, height: 130, style: { objectFit: "contain" } }) : h("div", { style: { fontSize: 56, fontWeight: 800, color: "#064e3b" } }, (t?.short_en || "?").slice(0, 3).toUpperCase())),
      h("div", { style: { marginTop: 22, fontSize: 40, fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.1 } }, t?.short_en || t?.name_en || ""));
    const mid = played
      ? h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
          h("div", { style: { fontSize: 120, fontWeight: 800, color: "#fff", letterSpacing: -2 } }, `${m.home_score} - ${m.away_score}`),
          m.pen_home != null ? h("div", { style: { fontSize: 28, color: "#a7f3d0", fontWeight: 700 } }, `Pens ${m.pen_home}-${m.pen_away}`) : null,
          h("div", { style: { marginTop: 8, fontSize: 30, fontWeight: 800, color: status === "LIVE" ? "#fff" : "#a7f3d0", background: status === "LIVE" ? "#e11d48" : "rgba(255,255,255,.12)", padding: "6px 22px", borderRadius: 30 } }, status))
      : h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
          h("div", { style: { fontSize: 30, fontWeight: 700, color: "#a7f3d0" } }, w ? w.day : ""),
          h("div", { style: { fontSize: 92, fontWeight: 800, color: "#fff" } }, w ? w.time : "vs"),
          h("div", { style: { fontSize: 24, fontWeight: 700, color: "rgba(255,255,255,.7)" } }, "Bangladesh time"));
    const el = h("div", { style: { width: 1200, height: 630, display: "flex", flexDirection: "column", background: "linear-gradient(135deg, #0a3d2f 0%, #064e3b 55%, #06201a 100%)", fontFamily: "Inter", padding: "44px 60px" } },
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
        h("div", { style: { display: "flex", alignItems: "center" } },
          logo ? h("img", { src: logo, width: 64, height: 64, style: { borderRadius: 32 } }) : null,
          h("div", { style: { marginLeft: 16, fontSize: 34, fontWeight: 800, color: "#fff" } }, "Khela Kokhon")),
        h("div", { style: { fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,.85)" } }, m?.competition?.name_en || "")),
      m ? h("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" } }, team(m.home, hc), mid, team(m.away, ac))
        : h("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, fontWeight: 800, color: "#fff" } }, "Live football in Bangla"),
      h("div", { style: { display: "flex", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,.75)" } }, "khelakokhon.com"));
    const img = new ImageResponse(el, { width: 1200, height: 630, fonts: f });
    const buf = Buffer.from(await img.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", played && m.status !== "FINISHED" ? "public, s-maxage=60, max-age=60" : "public, s-maxage=3600, max-age=600");
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e).slice(0, 200) });
  }
}
