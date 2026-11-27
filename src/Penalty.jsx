// ════════════════ পেনাল্টি শুটআউট ════════════════
// রাতের স্টেডিয়াম, বাংলা ধারাভাষ্য (আগে থেকে রেকর্ড করা), বাঁশি-কিক-দর্শকের আওয়াজ (ব্রাউজারেই তৈরি)।
// খেলা: গোলপোস্টে নিশানা চাপুন → কাঁটা মাঝখানে থামান → শট। ৫ শটের রাউন্ড; প্রতি শটে কাঁটা দ্রুত, গোলরক্ষক চালাক।
import { useEffect, useMemo, useRef, useState } from "react";

const G = { x0: 52, x1: 308, y0: 118, y1: 222 };    // গোলের মুখ (SVG একক)
const BALL0 = { x: 180, y: 300 };
const KEEP0 = { x: 180, y: 192 };
const ZONES = [[96, 146], [180, 138], [264, 146], [96, 200], [180, 204], [264, 200]];
const KICKS = 5;
const D = "০১২৩৪৫৬৭৮৯";
const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* */ } } };
const VO = { start: 1, goal: 4, save: 3, miss: 2, post: 2, streak: 1, end5: 1, end4: 1, end3: 1, end0: 1 };

// ── আওয়াজ: Web Audio দিয়ে তৈরি; ধারাভাষ্য mp3 ──
function makeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  const noise = (() => { const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0); let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } return b; })();
  const white = (() => { const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  // দর্শকের গুঞ্জন (সারাক্ষণ, খুব আস্তে)
  const amb = ctx.createBufferSource(); amb.buffer = noise; amb.loop = true;
  const ambF = ctx.createBiquadFilter(); ambF.type = "bandpass"; ambF.frequency.value = 420; ambF.Q.value = 0.6;
  const ambG = ctx.createGain(); ambG.gain.value = 0.0;
  amb.connect(ambF).connect(ambG).connect(master); amb.start();
  const t = () => ctx.currentTime;
  const env = (g, a, peak, hold, rel) => { const n = t(); g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(peak, n + a); g.gain.setValueAtTime(peak, n + a + hold); g.gain.exponentialRampToValueAtTime(0.0001, n + a + hold + rel); };
  const burst = (buf, type, freq, q, peak, a, hold, rel, sweepTo) => {
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t() + a + hold + rel);
    const g = ctx.createGain(); g.gain.value = 0.0001;
    s.connect(f).connect(g).connect(master); s.start(); env(g, a, peak, hold, rel); s.stop(t() + a + hold + rel + 0.1);
  };
  const vo = {};
  const api = {
    ctx,
    crowd(on) { const n = t(); ambG.gain.cancelScheduledValues(n); ambG.gain.linearRampToValueAtTime(on ? 0.16 : 0, n + 0.8); },
    whistle() {
      [0, 0.32].forEach((d, i) => {
        const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
        o.frequency.value = 2650; lfo.frequency.value = 38; lg.gain.value = 140; lfo.connect(lg).connect(o.frequency);
        g.gain.value = 0.0001; o.connect(g).connect(master);
        const s0 = t() + d, len = i ? 0.55 : 0.2;
        g.gain.setValueAtTime(0.0001, s0); g.gain.linearRampToValueAtTime(0.12, s0 + 0.02); g.gain.setValueAtTime(0.12, s0 + len); g.gain.exponentialRampToValueAtTime(0.0001, s0 + len + 0.08);
        o.start(s0); lfo.start(s0); o.stop(s0 + len + 0.1); lfo.stop(s0 + len + 0.1);
      });
    },
    kick() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(150, t()); o.frequency.exponentialRampToValueAtTime(45, t() + 0.18);
      g.gain.setValueAtTime(0.9, t()); g.gain.exponentialRampToValueAtTime(0.0001, t() + 0.22);
      o.connect(g).connect(master); o.start(); o.stop(t() + 0.25);
      burst(white, "highpass", 1800, 0.7, 0.35, 0.002, 0.01, 0.06);
    },
    net() { burst(white, "bandpass", 2400, 0.8, 0.28, 0.01, 0.05, 0.35, 900); },
    glove() { burst(white, "lowpass", 900, 1, 0.6, 0.002, 0.02, 0.12); },
    post() {
      [523, 1347, 2153, 3011].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o.frequency.value = f;
        g.gain.setValueAtTime(0.18 / (i + 1), t()); g.gain.exponentialRampToValueAtTime(0.0001, t() + 0.9 - i * 0.12);
        o.connect(g).connect(master); o.start(); o.stop(t() + 1);
      });
    },
    cheer() { burst(noise, "bandpass", 900, 0.5, 0.75, 0.25, 1.1, 1.6, 1400); burst(white, "bandpass", 3200, 1.5, 0.05, 0.3, 0.9, 1.2); },
    groan() { burst(noise, "lowpass", 700, 0.7, 0.45, 0.15, 0.5, 1.1, 260); },
    say(key) {
      const k = `${key}-${Math.floor(Math.random() * (VO[key] || 1))}`;
      const a = vo[k] || (vo[k] = new Audio(`/sfx/vo-${k}.mp3`));
      a.currentTime = 0; a.volume = 1; a.play().catch(() => {});
    },
    preload() { for (const [k, c] of Object.entries(VO)) for (let i = 0; i < c; i++) { const id = `${k}-${i}`; if (!vo[id]) { vo[id] = new Audio(`/sfx/vo-${id}.mp3`); vo[id].preload = "auto"; } } },
    mute(m) { master.gain.value = m ? 0 : 0.9; Object.values(vo).forEach((a) => { a.muted = m; }); },
  };
  return api;
}

// দর্শক: একবার তৈরি করা বিন্দু (রং আর জায়গা এলোমেলো, কিন্তু প্রতিবার একই)
function useCrowd() {
  return useMemo(() => {
    let s = 7; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const cols = ["#e11d48", "#f59e0b", "#00e676", "#38bdf8", "#f8fafc", "#a78bfa", "#fb7185", "#22c55e"];
    const dots = [];
    for (let row = 0; row < 7; row++) for (let i = 0; i < 46; i++) dots.push({ x: i * 8 + (row % 2) * 4 + r() * 2, y: 30 + row * 7 + r() * 2, c: cols[Math.floor(r() * cols.length)], o: 0.45 + r() * 0.5 });
    const flashes = Array.from({ length: 9 }, () => ({ x: 10 + r() * 340, y: 32 + r() * 44, d: (r() * 4).toFixed(2) }));
    return { dots, flashes };
  }, []);
}

export default function Penalty({ lang = "bn", head = null }) {
  const bn = lang === "bn";
  const n = (x) => (bn ? String(x).replace(/\d/g, (d) => D[d]) : String(x));
  const svgRef = useRef(null);
  const audio = useRef(null);
  const crowd = useCrowd();
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(() => store.get("pen_mute", false));
  const [phase, setPhase] = useState("aim");
  const [aim, setAim] = useState(null);
  const [shots, setShots] = useState([]);
  const [ball, setBall] = useState({ ...BALL0, s: 1 });
  const [keeper, setKeeper] = useState({ ...KEEP0, r: 0 });
  const [msg, setMsg] = useState(null);
  const [timing, setTiming] = useState(null);
  const [fx, setFx] = useState(0);                     // গোলের উদযাপনের চাবি (কনফেটি, জাল, কাঁপুনি)
  const [needle, setNeedle] = useState(0);
  const needleRef = useRef(0);
  const [best, setBest] = useState(() => store.get("pen_best", 0));
  const [total, setTotal] = useState(() => store.get("pen_total", 0));
  const done = shots.length >= KICKS;
  const goals = shots.filter((s) => s === "goal").length;
  const streak = (() => { let c = 0; for (let i = shots.length - 1; i >= 0 && shots[i] === "goal"; i--) c++; return c; })();

  useEffect(() => () => { try { audio.current?.ctx.close(); } catch { /* */ } }, []);
  useEffect(() => { audio.current?.mute(muted); store.set("pen_mute", muted); }, [muted]);

  const start = () => {
    if (!audio.current) { audio.current = makeAudio(); audio.current?.preload(); }
    const a = audio.current;
    a?.ctx.resume?.(); a?.mute(muted);
    setStarted(true);
    a?.crowd(true); a?.whistle();
    setTimeout(() => a?.say("start"), 900);
  };

  useEffect(() => {
    if (phase !== "power") return;
    let raf; const t0 = performance.now();
    const speed = 0.0026 + shots.length * 0.0008;
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
    if (!started || phase !== "aim" || done) return;
    const p = toSvg(e); if (!p) return;
    if (p.x < G.x0 - 8 || p.x > G.x1 + 8 || p.y < G.y0 - 8 || p.y > G.y1) return;
    setAim({ x: Math.min(G.x1 - 5, Math.max(G.x0 + 5, p.x)), y: Math.min(G.y1 - 7, Math.max(G.y0 + 5, p.y)) });
    setPhase("power");
  };

  const shoot = () => {
    if (phase !== "power" || !aim) return;
    const a = audio.current;
    const err = Math.abs(needleRef.current);
    setTiming(err < 0.12 ? "perfect" : err < 0.4 ? "good" : "weak");
    const ang = Math.random() * Math.PI * 2, off = err * err * 74;
    const fxp = aim.x + Math.cos(ang) * off, fyp = Math.min(G.y1 - 5, aim.y + Math.sin(ang) * off);
    const read = Math.random() < 0.28 + shots.length * 0.035;
    const near = ZONES.reduce((b, z, i) => (Math.hypot(z[0] - fxp, z[1] - fyp) < Math.hypot(ZONES[b][0] - fxp, ZONES[b][1] - fyp) ? i : b), 0);
    const zi = read ? near : Math.floor(Math.random() * ZONES.length);
    const [kx, ky] = ZONES[zi];
    const reach = zi === 1 || zi === 4 ? 40 : 46;
    const outX = fxp < G.x0 || fxp > G.x1, outY = fyp < G.y0;
    let res;
    if ((outX && !outY && Math.abs(fxp - (fxp < 180 ? G.x0 : G.x1)) < 7) || (outY && !outX && Math.abs(fyp - G.y0) < 6)) res = "post";
    else if (outX || outY) res = "miss";
    else if (Math.hypot(kx - fxp, ky - fyp) < reach) res = "save";
    else res = "goal";
    const endX = res === "post" ? fxp + (fxp < 180 ? 26 : -26) : res === "save" ? (kx + fxp) / 2 : fxp;
    const endY = res === "post" ? fyp + 40 : res === "save" ? fyp + 10 : fyp;
    a?.kick();
    setPhase("flying");
    setBall({ x: endX, y: endY, s: 0.5 });
    setKeeper({ x: kx, y: ky + (ky < 170 ? -8 : 8), r: kx < 180 ? -62 : kx > 180 ? 62 : 0 });
    setTimeout(() => {
      if (res === "goal") { a?.net(); a?.cheer(); setFx((x) => x + 1); try { navigator.vibrate?.([30, 40, 60]); } catch { /* */ } }
      else if (res === "save") { a?.glove(); a?.groan(); }
      else if (res === "post") { a?.post(); a?.groan(); }
      else a?.groan();
      setMsg(res); setPhase("result");
      setShots((s) => {
        const next = [...s, res];
        let st = 0; for (let i = next.length - 1; i >= 0 && next[i] === "goal"; i--) st++;
        if (next.length >= KICKS) {
          const g = next.filter((x) => x === "goal").length;
          const b = Math.max(store.get("pen_best", 0), g); store.set("pen_best", b); setBest(b);
          const tt = store.get("pen_total", 0) + g; store.set("pen_total", tt); setTotal(tt);
          setTimeout(() => a?.say(g === 5 ? "end5" : g === 4 ? "end4" : g === 3 ? "end3" : "end0"), 1500);
        }
        setTimeout(() => a?.say(res === "goal" && st === 3 ? "streak" : res), 120);
        return next;
      });
    }, 560);
  };

  const nextKick = () => {
    setMsg(null); setAim(null); setTiming(null);
    setBall({ ...BALL0, s: 1 }); setKeeper({ ...KEEP0, r: 0 });
    setPhase("aim");
  };
  const again = () => { setShots([]); nextKick(); audio.current?.whistle(); };
  useEffect(() => {
    if (phase !== "result" || done) return;
    const tm = setTimeout(nextKick, 1900);
    return () => clearTimeout(tm);
  }, [phase, done]);

  const MSG = { goal: bn ? "গোওওল!" : "GOAL!", save: bn ? "দুর্দান্ত সেভ!" : "SAVED!", miss: bn ? "বাইরে!" : "WIDE!", post: bn ? "পোস্টে লেগে ফিরল!" : "OFF THE POST!" };
  const TIM = { perfect: bn ? "নিখুঁত টাইমিং" : "Perfect timing", good: bn ? "ভালো টাইমিং" : "Good timing", weak: bn ? "দুর্বল টাইমিং" : "Weak timing" };
  const verdict = goals === 5 ? (bn ? "পাঁচে পাঁচ! পেনাল্টির রাজা" : "Perfect! 5 out of 5") : goals >= 4 ? (bn ? "দারুণ শুটার" : "Great shooting") : goals >= 3 ? (bn ? "মন্দ না" : "Not bad") : (bn ? "আজ গোলরক্ষকের দিন" : "The keeper's day");
  const hint = phase === "aim" ? (bn ? "গোলপোস্টের যেখানে মারতে চান, সেখানে চাপুন" : "Tap where you want to shoot") : phase === "power" ? (bn ? "কাঁটা মাঝখানে এলে চাপুন" : "Tap when the needle hits the middle") : "";
  const flying = phase === "flying";
  const idle = phase === "aim" || phase === "power";

  return (
    <div className="sec">
      {head}
      <div className={"card pen2" + (fx ? " k" + (fx % 2) : "")}>
        <div className="pen-top">
          <div className="pen-dots" aria-label={bn ? "শটের ফল" : "Shots"}>
            {Array.from({ length: KICKS }, (_, i) => <i key={i} className={shots[i] === "goal" ? "g" : shots[i] ? "x" : i === shots.length && !done && started ? "now" : ""} />)}
          </div>
          {streak >= 2 && !done && <span className="pen-streak">{bn ? `টানা ${n(streak)} গোল` : `${streak} in a row`}</span>}
          <div className="pen-right">
            <div className="pen-score"><b>{n(goals)}</b><span>/{n(KICKS)}</span></div>
            <button className="pen-mute" onClick={() => setMuted(!muted)} aria-label={muted ? (bn ? "আওয়াজ চালু" : "Unmute") : (bn ? "আওয়াজ বন্ধ" : "Mute")}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />{muted ? <path d="M17 9l5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}</svg>
            </button>
          </div>
        </div>

        <div className="pen-stage">
          <svg ref={svgRef} className={"pen-field" + (phase === "aim" && started ? " aiming" : "")} viewBox="0 0 360 330" onPointerDown={pickAim} role="img" aria-label={bn ? "পেনাল্টি" : "Penalty"}>
            <defs>
              <linearGradient id="pSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#07111f" /><stop offset="1" stopColor="#11263a" /></linearGradient>
              <linearGradient id="pGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1e7a45" /><stop offset="1" stopColor="#0f5a31" /></linearGradient>
              <radialGradient id="pGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#fffbe6" stopOpacity=".95" /><stop offset=".35" stopColor="#fff3c4" stopOpacity=".35" /><stop offset="1" stopColor="#fff3c4" stopOpacity="0" /></radialGradient>
              <linearGradient id="pBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff8d6" stopOpacity=".18" /><stop offset="1" stopColor="#fff8d6" stopOpacity="0" /></linearGradient>
              <radialGradient id="pSpot" cx="0.5" cy="0.35" r="0.65"><stop offset="0" stopColor="#ffffff" stopOpacity=".12" /><stop offset="1" stopColor="#000" stopOpacity=".25" /></radialGradient>
              <pattern id="pNet" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 0L9 9M9 0L0 9" stroke="rgba(255,255,255,.28)" strokeWidth=".8" /></pattern>
              <radialGradient id="pBall" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#cbd5e1" /></radialGradient>
            </defs>
            {/* আকাশ, গ্যালারি, ফ্লাডলাইট */}
            <rect width="360" height="330" fill="url(#pSky)" />
            <path d="M0 26H360V86H0z" fill="#0d1b2a" />
            <g>{crowd.dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r="2.6" fill={d.c} opacity={d.o} />)}</g>
            <g className={"pen-crowd" + (msg === "goal" ? " jump" : "")}>{crowd.dots.filter((_, i) => i % 5 === 0).map((d, i) => <circle key={i} cx={d.x} cy={d.y - 1} r="2.6" fill={d.c} opacity={d.o} />)}</g>
            {crowd.flashes.map((f, i) => <circle key={i} className="pen-flash" cx={f.x} cy={f.y} r="2.2" fill="#fff" style={{ animationDelay: f.d + "s" }} />)}
            <path d="M-10 0L70 0L150 330H-10z" fill="url(#pBeam)" /><path d="M290 0L370 0L370 330L210 330z" fill="url(#pBeam)" />
            <circle cx="22" cy="12" r="34" fill="url(#pGlow)" /><circle cx="338" cy="12" r="34" fill="url(#pGlow)" />
            {[10, 18, 26, 34].map((x) => <rect key={x} x={x} y="8" width="5" height="5" rx="1" fill="#fffbe6" />)}
            {[322, 330, 338, 346].map((x) => <rect key={x} x={x} y="8" width="5" height="5" rx="1" fill="#fffbe6" />)}
            {/* বিজ্ঞাপনের বোর্ড */}
            <rect x="0" y="86" width="360" height="20" fill="#062e22" />
            {[0, 1, 2, 3].map((i) => <text key={i} x={45 + i * 90} y="100" textAnchor="middle" className="pen-ad">{i % 2 ? "KHELAKOKHON.COM" : "খেলা কখন?"}</text>)}
            {/* মাঠ */}
            <path d="M0 106H360V330H0z" fill="url(#pGrass)" />
            {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M0 ${106 + i * 46}H360V${129 + i * 46}H0z`} fill="rgba(255,255,255,.035)" />)}
            <path d="M0 330H360V106H0z" fill="url(#pSpot)" />
            <path d="M0 222H360" stroke="rgba(255,255,255,.75)" strokeWidth="2" />
            <path d="M108 222L70 262H290L252 222" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="2" />
            <ellipse cx="180" cy="300" rx="3.5" ry="2" fill="rgba(255,255,255,.85)" />
            {/* গোল: পেছনের ফ্রেম, জাল, সামনের পোস্ট */}
            <path d={`M${G.x0 + 14} ${G.y0 + 10}H${G.x1 - 14}V${G.y1 - 6}H${G.x0 + 14}z`} fill="rgba(0,0,0,.18)" />
            <g className={msg === "goal" ? "pen-net bulge" : "pen-net"} style={{ transformOrigin: `${ball.x}px ${ball.y}px` }}>
              <path d={`M${G.x0} ${G.y0}L${G.x0 + 14} ${G.y0 + 10}V${G.y1 - 6}L${G.x0} ${G.y1}z M${G.x1} ${G.y0}L${G.x1 - 14} ${G.y0 + 10}V${G.y1 - 6}L${G.x1} ${G.y1}z`} fill="url(#pNet)" />
              <rect x={G.x0 + 14} y={G.y0 + 10} width={G.x1 - G.x0 - 28} height={G.y1 - G.y0 - 16} fill="url(#pNet)" />
              <path d={`M${G.x0} ${G.y0}H${G.x1}L${G.x1 - 14} ${G.y0 + 10}H${G.x0 + 14}z`} fill="url(#pNet)" />
            </g>
            <path d={`M${G.x0 + 14} ${G.y1 - 6}V${G.y0 + 10}H${G.x1 - 14}V${G.y1 - 6}`} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2.5" />
            <path d={`M${G.x0} ${G.y1}V${G.y0}H${G.x1}V${G.y1}`} fill="none" stroke="#fff" strokeWidth="7" strokeLinejoin="round" />
            <path d={`M${G.x0 + 2} ${G.y1}V${G.y0 + 2}H${G.x1 - 2}`} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="2" />

            {/* গোলরক্ষক */}
            <ellipse cx={keeper.x} cy="224" rx="24" ry="4" fill="rgba(0,0,0,.3)" style={{ transition: flying ? "cx .42s ease .06s" : "cx .3s" }} />
            <g style={{ transform: `translate(${keeper.x}px, ${keeper.y}px) rotate(${keeper.r}deg)`, transition: flying ? "transform .42s cubic-bezier(.2,.8,.3,1) .06s" : "transform .35s ease" }}>
              <g className={idle && started ? "pen-gk idle" : "pen-gk"}>
                <rect x="-12" y="10" width="9" height="22" rx="3.5" fill="#111827" /><rect x="3" y="10" width="9" height="22" rx="3.5" fill="#111827" />
                <rect x="-12" y="26" width="9" height="6" rx="2" fill="#f59e0b" /><rect x="3" y="26" width="9" height="6" rx="2" fill="#f59e0b" />
                <rect x="-15" y="-24" width="30" height="38" rx="10" fill="#f59e0b" />
                <path d="M-15 -8H15" stroke="#d97706" strokeWidth="3" />
                <text x="0" y="5" textAnchor="middle" className="pen-num">১</text>
                <rect x="-40" y="-24" width="26" height="9" rx="4.5" fill="#f59e0b" /><rect x="14" y="-24" width="26" height="9" rx="4.5" fill="#f59e0b" />
                <circle cx="-43" cy="-19.5" r="7" fill="#00e676" stroke="#065f46" strokeWidth="1.5" /><circle cx="43" cy="-19.5" r="7" fill="#00e676" stroke="#065f46" strokeWidth="1.5" />
                <circle cx="0" cy="-35" r="10.5" fill="#b77b52" /><path d="M-10 -39a10.5 10.5 0 0 1 20 0z" fill="#1f2937" />
              </g>
            </g>

            {aim && phase === "power" && <g className="pen-aim"><circle cx={aim.x} cy={aim.y} r="15" /><circle cx={aim.x} cy={aim.y} r="3" fill="#fff" /><path d={`M${aim.x - 22} ${aim.y}H${aim.x - 9}M${aim.x + 9} ${aim.y}H${aim.x + 22}M${aim.x} ${aim.y - 22}V${aim.y - 9}M${aim.x} ${aim.y + 9}V${aim.y + 22}`} /></g>}
            {flying && <path className="pen-trail" d={`M${BALL0.x} ${BALL0.y}Q${(BALL0.x + ball.x) / 2} ${Math.min(BALL0.y, ball.y) - 40} ${ball.x} ${ball.y}`} />}

            {/* বল আর ছায়া */}
            <ellipse cx={ball.x} cy={flying || phase === "result" ? Math.min(ball.y + 6, 226) : 314} rx={12 * ball.s} ry={3.2 * ball.s} fill="rgba(0,0,0,.3)" style={{ transition: flying ? "all .55s cubic-bezier(.25,.7,.35,1)" : "none" }} />
            <g style={{ transform: `translate(${ball.x}px, ${ball.y}px) scale(${ball.s})`, transition: flying ? "transform .55s cubic-bezier(.25,.7,.35,1)" : "none" }}>
              <g className={flying ? "pen-spin" : ""}>
                <circle r="14" fill="url(#pBall)" stroke="#0f172a" strokeWidth="1.4" />
                <path d="M0-6.5l6.2 4.5-2.4 7.3h-7.6l-2.4-7.3z" fill="#0f172a" />
                <path d="M0-6.5V-14M6.2-2l7.2-2.4M3.8 5.3l4.4 6M-3.8 5.3l-4.4 6M-6.2-2l-7.2-2.4" stroke="#0f172a" strokeWidth="1.3" />
              </g>
            </g>

            {msg && <g key={shots.length} className={"pen-banner " + msg}>
              <text x="180" y="172" textAnchor="middle" className="pen-msg">{MSG[msg]}</text>
              {timing && <text x="180" y="196" textAnchor="middle" className="pen-tim">{TIM[timing]}</text>}
            </g>}
          </svg>

          {msg === "goal" && <div className="pen-confetti" key={"c" + fx} aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.05}s`, background: ["#00e676", "#f59e0b", "#fff", "#38bdf8", "#e11d48"][i % 5], transform: `rotate(${i * 29}deg)` }} />)}</div>}

          {!started && (
            <div className="pen-intro">
              <b>{bn ? "পেনাল্টি শুটআউট" : "Penalty shootout"}</b>
              <span>{bn ? "৫টা শট। গোলরক্ষককে হারাতে পারবেন?" : "5 kicks. Can you beat the keeper?"}</span>
              {best > 0 && <small>{bn ? `আপনার সেরা: ${n(best)}/৫` : `Your best: ${best}/5`}</small>}
              <button className="btn" onClick={start}>{bn ? "মাঠে নামুন" : "Start"}</button>
              <small className="pen-sound">{muted ? (bn ? "আওয়াজ বন্ধ আছে" : "Sound is off") : (bn ? "আওয়াজ আর ধারাভাষ্যসহ" : "With sound and commentary")}</small>
            </div>
          )}
          {done && (
            <div className="pen-intro end">
              <b>{verdict}</b>
              <span className="pen-big">{n(goals)}<small>/{n(KICKS)}</small></span>
              <small>{bn ? `সেরা রাউন্ড ${n(best)}/৫ · মোট গোল ${n(total)}` : `Best ${best}/5 · Total goals ${total}`}</small>
              <button className="btn" onClick={again}>{bn ? "আবার খেলুন" : "Play again"}</button>
            </div>
          )}
        </div>

        {started && !done && (
          <>
            <div className={"pen-meter2" + (phase === "power" ? " on" : "")} onPointerDown={shoot} role="button" tabIndex={0} aria-label={bn ? "শট" : "Shoot"} onKeyDown={(e) => (e.key === " " || e.key === "Enter") && shoot()}>
              <div className="pen-track" /><div className="pen-sweet" /><i style={{ left: `${50 + needle * 46}%` }} />
            </div>
            <p className="pen-hint muted">{hint || " "}</p>
          </>
        )}
      </div>
    </div>
  );
}
