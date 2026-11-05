import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

const { readSupabaseEnv } = loadTs('src/shared/lib/supabase/env.ts');
const env = overrides => ({
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'k',
  NODE_ENV: 'development',
  ...overrides,
});

test('development accepts the local Supabase', () => {
  assert.deepEqual(readSupabaseEnv(env()), { url: 'http://127.0.0.1:54321', anonKey: 'k' });
  assert.equal(readSupabaseEnv(env({ SUPABASE_URL: 'http://localhost:54321' })).url, 'http://localhost:54321');
});

test('development refuses a remote Supabase', () => {
  assert.throws(() => readSupabaseEnv(env({ SUPABASE_URL: 'https://plamqblmcavrtioajopz.supabase.co' })), /로컬 Supabase/);
});

test('production keeps the configured Supabase', () => {
  const url = 'https://plamqblmcavrtioajopz.supabase.co';
  assert.equal(readSupabaseEnv(env({ NODE_ENV: 'production', SUPABASE_URL: url })).url, url);
});

test('missing values fail the same way everywhere', () => {
  assert.throws(() => readSupabaseEnv(env({ SUPABASE_ANON_KEY: undefined })), /환경변수/);
});
