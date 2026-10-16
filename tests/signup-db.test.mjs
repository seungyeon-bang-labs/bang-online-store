import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const container = process.env.SIGNUP_TEST_CONTAINER;
const baseline = !!process.env.SIGNUP_TEST_SKIP_MIGRATION;
const options = { skip: !container && 'Set SIGNUP_TEST_CONTAINER to an isolated bang-signup-test-* container; never a remote database.' };
const fixture = () => readFileSync(new URL('./db/signup-fixture.sql', import.meta.url), 'utf8');
const migration = () => readFileSync(new URL('../supabase/migrations/20261011000000_atomic_signup.sql', import.meta.url), 'utf8');
let sequence = 0;
function database() {
  assert.match(container, /^bang-signup-test-[a-z0-9-]+$/);
  const name = `signup_tests_${Date.now()}_${++sequence}`;
  const result = spawnSync('docker', ['exec', container, 'createdb', '-U', 'postgres', name], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  return name;
}
function sql(name, input, requireSuccess = true) {
  const result = spawnSync('docker', ['exec', '-i', container, 'psql', '-X', '-A', '-t', '-U', 'postgres', '-d', name, '-v', 'ON_ERROR_STOP=1', '-q'], {
    input, encoding: 'utf8', timeout: 30000,
  });
  if (requireSuccess) assert.equal(result.status, 0, result.stderr);
  return result;
}

test('PostgreSQL atomic signup, validation, confirmation and access integration', options, () => {
  const name = database();
  const input = fixture() + (baseline ? '' : migration())
    + readFileSync(new URL('./db/signup-storage.sql', import.meta.url), 'utf8');
  assert.match(sql(name, input).stdout, /DB integration assertions passed/);
});

test('migration refuses legacy Auth users missing a member and leaves data untouched', {
  ...options, skip: options.skip || baseline,
}, () => {
  const name = database();
  sql(name, fixture() + "insert into auth.users(id,email) values('00000000-0000-4000-8000-000000000099','legacy@example.invalid');");
  const result = sql(name, migration(), false);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SIGNUP_MIGRATION_MEMBER_REPAIR_REQUIRED/);
  const check = sql(name, "select (select count(*) from auth.users),(select count(*) from public.users),(select count(*) from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal);");
  assert.equal(check.stdout.trim(), '1|0|0');
});

test('migration refuses an unreviewed Auth trigger instead of replacing it', {
  ...options, skip: options.skip || baseline,
}, () => {
  const name = database();
  sql(name, fixture() + `
    create function public.other_auth_hook() returns trigger language plpgsql as $$ begin return new; end $$;
    create trigger other_auth_hook before insert on auth.users for each row execute function public.other_auth_hook();
  `);
  const result = sql(name, migration(), false);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /SIGNUP_MIGRATION_AUTH_TRIGGER_REVIEW_REQUIRED/);
  assert.equal(sql(name, "select tgname from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal;").stdout.trim(), 'other_auth_hook');
});

test('rollback removes new hooks while preserving registered members and agreements', {
  ...options, skip: options.skip || baseline,
}, () => {
  const name = database();
  sql(name, fixture() + migration() + `
    insert into auth.users(id,email,raw_user_meta_data) values (
      '00000000-0000-4000-8000-000000000001','preserved@example.invalid',
      '{"name":"회원","phone_number":"01012345678","agreed_term_ids":["11111111-1111-4111-8111-111111111111"],"displayed_term_ids":["11111111-1111-4111-8111-111111111111","22222222-2222-4222-8222-222222222222"]}'
    );
  `);
  sql(name, readFileSync(new URL('../supabase/rollback/20261011000000_atomic_signup.sql', import.meta.url), 'utf8'));
  const check = sql(name, "select (select count(*) from auth.users),(select count(*) from public.users),(select count(*) from public.user_term_consents),(select count(*) from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal);");
  assert.equal(check.stdout.trim(), '1|1|1|0');
});
