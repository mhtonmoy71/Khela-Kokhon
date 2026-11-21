-- লাইভ স্কোর: প্রতি ২ মিনিটে /api/sync?mode=quick চালানো (Supabase-এর ভেতরের ঘড়ি দিয়ে, বাইরের কোনো সার্ভিস লাগে না)
-- quick মোডে প্রতিবার football-data.org-এ মাত্র ১টা কল (গতকাল থেকে আগামীকালের ম্যাচ), ফ্রি সীমার (মিনিটে ১০টা) অনেক নিচে।
--
-- চালানোর আগে নিচের  এখানে-CRON_SECRET  লেখাটা মুছে Vercel-এর CRON_SECRET-এর মান বসান (দুই পাশের ' রেখে)।
-- এই ফাইল সেই মানসহ কোথাও শেয়ার বা কমিট করবেন না।

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname in ('kk-quick-sync', 'kk-sync-log-clean');

select cron.schedule('kk-quick-sync', '*/2 * * * *', $job$
  select net.http_get(
    url := 'https://khelakokhon.com/api/sync?mode=quick',
    headers := jsonb_build_object('Authorization', 'Bearer ' || 'এখানে-CRON_SECRET'),
    timeout_milliseconds := 30000);
$job$);

-- sync_log প্রতিদিন ৭০০+ সারি বাড়বে, তাই ৭ দিনের পুরনোগুলো রোজ মুছে ফেলা
select cron.schedule('kk-sync-log-clean', '17 3 * * *', $job$
  delete from sync_log where created_at < now() - interval '7 days';
$job$);

-- যাচাই: কয়েক মিনিট পরে চালান, ok = true দেখালে কাজ করছে
-- select mode, ok, detail, created_at from sync_log order by created_at desc limit 5;
