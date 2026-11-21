-- নকআউটের পয়েন্ট নতুন নিয়মে (knockout_pens.sql আগে চালানো থাকতে হবে)
-- নকআউটে ড্র দিয়ে টাইব্রেকারের জয়ী বাছলে, আর খেলা সত্যিই টাইব্রেকারে গেলে:
--   হুবহু স্কোর + টাইব্রেকারের জয়ী ঠিক = ৫
--   স্কোর ভুল, টাইব্রেকারের জয়ী ঠিক   = ৪
--   টাইব্রেকারের জয়ী ভুল              = সাধারণ নিয়ম (হুবহু ৩, শুধু ড্র ১)
-- বাকি সব ম্যাচ আগের মতো: হুবহু ৩, শুধু ফল ১, নইলে ০

create or replace function score_predictions()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update predictions p set points =
    case
      when m.pen_home is not null and m.pen_away is not null and m.pen_home <> m.pen_away
       and p.pen_pick = (case when m.pen_home > m.pen_away then 1 else 2 end)
        then case when p.home = m.home_score and p.away = m.away_score then 5 else 4 end
      when p.home = m.home_score and p.away = m.away_score then 3
      when sign(p.home - p.away) = sign(m.home_score - m.away_score) then 1
      else 0
    end
  from matches m
  where m.id = p.match_id
    and m.status = 'FINISHED'
    and m.home_score is not null and m.away_score is not null;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function score_predictions() from public, anon, authenticated;
grant  execute on function score_predictions() to service_role;

-- লিডারবোর্ডে "হুবহু" গোনা: ৩, বা নকআউটে সব ঠিক = ৫
drop function if exists get_leaderboard_comp(int, text);
create function get_leaderboard_comp(lim int default 50, comp text default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean, avatar text)
language sql security definer set search_path = public stable as $$
  select coalesce(pr.display_name, 'খেলোয়াড়'), coalesce(sum(p.points), 0),
         count(*) filter (where p.points in (3, 5)), count(p.points),
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
         count(*) filter (where p.points in (3, 5)), count(p.points),
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



-- আগের ম্যাচগুলোর পয়েন্ট নতুন নিয়মে আবার হিসাব
select score_predictions();
