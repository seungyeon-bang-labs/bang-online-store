import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

const catalog = loadTs('src/domains/product/fixture.ts');
const { ORDER_ITEMS, ORDER_CLAIMS } = loadTs('src/domains/order/fixture.ts');
const variants = catalog.PRODUCT_VARIANT_FIXTURE;
const images = catalog.PRODUCT_IMAGE_FIXTURE;

function assertUniquePositiveIds(rows) {
  assert.ok(rows.every(row => Number.isSafeInteger(row.id) && row.id > 0));
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
}

test('catalog has unique numeric option/image IDs and separate unique SKUs', () => {
  assert.equal(variants.length, 135);
  assert.equal(images.length, 30);
  assertUniquePositiveIds(variants);
  assertUniquePositiveIds(images);
  assert.ok(variants.every(variant => typeof variant.sku === 'string' && variant.sku.length > 0));
  assert.equal(new Set(variants.map(variant => variant.sku)).size, variants.length);
  assert.equal(variants.find(variant => variant.sku === '1-GY-S').id, 1);
  assert.equal(variants.find(variant => variant.sku === '2-CM-M').id, 17);
  assert.equal(variants.find(variant => variant.sku === '8-GY-M').id, 47);
});

test('catalog relations reference existing products, styles and colors', () => {
  const products = new Set(catalog.PRODUCT_FIXTURE.map(product => product.id));
  const styles = new Set(catalog.PRODUCT_STYLE_FIXTURE.map(style => style.id));
  const colors = new Set(catalog.PRODUCT_COLOR_FIXTURE.map(color => color.id));
  for (const product of catalog.PRODUCT_FIXTURE) {
    assert.ok(styles.has(product.style_id));
    assert.ok(colors.has(product.color_id));
  }
  for (const row of [...variants, ...images]) assert.ok(products.has(row.product_id));
});

test('all 38 order/exchange references use numeric options owned by their product', () => {
  const references = [
    ...ORDER_ITEMS.map(item => [item.product_id, item.variant_id]),
    ...ORDER_CLAIMS.filter(claim => claim.exchange_variant_id !== null)
      .map(claim => [claim.exchange_product_id, claim.exchange_variant_id]),
  ];
  assert.equal(references.length, 38);
  for (const [productId, variantId] of references) {
    assert.ok(Number.isSafeInteger(variantId), `numeric variant required: ${variantId}`);
    assert.equal(variants.find(variant => variant.id === variantId)?.product_id, productId);
  }
});

test('corrected demo snapshots keep their amounts and quantities', async () => {
  const coat = ORDER_ITEMS.find(item => item.id.endsWith('000015'));
  const blazer = ORDER_ITEMS.find(item => item.id.endsWith('000016'));
  const { fixtureProductService: productService } = loadTs('src/domains/product/fixture-service.ts');
  assert.equal(coat.variant_id, 17);
  assert.equal(coat.product_id, 4);
  assert.equal(blazer.variant_id, 47);
  assert.equal(blazer.product_id, 10);
  assert.equal(blazer.product_name, (await productService.findById(10)).name);
  assert.equal(blazer.option_label, '그레이 / M');
  assert.deepEqual([coat.quantity, coat.unit_price, coat.line_total_amount], [1, 320000, 290000]);
  assert.deepEqual([blazer.quantity, blazer.unit_price, blazer.line_total_amount], [1, 119000, 119000]);
});
