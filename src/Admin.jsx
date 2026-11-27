// Admin.jsx: App.jsx থেকে আলাদা (দরকার হলে তখনই নামে)
import { useEffect, useState } from "react";
import { BN_DAYS_SHORT, DEMO, Loading, Logo, S, answer, everyMin, ls, num, ok, sb, timeLabel } from "./App.jsx";

const agoBn = (iso) => {
  if (!iso) return "—";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 1 ? "এইমাত্র" : m < 60 ? `${num(m, "bn")} মিনিট আগে` : m < 1440 ? `${num(Math.round(m / 60), "bn")} ঘণ্টা আগে` : `${num(Math.round(m / 1440), "bn")} দিন আগে`;
};
const uaShort = (ua) => (!ua ? "" : `${/iPhone|iPad/.test(ua) ? "আইফোন" : /Android/.test(ua) ? "অ্যান্ড্রয়েড" : /Windows/.test(ua) ? "উইন্ডোজ" : /Mac/.test(ua) ? "ম্যাক" : "অন্য"} · ${/SamsungBrowser/.test(ua) ? "স্যামসাং" : /Edg\//.test(ua) ? "এজ" : /Firefox/.test(ua) ? "ফায়ারফক্স" : /Chrome/.test(ua) ? "ক্রোম" : /Safari/.test(ua) ? "সাফারি" : "ব্রাউজার"}`);
const ADMIN_TABS = [["ov", "ওভারভিউ"], ["live", "ম্যাচ"], ["quiz", "কুইজ"], ["usage", "ব্যবহার"], ["users", "ইউজার"], ["errors", "এরর"], ["news", "ঘোষণা"], ["sync", "আপডেট"]];
const RUN_LIST = [
  ["fd-quick", "আজকের ম্যাচ (ইউরোপের ৬ লিগ)", "গতকাল থেকে আগামীকাল পর্যন্ত স্কোর আর সময়"],
  ["fd-full", "পুরো সূচি (ইউরোপের ৬ লিগ)", "সিজনের সব ম্যাচ নতুন করে"],
  ["fd-tables", "পয়েন্ট টেবিল (ইউরোপের ৬ লিগ)", ""],
  ["fd-scorers", "গোলদাতার তালিকা (ইউরোপের ৬ লিগ)", ""],
  ["af-tables", "রিয়েল টাইম টেবিল (সব লিগ)", "খেলার ফল থেকে টেবিল আবার হিসাব"],
  ["af:BAN", "বাংলাদেশ জাতীয় দল", "শেষ ১০ আর সামনের ১০ ম্যাচ"],
  ["af:BPL", "বাংলাদেশ ফুটবল লিগ", ""],
  ["af:BFC", "ফেডারেশন কাপ", ""],
  ["af-all", "বাকি সব লিগ একসাথে", "সময় লাগে (১ মিনিট পর্যন্ত), বেশি API কল খরচ হয়"],
  ["remind", "রিমাইন্ডার আর প্রেডিকশনের ফল", "যার যা পাওনা, এখনই পাঠানো"],
];
const SEC_BN = { matches: "ম্যাচের তালিকা", match: "ম্যাচের পাতা", leagues: "লিগ ট্যাব", league: "লিগের পাতা", team: "দলের পাতা", player: "প্লেয়ার", predict: "প্রেডিকশন", quiz: "কুইজ ও চ্যালেঞ্জ", ask: "জিজ্ঞেস করুন", profile: "প্রোফাইল", bangladesh: "বাংলাদেশ দল", pages: "অন্যান্য পাতা", admin: "অ্যাডমিন", other: "অন্যান্য" };
const SRC_BN = { facebook: "ফেসবুক", google: "গুগল সার্চ", search: "অন্য সার্চ", app: "ইনস্টল করা অ্যাপ", direct: "সরাসরি লিংক", x: "এক্স (টুইটার)", youtube: "ইউটিউব", instagram: "ইনস্টাগ্রাম", other: "অন্য সাইট", unknown: "অজানা" };
const PLAT_BN = { android: "অ্যান্ড্রয়েড ব্রাউজার", "android-app": "অ্যান্ড্রয়েড অ্যাপ", ios: "আইফোন ব্রাউজার", "ios-app": "আইফোন অ্যাপ", desktop: "কম্পিউটার", "desktop-app": "কম্পিউটার অ্যাপ", unknown: "অজানা" };
const minBn = (m) => (m >= 60 ? `${num(Math.floor(m / 60), "bn")} ঘ ${num(m % 60, "bn")} মি` : `${num(m, "bn")} মি`);
// ── অ্যাডমিন: কুইজের খুঁটিনাটি (কে কখন খেলল, কত সময়ে শেষ করল, কত পেল, কোন প্রশ্ন কঠিন) ──
const bdDayStr = (t = Date.now()) => new Date(t + 6 * 3600000).toISOString().slice(0, 10);
const durBn = (ms) => {
  if (ms == null || !isFinite(ms) || ms < 0) return "–";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${num(s, "bn")} সে` : `${num(Math.floor(s / 60), "bn")} মি ${num(s % 60, "bn")} সে`;
};
const clockBn = (iso) => { if (!iso) return "–"; const d = new Date(Date.parse(iso) + 6 * 3600000); const h = d.getUTCHours(); const part = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত"; return `${part} ${num(h % 12 || 12, "bn")}:${num(String(d.getUTCMinutes()).padStart(2, "0"), "bn")}`; };
const dayBn = (d) => { const x = new Date(d + "T00:00:00Z"); return `${num(x.getUTCDate(), "bn")} ${["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টে", "অক্টো", "নভে", "ডিসে"][x.getUTCMonth()]}`; };
function AdminQuiz({ fetchQ }) {
  const today = bdDayStr();
  const [range, setRange] = useState("today");
  const [day, setDay] = useState(today);
  const [mode, setMode] = useState("daily");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("points");
  const [q, setQ] = useState("");
  const [minC, setMinC] = useState(0);
  const [open, setOpen] = useState(null);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const span = range === "today" ? [today, today] : range === "yday" ? [bdDayStr(Date.now() - 86400000), bdDayStr(Date.now() - 86400000)]
    : range === "7" ? [bdDayStr(Date.now() - 6 * 86400000), today] : range === "30" ? [bdDayStr(Date.now() - 29 * 86400000), today] : [day, day];
  useEffect(() => {
    let a = true; setData(null); setErr(false);
    const go = () => fetchQ(`quiz=1&from=${span[0]}&to=${span[1]}`).then((x) => a && (x?.ok ? setData(x) : setErr(true))).catch(() => a && setErr(true));
    go();
    const stop = everyMin(go);
    return () => { a = false; stop(); };
  }, [span[0], span[1]]);

  const Seg = ({ v, set, opts }) => <div className="aq-seg">{opts.map(([k, l]) => <button key={k} className={v === k ? "on" : ""} onClick={() => set(k)}>{l}</button>)}</div>;
  const filters = (
    <div className="card aq-f">
      <Seg v={range} set={setRange} opts={[["today", "আজ"], ["yday", "গতকাল"], ["7", "৭ দিন"], ["30", "৩০ দিন"], ["day", "নির্দিষ্ট দিন"]]} />
      {range === "day" && <input type="date" value={day} max={today} onChange={(e) => e.target.value && setDay(e.target.value)} />}
      <Seg v={mode} set={setMode} opts={[["daily", "দৈনিক চ্যালেঞ্জ"], ["rooms", "কুইজ রুম"]]} />
      {mode === "daily" && <>
        <Seg v={status} set={setStatus} opts={[["all", "সবাই"], ["done", "শেষ করেছেন"], ["left", "মাঝপথে ছেড়েছেন"]]} />
        <div className="aq-row">
          <label>সাজানো<select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="points">বেশি পয়েন্ট আগে</option><option value="fast">কম সময়ে শেষ আগে</option><option value="slow">বেশি সময় আগে</option>
            <option value="correct">বেশি সঠিক আগে</option><option value="early">আগে খেলেছেন আগে</option><option value="late">পরে খেলেছেন আগে</option><option value="streak">বড় স্ট্রিক আগে</option>
          </select></label>
          <label>কমপক্ষে সঠিক<select value={minC} onChange={(e) => setMinC(+e.target.value)}>{[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n ? num(n, "bn") + "টি" : "যেকোনো"}</option>)}</select></label>
        </div>
      </>}
      <input className="aq-search" placeholder="নাম দিয়ে খুঁজুন" value={q} onChange={(e) => setQ(e.target.value)} />
    </div>
  );
  if (err) return <>{filters}<div className="card empty">তথ্য আনা গেল না। একটু পরে আবার চেষ্টা করুন।</div></>;
  if (!data) return <>{filters}<Loading /></>;

  const nm = (u) => data.names[u] || "নাম নেই";
  const match = (u) => !q.trim() || nm(u).toLowerCase().includes(q.trim().toLowerCase());

  if (mode === "rooms") {
    const rooms = data.rooms.map((r) => {
      const ps = data.roomPlayers.filter((p) => p.room_id === r.id).map((p) => {
        const an = data.roomAnswers.filter((a) => a.room_id === r.id && a.user_id === p.user_id);
        return { uid: p.user_id, name: p.display_name || nm(p.user_id), correct: an.filter((a) => a.correct).length, answered: an.length, ms: an.reduce((n, a) => n + (a.ms || 0), 0) };
      }).sort((a, b) => b.correct - a.correct || a.ms - b.ms);
      return { ...r, ps, total: (r.question_ids || []).length };
    }).filter((r) => r.ps.some((p) => match(p.uid) || (p.name || "").toLowerCase().includes(q.trim().toLowerCase())));
    return (
      <>
        {filters}
        <div className="adm-grid">
          <div className="adm-tile"><b>{num(rooms.length, "bn")}</b><small>কুইজ রুম</small></div>
          <div className="adm-tile"><b>{num(rooms.reduce((n, r) => n + r.ps.length, 0), "bn")}</b><small>মোট অংশগ্রহণ</small></div>
        </div>
        {!rooms.length ? <div className="card empty">এই সময়ে কোনো কুইজ রুম নেই।</div> : rooms.map((r) => (
          <div key={r.id} className="card aq-room">
            <div className="aq-room-h"><b>{r.code}</b><span className="muted">{dayBn(bdDayStr(Date.parse(r.created_at)))} · {clockBn(r.created_at)} · {num(r.total, "bn")} প্রশ্ন · {r.status === "finished" || r.status === "closed" ? "শেষ" : r.status === "running" ? "চলছে" : "লবিতে"}</span></div>
            {r.ps.map((p, i) => <div key={p.uid} className="aq-rp"><span>{num(i + 1, "bn")}. {p.name}{p.uid === r.host ? <small className="muted"> (হোস্ট)</small> : null}</span><span>{num(p.correct, "bn")}/{num(r.total, "bn")} সঠিক</span><span className="muted">{durBn(p.ms)}</span></div>)}
          </div>
        ))}
      </>
    );
  }

  const qById = Object.fromEntries(data.questions.map((x) => [x.id, x]));
  const ansBy = {};
  for (const a of data.answers) (ansBy[a.user_id + "|" + a.day] ||= []).push(a);
  let rows = data.plays.map((p) => {
    const an = (ansBy[p.user_id + "|" + p.day] || []).sort((a, b) => a.q_index - b.q_index);
    const think = an.reduce((n, a) => n + (a.ms || 0), 0);
    const total = p.finished_at ? Date.parse(p.finished_at) - Date.parse(p.started_at) : null;
    return { ...p, an, think, total, done: !!p.finished_at };
  });
  const all = rows;
  rows = rows.filter((r) => match(r.user_id) && (status === "all" || (status === "done" ? r.done : !r.done)) && r.correct >= minC);
  const S = { points: (a, b) => (b.points ?? -1) - (a.points ?? -1) || a.think - b.think, fast: (a, b) => (a.total ?? 1e12) - (b.total ?? 1e12), slow: (a, b) => (b.total ?? -1) - (a.total ?? -1),
    correct: (a, b) => b.correct - a.correct || a.think - b.think, early: (a, b) => Date.parse(a.started_at) - Date.parse(b.started_at), late: (a, b) => Date.parse(b.started_at) - Date.parse(a.started_at), streak: (a, b) => b.streak - a.streak };
  rows.sort(S[sort]);
  const done = rows.filter((r) => r.done);
  const avg = (xs) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : null);
  const multi = span[0] !== span[1];
  // প্রশ্ন ধরে: কতজন ঠিক, গড় সময় (একদিন বাছাই করলে)
  const set = !multi ? data.sets.find((x) => x.day === span[0]) : null;
  const perQ = set ? (set.question_ids || []).map((qid, i) => {
    const an = data.answers.filter((a) => a.day === span[0] && a.q_index === i);
    return { i, q: qById[qid], n: an.length, ok: an.filter((a) => a.correct).length, ms: avg(an.map((a) => a.ms)) };
  }) : [];
  const days = multi ? [...new Set(all.map((r) => r.day))].sort().reverse().map((d) => {
    const r = all.filter((x) => x.day === d), f = r.filter((x) => x.done);
    return { d, n: r.length, f: f.length, pts: avg(f.map((x) => x.points || 0)), t: avg(f.map((x) => x.total)), c: avg(f.map((x) => x.correct)) };
  }) : [];
  return (
    <>
      {filters}
      <div className="adm-grid">
        <div className="adm-tile"><b>{num(rows.length, "bn")}</b><small>খেলেছেন</small></div>
        <div className="adm-tile"><b>{num(done.length, "bn")}</b><small>শেষ করেছেন</small></div>
        <div className="adm-tile"><b>{durBn(avg(done.map((r) => r.total)))}</b><small>গড় সময়</small></div>
        <div className="adm-tile"><b>{avg(done.map((r) => r.correct)) == null ? "–" : num(Math.round(avg(done.map((r) => r.correct)) * 10) / 10, "bn")}/৫</b><small>গড় সঠিক</small></div>
        <div className="adm-tile"><b>{avg(done.map((r) => r.points || 0)) == null ? "–" : num(Math.round(avg(done.map((r) => r.points || 0))), "bn")}</b><small>গড় পয়েন্ট</small></div>
        <div className="adm-tile"><b>{done.length ? durBn(Math.min(...done.map((r) => r.total))) : "–"}</b><small>সবচেয়ে দ্রুত</small></div>
      </div>
      {multi && days.length > 0 && <>
        <div className="adm-h">দিন ধরে</div>
        <div className="card aq-tbl"><div className="aq-tr aq-th"><span>দিন</span><span>খেলেছেন</span><span>শেষ</span><span>গড় সময়</span><span>গড় সঠিক</span><span>গড় পয়েন্ট</span></div>
          {days.map((x) => <div key={x.d} className="aq-tr"><span>{dayBn(x.d)}</span><span>{num(x.n, "bn")}</span><span>{num(x.f, "bn")}</span><span>{durBn(x.t)}</span><span>{x.c == null ? "–" : num(Math.round(x.c * 10) / 10, "bn")}</span><span>{x.pts == null ? "–" : num(Math.round(x.pts), "bn")}</span></div>)}
        </div>
      </>}
      {perQ.length > 0 && <>
        <div className="adm-h">প্রশ্ন ধরে <span className="muted">কোনটা কঠিন ছিল</span></div>
        <div className="card aq-qs">
          {perQ.map((x) => { const pc = x.n ? Math.round((x.ok / x.n) * 100) : 0; return (
            <div key={x.i} className="aq-q">
              <div className="aq-q-t"><b>{num(x.i + 1, "bn")}.</b> {x.q?.question || "প্রশ্ন পাওয়া যায়নি"}{x.q && <small className="muted"> · উত্তর: {x.q.options?.[x.q.answer]}</small>}</div>
              <div className="aq-bar"><i style={{ width: pc + "%" }} className={pc < 35 ? "bad" : pc < 65 ? "mid" : ""} /></div>
              <small className="muted">{num(pc, "bn")}% সঠিক ({num(x.ok, "bn")}/{num(x.n, "bn")}) · গড়ে {durBn(x.ms)}</small>
            </div>); })}
        </div>
      </>}
      <div className="adm-h">প্রত্যেকের হিসাব <span className="muted">{num(rows.length, "bn")} জন</span></div>
      {!rows.length ? <div className="card empty">এই ফিল্টারে কেউ নেই।</div> : (
        <div className="card aq-list">
          {rows.map((r, i) => {
            const k = r.user_id + r.day;
            return (
              <div key={k} className="aq-p">
                <button className="aq-p-h" onClick={() => setOpen(open === k ? null : k)}>
                  <span className="aq-rank">{num(i + 1, "bn")}</span>
                  <span className="aq-who"><b>{nm(r.user_id)}</b><small className="muted">{multi ? dayBn(r.day) + " · " : ""}{clockBn(r.started_at)}{r.done ? "" : " · মাঝপথে"}{r.streak > 1 ? ` · স্ট্রিক ${num(r.streak, "bn")}` : ""}</small></span>
                  <span className="aq-dots">{[0, 1, 2, 3, 4].map((j) => { const a = r.an.find((x) => x.q_index === j); return <i key={j} className={!a ? "" : a.correct ? "ok" : "no"} />; })}</span>
                  <span className="aq-num"><b>{r.points == null ? "–" : num(r.points, "bn")}</b><small className="muted">{r.done ? durBn(r.total) : `${num(r.idx, "bn")}/৫`}</small></span>
                </button>
                {open === k && (
                  <div className="aq-more">
                    <div className="muted">শুরু {clockBn(r.started_at)}{r.done ? ` · শেষ ${clockBn(r.finished_at)} · মোট ${durBn(r.total)} · উত্তর ভাবতে ${durBn(r.think)}` : " · মাঝপথে ছেড়েছেন"}</div>
                    <div className="aq-qgrid">
                      {[0, 1, 2, 3, 4].map((j) => {
                        const a = r.an.find((x) => x.q_index === j), qq = a ? qById[a.qid] : null;
                        if (!a) return <div key={j} className="aq-qb none"><div className="aq-qb-h"><b>প্রশ্ন {num(j + 1, "bn")}</b><span>খেলেননি</span></div><div className="aq-qb-p">–</div></div>;
                        const bonus = a.correct ? Math.max(0, a.pts - 10) : 0;
                        return (
                          <div key={j} className={"aq-qb " + (a.correct ? "ok" : "no")}>
                            <div className="aq-qb-h"><b>প্রশ্ন {num(j + 1, "bn")}</b><span>{a.correct ? "সঠিক" : a.choice == null ? "সময় শেষ" : "ভুল"} · {durBn(a.ms)}</span></div>
                            <div className="aq-qb-p">{a.correct ? <>১০ <small>সঠিক</small> + {num(bonus, "bn")} <small>দ্রুততা</small> = <b>{num(a.pts, "bn")}</b></> : <b>০</b>}</div>
                            <div className="aq-qb-q">{qq?.question || "প্রশ্ন"}</div>
                            <div className="aq-qb-a">{a.choice == null ? "উত্তর দেননি" : `উত্তর: ${qq?.options?.[a.choice] ?? "–"}`}{!a.correct && qq ? ` · সঠিক: ${qq.options?.[qq.answer]}` : ""}</div>
                          </div>
                        );
                      })}
                    </div>
                    {(() => {
                      const perfect = r.done && r.correct === 5 ? 10 : 0;
                      const calc = r.raw + perfect;
                      return (
                        <div className="aq-sum">
                          <div className="aq-sb"><small>৫ প্রশ্নের পয়েন্ট</small><b>{num(r.raw, "bn")}</b></div>
                          <i>+</i>
                          <div className={"aq-sb" + (perfect ? " hi" : "")}><small>পারফেক্ট বোনাস</small><b>{num(perfect, "bn")}</b><em>{perfect ? "৫টাই সঠিক" : "৫টা সঠিক হলে +১০"}</em></div>
                          <i>=</i>
                          <div className="aq-sb total"><small>{r.done ? "দিনের পয়েন্ট" : "এখন পর্যন্ত"}</small><b>{num(r.done ? (r.points ?? calc) : r.raw, "bn")}</b>{r.done && r.points != null && r.points !== calc && <em>নতুন নিয়মে {num(calc, "bn")} (আগের গুণকসহ হিসাব)</em>}</div>
                          <div className="aq-sb"><small>স্ট্রিক</small><b>{num(r.streak, "bn")}</b><em>দিন টানা · পয়েন্টে প্রভাব নেই</em></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
function AdminApp({ user, toast, goProfile, onExit }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState(() => ls.get("adm_tab", "ov"));
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState("");
  const [runOut, setRunOut] = useState({});
  const [bc, setBc] = useState({ title: "", body: "", url: "/" });
  const [allM, setAllM] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { if (tab !== "live") return; const i = setInterval(() => tick((x) => x + 1), 20000); return () => clearInterval(i); }, [tab]);
  useEffect(() => { ls.set("adm_tab", tab); window.scrollTo(0, 0); }, [tab]);
  const call = async (body) => {
    const { data } = await sb.auth.getSession();
    const tk = data?.session?.access_token;
    if (!tk) throw Object.assign(new Error("login"), { code: 401 });
    const r = await fetch("/api/admin", body ? { method: "POST", headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" }, body: JSON.stringify(body) } : { headers: { Authorization: `Bearer ${tk}` } });
    if (r.status === 401 || r.status === 403) throw Object.assign(new Error("no"), { code: r.status });
    return r.json();
  };
  const fetchQ = async (qs) => {
    const { data } = await sb.auth.getSession();
    const tk = data?.session?.access_token;
    const r = await fetch("/api/admin?" + qs, { headers: { Authorization: `Bearer ${tk}` } });
    return r.json();
  };
  const load = () => call().then((x) => { setD(x); setErr(""); }).catch((e) => setErr(e.code === 403 ? "forbidden" : e.code === 401 ? "login" : "x"));
  useEffect(() => { if (DEMO) { setErr("x"); return; } if (user) load(); const i = setInterval(() => !document.hidden && user && load(), 60000); return () => clearInterval(i); }, [user?.id]);
  const errText = (e) => `[খেলা কখন এরর] ${e.count}× · ${e.msg}\nপাতা: ${e.url || "-"}\nডিভাইস: ${e.ua || "-"}\nসংস্করণ: ${e.build || "-"} · প্রথম ${e.first_seen} · শেষ ${e.last_seen}\nকোডের জায়গা: ${e.src || "-"}\n${(e.stack || "").slice(0, 1500)}`;
  const copy = async (txt) => { try { await navigator.clipboard.writeText(txt); toast("কপি হয়েছে, এখন Claude-এর চ্যাটে পেস্ট করুন"); } catch { window.prompt("কপি করুন:", txt); } };
  const fix = async (fp) => { await call(fp ? { fix: fp } : { fixAll: true }).catch(() => {}); toast(fp ? "তালিকা থেকে সরানো হয়েছে" : "সব সরানো হয়েছে"); load(); };
  const run = async (k) => {
    setBusy(k); setRunOut((o) => ({ ...o, [k]: null }));
    const r = await call({ run: k }).catch(() => ({ ok: false }));
    setBusy(""); setRunOut((o) => ({ ...o, [k]: r }));
    toast(r.ok ? "আপডেট হয়ে গেছে" : "আপডেট করা গেল না");
  };
  const send = async (test) => {
    if (!bc.title.trim()) return toast("শিরোনাম লিখুন");
    if (!test && !window.confirm(`নোটিফিকেশন চালু থাকা ${num(d?.pushUsers ?? 0, "bn")} জনের কাছে পাঠাবেন?`)) return;
    setBusy(test ? "bc-test" : "bc");
    const r = await call({ broadcast: { ...bc, test } }).catch(() => ({ ok: false }));
    setBusy("");
    toast(r.ok ? (test ? "শুধু আপনার ফোনে পাঠানো হয়েছে" : `${num(r.users ?? 0, "bn")} জনের কাছে পাঠানো হয়েছে`) : "পাঠানো গেল না");
    if (r.ok && !test) setBc({ title: "", body: "", url: "/" });
  };

  // হাতে ম্যাচ আপডেট: চাপ দিলেই সার্ভারে যায়, উত্তর এলে তালিকায় বসে
  const [minIn, setMinIn] = useState({});
  const [gf, setGf] = useState(null);   // গোলের ফর্ম: {id, s, m, p}
  const act = async (m, action, ask, min, goal) => {
    if (ask && !window.confirm(ask)) return;
    setBusy(m.id + action);
    const r = await call({ manual: { id: m.id, action, min, goal } }).catch(() => ({ ok: false }));
    setBusy("");
    if (!r.ok) return toast(r.error || "হলো না, আবার চেষ্টা করুন");
    if (action === "gh" || action === "ga") setGf(null);
    setD((x) => ({ ...x, manual: { ...x.manual, list: x.manual.list.map((y) => (y.id === m.id ? { ...y, man: r.cleared ? null : r.manual, status: r.cleared ? "TIMED" : y.status } : y)) } }));
    toast({ start: "খেলা শুরু হয়েছে", ht: "বিরতি", "2h": "দ্বিতীয়ার্ধ শুরু", ft: "খেলা শেষ, প্রেডিকশনের পয়েন্ট দেওয়া হচ্ছে", min: "মিনিট ঠিক হয়েছে, এখান থেকে গোনা চলবে", gh: "গোল যোগ হয়েছে", ga: "গোল যোগ হয়েছে", uh: "গোল বাদ দেওয়া হয়েছে", ua: "গোল বাদ দেওয়া হয়েছে", clear: "হাতের আপডেট মুছে API-তে ফেরানো হয়েছে" }[action] || "হয়েছে");
  };
  const manMin = (mm) => {
    const mn = (t) => Math.max(1, Math.floor((Date.now() - Date.parse(t)) / 60000) + 1);
    if (mm.phase === "1H" && mm.k1) { const e = mn(mm.k1); return e > 45 ? `৪৫+${num(e - 45, "bn")}'` : `${num(e, "bn")}'`; }
    if (mm.phase === "2H" && mm.k2) { const e = 45 + mn(mm.k2); return e > 90 ? `৯০+${num(e - 90, "bn")}'` : `${num(e, "bn")}'`; }
    return mm.phase === "HT" ? "বিরতি" : mm.phase === "FT" ? "শেষ" : "";
  };
  const shell = (body) => (
    <div className="adm-app">
      <header className="adm-top">
        <Logo size={30} />
        <div className="adm-brand"><b>খেলা কখন<i>?</i></b><span>অ্যাডমিন</span></div>
        <div className="sp" />
        {d && <button className="adm-ref" onClick={load} aria-label="রিফ্রেশ">রিফ্রেশ</button>}
        <button className="adm-exit" onClick={onExit}>সাইটে ফিরুন</button>
      </header>
      {d && <nav className="adm-tabs">{ADMIN_TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}{k === "errors" && d.errors.length > 0 ? <em>{num(d.errors.length, "bn")}</em> : null}</button>)}</nav>}
      <main className="adm-main">{body}</main>
    </div>
  );
  if (!user || err === "login") return shell(<div className="card empty"><div style={{ marginBottom: 12 }}>অ্যাডমিন প্যানেল দেখতে লগইন করুন</div><button className="btn" onClick={goProfile}>লগইন</button></div>);
  if (err === "forbidden") return shell(<div className="card empty">এই পাতা শুধু অ্যাডমিনের জন্য।</div>);
  if (err) return shell(<div className="card empty">তথ্য আনা গেল না। একটু পরে আবার চেষ্টা করুন।</div>);
  if (!d) return shell(<div className="card"><div className="spin" /></div>);

  const af = d.af;
  const liveAge = d.live?.at ? (Date.now() - Date.parse(d.live.at)) / 60000 : 9999;
  const liveState = d.liveNow > 0 ? (liveAge <= 6 ? "ok" : "bad") : "idle";
  const tile = (v, l, tone) => <div className={"adm-tile" + (tone ? " " + tone : "")}><b>{v}</b><small>{l}</small></div>;
  const daily = d.daily || [];
  const maxU = Math.max(1, ...daily.map((x) => x.users)), maxP = Math.max(1, ...daily.map((x) => x.preds));
  const dayLbl = (k) => { const [y, m, dd] = k.split("-").map(Number); return `${BN_DAYS_SHORT[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()]} ${num(dd, "bn")}`; };
  const bars = (key, max, cls) => (
    <div className="adm-bars">
      {daily.map((x) => (
        <div key={x.d} className="adm-bar">
          <span className="adm-bar-v">{num(x[key], "bn")}</span>
          <i className={cls} style={{ height: `${Math.max(3, (x[key] / max) * 100)}%` }} />
          <span className="adm-bar-d">{dayLbl(x.d)}</span>
        </div>
      ))}
    </div>
  );

  const ov = (
    <>
      <div className="adm-h">সাইটের অবস্থা</div>
      <div className="adm-grid">
        {tile(liveState === "ok" ? "চালু" : liveState === "bad" ? "থেমে আছে" : "অপেক্ষায়", `লাইভ আপডেট · শেষ ${agoBn(d.live?.at)}`, liveState === "idle" ? "" : liveState)}
        {tile(af ? (af.active ? `${num(af.days ?? 0, "bn")} দিন` : "বন্ধ") : "—", "API-Football-এর মেয়াদ", !af ? "" : !af.active || af.days <= 7 ? "bad" : af.days <= 30 ? "warn" : "ok")}
        {tile(af ? `${num(af.used ?? 0, "bn")}/${num(af.limit ?? 0, "bn")}` : "—", "আজকের API কল", af && af.used / af.limit > 0.9 ? "bad" : "")}
        {tile(num(d.liveNow ?? 0, "bn"), "এখন লাইভ ম্যাচ")}
        {tile(num(d.errors.length, "bn"), "ধরা পড়া ভুল", d.errors.length ? "bad" : "ok")}
        {d.usage && tile(num((d.usage.onlineUsers || 0) + (d.usage.onlineGuests || 0), "bn"), "এখন সাইটে আছেন", "ok")}
      </div>
      {d.lastLiveError && d.lastLiveError.created_at && Date.now() - Date.parse(d.lastLiveError.created_at) < 6 * 3600000 && <div className="adm-warn">শেষ লাইভ ভুল ({agoBn(d.lastLiveError.created_at)}): {String(d.lastLiveError.detail || "").slice(0, 160)}</div>}
      <div className="adm-h">এক নজরে</div>
      <div className="adm-grid">
        {tile(num(d.users ?? 0, "bn"), "মোট অ্যাকাউন্ট")}
        {tile(num(d.users7 ?? 0, "bn"), `গত ৭ দিনে নতুন (আজ ${num(d.users24 ?? 0, "bn")})`)}
        {tile(num(d.pred24 ?? 0, "bn"), `২৪ ঘণ্টায় প্রেডিকশন (মোট ${num(d.predAll ?? 0, "bn")})`)}
        {tile(num(d.pushUsers ?? 0, "bn"), "নোটিফিকেশন চালু")}
      </div>
      <div className="adm-h">গত ৭ দিন: প্রেডিকশন</div>
      <div className="card adm-chart">{bars("preds", maxP, "p")}</div>
    </>
  );
  const U = d.usage;
  const share = (list, label) => { const tot = list.reduce((n, x) => n + (x.n ?? x.min), 0) || 1; return list.slice(0, 8).map((x) => { const v = x.n ?? x.min; return (
    <div key={x.k} className="adm-share"><span>{label[x.k] || x.k}</span><i><b style={{ width: `${Math.max(2, (v / tot) * 100)}%` }} /></i><em>{x.min != null ? minBn(x.min) : num(x.n, "bn")} · {num(Math.round((v / tot) * 100), "bn")}%</em></div>); }); };
  const usage = !U ? <div className="card empty">ব্যবহারের হিসাব এখনো চালু হয়নি। activity.sql চালানোর পর থেকে জমা শুরু হবে।</div> : (
    <>
      <div className="adm-grid">
        {tile(num(U.onlineUsers + U.onlineGuests, "bn"), `এখন অনলাইন (লগইন ${num(U.onlineUsers, "bn")}, অতিথি ${num(U.onlineGuests, "bn")})`, "ok")}
        {tile(num(U.visitors7, "bn"), "গত ৭ দিনে এসেছেন (অতিথিসহ)")}
        {tile(minBn(U.minutes7), "গত ৭ দিনে মোট সময়")}
        {tile(`${num(U.avgSession, "bn")} মি`, "গড়ে একবারে কতক্ষণ থাকেন")}
        {tile(U.retention.d1 == null ? "—" : `${num(U.retention.d1, "bn")}%`, `পরের দিন আবার এসেছেন (${num(U.retention.d1n, "bn")} জনের মধ্যে)`, U.retention.d1 == null ? "" : U.retention.d1 >= 30 ? "ok" : U.retention.d1 >= 15 ? "warn" : "bad")}
        {tile(U.retention.d7 == null ? "—" : `${num(U.retention.d7, "bn")}%`, `৭ দিনের মধ্যে আবার এসেছেন (${num(U.retention.d7n, "bn")} জনের মধ্যে)`, U.retention.d7 == null ? "" : U.retention.d7 >= 40 ? "ok" : U.retention.d7 >= 20 ? "warn" : "bad")}
      </div>
      <div className="adm-h">দৈনিক সক্রিয় (লগইন + অতিথি)</div>
      <div className="card adm-chart">
        <div className="adm-bars">
          {U.dau.map((x) => { const mx = Math.max(1, ...U.dau.map((y) => y.users + y.guests)); return (
            <div key={x.d} className="adm-bar">
              <span className="adm-bar-v">{num(x.users + x.guests, "bn")}</span>
              <div className="adm-stack" style={{ height: `${Math.max(3, ((x.users + x.guests) / mx) * 100)}%` }}><i className="g" style={{ flex: x.guests }} /><i className="u" style={{ flex: x.users }} /></div>
              <span className="adm-bar-d">{dayLbl(x.d)}</span>
            </div>); })}
        </div>
        <div className="muted adm-legend"><i className="u" /> লগইন করা <i className="g" /> অতিথি</div>
      </div>
      <div className="adm-h">কে কত সময় দিচ্ছেন <span className="muted">লগইন করা ইউজার</span></div>
      {!U.people.length ? <div className="card empty">এখনো কোনো হিসাব জমেনি।</div> : (
        <div className="card adm-list">
          <div className="adm-ppl adm-ppl-h"><span>নাম</span><span>আজ</span><span>৭ দিন</span><span>মোট</span></div>
          {U.people.map((p, i) => (
            <div key={i} className="adm-ppl"><span><b>{p.name}</b><small className="muted">{agoBn(p.last)} · {PLAT_BN[p.platform] || p.platform || ""}</small></span><span>{minBn(p.today)}</span><span>{minBn(p.week)}</span><span>{minBn(p.total)}</span></div>
          ))}
        </div>
      )}
      <div className="adm-h">কোন অংশে সময় কাটে <span className="muted">গত ৭ দিন</span></div>
      <div className="card adm-shares">{U.pages.length ? share(U.pages, SEC_BN) : <div className="muted">এখনো হিসাব নেই</div>}</div>
      <div className="adm-h">কোথা থেকে আসছেন <span className="muted">গত ৩০ দিনের নতুনরা</span></div>
      <div className="card adm-shares">{U.sources.length ? share(U.sources, SRC_BN) : <div className="muted">এখনো হিসাব নেই</div>}</div>
      <div className="adm-h">কোন ডিভাইসে</div>
      <div className="card adm-shares">{U.platforms.length ? share(U.platforms, PLAT_BN) : <div className="muted">এখনো হিসাব নেই</div>}</div>
      <div className="muted adm-note" style={{ marginTop: 10 }}>সাইট খোলা আর স্ক্রিনে সামনে থাকলেই শুধু সময় গোনা হয়। অতিথি মানে লগইন ছাড়া ভিজিটর (ফোন ধরে গোনা, নাম ছাড়া)।</div>
    </>
  );
  const users = (
    <>
      <div className="adm-grid">
        {tile(num(d.users ?? 0, "bn"), "মোট অ্যাকাউন্ট")}
        {tile(num(d.users7 ?? 0, "bn"), `গত ৭ দিনে নতুন (আজ ${num(d.users24 ?? 0, "bn")})`)}
        {tile(num(d.active7 ?? 0, "bn"), "গত ৭ দিনে লগইন করেছেন")}
        {tile(num(d.pushUsers ?? 0, "bn"), `নোটিফিকেশন চালু (${num(d.pushDevices ?? 0, "bn")} ডিভাইস)`)}
        {tile(num(d.leagues ?? 0, "bn"), "বন্ধুদের লিগ")}
      </div>
      {d.leagueList?.length > 0 && <>
        <div className="adm-h">বন্ধুদের লিগ <span className="muted">{num(d.leagueList.length, "bn")}টা</span></div>
        <div className="card adm-list">
          {d.leagueList.map((l, i) => (
            <div key={i} className="adm-user">
              <div style={{ minWidth: 0 }}>
                <b>{l.name}</b>
                <small className="muted">কোড {l.code}{l.owner ? ` · খুলেছেন ${l.owner}` : ""}{l.at ? ` · ${agoBn(l.at)}` : ""}</small>
                {l.members.length > 0 && <small className="muted">সদস্য: {l.members.join(", ")}</small>}
              </div>
              <span className="adm-tag">{num(l.members.length, "bn")} জন</span>
            </div>
          ))}
        </div>
      </>}
      <div className="adm-h">গত ৭ দিন: নতুন ইউজার</div>
      <div className="card adm-chart">{bars("users", maxU, "u")}</div>
      <div className="adm-h">নতুন ইউজার</div>
      <div className="card adm-list">
        {(d.recentUsers || []).map((u, i) => (
          <div key={i} className="adm-user">
            <div style={{ minWidth: 0 }}><b>{u.name}</b><small className="muted">যোগ দিয়েছেন {agoBn(u.at)} · শেষ লগইন {agoBn(u.last)} · {u.via === "google" ? "Google" : u.via === "email" ? "ইমেইল" : u.via}</small></div>
            {u.push && <span className="adm-tag">নোটিফিকেশন</span>}
          </div>
        ))}
      </div>
    </>
  );
  const errors = (
    <>
      <div className="adm-h">ধরা পড়া ভুল <span className="muted">{num(d.errors.length, "bn")}টা</span>{d.errors.length > 0 && <><button className="link" onClick={() => copy(d.errors.map(errText).join("\n\n---\n\n"))}>সব কপি</button><button className="link" style={{ marginLeft: 10, color: "var(--muted)" }} onClick={() => window.confirm("সব ভুল তালিকা থেকে সরাবেন?") && fix(null)}>সব সরান</button></>}</div>
      {!d.errors.length ? <div className="card empty">কোনো ভুল নেই। সব ঠিকঠাক চলছে।</div> : (
        <div className="card adm-errs">
          {d.errors.map((e) => (
            <div key={e.fp} className="adm-err">
              <button className="adm-err-h" onClick={() => setOpen(open === e.fp ? null : e.fp)}>
                <span className="adm-cnt">{num(e.count, "bn")}×</span>
                <span className="adm-msg">{e.msg}</span>
              </button>
              <div className="muted adm-meta">{agoBn(e.last_seen)} · {(e.url || "").replace(/^https?:\/\/[^/]+/, "") || "/"} · {uaShort(e.ua)}</div>
              {open === e.fp && (
                <div className="adm-more">
                  <div className="muted">প্রথম: {agoBn(e.first_seen)} · সংস্করণ: {(e.build || "").slice(0, 16)}</div>
                  {e.stack && <pre>{e.stack.slice(0, 900)}</pre>}
                  <button className="btn" onClick={() => copy(errText(e))}>Claude-কে পাঠাতে কপি করুন</button>
                  <button className="btn ghost" onClick={() => fix(e.fp)}>ঠিক হয়েছে, তালিকা থেকে সরান</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="muted adm-note" style={{ marginTop: 10 }}>নতুন ভুল ধরা পড়লে আপনার ফোনে নোটিফিকেশনও যায়। ঠিক করাতে "সব কপি" চেপে Claude-এর চ্যাটে পেস্ট করে লিখুন "এগুলো ঠিক করো"।</div>
    </>
  );
  const news = (
    <>
      <div className="muted adm-note">নোটিফিকেশন চালু থাকা {num(d.pushUsers ?? 0, "bn")} জনের ফোনে যাবে। যাঁরা "ঘোষণা" বন্ধ রেখেছেন, তাঁরা পাবেন না।</div>
      <div className="card adm-form">
        <label>শিরোনাম<input value={bc.title} maxLength={80} onChange={(e) => setBc({ ...bc, title: e.target.value })} placeholder="যেমন: আজ রাতে এল ক্লাসিকো" /></label>
        <label>লেখা<textarea value={bc.body} maxLength={200} rows={3} onChange={(e) => setBc({ ...bc, body: e.target.value })} placeholder="যেমন: রাত ২টায় রিয়াল বনাম বার্সা। প্রেডিক্ট করে পয়েন্ট জিতুন" /></label>
        <label>চাপলে কোন পাতা খুলবে<input value={bc.url} onChange={(e) => setBc({ ...bc, url: e.target.value })} placeholder="/match/123 বা /predict" /></label>
        <div className="adm-prev"><small className="muted">ফোনে যেমন দেখাবে</small><div className="adm-note-prev"><img src="/icon-192x192.png" alt="" width="34" height="34" /><div><b>{bc.title || "শিরোনাম"}</b><span>{bc.body || "লেখা"}</span></div></div></div>
        <div className="adm-actions">
          <button className="btn ghost" disabled={!!busy} onClick={() => send(true)}>{busy === "bc-test" ? "পাঠানো হচ্ছে…" : "আগে শুধু নিজেকে পাঠান"}</button>
          <button className="btn" disabled={!!busy} onClick={() => send(false)}>{busy === "bc" ? "পাঠানো হচ্ছে…" : "সবাইকে পাঠান"}</button>
        </div>
      </div>
    </>
  );
  const live = (() => {
    const M = d.manual;
    if (!M) return <div className="card empty">ম্যাচের তালিকা আনা গেল না। রিফ্রেশ করুন।</div>;
    const stuck = (m) => m.man || (["TIMED", "SCHEDULED"].includes(m.status) && Date.now() - Date.parse(m.utc) > 10 * 60000);
    const list = [...M.list].filter((m) => allM || stuck(m)).sort((a, b) => (!!b.man - !!a.man) || Date.parse(a.utc) - Date.parse(b.utc));
    const B = (m, a, label, cls = "btn ghost", ask) => <button className={cls} disabled={!!busy} onClick={() => act(m, a, ask)}>{busy === m.id + a ? "…" : label}</button>;
    const mTxt = (g) => `${num(g.m ?? 0, "bn")}${g.x ? "+" + num(g.x, "bn") : ""}'`;
    const side = (m, mm, sd) => {
      const team = sd === "h" ? m.home : m.away;
      const gs = (mm?.goals || []).map((g, i) => ({ ...g, i })).filter((g) => g.s === sd);
      return (
        <div className="adm-mm-t"><b>{team}</b>
          {mm && <div className="adm-mm-g">
            {gs.map((g) => <div key={g.i} className="adm-gl"><span>{mTxt(g)} {g.p || <i className="muted">নাম নেই</i>}</span><button className="link" disabled={!!busy} onClick={() => act(m, sd === "h" ? "uh" : "ua", `${team}-এর ${mTxt(g)} মিনিটের গোলটা বাদ দেবেন?`, null, { i: g.i })}>বাদ</button></div>)}
            <button className="btn" disabled={!!busy} onClick={() => setGf({ id: m.id, s: sd, m: "", p: "" })}>+ গোল</button>
          </div>}
        </div>
      );
    };
    const goalForm = (m, mm) => gf?.id === m.id && (
      <div className="adm-gf">
        <b>{gf.s === "h" ? m.home : m.away}-এর গোল</b>
        <label>মিনিট<input inputMode="numeric" value={gf.m} placeholder={`এখন ${manMin(mm)}`} onChange={(e) => setGf({ ...gf, m: e.target.value })} /></label>
        <label>গোলদাতা<input value={gf.p} maxLength={40} placeholder="যেমন রাকিব হোসেন (না দিলেও চলবে)" onChange={(e) => setGf({ ...gf, p: e.target.value })} /></label>
        <small className="muted">মিনিট খালি রাখলে এখনকার মিনিট ধরা হবে। যোগ করা সময়ের গোল "45+2" এভাবে লিখুন।</small>
        <div className="adm-actions">
          <button className="btn ghost" onClick={() => setGf(null)}>বাদ দিন</button>
          <button className="btn" disabled={!!busy} onClick={() => act(m, gf.s === "h" ? "gh" : "ga", null, null, { m: gf.m, p: gf.p })}>{busy === m.id + (gf.s === "h" ? "gh" : "ga") ? "…" : "গোল যোগ করুন"}</button>
        </div>
      </div>
    );
    return (
      <>
        <div className="muted adm-note">API-Football কোনো খেলার লাইভ খবর না দিলে (যেমন বাংলাদেশের কিছু খেলা) টিভি দেখে এখান থেকে নিজে আপডেট করুন। সাইটে সাথে সাথে দেখাবে, মিনিট নিজে চলবে, গোলে নোটিফিকেশন যাবে, শেষ করলে প্রেডিকশনের পয়েন্ট দেওয়া হবে। পরে API-Football চূড়ান্ত ফল দিলে সেটাই বসবে।</div>
        {!M.tableOk && <div className="adm-warn">আগে Supabase-এ supabase/match_manual.sql চালাতে হবে, তারপর এটা কাজ করবে।</div>}
        <div className="adm-h">{allM ? "আশপাশের সব ম্যাচ" : "খবর নেই এমন ম্যাচ"} <span className="muted">{num(list.length, "bn")}টা</span><button className="link" onClick={() => setAllM(!allM)}>{allM ? "শুধু খবর নেই এমন" : "সব ম্যাচ দেখান"}</button></div>
        {!list.length ? <div className="card empty">{allM ? "এখন আশপাশে কোনো ম্যাচ নেই।" : "সব ম্যাচের খবর ঠিকঠাক আসছে।"}</div> : list.map((m) => {
          const mm = m.man;
          return (
            <div key={m.id} className={"card adm-mm" + (mm ? " on" : "")}>
              <div className="adm-mm-h"><span className="muted">{m.code} · {timeLabel(m.utc, "bn")}</span><span className={mm ? "adm-tag live" : "adm-tag"}>{mm ? `হাতে · ${manMin(mm)}` : m.status === "IN_PLAY" ? "API: চলছে" : m.status === "PAUSED" ? "API: বিরতি" : m.status === "FINISHED" ? "API: শেষ" : "API: শুরুর খবর নেই"}</span></div>
              <div className="adm-mm-sc">
                {side(m, mm, "h")}
                <div className="adm-mm-n">{mm ? `${num(mm.home, "bn")} - ${num(mm.away, "bn")}` : m.hs != null ? `${num(m.hs, "bn")} - ${num(m.as, "bn")}` : "-"}</div>
                {side(m, mm, "a")}
              </div>
              {mm && goalForm(m, mm)}
              {mm?.phase !== "FT" && (
                <div className="adm-min">
                  <span className="muted">{mm ? "চলমান মিনিট" : "খেলা কত মিনিট চলছে"}</span>
                  <input type="number" inputMode="numeric" min="1" max="130" placeholder={mm ? manMin(mm) : "যেমন ৪৬"}
                    value={minIn[m.id] ?? ""} onChange={(e) => setMinIn((o) => ({ ...o, [m.id]: e.target.value }))} />
                  <button className="btn ghost" disabled={!!busy || !(+minIn[m.id] >= 1)} onClick={async () => { await act(m, "min", mm ? null : `${m.home} বনাম ${m.away}: ${minIn[m.id]} মিনিট থেকে লাইভ দেখাবেন?`, +minIn[m.id]); setMinIn((o) => ({ ...o, [m.id]: "" })); }}>{busy === m.id + "min" ? "…" : mm ? "ঠিক করুন" : "এখান থেকে চালু"}</button>
                </div>
              )}
              <div className="adm-actions">
                {!mm && B(m, "start", "খেলা শুরু", "btn", `${m.home} বনাম ${m.away}: খেলা শুরু হয়েছে বলে দেখাবেন? মিনিট এখন থেকে গোনা শুরু হবে।`)}
                {mm?.phase === "1H" && B(m, "ht", "বিরতি")}
                {mm?.phase === "HT" && B(m, "2h", "দ্বিতীয়ার্ধ শুরু", "btn")}
                {mm && mm.phase !== "FT" && B(m, "ft", "খেলা শেষ", mm.phase === "2H" ? "btn" : "btn ghost", `খেলা শেষ, ফল ${mm.home}-${mm.away}? প্রেডিকশনের পয়েন্ট দেওয়া হবে।`)}
                {mm && B(m, "clear", "হাতের আপডেট মুছুন", "btn ghost", "হাতে দেওয়া সব খবর মুছে আবার API-Football-এর ওপর ছেড়ে দেবেন?")}
              </div>
            </div>
          );
        })}
      </>
    );
  })();
  const sync = (
    <>
      <div className="muted adm-note">সাধারণত সব নিজে থেকেই আপডেট হয়। কোনো তথ্য পুরনো দেখালে এখান থেকে সাথে সাথে আবার আনা যায়।</div>
      <div className="card adm-list">
        {RUN_LIST.map(([k, l, sub]) => {
          const o = runOut[k];
          return (
            <div key={k} className="adm-run">
              <div style={{ minWidth: 0 }}><b>{l}</b>{sub && <small className="muted">{sub}</small>}
                {o && <small className={o.ok ? "adm-ok" : "adm-bad"}>{o.ok ? "হয়ে গেছে" : "হয়নি"}{o.result ? ` · ${JSON.stringify(o.result).replace(/[{}"]/g, " ").slice(0, 140)}` : ""}</small>}</div>
              <button className="btn ghost" disabled={!!busy} onClick={() => run(k)}>{busy === k ? "চলছে…" : "এখনই"}</button>
            </div>
          );
        })}
      </div>
    </>
  );
  return shell(tab === "quiz" ? <AdminQuiz fetchQ={fetchQ} /> : tab === "live" ? live : tab === "usage" ? usage : tab === "users" ? users : tab === "errors" ? errors : tab === "news" ? news : tab === "sync" ? sync : ov);
}

export { ADMIN_TABS, AdminApp, AdminQuiz, PLAT_BN, RUN_LIST, SEC_BN, SRC_BN, agoBn, bdDayStr, clockBn, dayBn, durBn, minBn, uaShort };
