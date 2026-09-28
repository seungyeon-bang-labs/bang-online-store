import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getFooterVisibility } from '../src/shared/lib/footer-visibility.ts';

// Fixtures are the selected children branch, not the overlay's address bar URL.
test('hides task forms and receipt documents on both screen sizes', () => {
  const paths = [
    'mypage/edit',
    'mypage/address/write',
    'mypage/address/address-1/edit',
    'mypage/inquiries/write',
    'mypage/inquiries/inquiry-1/edit',
    'mypage/reviews/write/item-1',
    'mypage/reviews/review-1/edit',
    'mypage/orders/order-1/cancel/item-1',
    'mypage/orders/order-1/claim/item-1',
    'mypage/orders/order-1/receipt/purchase',
    'mypage/orders/order-1/receipt/card',
    'mypage/orders/order-1/receipt/cash',
    'mypage/orders/order-1/receipt/refund',
    'snapshot/upload',
  ];
  for (const path of paths) {
    assert.equal(getFooterVisibility(path.split('/')), 'hidden', path);
  }
});

test('retains a desktop footer for account browsing and navigation tools', () => {
  for (const path of [
    'mypage', 'mypage/orders', 'mypage/orders/order-1',
    'mypage/orders/order-1/receipt', 'mypage/returns/claim-1',
    'mypage/address', 'mypage/reviews', 'mypage/inquiries',
    'mypage/coupons', 'mypage/points', 'mypage/membership',
    'mypage/recent', 'mypage/wishlist', 'search', 'category', 'cart',
  ]) {
    assert.equal(getFooterVisibility(path.split('/')), 'desktop-only', path);
  }
});

test('keeps storefront content visible, ignoring route groups', () => {
  for (const segments of [
    [], ['(product)', 'new'], ['(product)', 'best'], ['(product)', 'sale'],
    ['(product)', 'product', '1'], ['(product)', 'category', 'top', 'shirt'],
    ['snapshot'], ['snapshot', '1'], ['event'], ['event', '1'],
    ['cs'], ['cs', 'notice'], ['cs', 'faq'], ['cs', 'return-request'],
  ]) {
    assert.equal(getFooterVisibility(segments), 'visible', segments.join('/'));
  }
});

test('matches whole path segments without hiding similarly named content', () => {
  assert.equal(getFooterVisibility(['snapshot', 'upload-story']), 'visible');
  assert.equal(getFooterVisibility(['mypage-preview']), 'visible');
  assert.equal(getFooterVisibility(['mypage', 'reviews', 'writeup']), 'desktop-only');
  assert.equal(getFooterVisibility(['(account)', 'mypage', 'edit']), 'hidden');
});
