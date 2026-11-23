-- সাপ্তাহিক লিডারবোর্ড: "এই সপ্তাহ" আর "গত সপ্তাহ" (শনিবার থেকে শুক্রবার, বাংলাদেশ সময়ে খেলা শুরুর হিসাবে)
-- wk = null হলে পুরো সিজন (আগের মতো), 0 = এই সপ্তাহ, -1 = গত সপ্তাহ
-- live_leaderboard.sql আগে চালানো থাকতে হবে (live_pts, user_avatar)

create or replace function kk_week_start(wk int)
returns timestamptz language sql stable as $$
  -- আজ থেকে পেছনে সবচেয়ে কাছের শনিবার রাত ১২টা (বাংলাদেশ সময়)
  select (date_trunc('day', now() at time zone 'Asia/Dhaka')
          - make_interval(days => ((extract(dow from now() at time zone 'Asia/Dhaka')::int + 1) % 7))
          + make_interval(days => 7 * wk)) at time zone 'Asia/Dhaka'
$$;

drop function if exists get_leaderboard_v3(int, text, int);
create function get_leaderboard_v3(lim int default 50, comp text default null, wk int default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean, avatar text, live bigint)
language sql security definer set search_path = public stable as $$
  with x as (
    select p.user_id,
           coalesce(p.points, case when m.status in ('IN_PLAY', 'PAUSED') and m.home_score is not null and m.away_score is not null
                                   then live_pts(p.home, p.away, m.home_score, m.away_score) end) as pts,
           (p.points is null and m.status in ('IN_PLAY', 'PAUSED') and m.home_score is not null) as is_live
    from predictions p join matches m on m.id = p.match_id
    where (comp is null or m.competition_code = comp)
      and (wk is null or (m.utc_date >= kk_week_start(wk) and m.utc_date < kk_week_start(wk + 1)))
  )
  select coalesce(pr.display_name, 'খেলোয়াড়'), coalesce(sum(x.pts), 0),
         count(*) filter (where x.pts in (3, 5)), count(x.pts),
         coalesce(pr.id = auth.uid(), false), user_avatar(pr.id),
         count(*) filter (where x.is_live)
  from x join profiles pr on pr.id = x.user_id
  group by pr.id, pr.display_name
  having count(x.pts) > 0
  order by 2 desc, 3 desc, 4 asc
  limit lim;
$$;
grant execute on function get_leaderboard_v3(int, text, int) to anon, authenticated;

drop function if exists pleague_board_v3(text, text, int);
create function pleague_board_v3(p_id text, comp text default null, wk int default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean, avatar text, live bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(pr.display_name, 'খেলোয়াড়'), coalesce(sum(p.pts), 0),
         count(*) filter (where p.pts in (3, 5)), count(p.pts),
         pm.user_id = auth.uid(), user_avatar(pm.user_id),
         count(*) filter (where p.is_live)
  from pleague_members pm
  join profiles pr on pr.id = pm.user_id
  left join (
    select pp.user_id,
           coalesce(pp.points, case when mm.status in ('IN_PLAY', 'PAUSED') and mm.home_score is not null and mm.away_score is not null
                                    then live_pts(pp.home, pp.away, mm.home_score, mm.away_score) end) as pts,
           (pp.points is null and mm.status in ('IN_PLAY', 'PAUSED') and mm.home_score is not null) as is_live
    from predictions pp join matches mm on mm.id = pp.match_id
    where (comp is null or mm.competition_code = comp)
      and (wk is null or (mm.utc_date >= kk_week_start(wk) and mm.utc_date < kk_week_start(wk + 1)))
  ) p on p.user_id = pm.user_id
  where pm.league_id::text = p_id
    and exists (select 1 from pleague_members x where x.league_id::text = p_id and x.user_id = auth.uid())
  group by pm.user_id, pr.display_name
  order by 2 desc, 3 desc, 4 asc;
$$;
grant execute on function pleague_board_v3(text, text, int) to authenticated;
