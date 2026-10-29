export const A = '00000000-0000-4000-8000-000000000001';
export const B = '00000000-0000-4000-8000-000000000002';
export const I1 = '10000000-0000-4000-8000-000000000001';
export const I2 = '10000000-0000-4000-8000-000000000002';
export const REQUEST1 = '20000000-0000-4000-8000-000000000001';
export const CART_A = '30000000-0000-4000-8000-000000000001';
export const CART_B = '30000000-0000-4000-8000-000000000002';

/** @param {Partial<import('../../src/domains/cart/dto.ts').CartSnapshotDTO>} overrides */
export function cartDto(overrides = {}) {
  return {
    owner_id: A,
    cart_id: CART_A,
    revision: '1',
    items: [{ id: I1, product_id: 1, product_variant_id: 2, quantity: 2 }],
    notices: [],
    operation: null,
    ...overrides,
  };
}

/** @param {Partial<import('../../src/domains/cart/view-model.ts').CartViewModel>} overrides */
export function cartView(overrides = {}) {
  return {
    owner: { kind: 'member', userId: A },
    cartId: CART_A,
    revision: '1',
    items: [{
      id: I1, productId: 1, styleId: 1, variantId: 2,
      name: '그레이 티셔츠', color: '그레이', thumbnailUrl: '/file.svg',
      price: 10000, discountRate: 20, priceOffset: 1000,
      size: 'M', stock: 10, quantity: 2, canSelect: true,
    }],
    optionGroups: {},
    notices: [],
    operation: null,
    ...overrides,
  };
}

/** @param {Partial<import('../../src/domains/product/model.ts').ProductModel>} overrides */
export function productModel(overrides = {}) {
  return {
    id: 1, styleId: 1, colorId: 1, name: '그레이 티셔츠', categoryId: 'tops',
    price: 10000, discountRate: 20, appliedDiscountId: 1, state: 'active',
    createdAt: new Date('2026-10-22T00:00:00Z'), restockedAt: null,
    variants: [{ id: 2, sku: '1-GY-M', productId: 1, size: 'M', stock: 10, priceOffset: 1000 }],
    stats: null,
    images: [{ id: 1, url: '/file.svg', type: 'thumbnail', displayOrder: 0 }],
    color: { id: 1, name: '그레이', hexCode: '#808080', code: 'GY' },
    style: {
      id: 1, name: '티셔츠', categoryId: 'tops',
      createdAt: new Date('2026-10-22T00:00:00Z'),
      updatedAt: new Date('2026-10-22T00:00:00Z'),
    },
    ...overrides,
  };
}

/** @param {Partial<import('../../src/domains/cart/contract.ts').CartCommand>} overrides */
export function command(overrides = {}) {
  return {
    version: 1, requestId: REQUEST1, expectedUserId: A,
    operation: { kind: 'adjust_quantity', itemId: I1, delta: 1 },
    ...overrides,
  };
}
