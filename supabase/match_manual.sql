-- অ্যাডমিনের হাতে দেওয়া ম্যাচের খবর (API-Football যে খেলার লাইভ তথ্য দেয় না, যেমন বাংলাদেশের কিছু খেলা)
-- /admin পাতা থেকে: শুরু, বিরতি, দ্বিতীয়ার্ধ, গোল, শেষ। API-Football শেষ ফল দিলে সারিটা নিজে মুছে যায়
create table if not exists match_manual (
  match_id bigint primary key,
  phase text not null default '1H',    -- 1H, HT, 2H, FT
  home int not null default 0,
  away int not null default 0,
  k1 timestamptz,                        -- প্রথমার্ধ শুরু
  k2 timestamptz,                        -- দ্বিতীয়ার্ধ শুরু
  goals jsonb not null default '[]',     -- [{s:"h"|"a", m:মিনিট}]
  updated_at timestamptz not null default now()
);
alter table match_manual enable row level security;  -- শুধু সার্ভার (সার্ভিস রোল) পড়ে আর লেখে
