import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

window.__kkBuild = __BUILD__;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
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
  addEventListener("popstate", () => { if (ready && !busy()) { ready = false; location.reload(); } });
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
