-- কুইজের ঘর বন্ধ করার সুবিধা (আগের quiz.sql চালানো থাকলে এটুকু চালালেই হবে)
alter table quiz_rooms drop constraint if exists quiz_rooms_status_check;
alter table quiz_rooms add constraint quiz_rooms_status_check check (status in ('lobby', 'running', 'finished', 'closed'));

create or replace function quiz_join(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; nm text;
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  select * into r from quiz_rooms where code = upper(p_code);
  if not found then raise exception 'room not found'; end if;
  if r.status = 'closed' then raise exception 'room closed'; end if;
  if exists (select 1 from quiz_players where room_id = r.id and user_id = auth.uid()) then return; end if;
  if r.status <> 'lobby' then raise exception 'already started'; end if;
  select display_name into nm from profiles where id = auth.uid();
  insert into quiz_players (room_id, user_id, display_name) values (r.id, auth.uid(), coalesce(nm, 'খেলোয়াড়'));
end $$;

create or replace function quiz_state(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r quiz_rooms; n int; per int; el double precision := 0; idx int; phase text; done int := 0;
        q quiz_questions; cur jsonb := null; review jsonb := null; mine jsonb;
begin
  select * into r from quiz_rooms where code = upper(p_code);
  if not found then raise exception 'room not found'; end if;
  -- বন্ধ ঘর: কোনো প্রশ্ন বা ফল নয়; "আবার খেলুন" হয়ে থাকলে নতুন কোড
  if r.status = 'closed' then
    return jsonb_build_object('code', r.code, 'status', 'closed', 'is_host', r.host = auth.uid(), 'next_code', r.next_code,
      'member', exists (select 1 from quiz_players p where p.room_id = r.id and p.user_id = auth.uid()), 'players', '[]'::jsonb);
  end if;
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
  update quiz_rooms set next_code = c, status = 'closed' where id = old.id;
  return c;
end $$;

create or replace function quiz_close(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update quiz_rooms set status = 'closed' where code = upper(p_code) and host = auth.uid();
  if not found then raise exception 'only host'; end if;
end $$;

grant execute on function quiz_close(text) to authenticated;
