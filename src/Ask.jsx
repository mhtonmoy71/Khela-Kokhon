// Ask.jsx: App.jsx থেকে আলাদা (দরকার হলে তখনই নামে)
import { Fragment, useContext, useEffect, useRef, useState } from "react";
import { BN_MONTHS, Crest, DatedRows, EN_MONTHS, FavCtx, HELP_CHIPS, I, League, MailIcon, MatchRow, MoonIcon, QuizIcon, RES, SearchIcon, SparkIcon, TargetIcon, Team, TrophyIcon, UserIcon, UsersIcon, W, answer, compLabel, dayKey, num, pName, shortName, teamName, useNav, useT, zone } from "./App.jsx";

const EXAMPLES = {
  bn: ["রিয়ালের পরের খেলা কবে", "লা লিগায় এমবাপ্পে কয়টা গোল করেছে", "প্রিমিয়ার লিগের সর্বোচ্চ গোলদাতা", "বার্সার শেষ ম্যাচের ফল", "আজ কী খেলা"],
  en: ["Real Madrid next match", "Mbappé La Liga goals", "Premier League top scorer", "Barça last result", "Today's matches"],
};

// ── জিজ্ঞেস করো: আলাদা পাতা (/ask) ──
// মাইকে বলে জিজ্ঞেস (যে ব্রাউজারে আছে)
const SpeechRec = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// গাইডের ইনফোগ্রাফিক: আইকন, ধাপের সিঁড়ি, মূল সংখ্যা, টিপস আর "এখনই চেষ্টা করুন"
const LockIcon = I(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>);
const PhoneIcon = I(<><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>);
const GUIDE_ICON = { quiz: QuizIcon, target: TargetIcon, trophy: TrophyIcon, users: UsersIcon, search: SearchIcon, user: UserIcon, phone: PhoneIcon, moon: MoonIcon, lock: LockIcon, mail: MailIcon };
function GuideCard({ g, lang }) {
  const nav = useNav();
  const Ic = GUIDE_ICON[g.icon];
  const act = { quiz: () => nav.openQuiz(), predict: () => nav.go("predict"), friends: () => nav.openFriends(), search: () => nav.openSearch(), profile: () => nav.go("profile"), privacy: () => nav.openPage("privacy"), contact: () => nav.openPage("contact") };
  return (
    <div className="guide">
      <div className="guide-h"><span className="guide-ic">{Ic ? <Ic width={22} height={22} /> : "★"}</span><b>{g.title}</b></div>
      {g.facts && <div className="guide-facts">{g.facts.map(([v, l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div>}
      <ol className="guide-steps">
        {g.steps.map(([h, d], i) => (
          <li key={i} style={{ animationDelay: `${i * 70}ms` }}><span className="guide-n">{num(i + 1, lang)}</span><div><b>{h}</b>{d && <p>{d}</p>}</div></li>
        ))}
      </ol>
      {g.tips?.length > 0 && <div className="guide-tips"><b>{lang === "bn" ? "মনে রাখুন" : "Good to know"}</b>{g.tips.map((t) => <p key={t}>{t}</p>)}</div>}
      {g.cta && act[g.cta[1]] && <button className="btn block guide-cta" onClick={act[g.cta[1]]}>{g.cta[0]} →</button>}
    </div>
  );
}

// উত্তরের ভেতরের ছোট টেবিল
function AskTable({ t, lang }) {
  const nav = useNav();
  const bn = lang === "bn";
  let prev = 0;
  return (
    <div className="card ask-tbl" style={{ marginTop: 8 }}>
      <div className="tbl tbl-h ask"><span>#</span><span>{bn ? "দল" : "Team"}</span><span>{bn ? "ম্যাচ" : "P"}</span><span>+/-</span><span>{bn ? "পয়েন্ট" : "Pts"}</span></div>
      {t.rows.map((r) => {
        const gapRow = prev > 0 && r.position > prev + 1; prev = r.position;
        return (
          <Fragment key={r.team_id}>
            {gapRow && <div className="ask-gap">⋯</div>}
            <button className={"tbl ask " + (t.hl.includes(r.team_id) ? "hl " : "") + zone(t.code, r.position, 99)} onClick={() => nav.openTeam(r.team_id)}>
              <span className="pos">{num(r.position, lang)}</span>
              <span className="tm"><Crest team={r.team} size={20} /><b>{teamName(r.team, lang)}</b></span>
              <span>{num(r.played, lang)}</span><span>{r.gd > 0 ? "+" : ""}{num(r.gd, lang)}</span><span className="pts">{num(r.points, lang)}</span>
            </button>
          </Fragment>
        );
      })}
      <button className="ask-more" onClick={() => nav.openLeague(t.code)}>{bn ? "পুরো টেবিল দেখুন →" : "Full table →"}</button>
    </div>
  );
}

// উত্তর এলে হালকা টুং শব্দ (কোনো অডিও ফাইল ছাড়া, ব্রাউজারেই তৈরি)। প্রশ্ন পাঠানোর চাপেই শব্দ চালু হয়, তাই ফোনে আটকায় না
let audioCtx = null;
const wakeAudio = () => {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx ||= new AC();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch { /* শব্দ না হলেও চলবে */ }
};
const chime = () => {
  try {
    if (!audioCtx || document.visibilityState !== "visible") return;
    const t0 = audioCtx.currentTime + 0.01;
    [[784, 0], [1175, 0.09]].forEach(([f, d]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.08, t0 + d + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.22);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t0 + d); o.stop(t0 + d + 0.25);
    });
  } catch { /* ignore */ }
};
// পাঠানোর শব্দ: ছোট একটা ওপরে ওঠা "ফুস" (মেসেজ চলে যাওয়ার অনুভূতি), উত্তরের শব্দের চেয়ে আস্তে
const whoosh = () => {
  try {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime + 0.005;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(420, t0);
    o.frequency.exponentialRampToValueAtTime(980, t0 + 0.12);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + 0.16);
  } catch { /* ignore */ }
};
const SoundIcon = ({ on }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4z" />
    {on ? <><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></> : <path d="m16 9 5 6m0-6-5 6" />}
  </svg>
);

function AskPage({ teams, preds, onOpen, chat, setChat }) {
  const { lang } = useT();
  const nav = useNav();
  const favIds = useContext(FavCtx);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [sound, setSound] = useState(() => { try { return localStorage.getItem("kk_ask_sound") !== "0"; } catch { return true; } });
  const flipSound = () => { const n = !sound; setSound(n); try { localStorage.setItem("kk_ask_sound", n ? "1" : "0"); } catch { /* ignore */ } if (n) { wakeAudio(); chime(); } };
  const recRef = useRef(null);
  // আগের প্রশ্নের দল বা লিগ মনে রাখা
  const ctx = [...chat].reverse().find((m) => m.ctx && (m.ctx.ids?.length || m.ctx.comp))?.ctx || {};
  function listen() {
    if (!SpeechRec) return;
    if (listening) { recRef.current?.stop(); return; }
    const r = new SpeechRec();
    r.lang = lang === "bn" ? "bn-BD" : "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const t = e.results?.[0]?.[0]?.transcript; if (t) ask(t); };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r; setListening(true);
    try { r.start(); } catch { setListening(false); }
  }
  const endRef = useRef(null);
  useEffect(() => { if (chat.length || busy) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [chat, busy]);
  // কিবোর্ড খুললে নিচের ন্যাভ লুকায়, যাতে লেখার ঘর কিবোর্ডের ঠিক ওপরে বসে
  const kbTimer = useRef(null);
  const kb = (on) => {
    clearTimeout(kbTimer.current);
    if (on) document.documentElement.classList.add("kb-open");
    else kbTimer.current = setTimeout(() => document.documentElement.classList.remove("kb-open"), 150);
  };
  useEffect(() => () => { clearTimeout(kbTimer.current); document.documentElement.classList.remove("kb-open"); }, []);

  async function ask(text) {
    const t = text.trim();
    if (!t || busy) return;
    setQ(""); setBusy(true);
    if (sound) { wakeAudio(); whoosh(); }
    setChat((c) => [...c, { me: t }]);
    try {
      const a = await answer(t, teams, lang, ctx, favIds);
      setChat((c) => [...c, a || { text: "…", matches: [] }]);
      if (sound) chime();
    } catch {
      setChat((c) => [...c, { text: lang === "bn" ? "দুঃখিত, এখন উত্তর আনা যাচ্ছে না। একটু পরে চেষ্টা করুন।" : "Sorry, couldn't fetch that right now.", matches: [] }]);
    }
    setBusy(false);
  }

  return (
    <div className="ask-page">
        <div className="ask-head"><span className="ask-orb sm"><SparkIcon /></span>{lang === "bn" ? "খেলা কখন? জিজ্ঞেস করুন" : "Ask Khela Kokhon"}
          <button className="ask-snd" onClick={flipSound} aria-pressed={sound} aria-label={sound ? (lang === "bn" ? "উত্তরের শব্দ বন্ধ করুন" : "Mute reply sound") : (lang === "bn" ? "উত্তরের শব্দ চালু করুন" : "Unmute reply sound")} title={sound ? (lang === "bn" ? "শব্দ চালু" : "Sound on") : (lang === "bn" ? "শব্দ বন্ধ" : "Sound off")}><SoundIcon on={sound} /></button>
          {chat.length > 0 && <button className="ask-new" onClick={() => setChat([])}>{lang === "bn" ? "নতুন করে" : "New chat"}</button>}
        </div>
        <div className="ask-body">
          {chat.length === 0 && (
            <>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>
                {lang === "bn" ? "দল, লিগ বা খেলোয়াড় নিয়ে যা খুশি জিজ্ঞেস করুন: সূচি, ফল, টেবিল, ফর্ম, হেড টু হেড, গোল, কোচ, স্টেডিয়াম। সময় বলব বাংলাদেশ সময়ে।" : "Ask anything about teams, leagues or players: fixtures, results, tables, form, head to head, goals, coach, stadium."}
              </p>
              <div className="ask-ex">
                {[...HELP_CHIPS[lang === "bn" ? "bn" : "en"], lang === "bn" ? "কী কী জিজ্ঞেস করা যায়" : "What can I ask?"].map((e) => <button key={e} className="chip" onClick={() => ask(e)}>{e}</button>)}
              </div>
            </>
          )}
          {chat.map((m, i) => m.me ? (
            <div key={i} className="bubble me">{m.me}</div>
          ) : (
            <div key={i} className="bubble bot">
              <div style={{ whiteSpace: "pre-line" }}>{m.text}</div>
              {m.players?.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  {m.players.map((x) => (
                    <button key={x.player_id + (x.code || x.label)} className="ask-pl" onClick={() => nav.openPlayer(x.player_id)}>
                      <Crest team={x.team} size={26} />
                      <span className="ask-pl-n"><b>{pName(x, lang)}</b><small className="muted">{x.label || (x.code ? compLabel(x.code, lang) : x.team ? teamName(x.team, lang) : "")}</small></span>
                      <span className="ask-pl-g">{x.goals == null ? "—" : num(x.goals, lang)}<small>{lang === "bn" ? "গোল" : "goals"}</small></span>
                    </button>
                  ))}
                </div>
              )}
              {m.guide && <GuideCard g={m.guide} lang={lang} />}
              {m.table && <AskTable t={m.table} lang={lang} />}
              {m.form && (
                <div className="form-row" style={{ marginTop: 10 }}>
                  {[...m.form.list].reverse().map((x) => { const me = x.home_id === m.form.id ? x.home_score : x.away_score, th = x.home_id === m.form.id ? x.away_score : x.home_score; const r = me > th ? "W" : me < th ? "L" : "D";
                    return <button key={x.id} className={"badge big " + r + (lang === "bn" ? " word" : "")} onClick={() => onOpen(x)}>{RES[r][lang === "bn" ? 0 : 1]}</button>; })}
                </div>
              )}
              {m.h2h && (
                <div className="card ask-h2h" style={{ marginTop: 8 }}>
                  <div className="h2h-bar">
                    <span style={{ flex: m.h2h.ra.w || 0.001 }} className="a">{m.h2h.ra.w ? num(m.h2h.ra.w, lang) : ""}</span>
                    <span style={{ flex: m.h2h.ra.d || 0.001 }} className="d">{m.h2h.ra.d ? num(m.h2h.ra.d, lang) : ""}</span>
                    <span style={{ flex: m.h2h.rb.w || 0.001 }} className="b">{m.h2h.rb.w ? num(m.h2h.rb.w, lang) : ""}</span>
                  </div>
                  <div className="h2h-legend"><span><i className="a" />{teamName(teams.find((t) => t.id === m.h2h.a), lang)}</span><span><i className="d" />{lang === "bn" ? "ড্র" : "Draw"}</span><span><i className="b" />{teamName(teams.find((t) => t.id === m.h2h.b), lang)}</span></div>
                  {m.h2h.rows.map((x) => {
                    const hn = teams.find((t) => t.id === x.homeTeam?.id), an = teams.find((t) => t.id === x.awayTeam?.id);
                    return <div key={x.id} className="ah-row"><small className="muted">{(() => { const [y, mo, d] = dayKey(x.utcDate).split("-").map(Number); return lang === "bn" ? `${num(d, "bn")} ${BN_MONTHS[mo - 1].slice(0, 4)} ’${num(String(y).slice(2), "bn")}` : `${d} ${EN_MONTHS[mo - 1].slice(0, 3)} ’${String(y).slice(2)}`; })()}</small><span>{hn ? teamName(hn, lang) : x.homeTeam?.shortName || x.homeTeam?.name}</span><b>{num(x.score.home, lang)}–{num(x.score.away, lang)}</b><span>{an ? teamName(an, lang) : x.awayTeam?.shortName || x.awayTeam?.name}</span></div>;
                  })}
                </div>
              )}
              {m.matches?.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  {m.dated ? <DatedRows list={m.matches.slice(0, 12)} preds={preds} onOpen={onOpen} /> : m.matches.slice(0, 8).map((x) => <MatchRow key={x.id} m={x} pred={preds[x.id]} onOpen={onOpen} />)}
                </div>
              )}
              {m.teamLink && <button className="chip" style={{ marginTop: 8 }} onClick={() => nav.openTeam(m.teamLink)}>{lang === "bn" ? (m.squadLink ? "পুরো স্কোয়াড দেখুন →" : "দলের পাতা খুলুন →") : (m.squadLink ? "Full squad →" : "Open team page →")}</button>}
              {i === chat.length - 1 && m.chips?.length > 0 && (
                <div className="ask-ex ask-follow">{m.chips.slice(0, 6).map((e) => <button key={e} className="chip" onClick={() => ask(e)}>{e}</button>)}</div>
              )}
            </div>
          ))}
          {busy && <div className="bubble bot muted">…</div>}
          <div ref={endRef} />
        </div>
        <form className="ask-input" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => kb(true)} onBlur={() => kb(false)} enterKeyHint="send" placeholder={listening ? (lang === "bn" ? "শুনছি… বলুন" : "Listening…") : lang === "bn" ? "যেমন: বার্সার ফর্ম কেমন" : "e.g. Barcelona form"} />
          {SpeechRec && <button type="button" className={"ask-mic" + (listening ? " on" : "")} onClick={listen} aria-label="voice"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg></button>}
          <button className="btn" disabled={!q.trim() || busy}>{lang === "bn" ? "পাঠান" : "Send"}</button>
        </form>
    </div>
  );
}

export { AskPage, AskTable, EXAMPLES, GUIDE_ICON, GuideCard, LockIcon, PhoneIcon, SpeechRec };
