import { productResponse } from './helpers/cart-products.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

test('product mapping preserves SKU while cart and option views use numeric IDs', async () => {
  const { fixtureProductService: productService } = loadTs('src/domains/product/fixture-service.ts');
  const { toProductCartItemViewModel, toProductOptionViewModel } = loadTs('src/domains/product/mapper.ts');
  const product = await productService.findById(1);
  assert.equal(product.variants[1].id, 2);
  assert.equal(product.variants[1].sku, '1-GY-M');
  assert.equal(toProductCartItemViewModel(product, 2).size, 'M');
  assert.equal(toProductCartItemViewModel(product, 17), null);
  assert.equal(toProductOptionViewModel(product).variants[1].id, 2);
  assert.ok(product.images.every(image => Number.isSafeInteger(image.id)));
});

test('cart merges numeric option IDs and explicitly carries UUID selection across option replacements', async () => {
  const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
  let raw = null; let sequence = 0;
  const newId = () => '40000000-0000-4000-8000-' + String(++sequence).padStart(12,'0');
  const local = loadTs('src/domains/cart/cart.local.ts').createCartLocalAdapter({storage:{getItem:()=>raw,setItem:(_,value)=>{raw=value;}},locks:{request:async(_,work)=>work()},events:{subscribe:()=>()=>{}},newId});
  const {createCartController} = loadTs('src/features/cart/cart-controller.ts');
  const controller = createCartController({store,local,newId,actions:{resolveAccess:async()=>({status:'guest'})},loadProducts:async items=>productResponse(items.map(item=>({...item,styleId:1,name:'상품',color:'회색',thumbnailUrl:'/file.svg',price:10000,discountRate:0,priceOffset:0,stock:10,size:'M'})))});
  await controller.start({status:'guest'});
  await controller.addItems([{productId:1,variantId:2,quantity:2},{productId:1,variantId:2,quantity:1},{productId:2,variantId:7,quantity:1}]);
  assert.deepEqual(store.getState().selectedIds,[]);
  const source = store.getState().cart.items.find(item=>item.variantId===2).id;
  store.getState().setSelected(source,true);
  await controller.changeOption(source,2,7);
  const target = store.getState().cart.items[0];
  assert.equal(target.variantId,7); assert.equal(target.quantity,4); assert.deepEqual(store.getState().selectedIds,[target.id]);
  await controller.changeOption(target.id,4,17);
  const moved = store.getState().cart.items[0];
  assert.equal(moved.variantId,17); assert.equal(moved.quantity,4); assert.deepEqual(store.getState().selectedIds,[moved.id]);
  await controller.removeItems([moved.id]);
  assert.deepEqual(store.getState().cart.items,[]); assert.deepEqual(store.getState().selectedIds,[]);
  controller.dispose();
});

function request(items) {
  return new Request('http://localhost/api/cart/products', {
    method: 'POST', body: JSON.stringify(items), headers: { 'content-type': 'application/json' },
  });
}

test('cart API accepts numeric IDs and never returns an option from another product', async () => {
  const { fixtureProductService } = loadTs('src/domains/product/fixture-service.ts');
  const mapping = loadTs('src/domains/product/mapper.ts');
  const { POST } = loadTs('src/app/api/cart/products/route.ts', {
    '@/domains/product': { ...mapping, productService: fixtureProductService },
  });
  const response = await POST(request([{ productId: 1, variantId: 2 }]));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.cartItems[0].variantId, 2);
  assert.equal(data.cartItems[0].size, 'M');
  assert.ok(data.optionGroups[1].every(product => product.variants.every(variant => Number.isSafeInteger(variant.id))));
  const mismatch = await POST(request([{ productId: 1, variantId: 17 }]));
  assert.equal(mismatch.status, 200);
  assert.deepEqual((await mismatch.json()).cartItems, []);
});

test('cart API rejects invalid IDs before reading product data', async () => {
  let reads = 0;
  const { POST } = loadTs('src/app/api/cart/products/route.ts', {
    '@/domains/product': { productService: { findByIds: async () => { reads++; return []; } } },
  });
  for (const invalid of ['2', '1-GY-M', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, null, Infinity, NaN]) {
    for (const item of [{ productId: 1, variantId: invalid }, { productId: invalid, variantId: 2 }]) {
      assert.equal((await POST(request([item]))).status, 400, JSON.stringify(item));
    }
  }
  assert.equal(reads, 0);
});

test('cart API omits inactive products but keeps active sold-out options', async () => {
  const { fixtureProductRepository } = loadTs('src/domains/product/fixture-repository.ts');
  const { createProductService } = loadTs('src/domains/product/service.ts');
  const mapping = loadTs('src/domains/product/mapper.ts');
  const productService = createProductService({
    async findManyWithRelations(query) {
      return (await fixtureProductRepository.findManyWithRelations(query)).map(row => ({
        ...row,
        product: { ...row.product, state: row.product.id === 1 ? 'inactive' : 'active' },
        variants: row.variants.map(variant => ({ ...variant, stock: 0 })),
      }));
    },
  }, { findByProductIds: async () => [] });
  const { POST } = loadTs('src/app/api/cart/products/route.ts', {
    '@/domains/product': { ...mapping, productService },
  });
  const result = await POST(request([{ productId: 1, variantId: 2 }, { productId: 2, variantId: 7 }]));
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.deepEqual(data.cartItems.map(item => [item.productId, item.variantId, item.stock]), [[2, 7, 0]]);
});

test('demo order saves numeric options and rejects mismatched product-option pairs', async () => {
  const { fixtureProductService: productService } = loadTs('src/domains/product/fixture-service.ts');
  const { createOrderCommandService } = loadTs('src/domains/order/order-command.service.ts', {
    '@/domains/product': loadTs('src/domains/product/domain.ts'),
  });
  const saved = { items: [] };
  const service = createOrderCommandService({
    productRepository: productService,
    orderMutationRepository: {
      createOrder: async order => { saved.order = order; },
      createOrderItems: async items => { saved.items = items; },
      createOrderStatusHistories: async () => {},
      createPaymentTransactions: async () => {},
    },
    now: () => new Date('2026-10-17T00:00:00Z'),
  });
  const input = {
    userId: 'demo', recipientName: '테스트', recipientPhone: '01012345678',
    postalCode: '12345', shippingAddressText: '테스트 주소',
    items: [{ productId: 1, variantId: 2, quantity: 2 }],
  };
  await service.createDemoOrder(input);
  assert.equal(saved.items[0].variant_id, 2);
  assert.equal(saved.items[0].option_label, '그레이 / M');
  assert.equal(saved.order.total_amount, saved.items[0].line_total_amount + saved.order.shipping_fee);
  await assert.rejects(service.createDemoOrder({ ...input, items: [{ productId: 1, variantId: 17, quantity: 1 }] }), /상품 옵션/);
});

test('exchange form keeps a missing option null and prevents submitting it', () => {
  const states = [];
  let cursor = 0;
  const { useClaimRequestForm } = loadTs('src/features/mypage/returns/request/use-claim-request-form.ts', {
    react: { useState: initial => {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    } },
  });
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Executes the hook against the in-memory React mock above.
  const render = () => { cursor = 0; return useClaimRequestForm({ currentProductId: 1, currentVariantId: 2 }); };
  let form = render();
  assert.equal(form.exchangeOptionId, null);
  form.selectType('exchange');
  form.selectReason('size_or_color');
  form.updateAgreement(true);
  form = render();
  assert.equal(form.exchangeOptionId, 2);
  form.selectExchangeOption(2, null);
  form = render();
  assert.equal(form.hasChangedExchangeOption, false);
  assert.equal(form.submit(), null);
  assert.match(render().errors.exchangeOption, /옵션을 선택/);
  form.selectExchangeOption(2, 7);
  form = render();
  assert.equal(form.exchangeOptionId, 7);
  assert.equal(form.submit(), 'exchange');
});
