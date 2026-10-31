-- Separate approval required after the user_addresses migration.
-- Copies the former fixture addresses to the public demo account; never overwrites existing addresses.
begin;
set local lock_timeout='5s';
do $$
declare member_id uuid;
begin
  select id into member_id from public.users
    where email='demo@example.com' and status='active' and deleted_at is null;
  if member_id is null then raise exception 'USER_ADDRESS_SEED_MEMBER_REQUIRED'; end if;
  if exists (select 1 from public.user_addresses where user_id=member_id) then
    raise exception 'USER_ADDRESS_SEED_TARGET_NOT_EMPTY';
  end if;
  -- The default row goes first; the write trigger keeps exactly one default.
  insert into public.user_addresses(user_id,label,recipient_name,phone_number,postal_code,
    address_line_1,address_line_2,delivery_note,is_default,created_at,updated_at) values
    (member_id,'집','Kim Gemini','010-1234-5678','06134','서울특별시 강남구 테헤란로 123','101동 1203호',
      '문 앞에 놓아주세요.',true,'2025-08-12T10:40:00+09:00','2026-07-01T14:20:00+09:00');
  insert into public.user_addresses(user_id,label,recipient_name,phone_number,postal_code,
    address_line_1,address_line_2,delivery_note,is_default,created_at,updated_at) values
    (member_id,'회사','Kim Gemini','010-1234-5678','13494','경기도 성남시 분당구 판교역로 235',null,
      null,false,'2026-02-20T11:00:00+09:00','2026-02-20T11:00:00+09:00'),
    (member_id,null,'Kim Gemini','010-9876-5432','05554','서울특별시 송파구 올림픽로 300','105동 804호',
      '경비실에 맡겨주세요.',false,'2026-03-12T10:20:00+09:00','2026-03-12T10:20:00+09:00'),
    (member_id,null,'Kim Gemini','010-2468-1357','04782','서울특별시 성동구 아차산로 17','6층 601호',
      null,false,'2026-04-03T14:10:00+09:00','2026-04-03T14:10:00+09:00'),
    (member_id,'세컨드 하우스','Kim Gemini','010-5555-7777','48094','부산광역시 해운대구 해운대해변로 264','201동 1502호',
      '부재 시 연락 부탁드립니다.',false,'2026-05-18T09:30:00+09:00','2026-05-18T09:30:00+09:00');
end $$;
commit;
