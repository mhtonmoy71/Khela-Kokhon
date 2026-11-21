-- নির্দিষ্ট ম্যাচ বা দলের নোটিফিকেশন (🔔): প্রিয় দল ছাড়াও
--   kind = 'match': এই ম্যাচের খবর চাই (enabled = true) বা চাই না (enabled = false, প্রিয় দলের হলেও বন্ধ)
--   kind = 'team' : এই দলের সব খেলার খবর চাই (প্রিয় দল না হলেও)
create table if not exists public.push_follow (
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('match', 'team')),
  target_id  bigint not null,
  enabled    boolean not null default true,
  created_at timestamptz default now(),
  primary key (user_id, kind, target_id)
);
create index if not exists push_follow_target on public.push_follow(kind, target_id);
alter table public.push_follow enable row level security;
drop policy if exists push_follow_own on public.push_follow;
create policy push_follow_own on public.push_follow for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.push_follow to authenticated;
