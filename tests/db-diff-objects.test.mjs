import assert from 'node:assert/strict';
import test from 'node:test';
import { differences, extraObjects, objects } from '../scripts/db-diff-objects.mjs';

const block = (name, type, owner, body) => `--\n-- Name: ${name}; Type: ${type}; Schema: public; Owner: ${owner}\n--\n\n${body}\n\n`;
const dump = (...blocks) => `-- PostgreSQL database dump\n\n${blocks.join('')}`;
const compare = (local, prod) => differences(objects(local), objects(prod));

const fn = body => block('purge()', 'FUNCTION', 'postgres', `CREATE FUNCTION public.purge() RETURNS void AS $$\n${body}\n$$;`);
const acl = (role, grantee) => block('DEFAULT PRIVILEGES FOR TABLES', 'DEFAULT ACL', role,
  `ALTER DEFAULT PRIVILEGES FOR ROLE ${role} IN SCHEMA public GRANT ALL ON TABLES TO ${grantee};`);

test('identical dumps have no differences', () => {
  const schema = dump(fn('  delete from public.carts;'), acl('postgres', 'anon'));
  assert.deepEqual(compare(schema, schema), []);
});

test('a statement commented out on one line is a difference', () => {
  const local = dump(fn('  -- clean up\n  delete from public.carts;'));
  const prod = dump(fn('  -- clean up delete from public.carts;'));
  assert.deepEqual(compare(local, prod), ['~ 내용 다름 FUNCTION public.purge() (postgres)']);
});

test('default privileges are compared per owner', () => {
  const local = dump(acl('postgres', 'anon'), acl('supabase_admin', 'anon'));
  const prod = dump(acl('postgres', 'service_role'), acl('supabase_admin', 'anon'));
  assert.deepEqual(compare(local, prod), ['~ 내용 다름 DEFAULT ACL public.DEFAULT PRIVILEGES FOR TABLES (postgres)']);
});

test('objects only on one side are listed', () => {
  assert.deepEqual(compare(dump(fn('select 1;')), dump()), ['+ 로컬만 FUNCTION public.purge() (postgres)']);
  assert.deepEqual(compare(dump(), dump(fn('select 1;'))), ['- 운영만 FUNCTION public.purge() (postgres)']);
});

test('ignored keys are skipped', () => {
  const lines = differences(objects(dump(fn('select 1;'))), objects(dump()), new Set(['FUNCTION public.purge() (postgres)']));
  assert.deepEqual(lines, []);
});

test('a disabled auth trigger is a difference', () => {
  const trigger = state => `TRIGGER auth.users.store_member_on_auth_signup\tCREATE TRIGGER store_member_on_auth_signup AFTER INSERT ON auth.users enabled=${state}\n`;
  assert.deepEqual(differences(extraObjects(trigger('O')), extraObjects(trigger('D'))),
    ['~ 내용 다름 TRIGGER auth.users.store_member_on_auth_signup']);
});

test('a missing event trigger is a difference', () => {
  const ensureRls = 'EVENT TRIGGER ensure_rls\tddl_command_end rls_auto_enable() {"CREATE TABLE"} enabled=O\n';
  assert.deepEqual(differences(extraObjects(ensureRls), extraObjects('')), ['+ 로컬만 EVENT TRIGGER ensure_rls']);
});

test('two objects under one key stop the comparison', () => {
  assert.throws(() => objects(dump(fn('select 1;'), fn('select 2;'))), /같은 이름의 객체/);
});
