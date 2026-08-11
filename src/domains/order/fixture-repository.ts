import {
  ORDER_CLAIMS,
  ORDER_ITEMS,
  ORDER_ITEM_CANCELLATIONS,
  ORDER_STATUS_HISTORIES,
  ORDERS,
} from './fixture';
import type {
  OrderClaimRepository,
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderRepository,
  OrderStatusHistoryRepository,
} from './repository';

export const fixtureOrderRepository: OrderRepository = {
  async findById(orderId) {
    const order = ORDERS.find(item => item.id === orderId);
    return order ? { ...order } : null;
  },
  async findByUserId(userId) {
    return ORDERS.filter(order => order.user_id === userId).map(order => ({
      ...order,
    }));
  },
};

export const fixtureOrderStatusHistoryRepository: OrderStatusHistoryRepository =
  {
    async findByOrderIds(orderIds) {
      return ORDER_STATUS_HISTORIES.filter(history =>
        orderIds.includes(history.order_id),
      ).map(history => ({ ...history }));
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
