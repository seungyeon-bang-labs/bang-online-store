import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, I1, I2, REQUEST1, cartDto, command, productModel } from './helpers/cart-fixtures.mjs';

function setup({ snapshots = [cartDto()], byIds, byStyle, failure } = {}) {
  const calls = { read: [], apply: [], products: [], styles: [], now: 0 };
  let index = 0;
  const repository = {
    read: async user => { calls.read.push(user); if (failure) throw failure; return snapshots[Math.min(index++, snapshots.length - 1)]; },
    apply: async input => { calls.apply.push(structuredClone(input)); if (failure) throw failure; return snapshots[Math.min(index++, snapshots.length - 1)]; },
  };
  const products = {
    findByIds: async (ids, options) => { calls.products.push({ ids, options }); return byIds ? byIds(calls.products.length) : [productModel()]; },
    findByStyleId: async (styleId, options) => { calls.styles.push({ styleId, options }); return byStyle ? byStyle(styleId, calls.styles.length) : [productModel()]; },
  };
  const instant = new Date('2026-10-23T00:00:00Z');
  const { createCartService } = loadTs('src/domains/cart/cart.service.ts');
  const service = createCartService({ repository, products, now: () => { calls.now++; return instant; } });
  return { service, calls, instant };
}

test('mapper preserves cart order and maps current product prices, options and sold-out selection', () => {
  const { toCartViewModel } = loadTs('src/domains/cart/cart.mapper.ts');
  const active = productModel({ discountRate: 20 });
  const soldOut = productModel({ id: 2, color: { ...active.color, id: 2, name: '블랙', code: 'BLACK' }, variants: [{ ...active.variants[0], id: 7, productId: 2, stock: 0 }] });
  const dto = cartDto({ items: [
    { id: I2, product_id: 2, product_variant_id: 7, quantity: 5 },
    { id: I1, product_id: 1, product_variant_id: 2, quantity: 2 },
  ] });
  const before = JSON.stringify({ dto, active, soldOut });
  const result = toCartViewModel(dto, [active, soldOut], [active, soldOut]);
  assert.deepEqual(result.owner, { kind: 'member', userId: A });
  assert.equal(result.cartId, dto.cart_id);
  assert.equal(result.revision, dto.revision);
  assert.deepEqual(result.items.map(item => [item.id, item.quantity, item.canSelect]), [[I2, 5, false], [I1, 2, true]]);
  assert.equal(result.items[1].discountRate, 20);
  assert.equal(result.items[1].priceOffset, 1000);
  assert.equal(result.items[1].thumbnailUrl, '/file.svg');
  assert.deepEqual(result.optionGroups[1].map(option => option.productId), [1, 2]);
  assert.equal(JSON.stringify({ dto, active, soldOut }), before);
  assert.equal('selectedIds' in result, false);
});

test('service deduplicates selectors and shares one exact clock across item and style reads', async () => {
  const dto = cartDto({ items: [cartDto().items[0], { ...cartDto().items[0], id: I2, product_variant_id: 3 }] });
  const base = productModel();
  const multipleVariants = productModel({ variants: [...base.variants, { ...base.variants[0], id: 3, size: 'L', sku: '1-GY-L' }] });
  const { service, calls, instant } = setup({ snapshots: [dto], byIds: () => [multipleVariants], byStyle: () => [multipleVariants] });
  assert.equal((await service.read(A)).items.length, 2);
  assert.deepEqual(calls.products[0].ids, [1]);
  assert.deepEqual(calls.styles.map(call => call.styleId), [1]);
  assert.equal(calls.now, 1);
  assert.equal(calls.products[0].options.now, instant);
  assert.equal(calls.styles[0].options.now, instant);
});

test('empty authoritative carts return normally without unnecessary product lookups', async () => {
  const { service, calls } = setup({ snapshots: [cartDto({ items: [] })] });
  assert.deepEqual((await service.read(A)).items, []);
  assert.deepEqual(calls.products, []);
  assert.deepEqual(calls.styles, []);
});

test('a transient display mismatch re-reads the authoritative cart once and never silently drops a line', async () => {
  const { service, calls, instant } = setup({ byIds: attempt => attempt === 1 ? [] : [productModel()] });
  assert.equal((await service.read(A)).items.length, 1);
  assert.deepEqual(calls.read, [A, A]);
  assert.equal(calls.now, 1);
  assert.ok(calls.products.every(call => call.options.now === instant));
  const removed = setup({ snapshots: [cartDto(), cartDto({ items: [], revision: '2' })], byIds: () => [] });
  const result = await removed.service.read(A);
  assert.deepEqual(result.items, []);
  assert.equal(result.revision, '2');
});

test('persistent missing, inactive, wrong-parent and insufficient-stock displays stop after one retry', async () => {
  const base = productModel();
  for (const products of [[], [productModel({ state: 'inactive' })],
    [productModel({ variants: [] })],
    [productModel({ variants: [{ ...base.variants[0], productId: 999 }] })],
    [productModel({ variants: [{ ...base.variants[0], stock: 1 }] })],
  ]) {
    const { service, calls } = setup({ byIds: () => products });
    await assert.rejects(service.read(A), /상품/);
    assert.equal(calls.read.length, 2);
  }
  const missingOptions = setup({ byStyle: () => [] });
  await assert.rejects(missingOptions.service.read(A), /상품/);
  assert.equal(missingOptions.calls.read.length, 2);
});

test('mutation display recovery repeats the same captured request and returns its completed receipt', async () => {
  const receipt = { requestId: REQUEST1, outcome: 'applied', itemIdMap: { [I1]: I2 }, notices: [] };
  const { service, calls } = setup({ snapshots: [cartDto({ operation: receipt })], byIds: n => n === 1 ? [] : [productModel()] });
  const input = command();
  const result = service.apply(input);
  input.operation.delta = -1;
  assert.deepEqual((await result).operation, receipt);
  assert.deepEqual(calls.apply, [command(), command()]);
  assert.equal(calls.now, 1);
});

test('drift between item and option stock cannot produce a successful selectable view', async () => {
  const base = productModel();
  const { service, calls } = setup({ byStyle: () => [productModel({ variants: [{ ...base.variants[0], stock: 0 }] })] });
  await assert.rejects(service.read(A), /상품/);
  assert.equal(calls.read.length, 2);
});

test('repository, discount, image and option-read failures propagate without success or fallback', async () => {
  const network = new Error('상품 옵션 PRIVATE_NETWORK_DETAIL');
  const options = setup({ byStyle: () => { throw network; } });
  await assert.rejects(options.service.read(A), error => error === network);
  assert.equal(options.calls.read.length, 1);
  const database = setup({ failure: network });
  await assert.rejects(database.service.read(A), error => error === network);
  for (const boundary of ['images', 'discounts']) {
    const { createProductService } = loadTs('src/domains/product/service.ts');
    const failure = new Error(`상품 ${boundary} 조회 실패`);
    const dto = {
      product: { id: 1, state: 'active' }, style: {}, color: {}, variants: [], images: [], stats: null,
    };
    const productService = createProductService({ findManyWithRelations: async () => {
      if (boundary === 'images') throw failure;
      return [dto];
    } }, { findByProductIds: async () => { throw failure; } });
    const { createCartService } = loadTs('src/domains/cart/cart.service.ts');
    const service = createCartService({ repository: { read: async () => cartDto() }, products: productService, now: () => new Date() });
    await assert.rejects(service.read(A), error => error === failure);
  }
});

test('missing required product relations fail instead of building a partial successful view', async () => {
  for (const field of ['color', 'style', 'images', 'variants']) {
    const { service } = setup({ byIds: () => [productModel({ [field]: null })] });
    await assert.rejects(service.read(A), /상품/);
  }
});
