-- লিগ অনুযায়ী লিডারবোর্ড (প্রিমিয়ার লিগ, লা লিগা, চ্যাম্পিয়ন্স লিগ ...)
-- Supabase → SQL Editor-এ একবার চালাতে হবে। আগের কোনো টেবিল বা ফাংশন বদলায় না, শুধু নতুন দুটো ফাংশন যোগ করে।

-- সবার লিডারবোর্ড, একটা লিগের ম্যাচ ধরে
create or replace function get_leaderboard_comp(lim int default 50, comp text default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean)
language sql security definer set search_path = public stable as $$
  select coalesce(pr.display_name, 'খেলোয়াড়')     as display_name,
         coalesce(sum(p.points), 0)                as points,
         count(*) filter (where p.points = 3)      as exact,
         count(p.points)                           as played,
         coalesce(pr.id = auth.uid(), false)       as is_me
  from predictions p
  join profiles pr on pr.id = p.user_id
  join matches m   on m.id = p.match_id
  where comp is null or m.competition_code = comp
  group by pr.id, pr.display_name
  having count(p.points) > 0
  order by points desc, exact desc, played asc
  limit lim;
$$;
grant execute on function get_leaderboard_comp(int, text) to anon, authenticated;

-- বন্ধুদের লিগের লিডারবোর্ড, একটা লিগের ম্যাচ ধরে (শুধু ওই লিগের সদস্যরা দেখতে পারে)
create or replace function pleague_board_comp(p_id text, comp text default null)
returns table (display_name text, points bigint, exact bigint, played bigint, is_me boolean)
language sql security definer set search_path = public stable as $$
  select coalesce(pr.display_name, 'খেলোয়াড়') as display_name,
         coalesce(sum(p.points), 0)            as points,
         count(*) filter (where p.points = 3)  as exact,
         count(p.points)                       as played,
         pm.user_id = auth.uid()               as is_me
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
  order by points desc, exact desc, played asc;
$$;
grant execute on function pleague_board_comp(text, text) to authenticated;
