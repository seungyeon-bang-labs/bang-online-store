import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

const pricing = loadTs('src/domains/product/domain.ts');
const discounts = loadTs('src/domains/discount/discount.domain.ts');
const campaign = (id, values={}) => ({id,title:`할인 ${id}`,starts_at:'2026-10-19T00:00:00+09:00',ends_at:'2026-10-20T14:00:00+09:00',priority:1,is_active:true,...values});
const candidate = (id, rate, values={}) => ({discount_id:id,product_id:1,discount_rate:rate,discount:campaign(id,values)});

test('discounted prices avoid floating subtraction and round the base before quantity', () => {
  for (const [price, rate, expected] of [[10001,15,8500],[10000,80,2000],[10000,90,1000],[10001,0,10001],[10001,100,0]]) {
    assert.equal(pricing.getDiscountedPrice(price,rate),expected);
  }
  assert.deepEqual(pricing.getProductLinePrice(10001,15,500,2),{unitPrice:9000,total:18000,originalTotal:21002,discountAmount:3002});
  assert.deepEqual(pricing.getProductLinePrice(10001,100,500,2),{unitPrice:500,total:1000,originalTotal:21002,discountAmount:20002});
});

test('campaign choice is priority first, ID second, never stacked or highest-rate first', () => {
  const input = [candidate(9,90), candidate(5,10,{priority:3}),candidate(3,15,{priority:3}),candidate(1,100,{is_active:false})];
  const before = JSON.stringify(input);
  assert.deepEqual(discounts.selectProductDiscount(1,input,new Date('2026-10-19T12:00:00+09:00')),{discountRate:15,appliedDiscountId:3});
  assert.equal(JSON.stringify(input),before);
  assert.deepEqual(discounts.selectProductDiscount(999,input,new Date('2026-10-19T12:00:00+09:00')),{discountRate:0,appliedDiscountId:null});
});

test('campaign applicability includes start and excludes end, including fractional seconds', () => {
  const cases = [
    ['2026-10-18T23:59:59.999+09:00',false],
    ['2026-10-19T00:00:00+09:00',true],
    ['2026-10-20T13:59:59.999+09:00',true],
    ['2026-10-20T14:00:00+09:00',false],
  ];
  for (const [now,applies] of cases) assert.deepEqual(discounts.selectProductDiscount(1,[candidate(1,15)],new Date(now)),applies?{discountRate:15,appliedDiscountId:1}:{discountRate:0,appliedDiscountId:null});
  const now = new Date('2026-10-20T00:00:00+09:00');
  assert.equal(discounts.selectProductDiscount(1,[candidate(1,15,{ends_at:'2026-10-20T00:00:00.000001+09:00'})],now).discountRate,15);
  assert.equal(discounts.selectProductDiscount(1,[candidate(1,15,{starts_at:'2026-10-20T00:00:00.000001+09:00'})],now).discountRate,0);
});

test('SALE labels use Seoul calendar days and an exclusive midnight end', () => {
  const {getSaleRemainingLabel} = loadTs('src/domains/product/sale.ts');
  const cases = [
    ['2026-10-19T12:00:00+09:00','2026-10-20T00:00:00+09:00','오늘 종료'],
    ['2026-10-19T12:00:00+09:00','2026-10-20T14:00:00+09:00','D-1 · 14:00 종료'],
    ['2026-10-20T12:00:00+09:00','2026-10-20T14:00:00+09:00','오늘 14:00 종료'],
    ['2026-10-20T14:00:00+09:00','2026-10-20T14:00:00+09:00',null],
    ['2026-10-20T14:00:00.001+09:00','2026-10-20T14:00:00+09:00',null],
    ['2026-12-31T12:00:00+09:00','2027-01-01T00:00:00+09:00','오늘 종료'],
    ['2026-10-31T23:59:00+09:00','2026-11-02T00:00:00+09:00','D-1'],
    ['2026-10-19T12:00:00+09:00','2026-10-19T15:00:00Z','오늘 종료'],
    ['2026-10-19T12:00:00+09:00','2026-10-19T15:00:01Z','D-1 · 00:00 종료'],
    ['2026-10-19T12:00:00+09:00','2026-10-19T15:00:00.001Z','D-1 · 00:00 종료'],
    ['2026-10-19T12:00:00+09:00','2026-10-19T15:00:00.000001Z','D-1 · 00:00 종료'],
    ['2026-10-20T00:00:00+09:00','2026-10-20T00:00:00.000001+09:00','오늘 00:00 종료'],
  ];
  for (const [now,end,label] of cases) assert.equal(getSaleRemainingLabel(end,new Date(now)),label,`${now} → ${end}`);
});

function textContent(node) {
  if (node==null || typeof node==='boolean') return '';
  if (typeof node==='string' || typeof node==='number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  return textContent(node.props?.children);
}

test('ProductPrice displays the same base discount and option-inclusive original amount', () => {
  const {ProductPrice} = loadTs('src/features/product/product-price.tsx');
  const text = textContent(ProductPrice({price:10001,discount:15,quantity:2,priceOffset:500}));
  assert.ok(text.includes('21,002원'),text);
  assert.ok(text.includes('18,000원'),text);
  const highDiscount = textContent(ProductPrice({price:10000,discount:80}));
  assert.ok(highDiscount.includes('2,000원'),highDiscount);
});

test('CartSummary combines different products with base-only discounts and exact won totals', () => {
  const {CartSummary} = loadTs('src/features/cart/cart-summary.tsx', {react:{useMemo:fn=>fn()}});
  const a = {id:1,productId:1,name:'A',price:10001,discount:15,quantity:2,priceOffset:500};
  const b = {id:2,productId:2,name:'B',price:10000,discount:80,quantity:1,priceOffset:0};
  const single = textContent(CartSummary({selectedProducts:[a]}));
  assert.ok(single.includes('18,000원'),single);
  assert.ok(single.includes('-3,002원'),single);
  const multiple = textContent(CartSummary({selectedProducts:[a,b]}));
  for (const expected of ['3개','30,002원','1,000원','-11,002원','20,000원']) assert.ok(multiple.includes(expected),multiple);
});
