import type { CartNotice } from '@/domains/cart/cart.contract';
import type { CartChange } from './guest-cart';

export type CartActionKind = CartChange['kind'];

export function noticeMessage(notice: CartNotice): string {
  switch (notice.kind) {
    case 'quantity_adjusted': return '현재 재고에 맞게 수량을 조정했습니다.';
    case 'sold_out': return '품절된 옵션은 새로 담거나 수량을 변경할 수 없습니다.';
    case 'unavailable': return '현재 이용할 수 없는 상품을 장바구니에서 제외했습니다.';
    case 'item_missing': return '이미 변경되거나 삭제된 장바구니 항목입니다.';
    case 'option_rejected': return '선택한 옵션으로 변경할 수 없습니다.';
  }
}

export const failureMessage: Record<CartActionKind, string> = {
  add_items: '장바구니에 담지 못했습니다.',
  adjust_quantity: '수량 변경을 저장하지 못했습니다.',
  change_option: '옵션 변경을 저장하지 못했습니다.',
  remove_items: '삭제를 저장하지 못했습니다.',
};

export const messages = {
  loadFailed: '장바구니를 불러오지 못했습니다.',
  guestLoadFailed: '장바구니 정보를 불러오지 못했습니다.',
  guestWriteFailed: '장바구니를 저장하지 못했습니다.',
  restricted: '이메일 인증과 회원 상태를 확인해주세요.',
  mergeRejected: '판매하지 않는 상품이라 옮기지 못했습니다.',
  mergeFailed: '로그인 전에 담은 상품을 옮기지 못했습니다.',
  itemMissing: noticeMessage({ kind: 'item_missing' }),
};
