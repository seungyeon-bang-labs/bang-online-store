-- 로컬 전용 테스트 회원 2명. 운영에는 실행하지 않는다.
-- A는 배포 데모 로그인 화면이 미리 채우는 demoexample123, B는 로컬 전용 고정값 bang-local-1234를 쓴다.
-- auth.users에 넣으면 회원가입 트리거가 public.users와 약관 동의를 만든다. 약관은 catalog.sql이 먼저 넣는다.
--   A: demo@example.com (배송지 seed 대상)
--   B: member-b@example.test (배송지 없음)
do $$
declare
  term_ids jsonb;
  member record;
begin
  select jsonb_agg(t.id order by t.id) into term_ids
    from public.terms t join public.term_codes c on c.id = t.term_code_id
    where t.is_active and c.is_active and t.effective_at <= now();

  for member in
    select * from (values
      ('a0000000-0000-4000-8000-000000000001'::uuid, 'demo@example.com', '데모 회원', '01000000001', 'demoexample123'),
      ('b0000000-0000-4000-8000-000000000002'::uuid, 'member-b@example.test', '회원 비', '01000000002', 'bang-local-1234')
    ) as m(id, email, name, phone, password)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', member.id, 'authenticated', 'authenticated', member.email,
      extensions.crypt(member.password, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', member.name, 'phone_number', member.phone,
        'agreed_term_ids', term_ids, 'displayed_term_ids', term_ids),
      now(), now(), '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), member.id, member.id::text, 'email',
      jsonb_build_object('sub', member.id::text, 'email', member.email, 'email_verified', true),
      now(), now(), now()
    );
  end loop;
end $$;
