import { getOrderActionEligibility } from '../domain';
import type {
  OrderItemCancellationDTO,
  OrderPaymentTransactionDTO,
} from '../dto';
import type {
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderMutationRepository,
  OrderRepository,
} from '../repository';
import {
  getOrderCancellationExpectedRefundAmount,
  type OrderCancellationReason,
} from './domain';

export interface OrderCancellationSubmitInput {
  reason: OrderCancellationReason;
  reasonDetail: string;
}

export interface OrderCancellationSubmitService {
  submitOrderCancellation(
    userId: string,
    orderId: string,
    orderItemId: string,
    input: OrderCancellationSubmitInput,
  ): Promise<boolean>;
}

export function createOrderCancellationSubmitService({
  orderRepository,
  orderItemRepository,
  orderItemCancellationRepository,
  orderMutationRepository,
}: {
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
  orderMutationRepository: OrderMutationRepository;
}): OrderCancellationSubmitService {
  async function submitOrderCancellation(
    userId: string,
    orderId: string,
    orderItemId: string,
    input: OrderCancellationSubmitInput,
  ): Promise<boolean> {
    const [order, item, items, cancellations] = await Promise.all([
      orderRepository.findById(orderId),
      orderItemRepository.findById(orderItemId),
      orderItemRepository.findByOrderIds([orderId]),
      orderItemCancellationRepository.findByOrderIds([orderId]),
    ]);
    if (
      !order ||
      order.user_id !== userId ||
      !item ||
      item.order_id !== order.id ||
      !getOrderActionEligibility(order.status).canCancel ||
      cancellations.some(cancellation => cancellation.order_item_id === item.id) ||
      (input.reason === '기타' && input.reasonDetail.trim().length < 10)
    ) {
      return false;
    }

    const cancelledOrderItemIds = new Set(
      cancellations.map(cancellation => cancellation.order_item_id),
    );
    const refundAmount = getOrderCancellationExpectedRefundAmount({
      order,
      items,
      cancelledOrderItemIds,
      targetOrderItemId: item.id,
    });
    const occurredAt = new Date().toISOString();
    const cancellation: OrderItemCancellationDTO = {
      id: crypto.randomUUID(),
      order_id: order.id,
      order_item_id: item.id,
      cancelled_at: occurredAt,
      reason: input.reason,
      reason_detail: input.reason === '기타' ? input.reasonDetail.trim() : null,
      refund_amount: refundAmount,
      refund_status: 'pending',
      refund_expected_at: occurredAt,
      refunded_at: null,
    };
    await orderMutationRepository.createOrderItemCancellations([cancellation]);

    if (items.every(current => cancelledOrderItemIds.has(current.id) || current.id === item.id)) {
      await orderMutationRepository.updateOrder({
        ...order,
        status: 'cancelled',
        cancelled_at: occurredAt,
      });
    }
    if (refundAmount > 0 && order.paid_at) {
      const transaction: OrderPaymentTransactionDTO = {
        id: crypto.randomUUID(),
        order_id: order.id,
        type: 'refund',
        amount: refundAmount,
        payment_method: order.payment_method,
        occurred_at: occurredAt,
        order_item_cancellation_id: cancellation.id,
      };
      await orderMutationRepository.createPaymentTransactions([transaction]);
    }
    return true;
  }

  return { submitOrderCancellation };
}
