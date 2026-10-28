import {
  toProductCartItemViewModel,
  toProductOptionViewModel,
} from '../product/mapper';
import type { ProductOptionViewModel } from '../product/view-model';
import type { CartProductRequestItem, CartProductResponse } from './cart.api';
import type { CartProductPort } from './cart.service';

// Current product data for guest cart lines: each requested pair that still exists, and every option of their styles.
export async function findCartProducts(
  products: CartProductPort,
  items: readonly CartProductRequestItem[],
  now: Date,
): Promise<CartProductResponse> {
  const options = { now };
  const cartProducts = await products.findByIds(
    [...new Set(items.map(item => item.productId))],
    options,
  );
  const styleProducts = await Promise.all(
    [...new Set(cartProducts.map(product => product.styleId))].map(styleId =>
      products.findByStyleId(styleId, options),
    ),
  );
  const productById = new Map(
    cartProducts.map(product => [product.id, product]),
  );
  const cartItems = items.flatMap(item => {
    const product = productById.get(item.productId);
    const viewModel = product
      ? toProductCartItemViewModel(product, item.variantId)
      : null;
    return viewModel ? [viewModel] : [];
  });
  const optionGroups = styleProducts
    .flat()
    .reduce<Record<number, ProductOptionViewModel[]>>((groups, product) => {
      (groups[product.styleId] ??= []).push(toProductOptionViewModel(product));
      return groups;
    }, {});
  return { cartItems, optionGroups };
}
