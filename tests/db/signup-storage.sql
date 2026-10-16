begin;
create function pg_temp.assert_true(value boolean, message text) returns void language plpgsql as $$
begin if value is distinct from true then raise exception 'ASSERTION: %',message; end if; end $$;
create function pg_temp.metadata() returns jsonb language sql as $$
  select '{"name":"회원","phone_number":"010-1234-5678","role":"admin","status":"suspended","agreed_term_ids":["11111111-1111-4111-8111-111111111111"],"displayed_term_ids":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]}'::jsonb;
$$;

-- Real Auth DB role must be able to invoke a trigger even with no direct function execute grant.
set role bang_test_auth_admin;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-000000000001','test@example.invalid',pg_temp.metadata());
reset role;
select pg_temp.assert_true((select count(*)=1 from public.users),'member inserted with Auth account');
select pg_temp.assert_true((select role='customer' and status='active' and email_verified_at is null and phone_number='01012345678' from public.users),'authoritative defaults and phone normalization');
select pg_temp.assert_true((select count(*)=1 from public.user_term_consents),'only the agreed term is saved');

update auth.users set email_confirmed_at='2026-10-11',
  raw_user_meta_data=jsonb_set(raw_user_meta_data,'{name}','"改ざん"')
  where id='00000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select name='회원' and email_verified_at='2026-10-11' and role='customer' from public.users),'confirmation sync does not overwrite profile');
select pg_temp.assert_true((select count(*)=1 from public.user_term_consents),'confirmation does not duplicate consent');
update auth.users set raw_user_meta_data='{}' where id='00000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select name='회원' from public.users),'later metadata updates do not update member');

-- Catch errors only in tests, never in the production registration trigger.
create function pg_temp.force_storage_error() returns trigger language plpgsql as $$
begin raise exception 'FORCED_STORAGE_FAILURE' using errcode='23514'; end $$;
create trigger force_consent_failure before insert on public.user_term_consents
  for each row when (new.user_id='00000000-0000-4000-8000-000000000002')
  execute function pg_temp.force_storage_error();
create trigger force_member_failure before insert on public.users
  for each row when (new.id='00000000-0000-4000-8000-000000000003')
  execute function pg_temp.force_storage_error();
do $$ declare uid uuid; failed boolean; begin
  foreach uid in array array['00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003']::uuid[] loop
    failed:=false;
    begin
      insert into auth.users(id,email,raw_user_meta_data) values(uid,'failure@example.invalid',pg_temp.metadata());
    exception when check_violation then
      if sqlerrm <> 'FORCED_STORAGE_FAILURE' then raise; end if;
      failed:=true;
    end;
    perform pg_temp.assert_true(failed,'forced storage error reaches caller');
    perform pg_temp.assert_true(not exists(select from auth.users where id=uid),'Auth rollback after storage failure');
    perform pg_temp.assert_true(not exists(select from public.users where id=uid),'member rollback after storage failure');
    perform pg_temp.assert_true(not exists(select from public.user_term_consents where user_id=uid),'consent rollback after storage failure');
  end loop;
end $$;

do $$ declare patch jsonb; uid uuid; failed boolean; begin
  for patch in select * from jsonb_array_elements('[
    {"name":""}, {"name":12}, {"phone_number":"123"},
    {"agreed_term_ids":{}}, {"agreed_term_ids":[null]},
    {"agreed_term_ids":["not-a-uuid"]}, {"agreed_term_ids":[]},
    {"agreed_term_ids":["11111111-1111-4111-8111-111111111111","11111111-1111-4111-8111-111111111111"]},
    {"displayed_term_ids":["11111111-1111-4111-8111-111111111111"]},
    {"displayed_term_ids":["11111111-1111-4111-8111-111111111111","33333333-3333-4333-8333-333333333333"]}
  ]'::jsonb) loop
    failed:=false; uid:=gen_random_uuid();
    begin
      insert into auth.users(id,email,raw_user_meta_data) values(uid,'invalid@example.invalid',pg_temp.metadata()||patch);
    exception when invalid_parameter_value or check_violation then failed:=true;
    end;
    perform pg_temp.assert_true(failed,'invalid or stale metadata must reject signup: '||patch::text);
    perform pg_temp.assert_true(not exists(select from auth.users where id=uid),'invalid signup leaves no Auth account');
  end loop;
end $$;

-- A newly published optional term also invalidates the displayed snapshot.
insert into public.term_codes values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','new_notice',true);
insert into public.terms values ('33333333-3333-4333-8333-333333333333','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true,false,'2020-01-01');
do $$ begin
  begin
    insert into auth.users values (gen_random_uuid(),'stale@example.invalid',null,pg_temp.metadata());
    raise exception 'ASSERTION: newly published term accepted';
  exception when check_violation then
    perform pg_temp.assert_true(sqlerrm='SIGNUP_TERMS_CHANGED','changed term error');
  end;
end $$;
delete from public.terms where id='33333333-3333-4333-8333-333333333333';

-- A second active effective version of the same code must not be silently accepted.
insert into public.terms values ('44444444-4444-4444-8444-444444444444','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true,true,'2020-01-01');
do $$ begin
  begin
    insert into auth.users values (gen_random_uuid(),'ambiguous@example.invalid',null,pg_temp.metadata());
    raise exception 'ASSERTION: ambiguous versions accepted';
  exception when check_violation then
    perform pg_temp.assert_true(sqlerrm='SIGNUP_TERMS_CHANGED','ambiguous term error');
  end;
end $$;
delete from public.terms where id='44444444-4444-4444-8444-444444444444';

insert into auth.users values ('00000000-0000-4000-8000-000000000004','other@example.invalid',null,pg_temp.metadata());

set local request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
set role bang_test_member;
select pg_temp.assert_true((select count(*)=1 from public.users),'member can read own row');
do $$ begin
  begin
    update public.users set role='admin';
    raise exception 'ASSERTION: ordinary member role update accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
select pg_temp.assert_true(not has_function_privilege('anon','private.register_store_member()','execute'),'anon cannot execute registration');
select pg_temp.assert_true(not has_function_privilege('authenticated','private.register_store_member()','execute'),'member cannot execute registration');
select 'DB integration assertions passed' as result;
rollback;
