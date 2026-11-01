import {
  MAX_ORDER_LINES,
  type OrderBlock,
  type PlaceOrderRejection,
  type PlaceOrderResult,
} from '@/domains/order/place-order';
import { formatKoreanMoney } from '@/shared/lib/format';

const MESSAGES: Record<PlaceOrderRejection, string> = {
  price_changed: '상품 가격이 바뀌었습니다. 바뀐 금액을 확인하고 다시 결제해 주세요.',
  out_of_stock: '재고가 부족한 상품이 있습니다. 장바구니에서 수량을 확인해 주세요.',
  product_unavailable: '판매가 중지된 상품이 있습니다. 장바구니를 확인해 주세요.',
  cart_changed: '장바구니가 바뀌었습니다. 장바구니에서 다시 주문해 주세요.',
  address_missing: '배송지를 찾지 못했습니다. 배송지를 다시 확인해 주세요.',
  address_incomplete: '상세 주소를 입력해 주세요.',
  zero_total: '결제 금액이 0원인 주문은 아직 지원하지 않습니다.',
  access_denied: '로그인 정보가 바뀌었습니다. 다시 로그인해 주세요.',
  failed: '주문하지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

const BLOCK_MESSAGES: Record<OrderBlock, string> = {
  too_many_lines: `한 번에 ${MAX_ORDER_LINES}개 상품까지 주문할 수 있습니다.`,
  zero_total: MESSAGES.zero_total,
};

export function getOrderBlockMessage(block: OrderBlock): string {
  return BLOCK_MESSAGES[block];
}

export function getPlaceOrderMessage(
  result: Extract<PlaceOrderResult, { status: 'rejected' }>,
): string {
  if (result.reason === 'price_changed' && result.totalAmount !== undefined) {
    return `상품 가격이 바뀌어 결제 금액이 ${formatKoreanMoney(result.totalAmount)}이 되었습니다. 확인하고 다시 결제해 주세요.`;
  }

  return MESSAGES[result.reason];
}
