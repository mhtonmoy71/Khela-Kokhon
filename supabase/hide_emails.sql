-- লিডারবোর্ড, কুইজ আর বন্ধুদের লিগে কারো ইমেইল যেন না দেখা যায়
-- নাম হিসেবে ইমেইল থাকলে শুধু @-এর আগের অংশ রাখা হয় (যেমন rahim.khan@gmail.com → rahim.khan)

-- ১) এখন যাঁদের নাম ইমেইল, তাঁদেরটা ঠিক করা
update public.profiles
   set display_name = nullif(split_part(display_name, '@', 1), '')
 where display_name like '%@%';

-- ২) ভবিষ্যতে কেউ নাম হিসেবে ইমেইল দিলে বা নিজে থেকে বসে গেলে, সেভ হওয়ার আগেই কেটে ফেলা
create or replace function public.profiles_hide_email()
returns trigger language plpgsql as $$
begin
  if new.display_name like '%@%' then
    new.display_name := nullif(split_part(new.display_name, '@', 1), '');
  end if;
  return new;
end $$;

drop trigger if exists profiles_hide_email on public.profiles;
create trigger profiles_hide_email
  before insert or update of display_name on public.profiles
  for each row execute function public.profiles_hide_email();

-- যাচাই: ০ আসা উচিত
-- select count(*) from public.profiles where display_name like '%@%';
