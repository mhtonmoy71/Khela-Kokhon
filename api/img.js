// ═══════════════════════════════════════════════════════════════
//  /api/img?u=<লোগো/ছবির ঠিকানা>&w=64 — দলের লোগো, লিগের লোগো আর প্লেয়ারের ছবি ছোট করে
//  নিজেদের ডোমেইন থেকে দেওয়া। একবার বানালে Vercel-এর CDN-এ এক বছর জমা থাকে, তাই
//  তালিকা খুললেই লোগো সাথে সাথে আসে (৪০০px-এর বড় ছবির বদলে দরকারি মাপের ছোট ছবি)।
//  শুধু চেনা কয়েকটা সাইটের ছবি (খোলা প্রক্সি নয়); কিছু ভুল হলে আসল ঠিকানায় পাঠিয়ে দেয়।
// ═══════════════════════════════════════════════════════════════
import { ImageResponse } from "@vercel/og";

const HOSTS = ["crests.football-data.org", "media.api-sports.io", "media-4.api-sports.io", "media-3.api-sports.io", "media-2.api-sports.io", "media-1.api-sports.io"];
const SIZES = [32, 48, 64, 96, 128, 192, 256];

export default async function handler(req, res) {
  const q = req.query || {};
  let u;
  try { u = new URL(String(q.u || "")); } catch { return res.status(400).end(); }
  if (u.protocol !== "https:" || !HOSTS.includes(u.hostname)) return res.status(400).end();
  const w = SIZES.find((s) => s >= (parseInt(q.w, 10) || 64)) || 256;
  try {
    const r = await fetch(u.href);
    if (!r.ok) throw new Error("source " + r.status);
    const type = (r.headers.get("content-type") || "").split(";")[0] || (u.pathname.endsWith(".svg") ? "image/svg+xml" : "image/png");
    if (!/^image\//.test(type)) throw new Error("not image");
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 3 * 1024 * 1024) throw new Error("too big");
    const src = `data:${type};base64,${buf.toString("base64")}`;
    const el = { type: "div", props: { style: { width: w, height: w, display: "flex", alignItems: "center", justifyContent: "center" },
      children: { type: "img", props: { src, width: w, height: w, style: { objectFit: "contain" } } } } };
    const out = Buffer.from(await new ImageResponse(el, { width: w, height: w }).arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=2592000, s-maxage=31536000, immutable");
    return res.status(200).send(out);
  } catch {
    // ছোট করা না গেলে আসল ছবিই
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
    return res.redirect(302, u.href);
  }
}
