// প্রতিটা আপডেটের আগে: বানানো সাইট (dist) চালিয়ে প্রধান পাতাগুলো খুলে দেখা, কোনো এরর আসে কি না
// চালান: npm run build && npm run smoke
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
// playwright: প্রজেক্টে না থাকলে কম্পিউটারে আগে থেকে বসানোটা
const { chromium } = createRequire(import.meta.url)("playwright");

const PORT = 4319;
const BASE = `http://localhost:${PORT}`;
// [পাতা, পাতায় যা থাকতেই হবে (CSS selector)]
const PAGES = [
  ["/", ".top"],
  ["/leagues", ".top"],
  ["/league/PL", ".top"],
  ["/predict", ".game-sw"],
  ["/quiz/daily", ".game-sw"],
  ["/quiz/play", ".game-sw"],
  ["/ask", ".top"],
  ["/profile", ".top"],
  ["/about", ".info"],
  ["/faq", ".faq"],
  ["/how-it-works", ".info"],
  ["/privacy", ".info"],
  ["/bangladesh", ".top"],
  ["/admin", "body"],
  ["/widget/", "#code"],
  ["/widget/live.html", "#w"],
];
// বাইরের নেট (ছবি, ফন্ট, ডেটা) না পেলে যে এরর আসে, সেগুলো সাইটের ভুল নয়
const IGNORE = /Failed to load resource|ERR_|net::|fonts\.g|supabase|api-sports|football-data|favicon|Download the React DevTools/i;

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "pipe" });
const ready = new Promise((res, rej) => {
  server.stdout.on("data", (d) => String(d).includes(String(PORT)) && res());
  server.on("exit", (c) => rej(new Error("preview exited " + c)));
  setTimeout(() => rej(new Error("preview did not start")), 20000);
});

let failed = 0;
try {
  await ready;
  const browser = await chromium.launch();
  for (const [path, sel] of PAGES) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errs = [];
    page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
    page.on("console", (m) => m.type() === "error" && !IGNORE.test(m.text()) && errs.push("console: " + m.text()));
    try {
      await page.goto(BASE + path, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(1800);
      const has = await page.locator(sel).count();
      const crashed = await page.getByText("আবার চেষ্টা করুন").count(); // main.jsx-এর এরর পর্দা
      if (!has) errs.push(`missing ${sel}`);
      if (crashed) errs.push("error screen shown");
    } catch (e) { errs.push("load: " + e.message); }
    if (errs.length) { failed++; console.log(`FAIL ${path}\n  ${errs.slice(0, 5).join("\n  ")}`); }
    else console.log(`ok   ${path}`);
    await page.close();
  }
  await browser.close();
} catch (e) {
  failed++; console.log("FAIL setup: " + e.message);
} finally {
  server.kill();
}
console.log(failed ? `\n${failed} page(s) failed` : "\nall pages ok");
process.exit(failed ? 1 : 0);
