-- ইউজারের ফোনে/ব্রাউজারে সাইটে কোনো ভুল (এরর) হলে এখানে জমা হয় (/api/log, শুধু সার্ভার লেখে)
-- একই ভুল একবারই সারি, বারবার হলে count বাড়ে; নতুন ভুল আর বারবার হওয়া ভুলে অ্যাডমিনের ফোনে নোটিফিকেশন
create table if not exists client_errors (
  fp text primary key,               -- ভুলের ছাপ (বার্তা + কোডের জায়গা)
  msg text, src text, stack text, url text, ua text, build text,
  count int not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);
alter table client_errors enable row level security;  -- কোনো ব্যবহারকারী পড়তে/লিখতে পারে না, শুধু সার্ভিস রোল

create or replace function log_client_error(p jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into client_errors (fp, msg, src, stack, url, ua, build)
  values (p->>'fp', left(p->>'msg', 500), left(p->>'src', 300), left(p->>'stack', 2000), left(p->>'url', 300), left(p->>'ua', 300), left(p->>'build', 40))
  on conflict (fp) do update set count = client_errors.count + 1, last_seen = now(),
    url = excluded.url, ua = excluded.ua, build = excluded.build
  returning count into n;
  return n;
end $$;
revoke execute on function log_client_error(jsonb) from public, anon, authenticated;
grant execute on function log_client_error(jsonb) to service_role;
