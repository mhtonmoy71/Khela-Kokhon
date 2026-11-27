// প্রতিটা আলাদা করা পাতার ফাইলে (Quiz, Ask, Admin, Info, App): ব্যবহার হয় কিন্তু ঘোষণা বা import নেই এমন নাম খোঁজা।
// এমন ভুল বিল্ডে ধরা পড়ে না, শুধু ওই অংশ খুললে পাতা ভেঙে যায় (যেমন ডেইলি চ্যালেঞ্জে DAILY_SEC)।
// চালান: npm run check
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const acorn = require("acorn"), esb = require("esbuild");
const walk = (n, f, parent) => { if (!n || typeof n.type !== "string") return; f(n, parent); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach((x) => walk(x, f, n)); else if (v && typeof v.type === "string") walk(v, f, n); } };
const G = new Set(Object.getOwnPropertyNames(globalThis).concat(["window","document","navigator","location","localStorage","sessionStorage","fetch","setTimeout","clearTimeout","setInterval","clearInterval","requestAnimationFrame","cancelAnimationFrame","history","screen","Image","Audio","URL","URLSearchParams","Blob","File","FileReader","FormData","Notification","IntersectionObserver","ResizeObserver","MutationObserver","CustomEvent","Event","PopStateEvent","alert","confirm","prompt","matchMedia","getComputedStyle","addEventListener","removeEventListener","dispatchEvent","scrollTo","innerWidth","innerHeight","devicePixelRatio","performance","crypto","atob","btoa","structuredClone","queueMicrotask","HTMLElement","Element","Node","AbortController","TextEncoder","TextDecoder","caches","indexedDB","speechSynthesis","SpeechSynthesisUtterance","webkitSpeechRecognition","SpeechRecognition","AudioContext","webkitAudioContext","OffscreenCanvas","createImageBitmap","visualViewport","open","close","print","scrollY","scrollX","pageYOffset","undefined","arguments","Intl","import"]));
let bad = 0;
for (const f of ["App", "Quiz", "Ask", "Admin", "Info"]) {
  const code = esb.transformSync(fs.readFileSync(`src/${f}.jsx`, "utf8"), { loader: "jsx", format: "esm", jsx: "automatic" }).code;
  const ast = acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" });
  const declared = new Set(); const used = new Set();
  walk(ast, (n, p) => {
    if (n.type === "ImportSpecifier" || n.type === "ImportDefaultSpecifier" || n.type === "ImportNamespaceSpecifier") declared.add(n.local.name);
    if ((n.type === "VariableDeclarator")) walk(n.id, (m) => m.type === "Identifier" && declared.add(m.name));
    if ((n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") && n.id) declared.add(n.id.name);
    if (/Function/.test(n.type)) { n.params.forEach((pp) => walk(pp, (m) => m.type === "Identifier" && declared.add(m.name))); if (n.id) declared.add(n.id.name); }
    if (n.type === "CatchClause" && n.param) walk(n.param, (m) => m.type === "Identifier" && declared.add(m.name));
  });
  walk(ast, (n, p) => {
    if (n.type !== "Identifier") return;
    if (p && p.type === "MemberExpression" && p.property === n && !p.computed) return;
    if (p && (p.type === "Property") && p.key === n && !p.computed && !p.shorthand) return;
    if (p && p.type === "MethodDefinition" && p.key === n) return;
    if (p && (p.type === "ExportSpecifier")) return;
    if (p && (p.type === "LabeledStatement" || p.type === "BreakStatement" || p.type === "ContinueStatement")) return;
    used.add(n.name);
  });
  const miss = [...used].filter((x) => !declared.has(x) && !G.has(x));
  if (miss.length) bad++;
  console.log(miss.length ? `FAIL ${f}: ${miss.join(", ")}` : `ok   ${f}`);
}
process.exit(bad ? 1 : 0);
