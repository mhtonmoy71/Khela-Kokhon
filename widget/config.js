// উইজেট সাজানোর পাতা: বাছাই বদলালেই প্রিভিউ আর বসানোর কোড বদলায়
const LEAGUES = [["BAN", "বাংলাদেশ দল"], ["CL", "চ্যাম্পিয়নস লিগ"], ["PL", "প্রিমিয়ার লিগ"], ["PD", "লা লিগা"], ["BL1", "বুন্দেসলিগা"], ["SA", "সিরি আ"],
  ["FL1", "লিগ ওয়ান"], ["UEL", "ইউরোপা লিগ"], ["BPL", "বাংলাদেশ ফুটবল লিগ"], ["BFC", "ফেডারেশন কাপ"], ["SPL", "সৌদি প্রো লিগ"], ["MLS", "এমএলএস"]];
const ON = ["BAN", "CL", "PL", "PD", "BL1", "SA", "FL1", "BPL"];
const st = { theme: "light", lang: "bn", width: "100%" };
const lg = document.getElementById("lg");
lg.innerHTML = LEAGUES.map(([c, n]) => `<label><input type="checkbox" value="${c}" ${ON.includes(c) ? "checked" : ""}> ${n}</label>`).join("");
const picked = () => [...lg.querySelectorAll("input:checked")].map((i) => i.value);

for (const k of ["theme", "lang", "width"]) {
  const box = document.getElementById(k);
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    box.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    st[k] = b.dataset.v; update();
  });
}
lg.addEventListener("change", update);

let timer;
function update() {
  const leagues = picked().join(",");
  const attrs = [`data-khelakokhon="live"`, leagues && `data-leagues="${leagues}"`, st.theme !== "light" && `data-theme="${st.theme}"`, st.lang !== "bn" && `data-lang="${st.lang}"`, st.width !== "100%" && `data-width="${st.width}"`].filter(Boolean);
  document.getElementById("code").textContent = `<div ${attrs.join(" ")}></div>\n<script src="https://khelakokhon.com/embed.js" async></script>`;
  document.getElementById("pv-w").textContent = st.width === "100%" ? "পুরো চওড়া" : "সাইডবার (৩৪০px)";
  clearTimeout(timer);
  timer = setTimeout(() => {
    const p = new URLSearchParams({ leagues, theme: st.theme, lang: st.lang, id: "pv" });
    const box = document.getElementById("pv");
    box.style.maxWidth = st.width;
    box.innerHTML = `<iframe title="প্রিভিউ" src="/widget/live.html?${p}" data-kk-id="pv" scrolling="no" style="width:100%;border:0;display:block;height:320px"></iframe>`;
  }, 250);
}
addEventListener("message", (e) => {
  if (e.origin !== location.origin || e.data?.kk !== "h") return;
  const f = document.querySelector(`iframe[data-kk-id="${e.data.id}"]`);
  if (f) f.style.height = Math.ceil(e.data.h) + "px";
});
document.getElementById("copy").addEventListener("click", async (e) => {
  const t = document.getElementById("code").textContent;
  try { await navigator.clipboard.writeText(t); e.target.textContent = "কপি হয়েছে"; }
  catch { const r = document.createRange(); r.selectNodeContents(document.getElementById("code")); getSelection().removeAllRanges(); getSelection().addRange(r); e.target.textContent = "সিলেক্ট করা হয়েছে, Ctrl+C চাপুন"; }
  setTimeout(() => (e.target.textContent = "কোড কপি করুন"), 2000);
});
update();
