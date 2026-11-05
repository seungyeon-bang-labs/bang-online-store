import assert from 'node:assert/strict';
import test from 'node:test';
import { comparable, lineDiff } from '../scripts/db-diff-lines.mjs';

const dump = (body, key = 'k1') => `\\restrict ${key}\n-- PostgreSQL database dump\n\n${body}\n\\unrestrict ${key}\n`;
const fn = text => `--\n-- Name: label(); Type: FUNCTION; Schema: public; Owner: postgres\n--\n\nCREATE FUNCTION public.label() RETURNS text AS $$\nselect '\n${text}';\n$$;\n`;
const diff = (prod, local) => lineDiff(comparable(prod), comparable(local));

test('identical dumps differ only in their random restrict keys', () => {
  assert.deepEqual(diff(dump(fn('x'), 'k1'), dump(fn('x'), 'k2')), { text: '', changes: 0 });
});

test('a line starting with -- inside a function string is compared', () => {
  const result = diff(dump(fn('--prod-value')), dump(fn('--local-value')));
  assert.equal(result.changes, 2);
  assert.match(result.text, /^---prod-value';$/m);
  assert.match(result.text, /^\+--local-value';$/m);
});

test('a blank line inside a function string is compared', () => {
  assert.equal(diff(dump(fn('a\nb')), dump(fn('a\n\nb'))).changes, 1);
});

test('whitespace inside a line is compared', () => {
  assert.equal(diff(dump(fn('a  b')), dump(fn('a b'))).changes, 2);
});

test('auth·storage·event trigger lines are compared regardless of row order', () => {
  const on = 'TRIGGER auth.users.signup\tCREATE TRIGGER signup enabled=O\nEVENT TRIGGER ensure_rls\tddl_command_end enabled=O\n';
  const reordered = on.split('\n').reverse().join('\n');
  assert.equal(lineDiff(comparable('', on), comparable('', reordered)).changes, 0);
  assert.equal(lineDiff(comparable('', on), comparable('', on.replace('signup enabled=O', 'signup enabled=D'))).changes, 2);
  assert.equal(lineDiff(comparable('', on), comparable('', '')).changes, 2);
});
