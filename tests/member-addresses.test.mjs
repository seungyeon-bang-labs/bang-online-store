import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { loadTs } from './helpers/load-ts.mjs';

const MEMBER = '11111111-1111-4111-8111-111111111111';
const ADDRESS = '33333333-3333-4333-8333-333333333333';
const input = {
  label: ' 집 ', recipientName: '  수령인  ', phoneNumber: '010-1234-5678', postalCode: ' 06134 ',
  addressLine1: ' 서울특별시 강남구 테헤란로 123 ', addressLine2: ' 101동 1203호 ', deliveryNote: ' 문 앞 ', isDefault: false,
};
const row = (overrides = {}) => ({
  id: ADDRESS, user_id: MEMBER, label: null, recipient_name: '수령인', phone_number: '010-1234-5678',
  postal_code: '06134', address_line_1: '서울특별시 강남구 테헤란로 123', address_line_2: null,
  delivery_note: null, is_default: false, created_at: '2026-10-31T00:00:00Z', updated_at: '2026-10-31T00:00:00Z',
  ...overrides,
});

function service(current = row()) {
  const calls = [];
  const repository = {
    create: async (...args) => { calls.push(['create', ...args]); },
    findByIdAndUserId: async (...args) => { calls.push(['find', ...args]); return current; },
    update: async (...args) => { calls.push(['update', ...args]); return true; },
    delete: async (...args) => { calls.push(['delete', ...args]); return true; },
  };
  const { createUserAddressService } = loadTs('src/domains/member/address.service.ts');
  return { calls, service: createUserAddressService({ userAddressRepository: repository }) };
}

test('create trims input, stores blanks as null and rejects invalid input before the repository', async () => {
  const { calls, service: addresses } = service();
  assert.equal(await addresses.createUserAddress(MEMBER, input), true);
  assert.deepEqual(calls, [['create', MEMBER, {
    label: '집', recipient_name: '수령인', phone_number: '010-1234-5678', postal_code: '06134',
    address_line_1: '서울특별시 강남구 테헤란로 123', address_line_2: '101동 1203호', delivery_note: '문 앞', is_default: false,
  }]]);
  const { calls: blank, service: unnamed } = service();
  await unnamed.createUserAddress(MEMBER, { ...input, label: '   ' });
  assert.equal(blank[0][2].label, null);
  for (const invalid of [{ label: '가'.repeat(31) }, { recipientName: ' ' }, { phoneNumber: '1234' }, { postalCode: '123' }, { addressLine1: '' }, { addressLine2: '' }, { addressLine2: '   ' }]) {
    const { calls: none, service: rejected } = service();
    assert.equal(await rejected.createUserAddress(MEMBER, { ...input, ...invalid }), false);
    assert.deepEqual(none, []);
  }
});

test('update sends the default flag only when promotion is requested, without a pre-read', async () => {
  const { calls, service: addresses } = service();
  assert.equal(await addresses.updateUserAddress(MEMBER, ADDRESS, { ...input, isDefault: false }), true);
  assert.deepEqual(calls.map(([name]) => name), ['update']);
  assert.equal('is_default' in calls[0][3], false);
  assert.equal(calls[0][3].address_line_2, '101동 1203호');

  const { calls: promoted, service: other } = service();
  await other.updateUserAddress(MEMBER, ADDRESS, { ...input, isDefault: true });
  assert.equal(promoted[0][3].is_default, true);

  const { calls: rejected, service: invalid } = service();
  assert.equal(await invalid.updateUserAddress(MEMBER, ADDRESS, { ...input, addressLine2: ' ' }), false);
  assert.deepEqual(rejected, []);
});

test('delete refuses the default or a missing address and set default only flips the flag', async () => {
  for (const current of [row({ is_default: true }), null]) {
    const { calls, service: addresses } = service(current);
    assert.equal(await addresses.deleteUserAddress(MEMBER, ADDRESS), false);
    assert.deepEqual(calls.map(([name]) => name), ['find']);
  }
  const { calls, service: addresses } = service(row());
  assert.equal(await addresses.deleteUserAddress(MEMBER, ADDRESS), true);
  assert.deepEqual(calls.at(-1), ['delete', ADDRESS, MEMBER]);
  assert.equal(await addresses.setDefaultUserAddress(MEMBER, ADDRESS), true);
  assert.deepEqual(calls.at(-1), ['update', ADDRESS, MEMBER, { is_default: true }]);
});

function repository(respond = () => []) {
  const requests = [];
  const client = createClient('https://address-test.supabase.co', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      requests.push({ method: init?.method ?? 'GET', url, body: init?.body ? JSON.parse(init.body) : null });
      const { status = 200, body } = { body: respond(url, init), ...(respond.status ?? {}) };
      return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
    } },
  });
  const { createUserAddressRepository } = loadTs('src/domains/member/supabase-repository.server.ts');
  return { requests, repository: createUserAddressRepository(client) };
}

test('repository scopes every request to the member and skips non-UUID IDs', async () => {
  const { requests, repository: addresses } = repository(() => [row()]);
  assert.equal(await addresses.findByIdAndUserId('not-a-uuid', MEMBER), null);
  assert.equal(await addresses.update('1 or 1=1', MEMBER, { is_default: true }), false);
  assert.equal(await addresses.delete('', MEMBER), false);
  assert.equal(requests.length, 0);

  await addresses.findByUserId(MEMBER);
  await addresses.update(ADDRESS, MEMBER, { is_default: true });
  await addresses.delete(ADDRESS, MEMBER);
  await addresses.create(MEMBER, { recipient_name: '수령인' });
  assert.equal(requests[0].url.searchParams.get('user_id'), `eq.${MEMBER}`);
  assert.equal(requests[0].url.searchParams.get('order'), 'is_default.desc,created_at.desc,id.asc');
  for (const request of requests.slice(1, 3)) {
    assert.equal(request.url.searchParams.get('id'), `eq.${ADDRESS}`);
    assert.equal(request.url.searchParams.get('user_id'), `eq.${MEMBER}`);
  }
  assert.deepEqual([requests[1].method, requests[2].method, requests[3].method], ['PATCH', 'DELETE', 'POST']);
  assert.deepEqual(requests[3].body, { recipient_name: '수령인', user_id: MEMBER });
});

test('repository reports unchanged rows as false and DB errors as failures', async () => {
  const { repository: empty } = repository(() => []);
  assert.equal(await empty.update(ADDRESS, MEMBER, { is_default: true }), false);
  assert.equal(await empty.delete(ADDRESS, MEMBER), false);

  const failing = () => ({ code: '23514', message: 'USER_ADDRESS_DEFAULT_DELETE' });
  failing.status = { status: 400 };
  const { repository: broken } = repository(failing);
  await assert.rejects(broken.delete(ADDRESS, MEMBER), /배송지를 저장하지 못했습니다/);
  await assert.rejects(broken.findByUserId(MEMBER), /배송지를 불러오지 못했습니다/);
});

test('address actions use the session member and revalidate only after a change', async () => {
  const revalidated = [];
  const received = [];
  let changed = true;
  const result = async (...args) => { received.push(args); return changed; };
  const { createMypageAddressAction, updateMypageAddressAction, setDefaultMypageAddressAction, deleteMypageAddressAction } =
    loadTs('src/app/(mypage)/mypage/address/actions.ts', {
      '@/app/(auth)/require-active-member': { requireActiveMember: async () => ({ id: MEMBER }) },
      '@/shared/lib/supabase/auth-server': { createAuthClient: async () => ({}) },
      '@/domains/member/supabase-repository.server': { createUserAddressRepository: () => ({}) },
      '@/domains/member': { createUserAddressService: () => ({
        createUserAddress: result, updateUserAddress: result,
        setDefaultUserAddress: result, deleteUserAddress: result,
      }) },
      'next/cache': { revalidatePath: path => revalidated.push(path) },
    });
  assert.equal(await createMypageAddressAction(input), true);
  assert.equal(await updateMypageAddressAction(ADDRESS, input), true);
  assert.equal(await setDefaultMypageAddressAction(ADDRESS), true);
  assert.equal(await deleteMypageAddressAction(ADDRESS), true);
  assert.deepEqual(received, [[MEMBER, input], [MEMBER, ADDRESS, input], [MEMBER, ADDRESS], [MEMBER, ADDRESS]]);
  assert.deepEqual(revalidated, Array(4).fill('/mypage/address'));
  changed = false;
  assert.equal(await deleteMypageAddressAction(ADDRESS), false);
  assert.equal(revalidated.length, 4);
});
