-- সাপ্তাহিক লিডারবোর্ডের সপ্তাহ: শনিবার থেকে শুক্রবার (বাংলাদেশ সময়)
create or replace function kk_week_start(wk int)
returns timestamptz language sql stable as $$
  -- আজ থেকে পেছনে সবচেয়ে কাছের শনিবার রাত ১২টা (বাংলাদেশ সময়)
  select (date_trunc('day', now() at time zone 'Asia/Dhaka')
          - make_interval(days => ((extract(dow from now() at time zone 'Asia/Dhaka')::int + 1) % 7))
          + make_interval(days => 7 * wk)) at time zone 'Asia/Dhaka'
$$;

