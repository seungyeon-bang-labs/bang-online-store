import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { I1, I2, cartView } from './helpers/cart-fixtures.mjs';
import { productResponse } from './helpers/cart-products.mjs';

const { applyGuestChange, buildGuestCart } = loadTs('src/domains/cart/cart.guest.ts');
const { previewChange } = loadTs('src/features/cart/cart-preview.ts');
const { noticeMessage, failureMessage, messages } = loadTs('src/features/cart/cart-messages.ts');
const I3 = '10000000-0000-4000-8000-000000000003';
const line = (overrides = {}) => ({ id: I1, productId: 1, variantId: 2, quantity: 1, ...overrides });
const product = (overrides = {}) => ({
  productId: 1, styleId: 1, variantId: 2, name: '그레이 티셔츠', color: '그레이', thumbnailUrl: '/file.svg',
  price: 10000, discountRate: 20, priceOffset: 1000, size: 'M', stock: 10, ...overrides,
});
const ids = () => { const queue = [I2, I3]; return () => queue.shift(); };

test('add merges into the same variant or appends a new line', () => {
  const result = applyGuestChange([line()], { kind: 'add_items', items: [
    { productId: 1, variantId: 2, quantity: 2 }, { productId: 1, variantId: 3, quantity: 1 }, { productId: 1, variantId: 3, quantity: 1 },
  ] }, ids());
  assert.deepEqual(result, { status: 'saved', lines: [line({ quantity: 3 }), line({ id: I2, variantId: 3, quantity: 2 })] });
});

test('adjust applies ±1 to the latest quantity and never goes below 1', () => {
  assert.deepEqual(applyGuestChange([line({ quantity: 3 })], { kind: 'adjust_quantity', itemId: I1, delta: 1 }, ids()),
    { status: 'saved', lines: [line({ quantity: 4 })] });
  assert.deepEqual(applyGuestChange([line()], { kind: 'adjust_quantity', itemId: I1, delta: -1 }, ids()),
    { status: 'saved', lines: [line()] });
});

test('change option moves the line and merges into the same option', () => {
  assert.deepEqual(applyGuestChange([line()], { kind: 'change_option', itemId: I1, productId: 1, variantId: 3 }, ids()),
    { status: 'saved', lines: [line({ variantId: 3 })] });
  assert.deepEqual(applyGuestChange([line({ id: I2, variantId: 3, quantity: 2 }), line()], { kind: 'change_option', itemId: I1, productId: 1, variantId: 3 }, ids()),
    { status: 'saved', lines: [line({ id: I2, variantId: 3, quantity: 3 })], itemIdMap: { [I1]: I2 } });
});

test('remove drops lines; a missing target reports missing', () => {
  assert.deepEqual(applyGuestChange([line(), line({ id: I2, variantId: 3 })], { kind: 'remove_items', itemIds: [I1] }, ids()),
    { status: 'saved', lines: [line({ id: I2, variantId: 3 })] });
  assert.deepEqual(applyGuestChange([line()], { kind: 'remove_items', itemIds: [I2] }, ids()), { status: 'missing' });
  assert.deepEqual(applyGuestChange([line()], { kind: 'adjust_quantity', itemId: I2, delta: 1 }, ids()), { status: 'missing' });
  assert.deepEqual(applyGuestChange([line()], { kind: 'change_option', itemId: I2, productId: 1, variantId: 3 }, ids()), { status: 'missing' });
});

test('build drops unavailable and clamps stock', () => {
  const built = buildGuestCart([line({ quantity: 5 }), line({ id: I2, productId: 9, variantId: 9, quantity: 2 })], productResponse([product({ stock: 3 })]));
  assert.equal(built.changed, true);
  assert.deepEqual(built.lines, [line({ quantity: 3 })]);
  assert.deepEqual(built.cart.notices, [
    { kind: 'quantity_adjusted', itemId: I1, variantId: 2, before: 5, after: 3 },
    { kind: 'unavailable', itemId: I2, variantId: 9, before: 2, after: 0 },
  ]);
  assert.deepEqual(built.cart.owner, { kind: 'guest' });
  assert.equal(built.cart.cartId, null);
  assert.equal(built.cart.revision, null);
  assert.equal(built.cart.operation, null);
  assert.equal(built.cart.items[0].quantity, 3);
  assert.equal(built.cart.items[0].name, '그레이 티셔츠');
});

test('build keeps sold-out lines, including just-added ones, but not selectable', () => {
  const built = buildGuestCart([line({ quantity: 2 })], productResponse([product({ stock: 0 })]));
  assert.equal(built.changed, false);
  assert.deepEqual(built.lines, [line({ quantity: 2 })]);
  assert.equal(built.cart.items[0].canSelect, false);
  assert.deepEqual(built.cart.notices, []);
});

test('previewChange adjusts, removes and relabels options without merging', () => {
  const second = { ...cartView().items[0], id: I2, variantId: 3, size: 'L' };
  const cart = cartView({ items: [cartView().items[0], second], optionGroups: { 1: [
    { productId: 1, styleId: 1, color: { id: 1, label: '그레이', hex: '#888' }, variants: [{ id: 2, size: 'M', stock: 10, priceOffset: 1000 }, { id: 3, size: 'L', stock: 5, priceOffset: 1000 }] },
  ] } });
  assert.equal(previewChange(cart, { kind: 'adjust_quantity', itemId: I1, delta: 1 }).items[0].quantity, 3);
  assert.equal(previewChange(cart, { kind: 'adjust_quantity', itemId: I1, delta: -1 }).items[0].quantity, 1);
  assert.equal(previewChange(cartView({ items: [{ ...cartView().items[0], quantity: 1 }] }), { kind: 'adjust_quantity', itemId: I1, delta: -1 }).items[0].quantity, 1);
  assert.deepEqual(previewChange(cart, { kind: 'remove_items', itemIds: [I1] }).items.map(item => item.id), [I2]);
  const relabeled = previewChange(cart, { kind: 'change_option', itemId: I1, productId: 1, variantId: 3 });
  assert.equal(relabeled.items.length, 2);
  assert.deepEqual([relabeled.items[0].variantId, relabeled.items[0].size, relabeled.items[0].quantity], [3, 'L', 2]);
  assert.equal(cart.items[0].variantId, 2, 'input is not mutated');
});

test('messages cover every notice kind except merge_returned', () => {
  assert.equal(noticeMessage({ kind: 'quantity_adjusted' }), '현재 재고에 맞게 수량을 조정했습니다.');
  assert.equal(noticeMessage({ kind: 'sold_out' }), '품절된 옵션은 새로 담거나 수량을 변경할 수 없습니다.');
  assert.equal(noticeMessage({ kind: 'unavailable' }), '현재 이용할 수 없는 상품을 장바구니에서 제외했습니다.');
  assert.equal(noticeMessage({ kind: 'item_missing' }), '이미 변경되거나 삭제된 장바구니 항목입니다.');
  assert.equal(noticeMessage({ kind: 'option_rejected' }), '선택한 옵션으로 변경할 수 없습니다.');
  assert.deepEqual(failureMessage, {
    add_items: '장바구니에 담지 못했습니다.', adjust_quantity: '수량 변경을 저장하지 못했습니다.',
    change_option: '옵션 변경을 저장하지 못했습니다.', remove_items: '삭제를 저장하지 못했습니다.',
  });
  assert.deepEqual(messages, {
    loadFailed: '장바구니를 불러오지 못했습니다.', guestLoadFailed: '장바구니 정보를 불러오지 못했습니다.',
    guestWriteFailed: '장바구니를 저장하지 못했습니다.', restricted: '이메일 인증과 회원 상태를 확인해주세요.',
    mergeRejected: '판매하지 않는 상품이라 옮기지 못했습니다.', mergeFailed: '로그인 전에 담은 상품을 옮기지 못했습니다.',
    itemMissing: '이미 변경되거나 삭제된 장바구니 항목입니다.',
  });
});
