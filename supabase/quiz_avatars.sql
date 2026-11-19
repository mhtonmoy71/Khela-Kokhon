-- কুইজ রুমের খেলোয়াড়দের ছবি (নাম → ছবি)। শুধু রুমের খেলোয়াড়রাই দেখতে পারেন।
-- ঘন ঘন আসা quiz_state-এ ছবি রাখা হয়নি, তাই আলাদা ফাংশন: খেলোয়াড় বদলালে একবার আনা হয়।
-- আগে leaderboard_avatars.sql চালানো থাকতে হবে (user_avatar ফাংশন)।
create or replace function quiz_avatars(p_code text) returns jsonb
language sql security definer set search_path = public stable as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', p.display_name, 'avatar', user_avatar(p.user_id))), '[]'::jsonb)
  from quiz_rooms r join quiz_players p on p.room_id = r.id
  where r.code = upper(p_code)
    and exists (select 1 from quiz_players x where x.room_id = r.id and x.user_id = auth.uid());
$$;
grant execute on function quiz_avatars(text) to authenticated;
