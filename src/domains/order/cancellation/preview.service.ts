import { requireRelation } from '@/shared/lib/data-integrity';
import { getOrderActionEligibility } from '../domain';
import type {
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderProductRepository,
  OrderRepository,
} from '../repository';
import { getOrderCancellationExpectedRefundAmount } from './domain';
import { toOrderCancellationPreviewViewModel } from './mapper';
import type {
  OrderCancellationPreviewViewModel,
  OrderCancellationRequestViewModel,
} from './view-model';

interface OrderCancellationPreviewServiceDependencies {
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
  productRepository: OrderProductRepository;
}

export interface OrderCancellationPreviewService {
  getOrderCancellationRequestViewModel(
    userId: string,
    orderId: string,
    orderItemId: string,
  ): Promise<OrderCancellationRequestViewModel | null>;
  getOrderCancellationPreviewViewModel(
    userId: string,
    orderId: string,
    orderItemId: string,
  ): Promise<OrderCancellationPreviewViewModel | null>;
}

export function createOrderCancellationPreviewService({
  orderRepository,
  orderItemRepository,
  orderItemCancellationRepository,
  productRepository,
}: OrderCancellationPreviewServiceDependencies): OrderCancellationPreviewService {
  async function getOrderCancellationRequestViewModel(
    userId: string,
    orderId: string,
    orderItemId: string,
  ): Promise<OrderCancellationRequestViewModel | null> {
    const [order, item] = await Promise.all([
      orderRepository.findById(orderId),
      orderItemRepository.findById(orderItemId),
    ]);

    if (!order || order.user_id !== userId || !item || item.order_id !== order.id) {
      return null;
    }

    const cancellations = await orderItemCancellationRepository.findByOrderIds([
      order.id,
    ]);
    const cancelledOrderItemIds = new Set(
      cancellations.map(cancellation => cancellation.order_item_id),
    );

    if (cancelledOrderItemIds.has(item.id)) {
      return {
        isEligible: false,
        orderId: order.id,
        unavailableReason: 'already_cancelled',
      };
    }

    if (!getOrderActionEligibility(order.status).canCancel) {
      return {
        isEligible: false,
        orderId: order.id,
        unavailableReason: 'status_changed',
      };
    }

    const [items, products] = await Promise.all([
      orderItemRepository.findByOrderIds([order.id]),
      productRepository.findByIds([item.product_id]),
    ]);

    return {
      isEligible: true,
      preview: toOrderCancellationPreviewViewModel({
        order,
        item,
        product: requireRelation(
          products[0],
          'order_items.product_id -> products.id',
          item.id,
        ),
        expectedRefundAmount: getOrderCancellationExpectedRefundAmount({
          order,
          items,
          cancelledOrderItemIds,
          targetOrderItemId: item.id,
        }),
      }),
    };
  }

  async function getOrderCancellationPreviewViewModel(
    userId: string,
    orderId: string,
    orderItemId: string,
  ): Promise<OrderCancellationPreviewViewModel | null> {
    const requestViewModel = await getOrderCancellationRequestViewModel(
      userId,
      orderId,
      orderItemId,
    );

    return requestViewModel?.isEligible
      ? requestViewModel.preview
      : null;
  }

  return {
    getOrderCancellationRequestViewModel,
    getOrderCancellationPreviewViewModel,
  };
}
