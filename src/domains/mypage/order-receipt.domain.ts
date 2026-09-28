import type { OrderPaymentMethod } from '@/domains/order';

export const MYPAGE_ORDER_RECEIPT_DOCUMENT_TYPES = [
  'purchase',
  'card',
  'cash',
  'refund',
] as const;

export type MypageOrderReceiptDocumentType =
  (typeof MYPAGE_ORDER_RECEIPT_DOCUMENT_TYPES)[number];

interface ReceiptDocumentAvailabilityInput {
  hasCompletedPayment: boolean;
  paymentMethod: OrderPaymentMethod;
  hasRefund: boolean;
}

export function isMypageOrderReceiptDocumentType(
  value: string,
): value is MypageOrderReceiptDocumentType {
  return MYPAGE_ORDER_RECEIPT_DOCUMENT_TYPES.includes(
    value as MypageOrderReceiptDocumentType,
  );
}

export function getAvailableMypageOrderReceiptDocumentTypes({
  hasCompletedPayment,
  paymentMethod,
  hasRefund,
}: ReceiptDocumentAvailabilityInput): MypageOrderReceiptDocumentType[] {
  if (!hasCompletedPayment) return [];

  const types: MypageOrderReceiptDocumentType[] = ['purchase'];

  switch (paymentMethod) {
    case '신용카드':
      types.push('card');
      break;
    case '무통장 입금':
      types.push('cash');
      break;
  }
  if (hasRefund) types.push('refund');

  return types;
}
