-- দৈনিক চ্যালেঞ্জ: স্ট্রিকের গুণক (×১.২, ×১.৫) বাদ
-- দিনের পয়েন্ট = ৫ প্রশ্নের পয়েন্ট + পারফেক্ট বোনাস (৫টাই সঠিক হলে +১০), দিনে সর্বোচ্চ ৮৫
-- স্ট্রিক থাকছে শুধু সংখ্যা আর ব্যাজ হিসেবে

create or replace function daily_settle(p_user uuid, d date, p_grace int default 22) returns void
language plpgsql security definer set search_path = public as $$
declare pl daily_plays; ids int[];
begin
  select * into pl from daily_plays where user_id = p_user and day = d for update;
  if not found or pl.finished_at is not null then return; end if;
  if pl.q_started_at is not null and now() > pl.q_started_at + make_interval(secs => p_grace) and pl.idx < 5 then
    ids := daily_set_for(d);
    insert into daily_answers values (p_user, d, pl.idx, ids[pl.idx + 1], null, false, 20000, 0) on conflict do nothing;
    update daily_plays set idx = idx + 1, q_started_at = null where user_id = p_user and day = d returning * into pl;
  end if;
  if pl.idx >= 5 then
    update daily_plays set finished_at = now(), points = pl.raw + case when pl.correct = 5 then 10 else 0 end
    where user_id = p_user and day = d;
  end if;
end $$;
revoke execute on function daily_settle(uuid, date, int) from public, anon, authenticated;

-- এই সপ্তাহের (শনিবার থেকে) শেষ হওয়া খেলাগুলো নতুন নিয়মে আবার হিসাব, যাতে র‍্যাঙ্কিং এখনই সবার জন্য সমান হয়
update daily_plays
set points = raw + case when correct = 5 then 10 else 0 end
where finished_at is not null and day >= bd_week_start(bd_today());

-- যাচাই: এই সপ্তাহে কারো পয়েন্ট ৮৫-এর বেশি থাকলে এখানে আসবে (খালি থাকার কথা)
select user_id, day, raw, correct, points from daily_plays
where day >= bd_week_start(bd_today()) and points > 85;
