-- ডেইলি চ্যালেঞ্জের ভুলের (DAILY_SEC) কারণে যাঁরা খেলতে পারেননি, তাঁদের আজ (২৮ নভেম্বর, বাংলাদেশ সময়) আবার খেলার সুযোগ
-- ভুলটা চালু ছিল ২৭ নভেম্বর সকাল ৮টা থেকে ২৮ নভেম্বর রাত ১২:৫০ পর্যন্ত (বাংলাদেশ সময়)।
-- কী হয়: আজ ঠিক হওয়ার আগে শুরু করা খেলা মুছে যায়, তাই তাঁরা আবার "খেলুন" চাপতে পারবেন।
--         টানা খেলার হিসাব (স্ট্রিক) ঠিক থাকে, কারণ সেটা গতকালের সারি থেকে আসে, যা মোছা হয় না।
--         ঠিক হওয়ার পর কেউ আজ এখনো না খেলে থাকলে আজকের প্রশ্নও বদলে যায় (আগে দেখে ফেলা উত্তর কাজে আসবে না)।
-- Supabase → SQL Editor-এ পুরোটা একসাথে চালান।

-- ১. আগে দেখুন কতজন (শুধু দেখায়, কিছু বদলায় না)
select count(*) as replay_users, coalesce(sum(points), 0) as points_now
from daily_plays
where day = date '2026-11-28' and started_at < timestamptz '2026-11-27 18:55:00+00';

-- ২. মুছে দেওয়া, যাতে আবার খেলা যায়
begin;
delete from daily_answers a
using daily_plays p
where a.user_id = p.user_id and a.day = p.day
  and p.day = date '2026-11-28' and p.started_at < timestamptz '2026-11-27 18:55:00+00';
delete from daily_plays
where day = date '2026-11-28' and started_at < timestamptz '2026-11-27 18:55:00+00';
-- আজ আর কেউ খেলেননি এমন হলে আজকের প্রশ্নের সেট নতুন করে বাছাই হবে
delete from daily_sets
where day = date '2026-11-28' and not exists (select 1 from daily_plays where day = date '2026-11-28');
commit;
