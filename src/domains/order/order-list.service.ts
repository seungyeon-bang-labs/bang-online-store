import { paginate } from '@/shared/lib/pagination';
import {
  filterOrders,
  filterOrdersByCancellation,
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
    const periodAndStatusFilteredOrders = filterOrders(sourceOrders, query, now);
    const candidateOrderIds = periodAndStatusFilteredOrders.map(
      order => order.id,
    );
    const cancellations =
      await orderItemCancellationRepository.findByOrderIds(candidateOrderIds);
    const orders = filterOrdersByCancellation(
      periodAndStatusFilteredOrders,
      cancellations,
      query.includePartialCancellation,
    );
    const relations = await orderItemRelationsService.getOrderItemRelations(
      orders.map(order => order.id),
    );
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
