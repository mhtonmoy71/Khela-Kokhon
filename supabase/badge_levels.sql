-- ═══════════════════════════════════════════════════════════════
--  দৈনিক চ্যালেঞ্জের ব্যাজে লেভেল (daily.sql আগে চালানো থাকতে হবে)
--  ৬টা ব্যাজ, প্রতিটায় ধাপ: সবুজ → ব্রোঞ্জ → রুপা → সোনা → প্লাটিনাম → হীরা → কিংবদন্তি,
--  শেষ ধাপের পরেও নির্দিষ্ট ব্যবধানে একটা করে তারা (লক্ষ্য কখনো ফুরায় না)
--    streak   সেরা টানা খেলা        ৩, ৭, ১৪, ৩০, ৬০, ১০০, ১৮০, ৩৬৫ দিন (+৩৬৫-এ তারা)
--    perfect  পারফেক্ট ডে           ১, ৫, ১০, ২৫, ৫০, ১০০, ২৫০ (+২৫০-এ তারা)
--    days     মোট খেলার দিন         ১, ১০, ৫০, ১০০, ২০০, ৩৬৫, ৫০০ (+২৫০-এ তারা)
--    football ফুটবলে সঠিক উত্তর      ৫০, ১৫০, ৫০০, ১০০০, ২৫০০ (+২৫০০-এ তারা)
--    cricket  ক্রিকেটে সঠিক উত্তর     একই
--    week     সাপ্তাহিক সেরা দশ       ১, ৫, ১০, ২৫ বার (+২৫-এ তারা); সাথে চ্যাম্পিয়ন কতবার
--  অর্জিত ধাপ user_badges-এ 'lv:<ব্যাজ>:<ধাপ>' আর তারা 'lv:<ব্যাজ>:s<সংখ্যা>' নামে থাকে (কবে পেলেন সহ)
--  আগের ব্যাজ (first, streak3 ...) যেমন ছিল থাকে; আবার চালালেও ক্ষতি নেই
--  leaderboard_avatars.sql আগে চালানো থাকতে হবে (user_avatar; সাপ্তাহিক র‍্যাঙ্কিংয়ে ছবি)
-- ═══════════════════════════════════════════════════════════════

create or replace function daily_progress(p_user uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with p as (select * from daily_plays where user_id = p_user and finished_at is not null),
  a as (select q.category from daily_answers x join quiz_questions q on q.id = x.qid where x.user_id = p_user and x.correct),
  -- শেষ হয়ে যাওয়া প্রতিটা সপ্তাহে র‍্যাঙ্ক
  w as (
    select user_id, rank() over (partition by wk order by pts desc) rk from (
      select user_id, bd_week_start(day) wk, sum(coalesce(points, raw)) pts from daily_plays
      where day < bd_week_start(bd_today()) group by user_id, bd_week_start(day) having sum(coalesce(points, raw)) > 0
    ) s
  )
  select jsonb_build_object(
    'streak', (select coalesce(max(streak), 0) from daily_plays where user_id = p_user),
    'perfect', (select count(*) from p where correct = 5),
    'days', (select count(*) from p),
    'football', (select count(*) from a where category = 'ফুটবল'),
    'cricket', (select count(*) from a where category = 'ক্রিকেট'),
    'week', (select count(*) from w where user_id = p_user and rk <= 10),
    'champ', (select count(*) from w where user_id = p_user and rk = 1));
$$;

create or replace function badge_steps(m text) returns int[] language sql immutable as $$
  select case m when 'streak' then array[3,7,14,30,60,100,180,365] when 'perfect' then array[1,5,10,25,50,100,250]
    when 'days' then array[1,10,50,100,200,365,500] when 'football' then array[50,150,500,1000,2500]
    when 'cricket' then array[50,150,500,1000,2500] when 'week' then array[1,5,10,25] end;
$$;
create or replace function badge_star_step(m text) returns int language sql immutable as $$
  select case m when 'streak' then 365 when 'perfect' then 250 when 'days' then 250 when 'football' then 2500 when 'cricket' then 2500 when 'week' then 25 end;
$$;

-- আগের daily_award-এর সাথে লেভেলও দেয়; নতুন পাওয়াগুলোর মধ্যে প্রতি ব্যাজের সবচেয়ে উঁচুটা ফেরত দেয়
create or replace function daily_award(p_user uuid) returns text[]
language plpgsql security definer set search_path = public as $$
declare got text[] := '{}'; b text; best int; perf int; fb int; cr int; pw date := bd_week_start(bd_today()) - 7; rk int;
        pr jsonb; m text; v int; st int[]; i int; s int; top text;
begin
  -- আগের ব্যাজ (যেমন ছিল)
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
    if b is not null then insert into user_badges (user_id, badge) values (p_user, b) on conflict do nothing; end if;
  end loop;

  -- লেভেল
  pr := daily_progress(p_user);
  foreach m in array array['streak','perfect','days','football','cricket','week'] loop
    v := coalesce((pr ->> m)::int, 0); st := badge_steps(m); top := null;
    for i in 1 .. array_length(st, 1) loop
      exit when v < st[i];
      insert into user_badges (user_id, badge) values (p_user, 'lv:' || m || ':' || i) on conflict do nothing;
      if found then top := 'lv:' || m || ':' || i; end if;
    end loop;
    if v >= st[array_length(st, 1)] then
      for s in 1 .. ((v - st[array_length(st, 1)]) / badge_star_step(m)) loop
        insert into user_badges (user_id, badge) values (p_user, 'lv:' || m || ':s' || s) on conflict do nothing;
        if found then top := 'lv:' || m || ':s' || s; end if;
      end loop;
    end if;
    if top is not null then got := got || top; end if;
  end loop;
  return got;
end $$;
revoke execute on function daily_award(uuid) from public, anon, authenticated;
revoke execute on function daily_progress(uuid) from public, anon, authenticated;

-- আমার অগ্রগতি (প্রোফাইল আর দৈনিক চ্যালেঞ্জের পাতায়)
create or replace function daily_my_progress() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when auth.uid() is null then null else daily_progress(auth.uid()) end;
$$;
grant execute on function daily_my_progress() to authenticated;

-- সাপ্তাহিক র‍্যাঙ্কিং: নামের পাশে সবচেয়ে উঁচু ব্যাজ ('lv:ব্যাজ:ধাপ')
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
              'is_me', t.user_id = auth.uid(), 'avatar', user_avatar(t.user_id),
              'top', (select ub.badge from user_badges ub where ub.user_id = t.user_id and ub.badge ~ '^lv:[a-z]+:[0-9]+$'
                      order by split_part(ub.badge, ':', 3)::int desc, ub.earned_at limit 1)) order by rk, pts desc)
            from t left join profiles pr on pr.id = t.user_id where rk <= 20 or t.user_id = auth.uid()), '[]'::jsonb));
$$;
grant execute on function daily_week(int) to anon, authenticated;

-- যাঁরা আগে থেকে খেলছেন, তাঁদের লেভেল এখনই বসিয়ে দেওয়া
do $$ declare u uuid; begin
  for u in select distinct user_id from daily_plays loop perform daily_award(u); end loop;
end $$;
