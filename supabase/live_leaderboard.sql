-- প্রেডিকশন লিগ রিয়েল টাইমে: খেলা চলার সময় এখনকার স্কোর ধরে পয়েন্ট (হুবহু ৩, শুধু ফল ১, নইলে ০)
-- খেলা শেষ হলে আগের মতো score_predictions() আসল পয়েন্ট বসায় (নকআউটের ৫/৪ নিয়মসহ)
-- knockout_pens_v2.sql আগে চালানো থাকতে হবে

create or replace function live_pts(ph int, pa int, mh int, ma int)
returns int language sql immutable as $$
  select case when ph = mh and pa = ma then 3 when sign(ph - pa) = sign(mh - ma) then 1 else 0 end
$$;

drop function if exists get_leaderboard_comp(int, text);
create function get_leaderboard_comp(lim int default 50, comp text default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean, avatar text, live bigint)
language sql security definer set search_path = public stable as $$
  with x as (
    select p.user_id,
           coalesce(p.points, case when m.status in ('IN_PLAY', 'PAUSED') and m.home_score is not null and m.away_score is not null
                                   then live_pts(p.home, p.away, m.home_score, m.away_score) end) as pts,
           (p.points is null and m.status in ('IN_PLAY', 'PAUSED') and m.home_score is not null) as is_live
    from predictions p join matches m on m.id = p.match_id
    where comp is null or m.competition_code = comp
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
grant execute on function get_leaderboard_comp(int, text) to anon, authenticated;

drop function if exists pleague_board_comp(text, text);
create function pleague_board_comp(p_id text, comp text default null)
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
    where comp is null or mm.competition_code = comp
  ) p on p.user_id = pm.user_id
  where pm.league_id::text = p_id
    and exists (select 1 from pleague_members x where x.league_id::text = p_id and x.user_id = auth.uid())
  group by pm.user_id, pr.display_name
  order by 2 desc, 3 desc, 4 asc;
$$;
grant execute on function pleague_board_comp(text, text) to authenticated;
