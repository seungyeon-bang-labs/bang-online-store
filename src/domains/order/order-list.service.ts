import { paginate } from '@/shared/lib/pagination';
import {
  filterOrders,
  indexOrderItemCancellations,
  joinOrderItems,
} from './domain';
import type { OrderListQuery } from './domain';
import { toOrderListItemViewModel } from './mapper';
import type { OrderItemRelationsService } from './order-item-relations.service';
import type {
  OrderItemCancellationRepository,
  OrderRepository,
} from './repository';
import type { OrderListPageViewModel } from './view-model';

interface OrderListServiceDependencies {
  orderRepository: OrderRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
  orderItemRelationsService: OrderItemRelationsService;
}

export interface OrderListService {
  getOrderListViewModel(
    userId: string,
    query: OrderListQuery,
    now?: Date,
  ): Promise<OrderListPageViewModel>;
}

export function createOrderListService({
  orderRepository,
  orderItemCancellationRepository,
  orderItemRelationsService,
}: OrderListServiceDependencies): OrderListService {
  async function getOrderListViewModel(
    userId: string,
    query: OrderListQuery,
    now = new Date(),
  ): Promise<OrderListPageViewModel> {
    const sourceOrders = await orderRepository.findByUserId(userId);
    const orders = filterOrders(sourceOrders, query, now);
    const orderIds = orders.map(order => order.id);
    const [relations, cancellations] = await Promise.all([
      orderItemRelationsService.getOrderItemRelations(orderIds),
      orderItemCancellationRepository.findByOrderIds(orderIds),
    ]);
    const cancellationByOrderItemId = indexOrderItemCancellations(cancellations);
    const items = orders.map(order =>
      toOrderListItemViewModel(
        order,
        joinOrderItems(
          order.id,
          relations.itemsByOrderId,
          relations.productById,
          cancellationByOrderItemId,
        ),
      ),
    );

    return {
      ...paginate(items, query.page, 10),
      unfilteredItemCount: sourceOrders.length,
    };
  }

  return { getOrderListViewModel };
}
