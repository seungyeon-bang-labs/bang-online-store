import { NextResponse } from 'next/server';
import {
  productService,
  toProductCartItemViewModel,
  toProductOptionViewModel,
  type ProductOptionViewModel,
} from '@/domains/product';
import type {
  CartProductRequestItem,
  CartProductResponse,
} from '@/domains/cart';

const isRequestItem = (value: unknown): value is CartProductRequestItem =>
  typeof value === 'object' &&
  value !== null &&
  Number.isSafeInteger((value as CartProductRequestItem).productId) &&
  (value as CartProductRequestItem).productId > 0 &&
  typeof (value as CartProductRequestItem).variantId === 'string' &&
  (value as CartProductRequestItem).variantId.trim().length > 0;

export async function POST(request: Request) {
  let items: unknown;

  try {
    items = await request.json();
  } catch {
    return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 });
  }

  if (!Array.isArray(items) || !items.every(isRequestItem)) {
    return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 });
  }

  try {
    const cartProducts = await productService.findByIdsIncludingInactive(
      [...new Set(items.map(item => item.productId))],
    );
    const styleProducts = await Promise.all(
      [...new Set(cartProducts.map(product => product.styleId))].map(styleId =>
        productService.findByStyleId(styleId),
      ),
    );
    const products = styleProducts.flat();
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
    const optionGroups = products.reduce<Record<number, ProductOptionViewModel[]>>(
      (groups, product) => {
        (groups[product.styleId] ??= []).push(toProductOptionViewModel(product));
        return groups;
      },
      {},
    );

    const response: CartProductResponse = { cartItems, optionGroups };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { message: '장바구니 상품을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
