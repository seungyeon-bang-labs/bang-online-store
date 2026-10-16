import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { loadTs } from './helpers/load-ts.mjs';

const { CURRENT_USER } = loadTs('src/domains/member/fixture.ts');
const alice = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Alice Member',
  email: 'alice@example.invalid',
  phone_number: '01012345678',
  email_verified_at: '2026-10-14T00:00:00Z',
  status: 'active',
  deleted_at: null,
};
const bob = {
  ...alice,
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Bob Member',
  email: 'bob@example.invalid',
};

// Run the real access service, repositories and fixture aggregation;
// substitute only the Supabase client boundary used by this request.
function createHomeRequest(initialMember, options = {}) {
  let member = initialMember;
  const requests = [];
  const client = createClient('https://home-test.supabase.co', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async input => {
      const url = new URL(String(input));
      requests.push(url);
      assert.equal(url.pathname, '/rest/v1/users');
      const selected = url.searchParams.get('select').split(',').map(value => value.trim());
      const isProfile = selected.includes('name');
      if (isProfile && options.profileError) {
        return new Response(JSON.stringify({ code: '42501', message: 'PRIVATE_DB_DETAIL' }), {
          status: 403, headers: { 'content-type': 'application/json' },
        });
      }
      const rows = [member, alice, bob].filter(Boolean).filter((row, index, all) =>
        all.findIndex(other => other.id === row.id) === index &&
        url.searchParams.get('id') === `eq.${row.id}` &&
        (url.searchParams.get('status') !== 'eq.active' || row.status === 'active') &&
        (url.searchParams.get('deleted_at') !== 'is.null' || row.deleted_at === null),
      );
      const data = isProfile && options.profileMissing ? [] : rows.map(row =>
        Object.fromEntries(selected.map(key => [key, row[key]])),
      );
      return new Response(JSON.stringify(data), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    } },
  });
  client.auth.getUser = async () => ({
    data: { user: member ? {
      id: member.id, email: member.email,
      email_confirmed_at: options.unverified ? null : member.email_verified_at,
    } : null },
    error: options.authError ?? null,
  });
  const { getMypageHomeViewModel } = loadTs('src/domains/mypage/home.service.ts', {
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => client },
  });
  return {
    getHome: () => getMypageHomeViewModel(CURRENT_USER),
    setMember: value => { member = value; },
    requests,
  };
}

test('home uses the session member name and keeps demo shopping records across account switches', async () => {
  const request = createHomeRequest(alice);
  const originalDemo = structuredClone(CURRENT_USER);
  const first = await request.getHome();
  assert.equal(first.summary.memberName, 'Alice Member');
  assert.equal(first.summary.defaultAddressText, '서울특별시 강남구 테헤란로 123 101동 1203호');
  assert.equal(first.summary.membershipTierCode, 'GOLD');
  assert.equal(first.summary.pointBalanceText, '17,200 P');
  assert.deepEqual(Array.from(first.recentOrders, order => order.id), [
    '20000000-0000-4000-8000-000000000007',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000019',
  ]);
  assert.equal(first.wishlistProducts.length, 10);

  request.setMember(bob);
  const second = await request.getHome();
  assert.equal(second.summary.memberName, 'Bob Member');
  assert.deepEqual(
    JSON.parse(JSON.stringify(second)),
    JSON.parse(JSON.stringify({ ...first, summary: { ...first.summary, memberName: 'Bob Member' } })),
  );
  assert.deepEqual(CURRENT_USER, originalDemo);
  assert.deepEqual(request.requests.map(url => url.searchParams.get('id')), [
    `eq.${alice.id}`, `eq.${alice.id}`, `eq.${bob.id}`, `eq.${bob.id}`,
  ]);
});

test('home rejects unavailable access instead of returning a demo name', async () => {
  for (const [member, options] of [
    [null, {}],
    [alice, { unverified: true }],
    [{ ...alice, status: 'suspended' }, {}],
    [{ ...alice, deleted_at: '2026-10-15T00:00:00Z' }, {}],
    [alice, { authError: { status: 503 } }],
  ]) {
    const request = createHomeRequest(member, options);
    await assert.rejects(request.getHome(), /회원 정보를 확인하지 못했습니다/);
    assert.equal(request.requests.some(url => url.searchParams.get('select').includes('name')), false);
  }
});

test('home does not substitute a demo name when the real profile is missing or fails to load', async () => {
  for (const options of [{ profileMissing: true }, { profileError: true }]) {
    await assert.rejects(createHomeRequest(alice, options).getHome(), error => {
      assert.match(error.message, /회원 정보를/);
      assert.equal(error.message.includes('PRIVATE_DB_DETAIL'), false);
      return true;
    });
  }
});
