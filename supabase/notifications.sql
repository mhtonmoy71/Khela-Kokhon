-- ১) ফলো করা লিগ অ্যাকাউন্টে রাখা (সব ডিভাইসে একই ক্রম)
alter table public.profiles add column if not exists follow_lg jsonb;

-- ২) ফোনে নোটিফিকেশন: কোন ফোন/ব্রাউজারে পাঠাতে হবে
create table if not exists public.push_subs (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  prefs      jsonb not null default '{"start": true, "goal": true, "end": true}',
  created_at timestamptz default now()
);
create index if not exists push_subs_user on public.push_subs(user_id);
alter table public.push_subs enable row level security;
drop policy if exists push_subs_own on public.push_subs;
create policy push_subs_own on public.push_subs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_subs to authenticated;
grant usage, select on sequence public.push_subs_id_seq to authenticated;

-- ৩) একই গোলের বার্তা যেন দুবার না যায় (শুধু সার্ভার লেখে)
create table if not exists public.push_log (
  match_id   bigint not null,
  ev         text not null,
  created_at timestamptz default now(),
  primary key (match_id, ev)
);
alter table public.push_log enable row level security;

-- পুরনো লগ মুছে ফেলা (৭ দিনের বেশি পুরনো)
select cron.unschedule(jobid) from cron.job where jobname = 'kk-push-log-clean';
select cron.schedule('kk-push-log-clean', '17 3 * * *', $job$ delete from public.push_log where created_at < now() - interval '7 days'; $job$);
