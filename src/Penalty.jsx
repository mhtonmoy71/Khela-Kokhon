// ════════════════ পেনাল্টি: ছোট খেলা ════════════════
// গোলপোস্টে নিশানা চাপুন → নিশানার কাঁটা মাঝখানে থামান → শট। ৫ শটের রাউন্ড।
// গোলরক্ষক কখনো আন্দাজে, কখনো শট পড়ে ঝাঁপ দেয়; রাউন্ড যত এগোয়, কাঁটা তত দ্রুত।
import { useEffect, useRef, useState } from "react";

const G = { x0: 40, x1: 320, y0: 40, y1: 170 };      // গোলের ভেতরের সীমা (SVG একক)
const BALL0 = { x: 180, y: 268 };
const ZONES = [[88, 82], [180, 72], [272, 82], [88, 146], [180, 150], [272, 146]]; // গোলরক্ষকের ঝাঁপের জায়গা
const KICKS = 5;
const D = "০১২৩৪৫৬৭৮৯";
const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } } };

export default function Penalty({ lang = "bn", head = null }) {
  const bn = lang === "bn";
  const n = (x) => (bn ? String(x).replace(/\d/g, (d) => D[d]) : String(x));
  const svgRef = useRef(null);
  const [phase, setPhase] = useState("aim");          // aim → power → flying → result → (আবার aim) … done
  const [aim, setAim] = useState(null);
  const [shots, setShots] = useState([]);              // প্রতিটা শটের ফল: goal | save | miss | post
  const [ball, setBall] = useState({ ...BALL0, s: 1 });
  const [keeper, setKeeper] = useState({ x: 180, y: 128, r: 0 });
  const [msg, setMsg] = useState(null);
  const [needle, setNeedle] = useState(0);
  const needleRef = useRef(0);
  const [best, setBest] = useState(() => store.get("pen_best", 0));
  const [total, setTotal] = useState(() => store.get("pen_total", 0));
  const done = shots.length >= KICKS;
  const goals = shots.filter((s) => s === "goal").length;

  // নিশানার কাঁটা: -১ থেকে ১-এর মধ্যে দোলে; প্রতি শটে একটু দ্রুত
  useEffect(() => {
    if (phase !== "power") return;
    let raf, t0 = performance.now();
    const speed = 0.0026 + shots.length * 0.0007;
    const loop = (t) => { const v = Math.sin((t - t0) * speed); needleRef.current = v; setNeedle(v); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, shots.length]);

  const toSvg = (e) => {
    const svg = svgRef.current; if (!svg) return null;
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };
  const pickAim = (e) => {
    if (phase !== "aim" || done) return;
    const p = toSvg(e); if (!p) return;
    if (p.x < G.x0 - 6 || p.x > G.x1 + 6 || p.y < G.y0 - 6 || p.y > G.y1) return;
    setAim({ x: Math.min(G.x1 - 4, Math.max(G.x0 + 4, p.x)), y: Math.min(G.y1 - 6, Math.max(G.y0 + 4, p.y)) });
    setPhase("power");
  };

  const shoot = () => {
    if (phase !== "power" || !aim) return;
    const err = Math.abs(needleRef.current);                 // ০ = নিখুঁত
    const ang = Math.random() * Math.PI * 2, miss = err * err * 70;
    const fx = aim.x + Math.cos(ang) * miss, fy = Math.min(G.y1 - 4, aim.y + Math.sin(ang) * miss);
    // গোলরক্ষক: কখনো শট পড়ে নেয়, বাকি সময় আন্দাজ
    const read = Math.random() < 0.28 + shots.length * 0.03;
    const near = ZONES.reduce((b, z, i) => (Math.hypot(z[0] - fx, z[1] - fy) < Math.hypot(ZONES[b][0] - fx, ZONES[b][1] - fy) ? i : b), 0);
    const zi = read ? near : Math.floor(Math.random() * ZONES.length);
    const [kx, ky] = ZONES[zi];
    const reach = zi === 1 || zi === 4 ? 44 : 50;
    let res;
    const outX = fx < G.x0 || fx > G.x1, outY = fy < G.y0;
    if ((outX && Math.abs(fx - (fx < 180 ? G.x0 : G.x1)) < 7 && !outY) || (outY && Math.abs(fy - G.y0) < 6 && !outX)) res = "post";
    else if (outX || outY) res = "miss";
    else if (Math.hypot(kx - fx, ky - fy) < reach) res = "save";
    else res = "goal";
    const endX = res === "post" ? fx + (fx < 180 ? 18 : -18) : fx, endY = res === "post" ? fy + 30 : fy;
    setPhase("flying");
    setBall({ x: endX, y: endY, s: 0.52 });
    setKeeper({ x: kx, y: ky + (ky < 110 ? -6 : 10), r: kx < 180 ? -58 : kx > 180 ? 58 : 0 });
    setTimeout(() => {
      setMsg(res);
      setPhase("result");
      if (res === "goal") { try { navigator.vibrate?.(40); } catch { /* */ } }
      setShots((s) => {
        const next = [...s, res];
        if (next.length >= KICKS) {
          const g = next.filter((x) => x === "goal").length;
          const b = Math.max(store.get("pen_best", 0), g); store.set("pen_best", b); setBest(b);
          const t = store.get("pen_total", 0) + g; store.set("pen_total", t); setTotal(t);
        }
        return next;
      });
    }, 620);
  };

  const nextKick = () => {
    setMsg(null); setAim(null);
    setBall({ ...BALL0, s: 1 }); setKeeper({ x: 180, y: 128, r: 0 });
    setPhase("aim");
  };
  const again = () => { setShots([]); nextKick(); };

  // ফলাফলের পর নিজে থেকে পরের শট
  useEffect(() => {
    if (phase !== "result" || done) return;
    const t = setTimeout(nextKick, 1100);
    return () => clearTimeout(t);
  }, [phase, done]);

  const MSG = { goal: bn ? "গোল!" : "GOAL!", save: bn ? "সেভ!" : "SAVED!", miss: bn ? "বাইরে" : "WIDE", post: bn ? "পোস্টে লেগে ফিরল" : "OFF THE POST" };
  const verdict = goals === 5 ? (bn ? "নিখুঁত! পাঁচে পাঁচ" : "Perfect! 5 out of 5") : goals >= 4 ? (bn ? "দারুণ শুটার" : "Great shooting") : goals >= 3 ? (bn ? "মন্দ না" : "Not bad") : (bn ? "গোলরক্ষক আজ দেয়াল" : "The keeper was a wall");
  const hint = phase === "aim" ? (bn ? "গোলপোস্টের যেখানে মারতে চান, সেখানে চাপুন" : "Tap where you want to shoot")
    : phase === "power" ? (bn ? "কাঁটা মাঝখানে এলে চাপুন" : "Tap when the needle is in the middle") : "";

  return (
    <div className="sec">
      {head}
      <div className="card pen">
        <div className="pen-top">
          <div className="pen-dots" aria-label={bn ? "শটের ফল" : "Shots"}>
            {Array.from({ length: KICKS }, (_, i) => <i key={i} className={shots[i] === "goal" ? "g" : shots[i] ? "x" : i === shots.length && !done ? "now" : ""} />)}
          </div>
          <div className="pen-score"><b>{n(goals)}</b><span>/{n(KICKS)}</span></div>
        </div>
        <svg ref={svgRef} className={"pen-field" + (phase === "aim" ? " aiming" : "")} viewBox="0 0 360 300" onPointerDown={pickAim} role="img" aria-label={bn ? "পেনাল্টি" : "Penalty"}>
          <defs>
            <linearGradient id="penGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f8a4c" /><stop offset="1" stopColor="#13683a" /></linearGradient>
            <pattern id="penNet" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0L12 12M12 0L0 12" stroke="rgba(255,255,255,.22)" strokeWidth="1" /></pattern>
          </defs>
          <rect width="360" height="300" fill="url(#penGrass)" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="0" y={170 + i * 34} width="360" height="17" fill="rgba(255,255,255,.04)" />)}
          <rect x={G.x0} y={G.y0} width={G.x1 - G.x0} height={G.y1 - G.y0} fill="url(#penNet)" />
          <path d={`M${G.x0} ${G.y1}V${G.y0}H${G.x1}V${G.y1}`} fill="none" stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
          <path d="M0 170H360" stroke="rgba(255,255,255,.7)" strokeWidth="2" />
          <path d="M90 170L60 214H300L270 170" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="2" />
          <circle cx="180" cy="268" r="3" fill="rgba(255,255,255,.8)" />
          {/* গোলরক্ষক */}
          <g style={{ transform: `translate(${keeper.x}px, ${keeper.y}px) rotate(${keeper.r}deg)`, transition: phase === "flying" ? "transform .42s cubic-bezier(.2,.8,.3,1) .06s" : "transform .3s ease" }}>
            <rect x="-15" y="-22" width="30" height="40" rx="9" fill="#f59e0b" />
            <rect x="-13" y="16" width="10" height="24" rx="4" fill="#1f2937" /><rect x="3" y="16" width="10" height="24" rx="4" fill="#1f2937" />
            <rect x="-38" y="-20" width="25" height="9" rx="4.5" fill="#f59e0b" /><rect x="13" y="-20" width="25" height="9" rx="4.5" fill="#f59e0b" />
            <circle cx="-41" cy="-15.5" r="6.5" fill="#00e676" /><circle cx="41" cy="-15.5" r="6.5" fill="#00e676" />
            <circle cx="0" cy="-33" r="10" fill="#c68a5e" />
          </g>
          {aim && phase === "power" && <g className="pen-aim"><circle cx={aim.x} cy={aim.y} r="14" /><path d={`M${aim.x - 20} ${aim.y}H${aim.x + 20}M${aim.x} ${aim.y - 20}V${aim.y + 20}`} /></g>}
          {/* বল */}
          <g style={{ transform: `translate(${ball.x}px, ${ball.y}px) scale(${ball.s})`, transition: phase === "flying" ? "transform .55s cubic-bezier(.25,.7,.35,1)" : "none" }}>
            <ellipse cx="0" cy="16" rx="12" ry="3" fill="rgba(0,0,0,.25)" />
            <circle r="13" fill="#fff" stroke="#111" strokeWidth="1.5" />
            <path d="M0-6l5.7 4.1-2.2 6.7h-7l-2.2-6.7z" fill="#111" />
          </g>
          {msg && <text x="180" y="122" textAnchor="middle" className={"pen-msg " + msg}>{MSG[msg]}</text>}
        </svg>

        {!done ? (
          <>
            <div className={"pen-meter" + (phase === "power" ? " on" : "")} onPointerDown={shoot} role="button" tabIndex={0} aria-label={bn ? "শট" : "Shoot"} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && shoot()}>
              <div className="pen-zone" /><i style={{ left: `${50 + needle * 46}%` }} />
            </div>
            <p className="pen-hint muted">{hint || " "}</p>
          </>
        ) : (
          <div className="pen-end">
            <b>{verdict}</b>
            <span className="muted">{bn ? `সেরা রাউন্ড ${n(best)}/৫ · মোট গোল ${n(total)}` : `Best ${best}/5 · Total goals ${total}`}</span>
            <button className="btn" onClick={again}>{bn ? "আবার খেলুন" : "Play again"}</button>
          </div>
        )}
      </div>
    </div>
  );
}
