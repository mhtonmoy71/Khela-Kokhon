-- ═══════════════════════════════════════════════════════════════
--  খেলা কখন? — লাইভ স্পোর্টস কুইজ
--  Supabase → SQL Editor-এ একবার চালাতে হবে। আগের কোনো টেবিল বদলায় না।
--  সব খেলা চলে নিচের ফাংশন দিয়ে; ব্রাউজার কখনো সঠিক উত্তর আগে দেখতে পায় না।
--
--  সময়ের হিসাব: প্রশ্ন i চলে started_at + i×(q_seconds+gap_seconds) থেকে q_seconds ধরে,
--  তারপর gap_seconds ধরে সঠিক উত্তর দেখায়। সবাই উত্তর দিয়ে ফেললে started_at পিছিয়ে দিয়ে
--  সঙ্গে সঙ্গে পরের ধাপে যায়, তাই কাউকে বসে থাকতে হয় না।
-- ═══════════════════════════════════════════════════════════════

create table if not exists quiz_questions (
  id          int primary key,
  category    text not null,
  difficulty  text not null,
  question    text not null,
  options     text[] not null,
  answer      smallint not null,
  explanation text default ''
);

create table if not exists quiz_rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  host         uuid not null references auth.users on delete cascade,
  status       text not null default 'lobby' check (status in ('lobby', 'running', 'finished')),
  question_ids int[] not null,
  q_seconds    int not null default 30,
  gap_seconds  int not null default 4,
  started_at   timestamptz,
  next_code    text,
  created_at   timestamptz default now()
);

create table if not exists quiz_players (
  room_id      uuid references quiz_rooms on delete cascade,
  user_id      uuid references auth.users on delete cascade,
  display_name text,
  joined_at    timestamptz default now(),
  primary key (room_id, user_id)
);

create table if not exists quiz_answers (
  room_id uuid references quiz_rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  q_index int not null,
  choice  smallint,
  correct boolean not null,
  ms      int not null,
  primary key (room_id, user_id, q_index)
);

-- কোনো policy নেই = ব্রাউজার সরাসরি পড়তে/লিখতে পারে না, শুধু নিচের ফাংশন দিয়ে
alter table quiz_questions enable row level security;
alter table quiz_rooms     enable row level security;
alter table quiz_players   enable row level security;
alter table quiz_answers   enable row level security;

-- ── নতুন কুইজ (হোস্ট নিজে প্রথম খেলোয়াড়) ──
create or replace function quiz_create(n int default 10)
returns text language plpgsql security definer set search_path = public as $$
declare c text; r uuid; nm text;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from quiz_rooms where code = c);
  end loop;
  insert into quiz_rooms (code, host, question_ids)
  values (c, auth.uid(), (select array_agg(id) from (select id from quiz_questions order by random() limit least(greatest(n, 1), 20)) t))
  returning id into r;
  select display_name into nm from profiles where id = auth.uid();
  insert into quiz_players (room_id, user_id, display_name) values (r, auth.uid(), coalesce(nm, 'খেলোয়াড়'));
  return c;
end $$;

-- ── কোড দিয়ে যোগ (শুরুর আগে) ──
create or replace function quiz_join(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; nm text;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into r from quiz_rooms where code = upper(p_code);
  if not found then raise exception 'room not found'; end if;
  if exists (select 1 from quiz_players where room_id = r.id and user_id = auth.uid()) then return; end if;
  if r.status <> 'lobby' then raise exception 'already started'; end if;
  select display_name into nm from profiles where id = auth.uid();
  insert into quiz_players (room_id, user_id, display_name) values (r.id, auth.uid(), coalesce(nm, 'খেলোয়াড়'));
end $$;

-- ── হোস্ট শুরু করে (৩ সেকেন্ডের কাউন্টডাউন) ──
create or replace function quiz_start(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update quiz_rooms set status = 'running', started_at = now() + interval '3 seconds'
  where code = upper(p_code) and host = auth.uid() and status = 'lobby';
  if not found then raise exception 'cannot start'; end if;
end $$;

-- ── উত্তর জমা ──
create or replace function quiz_answer(p_code text, p_index int, p_choice int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; per int; el double precision; cur int; into_q double precision; ans smallint; nplayers int; nans int;
begin
  select * into r from quiz_rooms where code = upper(p_code) for update;
  if not found or r.status <> 'running' then raise exception 'not running'; end if;
  if not exists (select 1 from quiz_players where room_id = r.id and user_id = auth.uid()) then raise exception 'not a player'; end if;
  per := r.q_seconds + r.gap_seconds;
  el := extract(epoch from (now() - r.started_at));
  cur := floor(el / per)::int;
  into_q := el - cur * per;
  if el < 0 or cur <> p_index or into_q >= r.q_seconds then raise exception 'time over'; end if;
  select answer into ans from quiz_questions where id = r.question_ids[p_index + 1];
  insert into quiz_answers (room_id, user_id, q_index, choice, correct, ms)
  values (r.id, auth.uid(), p_index, p_choice, p_choice = ans, (into_q * 1000)::int)
  on conflict do nothing;
  -- সবাই উত্তর দিলে সময় না গুনে সঙ্গে সঙ্গে উত্তর দেখানোর ধাপে
  select count(*) into nplayers from quiz_players where room_id = r.id;
  select count(*) into nans from quiz_answers where room_id = r.id and q_index = p_index;
  if nans >= nplayers then
    update quiz_rooms set started_at = started_at - make_interval(secs => r.q_seconds - into_q) where id = r.id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- ── খেলার অবস্থা (প্রতি সেকেন্ডে ব্রাউজার জিজ্ঞেস করে) ──
create or replace function quiz_state(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; n int; per int; el double precision := 0; idx int; phase text; done int := 0;
        q quiz_questions; cur jsonb := null; review jsonb := null; mine jsonb;
begin
  select * into r from quiz_rooms where code = upper(p_code);
  if not found then raise exception 'room not found'; end if;
  n := coalesce(array_length(r.question_ids, 1), 0);
  per := r.q_seconds + r.gap_seconds;
  if r.status = 'running' then
    el := extract(epoch from (now() - r.started_at));
    if el >= n * per then update quiz_rooms set status = 'finished' where id = r.id; r.status := 'finished'; end if;
  end if;
  phase := r.status;
  if r.status = 'running' then
    if el < 0 then phase := 'countdown'; idx := 0;
    else
      idx := floor(el / per)::int;
      phase := case when el - idx * per < r.q_seconds then 'question' else 'reveal' end;
    end if;
    done := case when phase = 'reveal' then idx + 1 else idx end;
  elsif r.status = 'finished' then done := n;
  end if;

  if phase in ('question', 'reveal') then
    select * into q from quiz_questions where id = r.question_ids[idx + 1];
    select jsonb_build_object('choice', a.choice, 'correct', a.correct, 'ms', a.ms) into mine
      from quiz_answers a where a.room_id = r.id and a.user_id = auth.uid() and a.q_index = idx;
    cur := jsonb_build_object('index', idx, 'category', q.category, 'question', q.question, 'options', to_jsonb(q.options), 'mine', mine,
      'answered', (select count(*) from quiz_answers a where a.room_id = r.id and a.q_index = idx));
    if phase = 'reveal' then cur := cur || jsonb_build_object('answer', q.answer, 'explanation', q.explanation); end if;
  end if;

  if r.status = 'finished' then
    select jsonb_agg(jsonb_build_object('question', qq.question, 'options', to_jsonb(qq.options), 'answer', qq.answer, 'explanation', qq.explanation,
             'choice', (select a.choice from quiz_answers a where a.room_id = r.id and a.user_id = auth.uid() and a.q_index = t.i - 1)) order by t.i)
      into review
      from unnest(r.question_ids) with ordinality as t(qid, i) join quiz_questions qq on qq.id = t.qid;
  end if;

  return jsonb_build_object(
    'code', r.code, 'status', r.status, 'phase', phase, 'index', idx, 'total', n, 'done', done,
    'q_seconds', r.q_seconds, 'gap_seconds', r.gap_seconds, 'started_at', r.started_at, 'now', now(),
    'is_host', r.host = auth.uid(), 'next_code', r.next_code, 'current', cur, 'review', review,
    'players', (
      select coalesce(jsonb_agg(x order by (x->>'score')::int desc, (x->>'ms')::int asc, x->>'joined'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'name', p.display_name, 'me', p.user_id = auth.uid(), 'host', p.user_id = r.host, 'joined', p.joined_at,
          'score', (select count(*) from quiz_answers a where a.room_id = r.id and a.user_id = p.user_id and a.correct and a.q_index < done),
          -- সমান স্কোরে কম সময় আগে; উত্তর না দিলে পুরো সময় ধরা হয়
          'ms', coalesce((select sum(a.ms) from quiz_answers a where a.room_id = r.id and a.user_id = p.user_id and a.q_index < done), 0)
                + (done - (select count(*) from quiz_answers a where a.room_id = r.id and a.user_id = p.user_id and a.q_index < done)) * r.q_seconds * 1000
        ) as x
        from quiz_players p where p.room_id = r.id
      ) s)
  );
end $$;

-- ── আবার খেলা: হোস্ট নতুন কুইজ বানায়, আগের সবাই নিজে থেকে যোগ হয় ──
create or replace function quiz_again(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare old quiz_rooms; c text; nr uuid;
begin
  select * into old from quiz_rooms where code = upper(p_code) and host = auth.uid();
  if not found then raise exception 'only host'; end if;
  if old.next_code is not null then return old.next_code; end if;
  c := quiz_create(coalesce(array_length(old.question_ids, 1), 10));
  select id into nr from quiz_rooms where code = c;
  insert into quiz_players (room_id, user_id, display_name)
    select nr, user_id, display_name from quiz_players where room_id = old.id on conflict do nothing;
  update quiz_rooms set next_code = c where id = old.id;
  return c;
end $$;

grant execute on function quiz_create(int)            to authenticated;
grant execute on function quiz_join(text)             to authenticated;
grant execute on function quiz_start(text)            to authenticated;
grant execute on function quiz_answer(text, int, int) to authenticated;
grant execute on function quiz_state(text)            to anon, authenticated;
grant execute on function quiz_again(text)            to authenticated;
