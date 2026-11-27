import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

window.__kkBuild = __BUILD__;

// ── সাইটে কোনো ভুল (এরর) হলে নিজে থেকেই জানানো (/api/log → অ্যাডমিনের ফোনে) ──
// একই ভুল একবারই, আর এক পাতায় সর্বোচ্চ ৫টা; ব্রাউজার এক্সটেনশনের ভুল বাদ
const sent = new Set();
function report(msg, stack, src) {
  try {
    if (!import.meta.env.PROD || !msg) return;
    const k = msg + "|" + (src || "");
    if (sent.has(k) || sent.size >= 5) return;
    sent.add(k);
    const body = JSON.stringify({ msg: String(msg).slice(0, 500), stack: String(stack || "").slice(0, 2000), src: src || "", url: location.href, build: window.__kkBuild });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/log", new Blob([body], { type: "application/json" }));
    else fetch("/api/log", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch { /* জানাতে না পারলেও সাইট চলবে */ }
}
window.__kkReport = report;
addEventListener("error", (e) => {
  // শুধু আমাদের নিজের কোডের ভুল (অন্য সাইটের স্ক্রিপ্ট বা ছবি লোড না হওয়া বাদ)
  if (!e.message || (e.filename && !e.filename.startsWith(location.origin))) return;
  report(e.message, e.error?.stack, `${(e.filename || "").replace(location.origin, "")}:${e.lineno}:${e.colno}`);
});
addEventListener("unhandledrejection", (e) => {
  const r = e.reason;
  if (!(r instanceof Error)) return;
  report(r.message, r.stack, "promise");
});

// ── লেখার ঘরে কিবোর্ড খুললে নিচের ন্যাভ লুকানো (সব পাতায়: রেজিস্ট্রেশন, লগইন, প্রোফাইল, সার্চ, লিগ খোঁজা) ──
// নইলে ফোনে ন্যাভ কিবোর্ডের ঠিক ওপরে উঠে লেখার ঘর ঢেকে দেয়। ঘরটাকেও দেখা যায় এমন জায়গায় আনা
const isField = (el) => el && (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable ||
  (el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/i.test(el.type || "text")));
let kbOff = 0;
addEventListener("focusin", (e) => {
  if (!isField(e.target)) return;
  clearTimeout(kbOff);
  document.documentElement.classList.add("kb-open");
  const el = e.target;
  if (!el.closest(".ask-input")) setTimeout(() => { if (document.activeElement === el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 320);
});
addEventListener("focusout", () => {
  clearTimeout(kbOff);
  kbOff = setTimeout(() => { if (!isField(document.activeElement)) document.documentElement.classList.remove("kb-open"); }, 150);
});

// পাতার কোনো অংশ ভেঙে গেলে পুরো সাইট সাদা না হয়ে একটা বার্তা আর আবার চেষ্টার বোতাম
class Guard extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) {
    // পুরোনো সংস্করণের ফাইল না পাওয়া: নতুন সংস্করণে নিজে থেকে ফেরা (২ মিনিটে একবার)
    if (/dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(String(err?.message || err))) {
      const last = +(sessionStorage.getItem("kk_chunk_reload") || 0);
      if (Date.now() - last > 120000) { try { sessionStorage.setItem("kk_chunk_reload", String(Date.now())); } catch { /* ignore */ } location.reload(); return; }
    } report(err?.message || String(err), (err?.stack || "") + "\n" + (info?.componentStack || "").slice(0, 800), "render"); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: "'Hind Siliguri', sans-serif", background: "#064e3b", color: "#fff" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>দুঃখিত, কিছু একটা গোলমাল হয়েছে</div>
          <div style={{ opacity: 0.8, marginBottom: 18 }}>সমস্যাটা আমাদের কাছে নিজে থেকেই পৌঁছে গেছে। আবার চেষ্টা করুন।</div>
          <button onClick={() => location.reload()} style={{ background: "#00e676", color: "#06201a", border: 0, borderRadius: 12, padding: "12px 22px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>আবার চেষ্টা করুন</button>
        </div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Guard>
      <App />
    </Guard>
  </React.StrictMode>
);

// ── নতুন সংস্করণ নিজে থেকেই চালু (ব্যবহারকারীকে কিছু করতে হয় না) ──
// ১) প্রতি ৩ মিনিটে, অ্যাপে ফিরলে আর নেট ফিরলে নতুন সংস্করণ আছে কিনা দেখা
// ২) নতুনটা তৈরি হলে কাজের মাঝখানে না থামিয়ে সুবিধামতো মুহূর্তে বদলানো:
//    অ্যাপ পেছনে গেলে, অন্য পাতা/ট্যাবে গেলে, ২০ সেকেন্ড কিছু না করলে; তবু না হলে ৫ মিনিটের মধ্যে অবশ্যই
//    (লেখার ঘরে বা কুইজ চলার সময় নয়, শেষ হলেই)
// ৩) service worker না থাকলেও (কিছু ইন-অ্যাপ ব্রাউজার) পাতার সংস্করণ মিলিয়ে দেখে রিলোড
if (import.meta.env.PROD) {
  const hasSW = "serviceWorker" in navigator;
  let hadController = hasSW && !!navigator.serviceWorker.controller;
  let ready = false, idleTimer = null, capTimer = null, reg = null;
  const busy = () => {
    const a = document.activeElement;
    if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable)) return true;
    return /^\/(quiz|daily)/.test(location.pathname);
  };
  // নতুন সংস্করণের জন্য রিলোড: পরের পাতায় স্প্ল্যাশের অ্যানিমেশন নয় (index.html-এর "quiet")
  const quiet = () => { try { sessionStorage.setItem("kk_quiet", "1"); } catch { /* না পারলে স্প্ল্যাশ দেখাবে */ } };
  const reloadNow = () => { if (!ready) return; ready = false; quiet(); location.reload(); };
  const armIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => (busy() ? armIdle() : reloadNow()), 20000);
  };
  const markReady = () => {
    if (ready) return;
    ready = true;
    if (document.hidden) return reloadNow();
    armIdle();
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((e) => addEventListener(e, armIdle, { passive: true }));
    // খুব সক্রিয় ইউজারের জন্যও ৫ মিনিটের মধ্যে (লেখা বা কুইজ চলাকালে নয়)
    const cap = () => { capTimer = setTimeout(() => (busy() ? cap() : reloadNow()), capTimer ? 15000 : 5 * 60000); };
    cap();
  };
  const onController = () => {
    if (!hadController) { hadController = true; return; }   // প্রথমবার ইনস্টলে নয়, শুধু হালনাগাদে
    markReady();
  };
  // অ্যাপের ভেতরে অন্য পাতায় গেলে: পুরো পাতাটাই নতুন সংস্করণে খোলা
  const push = history.pushState.bind(history);
  history.pushState = (st, t, url) => {
    if (ready && url && !busy()) { ready = false; quiet(); location.assign(url); return; }
    return push(st, t, url);
  };
  addEventListener("popstate", () => { if (window.__kkSkipPop || window.history.state?.kkModal) return; if (ready && !busy()) { ready = false; quiet(); location.reload(); } });
  document.addEventListener("visibilitychange", () => { if (document.hidden) reloadNow(); });

  // সাইটে এখন যে সংস্করণ আছে তার সাথে এই পাতার মিল (মূল JS ফাইলের নাম ধরে)
  const myMain = () => document.querySelector('script[type="module"][src*="/assets/"]')?.getAttribute("src") || "";
  let checking = false;
  const versionCheck = async () => {
    if (checking || ready || !navigator.onLine) return;
    checking = true;
    try {
      const html = await fetch("/index.html?kkv=" + Date.now(), { cache: "no-store" }).then((r) => (r.ok ? r.text() : ""));
      const live = (html.match(/<script type="module"[^>]*src="([^"]*\/assets\/[^"]+)"/) || [])[1];
      const mine = myMain();
      if (live && mine && live !== mine) {
        // service worker থাকলে তাকে নতুনটা আনতে বলা (রিলোড সে চালু হলে); না থাকলে সরাসরি
        if (hasSW && navigator.serviceWorker.controller && reg) reg.update().catch(() => {});
        else markReady();
      }
    } catch { /* পরের বার */ }
    checking = false;
  };
  setInterval(versionCheck, 3 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) versionCheck(); });
  addEventListener("online", versionCheck);

  if (hasSW) {
    navigator.serviceWorker.addEventListener("controllerchange", onController);
    // service worker জানতে চায় এই পাতা নতুন কোডে কিনা (পুরনো কোডের পাতা উত্তর দেয় না, তাই সেগুলো রিলোড হয়)
    navigator.serviceWorker.addEventListener("message", (e) => { if (e.data?.type === "KK_PING") e.source?.postMessage({ type: "KK_PONG" }); });
    addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((r) => {
        reg = r;
        // পুরনো ধরনের service worker অপেক্ষায় বসে থাকলে চালু হতে বলা
        const kick = (w) => w && w.postMessage({ type: "SKIP_WAITING" });
        kick(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) kick(w); });
        });
        const check = () => reg.update().catch(() => {});
        setInterval(check, 3 * 60 * 1000);
        document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
        addEventListener("online", check);
      }).catch(() => {});
    });
  }
}
