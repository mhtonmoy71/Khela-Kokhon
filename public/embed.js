/* খেলা কখন? উইজেট বসানোর স্ক্রিপ্ট
   ব্যবহার: <div data-khelakokhon="live" data-leagues="PL,CL" data-theme="light"></div>
           <script src="https://khelakokhon.com/embed.js" async></script> */
(function () {
  var SITE = "https://khelakokhon.com";
  var n = 0;
  function mount(el) {
    if (el.getAttribute("data-kk-ready")) return;
    el.setAttribute("data-kk-ready", "1");
    var id = "kk" + (++n) + Math.random().toString(36).slice(2, 6);
    var p = new URLSearchParams();
    ["leagues", "theme", "lang"].forEach(function (k) { var v = el.getAttribute("data-" + k); if (v) p.set(k, v); });
    p.set("id", id);
    var f = document.createElement("iframe");
    f.src = SITE + "/widget/live.html?" + p.toString();
    f.title = "খেলা কখন? লাইভ স্কোর";
    f.loading = "lazy";
    f.setAttribute("scrolling", "no");
    f.style.cssText = "width:100%;border:0;display:block;height:320px;color-scheme:normal;max-width:" + (el.getAttribute("data-width") || "100%");
    f.setAttribute("data-kk-id", id);
    el.appendChild(f);
  }
  function all() { var els = document.querySelectorAll("[data-khelakokhon]"); for (var i = 0; i < els.length; i++) mount(els[i]); }
  window.addEventListener("message", function (e) {
    if (e.origin !== SITE || !e.data || e.data.kk !== "h") return;
    var f = document.querySelector('iframe[data-kk-id="' + e.data.id + '"]');
    if (f && e.data.h > 0) f.style.height = Math.ceil(e.data.h) + "px";
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", all); else all();
})();
