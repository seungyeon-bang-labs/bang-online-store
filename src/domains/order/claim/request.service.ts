import { getOrderClaimRequestUnavailableReason } from './domain';
import { toOrderClaimRequestViewModel } from './mapper';
import type {
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderProductRepository,
  OrderRepository,
} from '../repository';
import type { OrderClaimRepository } from './repository';
import type { OrderClaimRequestViewModel } from './view-model';

interface ClaimRequestServiceDependencies {
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderClaimRepository: OrderClaimRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
  productRepository: OrderProductRepository;
}

export interface ClaimRequestService {
  getOrderClaimRequestViewModel(
    userId: string,
    orderId: string,
    orderItemId: string,
  ): Promise<OrderClaimRequestViewModel | null>;
}

export function createClaimRequestService({
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  orderItemCancellationRepository,
  productRepository,
}: ClaimRequestServiceDependencies): ClaimRequestService {
  async function getOrderClaimRequestViewModel(
    userId: string,
    orderId: string,
    orderItemId: string,
  ): Promise<OrderClaimRequestViewModel | null> {
    const [order, item] = await Promise.all([
      orderRepository.findById(orderId),
      orderItemRepository.findById(orderItemId),
    ]);

    if (!order || order.user_id !== userId || !item || item.order_id !== orderId) {
      return null;
    }

    const [claims, cancellations, products] = await Promise.all([
      orderClaimRepository.findByOrderItemIds([item.id]),
      orderItemCancellationRepository.findByOrderItemIds([item.id]),
      productRepository.findByIds([item.product_id]),
    ]);
    const [product] = products;

    if (!product) return null;

    const groupProducts = await productRepository.findByGroupId(
      product.group_id,
    );

    return toOrderClaimRequestViewModel({
      order,
      item,
      product,
      groupProducts,
      unavailableReason: getOrderClaimRequestUnavailableReason({
        orderStatus: order.status,
        deliveredAt: order.delivered_at,
        isCancelled: cancellations.length > 0,
        hasExistingClaim: claims.some(claim => claim.status !== 'rejected'),
      }),
    });
  }

  return { getOrderClaimRequestViewModel };
}
