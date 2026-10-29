import { NextResponse } from 'next/server';
import { productService } from '@/domains/product';
import { findCartProducts } from '@/domains/cart/products';
import { cartProductRequestSchema } from '@/domains/cart/schema';
import { readCartPost } from '../http';

export async function POST(request: Request) {
  // Same-origin JSON up to the cart body limit, like the other cart routes.
  const body = await readCartPost(request);
  if (!body.ok) return body.response;

  const items = cartProductRequestSchema.safeParse(body.value);
  if (!items.success) {
    return NextResponse.json(
      { message: '잘못된 요청입니다.' },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await findCartProducts(productService, items.data, new Date()),
    );
  } catch {
    return NextResponse.json(
      { message: '장바구니 상품을 불러오지 못했습니다.' },
      { status: 500 },
    );
  }
}
