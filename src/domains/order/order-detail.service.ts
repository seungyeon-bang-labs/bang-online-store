import { indexOrderItemCancellations, joinOrderItems } from './domain';
import { toOrderDetailViewModel } from './mapper';
import type { OrderItemRelationsService } from './order-item-relations.service';
import type {
  OrderItemCancellationRepository,
  OrderRepository,
  OrderStatusHistoryRepository,
} from './repository';
import type { OrderDetailViewModel } from './view-model';

interface OrderDetailServiceDependencies {
  orderRepository: OrderRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
  orderStatusHistoryRepository: OrderStatusHistoryRepository;
  orderItemRelationsService: OrderItemRelationsService;
}

export interface OrderDetailService {
  getOrderDetailViewModel(
    userId: string,
    orderId: string,
  ): Promise<OrderDetailViewModel | null>;
}

export function createOrderDetailService({
  orderRepository,
  orderItemCancellationRepository,
  orderStatusHistoryRepository,
  orderItemRelationsService,
}: OrderDetailServiceDependencies): OrderDetailService {
  async function getOrderDetailViewModel(
    userId: string,
    orderId: string,
  ): Promise<OrderDetailViewModel | null> {
    const order = await orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) return null;

    const [relations, cancellations, histories] = await Promise.all([
      orderItemRelationsService.getOrderItemRelations([order.id]),
      orderItemCancellationRepository.findByOrderIds([order.id]),
      orderStatusHistoryRepository.findByOrderIds([order.id]),
    ]);
    const joinedItems = joinOrderItems(
      order.id,
      relations.itemsByOrderId,
      relations.productById,
      indexOrderItemCancellations(cancellations),
    );

    return toOrderDetailViewModel(order, joinedItems, histories);
  }

  return { getOrderDetailViewModel };
}
