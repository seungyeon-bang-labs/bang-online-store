import {
  ORDER_CLAIMS,
  ORDER_ITEMS,
  ORDER_ITEM_CANCELLATIONS,
  ORDERS,
} from './fixture';
import type {
  OrderClaimRepository,
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderRepository,
} from './repository';

export const fixtureOrderRepository: OrderRepository = {
  async findByUserId(userId) {
    return ORDERS.filter(order => order.user_id === userId).map(order => ({
      ...order,
    }));
  },
};

export const fixtureOrderItemRepository: OrderItemRepository = {
  async findByOrderIds(orderIds) {
    return ORDER_ITEMS.filter(item => orderIds.includes(item.order_id)).map(
      item => ({ ...item }),
    );
  },
};

export const fixtureOrderItemCancellationRepository: OrderItemCancellationRepository =
  {
    async findByOrderIds(orderIds) {
      return ORDER_ITEM_CANCELLATIONS.filter(cancellation =>
        orderIds.includes(cancellation.order_id),
      ).map(cancellation => ({ ...cancellation }));
    },
  };

export const fixtureOrderClaimRepository: OrderClaimRepository = {
  async findByUserId(userId) {
    return ORDER_CLAIMS.filter(claim => claim.user_id === userId).map(
      claim => ({ ...claim }),
    );
  },
};
