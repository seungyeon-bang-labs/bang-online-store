import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

test('cart order action rejects direct requests without saving orders even with a valid member, address and product', async () => {
  const userId = '00000000-0000-4000-8000-000000000001';
  const { fixtureProductService } = loadTs('src/domains/product/fixture-service.ts');
  const repositories = loadTs('src/domains/order/fixture-repository.ts');
  const { fixtureUserAddressRepository } = loadTs('src/domains/member/fixture-repository.ts');
  const { createOrderCommandService } = loadTs('src/domains/order/order-command.service.ts', {
    '@/domains/product': loadTs('src/domains/product/domain.ts'),
  });
  const service = createOrderCommandService({
    productRepository: fixtureProductService,
    orderMutationRepository: repositories.fixtureOrderMutationRepository,
  });
  const { createDemoOrderFromCart } = loadTs('src/app/(storefront)/cart/actions.ts', {
    '@/app/(auth)/require-active-member': { requireActiveMember: async () => ({ id: userId }) },
    '@/domains/member': { userAddressRepository: fixtureUserAddressRepository },
    '@/domains/order': service,
  });
  const ordersBefore = await repositories.fixtureOrderRepository.findByUserId(userId);
  const itemsBefore = await repositories.fixtureOrderItemRepository.findByOrderIds(ordersBefore.map(order => order.id));

  await assert.rejects(
    createDemoOrderFromCart([{ productId: 1, variantId: 2, quantity: 1 }]),
    /준비 중/,
  );
  assert.deepEqual(await repositories.fixtureOrderRepository.findByUserId(userId), ordersBefore);
  assert.deepEqual(
    await repositories.fixtureOrderItemRepository.findByOrderIds(ordersBefore.map(order => order.id)),
    itemsBefore,
  );
});
