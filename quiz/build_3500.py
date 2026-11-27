# খেলা কখন? কুইজ: আরও ২,০০০ প্রশ্ন (আগের ১,৫০০টি যেমন আছে তেমনই থাকে, id ১–১৫০০)
# নতুন প্রশ্ন হাতে লেখা, quiz/extra/*.txt ফাইলে। সাল-ভিত্তিক প্রশ্ন কম; প্রতিযোগিতামূলক পরীক্ষার ক্রীড়া অংশ
# (পরিভাষা, খেলোয়াড় সংখ্যা, মাপ, ট্রফি, স্টেডিয়াম, সংস্থা, উৎপত্তি) আর এখনকার খেলা বেশি।
#
# ফাইলের নিয়ম:  "## বিষয়"  এর পরের লাইনগুলো সেই বিষয়ের।
#   কঠিনতা|প্রশ্ন|সঠিক উত্তর|ভুল১;ভুল২;ভুল৩|ব্যাখ্যা (না থাকলেও চলে)
#   কঠিনতা: স = সহজ, ম = মাঝারি, ক = কঠিন।  # দিয়ে শুরু লাইন মন্তব্য।
# চালানো: python3 quiz/build_3500.py  →  quiz/questions.json, quiz/questions.csv, api/_quiz-questions.js
import json, csv, os, re, random, glob, sys
from collections import Counter

here = os.path.dirname(os.path.abspath(__file__))
OLD = json.load(open(os.path.join(here, "questions.json"), encoding="utf-8"))[:1500]
assert [q["id"] for q in OLD] == list(range(1, 1501))
CATS = {"ফুটবল", "ক্রিকেট", "অলিম্পিক", "টেনিস", "অন্যান্য খেলা", "বাংলাদেশ"}
DIFF = {"স": "সহজ", "ম": "মাঝারি", "ক": "কঠিন"}
rng = random.Random(3500)

NEW, errs = [], []
for path in sorted(glob.glob(os.path.join(here, "extra", "*.txt"))):
    cat = None
    for n, line in enumerate(open(path, encoding="utf-8"), 1):
        line = line.strip()
        if not line or line.startswith("#") and not line.startswith("##"): continue
        where = f"{os.path.basename(path)}:{n}"
        if line.startswith("##"):
            cat = line[2:].strip()
            if cat not in CATS: errs.append(f"{where} unknown category {cat}")
            continue
        p = line.split("|")
        if len(p) == 4: p.append("")
        if len(p) != 5: errs.append(f"{where} expected 5 fields, got {len(p)}"); continue
        d, q, a, w, e = (x.strip() for x in p)
        wrong = [x.strip() for x in w.split(";")]
        opts = wrong + [a]
        if d not in DIFF: errs.append(f"{where} bad difficulty {d}")
        if len(wrong) != 3 or len(set(opts)) != 4 or not all(opts): errs.append(f"{where} options {opts}")
        if not q.endswith("?"): errs.append(f"{where} question should end with ?")
        rng.shuffle(opts)
        NEW.append({"category": cat, "difficulty": DIFF.get(d, d), "question": q, "options": opts,
                    "answer": opts.index(a), "explanation": e, "_at": where})

# একই বা প্রায় একই প্রশ্ন (আগের ১,৫০০-এর সাথেও) বাদ: হুবহু এক, অথবা একই উত্তরে বেশিরভাগ শব্দ এক, অথবা প্রায় সব শব্দ এক
def words(s): return set(re.findall(r"[\u0980-\u09FFA-Za-z0-9]+", s)) - {"কোন", "কে", "কী", "কত", "কোথায়", "হয়", "কোনটি", "কয়টি", "ছিল", "ছিলেন", "এর", "ও", "করেন", "কার", "নাম"}
kept, dropped = [], []
pool = [(words(q["question"]), q["options"][q["answer"]], q["question"], "old#" + str(q["id"])) for q in OLD]
for q in NEW:
    w, a = words(q["question"]), q["options"][q["answer"]]
    hit = None
    for w2, a2, t2, at2 in pool:
        j = len(w & w2) / max(1, len(w | w2))
        n1, n2 = {x for x in w if re.search(r"[০-৯]", x)}, {x for x in w2 if re.search(r"[০-৯]", x)}
        if t2 != q["question"] and n1 and n2 and n1 != n2: continue  # আলাদা সাল বা সংখ্যা = আলাদা প্রশ্ন
        if t2 == q["question"] or (a == a2 and j >= 0.7) or j >= 0.9: hit = at2 + " " + t2; break
    if hit: dropped.append(f"{q['_at']} {q['question']}  ≈  {hit}"); continue
    kept.append(q); pool.append((w, a, q["question"], q["_at"]))
NEW = kept
if "--near" in sys.argv: print("\n".join(dropped))
print("বাদ (আগে আছে)", len(dropped))

if errs:
    print("\n".join(errs)); raise SystemExit(f"{len(errs)} error(s)")

print("নতুন", len(NEW), dict(Counter(q["category"] for q in NEW)), dict(Counter(q["difficulty"] for q in NEW)))
if "--check" in sys.argv: raise SystemExit(0)

KEYS = ("category", "difficulty", "question", "options", "answer", "explanation")
rows = [dict(q) for q in OLD] + [{"id": 1500 + i, **{k: q[k] for k in KEYS}} for i, q in enumerate(NEW, 1)]
assert len({r["question"] for r in rows}) == len(rows)
json.dump(rows, open(os.path.join(here, "questions.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
with open(os.path.join(here, "questions.csv"), "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f)
    w.writerow(["id","বিষয়","কঠিনতা","প্রশ্ন","ক","খ","গ","ঘ","সঠিক উত্তর","ব্যাখ্যা"])
    for q in rows: w.writerow([q["id"], q["category"], q["difficulty"], q["question"], *q["options"], "কখগঘ"[q["answer"]] + ") " + q["options"][q["answer"]], q["explanation"]])
open(os.path.join(here, "..", "api", "_quiz-questions.js"), "w", encoding="utf-8").write(
    "// quiz/build_questions.py, quiz/build_more.py আর quiz/build_3500.py থেকে তৈরি — হাতে বদলাবেন না\nexport default " + json.dumps(rows, ensure_ascii=False) + ";\n")
print("মোট", len(rows), dict(Counter(q["category"] for q in rows)))
print("উত্তরের অবস্থান", dict(Counter(q["answer"] for q in NEW)))
