-- শেষ প্রশ্নের উত্তরও দেখায়, তারপর অপেক্ষা/ফলাফল
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
    -- শেষ করেছেন = সব প্রশ্নের উত্তর (বা সময় শেষ) আর শেষ উত্তর দেখানোও শেষ
    select count(*) into ndone from quiz_players p, lateral quiz_progress(r.id, p.user_id) g
      where p.room_id = r.id and g.idx >= n and now() >= g.qstart;
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
      if pr.idx > 0 and now() < pr.qstart then
        phase := 'reveal'; ends := pr.qstart; ci := pr.idx - 1;
      elsif pr.idx >= n then phase := 'waiting';
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
