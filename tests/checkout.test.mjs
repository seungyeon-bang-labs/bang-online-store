import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { loadTs } from './helpers/load-ts.mjs';

const MEMBER = '11111111-1111-4111-8111-111111111111';
const LINE_A = '10000000-0000-4000-8000-000000000001';
const LINE_B = '10000000-0000-4000-8000-000000000002';
const SOLD_OUT = '10000000-0000-4000-8000-000000000003';
const ADDRESS = '40000000-0000-4000-8000-000000000001';
const REQUEST = '50000000-0000-4000-8000-000000000001';
const ORDER = '44444444-4444-4444-8444-444444444441';

const line = (id, overrides = {}) => ({
  id, productId: 1, styleId: 1, variantId: 2, name: '상품', color: '그레이', thumbnailUrl: '/file.svg',
  price: 10000, discountRate: 0, stock: 10, size: 'M', priceOffset: 0, quantity: 1, canSelect: true, ...overrides,
});
const address = (overrides = {}) => ({
  id: ADDRESS, user_id: MEMBER, label: null, recipient_name: '수령인', phone_number: '010-1234-5678',
  postal_code: '06134', address_line_1: '서울특별시 강남구 테헤란로 123', address_line_2: '101동 1203호',
  delivery_note: null, is_default: true, created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z',
  ...overrides,
});

test('order amounts charge 3,000원 shipping below 50,000원 after discounts and options', () => {
  const { getOrderAmounts } = loadTs('src/domains/order/domain.ts');
  // 49,000 + 1,000 option = 50,000원: free. One won less pays shipping.
  assert.deepEqual(getOrderAmounts([{ price: 49000, discountRate: 0, priceOffset: 1000, quantity: 1 }]), {
    itemCount: 1, productAmount: 49000, optionAmount: 1000, discountAmount: 0, shippingFee: 0, totalAmount: 50000,
  });
  assert.equal(getOrderAmounts([{ price: 49999, discountRate: 0, priceOffset: 0, quantity: 1 }]).totalAmount, 52999);
  // The discount applies to the base price only: 60,000 × 20% off = 48,000원 + 3,000원.
  assert.equal(getOrderAmounts([{ price: 30000, discountRate: 20, priceOffset: 0, quantity: 2 }]).totalAmount, 51000);
  assert.equal(getOrderAmounts([]).totalAmount, 0);
});

function checkoutService({ items, defaultAddress }) {
  const { createCheckoutService } = loadTs('src/domains/order/checkout.service.ts');
  return createCheckoutService({
    readCart: async userId => { assert.equal(userId, MEMBER); return { items }; },
    findDefaultAddress: async () => defaultAddress,
  });
}

test('checkout keeps only requested lines that can still be ordered', async () => {
  const service = checkoutService({
    items: [line(LINE_A), line(LINE_B, { quantity: 2 }), line(SOLD_OUT, { stock: 0, canSelect: false })],
    defaultAddress: address(),
  });
  const checkout = await service.getCheckoutViewModel(MEMBER, [LINE_B, SOLD_OUT, 'gone']);
  assert.deepEqual(checkout.items.map(item => item.id), [LINE_B]);
  assert.equal(checkout.amounts.totalAmount, 23000);
  assert.equal(checkout.address.status, 'ready');
  assert.equal(checkout.address.address.id, ADDRESS);
  // No label: the card leads with the recipient instead of repeating the street address.
  assert.equal(checkout.address.label, null);
  assert.equal(await service.getCheckoutViewModel(MEMBER, [SOLD_OUT]), null);
  const labeled = await checkoutService({ items: [line(LINE_A)], defaultAddress: address({ label: ' 집 ' }) })
    .getCheckoutViewModel(MEMBER, [LINE_A]);
  assert.equal(labeled.address.label, '집');
});

test('checkout asks for an address when none is saved or the detail line is blank', async () => {
  const missing = await checkoutService({ items: [line(LINE_A)], defaultAddress: null })
    .getCheckoutViewModel(MEMBER, [LINE_A]);
  assert.deepEqual(missing.address, { status: 'missing' });
  for (const addressLine2 of [null, '  ']) {
    const incomplete = await checkoutService({ items: [line(LINE_A)], defaultAddress: address({ address_line_2: addressLine2 }) })
      .getCheckoutViewModel(MEMBER, [LINE_A]);
    assert.equal(incomplete.address.status, 'incomplete');
    assert.equal(incomplete.address.address.id, ADDRESS);
  }
});

test('checkout links carry the selected line ids and the page splits them once', () => {
  const { getCheckoutHref, parseCheckoutItemIds } = loadTs('src/shared/lib/checkout-routes.ts');
  assert.equal(getCheckoutHref([LINE_A, LINE_B]), `/checkout?items=${LINE_A},${LINE_B}`);
  assert.deepEqual(parseCheckoutItemIds(`${LINE_A}, ${LINE_B},,${LINE_A}`), [LINE_A, LINE_B]);
  assert.deepEqual(parseCheckoutItemIds([LINE_A, LINE_B]), [LINE_A, LINE_B]);
  assert.deepEqual(parseCheckoutItemIds(undefined), []);
});

test('place_order errors become reasons and messages without database details', () => {
  const { toPlaceOrderRejection } = loadTs('src/domains/order/place-order.ts');
  const { getPlaceOrderMessage } = loadTs('src/features/checkout/checkout-messages.ts');
  const changed = toPlaceOrderRejection({ message: 'ORDER_PRICE_CHANGED', details: '{"totalAmount": 52999}' });
  assert.deepEqual(changed, { status: 'rejected', reason: 'price_changed', totalAmount: 52999 });
  assert.match(getPlaceOrderMessage(changed), /52,999원/);
  assert.deepEqual(toPlaceOrderRejection({ message: 'ORDER_PRICE_CHANGED', details: 'null' }),
    { status: 'rejected', reason: 'price_changed', totalAmount: undefined });
  assert.equal(toPlaceOrderRejection({ message: 'ORDER_OUT_OF_STOCK' }).reason, 'out_of_stock');
  assert.equal(toPlaceOrderRejection({ message: 'CART_ACCESS_DENIED' }).reason, 'access_denied');
  for (const message of ['ORDER_INVALID_REQUEST', 'toString', 'PRIVATE_DB_DETAIL', undefined]) {
    const rejection = toPlaceOrderRejection({ message });
    assert.equal(rejection.reason, 'failed');
    assert.equal(getPlaceOrderMessage(rejection).includes('PRIVATE'), false);
  }
});

function placementRepository(reply) {
  const requests = [];
  const client = createClient('https://checkout-test.supabase.co', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      requests.push({ url: new URL(String(input)), body: JSON.parse(init.body) });
      return new Response(JSON.stringify(reply.body), { status: reply.status, headers: { 'content-type': 'application/json' } });
    } },
  });
  const { createOrderPlacementRepository } = loadTs('src/domains/order/supabase-repository.server.ts');
  return { requests, repository: createOrderPlacementRepository(client) };
}

const input = { userId: MEMBER, requestId: REQUEST, cartItemIds: [LINE_A], addressId: ADDRESS, expectedTotal: 13000 };

test('placing an order calls place_order as the session member with card payment', async () => {
  const { requests, repository } = placementRepository({
    status: 200, body: { order_id: ORDER, order_number: '20261101-123456', total_amount: 13000, replayed: false },
  });
  assert.deepEqual(await repository.placeOrder(input), { status: 'placed', orderId: ORDER });
  assert.equal(requests[0].url.pathname, '/rest/v1/rpc/place_order');
  assert.deepEqual(requests[0].body, {
    p_expected_user_id: MEMBER, p_request_id: REQUEST, p_cart_item_ids: [LINE_A],
    p_address_id: ADDRESS, p_payment_method: 'card', p_expected_total: 13000,
  });
});

test('a rejected or malformed place_order reply never reports a placed order', async () => {
  const rejected = placementRepository({
    status: 400, body: { code: 'P0001', message: 'ORDER_PRICE_CHANGED', details: '{"totalAmount":16000}', hint: null },
  });
  assert.deepEqual(await rejected.repository.placeOrder(input), { status: 'rejected', reason: 'price_changed', totalAmount: 16000 });
  const malformed = placementRepository({ status: 200, body: { order_id: 'not-a-uuid' } });
  assert.deepEqual(await malformed.repository.placeOrder(input), { status: 'rejected', reason: 'failed' });
});

test('the order request schema rejects ids and totals place_order would refuse', () => {
  const { placeOrderRequestSchema } = loadTs('src/domains/order/place-order.ts');
  const valid = { requestId: REQUEST, cartItemIds: [LINE_A], addressId: ADDRESS, expectedTotal: 13000 };
  assert.equal(placeOrderRequestSchema.safeParse(valid).success, true);
  for (const invalid of [
    { ...valid, userId: MEMBER },
    { ...valid, cartItemIds: [] },
    { ...valid, cartItemIds: ['not-a-uuid'] },
    { ...valid, expectedTotal: 0 },
    { ...valid, expectedTotal: 1.5 },
  ]) assert.equal(placeOrderRequestSchema.safeParse(invalid).success, false);
});

test('checkout stops a 0원 total or more than 100 lines before place_order sees it', () => {
  const { getOrderBlock, placeOrderRequestSchema } = loadTs('src/domains/order/place-order.ts');
  const { getOrderBlockMessage } = loadTs('src/features/checkout/checkout-messages.ts');
  assert.equal(getOrderBlock({ lineCount: 100, totalAmount: 13000 }), null);
  assert.equal(getOrderBlock({ lineCount: 101, totalAmount: 13000 }), 'too_many_lines');
  assert.equal(getOrderBlock({ lineCount: 1, totalAmount: 0 }), 'zero_total');
  assert.match(getOrderBlockMessage('too_many_lines'), /100개/);
  assert.match(getOrderBlockMessage('zero_total'), /0원/);
  // Whatever the page lets through, the schema accepts: 100 lines yes, 101 no.
  const ids = count => Array.from({ length: count }, (_, i) => `10000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
  const request = count => ({ requestId: REQUEST, cartItemIds: ids(count), addressId: ADDRESS, expectedTotal: 13000 });
  assert.equal(placeOrderRequestSchema.safeParse(request(100)).success, true);
  assert.equal(placeOrderRequestSchema.safeParse(request(101)).success, false);
});

test('the checkout address form stays locked after saving so a second click cannot save it twice', async () => {
  const element = node => node;
  const setters = [];
  const states = [
    { label: '', recipientName: '수령인', phoneNumber: '010-1234-5678', postalCode: '06134',
      addressLine1: '서울특별시 강남구 테헤란로 123', addressLine2: '101동 1203호', deliveryNote: '', isDefault: true },
    {}, false, false,
  ];
  const render = onSaved => {
    let index = 0;
    setters.length = 0;
    const { MypageAddressForm } = loadTs('src/features/mypage/addresses/form.tsx', {
      react: {
        useCallback: fn => fn,
        useState: () => { const calls = []; setters.push(calls); return [states[index++], value => calls.push(value)]; },
      },
      './address-search-field': { MypageAddressSearchField: element },
      './submission-result': { MypageAddressSubmissionResult: element },
    });
    let saves = 0;
    const tree = MypageAddressForm({ mode: 'create', returnHref: '/mypage/address', onSubmitAddress: async () => { saves++; return true; }, onSaved });
    return { form: tree.props.children, saves: () => saves };
  };

  const saved = [];
  const checkout = render(() => saved.push(true));
  await checkout.form.props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(checkout.saves(), 1);
  assert.equal(saved.length, 1);
  assert.deepEqual(setters[3], [true]);

  // The mypage form has no onSaved: it shows the result and unlocks as before.
  const mypage = render(undefined);
  await mypage.form.props.onSubmit({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(setters[2], [true]);
  assert.deepEqual(setters[3], [true, false]);
});
