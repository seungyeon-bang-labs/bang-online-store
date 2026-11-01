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

const defaultAddress = {
  id: '33333333-3333-4333-8333-333333333333',
  label: '집',
  recipient_name: 'Alice Member',
  phone_number: '010-1234-5678',
  postal_code: '06134',
  address_line_1: '서울특별시 강남구 테헤란로 123',
  address_line_2: '101동 1203호',
  delivery_note: null,
  is_default: true,
  created_at: '2026-10-31T00:00:00Z',
  updated_at: '2026-10-31T00:00:00Z',
};

const ORDER = '44444444-4444-4444-8444-444444444441';
const OLDER_ORDER = '44444444-4444-4444-8444-444444444442';
const orderRow = (id, orderedAt) => ({
  id, order_number: '20261101-123456', user_id: alice.id, request_id: id, status: 'payment_completed',
  ordered_at: orderedAt, payment_due_at: orderedAt, paid_at: orderedAt, estimated_delivery_at: null,
  delivered_at: null, cancelled_at: null, subtotal_amount: 25000, discount_amount: 0, shipping_fee: 3000,
  total_amount: 28000, recipient_name: 'Alice Member', recipient_phone: '010-1234-5678', postal_code: '06134',
  shipping_address_line_1: '서울특별시 강남구 테헤란로 123', shipping_address_line_2: '101동 1203호',
  delivery_note: null, payment_method: 'card',
});
const orderItemRow = (orderId, productId) => ({
  id: orderId.replace(/4$|1$|2$/, '9'), order_id: orderId, product_id: productId, product_variant_id: 2,
  product_name: '주문 당시 상품명', option_label: '그레이 / M', quantity: 1, unit_price: 25000,
  discount_amount: 0, line_total_amount: 25000, created_at: '2026-11-01T00:00:00Z',
});
const json = rows => new Response(JSON.stringify(rows), {
  status: 200, headers: { 'content-type': 'application/json' },
});

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
      if (url.pathname === '/rest/v1/orders') {
        const userId = url.searchParams.get('user_id')?.replace(/^eq\./, '');
        return json((options.orders ?? []).filter(order => order.user_id === userId));
      }
      if (url.pathname === '/rest/v1/order_items') {
        const orderIds = url.searchParams.get('order_id').replace(/^in\.\(|\)$/g, '').split(',');
        return json((options.orderItems ?? []).filter(item => orderIds.includes(item.order_id)));
      }
      if (url.pathname === '/rest/v1/user_addresses') {
        assert.equal(url.searchParams.get('is_default'), 'eq.true');
        const userId = url.searchParams.get('user_id')?.replace(/^eq\./, '');
        const rows = options.addressMissing || !userId ? [] : [{
          ...defaultAddress, user_id: userId,
        }];
        return new Response(JSON.stringify(rows), {
          status: 200, headers: { 'content-type': 'application/json' },
        });
      }
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
  const { fixtureProductService } = loadTs('src/domains/product/fixture-service.ts');
  const { getMypageHomeViewModel } = loadTs('src/domains/mypage/home.service.ts', {
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => client },
    '@/shared/lib/supabase/server': { supabase: {} },
    '@/domains/order/member-order-read.server': loadTs('src/domains/order/member-order-read.server.ts', {
      '@/domains/product': { ...loadTs('src/domains/product/mapper.ts'), productService: fixtureProductService },
    }),
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
  assert.deepEqual(first.recentOrders, []);
  assert.equal(first.orderStatuses.every(status => status.count === 0), true);
  assert.equal(first.wishlistProducts.length, 10);

  request.setMember(bob);
  const second = await request.getHome();
  assert.equal(second.summary.memberName, 'Bob Member');
  assert.deepEqual(
    JSON.parse(JSON.stringify(second)),
    JSON.parse(JSON.stringify({ ...first, summary: { ...first.summary, memberName: 'Bob Member' } })),
  );
  assert.deepEqual(CURRENT_USER, originalDemo);
  const memberRequests = request.requests.filter(url => url.pathname === '/rest/v1/users');
  assert.deepEqual(memberRequests.map(url => url.searchParams.get('id')), [
    `eq.${alice.id}`, `eq.${alice.id}`, `eq.${bob.id}`, `eq.${bob.id}`,
  ]);
  const addressRequests = request.requests.filter(url => url.pathname === '/rest/v1/user_addresses');
  assert.deepEqual(addressRequests.map(url => url.searchParams.get('user_id')), [
    `eq.${alice.id}`, `eq.${bob.id}`,
  ]);
});

test('home shows the session member DB orders without unconnected follow-up actions', async () => {
  const now = Date.now();
  const recent = new Date(now - 60_000).toISOString();
  const older = new Date(now - 120_000).toISOString();
  const request = createHomeRequest(alice, {
    orders: [orderRow(OLDER_ORDER, older), orderRow(ORDER, recent), { ...orderRow(ORDER, recent), id: 'other', user_id: bob.id }],
    orderItems: [orderItemRow(ORDER, 1), orderItemRow(OLDER_ORDER, 999)],
  });
  const home = await request.getHome();
  assert.deepEqual(home.recentOrders.map(order => order.id), [ORDER, OLDER_ORDER]);
  assert.equal(home.orderStatuses.find(status => status.status === 'payment_completed').count, 2);
  const [first, second] = home.recentOrders;
  assert.equal(first.productSummary, '주문 당시 상품명');
  assert.equal(first.orderAmount.amountText, '28,000원');
  const types = [first.actions.primary, first.actions.secondary, ...first.actions.more].filter(Boolean).map(action => action.type);
  assert.deepEqual(types, ['order']);
  // A product that is no longer on sale keeps the order snapshot instead of failing the page.
  assert.equal(second.items[0].product.thumbnailUrl, '/file.svg');
  assert.equal(second.items[0].repurchaseItem, null);
  assert.deepEqual(home.recentOrders.length, 2);
  const fourOrders = createHomeRequest(alice, {
    orders: [1, 2, 3, 4].map(n => orderRow(`44444444-4444-4444-8444-44444444445${n}`, new Date(now - n * 60_000).toISOString())),
  });
  const fourHome = await fourOrders.getHome();
  assert.equal(fourHome.recentOrders.length, 3);
  const itemQuery = fourOrders.requests.find(url => url.pathname === '/rest/v1/order_items').searchParams.get('order_id');
  assert.equal(itemQuery.includes('444444444454'), false);
  assert.deepEqual(
    request.requests.filter(url => url.pathname === '/rest/v1/orders').map(url => url.searchParams.get('user_id')),
    [`eq.${alice.id}`],
  );
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

test('home shows no default address when the member has none', async () => {
  const home = await createHomeRequest(alice, { addressMissing: true }).getHome();
  assert.equal(home.summary.defaultAddressText, '등록된 배송지 없음');
});
