-- লিডারবোর্ডে ছবি: নিজের দেওয়া ছবি, না থাকলে Google অ্যাকাউন্টের ছবি
-- আগে supabase/avatar.sql চালানো থাকতে হবে। ফেরত দেওয়া কলাম বদলাচ্ছে বলে আগে drop, তারপর নতুন করে।

create or replace function user_avatar(p_user uuid) returns text
language sql security definer set search_path = public stable as $$
  select coalesce(
    (select avatar_url from profiles where id = p_user),
    (select coalesce(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture') from auth.users where id = p_user));
$$;
revoke execute on function user_avatar(uuid) from public, anon, authenticated;

drop function if exists get_leaderboard_comp(int, text);
create function get_leaderboard_comp(lim int default 50, comp text default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean, avatar text)
language sql security definer set search_path = public stable as $$
  select coalesce(pr.display_name, 'খেলোয়াড়'), coalesce(sum(p.points), 0),
         count(*) filter (where p.points = 3), count(p.points),
         coalesce(pr.id = auth.uid(), false), user_avatar(pr.id)
  from predictions p
  join profiles pr on pr.id = p.user_id
  join matches m   on m.id = p.match_id
  where comp is null or m.competition_code = comp
  group by pr.id, pr.display_name
  having count(p.points) > 0
  order by 2 desc, 3 desc, 4 asc
  limit lim;
$$;
grant execute on function get_leaderboard_comp(int, text) to anon, authenticated;

drop function if exists pleague_board_comp(text, text);
create function pleague_board_comp(p_id text, comp text default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean, avatar text)
language sql security definer set search_path = public stable as $$
  select coalesce(pr.display_name, 'খেলোয়াড়'), coalesce(sum(p.points), 0),
         count(*) filter (where p.points = 3), count(p.points),
         pm.user_id = auth.uid(), user_avatar(pm.user_id)
  from pleague_members pm
  join profiles pr on pr.id = pm.user_id
  left join (
    select pp.user_id, pp.points
    from predictions pp join matches mm on mm.id = pp.match_id
    where comp is null or mm.competition_code = comp
  ) p on p.user_id = pm.user_id
  where pm.league_id::text = p_id
    and exists (select 1 from pleague_members x where x.league_id::text = p_id and x.user_id = auth.uid())
  group by pm.user_id, pr.display_name
  order by 2 desc, 3 desc, 4 asc;
$$;
grant execute on function pleague_board_comp(text, text) to authenticated;

-- দৈনিক চ্যালেঞ্জের সাপ্তাহিক র‍্যাঙ্কিং (আগের মতোই, শুধু 'avatar' যোগ)
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
              'is_me', t.user_id = auth.uid(), 'avatar', user_avatar(t.user_id)) order by rk, pts desc)
            from t left join profiles pr on pr.id = t.user_id where rk <= 20 or t.user_id = auth.uid()), '[]'::jsonb));
$$;
grant execute on function daily_week(int) to anon, authenticated;
