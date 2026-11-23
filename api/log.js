// ═══════════════════════════════════════════════════════════════
//  /api/log — ইউজারের ব্রাউজারে সাইটের কোনো ভুল (এরর) হলে এখানে আসে (main.jsx পাঠায়)
//  client_errors টেবিলে জমা; নতুন ভুল হলে আর ১০, ১০০ বার হলে অ্যাডমিনের ফোনে নোটিফিকেশন
// ═══════════════════════════════════════════════════════════════
import { createHash } from "crypto";

// ব্রাউজার এক্সটেনশন, নেটওয়ার্ক বা পুরনো সংস্করণের ভুল: আমাদের কোডের সমস্যা না
const NOISE = /^Script error\.?$|ResizeObserver loop|extension:\/\/|Failed to fetch|NetworkError|Load failed|dynamically imported module|Importing a module script failed|AbortError|The operation was aborted|Non-Error promise rejection|cancelled|webkit-masked-url/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    let b = req.body;
    if (typeof b === "string") b = JSON.parse(b || "{}");
    const msg = String(b?.msg || "").slice(0, 500);
    const stack = String(b?.stack || "").slice(0, 2000);
    if (!msg || NOISE.test(msg) || NOISE.test(stack.split("\n").slice(0, 3).join(" "))) return res.status(204).end();
    // ছাপ: বার্তা + প্রথম কোডের জায়গা (ফাইলের হ্যাশ বাদ দিয়ে, যাতে নতুন সংস্করণেও একই ভুল একসাথে গোনে)
    const frame = (stack.split("\n").find((l) => /\/assets\//.test(l)) || b?.src || "").replace(/index-[A-Za-z0-9_-]+\.js/, "index.js").replace(/:\d+:\d+/, "");
    const fp = createHash("sha1").update(msg.replace(/\d+/g, "#") + "|" + frame).digest("hex").slice(0, 16);
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const r = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/log_client_error`, {
      method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p: { fp, msg, src: String(b?.src || "").slice(0, 300), stack, url: String(b?.url || "").slice(0, 300), ua: String(req.headers["user-agent"] || "").slice(0, 300), build: String(b?.build || "").slice(0, 40) } }),
    });
    const n = r.ok ? await r.json() : 0;
    if (n === 1 || n === 10 || n === 100 || n === 1000) {
      const { adminAlert } = await import("./live.js");
      const where = String(b?.url || "").replace(/^https?:\/\/[^/]+/, "") || "/";
      await adminAlert(`err:${fp}:${n}`, n === 1 ? "সাইটে নতুন একটা ভুল ধরা পড়েছে" : `একই ভুল ${n} বার হয়েছে`, `${msg.slice(0, 110)} · ${where}`, "/").catch(() => {});
    }
    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
}
