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

// পাতার কোনো অংশ ভেঙে গেলে পুরো সাইট সাদা না হয়ে একটা বার্তা আর আবার চেষ্টার বোতাম
class Guard extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { report(err?.message || String(err), (err?.stack || "") + "\n" + (info?.componentStack || "").slice(0, 800), "render"); }
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

// ── নতুন সংস্করণ নিজে থেকেই চালু (ব্যবহারকারীকে রিফ্রেশ করতে হয় না) ──
// ১) প্রতি ৫ মিনিটে আর অ্যাপে ফিরলেই নতুন সংস্করণ আছে কিনা দেখা
// ২) নতুনটা তৈরি হলে কাজের মাঝখানে না থামিয়ে সুবিধামতো মুহূর্তে বদলানো:
//    অ্যাপ পেছনে গেলে, অন্য পাতায় গেলে, বা ১ মিনিট কিছু না করলে (লেখার ঘরে বা কুইজে থাকলে নয়)
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const hadController = !!navigator.serviceWorker.controller;
  let ready = false, idleTimer = null;
  const busy = () => {
    const a = document.activeElement;
    if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable)) return true;
    return /^\/(quiz|daily)/.test(location.pathname);
  };
  const reloadNow = () => { if (!ready) return; ready = false; location.reload(); };
  const armIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => (busy() ? armIdle() : reloadNow()), 60000);
  };
  const onReady = () => {
    if (ready || !hadController) return;   // প্রথমবার ইনস্টলে নয়, শুধু হালনাগাদে
    ready = true;
    if (document.hidden) return reloadNow();
    armIdle();
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((e) => addEventListener(e, armIdle, { passive: true }));
  };
  // অ্যাপের ভেতরে অন্য পাতায় গেলে: পুরো পাতাটাই নতুন সংস্করণে খোলা
  const push = history.pushState.bind(history);
  history.pushState = (st, t, url) => {
    if (ready && url && !busy()) { ready = false; location.assign(url); return; }
    return push(st, t, url);
  };
  addEventListener("popstate", () => { if (window.__kkSkipPop || window.history.state?.kkModal) return; if (ready && !busy()) { ready = false; location.reload(); } });
  document.addEventListener("visibilitychange", () => { if (document.hidden) reloadNow(); });

  navigator.serviceWorker.addEventListener("controllerchange", onReady);
  // service worker জানতে চায় এই পাতা নতুন কোডে কিনা (পুরনো কোডের পাতা উত্তর দেয় না, তাই সেগুলো রিলোড হয়)
  navigator.serviceWorker.addEventListener("message", (e) => { if (e.data?.type === "KK_PING") e.source?.postMessage({ type: "KK_PONG" }); });
  addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
      // পুরনো ধরনের service worker অপেক্ষায় বসে থাকলে চালু হতে বলা
      const kick = (w) => w && w.postMessage({ type: "SKIP_WAITING" });
      kick(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) kick(w); });
      });
      const check = () => reg.update().catch(() => {});
      setInterval(check, 5 * 60 * 1000);
      document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
      addEventListener("online", check);
    }).catch(() => {});
  });
}
