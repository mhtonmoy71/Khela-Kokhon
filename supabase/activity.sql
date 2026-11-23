-- সাইটে কে কত সময় কাটাচ্ছেন (অ্যাডমিন প্যানেলের "ব্যবহার" ট্যাব)
-- ব্রাউজার সাইট খোলা আর সামনে থাকলে প্রতি ৩০ সেকেন্ডে log_activity() ডাকে
-- লগইন করা থাকলে auth.uid() দিয়েই চেনা (অন্য কারো নামে সময় যোগ করা যায় না); না থাকলে ফোনের বেনামি আইডি
-- কী টাইপ করা হলো বা কোনো ব্যক্তিগত তথ্য জমা হয় না: শুধু সময়, কোন অংশে, কোথা থেকে এসেছেন, কোন ধরনের ডিভাইস

create table if not exists activity_users (
  uid text primary key,               -- ইউজারের আইডি, বা 'a:' + বেনামি ফোন-আইডি
  is_user boolean not null default false,
  first_day date not null,            -- প্রথম যেদিন এসেছেন (বাংলাদেশ সময়)
  ref text,                           -- প্রথমবার কোথা থেকে: facebook, google, app, direct ...
  platform text,                      -- android / ios / desktop (+ app)
  total_seconds bigint not null default 0,
  last_seen timestamptz not null default now()
);
create table if not exists activity_daily (
  day date not null,
  uid text not null,
  is_user boolean not null default false,
  seconds int not null default 0,
  sessions int not null default 0,
  last_sid text,
  pages jsonb not null default '{}',  -- অংশ অনুযায়ী সেকেন্ড: {"match": 120, "predict": 60}
  primary key (day, uid)
);
create index if not exists activity_daily_day on activity_daily (day);
create index if not exists activity_users_seen on activity_users (last_seen);
alter table activity_users enable row level security;   -- পড়তে পারে শুধু সার্ভার (অ্যাডমিন)
alter table activity_daily enable row level security;

create or replace function log_activity(p_dev text, p_sec int, p_sec_name text, p_sid text, p_ref text, p_platform text)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  v_uid text;
  v_day date := (now() at time zone 'Asia/Dhaka')::date;
  v_sec int := least(greatest(coalesce(p_sec, 0), 0), 60);
  v_sec_name text := left(coalesce(nullif(p_sec_name, ''), 'other'), 20);
begin
  if me is not null then v_uid := me::text;
  elsif p_dev ~ '^[A-Za-z0-9]{8,40}$' then v_uid := 'a:' || p_dev;
  else return; end if;

  insert into activity_users (uid, is_user, first_day, ref, platform, total_seconds, last_seen)
  values (v_uid, me is not null, v_day, left(p_ref, 20), left(p_platform, 20), v_sec, now())
  on conflict (uid) do update set total_seconds = activity_users.total_seconds + v_sec, last_seen = now(),
    platform = coalesce(left(p_platform, 20), activity_users.platform);

  insert into activity_daily (day, uid, is_user, seconds, sessions, last_sid, pages)
  values (v_day, v_uid, me is not null, v_sec, 1, left(p_sid, 40), jsonb_build_object(v_sec_name, v_sec))
  on conflict (day, uid) do update set
    seconds = activity_daily.seconds + v_sec,
    sessions = activity_daily.sessions + (case when activity_daily.last_sid is distinct from left(p_sid, 40) then 1 else 0 end),
    last_sid = left(p_sid, 40),
    pages = activity_daily.pages || jsonb_build_object(v_sec_name, coalesce((activity_daily.pages ->> v_sec_name)::int, 0) + v_sec);
end $$;
grant execute on function log_activity(text, int, text, text, text, text) to anon, authenticated;
