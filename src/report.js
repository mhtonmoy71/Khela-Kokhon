// ═══════════════════════════════════════════════════════════════
//  খেলা শেষে বাংলায় ছোট ম্যাচ রিপোর্ট: গোল, কার্ড, স্ট্যাটস আর রেটিং থেকে নিজে থেকে লেখা
//  ম্যাচ পাতায় (App.jsx) আর গুগলের জন্য সার্ভারে (api/page.js) একই লেখা
//  matchReport(m, live, { tn, pn, comp }) → { title, paras: [..] } বা null
//    m: ম্যাচ (home_score, away_score, pen_home, pen_away, home, away)
//    live: match_live সারি (events, stats, players, lineups)
//    tn(team) → দলের বাংলা নাম, pn(name) → খেলোয়াড়ের নাম, comp → প্রতিযোগিতার নাম
// ═══════════════════════════════════════════════════════════════
const D = "০১২৩৪৫৬৭৮৯";
const bn = (n) => String(n).replace(/\d/g, (d) => D[d]);
const minTxt = (e) => (e.x ? `${bn(e.m)}+${bn(e.x)}` : bn(e.m));
// ষষ্ঠী বিভক্তি: বার্সেলোনা → বার্সেলোনার, মাদ্রিদ → মাদ্রিদের, রেসিং → রেসিংয়ের; ইংরেজি নামে "-এর"
const isBn = (s) => /[\u0980-\u09FF]$/.test(s || "");
const er = (s) => (!isBn(s) ? `${s}-এর` : /[\u0985-\u0994]$/.test(s) ? `${s}-র` : /[\u09BE-\u09CC\u09D7\u0981]$/.test(s) ? `${s}র` : /ং$/.test(s) ? `${s}য়ের` : `${s}ের`);
// দ্বিতীয়া: লিভারপুলকে, ইংরেজিতে "-কে"
const ke = (s) => (isBn(s) ? `${s}কে` : `${s}-কে`);

// গোলের তালিকা: বাতিল (VAR) আর মিস করা পেনাল্টি বাদ; আত্মঘাতী গোলের দল মিলিয়ে নেওয়া
function goalsOf(m, ev) {
  const cancelled = ev.filter((e) => e.t === "Var" && /cancel|disallow/i.test(e.d || ""));
  let gs = ev.filter((e) => e.t === "Goal" && !/missed/i.test(e.d || "")
    && !cancelled.some((c) => Math.abs((c.m || 0) - (e.m || 0)) <= 3 && c.p === e.p));
  gs = gs.sort((a, b) => (a.m - b.m) || ((a.x || 0) - (b.x || 0)));
  const fits = (list) => list.filter((g) => g.s === "h").length === m.home_score && list.filter((g) => g.s === "a").length === m.away_score;
  if (fits(gs)) return gs;
  // কোনো কোনো ডেটায় আত্মঘাতী গোল খেলোয়াড়ের নিজের দলের নামে থাকে
  const flipped = gs.map((g) => (/own/i.test(g.d || "") ? { ...g, s: g.s === "h" ? "a" : "h" } : g));
  if (fits(flipped)) return flipped;
  return null;
}

function statOf(stats, key) {
  const s = (stats || []).find((x) => (x.k || "").toLowerCase() === key.toLowerCase());
  if (!s) return null;
  const n = (v) => (v == null ? null : parseFloat(String(v).replace("%", "")));
  return { h: n(s.h), a: n(s.a) };
}

function bestPlayer(live) {
  const P = live?.players || {}, L = live?.lineups || {};
  const all = [];
  for (const side of ["h", "a"]) for (const x of [...(L[side]?.xi || []), ...(L[side]?.subs || [])]) {
    const r = P[x.id]?.r; if (r) all.push({ name: x.n, r: +r, side, g: P[x.id]?.g || 0 });
  }
  all.sort((a, b) => b.r - a.r);
  return all[0] || null;
}

export function matchReport(m, live, { tn, pn = (x) => x, comp = "", lang = "bn" } = {}) {
  if (!m || m.status !== "FINISHED" || m.home_score == null) return null;
  if (lang !== "bn") return reportEn(m, live, { tn, pn, comp });
  const ev = Array.isArray(live?.events) ? live.events : [];
  const H = tn(m.home), A = tn(m.away), hs = m.home_score, as = m.away_score;
  const name = (s) => (s === "h" ? H : A);
  const pens = m.pen_home != null && m.pen_away != null && m.pen_home !== m.pen_away;
  const winSide = hs > as ? "h" : as > hs ? "a" : pens ? (m.pen_home > m.pen_away ? "h" : "a") : null;
  const W = winSide ? name(winSide) : null, Lz = winSide ? name(winSide === "h" ? "a" : "h") : null;
  const gs = goalsOf(m, ev);
  const sc = `${bn(Math.max(hs, as))}–${bn(Math.min(hs, as))}`;

  // ── শিরোনাম ──
  let title;
  const lastGoal = gs?.[gs.length - 1];
  // জয়সূচক গোল: যে গোলের পর বিজয়ী দল চূড়ান্তভাবে এগিয়ে গেল
  let winner = null, trailed = false;
  if (gs && winSide && !pens) {
    let h = 0, a = 0;
    for (const g of gs) {
      g.s === "h" ? h++ : a++;
      const lead = winSide === "h" ? h - a : a - h;
      if (lead < 0) trailed = true;
      if (g.s === winSide && lead === 1 && (winSide === "h" ? h : a) === Math.min(hs, as) + 1) winner = g;
    }
  }
  if (pens) title = `টাইব্রেকারে ${er(W)} জয়, ${bn(m.pen_home)}–${bn(m.pen_away)} ব্যবধানে হারল ${Lz}`;
  else if (!winSide) title = hs === 0 ? `${H} ও ${er(A)} গোলশূন্য ড্র` : lastGoal && lastGoal.m >= 85 ? `শেষ মুহূর্তে সমতা, ${H}–${A} ম্যাচ ${bn(hs)}–${bn(as)} ড্র` : `${H} ও ${er(A)} ${bn(hs)}–${bn(as)} গোলে ড্র`;
  else if (Math.abs(hs - as) >= 3) title = `${er(W)} বড় জয়, ${ke(Lz)} ${sc} গোলে হারাল`;
  else if (trailed) title = `পিছিয়ে পড়েও ${er(W)} ${sc} জয়`;
  else if (winner && winner.m >= 85) title = `শেষ মুহূর্তের গোলে ${er(W)} ${sc} জয়`;
  else if (hs + as === 1 && gs?.[0]?.p && !/own/i.test(gs[0].d || "")) title = `${er(pn(gs[0].p))} একমাত্র গোলে ${er(W)} জয়`;
  else title = `${ke(Lz)} ${sc} গোলে হারাল ${W}`;

  const paras = [];
  // ── প্রথম অনুচ্ছেদ: ফল ──
  const where = comp ? `${er(comp)} ম্যাচে ` : "";
  if (!winSide) paras.push(`${where}${H} আর ${er(A)} লড়াই শেষ হয়েছে ${bn(hs)}–${bn(as)} সমতায়।`);
  else if (pens) paras.push(`${where}নির্ধারিত সময় ${bn(hs)}–${bn(as)} সমতায় শেষ হওয়ার পর টাইব্রেকারে ${bn(Math.max(m.pen_home, m.pen_away))}–${bn(Math.min(m.pen_home, m.pen_away))} ব্যবধানে জিতেছে ${W}।`);
  else paras.push(`${where}${winSide === "h" && !/final/i.test(m.stage || "") ? "ঘরের মাঠে " : ""}${ke(Lz)} ${sc} গোলে হারিয়েছে ${W}${winSide === "a" && !/final/i.test(m.stage || "") ? ", তাও প্রতিপক্ষের মাঠে" : ""}।`);

  // ── দ্বিতীয়: গোলের ধারা ──
  if (gs && gs.length) {
    let h = 0, a = 0;
    const led = { h: false, a: false };
    const parts = gs.map((g, i) => {
      const before = g.s === "h" ? h - a : a - h;
      g.s === "h" ? h++ : a++;
      const T = name(g.s);
      const again = led[g.s];
      if ((g.s === "h" ? h - a : a - h) > 0) led[g.s] = true;
      const how = /own/i.test(g.d || "") ? `${er(pn(g.p))} আত্মঘাতী গোলে` : /penalty/i.test(g.d || "") ? `পেনাল্টি থেকে ${er(pn(g.p))} গোলে` : `${er(pn(g.p))} গোলে`;
      const ast = g.a && !/own|penalty/i.test(g.d || "") ? ` (অ্যাসিস্ট ${pn(g.a)})` : "";
      const what = i === 0 ? `এগিয়ে যায় ${T}` : before === 0 ? `${again ? "আবার " : ""}এগিয়ে যায় ${T}` : before > 0 ? `ব্যবধান বাড়ায় ${T}` : before === -1 ? `সমতায় ফেরে ${T}` : `ব্যবধান কমায় ${T}`;
      return `${minTxt(g)} মিনিটে ${how}${ast} ${what} (${bn(h)}–${bn(a)})।`;
    });
    paras.push(parts.join(" "));
    // জোড়া বা হ্যাটট্রিক
    const cnt = {};
    for (const g of gs) if (!/own/i.test(g.d || "")) cnt[g.p] = (cnt[g.p] || 0) + 1;
    const star = Object.entries(cnt).sort((x, y) => y[1] - x[1])[0];
    if (star && star[1] >= 2) paras.push(`${star[1] >= 3 ? "হ্যাটট্রিক" : "জোড়া গোল"} করেছেন ${pn(star[0])}।`);
  } else if (hs + as === 0) {
    paras.push("পুরো ম্যাচে কোনো দলই জালের দেখা পায়নি।");
  }

  // ── লাল কার্ড আর মিস করা পেনাল্টি ──
  const reds = ev.filter((e) => e.t === "Card" && /red/i.test(e.d || ""));
  for (const r of reds.slice(0, 2)) paras.push(`${minTxt(r)} মিনিটে লাল কার্ড দেখেন ${er(name(r.s))} ${pn(r.p)}, এরপর ১০ জন নিয়ে খেলতে হয় দলটিকে।`);
  const miss = ev.filter((e) => e.t === "Goal" && /missed/i.test(e.d || ""));
  for (const x of miss.slice(0, 1)) paras.push(`${minTxt(x)} মিনিটে পেনাল্টি মিস করেন ${er(name(x.s))} ${pn(x.p)}।`);

  // ── স্ট্যাটস ──
  const pos = statOf(live?.stats, "Ball Possession"), sh = statOf(live?.stats, "Total Shots"), on = statOf(live?.stats, "Shots on Goal"), xg = statOf(live?.stats, "expected_goals");
  const st = [];
  if (pos?.h != null && pos?.a != null && pos.h !== pos.a) st.push(`বল দখলে এগিয়ে ছিল ${name(pos.h > pos.a ? "h" : "a")} (${bn(Math.max(pos.h, pos.a))}%)`);
  if (sh?.h != null && sh?.a != null) st.push(`শট ${bn(sh.h)}–${bn(sh.a)}${on?.h != null ? `, লক্ষ্যে ${bn(on.h)}–${bn(on.a)}` : ""}`);
  if (xg?.h != null && xg?.a != null) st.push(`এক্সজি ${bn(xg.h.toFixed(2))}–${bn(xg.a.toFixed(2))}`);
  if (st.length) paras.push(st.join("। ") + "।");

  // ── সেরা রেটিং ──
  const best = bestPlayer(live);
  if (best && best.r >= 7) paras.push(`ম্যাচের সর্বোচ্চ রেটিং ${er(name(best.side))} ${er(pn(best.name))}: ${bn(best.r.toFixed(1))}।`);

  return { title, paras };
}

// ── ইংরেজি রিপোর্ট (একই হিসাব, ইংরেজি বাক্য) ──
const ordMin = (e) => (e.x ? `${e.m}+${e.x}` : `${e.m}`) + "'";
const poss = (n) => (/s$/i.test(n) ? `${n}'` : `${n}'s`);
// "in the Premier League", "in La Liga", "in Serie A"
const inComp = (c) => (!c ? "" : / League| Cup|Bundesliga|Championship|Nations|Euro\b/i.test(c) && !/^(La Liga|MLS)/i.test(c) ? ` in the ${c}` : ` in ${c}`);
function reportEn(m, live, { tn, pn, comp }) {
  const ev = Array.isArray(live?.events) ? live.events : [];
  const H = tn(m.home), A = tn(m.away), hs = m.home_score, as = m.away_score;
  const name = (s) => (s === "h" ? H : A);
  const pens = m.pen_home != null && m.pen_away != null && m.pen_home !== m.pen_away;
  const winSide = hs > as ? "h" : as > hs ? "a" : pens ? (m.pen_home > m.pen_away ? "h" : "a") : null;
  const W = winSide ? name(winSide) : null, Lz = winSide ? name(winSide === "h" ? "a" : "h") : null;
  const gs = goalsOf(m, ev);
  const sc = `${Math.max(hs, as)}-${Math.min(hs, as)}`;
  const neutral = /final/i.test(m.stage || "");
  let winner = null, trailed = false;
  if (gs && winSide && !pens) {
    let h = 0, a = 0;
    for (const g of gs) {
      g.s === "h" ? h++ : a++;
      const lead = winSide === "h" ? h - a : a - h;
      if (lead < 0) trailed = true;
      if (g.s === winSide && lead === 1 && (winSide === "h" ? h : a) === Math.min(hs, as) + 1) winner = g;
    }
  }
  const lastGoal = gs?.[gs.length - 1];
  let title;
  if (pens) title = `${W} beat ${Lz} on penalties (${Math.max(m.pen_home, m.pen_away)}-${Math.min(m.pen_home, m.pen_away)})`;
  else if (!winSide) title = hs === 0 ? `${H} and ${A} play out a goalless draw` : lastGoal && lastGoal.m >= 85 ? `Late equaliser earns ${name(lastGoal.s)} a ${hs}-${as} draw with ${name(lastGoal.s === "h" ? "a" : "h")}` : `${H} and ${A} share the points in a ${hs}-${as} draw`;
  else if (Math.abs(hs - as) >= 3) title = `${W} thrash ${Lz} ${sc}`;
  else if (trailed) title = `${W} come from behind to beat ${Lz} ${sc}`;
  else if (winner && winner.m >= 85) title = `Late winner gives ${W} ${sc} victory over ${Lz}`;
  else if (hs + as === 1 && gs?.[0]?.p && !/own/i.test(gs[0].d || "")) title = `${pn(gs[0].p)} strike gives ${W} 1-0 win over ${Lz}`;
  else title = `${W} beat ${Lz} ${sc}`;

  const paras = [];
  const where = inComp(comp);
  if (!winSide) paras.push(`${H} and ${A} drew ${hs}-${as}${where}.`);
  else if (pens) paras.push(`After a ${hs}-${as} draw${where}, ${W} won the shootout ${Math.max(m.pen_home, m.pen_away)}-${Math.min(m.pen_home, m.pen_away)}.`);
  else paras.push(`${W} beat ${Lz} ${sc}${neutral ? "" : winSide === "h" ? " at home" : " away from home"}${where}.`);

  if (gs && gs.length) {
    let h = 0, a = 0;
    const led = { h: false, a: false };
    const parts = gs.map((g, i) => {
      const before = g.s === "h" ? h - a : a - h;
      g.s === "h" ? h++ : a++;
      const T = name(g.s), again = led[g.s];
      if ((g.s === "h" ? h - a : a - h) > 0) led[g.s] = true;
      const own = /own/i.test(g.d || ""), pen = /penalty/i.test(g.d || "");
      const who = own ? `An own goal by ${pn(g.p)}` : pn(g.p);
      const ast = g.a && !own && !pen ? `, assisted by ${pn(g.a)},` : "";
      const what = i === 0 ? `put ${T} ahead` : before === 0 ? `put ${T} ${again ? "back " : ""}in front` : before > 0 ? `extended ${poss(T)} lead` : before === -1 ? `levelled for ${T}` : `pulled one back for ${T}`;
      return `${who}${ast} ${what}${pen ? " from the spot" : ""} (${ordMin(g)}, ${h}-${a}).`;
    });
    paras.push(parts.join(" "));
    const cnt = {};
    for (const g of gs) if (!/own/i.test(g.d || "")) cnt[g.p] = (cnt[g.p] || 0) + 1;
    const star = Object.entries(cnt).sort((x, y) => y[1] - x[1])[0];
    if (star && star[1] >= 2) paras.push(`${pn(star[0])} ${star[1] >= 3 ? "scored a hat-trick" : "scored twice"}.`);
  } else if (hs + as === 0) paras.push("Neither side found the net.");

  const reds = ev.filter((e) => e.t === "Card" && /red/i.test(e.d || ""));
  for (const r of reds.slice(0, 2)) paras.push(`${poss(name(r.s))} ${pn(r.p)} was sent off (${ordMin(r)}), leaving them with ten men.`);
  const miss = ev.filter((e) => e.t === "Goal" && /missed/i.test(e.d || ""));
  for (const x of miss.slice(0, 1)) paras.push(`${poss(name(x.s))} ${pn(x.p)} missed a penalty (${ordMin(x)}).`);

  const pos = statOf(live?.stats, "Ball Possession"), sh = statOf(live?.stats, "Total Shots"), on = statOf(live?.stats, "Shots on Goal"), xg = statOf(live?.stats, "expected_goals");
  const st = [];
  if (pos?.h != null && pos?.a != null && pos.h !== pos.a) st.push(`${name(pos.h > pos.a ? "h" : "a")} had more of the ball (${Math.max(pos.h, pos.a)}%)`);
  if (sh?.h != null && sh?.a != null) st.push(`Shots ${sh.h}-${sh.a}${on?.h != null ? `, on target ${on.h}-${on.a}` : ""}`);
  if (xg?.h != null && xg?.a != null) st.push(`xG ${xg.h.toFixed(2)}-${xg.a.toFixed(2)}`);
  if (st.length) paras.push(st.join(". ") + ".");
  const best = bestPlayer(live);
  if (best && best.r >= 7) paras.push(`Top-rated player: ${pn(best.name)} (${name(best.side)}), ${best.r.toFixed(1)}.`);
  return { title, paras };
}
