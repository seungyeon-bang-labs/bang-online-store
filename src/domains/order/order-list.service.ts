import {
  DataIntegrityError,
  requireRelation,
} from '@/shared/lib/data-integrity';
import { paginate } from '@/shared/lib/pagination';
import type { Product } from '@/domains/product/product.dto';
import { filterOrders } from './domain';
import type { OrderListQuery } from './domain';
import type {
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
} from './dto';
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
    const orders = filterOrders(
      await orderRepository.findByUserId(userId),
      query,
      now,
    );
    const orderIds = orders.map(order => order.id);
    const [relations, cancellations] = await Promise.all([
      orderItemRelationsService.getOrderItemRelations(orderIds),
      orderItemCancellationRepository.findByOrderIds(orderIds),
    ]);
    const cancellationByOrderItemId = new Map(
      cancellations.map(cancellation => [
        cancellation.order_item_id,
        cancellation,
      ]),
    );
    const items = orders.map(order =>
      toOrderListItemViewModel(
        order,
        getOrderListItemRelations(
          order,
          relations.itemsByOrderId,
          relations.productById,
          cancellationByOrderItemId,
        ),
      ),
    );

    return paginate(items, query.page, 10);
  }

  return { getOrderListViewModel };
}

function getOrderListItemRelations(
  order: OrderDTO,
  itemsByOrderId: ReadonlyMap<string, OrderItemDTO[]>,
  productById: ReadonlyMap<number, Product>,
  cancellationByOrderItemId: ReadonlyMap<string, OrderItemCancellationDTO>,
) {
  return (itemsByOrderId.get(order.id) ?? []).map(item => {
    const cancellation = cancellationByOrderItemId.get(item.id) ?? null;

    if (cancellation && cancellation.order_id !== order.id) {
      throw new DataIntegrityError(
        'order_item_cancellations order and order_item mismatch',
        cancellation.id,
      );
    }

    return {
      item,
      product: requireRelation(
        productById.get(item.product_id),
        'order_items.product_id -> products.id',
        item.id,
      ),
      cancellation,
    };
  });
}
