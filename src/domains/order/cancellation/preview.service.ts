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
import type { OrderCancellationPreviewViewModel } from './view-model';

interface OrderCancellationPreviewServiceDependencies {
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
  productRepository: OrderProductRepository;
}

export interface OrderCancellationPreviewService {
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
  async function getOrderCancellationPreviewViewModel(
    userId: string,
    orderId: string,
    orderItemId: string,
  ): Promise<OrderCancellationPreviewViewModel | null> {
    const [order, item] = await Promise.all([
      orderRepository.findById(orderId),
      orderItemRepository.findById(orderItemId),
    ]);

    if (
      !order ||
      order.user_id !== userId ||
      !item ||
      item.order_id !== order.id ||
      !getOrderActionEligibility(order.status).canCancel
    ) {
      return null;
    }

    const [items, cancellations, products] = await Promise.all([
      orderItemRepository.findByOrderIds([order.id]),
      orderItemCancellationRepository.findByOrderIds([order.id]),
      productRepository.findByIds([item.product_id]),
    ]);
    const cancelledOrderItemIds = new Set(
      cancellations.map(cancellation => cancellation.order_item_id),
    );

    if (cancelledOrderItemIds.has(item.id)) return null;

    return toOrderCancellationPreviewViewModel({
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
    });
  }

  return { getOrderCancellationPreviewViewModel };
}
