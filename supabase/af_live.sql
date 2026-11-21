-- লাইভ ম্যাচের বিস্তারিত (API-Football): মিনিট, স্কোর, ঘটনা, লাইনআপ, পরিসংখ্যান, খেলোয়াড়ের রেটিং
-- সাইটের /api/live প্রতি মিনিটে এটা ভরে; সবাই শুধু পড়তে পারেন, লিখতে পারে শুধু সার্ভার।
--
-- চালানোর আগে নিচের  এখানে-CRON_SECRET  লেখাটা মুছে Vercel-এর CRON_SECRET-এর মান বসান (দুই পাশের ' রেখে)।
-- এই ফাইল সেই মানসহ কোথাও শেয়ার বা কমিট করবেন না।

create table if not exists public.match_live (
  match_id      bigint primary key references public.matches(id) on delete cascade,
  af_id         bigint,
  map_tried_at  timestamptz,
  status        text,
  elapsed       int,
  extra         int,
  home_goals    int,
  away_goals    int,
  events        jsonb,
  lineups       jsonb,
  stats         jsonb,
  players       jsonb,
  final_seen_at timestamptz,
  updated_at    timestamptz default now()
);
alter table public.match_live enable row level security;
drop policy if exists match_live_read on public.match_live;
create policy match_live_read on public.match_live for select to anon, authenticated using (true);
grant select on public.match_live to anon, authenticated;

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'kk-live';
select cron.schedule('kk-live', '* * * * *', $job$
  select net.http_get(
    url := 'https://khelakokhon.com/api/live',
    headers := jsonb_build_object('Authorization', 'Bearer ' || 'এখানে-CRON_SECRET'),
    timeout_milliseconds := 30000);
$job$);

-- যাচাই: খেলা চলার সময় কয়েক মিনিট পরে চালান
-- select mode, ok, detail, created_at from sync_log where mode = 'live' order by created_at desc limit 5;
-- select match_id, af_id, status, elapsed, home_goals, away_goals from match_live order by updated_at desc limit 10;
