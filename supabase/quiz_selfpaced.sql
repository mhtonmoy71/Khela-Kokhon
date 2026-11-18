-- ═══════════════════════════════════════════════════════════════
--  কুইজ: যে যার নিজের গতিতে (আগের quiz.sql আর quiz_close.sql-এর পরে একবার চালাতে হবে)
--  হোস্ট শুরু করলে সবাই একসাথে শুরু করে; এরপর প্রত্যেকের প্রতিটি প্রশ্নে নিজের ৩০ সেকেন্ড।
--  উত্তর দিলে ৩ সেকেন্ড সঠিক উত্তর দেখিয়ে নিজের পরের প্রশ্ন। সবার শেষ হলে একসাথে ফলাফল।
--  খেলার মাঝে অন্যদের স্কোর সার্ভার থেকেই আসে না।
-- ═══════════════════════════════════════════════════════════════

alter table quiz_answers add column if not exists answered_at timestamptz default now();
alter table quiz_rooms alter column gap_seconds set default 3;

-- একজন খেলোয়াড়ের অগ্রগতি: সময় পেরিয়ে যাওয়া প্রশ্নে "উত্তর দেননি" বসায়,
-- তারপর এখনকার প্রশ্নের ক্রম (idx) আর সেটা কখন শুরু (qstart) ফেরত দেয়
create or replace function quiz_progress(p_room uuid, p_user uuid, out idx int, out qstart timestamptz)
language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; n int; last_at timestamptz;
begin
  select * into r from quiz_rooms where id = p_room;
  n := coalesce(array_length(r.question_ids, 1), 0);
  select count(*), max(answered_at) into idx, last_at from quiz_answers where room_id = p_room and user_id = p_user;
  qstart := case when idx = 0 then r.started_at else last_at + make_interval(secs => r.gap_seconds) end;
  while idx < n and now() >= qstart + make_interval(secs => r.q_seconds) loop
    insert into quiz_answers (room_id, user_id, q_index, choice, correct, ms, answered_at)
    values (p_room, p_user, idx, null, false, r.q_seconds * 1000, qstart + make_interval(secs => r.q_seconds))
    on conflict do nothing;
    qstart := qstart + make_interval(secs => r.q_seconds + r.gap_seconds);
    idx := idx + 1;
  end loop;
end $$;
revoke execute on function quiz_progress(uuid, uuid) from public, anon, authenticated;

-- ── উত্তর জমা: শুধু নিজের এখনকার প্রশ্নে, নিজের ৩০ সেকেন্ডের মধ্যে ──
create or replace function quiz_answer(p_code text, p_index int, p_choice int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; pr record; ans smallint;
begin
  select * into r from quiz_rooms where code = upper(p_code);
  if not found or r.status <> 'running' then raise exception 'not running'; end if;
  if not exists (select 1 from quiz_players where room_id = r.id and user_id = auth.uid()) then raise exception 'not a player'; end if;
  select * into pr from quiz_progress(r.id, auth.uid());
  if pr.idx <> p_index or now() < pr.qstart then raise exception 'time over'; end if;
  select answer into ans from quiz_questions where id = r.question_ids[p_index + 1];
  insert into quiz_answers (room_id, user_id, q_index, choice, correct, ms, answered_at)
  values (r.id, auth.uid(), p_index, p_choice, p_choice = ans, (extract(epoch from (now() - pr.qstart)) * 1000)::int, now())
  on conflict do nothing;
  return jsonb_build_object('ok', true);
end $$;

-- ── খেলার অবস্থা (যে দেখছে তার নিজের প্রশ্ন অনুযায়ী) ──
create or replace function quiz_state(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; n int; per int; pl record; pr record; me_in boolean; phase text := null; ends timestamptz := null;
        q quiz_questions; cur jsonb := null; review jsonb := null; ndone int := 0; mine jsonb; ci int;
begin
  select * into r from quiz_rooms where code = upper(p_code);
  if not found then raise exception 'room not found'; end if;
  if r.status = 'closed' then
    return jsonb_build_object('code', r.code, 'status', 'closed', 'is_host', r.host = auth.uid(), 'next_code', r.next_code,
      'member', exists (select 1 from quiz_players p where p.room_id = r.id and p.user_id = auth.uid()), 'players', '[]'::jsonb);
  end if;
  n := coalesce(array_length(r.question_ids, 1), 0);
  per := r.q_seconds + r.gap_seconds;
  me_in := exists (select 1 from quiz_players where room_id = r.id and user_id = auth.uid());

  if r.status = 'running' and now() >= r.started_at then
    -- সবার সময় পেরোনো প্রশ্ন পূরণ করে দেখি সবাই শেষ করেছে কি না
    for pl in select user_id from quiz_players where room_id = r.id loop
      perform quiz_progress(r.id, pl.user_id);
    end loop;
    select count(*) into ndone from quiz_players p
      where p.room_id = r.id and (select count(*) from quiz_answers a where a.room_id = r.id and a.user_id = p.user_id) >= n;
    if ndone >= (select count(*) from quiz_players where room_id = r.id) then
      update quiz_rooms set status = 'finished' where id = r.id; r.status := 'finished';
    end if;
  end if;

  phase := r.status;
  if r.status = 'running' then
    if now() < r.started_at then phase := 'countdown'; ends := r.started_at;
    elsif not me_in then phase := 'watching';
    else
      select * into pr from quiz_progress(r.id, auth.uid());
      if pr.idx >= n then phase := 'waiting';
      elsif now() < pr.qstart then
        phase := 'reveal'; ends := pr.qstart; ci := pr.idx - 1;
      else
        phase := 'question'; ends := pr.qstart + make_interval(secs => r.q_seconds); ci := pr.idx;
      end if;
    end if;
  end if;

  if phase in ('question', 'reveal') then
    select * into q from quiz_questions where id = r.question_ids[ci + 1];
    cur := jsonb_build_object('index', ci, 'category', q.category, 'question', q.question, 'options', to_jsonb(q.options),
      'started_at', case when phase = 'question' then pr.qstart end);
    if phase = 'reveal' then
      select jsonb_build_object('choice', a.choice, 'correct', a.correct, 'ms', a.ms) into mine
        from quiz_answers a where a.room_id = r.id and a.user_id = auth.uid() and a.q_index = ci;
      cur := cur || jsonb_build_object('answer', q.answer, 'explanation', q.explanation, 'mine', mine);
    end if;
  end if;

  if r.status = 'finished' then
    select jsonb_agg(jsonb_build_object('question', qq.question, 'options', to_jsonb(qq.options), 'answer', qq.answer, 'explanation', qq.explanation,
             'choice', (select a.choice from quiz_answers a where a.room_id = r.id and a.user_id = auth.uid() and a.q_index = t.i - 1)) order by t.i)
      into review
      from unnest(r.question_ids) with ordinality as t(qid, i) join quiz_questions qq on qq.id = t.qid;
  end if;

  return jsonb_build_object(
    'code', r.code, 'status', r.status, 'phase', phase, 'total', n, 'finished_count', ndone,
    'q_seconds', r.q_seconds, 'gap_seconds', r.gap_seconds, 'started_at', r.started_at, 'ends_at', ends, 'now', now(),
    'is_host', r.host = auth.uid(), 'next_code', r.next_code, 'current', cur, 'review', review,
    'players', (
      select coalesce(jsonb_agg(x order by (x->>'score')::int desc nulls last, (x->>'ms')::int asc nulls last, x->>'joined'), '[]'::jsonb)
      from (
        select jsonb_build_object(
          'name', p.display_name, 'me', p.user_id = auth.uid(), 'host', p.user_id = r.host, 'joined', p.joined_at,
          -- খেলা চলাকালীন শুধু নিজের স্কোর; অন্যদেরটা শেষে
          'score', case when r.status = 'finished' or p.user_id = auth.uid()
                   then (select count(*) from quiz_answers a where a.room_id = r.id and a.user_id = p.user_id and a.correct) end,
          'ms', case when r.status = 'finished' or p.user_id = auth.uid()
                then coalesce((select sum(a.ms) from quiz_answers a where a.room_id = r.id and a.user_id = p.user_id), 0) end
        ) as x
        from quiz_players p where p.room_id = r.id
      ) s)
  );
end $$;
