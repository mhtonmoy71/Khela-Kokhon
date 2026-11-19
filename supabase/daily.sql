-- ═══════════════════════════════════════════════════════════════
--  দৈনিক চ্যালেঞ্জ: প্রতিদিন সবার জন্য একই ৫টা প্রশ্ন, পয়েন্ট, ধারাবাহিকতা, ব্যাজ, সাপ্তাহিক র‍্যাঙ্কিং
--  Supabase → SQL Editor-এ একবার চালাতে হবে (quiz.sql আগে চালানো থাকতে হবে, প্রশ্ন ওখান থেকেই)।
--  আগের কোনো টেবিল বা ফাংশন বদলায় না। আবার চালালেও ক্ষতি নেই।
--
--  নিয়ম
--  • দিন ধরা হয় বাংলাদেশ সময়ে (রাত ১২টায় নতুন চ্যালেঞ্জ); সপ্তাহ শনিবার থেকে শুক্রবার
--  • ক্রম: সহজ, সহজ, মাঝারি, মাঝারি, কঠিন; বেশিরভাগ ফুটবল আর ক্রিকেট; গত ৯০ দিনের প্রশ্ন আবার নয়
--  • প্রতি প্রশ্নে ২০ সেকেন্ড; দিনে একবারই খেলা যায়
--  • সঠিক উত্তরে ১০, দ্রুত দিলে সর্বোচ্চ ৫ বোনাস; ৫টাই ঠিক হলে +১০
--  • টানা ৩ দিন খেললে ×১.২, টানা ৭ দিন ×১.৫
--  • প্রশ্ন দেখানো, সময় গোনা আর উত্তর যাচাই সব এখানে; উত্তর দেওয়ার আগে সঠিক উত্তর ব্রাউজারে যায় না
-- ═══════════════════════════════════════════════════════════════

create table if not exists daily_sets (
  day          date primary key,
  question_ids int[] not null,
  created_at   timestamptz not null default now()
);
create table if not exists daily_plays (
  user_id      uuid not null,
  day          date not null,
  idx          int  not null default 0,          -- কয়টা প্রশ্ন শেষ (উত্তর বা সময় শেষ)
  q_started_at timestamptz,                      -- এখনকার প্রশ্ন কখন দেখানো হলো (null = দেখানো হয়নি)
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  correct      int  not null default 0,
  raw          int  not null default 0,          -- গুণকের আগের পয়েন্ট
  streak       int  not null default 1,
  points       int,                              -- শেষ হলে চূড়ান্ত পয়েন্ট
  primary key (user_id, day)
);
create index if not exists daily_plays_day on daily_plays (day);
create table if not exists daily_answers (
  user_id uuid not null,
  day     date not null,
  q_index int  not null,
  qid     int  not null,
  choice  smallint,
  correct boolean not null,
  ms      int  not null,
  pts     int  not null,
  primary key (user_id, day, q_index)
);
create table if not exists user_badges (
  user_id   uuid not null,
  badge     text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge)
);
alter table daily_sets    enable row level security;
alter table daily_plays   enable row level security;
alter table daily_answers enable row level security;
alter table user_badges   enable row level security;

create or replace function bd_today() returns date language sql stable as $$
  select (now() at time zone 'Asia/Dhaka')::date;
$$;
-- শনিবার থেকে সপ্তাহ
create or replace function bd_week_start(d date) returns date language sql immutable as $$
  select d - ((extract(dow from d)::int + 1) % 7);
$$;

-- আজকের ৫টা প্রশ্ন (প্রথমবার চাইলে বানিয়ে রাখে)
create or replace function daily_set_for(d date) returns int[]
language plpgsql security definer set search_path = public as $$
declare ids int[]; picked int[] := '{}'; diffs text[] := array['সহজ','সহজ','মাঝারি','মাঝারি','কঠিন']; df text; q int; recent int[];
begin
  select question_ids into ids from daily_sets where day = d;
  if ids is not null then return ids; end if;
  perform pg_advisory_xact_lock(hashtext('daily_set_' || d::text));
  select question_ids into ids from daily_sets where day = d;
  if ids is not null then return ids; end if;
  select coalesce(array_agg(x), '{}') into recent from daily_sets s, unnest(s.question_ids) x where s.day > d - 90;
  foreach df in array diffs loop
    select id into q from quiz_questions
      where difficulty = df and id <> all(picked) and id <> all(recent)
      order by random() + case when category in ('ফুটবল','ক্রিকেট') then 0 else 0.7 end limit 1;
    if q is null then
      select id into q from quiz_questions where id <> all(picked) order by random() limit 1;
    end if;
    picked := picked || q;
  end loop;
  insert into daily_sets (day, question_ids) values (d, picked) on conflict (day) do nothing;
  select question_ids into ids from daily_sets where day = d;
  return ids;
end $$;

-- নতুন ব্যাজ দেয়, নতুনগুলোর নাম ফেরত দেয়
create or replace function daily_award(p_user uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare got text[] := '{}'; b text; best int; perf int; fb int; cr int; pw date := bd_week_start(bd_today()) - 7; rk int;
begin
  select coalesce(max(streak), 0), count(*) filter (where correct = 5) into best, perf from daily_plays where user_id = p_user and finished_at is not null;
  select count(*) filter (where q.category = 'ফুটবল'), count(*) filter (where q.category = 'ক্রিকেট') into fb, cr
    from daily_answers a join quiz_questions q on q.id = a.qid where a.user_id = p_user and a.correct;
  select r into rk from (
    select user_id, rank() over (order by sum(coalesce(points, raw)) desc) r
    from daily_plays where day between pw and pw + 6 group by user_id having sum(coalesce(points, raw)) > 0
  ) w where user_id = p_user;
  foreach b in array array[
    case when exists (select 1 from daily_plays where user_id = p_user and finished_at is not null) then 'first' end,
    case when best >= 3 then 'streak3' end, case when best >= 7 then 'streak7' end, case when best >= 30 then 'streak30' end,
    case when perf >= 1 then 'perfect' end, case when perf >= 5 then 'perfect5' end,
    case when fb >= 50 then 'football50' end, case when cr >= 50 then 'cricket50' end,
    case when rk <= 10 then 'week10' end, case when rk = 1 then 'week1' end] loop
    if b is not null then
      insert into user_badges (user_id, badge) values (p_user, b) on conflict do nothing;
      if found then got := got || b; end if;
    end if;
  end loop;
  return got;
end $$;

-- সময় পেরোনো প্রশ্নে "উত্তর দেননি" বসায় (নেটের দেরির জন্য ২ সেকেন্ড ছাড়), ৫টা হলে শেষ করে
create or replace function daily_settle(p_user uuid, d date, p_grace int default 22) returns void
language plpgsql security definer set search_path = public as $$
declare pl daily_plays; ids int[]; perfect int; mult numeric;
begin
  select * into pl from daily_plays where user_id = p_user and day = d for update;
  if not found or pl.finished_at is not null then return; end if;
  if pl.q_started_at is not null and now() > pl.q_started_at + make_interval(secs => p_grace) and pl.idx < 5 then
    ids := daily_set_for(d);
    insert into daily_answers values (p_user, d, pl.idx, ids[pl.idx + 1], null, false, 20000, 0) on conflict do nothing;
    update daily_plays set idx = idx + 1, q_started_at = null where user_id = p_user and day = d returning * into pl;
  end if;
  if pl.idx >= 5 then
    perfect := case when pl.correct = 5 then 10 else 0 end;
    mult := case when pl.streak >= 7 then 1.5 when pl.streak >= 3 then 1.2 else 1 end;
    update daily_plays set finished_at = now(), points = round((pl.raw + perfect) * mult) where user_id = p_user and day = d;
  end if;
end $$;

-- এখনকার ধারাবাহিকতা: আজ খেলে থাকলে আজকেরটা, নইলে গতকাল খেলে থাকলে সেটা (এখনো টিকে আছে), নইলে ০
create or replace function daily_streak_now(p_user uuid) returns int language sql stable security definer set search_path = public as $$
  select coalesce((select streak from daily_plays where user_id = p_user and day >= bd_today() - 1 order by day desc limit 1), 0);
$$;

create or replace function daily_state() returns jsonb
language plpgsql security definer set search_path = public as $$
declare d date := bd_today(); uid uuid := auth.uid(); pl daily_plays; ids int[]; q quiz_questions; cur jsonb; review jsonb; marks jsonb;
        wk date := bd_week_start(bd_today()); wpts int; wrank int; badges jsonb; best int; newb text[] := '{}';
begin
  if uid is not null then
    perform daily_settle(uid, d);
    newb := daily_award(uid);
    select * into pl from daily_plays where user_id = uid and day = d;
  end if;
  if pl.user_id is not null then
    ids := daily_set_for(d);
    select coalesce(jsonb_agg(correct order by q_index), '[]') into marks from daily_answers where user_id = uid and day = d;
    if pl.finished_at is null and pl.q_started_at is not null then
      select * into q from quiz_questions where id = ids[pl.idx + 1];
      cur := jsonb_build_object('index', pl.idx, 'category', q.category, 'question', q.question, 'options', to_jsonb(q.options),
        'started_at', pl.q_started_at, 'seconds', 20);
    end if;
    if pl.finished_at is not null then
      select jsonb_agg(jsonb_build_object('question', qq.question, 'options', to_jsonb(qq.options), 'answer', qq.answer,
               'explanation', qq.explanation, 'choice', a.choice, 'pts', a.pts) order by t.i)
        into review
        from unnest(ids) with ordinality t(qid, i) join quiz_questions qq on qq.id = t.qid
        left join daily_answers a on a.user_id = uid and a.day = d and a.q_index = t.i - 1;
    end if;
  end if;
  if uid is not null then
    select sum(coalesce(points, raw)) into wpts from daily_plays where user_id = uid and day between wk and wk + 6;
    select r into wrank from (select user_id, rank() over (order by sum(coalesce(points, raw)) desc) r from daily_plays
      where day between wk and wk + 6 group by user_id having sum(coalesce(points, raw)) > 0) w where user_id = uid;
    select coalesce(jsonb_agg(jsonb_build_object('id', badge, 'at', earned_at) order by earned_at), '[]') into badges from user_badges where user_id = uid;
    select coalesce(max(streak), 0) into best from daily_plays where user_id = uid;
  end if;
  return jsonb_build_object(
    'day', d, 'now', now(), 'next_at', ((d + 1)::timestamp at time zone 'Asia/Dhaka'), 'logged_in', uid is not null,
    'players_today', (select count(*) from daily_plays where day = d),
    'play', case when pl.user_id is null then null else jsonb_build_object('idx', pl.idx, 'finished', pl.finished_at is not null,
      'correct', pl.correct, 'raw', pl.raw, 'points', pl.points, 'streak', pl.streak,
      'mult', case when pl.streak >= 7 then 1.5 when pl.streak >= 3 then 1.2 else 1 end, 'marks', marks) end,
    'current', cur, 'review', review,
    'streak', case when uid is null then 0 else daily_streak_now(uid) end, 'best_streak', coalesce(best, 0),
    'week', jsonb_build_object('start', wk, 'points', coalesce(wpts, 0), 'rank', wrank),
    'badges', coalesce(badges, '[]'::jsonb), 'new_badges', to_jsonb(newb));
end $$;

-- খেলা শুরু (দিনে একবারই)
create or replace function daily_start() returns jsonb
language plpgsql security definer set search_path = public as $$
declare d date := bd_today(); uid uuid := auth.uid(); prev int;
begin
  if uid is null then raise exception 'login required'; end if;
  perform daily_set_for(d);
  select streak into prev from daily_plays where user_id = uid and day = d - 1;
  insert into daily_plays (user_id, day, streak, q_started_at) values (uid, d, coalesce(prev, 0) + 1, now()) on conflict do nothing;
  return daily_state();
end $$;

-- উত্তর দেখার পর পরের প্রশ্ন (সময় এখান থেকেই গোনা শুরু)
create or replace function daily_next() returns jsonb
language plpgsql security definer set search_path = public as $$
declare d date := bd_today(); uid uuid := auth.uid();
begin
  if uid is null then raise exception 'login required'; end if;
  perform daily_settle(uid, d, 20);  -- সময় শেষ হয়ে থাকলে আগেরটা বাতিল ধরে তবেই পরের প্রশ্ন
  update daily_plays set q_started_at = now() where user_id = uid and day = d and finished_at is null and q_started_at is null and idx < 5;
  return daily_state();
end $$;

create or replace function daily_answer(p_index int, p_choice int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d date := bd_today(); uid uuid := auth.uid(); pl daily_plays; ids int[]; q quiz_questions; el int; ok boolean; p int; fin boolean; newb text[] := '{}';
begin
  if uid is null then raise exception 'login required'; end if;
  perform daily_settle(uid, d);
  select * into pl from daily_plays where user_id = uid and day = d for update;
  if not found or pl.finished_at is not null or pl.q_started_at is null or pl.idx <> p_index then raise exception 'time over'; end if;
  ids := daily_set_for(d);
  select * into q from quiz_questions where id = ids[p_index + 1];
  el := least(20000, greatest(0, (extract(epoch from (now() - pl.q_started_at)) * 1000)::int));
  ok := p_choice = q.answer;
  p := case when ok then 10 + round(5 * (1 - el / 20000.0))::int else 0 end;
  insert into daily_answers values (uid, d, p_index, q.id, p_choice, ok, el, p);
  update daily_plays set idx = idx + 1, q_started_at = null, correct = correct + ok::int, raw = raw + p where user_id = uid and day = d;
  perform daily_settle(uid, d);
  select finished_at is not null into fin from daily_plays where user_id = uid and day = d;
  if fin then newb := daily_award(uid); end if;
  return jsonb_build_object('correct', ok, 'answer', q.answer, 'explanation', q.explanation, 'pts', p, 'ms', el,
    'finished', fin, 'new_badges', to_jsonb(newb));
end $$;

-- সাপ্তাহিক র‍্যাঙ্কিং: p_offset ০ = এই সপ্তাহ, -১ = গত সপ্তাহ
create or replace function daily_week(p_offset int default 0) returns jsonb
language sql security definer set search_path = public stable as $$
  with w as (select bd_week_start(bd_today()) + 7 * greatest(-8, least(0, p_offset)) as s),
  t as (
    select p.user_id, sum(coalesce(p.points, p.raw))::int as pts, count(*)::int as days,
           rank() over (order by sum(coalesce(p.points, p.raw)) desc, count(*) desc) as rk
    from daily_plays p, w where p.day between w.s and w.s + 6
    group by p.user_id having sum(coalesce(p.points, p.raw)) > 0
  )
  select jsonb_build_object('start', (select s from w), 'end', (select s + 6 from w),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('rank', rk, 'name', coalesce(pr.display_name, 'খেলোয়াড়'), 'points', pts, 'days', days,
              'is_me', t.user_id = auth.uid()) order by rk, pts desc)
            from t left join profiles pr on pr.id = t.user_id where rk <= 20 or t.user_id = auth.uid()), '[]'::jsonb));
$$;

revoke execute on function daily_set_for(date) from public, anon, authenticated;
revoke execute on function daily_award(uuid) from public, anon, authenticated;
revoke execute on function daily_settle(uuid, date, int) from public, anon, authenticated;
revoke execute on function daily_streak_now(uuid) from public, anon, authenticated;
grant execute on function daily_state() to anon, authenticated;
grant execute on function daily_week(int) to anon, authenticated;
grant execute on function daily_start() to authenticated;
grant execute on function daily_next() to authenticated;
grant execute on function daily_answer(int, int) to authenticated;
