import {
  ORDER_CLAIMS,
  ORDER_ITEMS,
  ORDER_ITEM_CANCELLATIONS,
  ORDER_STATUS_HISTORIES,
  ORDERS,
} from './fixture';
import type {
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderPaymentTransactionDTO,
  OrderStatusHistoryDTO,
} from './dto';
import type {
  OrderMutationRepository,
  OrderPaymentTransactionRepository,
  OrderClaimRepository,
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderRepository,
  OrderStatusHistoryRepository,
} from './repository';

let demoOrders = ORDERS.map(order => ({ ...order }));
let demoOrderItems = ORDER_ITEMS.map(item => ({ ...item }));
let demoOrderItemCancellations = ORDER_ITEM_CANCELLATIONS.map(cancellation => ({
  ...cancellation,
}));
let demoOrderStatusHistories = ORDER_STATUS_HISTORIES.map(history => ({
  ...history,
}));
let demoPaymentTransactions: OrderPaymentTransactionDTO[] = [
  ...ORDERS.flatMap(order =>
    order.paid_at
      ? [
          {
            id: `payment-${order.id}`,
            order_id: order.id,
            type: 'payment' as const,
            amount: order.total_amount,
            payment_method: order.payment_method,
            occurred_at: order.paid_at,
            order_item_cancellation_id: null,
          },
        ]
      : [],
  ),
  ...ORDER_ITEM_CANCELLATIONS.map(cancellation => {
    const order = ORDERS.find(item => item.id === cancellation.order_id);
    return {
      id: `refund-${cancellation.id}`,
      order_id: cancellation.order_id,
      type: 'refund' as const,
      amount: cancellation.refund_amount,
      payment_method: order?.payment_method ?? '신용카드',
      occurred_at: cancellation.cancelled_at,
      order_item_cancellation_id: cancellation.id,
    };
  }),
];

const cloneOrder = (order: OrderDTO): OrderDTO => ({ ...order });
const cloneOrderItem = (item: OrderItemDTO): OrderItemDTO => ({ ...item });
const cloneCancellation = (
  cancellation: OrderItemCancellationDTO,
): OrderItemCancellationDTO => ({
  ...cancellation,
  allocation: cancellation.allocation ? { ...cancellation.allocation } : undefined,
});
const cloneHistory = (history: OrderStatusHistoryDTO): OrderStatusHistoryDTO => ({
  ...history,
});
const cloneTransaction = (
  transaction: OrderPaymentTransactionDTO,
): OrderPaymentTransactionDTO => ({ ...transaction });

export const fixtureOrderRepository: OrderRepository = {
  async findById(orderId) {
    const order = demoOrders.find(item => item.id === orderId);
    return order ? cloneOrder(order) : null;
  },
  async findByUserId(userId) {
    return demoOrders
      .filter(order => order.user_id === userId)
      .map(cloneOrder);
  },
};

export const fixtureOrderStatusHistoryRepository: OrderStatusHistoryRepository =
  {
    async findByOrderIds(orderIds) {
      return demoOrderStatusHistories.filter(history =>
        orderIds.includes(history.order_id),
      ).map(cloneHistory);
    },
  };

export const fixtureOrderItemRepository: OrderItemRepository = {
  async findByOrderIds(orderIds) {
    return demoOrderItems
      .filter(item => orderIds.includes(item.order_id))
      .map(cloneOrderItem);
  },
};

export const fixtureOrderItemCancellationRepository: OrderItemCancellationRepository =
  {
    async findByOrderIds(orderIds) {
      return demoOrderItemCancellations.filter(cancellation =>
        orderIds.includes(cancellation.order_id),
      ).map(cloneCancellation);
    },
  };

export const fixtureOrderPaymentTransactionRepository: OrderPaymentTransactionRepository =
  {
    async findByOrderIds(orderIds) {
      return demoPaymentTransactions
        .filter(transaction => orderIds.includes(transaction.order_id))
        .map(cloneTransaction);
    },
  };

export const fixtureOrderMutationRepository: OrderMutationRepository = {
  async replaceOrder(order) {
    demoOrders = demoOrders.map(current =>
      current.id === order.id ? cloneOrder(order) : current,
    );
  },
  async createOrder(order) {
    demoOrders = [...demoOrders, cloneOrder(order)];
  },
  async createOrderItems(items) {
    demoOrderItems = [...demoOrderItems, ...items.map(cloneOrderItem)];
  },
  async createOrderItemCancellations(cancellations) {
    demoOrderItemCancellations = [
      ...demoOrderItemCancellations,
      ...cancellations.map(cloneCancellation),
    ];
  },
  async createOrderStatusHistories(histories) {
    demoOrderStatusHistories = [
      ...demoOrderStatusHistories,
      ...histories.map(cloneHistory),
    ];
  },
  async createPaymentTransactions(transactions) {
    demoPaymentTransactions = [
      ...demoPaymentTransactions,
      ...transactions.map(cloneTransaction),
    ];
  },
};

export const fixtureOrderClaimRepository: OrderClaimRepository = {
  async findByUserId(userId) {
    return ORDER_CLAIMS.filter(claim => claim.user_id === userId).map(
      claim => ({ ...claim }),
    );
  },
};
