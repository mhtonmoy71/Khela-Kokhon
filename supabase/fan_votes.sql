-- ═══════════════════════════════════════════════════════════════
--  ভক্তদের রায়: প্রতিটা ম্যাচে "কে জিতবে?" ভোট (লগইন ছাড়াই)
--  Supabase → SQL Editor-এ একবার চালাতে হবে। আগের কোনো টেবিল বা ফাংশন বদলায় না।
--  • ভোট দেওয়া যায় খেলা শুরুর আগ পর্যন্ত; একই ফোন/ব্রাউজার থেকে একটাই ভোট (বদলানো যায়)
--  • একই ইন্টারনেট ঠিকানা থেকে এক ম্যাচে সর্বোচ্চ ১০টা ভোট, যাতে কেউ গাদা গাদা ভোট দিতে না পারে
--  • ফলাফল সবাই দেখতে পারে; কে কাকে ভোট দিল তা কেউ দেখতে পারে না
-- ═══════════════════════════════════════════════════════════════

create table if not exists match_votes (
  match_id   bigint      not null,
  voter      uuid        not null,
  pick       smallint    not null check (pick between 0 and 2),  -- ০ = ঘরের দল, ১ = ড্র, ২ = অতিথি দল
  ip         text,
  created_at timestamptz not null default now(),
  primary key (match_id, voter)
);
create index if not exists match_votes_ip on match_votes (match_id, ip);
alter table match_votes enable row level security;  -- সরাসরি পড়া-লেখা বন্ধ, শুধু নিচের ফাংশন দিয়ে

-- কয়েকটা ম্যাচের ভোট একসাথে: {"<match_id>": [ঘরের, ড্র, অতিথি], ...}
create or replace function match_votes_get(p_ids bigint[])
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_object_agg(match_id::text, jsonb_build_array(h, d, a)), '{}'::jsonb)
  from (
    select match_id,
           count(*) filter (where pick = 0) as h,
           count(*) filter (where pick = 1) as d,
           count(*) filter (where pick = 2) as a
    from match_votes
    where match_id = any(p_ids[1:50])
    group by match_id
  ) s;
$$;

create or replace function match_vote(p_match bigint, p_voter uuid, p_pick int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ip text; v_kick timestamptz;
begin
  if p_pick not between 0 and 2 then raise exception 'bad pick'; end if;
  select utc_date into v_kick from matches where id = p_match;
  if v_kick is null then raise exception 'match not found'; end if;
  if now() >= v_kick then raise exception 'voting closed'; end if;
  begin
    v_ip := md5(nullif(trim(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)), ''));
  exception when others then v_ip := null;
  end;
  if exists (select 1 from match_votes where match_id = p_match and voter = p_voter) then
    update match_votes set pick = p_pick, created_at = now() where match_id = p_match and voter = p_voter;
  elsif v_ip is null or (select count(*) from match_votes where match_id = p_match and ip = v_ip) < 10 then
    insert into match_votes (match_id, voter, pick, ip) values (p_match, p_voter, p_pick, v_ip);
  end if;
  return match_votes_get(array[p_match]);
end $$;

grant execute on function match_votes_get(bigint[]) to anon, authenticated;
grant execute on function match_vote(bigint, uuid, int) to anon, authenticated;
