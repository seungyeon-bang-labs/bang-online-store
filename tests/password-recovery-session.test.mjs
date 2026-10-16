import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { loadTs } from './helpers/load-ts.mjs';

const filename = 'src/app/(auth)/find-password/recovery-session.server.ts';
const name = 'bang-password-recovery';
const grant = () => ({ purpose: 'password-recovery', userId: '11111111-1111-4111-8111-111111111111', email: 'visitor@example.com', refreshToken: 'test-refresh-token', expiresAt: Date.now() + 300000 });

function setup(t, { writeError, contextError } = {}) {
  const previous = { ...Object.fromEntries(['PASSWORD_RECOVERY_SECRET', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'NODE_ENV'].map(k => [k, process.env[k]])) };
  process.env.PASSWORD_RECOVERY_SECRET = Buffer.alloc(32, 7).toString('base64');
  process.env.SUPABASE_URL = 'https://recovery-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-public-key';
  process.env.NODE_ENV = 'production';
  t.after(() => { for (const [k,v] of Object.entries(previous)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
  const jar = new Map([['sb-normal-auth-token', 'normal-session']]);
  const writes = [];
  assert.ok(fs.existsSync(filename), 'recovery cookie adapter must exist');
  const mod = loadTs(filename, {
    'next/headers': { cookies: async () => {
      if (contextError) throw contextError;
      return { get: key => jar.has(key) ? { value: jar.get(key) } : undefined, set: (key,value,options) => {
        if (writeError) throw writeError;
        writes.push({ name: key, value, options });
        if (options.maxAge === 0) jar.delete(key); else jar.set(key,value);
      } };
    } },
  });
  return { ...mod, jar, writes };
}

test('encrypted recovery cookie round trips and never changes ordinary auth cookies', async t => {
  const s = setup(t);
  const input = grant();
  await s.writeRecoveryGrant(input);
  assert.equal(s.jar.get(name).includes(input.refreshToken), false);
  assert.deepEqual(await s.readRecoveryGrant(), { status: 'valid', grant: input });
  assert.equal(s.writes[0].options.httpOnly, true);
  assert.equal(s.writes[0].options.secure, true);
  assert.equal(s.writes[0].options.sameSite, 'lax');
  assert.equal(s.writes[0].options.path, '/find-password');
  await s.clearRecoveryGrant();
  assert.deepEqual(await s.readRecoveryGrant(), { status: 'missing' });
  assert.equal(s.jar.get('sb-normal-auth-token'), 'normal-session');
});
test('tampering, wrong purpose, wrong key and expiry cannot restore authority', async t => {
  const s = setup(t);
  await s.writeRecoveryGrant(grant());
  const encrypted = s.jar.get(name);
  s.jar.set(name, encrypted.slice(0,30) + (encrypted[30] === 'A' ? 'B' : 'A') + encrypted.slice(31));
  assert.equal((await s.readRecoveryGrant()).status, 'invalid');
  s.jar.set(name, encrypted);
  process.env.PASSWORD_RECOVERY_SECRET = Buffer.alloc(32, 8).toString('base64');
  assert.equal((await s.readRecoveryGrant()).status, 'invalid');
  process.env.PASSWORD_RECOVERY_SECRET = Buffer.alloc(32, 7).toString('base64');
  const { EncryptJWT } = await import('jose');
  for (const payload of [{ ...grant(), purpose: 'login' }, { ...grant(), expiresAt: Date.now() - 1000 }]) {
    const value = await new EncryptJWT(payload).setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).setExpirationTime(Math.floor(payload.expiresAt / 1000)).encrypt(Buffer.alloc(32,7));
    s.jar.set(name, value);
    assert.equal((await s.readRecoveryGrant()).status, 'invalid');
  }
});
test('rotating refresh tokens preserves the original expiry', async t => {
  const s = setup(t);
  const first = grant();
  await s.writeRecoveryGrant(first);
  await s.writeRecoveryGrant({ ...first, refreshToken: 'rotated-refresh' });
  const { grant: next } = await s.readRecoveryGrant();
  assert.equal(next.expiresAt, first.expiresAt);
  assert.equal(next.refreshToken, 'rotated-refresh');
});
test('cookie writes and Next rendering context failures are never swallowed', async t => {
  const writeError = new Error('cookie write denied');
  const s = setup(t, { writeError });
  await assert.rejects(s.writeRecoveryGrant(grant()), e => e === writeError);
  const bailout = new Error('Next rendering control flow');
  const other = setup(t, { contextError: bailout });
  await assert.rejects(other.readRecoveryGrant(), e => e === bailout);
});
test('configuration, oversized grants and expired writes fail before storing cookies', async t => {
  const s = setup(t);
  await assert.rejects(s.writeRecoveryGrant({ ...grant(), refreshToken: 'x'.repeat(4000) }));
  await assert.rejects(s.writeRecoveryGrant({ ...grant(), expiresAt: Date.now() - 1 }));
  assert.equal(s.writes.length, 0);
  process.env.PASSWORD_RECOVERY_SECRET = 'invalid';
  assert.throws(() => s.assertRecoveryConfiguration());
});
