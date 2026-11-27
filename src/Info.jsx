// Info.jsx: App.jsx থেকে আলাদা (দরকার হলে তখনই নামে)
import { FAQ } from "./faq.js";
import { FbIcon, Friends, League, Leagues, MailIcon, Predict, Profile, answer, has, num, store, stored, useT, zone } from "./App.jsx";

// ── ফুটারের আলাদা পাতা: আমাদের কথা / কীভাবে কাজ করে / প্রতিষ্ঠাতা ──
function InfoPage({ id, user, goProfile }) {
  const { t, lang } = useT();
  const A = ABOUT[lang === "bn" ? "bn" : "en"];
  const back = <div className="page-head"><button className="back" onClick={() => window.history.back()} aria-label="back">←</button></div>;
  if (id === "founder") return (
    <>
      {back}
      <div className="sec info">
        <div className="founder">
          <img className="founder-photo" src={DEV_PHOTO} alt={A.devName} width="120" height="120" />
          <h1>{A.devName}</h1>
          <div className="muted">{A.devRole}</div>
          <div className="foot-social" style={{ justifyContent: "center", marginTop: 12 }}>
            <a href="mailto:khelakokhon@gmail.com" aria-label="Email"><MailIcon /></a>
            <a href="https://www.facebook.com/mahbub.tonmoy.71/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FbIcon /></a>
          </div>
        </div>
        {[].concat(A.dev).map((t, i) => <p key={i} className="founder-p">{t}</p>)}
        {A.devFacts && (
          <div className="card founder-facts">
            {A.devFacts.map(([k, v]) => <div key={k} className="info-row"><span className="muted">{k}</span><b>{v}</b></div>)}
          </div>
        )}
      </div>
    </>
  );
  if (id === "privacy") {
    const bn = lang === "bn";
    const parts = bn
      ? [["কী তথ্য রাখা হয়", "Google বা ইমেইল দিয়ে লগইন করলে আপনার নাম, ইমেইল আর প্রোফাইল ছবি রাখা হয়। আপনার প্রিয় দল, ম্যাচের প্রেডিকশন আর বন্ধুদের লিগের তথ্যও জমা থাকে। লগইন ছাড়া ব্যবহার করলে কোনো ব্যক্তিগত তথ্য নেওয়া হয় না।"],
         ["কেন রাখা হয়", "শুধু আপনার দল, প্রেডিকশন, পয়েন্ট আর লিডারবোর্ড দেখানোর জন্য। লিডারবোর্ড আর বন্ধুদের লিগে অন্যরা শুধু আপনার নাম ও ছবি দেখে, ইমেইল নয়।"],
         ["সাইট ব্যবহারের হিসাব", "সাইট আরো ভালো করতে আমরা দেখি সাইটে কতক্ষণ সময় কাটানো হয়, কোন অংশ (ম্যাচ, লিগ, প্রেডিকশন, কুইজ ইত্যাদি) বেশি দেখা হয়, প্রথমবার কোথা থেকে এসেছেন (যেমন ফেসবুক বা গুগল) আর কোন ধরনের ডিভাইস (অ্যান্ড্রয়েড, আইফোন, কম্পিউটার)। সাইট খোলা আর স্ক্রিনে সামনে থাকলেই শুধু সময় গোনা হয়। লগইন করা থাকলে এই হিসাব আপনার অ্যাকাউন্টের সাথে থাকে, না থাকলে ফোনের একটা বেনামি আইডির সাথে। আপনি কী লিখছেন, কী টাইপ করছেন বা অন্য কোনো ব্যক্তিগত তথ্য এতে জমা হয় না, আর এই হিসাব শুধু সাইটের পরিচালক দেখেন। অ্যাকাউন্ট মুছে ফেললে এই হিসাবও মুছে যায়।"],
         ["ফোনে কী জমা থাকে", "ভাষা, থিম, সাম্প্রতিক খোঁজ আর এমন কিছু পছন্দ আপনার ফোনের ব্রাউজারেই থাকে, আমাদের কাছে আসে না।"],
         ["কারও সাথে ভাগ করা হয় না", "আপনার তথ্য বিক্রি করা হয় না, বিজ্ঞাপনদাতা বা অন্য কাউকে দেওয়া হয় না। তথ্য নিরাপদে Supabase-এর সার্ভারে রাখা হয়।"],
         ["অ্যাকাউন্ট ও তথ্য মুছে ফেলা", "অ্যাপের ভেতর থেকেই মুছতে পারবেন: প্রোফাইল → একদম নিচে \"অ্যাকাউন্ট মুছুন\" → নিশ্চিত করতে \"ডিলিট একাউন্ট\" লিখে চাপুন। আপনার প্রোফাইল, প্রিয় দল, প্রেডিকশন, পয়েন্ট, লিগের সদস্যপদ, কুইজ ও দৈনিক চ্যালেঞ্জের রেকর্ড আর নোটিফিকেশন সাথে সাথে স্থায়ীভাবে মুছে যায়। লগিন করতে না পারলে khelakokhon@gmail.com-এ ইমেইল করুন, আমরা মুছে দেব।"]]
      : [["What we store", "If you sign in with Google or email, we keep your name, email and profile photo, plus your favourite teams, match predictions and friends' leagues. Nothing personal is collected if you use the site without signing in."],
         ["Why", "Only to show your teams, predictions, points and leaderboards. Others see just your name and photo on leaderboards, never your email."],
         ["Usage statistics", "To improve the site we measure how long it is used, which sections (matches, leagues, predictions, quizzes and so on) are viewed most, where you first came from (for example Facebook or Google) and the type of device (Android, iPhone, computer). Time is only counted while the site is open and on screen. If you are signed in this is linked to your account; otherwise to an anonymous device ID. Nothing you type and no other personal information is collected, and only the site's operator can see these figures. Deleting your account deletes them too."],
         ["On your device", "Language, theme, recent searches and similar preferences stay in your browser and are never sent to us."],
         ["No sharing", "Your data is never sold or given to advertisers or anyone else. It is stored securely on Supabase servers."],
         ["Deleting your account and data", "You can delete it in the app: Profile → \"Delete account\" at the bottom → type DELETE ACCOUNT to confirm. Your profile, teams, predictions, points, league memberships, quiz and daily-challenge records and notifications are deleted permanently, right away. If you can't log in, email khelakokhon@gmail.com and we'll delete it for you."]];
    return (
      <>
        {back}
        <div className="sec info">
          <h1>{bn ? "গোপনীয়তা নীতি" : "Privacy policy"}</h1>
          <p className="muted">{bn ? "খেলা কখন? (khelakokhon.com) আপনার তথ্য কীভাবে ব্যবহার করে।" : "How Khela Kokhon (khelakokhon.com) uses your information."}</p>
          {parts.map(([h, d]) => <div key={h}><h2>{h}</h2><p>{d}</p></div>)}
        </div>
      </>
    );
  }
  if (id === "contact") {
    const bn = lang === "bn";
    const topics = bn
      ? [["মতামত ও পরামর্শ", "সাইটের কোনো অংশ ভালো লাগলে বা কিছু বদলানো দরকার মনে হলে জানান।"],
         ["ভুল বা সমস্যা", "কোনো সময়, ফল বা নাম ভুল দেখলে, অথবা কিছু কাজ না করলে লিখুন। কোন পাতায় কী দেখছেন, সম্ভব হলে স্ক্রিনশটসহ।"],
         ["নতুন ফিচারের অনুরোধ", "নতুন লিগ, নতুন সুবিধা বা অন্য কোনো ভাবনা থাকলে জানাতে পারেন।"],
         ["সহযোগিতা ও বিজ্ঞাপন", "যৌথ কাজ, স্পনসরশিপ বা বিজ্ঞাপন নিয়ে কথা বলতে চাইলে ইমেইল করুন।"]]
      : [["Feedback", "Tell us what you like or what should change."],
         ["Errors and problems", "Spotted a wrong time, score or name, or something not working? Tell us which page, with a screenshot if you can."],
         ["Feature requests", "New leagues, new features or any other idea."],
         ["Partnerships and ads", "For collaborations, sponsorship or advertising, please email."]];
    return (
      <>
        {back}
        <div className="sec info">
          <h1>{bn ? "যোগাযোগ" : "Contact"}</h1>
          <p>{bn ? "খেলা কখন? একজন মানুষের হাতে বানানো আর চালানো সাইট। আপনার মতামত, প্রশ্ন বা ভুল ধরিয়ে দেওয়া, সবই সাইটটাকে আরও ভালো করে। নিচের যেকোনো উপায়ে লিখতে পারেন, প্রতিটা বার্তা পড়া হয়।" : "Khela Kokhon is built and run by one person. Your feedback, questions and bug reports all make it better. Reach out any way below; every message is read."}</p>
          <div className="contact-cards">
            <a className="card contact-card" href="mailto:khelakokhon@gmail.com">
              <span className="contact-ic"><MailIcon /></span>
              <span><b>{bn ? "ইমেইল" : "Email"}</b><small>khelakokhon@gmail.com</small></span>
            </a>
            <a className="card contact-card" href="https://www.facebook.com/khelakokhon" target="_blank" rel="noopener noreferrer">
              <span className="contact-ic fb"><FbIcon /></span>
              <span><b>{bn ? "ফেসবুক পেজ" : "Facebook page"}</b><small>facebook.com/khelakokhon</small></span>
            </a>
          </div>
          <h2>{bn ? "কী নিয়ে লিখতে পারেন" : "What you can write about"}</h2>
          <div className="contact-topics">
            {topics.map(([h, d]) => <div key={h}><b>{h}</b><p>{d}</p></div>)}
          </div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 14 }}>{bn ? "ভুল জানানোর সময় কোন ম্যাচ বা পাতা, আর কোন ফোন বা ব্রাউজার ব্যবহার করছেন লিখলে দ্রুত ঠিক করা সহজ হয়।" : "When reporting a problem, mentioning the match or page and your phone or browser helps fix it faster."}</p>
        </div>
      </>
    );
  }
  if (id === "faq") return (
    <>
      {back}
      <div className="sec info">
        <h1>{lang === "bn" ? "প্রশ্নোত্তর" : "Frequently asked questions"}</h1>
        <div className="faq">
          {FAQ[lang === "bn" ? "bn" : "en"].map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
        </div>
      </div>
    </>
  );
  if (id === "how") return (
    <>
      {back}
      <div className="sec info">
        <h1>{A.howH}</h1>
        <div className="steps">
          {A.steps.map(([h, d], i) => <div key={h}><span className="step-n">{num(i + 1, lang)}</span><b>{h}</b><p>{d}</p></div>)}
        </div>
        <h2>{lang === "bn" ? "পয়েন্টের নিয়ম" : "Scoring"}</h2>
        <p>{t("rules")}</p>
        {!user && <button className="btn" style={{ marginTop: 16 }} onClick={goProfile}>{A.cta} →</button>}
      </div>
    </>
  );
  return (
    <>
      {back}
      <div className="sec info">
        <h1>{A.whatH}</h1>
        {[].concat(A.what).map((t, i) => <p key={i} className="founder-p">{t}</p>)}
        <div className="facts">{A.facts.map(([b, s]) => <div key={s}><b>{b}</b><span>{s}</span></div>)}</div>
        {A.sections && <div className="about-secs">{A.sections.map(([h, t]) => <div key={h} className="card about-sec"><h2>{h}</h2><p>{t}</p></div>)}</div>}
        {!user && <button className="btn" style={{ marginTop: 18 }} onClick={goProfile}>{A.cta} →</button>}
      </div>
    </>
  );
}

// ════════════════ pages/Home.jsx ════════════════
// ── খেলা কখন? কী / কীভাবে কাজ করে / ডেভেলপার ──
const DEV_PHOTO = "/founder.jpg";
const ABOUT = {
  bn: {
    whatH: "খেলা কখন? সম্পর্কে",
    what: [
      "খেলা কখন? বাংলাদেশের ফুটবলপ্রেমীদের জন্য বানানো একটি পূর্ণাঙ্গ ফুটবল প্ল্যাটফর্ম। ইউরোপের বড় লিগ থেকে দেশের মাঠ, প্রতিটি ম্যাচের ফিক্সচার, লাইভ স্কোর আর স্ট্যাটস এখানে পাওয়া যায় বাংলায়, বাংলাদেশ সময়ে।",
      "রাত একটার খেলা নাকি ভোর চারটার, সময় মেলানোর ঝামেলা নেই। প্রিয় দল বেছে নিলে তাদের খেলা থাকে সবার আগে, আর কিকঅফ থেকে ফুলটাইম পর্যন্ত প্রতিটি মুহূর্তের খবর পৌঁছে যায় আপনার ফোনে।",
    ],
    facts: [["১৯", "প্রতিযোগিতা"], ["৯০০+", "দল"], ["প্রতি মিনিটে", "লাইভ হালনাগাদ"]],
    sections: [
      ["লাইভ ম্যাচ সেন্টার", "মিনিট ধরে লাইভ স্কোর, গোলদাতা, কার্ড, বদলি আর বাংলায় কমেন্ট্রি। মাঠের ছবিতে দুই দলের লাইনআপ ও প্লেয়ার রেটিং, ম্যাচের পুরো স্ট্যাটস আর হেড-টু-হেড। নকআউটে অ্যাগ্রিগেট স্কোর আর পুরো রাউন্ডের চিত্র।"],
      ["১৯টি প্রতিযোগিতা", "চ্যাম্পিয়ন্স লিগ, প্রিমিয়ার লিগ, লা লিগা, বুন্দেসলিগা, সিরি আ ও লিগ ওয়ান থেকে শুরু করে ইউরোপা লিগ, কনফারেন্স লিগ, নেশনস লিগ, এফএ কাপ, কোপা দেল রে, সৌদি প্রো লিগ, এমএলএস আর এএফসি চ্যাম্পিয়ন্স লিগ। দেশের ফুটবলে আছে বাংলাদেশ ফুটবল লিগ ও ফেডারেশন কাপ।"],
      ["লিগ, দল ও প্লেয়ার", "খেলা চলাকালেই বদলানো পয়েন্ট টেবিল, হোম-অ্যাওয়ে হিসাব আর শেষ পাঁচ ম্যাচের ফর্ম। প্রতিটি দলের ফিক্সচার, রেজাল্ট ও স্কোয়াড; প্রতিটি প্লেয়ারের সিজনের স্ট্যাটস আর পুরো ক্যারিয়ার।"],
      ["প্রেডিকশন গেম", "খেলা শুরুর আগে স্কোর প্রেডিক্ট করুন। হুবহু মিললে ৩ পয়েন্ট, শুধু রেজাল্ট মিললে ১; নকআউটে টাইব্রেকারের উইনার ঠিক হলে ৪ বা ৫। খেলা চলাকালেই লিডারবোর্ডে বদলায় র‍্যাঙ্কিং। নিজের লিগ খুলে বন্ধুদের সাথেও চলে লড়াই।"],
      ["কুইজ ও দৈনিক চ্যালেঞ্জ", "প্রতিদিন পাঁচটি নতুন প্রশ্নে জ্ঞান ঝালিয়ে নিন, ধরে রাখুন স্ট্রিক, জিতে নিন ব্যাজ। বন্ধুদের সাথে লাইভ স্পোর্টস কুইজও খেলা যায়।"],
      ["জিজ্ঞেস করুন", "বাংলায় প্রশ্ন করলেই উত্তর: পরের ম্যাচ কবে, টেবিলে কততম, কে কত গোল করেছেন, ক্লাব আর জাতীয় দল মিলিয়ে।"],
      ["নোটিফিকেশন", "প্রিয় দলের কিকঅফ, প্রতিটি গোল আর ফুলটাইমের খবর সাথে সাথে। সাথে ম্যাচ ডে, প্রেডিকশন আর দৈনিক চ্যালেঞ্জের রিমাইন্ডার।"],
    ],
    howH: "কীভাবে কাজ করে",
    steps: [
      ["রেজিস্ট্রেশন", "ইমেইল দিয়ে, অথবা এক চাপে Google দিয়ে।"],
      ["দল বাছাই", "সর্বোচ্চ তিনটা প্রিয় দল, তাদের খেলা সবার উপরে।"],
      ["প্রেডিকশন", "কিকঅফের আগ পর্যন্ত যেকোনো ম্যাচের স্কোর প্রেডিক্ট করুন।"],
      ["পয়েন্ট", "হুবহু স্কোরে ৩, শুধু ফল মিললে ১। সব লিগ মিলিয়ে বা আলাদা লিগে লিডারবোর্ডে জায়গা করে নিন।"],
      ["বন্ধুদের লিগ", "নিজের লিগ খুলে লিংক পাঠান, বন্ধুরা যোগ দিলেই নিজেদের মধ্যে লড়াই।"],
      ["স্পোর্টস কুইজ", "১০টা প্রশ্ন, প্রতিটায় ৩০ সেকেন্ড। একা খেলে নিজেকে যাচাই করুন, বা বন্ধুদের সাথে লাইভ।"],
      ["জিজ্ঞেস করুন", "বাংলায় প্রশ্ন করুন: পরের খেলা, টেবিল, ফর্ম, হেড টু হেড, গোল, কোচ।"],
    ],
    devH: "ডেভেলপার পরিচিতি",
    devName: "মাহবুব হাসান তন্ময়",
    devRole: "প্রতিষ্ঠাতা ও ডেভেলপার",
    dev: [
      "ক্রীড়া লেখক, খেলার ইতিহাসের অনুরাগী। বাংলা ও ইংরেজিতে লিখেছেন ১,৭০০-র বেশি ক্রীড়া প্রতিবেদন।",
      "২০২২ সালের অমর একুশে বইমেলায় প্রকাশিত হয় তাঁর প্রথম বই ‘ক্রিকেট ৩৬৫’।",
      "প্রোগ্রামিংয়ে প্রাতিষ্ঠানিক পড়াশোনা নেই। এআই-এর সাথে ‘ভাইব কোডিং’ করে নিজেই বানিয়েছেন খেলা কখন?, যাতে বাংলাদেশের ফুটবলপ্রেমীরা নিজের ভাষায়, নিজের সময়ে খেলার সব খবর পান।",
    ],
    devFacts: [["জন্মস্থান", "গাংনী, মেহেরপুর"], ["পড়াশোনা", "বিবিএ (ফাইন্যান্স অ্যান্ড ব্যাংকিং), গোপালগঞ্জ বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়"], ["প্রথম বই", "ক্রিকেট ৩৬৫ (২০২২)"], ["আগ্রহ", "খেলার ইতিহাস"]],
    cta: "শুরু করুন",
  },
  en: {
    whatH: "What is Khela Kokhon?",
    what: [
      "Khela Kokhon is a complete football platform built for fans in Bangladesh. From Europe's biggest leagues to the game at home, every fixture, live score and analysis is here, in Bangla and in Bangladesh time.",
      "No more working out whether a match is at 1 AM or 4 AM. Pick your teams and their matches come first, with every moment from kick-off to the final whistle delivered to your phone.",
    ],
    facts: [["19", "competitions"], ["900+", "teams"], ["Every minute", "live updates"]],
    sections: [
      ["Live match centre", "Minute-by-minute scores, scorers, cards, substitutions and commentary. Lineups on a pitch with player ratings, full stats and head-to-head history. In knockouts, two-leg aggregates and the whole round at a glance."],
      ["19 competitions", "From the Champions League, Premier League, La Liga, Bundesliga, Serie A and Ligue 1 to the Europa League, Conference League, Nations League, FA Cup, Copa del Rey, Saudi Pro League, MLS and AFC Champions League. At home, the Bangladesh Football League and the Federation Cup."],
      ["Leagues, teams and players", "Tables that update during matches, home and away splits and last-five form. Every team's fixtures, results and squad; every player's season stats and full career."],
      ["Prediction game", "Predict the score before kick-off: 3 points for the exact score, 1 for the right result, 4 or 5 for calling a knockout shootout. Leaderboards move as matches play out, and you can start your own league with friends."],
      ["Quiz and daily challenge", "Five new questions every day to sharpen your knowledge, keep your streak and earn badges. Or play a live sports quiz with friends."],
      ["Ask", "Ask in Bangla and get an answer: when the next match is, where a team stands, how many goals a player has, club and country combined."],
      ["Notifications", "Kick-off, every goal and full time for your teams, instantly. Plus match-day, prediction and daily-challenge reminders."],
    ],
    howH: "How it works",
    steps: [
      ["Sign up", "With email, or with Google in one tap."],
      ["Pick teams", "Up to three favourites, shown first."],
      ["Predict", "Guess the score of any match until kickoff."],
      ["Score points", "3 for the exact score, 1 for the right result. Climb the overall or per-league leaderboard."],
      ["Friends' leagues", "Start your own league and share the link."],
      ["Sports quiz", "10 questions, 30 seconds each. Solo, or live with friends."],
      ["Ask", "Ask in Bangla: next match, table, form, head to head, goals, coach."],
    ],
    devH: "About the Developer",
    devName: "Mahbub Hasan Tonmoy",
    devRole: "Founder & developer",
    dev: [
      "Sports writer with a passion for sports history, and the author of more than 1,700 sports reports in Bangla and English.",
      "His first book, ‘Cricket 365’, was published at the Ekushey Book Fair in 2022.",
      "With no formal training in programming, he built Khela Kokhon himself through ‘vibe coding’ with AI, so that football fans in Bangladesh can follow every match in their own language and their own time zone.",
    ],
    devFacts: [["Born", "Gangni, Meherpur"], ["Education", "BBA (Finance and Banking), Gopalganj Science and Technology University"], ["First book", "Cricket 365 (2022)"], ["Interest", "Sports history"]],
    cta: "Get started",
  },
};

export { ABOUT, DEV_PHOTO, InfoPage };
