import type { ProductModel } from '../product/model';
import {
  toProductCartItemViewModel,
  toProductOptionViewModel,
} from '../product/mapper';
import type { CartSnapshotDTO } from './cart.dto';
import type { CartViewModel } from './cart.view-model';

export class CartDisplayMismatchError extends Error {
  constructor() {
    super('장바구니와 현재 상품 정보가 일치하지 않습니다.');
    this.name = 'CartDisplayMismatchError';
  }
}

function requireRelations(product: ProductModel): void {
  if (
    !product.color ||
    !product.style ||
    !Array.isArray(product.images) ||
    !Array.isArray(product.variants)
  ) {
    throw new Error('상품의 필수 관계 정보를 확인하지 못했습니다.');
  }
}

export function toCartViewModel(
  snapshot: CartSnapshotDTO,
  products: readonly ProductModel[],
  optionProducts: readonly ProductModel[],
): CartViewModel {
  const byId = new Map(products.map(product => [product.id, product]));
  const availableOptions = optionProducts.filter(
    product => product.state === 'active',
  );
  for (const product of [...products, ...availableOptions])
    requireRelations(product);
  const items = snapshot.items.map(line => {
    const product = byId.get(line.product_id);
    if (!product || product.state !== 'active')
      throw new CartDisplayMismatchError();
    const variant = product.variants.find(
      variant => variant.id === line.product_variant_id,
    );
    const option = availableOptions.find(
      candidate =>
        candidate.id === product.id && candidate.styleId === product.styleId,
    );
    const optionVariant = option?.variants.find(
      variant => variant.id === line.product_variant_id,
    );
    if (
      !variant ||
      variant.productId !== product.id ||
      !optionVariant ||
      optionVariant.productId !== product.id ||
      (variant.stock > 0 && line.quantity > variant.stock) ||
      variant.stock !== optionVariant.stock ||
      variant.priceOffset !== optionVariant.priceOffset ||
      variant.size !== optionVariant.size
    ) {
      throw new CartDisplayMismatchError();
    }
    const displayed = toProductCartItemViewModel(product, variant.id);
    if (!displayed) throw new CartDisplayMismatchError();
    return {
      ...displayed,
      id: line.id,
      quantity: line.quantity,
      canSelect: variant.stock > 0,
    };
  });
  const styleIds = new Set(items.map(item => item.styleId));
  const optionGroups: CartViewModel['optionGroups'] = {};
  for (const styleId of styleIds) {
    optionGroups[styleId] = availableOptions
      .filter(product => product.styleId === styleId)
      .map(toProductOptionViewModel);
  }
  return {
    owner: { kind: 'member', userId: snapshot.owner_id },
    cartId: snapshot.cart_id,
    revision: snapshot.revision,
    items,
    optionGroups,
    notices: snapshot.notices.map(notice => ({ ...notice })),
    operation: snapshot.operation && {
      ...snapshot.operation,
      itemIdMap: { ...snapshot.operation.itemIdMap },
      notices: snapshot.operation.notices.map(notice => ({ ...notice })),
    },
  };
}
