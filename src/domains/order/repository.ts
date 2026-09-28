import type { Product } from '@/domains/product/product.dto';
import type {
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderPaymentReceiptDetailsDTO,
  OrderPaymentTransactionDTO,
  OrderStatusHistoryDTO,
} from './dto';

export interface OrderRepository {
  findById(orderId: string): Promise<OrderDTO | null>;
  findByIdAndUserId(orderId: string, userId: string): Promise<OrderDTO | null>;
  findByUserId(userId: string): Promise<OrderDTO[]>;
}

export interface OrderMutationRepository {
  createOrderItemCancellations(
    cancellations: OrderItemCancellationDTO[],
  ): Promise<void>;
  createOrder(order: OrderDTO): Promise<void>;
  createOrderItems(items: OrderItemDTO[]): Promise<void>;
  createOrderStatusHistories(histories: OrderStatusHistoryDTO[]): Promise<void>;
  createPaymentTransactions(
    transactions: OrderPaymentTransactionDTO[],
  ): Promise<void>;
  updateOrder(order: OrderDTO): Promise<void>;
}

export interface OrderItemRepository {
  findById(orderItemId: string): Promise<OrderItemDTO | null>;
  findByIds(orderItemIds: string[]): Promise<OrderItemDTO[]>;
  findByOrderIds(orderIds: string[]): Promise<OrderItemDTO[]>;
}

export interface OrderItemCancellationRepository {
  findByOrderItemIds(
    orderItemIds: string[],
  ): Promise<OrderItemCancellationDTO[]>;
  findByOrderIds(orderIds: string[]): Promise<OrderItemCancellationDTO[]>;
}

export interface OrderStatusHistoryRepository {
  findByOrderIds(orderIds: string[]): Promise<OrderStatusHistoryDTO[]>;
}

export interface OrderPaymentTransactionRepository {
  findByOrderIds(orderIds: string[]): Promise<OrderPaymentTransactionDTO[]>;
}

export interface OrderPaymentReceiptDetailsRepository {
  findByOrderId(orderId: string): Promise<OrderPaymentReceiptDetailsDTO | null>;
}

export interface OrderProductRepository {
  findByIds(ids: number[]): Promise<Product[]>;
  findByGroupId(groupId: number): Promise<Product[]>;
}
