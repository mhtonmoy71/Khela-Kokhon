-- প্রোফাইলের ছবি: ছোট করা JPEG (data URL, ~১০ KB) সরাসরি profiles-এ রাখা হয়
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles drop constraint if exists profiles_avatar_size;
alter table public.profiles add constraint profiles_avatar_size
  check (avatar_url is null or (length(avatar_url) < 60000 and avatar_url like 'data:image/%'));
