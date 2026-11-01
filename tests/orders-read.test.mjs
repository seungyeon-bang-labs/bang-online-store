import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { loadTs } from './helpers/load-ts.mjs';

const MEMBER = '11111111-1111-4111-8111-111111111111';
const ORDER = '44444444-4444-4444-8444-444444444441';
const ITEM = '55555555-5555-4555-8555-555555555551';
const orderedAt = new Date(Date.now() - 60_000).toISOString();
const order = {
  id: ORDER, order_number: '20261101-123456', user_id: MEMBER, request_id: ORDER, status: 'payment_completed',
  ordered_at: orderedAt, payment_due_at: orderedAt, paid_at: orderedAt, estimated_delivery_at: null,
  delivered_at: null, cancelled_at: null, subtotal_amount: 25000, discount_amount: 2500, shipping_fee: 3000,
  total_amount: 25500, recipient_name: '수령인', recipient_phone: '010-1234-5678', postal_code: '06134',
  shipping_address_line_1: '서울특별시 강남구 테헤란로 123', shipping_address_line_2: '101동 1203호',
  delivery_note: null, payment_method: 'card',
};
const item = {
  id: ITEM, order_id: ORDER, product_id: 1, product_variant_id: 2, product_name: '주문 당시 상품명',
  option_label: '그레이 / M', quantity: 1, unit_price: 25000, discount_amount: 2500, line_total_amount: 22500,
  created_at: orderedAt,
};
const history = { id: '66666666-6666-4666-8666-666666666661', order_id: ORDER, status: 'payment_completed', occurred_at: orderedAt };

// Real services, repositories and mappers; only the Supabase HTTP boundary and product lookup are fake.
function createReadServices(options = {}) {
  const requests = [];
  const client = createClient('https://orders-test.supabase.co', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(String(input));
      requests.push(url);
      if (options.error) {
        return new Response(JSON.stringify({ code: '42501', message: 'PRIVATE_DB_DETAIL' }), {
          status: 403, headers: { 'content-type': 'application/json' },
        });
      }
      const rows = {
        '/rest/v1/orders': options.orders ?? [order],
        '/rest/v1/order_items': [item],
        '/rest/v1/order_status_histories': [history],
      }[url.pathname];
      assert.ok(rows, url.pathname);
      const accept = new Headers(init?.headers).get('accept') ?? '';
      const body = accept.includes('vnd.pgrst.object') ? rows[0] ?? null : rows;
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    } },
  });
  const { fixtureProductService } = loadTs('src/domains/product/fixture-service.ts');
  const { createMemberOrderReadServices } = loadTs('src/domains/order/member-order-read.server.ts', {
    '@/domains/product': { ...loadTs('src/domains/product/mapper.ts'), productService: fixtureProductService },
  });
  return { requests, services: createMemberOrderReadServices(client) };
}

const query = { period: '3-months', status: 'all', includePartialCancellation: false, page: 1 };

test('order list maps DB rows and hides follow-ups that DB orders do not support yet', async () => {
  const { requests, services } = createReadServices();
  const page = await services.getOrderListViewModel(MEMBER, query);
  assert.equal(page.unfilteredItemCount, 1);
  const [listed] = page.items;
  assert.equal(listed.orderNumber, '20261101-123456');
  assert.equal(listed.status.label, '결제완료');
  assert.equal(listed.orderAmount.amountText, '25,500원');
  assert.equal(listed.items[0].productName, '주문 당시 상품명');
  assert.deepEqual(listed.items[0].repurchaseItem, { productId: 1, variantId: 2, quantity: 1 });
  assert.equal(listed.items[0].actions, null);
  assert.equal(requests[0].searchParams.get('user_id'), `eq.${MEMBER}`);
});

test('order list reads items only for the orders on the requested page', async () => {
  const orders = Array.from({ length: 12 }, (_, index) => ({
    ...order,
    id: `44444444-4444-4444-8444-${String(index).padStart(12, '0')}`,
    ordered_at: new Date(Date.now() - (index + 1) * 60_000).toISOString(),
  }));
  const { requests, services } = createReadServices({ orders });
  const page = await services.getOrderListViewModel(MEMBER, { ...query, page: 2 });
  assert.equal(page.totalItems, 12);
  assert.deepEqual(page.items.map(listed => listed.id), orders.slice(10).map(row => row.id));
  const itemRequest = requests.find(url => url.pathname === '/rest/v1/order_items');
  assert.equal(itemRequest.searchParams.get('order_id'), `in.(${orders.slice(10).map(row => row.id).join(',')})`);
});

test('order detail joins the address lines and shows the card label', async () => {
  const { services } = createReadServices();
  const detail = await services.getOrderDetailViewModel(MEMBER, ORDER);
  assert.equal(detail.payment.paymentMethod, '신용카드');
  assert.equal(detail.payment.shippingFeeText, '3,000원');
  assert.equal(detail.shipping.addressText, '서울특별시 강남구 테헤란로 123 101동 1203호');
  assert.deepEqual(detail.statusHistory.map(entry => [entry.label, entry.isCurrent]), [['결제 완료', true]]);
  assert.equal(detail.items[0].actions, null);
});

test('order detail skips the DB for a malformed id and hides DB error details', async () => {
  const { requests, services } = createReadServices();
  assert.equal(await services.getOrderDetailViewModel(MEMBER, 'not-a-uuid'), null);
  assert.equal(requests.length, 0);

  const failing = createReadServices({ error: true });
  await assert.rejects(failing.services.getOrderListViewModel(MEMBER, query), error => {
    assert.equal(error.message, '주문 정보를 불러오지 못했습니다.');
    return true;
  });
});

test('order detail hides the receipt button until DB receipts exist', () => {
  const { isOrderActionAvailable } = loadTs('src/domains/order/order-action-policy.ts');
  assert.equal(isOrderActionAvailable('receipt'), false);
  assert.equal(isOrderActionAvailable('inquiry'), false);
  assert.equal(isOrderActionAvailable('repurchase'), true);
});

test('fixture point history no longer links to order detail, which now reads DB orders only', async () => {
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const transaction = {
    id: 'point-1', type: { label: '적립', tone: 'success' }, description: '구매 적립', orderId: '20000000-0000-4000-8000-000000000001',
    amountText: '+1,000 P', isDeduction: false, occurredDate: '2026.10.01', occurredTime: '10:00', expirationText: '2027.10.01',
  };
  const { MypagePointTransactionCard } = loadTs('src/features/mypage/points/point-transaction-card.tsx');
  const { MypagePointTransactionTable } = loadTs('src/features/mypage/points/point-transaction-table.tsx');
  for (const element of [
    createElement(MypagePointTransactionCard, { transaction }),
    createElement(MypagePointTransactionTable, { transactions: [transaction] }),
  ]) {
    const html = renderToStaticMarkup(element);
    assert.match(html, /구매 적립/);
    assert.equal(html.includes('/mypage/orders/'), false);
  }
});
