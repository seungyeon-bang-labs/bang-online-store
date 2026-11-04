import {
  toProductCartItemViewModel,
  toProductOptionViewModel,
} from '../product/mapper';
import type { ProductOptionViewModel } from '../product/view-model';
import type { CartProductRequestItem, CartProductResponse } from './contract';
import type { CartProductPort } from './service';

// Current product data for guest cart lines: each requested pair that still exists (discontinued ones marked),
// and every on-sale option of the on-sale lines' styles.
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
  const offSale = items.filter(item => !productById.has(item.productId));
  const discontinued = offSale.length > 0
    ? await products.findDiscontinuedCartItems(offSale)
    : [];
  const cartItems = items.flatMap(item => {
    const product = productById.get(item.productId);
    const viewModel = product
      ? toProductCartItemViewModel(product, item.variantId)
      : discontinued.find(line =>
          line.productId === item.productId && line.variantId === item.variantId);
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
