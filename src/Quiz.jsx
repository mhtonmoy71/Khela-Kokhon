// Quiz.jsx: App.jsx থেকে আলাদা (দরকার হলে তখনই নামে)
import { useEffect, useRef, useState } from "react";
import { BN_MONTHS, BadgeGrid, BadgeIcon, CARD_FONT, CARD_W, CalIcon, DAILY_Q, DEMO, DEMO_QUIZ_Q, EN_MONTHS, FlameIcon, GameSwitch, LevelBadges, LevelIcon, Loading, PlayIcon, QuizIcon, RankBadge, ReplayIcon, ShareIcon, TargetIcon, TrophyIcon, UserAvatar, UserIcon, UsersIcon, W, answer, badgeOf, clockLogo, countdown, dailyCall, dayLabel, has, ls, lvParse, lvTier, num, ok, ord, rpc, sb, useBackClose, useDaily, useDailyProgress, useNav, useT, useWide } from "./App.jsx";

// ════════════════ স্পোর্টস কুইজ (লাইভ) ════════════════
// খেলার সব নিয়ম ডেটাবেসের ফাংশনে (supabase/quiz.sql); এখানে শুধু দেখানো আর প্রতি সেকেন্ডে অবস্থা জানা
const QUIZ_N = 10;
const QUIZ_ERR = {
  "room not found": ["এই কোডের কোনো কুইজ নেই। কোডটা আবার দেখুন।", "No quiz with this code."],
  "already started": ["এই কুইজ শুরু হয়ে গেছে। হোস্ট আবার খেললে যোগ দিতে পারবেন।", "This quiz has already started."],
  "login required": ["কুইজ খেলতে আগে লগইন করুন।", "Log in to play."],
  "time over": ["সময় শেষ!", "Time's up!"],
  "room closed": ["এই কুইজ শেষ হয়ে গেছে, লিংকটি আর চালু নেই।", "This quiz has ended; the link no longer works."],
};
const quizMsg = (e, lang) => { const m = String(e?.message || e); const k = Object.keys(QUIZ_ERR).find((x) => m.includes(x)); return k ? QUIZ_ERR[k][lang === "bn" ? 0 : 1] : (lang === "bn" ? "কিছু একটা গোলমাল হলো, আবার চেষ্টা করুন।" : "Something went wrong."); };

const demoQuiz = {};
function demoQuizCall(fn, a) {
  const now = Date.now(), Q = 30000, GAP = 3000, n = DEMO_QUIZ_Q.length;
  const room = demoQuiz[(a.p_code || "").toUpperCase()];
  const bots = [["রাফি (অনুশীলন)", 0.7], ["নুসরাত (অনুশীলন)", 0.5]];
  if (fn === "quiz_create") {
    const code = Math.random().toString(16).slice(2, 8).toUpperCase();
    demoQuiz[code] = { code, status: "lobby", started: null, next: null, answers: {},
      players: [{ id: "me", name: ls.get("user", {})?.user_metadata?.name || "আপনি", joined: now }, ...bots.map(([nm, sk], i) => ({ id: "b" + i, name: nm, skill: sk, joined: now + i + 1 }))] };
    return code;
  }
  if (!room) throw new Error("room not found");
  // সার্ভারের quiz_progress-এর মতোই: সময় পেরোনো প্রশ্নে "উত্তর দেননি", অনুশীলনের সঙ্গীরা নিজের সময়ে উত্তর দেয়
  const progress = (p) => {
    const list = (room.answers[p.id] ||= []);
    let qstart = list.length ? list[list.length - 1].at + GAP : room.started;
    while (list.length < n) {
      const i = list.length;
      if (p.skill) {
        const d = ((i * 7 + p.id.charCodeAt(1) * 3) % 14 + 3) * 1000;
        if (now >= qstart + d) { list.push({ choice: Math.random() < p.skill ? DEMO_QUIZ_Q[i][2] : (DEMO_QUIZ_Q[i][2] + 1) % 4, ms: d, at: qstart + d }); qstart += d + GAP; continue; }
      }
      if (now >= qstart + Q) { list.push({ choice: null, ms: Q, at: qstart + Q }); qstart += Q + GAP; continue; }
      break;
    }
    return { idx: list.length, qstart };
  };
  if (fn === "quiz_join") return null;
  if (fn === "quiz_start") { room.status = "running"; room.started = now + 3000; return null; }
  if (fn === "quiz_again") { if (!room.next) { room.next = demoQuizCall("quiz_create", {}); room.status = "closed"; } return room.next; }
  if (fn === "quiz_close") { room.status = "closed"; return null; }
  if (fn === "quiz_next") { const l = room.answers.me || [], last = l[l.length - 1]; if (last && now < last.at + GAP) last.at = now - GAP; return null; }
  if (room.status === "closed") return { code: room.code, status: "closed", is_host: true, next_code: room.next, member: true, players: [] };
  const me = room.players[0];
  if (fn === "quiz_answer") {
    if (room.status !== "running") throw new Error("not running");
    const pr = progress(me);
    if (pr.idx !== a.p_index || now < pr.qstart) throw new Error("time over");
    room.answers.me.push({ choice: a.p_choice, ms: now - pr.qstart, at: now });
    return { ok: true };
  }
  // quiz_state
  let ndone = 0, phase = room.status, ends = null, cur = null;
  if (room.status === "running" && now >= room.started) {
    ndone = room.players.filter((p) => { const g = progress(p); return g.idx >= n && now >= g.qstart; }).length;
    if (ndone === room.players.length) { room.status = "finished"; phase = "finished"; }
  }
  if (room.status === "running") {
    if (now < room.started) { phase = "countdown"; ends = room.started; }
    else {
      const pr = progress(me);
      if (pr.idx >= n && !(now < pr.qstart)) phase = "waiting";
      else {
        const reveal = pr.idx > 0 && now < pr.qstart, ci = reveal ? pr.idx - 1 : pr.idx;
        const [qq, opts, ans, ex] = DEMO_QUIZ_Q[ci];
        phase = reveal ? "reveal" : "question"; ends = reveal ? pr.qstart : pr.qstart + Q;
        cur = { index: ci, category: "খেলাধুলা", question: qq, options: opts, started_at: reveal ? null : new Date(pr.qstart).toISOString() };
        if (reveal) { const m = room.answers.me[ci]; cur = { ...cur, answer: ans, explanation: ex, mine: { choice: m.choice, correct: m.choice === ans, ms: m.ms } }; }
      }
    }
  }
  const fin = room.status === "finished";
  const players = room.players.map((p) => {
    const list = room.answers[p.id] || [], show = fin || p.id === "me";
    return { name: p.name, me: p.id === "me", host: p.id === "me", joined: p.joined,
      score: show ? list.filter((x, i) => x.choice === DEMO_QUIZ_Q[i][2]).length : null, ms: show ? list.reduce((t, x) => t + x.ms, 0) : null };
  }).sort((x, y) => (y.score ?? -1) - (x.score ?? -1) || (x.ms ?? 1e9) - (y.ms ?? 1e9) || x.joined - y.joined);
  const review = fin ? DEMO_QUIZ_Q.map(([qq, opts, ans, ex], i) => ({ question: qq, options: opts, answer: ans, explanation: ex, choice: room.answers.me?.[i]?.choice ?? null })) : null;
  return { code: room.code, status: room.status, phase, total: n, finished_count: ndone, q_seconds: 30, gap_seconds: 3,
    started_at: room.started && new Date(room.started).toISOString(), ends_at: ends && new Date(ends).toISOString(), now: new Date(now).toISOString(),
    is_host: true, next_code: room.next, current: cur, review, players };
}
async function quizCall(fn, args = {}) {
  if (DEMO) return demoQuizCall(fn, args);
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(error.message || "error");
  return data;
}
const quizLink = (code) => `${window.location.origin}/quiz/play/${code}`;
async function shareQuiz(code, bn, toast) {
  const text = bn ? `⚽ খেলা কখন?-এ স্পোর্টস কুইজে চ্যালেঞ্জ! ১০টা প্রশ্ন, প্রতিটায় ৩০ সেকেন্ড। কে জেতে দেখি 😎\n\n${quizLink(code)}\nকোড: ${code}` : `⚽ Sports quiz challenge on Khela Kokhon! 10 questions, 30 seconds each.\n\n${quizLink(code)}\nCode: ${code}`;
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast(bn ? "লিংক কপি হয়েছে, বন্ধুদের পাঠান" : "Link copied"); } catch { /* ignore */ }
}
const LETTERS = ["ক", "খ", "গ", "ঘ"];
const secTxt = (ms, lang) => (lang === "bn" ? `${num((ms / 1000).toFixed(1), "bn")} সে.` : `${(ms / 1000).toFixed(1)}s`);

// কুইজের শব্দ: ব্রাউজারেই তৈরি হালকা মিউজিক (ফাইল ছাড়া, ফাঁক ছাড়া লুপ) আর সঠিক/ভুলের শব্দ
const quizAudio = (() => {
  let ctx = null, master = null, music = null, timer = null, step = 0, nextT = 0;
  let on = true;
  try { on = localStorage.getItem("kk_quiz_sound") !== "0"; } catch { /* ignore */ }
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], RT = [45, 41, 48, 43];
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? 1 : 0; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };
  const tone = (f, t, dur, type, vol, dest, attack = 0.005) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
  };
  const kick = (t) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.3);
  };
  // ১২০ BPM, প্রতি ধাপ ১৬ভাগ নোট; Am–F–C–G ঘুরে ঘুরে
  const schedule = () => {
    while (nextT < ctx.currentTime + 0.3) {
      const bar = Math.floor(step / 16) % 4, k = step % 16, c = CH[bar], t = nextT;
      if (k % 2 === 0) tone(hz([c[0] + 12, c[2] + 12, c[1] + 24, c[2] + 12][(k / 2) % 4]), t, 0.3, "triangle", k % 4 === 0 ? 0.07 : 0.045, music);
      if (k === 0) c.forEach((m) => tone(hz(m + 12), t, 2.1, "sine", 0.028, music, 0.4));
      if (k === 4 || k === 12) tone(hz(RT[bar]), t, 0.35, "sine", 0.14, music, 0.01);
      if (k === 0 || k === 8) kick(t);
      step++; nextT += 0.125;
    }
  };
  return {
    get on() { return on; },
    setOn(v) {
      on = v; try { localStorage.setItem("kk_quiz_sound", v ? "1" : "0"); } catch { /* ignore */ }
      if (master) master.gain.setTargetAtTime(v ? 1 : 0, ctx.currentTime, 0.05);
    },
    unlock() { ensure(); },
    start() {
      if (timer || !ensure()) return;
      music = ctx.createGain(); music.gain.setValueAtTime(0, ctx.currentTime); music.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.5);
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2600; music.connect(f); f.connect(master);
      step = 0; nextT = ctx.currentTime + 0.05; schedule(); timer = setInterval(schedule, 100);
    },
    stop() {
      if (!timer) return;
      clearInterval(timer); timer = null;
      const m = music; m.gain.setTargetAtTime(0, ctx.currentTime, 0.25); setTimeout(() => m.disconnect(), 1500);
    },
    sfx(kind) {
      if (!ensure() || !on) return;
      const t = ctx.currentTime;
      if (kind === "ok") { tone(hz(84), t, 0.25, "sine", 0.22); tone(hz(88), t + 0.08, 0.3, "sine", 0.22); tone(hz(91), t + 0.16, 0.45, "sine", 0.2); }
      else if (kind === "bad") { tone(180, t, 0.25, "triangle", 0.18); tone(120, t + 0.12, 0.35, "triangle", 0.18); }
      else if (kind === "win") [72, 76, 79, 84].forEach((m, i) => tone(hz(m), t + i * 0.11, 0.6, "triangle", 0.18));
    },
  };
})();

const SoundIcon = ({ off, ...p }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 9v6h4l5 4V5L8 9z" />{off ? <path d="m16 9 5 6M21 9l-5 6" /> : <><path d="M16 9.5a3.5 3.5 0 0 1 0 5" /><path d="M18.5 7a7 7 0 0 1 0 10" /></>}
  </svg>
);

// রঙিন কাগজের ঝরনা (ফলাফলের পাতায়, ৩.৫ সেকেন্ড)
function Confetti() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, cx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    const W = (cv.width = window.innerWidth * dpr), H = (cv.height = window.innerHeight * dpr);
    const colors = ["#00e676", "#f59e0b", "#ffffff", "#ff4d5e", "#38bdf8", "#facc15"];
    const ps = Array.from({ length: 140 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3, y: H * 0.35, vx: (Math.random() - 0.5) * 16 * dpr, vy: (-Math.random() * 15 - 6) * dpr,
      w: (6 + Math.random() * 6) * dpr, h: (8 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: colors[(Math.random() * colors.length) | 0],
    }));
    let raf, t0 = performance.now();
    const draw = (t) => {
      const k = (t - t0) / 3500; cx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vy += 0.45 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        cx.save(); cx.globalAlpha = Math.max(0, 1 - k); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2))); cx.restore();
      }
      if (k < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}

// স্পোর্টস কুইজের ভেতরের দুই ভাগ: দৈনিক চ্যালেঞ্জ আর একা/বন্ধুদের সাথে
function QuizSub({ on }) {
  const { lang } = useT();
  const nav = useNav();
  const bn = lang === "bn";
  return (
    <div className="qz-sub-tabs" role="tablist">
      <button role="tab" aria-selected={on === "daily"} className={on === "daily" ? "on" : ""} onClick={() => on !== "daily" && nav.openDaily()}><CalIcon width={17} height={17} />{bn ? "দৈনিক চ্যালেঞ্জ" : "Daily challenge"}</button>
      <button role="tab" aria-selected={on === "live"} className={on === "live" ? "on" : ""} onClick={() => on !== "live" && nav.openQuiz()}><UsersIcon width={17} height={17} />{bn ? "একা বা বন্ধুদের সাথে" : "Solo or with friends"}</button>
    </div>
  );
}

// নতুন ব্যাজ একবারই উদযাপন
const seenBadges = () => ls.get("badges_seen", []);
const markBadgesSeen = (ids) => ls.set("badges_seen", [...new Set([...seenBadges(), ...ids])]);

// ── দৈনিক চ্যালেঞ্জের শেয়ার কার্ড (১০৮০×১০৮০) ──
async function makeDailyCard(st, lang) {
  try { await Promise.all([document.fonts.load(`700 60px ${CARD_FONT}`, "খেলা০১২৩৪৫৬৭৮৯."), document.fonts.load(`500 40px ${CARD_FONT}`, "খেলা০১২৩৪৫৬৭৮৯.")]); } catch { /* ignore */ }
  const W = CARD_W, c = document.createElement("canvas"); c.width = W; c.height = W;
  const ctx = c.getContext("2d"), bn = lang === "bn", pl = st.play;
  const g = ctx.createLinearGradient(0, 0, W, W); g.addColorStop(0, "#0a3d2f"); g.addColorStop(0.55, "#064e3b"); g.addColorStop(1, "#06201a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, W);
  const glow = ctx.createRadialGradient(W * 0.5, W * 0.42, 0, W * 0.5, W * 0.42, W * 0.6); glow.addColorStop(0, "rgba(0,230,118,0.22)"); glow.addColorStop(1, "rgba(0,230,118,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, W);
  clockLogo(ctx, 110, 108, 44);
  ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = "#fff"; ctx.font = `700 50px ${CARD_FONT}`; ctx.fillText("খেলা কখন", 172, 112);
  ctx.fillStyle = "#f59e0b"; ctx.fillText("?", 172 + ctx.measureText("খেলা কখন").width + 4, 112);
  ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = `600 36px ${CARD_FONT}`;
  ctx.fillText(dayLabel(st.day, lang, { short: true, abs: true }), W - 70, 112);
  ctx.textAlign = "center"; ctx.fillStyle = "#00e676"; ctx.font = `700 46px ${CARD_FONT}`; ctx.fillText(bn ? "দৈনিক চ্যালেঞ্জ" : "Daily Challenge", W / 2, 250);
  ctx.fillStyle = "#fff"; ctx.font = `800 210px Inter, ${CARD_FONT}`; ctx.fillText(`${num(pl.correct, lang)}/${num(DAILY_Q, lang)}`, W / 2, 420);
  const sz = 92, gap = 22, x0 = W / 2 - (DAILY_Q * sz + (DAILY_Q - 1) * gap) / 2;
  (pl.marks || []).forEach((ok, i) => {
    const x = x0 + i * (sz + gap), y = 560; ctx.fillStyle = ok ? "#00c853" : "#ef4444";
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, sz, sz, 20) : ctx.rect(x, y, sz, sz); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath();
    if (ok) { ctx.moveTo(x + 26, y + 48); ctx.lineTo(x + 41, y + 63); ctx.lineTo(x + 67, y + 33); } else { ctx.moveTo(x + 30, y + 30); ctx.lineTo(x + 62, y + 62); ctx.moveTo(x + 62, y + 30); ctx.lineTo(x + 30, y + 62); }
    ctx.stroke();
  });
  ctx.fillStyle = "#fff"; ctx.font = `700 52px ${CARD_FONT}`;
  ctx.fillText(bn ? `${num(pl.points ?? pl.raw, "bn")} পয়েন্ট` : `${pl.points ?? pl.raw} points`, W / 2, 760);
  if (st.streak > 1) { ctx.fillStyle = "#fdba74"; ctx.font = `600 40px ${CARD_FONT}`; ctx.fillText(bn ? `টানা ${num(st.streak, "bn")} দিন` : `${st.streak}-day streak`, W / 2, 830); }
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `500 38px ${CARD_FONT}`; ctx.fillText(bn ? "আপনি পারবেন? আজকের চ্যালেঞ্জ খেলুন" : "Can you beat it? Play today's challenge", W / 2, 940);
  ctx.fillStyle = "#00e676"; ctx.font = `700 40px Inter, ${CARD_FONT}`; ctx.fillText("khelakokhon.com/quiz/daily", W / 2, 1000);
  return await new Promise((r) => c.toBlob(r, "image/png"));
}
async function shareDaily(st, lang, toast) {
  const bn = lang === "bn";
  const text = (bn ? `খেলা কখন? দৈনিক চ্যালেঞ্জ: ${num(st.play.correct, "bn")}/${num(DAILY_Q, "bn")} · ${num(st.play.points ?? st.play.raw, "bn")} পয়েন্ট${st.streak > 1 ? ` · টানা ${num(st.streak, "bn")} দিন` : ""}\n` : `Khela Kokhon daily: ${st.play.correct}/${DAILY_Q} · ${st.play.points ?? st.play.raw} pts\n`)
    + (st.play.marks || []).map((x) => (x ? "🟩" : "🟥")).join("") + "\nkhelakokhon.com/quiz/daily";
  try {
    const blob = await makeDailyCard(st, lang);
    const file = blob && new File([blob], `khelakokhon-daily-${st.day}.png`, { type: "image/png" });
    if (file && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast(bn ? "ফল কপি হয়েছে, বন্ধুদের পাঠান" : "Result copied"); } catch { /* ignore */ }
}

function NewBadgePop({ ids, onClose }) {
  const { lang } = useT();
  const bn = lang === "bn";
  useEffect(() => { quizAudio.sfx("win"); markBadgesSeen(ids); }, []);
  useBackClose(true, onClose);
  return (
    <div className="veil bdg-veil" onClick={onClose}>
      <Confetti />
      <div className="bdg-pop" onClick={(e) => e.stopPropagation()}>
        <small>{bn ? (ids.length > 1 ? `${num(ids.length, "bn")}টা নতুন ব্যাজ!` : "নতুন ব্যাজ!") : (ids.length > 1 ? `${ids.length} new badges!` : "New badge!")}</small>
        <div className="bdg-pop-row">{ids.map((id) => { const L = lvParse(id); return L ? <LevelIcon key={id} m={L.meta.m} level={L.level} stars={L.stars} size={ids.length > 1 ? 84 : 112} /> : <BadgeIcon key={id} id={id} size={ids.length > 1 ? 84 : 112} />; })}</div>
        {ids.map((id) => {
          const L = lvParse(id);
          if (L) { const t = lvTier(L.meta, L.level), x = L.meta.steps[Math.min(L.level, L.meta.steps.length) - 1] + L.stars * L.meta.star;
            return <div key={id} className="bdg-pop-t"><b>{bn ? L.meta.bn : L.meta.en} · {bn ? t[0] : t[1]}{L.stars ? ` ★${num(L.stars, lang)}` : ""}</b><span className="muted">{bn ? `${num(x, "bn")} ${L.meta.ubn} পূর্ণ হয়েছে` : `${x} ${L.meta.uen} reached`}</span></div>; }
          const b = badgeOf(id); return b && <div key={id} className="bdg-pop-t"><b>{bn ? b[1] : b[2]}</b><span className="muted">{bn ? b[3] : b[4]}</span></div>;
        })}
        <button className="btn block" onClick={onClose}>{bn ? "দারুণ!" : "Awesome!"}</button>
      </div>
    </div>
  );
}

function WeekBoard() {
  const { lang } = useT();
  const bn = lang === "bn";
  const [off, setOff] = useState(0);
  const [d, setD] = useState(null);
  useEffect(() => { setD(null); dailyCall("daily_week", { p_offset: off }).then(setD).catch(() => setD({ rows: [] })); }, [off]);
  const range = d?.start && d?.end && d.start !== d.end ? (() => { const [s, e] = [new Date(d.start + "T00:00:00"), new Date(d.end + "T00:00:00")]; return bn ? `${num(s.getDate(), "bn")} ${BN_MONTHS[s.getMonth()]} – ${num(e.getDate(), "bn")} ${BN_MONTHS[e.getMonth()]}` : `${s.getDate()} ${EN_MONTHS[s.getMonth()]} – ${e.getDate()} ${EN_MONTHS[e.getMonth()]}`; })() : null;
  return (
    <div className="card dl-week">
      <div className="seg" style={{ margin: "12px 12px 6px" }}>
        <button className={off === 0 ? "on" : ""} onClick={() => setOff(0)}>{bn ? "এই সপ্তাহ" : "This week"}</button>
        <button className={off === -1 ? "on" : ""} onClick={() => setOff(-1)}>{bn ? "গত সপ্তাহ" : "Last week"}</button>
      </div>
      {range && <div className="muted dl-range">{range}{off === 0 ? (bn ? " · শুক্রবার রাতে শেষ" : " · ends Friday night") : ""}</div>}
      {d === null ? <div className="spin" /> : !d.rows.length ? <div className="empty muted" style={{ padding: "18px 16px" }}>{bn ? "এখনো কেউ খেলেননি। প্রথম হোন!" : "Nobody yet. Be the first!"}</div> : (
        d.rows.map((r, i) => (
          <div key={i} className={"qz-pl dl-row" + (r.is_me ? " me" : "")}>
            <RankBadge rank={r.rank} lang={lang} />
            <UserAvatar src={r.avatar} name={r.name} size={30} />
            <span className="qz-nm">{r.name}{(() => { const L = r.top && lvParse(r.top); return L ? <span className="lvb-mini" title={bn ? L.meta.bn : L.meta.en}><LevelIcon m={L.meta.m} level={L.level} size={18} /></span> : null; })()}{r.is_me ? (bn ? " (আপনি)" : " (you)") : ""}<small className="muted"> · {bn ? `${num(r.days, "bn")} দিন` : `${r.days}d`}</small></span>
            <span className="qz-sc"><b>{num(r.points, lang)}</b><small>{bn ? "পয়েন্ট" : "pts"}</small></span>
          </div>
        ))
      )}
    </div>
  );
}

function DailyPage({ user, goProfile, toast }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const wide = useWide();
  const [st, setSt, load, off] = useDaily(user);
  const prog = useDailyProgress(user, st?.play?.finished ? "done" : st?.day);
  const [rev, setRev] = useState(null);   // সর্বশেষ প্রশ্নের ফল
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [pop, setPop] = useState(null);
  const [soundOn, setSoundOn] = useState(quizAudio.on);
  const playing = !!st?.play && !st.play.finished;
  const cur = st?.current;

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), playing ? 200 : 1000); return () => clearInterval(t); }, [playing]);
  useEffect(() => { document.documentElement.classList.toggle("quiz-focus", playing); return () => document.documentElement.classList.remove("quiz-focus"); }, [playing]);
  useEffect(() => { if (playing) quizAudio.start(); else quizAudio.stop(); return () => quizAudio.stop(); }, [playing]);
  // নতুন ব্যাজ (সাপ্তাহিক ব্যাজ পরে আসে, তাই যেকোনো সময়)
  useEffect(() => {
    let ids = [...new Set([...(st?.new_badges || []), ...(st?.badges || []).map((b) => b.id)])].filter((id) => !seenBadges().includes(id));
    // লেভেল ব্যবস্থা চালু থাকলে: পুরনো ব্যাজ নয়, প্রতি ব্যাজের সবচেয়ে উঁচু নতুন ধাপটা
    if ((st?.badges || []).some((b) => String(b.id).startsWith("lv:"))) {
      markBadgesSeen(ids.filter((id) => !String(id).startsWith("lv:")));
      const best = {};
      for (const id of ids.filter((x) => String(x).startsWith("lv:"))) { const L = lvParse(id); if (!L) continue; const sc = L.level * 1000 + L.stars; if (!best[L.meta.m] || sc > best[L.meta.m][0]) best[L.meta.m] = [sc, id]; }
      markBadgesSeen(ids);
      ids = Object.values(best).map((x) => x[1]);
    }
    if (ids.length && !playing) setPop(ids);
  }, [st?.badges?.length, playing]);

  const nowS = now + (off.current || 0);
  const el = cur ? (nowS - Date.parse(cur.started_at)) / 1000 : 0;
  const left = cur ? Math.max(0, Math.ceil(DAILY_SEC - el)) : 0;
  // সময় শেষ
  useEffect(() => {
    if (cur && !rev && picked == null && left === 0) { quizAudio.sfx("bad"); setRev({ index: cur.index, timeout: true }); }
  }, [left, cur?.index]);

  async function start() {
    if (!user && !DEMO) return goProfile();
    quizAudio.unlock(); setBusy(true);
    try { const s = await dailyCall("daily_start"); off.current = Date.parse(s.now) - Date.now(); setSt(s); setRev(null); setPicked(null); }
    catch (e) { toast(e.message === "login required" ? (bn ? "আগে লগইন করুন" : "Please log in") : (bn ? "শুরু করা গেল না, আবার চেষ্টা করুন" : "Couldn't start")); }
    setBusy(false);
  }
  async function answer(i) {
    if (!cur || rev || picked != null) return;
    quizAudio.unlock(); setPicked(i);
    try {
      const r = await dailyCall("daily_answer", { p_index: cur.index, p_choice: i });
      quizAudio.sfx(r.correct ? "ok" : "bad");
      setRev({ ...r, index: cur.index, choice: i });
      setSt((s) => ({ ...s, play: { ...s.play, correct: s.play.correct + (r.correct ? 1 : 0), raw: s.play.raw + r.pts, marks: [...(s.play.marks || []), r.correct] } }));
    } catch { setRev({ index: cur.index, timeout: true }); }
  }
  async function next() {
    setBusy(true);
    try { const s = await dailyCall(rev?.finished ? "daily_state" : "daily_next"); off.current = Date.parse(s.now) - Date.now(); setSt(s); }
    catch { await load(); }
    setRev(null); setPicked(null); setBusy(false);
  }

  const switcher = <><GameSwitch on="quiz" /><QuizSub on="daily" /></>;
  if (!st) return <div className="sec">{switcher}<Loading /></div>;
  if (st.error) return <div className="sec">{switcher}<div className="card empty">{st.error === "missing" ? (bn ? "দৈনিক চ্যালেঞ্জ খুব শিগগিরই চালু হচ্ছে।" : "The daily challenge is coming soon.") : (bn ? "লোড করা গেল না। একটু পরে আবার চেষ্টা করুন।" : "Couldn't load. Try again shortly.")}</div></div>;

  // ── খেলা চলছে ──
  if (playing && (cur || rev)) {
    const idx = rev ? rev.index : cur.index;
    const marks = st.play.marks || [];
    return (
      <div className="sec qz-play dl-play">
        <div className="qz-top">
          <span className="dl-tag"><CalIcon width={15} height={15} />{bn ? "দৈনিক চ্যালেঞ্জ" : "Daily"}</span>
          <span className="qz-dots">{Array.from({ length: DAILY_Q }, (_, i) => <i key={i} className={i < marks.length ? (marks[i] ? "ok" : "bad") : i === idx ? "cur" : ""} />)}</span>
          <button className="qz-x" onClick={() => { quizAudio.setOn(!soundOn); setSoundOn(!soundOn); }} aria-label={soundOn ? (bn ? "শব্দ বন্ধ" : "Mute") : (bn ? "শব্দ চালু" : "Unmute")}><SoundIcon off={!soundOn} width={16} height={16} /></button>
        </div>
        <div className="qz-sub"><span>{bn ? `প্রশ্ন ${num(idx + 1, "bn")}/${num(DAILY_Q, "bn")}` : `Q ${idx + 1}/${DAILY_Q}`}{cur?.category ? ` · ${cur.category}` : ""}</span><span className="qz-myscore">{num(st.play.raw, lang)} {bn ? "পয়েন্ট" : "pts"}</span></div>
        {cur && !rev && <>
          <div className="qz-timer"><i style={{ width: `${Math.max(0, (DAILY_SEC - el) / DAILY_SEC) * 100}%` }} className={left <= 5 ? "low" : ""} /></div>
          <div className={"qz-left" + (left <= 5 ? " low" : "")}>{num(left, lang)}</div>
        </>}
        {cur && cur.index === idx && (
          <div className="qz-stage" key={idx}>
            <h2 className="qz-q">{cur.question}</h2>
            <div className="qz-opts">
              {cur.options.map((o, i) => {
                const cls = rev && !rev.timeout ? (i === rev.answer ? " right" : i === picked ? " wrong" : " dim") : rev?.timeout ? " dim" : picked === i ? " picked" : picked != null ? " dim" : "";
                return <button key={i} style={{ animationDelay: `${120 + i * 70}ms` }} className={"qz-opt" + cls} disabled={!!rev || picked != null} onClick={() => answer(i)}><span className="qz-l">{bn ? LETTERS[i] : "ABCD"[i]}</span>{o}</button>;
              })}
            </div>
          </div>
        )}
        {rev ? (
          <>
            <div className={"qz-verdict " + (rev.correct ? "ok" : "bad")}>
              <b>{rev.timeout ? (bn ? "সময় শেষ!" : "Time's up!") : rev.correct ? (bn ? `✓ সঠিক! +${num(rev.pts, "bn")} পয়েন্ট` : `✓ Correct! +${rev.pts}`) : (bn ? "✗ ভুল" : "✗ Wrong")}</b>
              {rev.correct && rev.pts > 10 && <span>{bn ? `দ্রুত উত্তরের বোনাস +${num(rev.pts - 10, "bn")}` : `Speed bonus +${rev.pts - 10}`}</span>}
              {rev.explanation && <span>{rev.explanation}</span>}
            </div>
            <button className="btn block qz-next qz-ic-btn" disabled={busy} onClick={next}>
              {rev.finished || idx + 1 >= DAILY_Q ? (bn ? "ফলাফল দেখুন" : "See result") : (bn ? "পরের প্রশ্ন" : "Next question")}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </>
        ) : picked != null ? <div className="qz-wait"><span className="spin sm" />{bn ? "উত্তর জমা হচ্ছে…" : "Locking in…"}</div> : null}
      </div>
    );
  }
  if (playing && !cur) {
    // মাঝপথে ফিরে এলে: পরের প্রশ্ন খোলা হয়নি
    return (
      <div className="sec">{switcher}
        <div className="card dl-hero">
          <div className="dl-hero-ic"><CalIcon width={30} height={30} /></div>
          <h2>{bn ? "চ্যালেঞ্জ চলছে" : "Challenge in progress"}</h2>
          <p className="muted">{bn ? `${num(st.play.idx, "bn")}/${num(DAILY_Q, "bn")} প্রশ্ন শেষ · ${num(st.play.raw, "bn")} পয়েন্ট` : `${st.play.idx}/${DAILY_Q} done · ${st.play.raw} pts`}</p>
          <button className="btn block dl-go" disabled={busy} onClick={next}>{bn ? "পরের প্রশ্নে চলুন" : "Continue"}</button>
        </div>
      </div>
    );
  }

  const nextIn = Math.max(0, Date.parse(st.next_at) - nowS);
  const hms = (() => { const t = Math.floor(nextIn / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s2 = t % 60; return [h, m, s2].map((x) => String(x).padStart(2, "0")).join(":"); })();
  const pl = st.play;

  const main = pl?.finished ? (
    <>
      {pl.correct >= 4 && <Celebrate code={"daily-" + st.day} />}
      <div className="card dl-done">
        <div className="dl-done-h"><CalIcon width={18} height={18} />{bn ? "আজকের চ্যালেঞ্জ শেষ" : "Today's challenge done"} · {dayLabel(st.day, lang, { short: true, abs: true })}</div>
        <div className="dl-score"><CountUp to={pl.correct} lang={lang} id={"dc" + st.day} /><small>/{num(DAILY_Q, lang)}</small></div>
        <div className={"dl-marks" + (MARKS_SEEN.has(st.day) ? " still" : "")} ref={() => { setTimeout(() => MARKS_SEEN.add(st.day), 1200); }}>{(pl.marks || []).map((ok, i) => <span key={i} className={ok ? "ok" : "bad"}>{ok ? "✓" : "✕"}</span>)}</div>
        <div className="dl-pts"><b><CountUp to={pl.points ?? pl.raw} lang={lang} id={"dp" + st.day} /></b> {bn ? "পয়েন্ট" : "points"}</div>
        {pl.correct === DAILY_Q && <div className="muted dl-break">{num(pl.raw, lang)} + {bn ? "নিখুঁত" : "perfect"} {num(10, lang)}</div>}
        <div className="dl-stats">
          <div><FlameIcon width={20} height={20} className="fl" /><b>{num(st.streak, lang)}</b><small>{bn ? "দিন টানা" : "day streak"}</small></div>
          <div><TrophyIcon width={20} height={20} /><b>{st.week?.rank ? `#${num(st.week.rank, lang)}` : "–"}</b><small>{bn ? "এই সপ্তাহে" : "this week"}</small></div>
          <div><TargetIcon width={20} height={20} /><b>{num(st.week?.points || 0, lang)}</b><small>{bn ? "সপ্তাহের পয়েন্ট" : "week pts"}</small></div>
        </div>
        <button className="btn block dl-share" onClick={() => shareDaily(st, lang, toast)}><ShareIcon width={18} height={18} />{bn ? "ফল শেয়ার করুন" : "Share result"}</button>
        <div className="dl-next">{bn ? "পরের চ্যালেঞ্জ" : "Next challenge in"} <b>{bn ? num(hms, "bn") : hms}</b></div>
      </div>
      {st.review && (
        <details className="card qz-review">
          <summary>{bn ? "আজকের প্রশ্ন আর সঠিক উত্তর" : "Today's questions & answers"}</summary>
          {st.review.map((r, i) => (
            <div key={i} className="qz-rv">
              <b>{num(i + 1, lang)}. {r.question}</b>
              <div className={r.choice === r.answer ? "ok" : "bad"}>{r.choice === r.answer ? "✓ " : "✗ "}{bn ? "সঠিক উত্তর" : "Answer"}: {r.options[r.answer]}{r.choice != null && r.choice !== r.answer ? ` · ${bn ? "আপনার" : "you"}: ${r.options[r.choice]}` : r.choice == null ? ` · ${bn ? "উত্তর দেননি" : "no answer"}` : ` · +${num(r.pts, lang)}`}</div>
              {r.explanation && <small className="muted">{r.explanation}</small>}
            </div>
          ))}
        </details>
      )}
    </>
  ) : (
    <div className="card dl-hero">
      <div className="dl-hero-top">
        <div className="dl-hero-ic"><CalIcon width={30} height={30} /></div>
        <div>
          <h2>{bn ? "আজকের চ্যালেঞ্জ" : "Today's challenge"}</h2>
          <div className="muted" style={{ fontSize: 13.5 }}>{dayLabel(st.day, lang, { abs: true })}</div>
        </div>
      </div>
      <div className="dl-chips">
        <span>{bn ? "৫টা প্রশ্ন" : "5 questions"}</span><span>{bn ? "প্রতিটায় ২০ সেকেন্ড" : "20s each"}</span><span>{bn ? "দিনে একবার" : "Once a day"}</span>
      </div>
      {st.streak > 0 && (
        <div className="dl-streak"><FlameIcon width={22} height={22} /><span><b>{bn ? `টানা ${num(st.streak, "bn")} দিন` : `${st.streak}-day streak`}</b><small>{bn ? "আজ খেলে ধারাবাহিকতা ধরে রাখুন" : "Play today to keep it going"}</small></span></div>
      )}
      <button className="btn block dl-go" disabled={busy} onClick={start}>{!user && !DEMO ? (bn ? "লগইন করে খেলুন" : "Log in to play") : (bn ? "চ্যালেঞ্জ শুরু করুন" : "Start the challenge")}</button>
      <div className="muted dl-meta">{st.players_today > 0 ? (bn ? `আজ ${num(st.players_today, "bn")} জন খেলেছেন · ` : `${st.players_today} played today · `) : ""}{bn ? "নতুন চ্যালেঞ্জ রাত ১২টায়" : "New challenge at midnight"}</div>
      <div className="dl-rules">
        <div><b>+১০</b><span>{bn ? "প্রতিটা সঠিক উত্তর" : "each right answer"}</span></div>
        <div><b>+৫</b><span>{bn ? "পর্যন্ত দ্রুততার বোনাস" : "speed bonus, max"}</span></div>
        <div><b>+১০</b><span>{bn ? "৫টাই সঠিক হলে" : "all 5 right"}</span></div>
        <div><b>{num(85, lang)}</b><span>{bn ? "দিনে সর্বোচ্চ পয়েন্ট" : "max points a day"}</span></div>
      </div>
    </div>
  );

  const side = (
    <>
      <div className="sec"><div className="sec-h"><h2>{bn ? "সাপ্তাহিক র‍্যাঙ্কিং" : "Weekly ranking"}</h2></div><WeekBoard /></div>
      {(user || DEMO) && <div className="sec"><div className="sec-h"><h2>{bn ? "আপনার ব্যাজ" : "Your badges"}</h2></div><div className="card">{prog ? <LevelBadges progress={prog} have={st.badges} /> : <BadgeGrid have={st.badges} />}</div></div>}
    </>
  );

  return (
    <>
      {pop && <NewBadgePop ids={pop} onClose={() => setPop(null)} />}
      {wide ? (
        <>
          <div className="pg-grid"><div className="pg-main"><div className="sec">{switcher}{main}</div></div><aside className="pg-side">{side}</aside></div>
        </>
      ) : (
        <div className="sec">{switcher}{main}{side}</div>
      )}
    </>
  );
}

// একই কুইজে একবারই উদযাপন (আবার লোড করলে নয়)
function Celebrate({ code }) {
  const [show] = useState(() => { try { if (sessionStorage.getItem("kk_qz_win_" + code)) return false; sessionStorage.setItem("kk_qz_win_" + code, "1"); } catch { /* ignore */ } return true; });
  useEffect(() => { if (show) quizAudio.sfx("win"); }, [show]);
  return show ? <Confetti /> : null;
}

// একই সংখ্যা একবার গুনে দেখানো হলে পরে ঢুকলে সরাসরি (প্রতিবার ১ থেকে গোনা নয়)
const COUNTED = new Set();
const MARKS_SEEN = new Set();
function CountUp({ to, lang, id }) {
  const key = id ? id + ":" + to : null;
  const [v, setV] = useState(() => (key && COUNTED.has(key) ? to : 0));
  useEffect(() => {
    if (key && COUNTED.has(key)) { setV(to); return; }
    if (key) COUNTED.add(key);
    let raf, t0;
    const step = (t) => { t0 ??= t; const k = Math.min(1, (t - t0) / 700); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{num(v, lang)}</>;
}

// খেলোয়াড়দের ছবি: খেলোয়াড়ের তালিকা বদলালে একবার আনা (একই নামের দুজন হলে ছবি নয়, আদ্যক্ষর)
function useQuizAvatars(code, players) {
  const [av, setAv] = useState({});
  const key = (players || []).map((p) => p.name).sort().join("|");
  useEffect(() => {
    if (!code || DEMO || !key) return;
    let alive = true;
    quizCall("quiz_avatars", { p_code: code }).then((rows) => {
      if (!alive) return;
      const m = {};
      for (const r of rows || []) m[r.name] = r.name in m ? null : r.avatar;
      setAv(m);
    }).catch(() => {});
    return () => { alive = false; };
  }, [code, key]);
  return av;
}

function QuizBoard({ players, lang, limit, lobby, code }) {
  const av = useQuizAvatars(code, players);
  const list = limit ? players.filter((p, i) => i < limit || p.me) : players;
  return (
    <div className="card qz-board">
      {list.map((p) => {
        const rank = players.indexOf(p);
        return (
          <div key={p.name + rank} className={"qz-pl" + (p.me ? " me" : "")}>
            {!lobby && <RankBadge rank={rank + 1} lang={lang} />}
            {av[p.name] || lobby ? <UserAvatar src={av[p.name]} name={p.name} size={lobby ? 36 : 30} /> : null}
            <span className="qz-nm">{p.name}{p.me ? (lang === "bn" ? " (আপনি)" : " (you)") : ""}{p.host ? <small> · {lang === "bn" ? "হোস্ট" : "host"}</small> : null}</span>
            {!lobby && <span className="qz-sc"><b>{num(p.score, lang)}</b><small>{secTxt(p.ms, lang)}</small></span>}
          </div>
        );
      })}
    </div>
  );
}

function QuizPage({ code, user, goProfile, toast }) {
  const { lang } = useT();
  const bn = lang === "bn";
  const nav = useNav();
  const [st, setSt] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [picked, setPicked] = useState({});
  const [, tick] = useState(0);
  const offset = useRef(0);
  const joined = useRef(false);
  const status = useRef(null);
  const reload = useRef(() => {});
  const playing = st?.status === "running";
  useEffect(() => {
    document.documentElement.classList.toggle("quiz-focus", playing);
    return () => document.documentElement.classList.remove("quiz-focus");
  }, [playing]);
  // মিউজিক: খেলা চলাকালীন বাজে, শেষ হলে বা পাতা ছাড়লে থামে
  const [soundOn, setSoundOn] = useState(quizAudio.on);
  useEffect(() => { if (playing && st?.phase !== "waiting") quizAudio.start(); else quizAudio.stop(); }, [playing, st?.phase]);
  useEffect(() => () => quizAudio.stop(), []);
  const toggleSound = () => { quizAudio.unlock(); quizAudio.setOn(!soundOn); setSoundOn(!soundOn); };
  // অগ্রগতির বিন্দু: কোন প্রশ্নে সঠিক/ভুল (এই কুইজের জন্য ফোনে মনে রাখে)
  const [marks, setMarks] = useState({});
  useEffect(() => { try { setMarks(JSON.parse(sessionStorage.getItem("kk_qz_" + code) || "{}")); } catch { setMarks({}); } }, [code]);
  useEffect(() => {
    const c = st?.current;
    if (st?.phase !== "reveal" || !c || marks[c.index]) return;
    const res = c.mine?.choice == null ? "miss" : c.mine.correct ? "ok" : "bad";
    const next = { ...marks, [c.index]: res };
    setMarks(next); try { sessionStorage.setItem("kk_qz_" + code, JSON.stringify(next)); } catch { /* ignore */ }
    quizAudio.sfx(res === "ok" ? "ok" : "bad");
  }, [st?.phase, st?.current?.index]);
  const quit = () => {
    if (window.confirm(bn ? "কুইজ ছেড়ে যাবেন? বাকি প্রশ্নগুলো উত্তর না দেওয়া হিসেবে ধরা হবে।" : "Leave the quiz? Remaining questions count as unanswered.")) nav.openQuiz(null, true);
  };

  // অবস্থা জানা: খেলা চলাকালীন প্রতি সেকেন্ডে, অপেক্ষার সময় একটু ধীরে
  useEffect(() => {
    if (!code) { setSt(null); return; }
    let alive = true, timer;
    setSt(null); setErr(""); setPicked({}); joined.current = false;
    // পরের খোঁজ: সাধারণত ০.৯–১.৬ সেকেন্ডে, কিন্তু ধাপ বদলের (প্রশ্ন শেষ, উত্তর দেখানো শেষ) ঠিক পরেই
    const nextDelay = (s) => {
      if (s.status !== "running") return 1600;
      if (!s.ends_at) return 1200; // নিজে শেষ করে অন্যদের অপেক্ষা
      return Math.max(120, Math.min(900, Date.parse(s.ends_at) - Date.parse(s.now) + 80));
    };
    let last = null;
    const load = async () => {
      clearTimeout(timer);
      try {
        const s = await quizCall("quiz_state", { p_code: code });
        if (!alive) return;
        offset.current = Date.parse(s.now) - Date.now();
        setSt(s); setErr(""); status.current = s.status; last = s;
        if (user && !joined.current && s.status === "lobby" && !s.players.some((p) => p.me)) {
          joined.current = true;
          await quizCall("quiz_join", { p_code: code }).catch((e) => setErr(quizMsg(e, lang)));
        }
        if (s.next_code && (s.member || s.players.some((p) => p.me))) { nav.openQuiz(s.next_code, true); return; }
      } catch (e) { if (alive) setErr(quizMsg(e, lang)); }
      if (alive) timer = setTimeout(load, last ? nextDelay(last) : 1600);
    };
    reload.current = () => alive && load();
    load();
    const t2 = setInterval(() => tick((x) => x + 1), 250);
    return () => { alive = false; clearTimeout(timer); clearInterval(t2); };
  }, [code, user?.id]);

  // solo = একা খেলা: বানিয়েই সঙ্গে সঙ্গে শুরু, অপেক্ষার ঘর ছাড়াই
  async function create(solo) {
    if (!user) { try { localStorage.setItem("kk_quiz", "new"); } catch { /* ignore */ } toast(bn ? "কুইজ খেলতে আগে লগইন করুন" : "Log in to play"); goProfile(); return; }
    setBusy(true);
    try {
      if (solo === true) quizAudio.unlock();
      const c = await quizCall("quiz_create", { n: QUIZ_N });
      if (solo === true) await quizCall("quiz_start", { p_code: c });
      nav.openQuiz(c, true);
    }
    catch (e) { setErr(quizMsg(e, lang)); }
    setBusy(false);
  }
  async function close() {
    setBusy(true);
    try { await quizCall("quiz_close", { p_code: code }); nav.openQuiz(null, true); }
    catch (e) { setErr(quizMsg(e, lang)); }
    setBusy(false);
  }
  async function next() { try { await quizCall("quiz_next", { p_code: code }); } catch { /* ৩ সেকেন্ড পরে এমনিতেই আসবে */ } reload.current(); }
  async function start() { quizAudio.unlock(); setBusy(true); try { await quizCall("quiz_start", { p_code: code }); reload.current(); } catch (e) { setErr(quizMsg(e, lang)); } setBusy(false); }
  async function again() {
    setBusy(true);
    try {
      const c = await quizCall("quiz_again", { p_code: code });
      if (st?.players?.length === 1) await quizCall("quiz_start", { p_code: c }); // একা খেলায় অপেক্ষার ঘর লাগে না
      nav.openQuiz(c, true);
    } catch (e) { setErr(quizMsg(e, lang)); }
    setBusy(false);
  }
  async function answer(i, choice) {
    quizAudio.unlock();
    if (picked[i] != null) return;
    setPicked((p) => ({ ...p, [i]: choice }));
    try { await quizCall("quiz_answer", { p_code: code, p_index: i, p_choice: choice }); reload.current(); }
    catch (e) { toast(quizMsg(e, lang)); }
  }

  // ── শুরুর পাতা ──
  if (!code) return (
    <div className="sec">
      <GameSwitch on="quiz" />
      <QuizSub on="live" />
      <div className="card qz-hero">
        <div className="qz-hero-ic"><QuizIcon width={34} height={34} /></div>
        <h2>{bn ? "স্পোর্টস কুইজ" : "Sports quiz"}</h2>
        <p className="muted">{bn ? "১০টা প্রশ্ন, প্রতিটায় ৩০ সেকেন্ড। একা খেলে নিজেকে যাচাই করুন, বা লিংক পাঠিয়ে বন্ধুদের সাথে লাইভ। সমান স্কোর হলে যে দ্রুত উত্তর দিয়েছে, সে এগিয়ে।" : "10 questions, 30 seconds each. Test yourself solo, or send a link and play live with friends. Ties go to the faster player."}</p>
        <div className="qz-modes">
          <button className="btn block qz-mode" disabled={busy} onClick={() => create(true)}><UserIcon width={20} height={20} /><span><b>{bn ? "একা খেলুন" : "Play solo"}</b><small>{bn ? "নিজেকে যাচাই করুন" : "Test yourself"}</small></span></button>
          <button className="btn ghost block qz-mode" disabled={busy} onClick={() => create(false)}><UsersIcon width={20} height={20} /><span><b>{bn ? "বন্ধুদের সাথে খেলুন" : "Play with friends"}</b><small>{bn ? "লিংক পাঠিয়ে লাইভ" : "Live, by link"}</small></span></button>
        </div>
      </div>
      <div className="card qz-join">
        <b>{bn ? "বন্ধুর কুইজে যোগ দিন" : "Join a friend's quiz"}</b>
        <form onSubmit={(e) => { e.preventDefault(); const c = joinCode.trim().toUpperCase(); if (c.length >= 4) nav.openQuiz(c); }}>
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder={bn ? "কোড লিখুন, যেমন 9A0FFC" : "Enter code"} maxLength={8} autoCapitalize="characters" />
          <button className="btn" disabled={joinCode.trim().length < 4}>{bn ? "যোগ দিন" : "Join"}</button>
        </form>
      </div>
      {err && <div className="err">{err}</div>}
    </div>
  );

  if (!st) return <div className="sec"><GameSwitch on="quiz" />{err ? <div className="card empty">{err}<div style={{ marginTop: 12 }}><button className="btn ghost" onClick={() => nav.openQuiz()}>{bn ? "কুইজের পাতায় ফিরুন" : "Back"}</button></div></div> : <Loading />}</div>;

  const me = st.players.find((p) => p.me);
  const myRank = st.players.indexOf(me);

  // শেষ হওয়া বা বন্ধ কুইজ: লিংক আর চলে না (খেলোয়াড়রা ফল দেখতে পান, হোস্ট বন্ধ করার আগ পর্যন্ত)
  if (st.status === "closed" || (st.status === "finished" && !me)) return (
    <div className="sec">
      <GameSwitch on="quiz" />
      <div className="card qz-hero">
        <div className="qz-hero-ic"><QuizIcon width={34} height={34} /></div>
        <h2>{bn ? "এই কুইজ শেষ হয়ে গেছে" : "This quiz has ended"}</h2>
        <p className="muted">{bn ? "লিংকটি আর চালু নেই। চাইলে নতুন একটা কুইজ শুরু করুন।" : "The link no longer works. Start a new quiz instead."}</p>
        <button className="btn block" onClick={() => nav.openQuiz(null, true)}>{bn ? "নতুন কুইজ খেলুন" : "Play a new quiz"}</button>
      </div>
    </div>
  );
  const el = st.started_at ? (Date.now() + offset.current - Date.parse(st.started_at)) / 1000 : 0;
  const cur = st.current;
  const intoQ = cur?.started_at ? (Date.now() + offset.current - Date.parse(cur.started_at)) / 1000 : 0;
  const left = Math.max(0, Math.ceil(st.q_seconds - intoQ));

  // ── অপেক্ষা (লবি) ──
  if (st.status === "lobby") return (
    <div className="sec">
      <GameSwitch on="quiz" />
      <div className="card qz-lobby">
        <small className="muted">{bn ? "কুইজের কোড" : "Quiz code"}</small>
        <div className="qz-code">{st.code}</div>
        <button className="btn ghost block qz-ic-btn" onClick={() => shareQuiz(st.code, bn, toast)}><ShareIcon width={18} height={18} />{bn ? "বন্ধুদের লিংক পাঠান" : "Send link to friends"}</button>
      </div>
      <div className="sec-h" style={{ marginTop: 14 }}><h2>{bn ? `খেলোয়াড় · ${num(st.players.length, "bn")} জন` : `Players · ${st.players.length}`}</h2></div>
      <QuizBoard players={st.players} lang={lang} lobby code={code} />
      {!user ? (
        <div className="card empty">{bn ? "এই কুইজে খেলতে আগে লগইন করুন।" : "Log in to play this quiz."}<div style={{ marginTop: 10 }}><button className="btn" onClick={() => { try { localStorage.setItem("kk_quiz", st.code); } catch { /* ignore */ } goProfile(); }}>{bn ? "লগইন করুন" : "Log in"}</button></div></div>
      ) : st.is_host ? (
        <button className="btn block qz-go qz-ic-btn" disabled={busy} onClick={start}>{busy ? "…" : <><PlayIcon width={18} height={18} />{bn ? (st.players.length > 1 ? "সবাই এসেছে? শুরু করুন" : "একা শুরু করুন") : "Start"}</>}</button>
      ) : <div className="qz-wait"><span className="spin sm" />{bn ? "হোস্ট শুরু করলেই খেলা শুরু হবে…" : "Waiting for the host to start…"}</div>}
      {err && <div className="err">{err}</div>}
    </div>
  );

  // ── শেষ ──
  if (st.status === "finished") return (
    <div className="sec">
      <GameSwitch on="quiz" />
      {me && (me.score >= 8 || (st.players.length > 1 && myRank === 0 && me.score > 0)) && <Celebrate code={st.code} />}
      {me ? (
        <div className="card qz-result">
          <div className="qz-big">{st.players.length > 1 ? <RankBadge rank={myRank + 1} lang={lang} big /> : <span className="qz-badge big r1"><TrophyIcon width={30} height={30} /></span>}</div>
          <h2>{st.players.length > 1 ? (bn ? `আপনি ${num(st.players.length, "bn")} জনের মধ্যে ${ord(myRank + 1, "bn")}` : `You finished ${ord(myRank + 1, "en")} of ${st.players.length}`) : (bn ? "কুইজ শেষ!" : "Quiz over!")}</h2>
          <div className="qz-score"><CountUp to={me.score} lang={lang} /><small>/{num(st.total, lang)}</small></div>
          <div className="muted">{bn ? `সঠিক উত্তর · মোট সময় ${secTxt(me.ms, "bn")}` : `correct · total time ${secTxt(me.ms, "en")}`}</div>
        </div>
      ) : <div className="card empty">{bn ? "কুইজ শেষ। আপনি এই কুইজে ছিলেন না।" : "This quiz is over."}</div>}
      {st.players.length > 1 && <><div className="sec-h" style={{ marginTop: 14 }}><h2>{bn ? "ফলাফল" : "Results"}</h2></div><QuizBoard players={st.players} lang={lang} code={code} /></>}
      <div className="qz-actions">
        {st.is_host ? (
          <>
            <button className="btn block qz-ic-btn" disabled={busy} onClick={again}><ReplayIcon width={18} height={18} />{bn ? "আবার খেলুন (নতুন ১০টা প্রশ্ন)" : "Play again"}</button>
            <button className="btn ghost block" disabled={busy} onClick={close}>{bn ? "না, খেলা শেষ করুন" : "No, end the game"}</button>
            {st.players.length > 1 && <small className="muted qz-note">{bn ? "খেলা শেষ করলে এই লিংকটি আর কাজ করবে না।" : "Ending closes this link for everyone."}</small>}
          </>
        ) : (
          <>
            <div className="qz-wait"><span className="spin sm" />{bn ? "হোস্ট আবার খেললে নিজে থেকেই যোগ হয়ে যাবেন" : "You'll join automatically if the host plays again"}</div>
            <button className="btn ghost block" onClick={() => nav.openQuiz(null, true)}>{bn ? "বের হোন" : "Leave"}</button>
          </>
        )}
      </div>
      {st.review && (
        <details className="card qz-review">
          <summary>{bn ? "সব প্রশ্ন আর সঠিক উত্তর দেখুন" : "Review answers"}</summary>
          {st.review.map((r, i) => (
            <div key={i} className="qz-rv">
              <b>{num(i + 1, lang)}. {r.question}</b>
              <div className={r.choice === r.answer ? "ok" : "bad"}>{r.choice === r.answer ? "✓ " : "✗ "}{bn ? "সঠিক উত্তর" : "Answer"}: {r.options[r.answer]}{r.choice != null && r.choice !== r.answer ? ` · ${bn ? "আপনার" : "you"}: ${r.options[r.choice]}` : r.choice == null ? ` · ${bn ? "উত্তর দেননি" : "no answer"}` : ""}</div>
              {r.explanation && <small className="muted">{r.explanation}</small>}
            </div>
          ))}
        </details>
      )}
      {err && <div className="err">{err}</div>}
    </div>
  );

  // ── চলছে ──
  if (st.phase === "countdown") return (
    <div className="sec"><div className="qz-count" key={Math.ceil(-el)}>{num(Math.max(1, Math.ceil(-el)), lang)}</div><p className="muted" style={{ textAlign: "center" }}>{bn ? "প্রস্তুত হোন…" : "Get ready…"}</p></div>
  );
  if (st.phase === "waiting") return (
    <div className="sec">
      <div className="card qz-result">
        <div className="qz-big"><span className="qz-badge big r1"><TrophyIcon width={30} height={30} /></span></div>
        <h2>{bn ? "আপনি সব প্রশ্ন শেষ করেছেন!" : "You're done!"}</h2>
        {me && <div className="qz-score"><CountUp to={me.score} lang={lang} /><small>/{num(st.total, lang)}</small></div>}
        <div className="qz-wait"><span className="spin sm" />{bn ? `অন্যদের শেষ হওয়ার অপেক্ষা · ${num(st.finished_count, "bn")}/${num(st.players.length, "bn")} জন শেষ করেছেন` : `Waiting for others · ${st.finished_count}/${st.players.length} done`}</div>
        <small className="muted">{bn ? "সবাই শেষ করলেই কে কততম, দেখা যাবে।" : "Rankings appear when everyone finishes."}</small>
      </div>
    </div>
  );
  if (st.phase === "watching") return <div className="sec"><GameSwitch on="quiz" /><div className="card empty">{bn ? "খেলা চলছে। আপনি এই কুইজে নেই।" : "A quiz is in progress. You're not in it."}</div></div>;
  if (!cur) return <div className="sec"><Loading /></div>;
  const mine = cur.mine?.choice ?? picked[cur.index];
  const reveal = st.phase === "reveal";
  return (
    <div className="sec qz-play">
      <div className="qz-top">
        <button className="qz-x" onClick={quit} aria-label={bn ? "কুইজ ছেড়ে যান" : "Leave quiz"}>✕</button>
        <span className="qz-dots" aria-label={bn ? `প্রশ্ন ${num(cur.index + 1, "bn")}/${num(st.total, "bn")}` : `Question ${cur.index + 1} of ${st.total}`}>
          {Array.from({ length: st.total }, (_, i) => <i key={i} className={marks[i] || (i === cur.index ? "cur" : "")} />)}
        </span>
        <button className="qz-x" onClick={toggleSound} aria-label={soundOn ? (bn ? "শব্দ বন্ধ" : "Mute") : (bn ? "শব্দ চালু" : "Unmute")}><SoundIcon off={!soundOn} width={16} height={16} /></button>
      </div>
      <div className="qz-sub"><span>{bn ? `প্রশ্ন ${num(cur.index + 1, "bn")}/${num(st.total, "bn")}` : `Q ${cur.index + 1}/${st.total}`} · {cur.category}</span>{me && <span className="qz-myscore">{bn ? "স্কোর" : "Score"} {num(me.score, lang)}</span>}</div>
      <div className="qz-timer"><i style={{ width: reveal ? 0 : `${Math.max(0, (st.q_seconds - intoQ) / st.q_seconds) * 100}%` }} className={left <= 5 && !reveal ? "low" : ""} /></div>
      {!reveal && <div className={"qz-left" + (left <= 5 ? " low" : "")}>{num(left, lang)}</div>}
      <div className="qz-stage" key={cur.index}>
      <h2 className="qz-q">{cur.question}</h2>
      <div className="qz-opts">
        {cur.options.map((o, i) => {
          const cls = reveal ? (i === cur.answer ? " right" : i === mine ? " wrong" : " dim") : mine === i ? " picked" : mine != null ? " dim" : "";
          return <button key={i} style={{ animationDelay: `${120 + i * 70}ms` }} className={"qz-opt" + cls} disabled={!me || reveal || mine != null} onClick={() => answer(cur.index, i)}><span className="qz-l">{bn ? LETTERS[i] : "ABCD"[i]}</span>{o}</button>;
        })}
      </div>
      </div>
      {reveal ? (
        <div className={"qz-verdict " + (mine === cur.answer ? "ok" : "bad")}>
          <b>{mine === cur.answer ? (bn ? "✓ সঠিক!" : "✓ Correct!") : mine == null ? (bn ? "সময় শেষ" : "Time's up") : (bn ? "✗ ভুল" : "✗ Wrong")}</b>
          {cur.explanation && <span>{cur.explanation}</span>}
        </div>
      ) : null}
      {reveal ? (
        <button className="btn block qz-next qz-ic-btn" onClick={next} ref={(el) => el && !el.dataset.seen && (el.dataset.seen = "1", setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60))}>{cur.index + 1 >= st.total ? (bn ? "শেষ করুন" : "Finish") : (bn ? "পরের প্রশ্ন" : "Next question")}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      ) : mine != null ? (
        <div className="qz-wait"><span className="spin sm" />{bn ? "উত্তর জমা হচ্ছে…" : "Locking in…"}</div>
      ) : !me ? <div className="qz-wait">{bn ? "আপনি এই কুইজে নেই, শুধু দেখছেন।" : "You're watching."}</div> : null}
    </div>
  );
}

export { Celebrate, Confetti, CountUp, DailyPage, LETTERS, NewBadgePop, QUIZ_ERR, QUIZ_N, QuizBoard, QuizPage, QuizSub, SoundIcon, WeekBoard, demoQuiz, demoQuizCall, makeDailyCard, markBadgesSeen, quizAudio, quizCall, quizLink, quizMsg, secTxt, seenBadges, shareDaily, shareQuiz, useQuizAvatars };
