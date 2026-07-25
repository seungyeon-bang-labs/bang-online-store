import { ORDER_CLAIMS, ORDER_ITEMS, ORDERS } from './fixture';
import type {
  OrderClaimRepository,
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

export const fixtureOrderClaimRepository: OrderClaimRepository = {
  async findByUserId(userId) {
    return ORDER_CLAIMS.filter(claim => claim.user_id === userId).map(
      claim => ({ ...claim }),
    );
  },
};
