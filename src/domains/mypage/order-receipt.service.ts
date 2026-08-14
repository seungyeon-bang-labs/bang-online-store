import {
  calculateUsedPointAmount,
  pointTransactionRepository,
} from '@/domains/benefit';
import {
  getOrderDetailViewModel,
  orderPaymentTransactionRepository,
} from '@/domains/order';
import type {
  MypageOrderReceiptDocumentListViewModel,
  MypageOrderReceiptViewModel,
} from './order-receipt.view-model';
import {
  getAvailableMypageOrderReceiptDocumentTypes,
  type MypageOrderReceiptDocumentType,
} from './order-receipt.domain';
import {
  toMypageOrderReceiptDocumentListViewModel,
  toMypageOrderReceiptViewModel,
} from './order-receipt.mapper';

export async function getMypageOrderReceiptDocumentListViewModel(
  orderId: string,
): Promise<MypageOrderReceiptDocumentListViewModel | null> {
  const order = await getOrderDetailViewModel(orderId);
  return order ? toMypageOrderReceiptDocumentListViewModel(order) : null;
}

export async function getMypageOrderReceiptViewModel(
  orderId: string,
  type: MypageOrderReceiptDocumentType,
): Promise<MypageOrderReceiptViewModel | null> {
  const order = await getOrderDetailViewModel(orderId);
  if (!order) return null;

  const isAvailable = getAvailableMypageOrderReceiptDocumentTypes({
    paymentMethod: order.payment.paymentMethod,
    hasRefund: order.refund.items.length > 0,
  }).includes(type);
  if (!isAvailable) return null;

  const paymentTransactions =
    await orderPaymentTransactionRepository.findByOrderIds([order.id]);
  const pointUsageAmount =
    type === 'purchase'
      ? calculateUsedPointAmount(
          await pointTransactionRepository.findByOrderIds([order.id]),
        )
      : 0;

  return toMypageOrderReceiptViewModel(
    order,
    paymentTransactions,
    pointUsageAmount,
    type,
  );
}
