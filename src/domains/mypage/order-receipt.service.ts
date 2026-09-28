import {
  calculateUsedPointAmount,
  pointTransactionRepository,
} from '@/domains/benefit';
import {
  getOrderDetailViewModel,
  orderPaymentReceiptDetailsRepository,
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
  userId: string,
  orderId: string,
): Promise<MypageOrderReceiptDocumentListViewModel | null> {
  const order = await getOrderDetailViewModel(userId, orderId);
  return order ? toMypageOrderReceiptDocumentListViewModel(order) : null;
}

export async function getMypageOrderReceiptViewModel(
  userId: string,
  orderId: string,
  type: MypageOrderReceiptDocumentType,
): Promise<MypageOrderReceiptViewModel | null> {
  const order = await getOrderDetailViewModel(userId, orderId);
  if (!order) return null;

  const isAvailable = getAvailableMypageOrderReceiptDocumentTypes({
    hasCompletedPayment: Boolean(order.paidAt),
    paymentMethod: order.payment.paymentMethod,
    hasRefund: order.refund.items.length > 0,
  }).includes(type);
  if (!isAvailable) return null;

  const [paymentTransactions, pointUsageAmount, paymentReceiptDetails] =
    await Promise.all([
      orderPaymentTransactionRepository.findByOrderIds([order.id]),
      type === 'purchase'
        ? pointTransactionRepository
            .findByOrderIds([order.id])
            .then(calculateUsedPointAmount)
        : Promise.resolve(0),
      type === 'card' || type === 'cash'
        ? orderPaymentReceiptDetailsRepository.findByOrderId(order.id)
        : Promise.resolve(null),
    ]);

  return toMypageOrderReceiptViewModel(
    order,
    paymentTransactions,
    pointUsageAmount,
    paymentReceiptDetails,
    type,
  );
}
