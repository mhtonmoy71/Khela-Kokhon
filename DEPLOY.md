# খেলা কখন? v2 — চালু করার ধাপ

## কীভাবে কাজ করে

```
football-data.org (ফ্রি) ──► /api/sync (Vercel, দিনে একবার) ──► Supabase ◄── সাইটের ভিজিটর
```

- ভিজিটররা কখনো football-data.org-এ যায় না, সবাই Supabase থেকে পড়ে। তাই ইউজার বাড়লেও API কল বাড়ে না, খরচও শূন্য থাকে।
- full সিঙ্ক দিনে একবার চলে, প্রতিদিন সকাল ৬টায় (বাংলাদেশ সময়)। এতে ৬টা প্রতিযোগিতার পুরো মৌসুম আসে: চ্যাম্পিয়ন্স লিগ, প্রিমিয়ার লিগ, লা লিগা, বুন্দেসলিগা, সিরি আ আর লিগ আঁ।
- ফল আরও তাড়াতাড়ি চাইলে ধাপ ৫ দেখুন।

## ধাপ ১ — Supabase-এ টেবিল বানানো

1. Supabase Dashboard → **SQL Editor** → **New query**
2. `supabase/schema.sql` ফাইলের পুরোটা পেস্ট করে **Run** চাপুন।

এটা আগের পরীক্ষামূলক v2 টেবিলগুলো (থাকলে) মুছে নতুন করে বানায়। লগইন অ্যাকাউন্ট মুছবে না।

## ধাপ ২ — Supabase Auth সেটিংস

**Authentication → URL Configuration**
- Site URL: `https://khelakokhon.com`
- Redirect URLs: `https://khelakokhon.com/**` আর `http://localhost:5173/**`

**Google দিয়ে লগইন (ঐচ্ছিক):** Authentication → Providers → Google চালু করে Google Cloud-এর Client ID আর Secret বসান। Google Cloud-এ redirect URI দিতে হবে `https://chgegfcnfzihmytgbhjh.supabase.co/auth/v1/callback`।

## ধাপ ৩ — GitHub-এ কোড

রিপোর পুরনো ফাইলগুলো সরিয়ে এই ফোল্ডারের সব ফাইল দিন:

```bash
git rm -rf .
# এই zip-এর সব কিছু রিপোর ফোল্ডারে কপি করুন
git add .
git commit -m "v2: Supabase + দৈনিক সিঙ্ক"
git push origin main
```

পুরনো বিশ্বকাপ v1 কোড git history-তে থেকে যাবে, দরকার হলে ফেরত আনা যাবে।

## ধাপ ৪ — Vercel Environment Variables

Vercel → Project → **Settings → Environment Variables**-এ এগুলো যোগ করুন:

| নাম | মান | কোথায় পাবেন |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://chgegfcnfzihmytgbhjh.supabase.co` | |
| `VITE_SUPABASE_ANON_KEY` | anon key | Supabase → Settings → API |
| `SUPABASE_URL` | `https://chgegfcnfzihmytgbhjh.supabase.co` | |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | Supabase → Settings → API (**গোপন**) |
| `FD_KEY` | football-data.org key | football-data.org অ্যাকাউন্ট |
| `CRON_SECRET` | যেকোনো লম্বা র‍্যান্ডম লেখা | নিজে বানান |

তারপর **Deployments → Redeploy** চাপুন।

⚠️ আগের v2-তে football-data key `VITE_FD_KEY` নামে ব্রাউজারে যেত, তাই যে কেউ সেটা দেখতে পারত। football-data.org থেকে নতুন key নিয়ে `FD_KEY`-এ বসানো ভালো। পুরনো `VITE_FD_KEY` মুছে দিন।

## ধাপ ৫ — প্রথম সিঙ্ক আর পরীক্ষা

ব্রাউজারে একবার খুলুন:

```
https://khelakokhon.com/api/sync?secret=আপনার-CRON_SECRET
```

`{"ok":true,"mode":"full","teams":…,"matches":…}` দেখালে সব ঠিক আছে। এরপর থেকে Vercel নিজেই প্রতিদিন এটা চালাবে।

**ফল আরও তাড়াতাড়ি চাইলে (ঐচ্ছিক, ফ্রি):** Vercel-এর ফ্রি প্ল্যানে ক্রন দিনে একবারই চলে। ম্যাচের দিনে স্কোর ঘনঘন আপডেট করতে [cron-job.org](https://cron-job.org)-এ একটা ফ্রি জব বানান:
- URL: `https://khelakokhon.com/api/sync?mode=quick&secret=আপনার-CRON_SECRET`
- সময়: প্রতি ১৫ মিনিট

quick মোডে প্রতিবার মাত্র ১টা কল হয় (গতকাল থেকে আগামীকালের ম্যাচ), তাই ফ্রি সীমার অনেক নিচে থাকে। মনে রাখবেন, ফ্রি টায়ারের স্কোর কিছুটা দেরিতে আসে।

সিঙ্ক কখন চলল আর কোনো ভুল হলো কি না, তা Supabase-এর `sync_log` টেবিলে দেখা যাবে।

**লাইভ মিনিট, ঘটনা, লাইনআপ, পরিসংখ্যান (API-Football, পেইড):**
- Vercel-এ `APIF_KEY` (API-Football-এর key) রাখুন।
- `supabase/af_live.sql`-এ CRON_SECRET বসিয়ে SQL Editor-এ চালান। এটা `match_live` টেবিল বানায় আর প্রতি মিনিটে `/api/live` চালায়।
- আশেপাশে খেলা না থাকলে API-Football-এ কোনো কল হয় না। Pro প্ল্যান (দিনে ৭,৫০০ কল) যথেষ্ট।
- API-Football-এর সাবস্ক্রিপশন নিজে থেকে নবায়ন হয় না; মেয়াদ শেষ হলে লাইভ বিস্তারিত থেমে যায়, বাকি সাইট আগের মতো চলে।

**ফোনে নোটিফিকেশন (প্রিয় দলের খেলা শুরু, গোল, খেলা শেষ):**
- `supabase/notifications.sql` চালান (push_subs, push_log, profiles.follow_lg)।
- Vercel-এ `VAPID_PRIVATE_KEY` রাখুন (পাবলিক চাবিটা কোডেই আছে)। গোপন, কোথাও কমিট করবেন না।
- পরীক্ষা: `/api/live?mode=pushtest` (CRON_SECRET দিয়ে) নোটিফিকেশন চালু করা সবার ফোনে একটা বার্তা পাঠায়।

## লোকালি চালানো

```bash
npm install
npm run dev
```

`.env.local` না থাকলে সাইট **ডেমো মোডে** চলে, মানে নমুনা ডেটা দেখায় আর লগইন শুধু ব্রাউজারে থাকে। ডিজাইন দেখতে বা পরীক্ষা করতে এটা কাজে লাগে।

## কোন ফাইলে কী

| ফাইল | কাজ |
|---|---|
| `src/App.jsx` | মূল অ্যাপ, ট্যাব, লগইন অবস্থা |
| `src/pages/Home.jsx` | হোম: পরের খেলা, তোমার দল, রাইভাল, আজকের খেলা |
| `src/pages/Matches.jsx` | তারিখ ধরে সব ম্যাচ |
| `src/pages/Predict.jsx` | প্রেডিকশন আর লিডারবোর্ড |
| `src/pages/Profile.jsx` | রেজিস্ট্রেশন, লগইন আর সেটিংস |
| `src/pages/Onboarding.jsx` | প্রিয় দল (৩টা) আর রাইভাল (৫টা) বাছাই |
| `src/components.jsx` | ম্যাচ সারি, ম্যাচের বিস্তারিত শিট, শেয়ার |
| `src/lib/data.js` | Supabase-এর সব কোয়েরি |
| `src/lib/format.js` | বাংলাদেশ সময়, বাংলা সংখ্যা |
| `api/sync.js` | দৈনিক সিঙ্ক |
| `api/_teams-bn.js` | দলের বাংলা নাম, নতুন দল এখানে যোগ করবেন |
| `supabase/schema.sql` | ডাটাবেস |

## পয়েন্টের নিয়ম

হুবহু স্কোর মিললে ৩ পয়েন্ট। শুধু ফল (জয়, ড্র বা হার) মিললে ১ পয়েন্ট। কিকঅফের পর প্রেডিকশন দেওয়া বা বদলানো যায় না, এটা ডাটাবেস নিজেই আটকায়। ম্যাচ শেষের পরের সিঙ্কে পয়েন্ট বসে।

## নতুন সংস্করণ নিজে থেকে চালু

ব্যবহারকারীকে রিফ্রেশ করতে হয় না। খোলা অ্যাপ প্রতি ৫ মিনিটে (আর অ্যাপে ফিরলেই) নতুন সংস্করণ খোঁজে।
পেলে কাজের মাঝখানে না থামিয়ে বদলায়: অ্যাপ পেছনে গেলে, অন্য পাতায় গেলে, বা ১ মিনিট কিছু না করলে।
লেখার ঘরে থাকলে বা কুইজ/দৈনিক চ্যালেঞ্জ চলার সময় বদলায় না। কোডটা `src/main.jsx`-এ।
কোন সংস্করণ চলছে দেখতে ব্রাউজারের কনসোলে `__kkBuild`। নতুন service worker সাথে সাথে চালু হয় (skipWaiting + clientsClaim)। পুরনো কোডের পাতা (যেগুলো KK_PING-এর উত্তর দেয় না) একবার নিজে থেকে রিলোড হয়।

