import type { Product } from '@/domains/product/product.dto';
import type {
  OrderClaimDTO,
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderPaymentTransactionDTO,
  OrderStatusHistoryDTO,
} from './dto';

export interface OrderRepository {
  findById(orderId: string): Promise<OrderDTO | null>;
  findByUserId(userId: string): Promise<OrderDTO[]>;
}

export interface OrderMutationRepository {
  replaceOrder(order: OrderDTO): Promise<void>;
  createOrder(order: OrderDTO): Promise<void>;
  createOrderItems(items: OrderItemDTO[]): Promise<void>;
  createOrderItemCancellations(
    cancellations: OrderItemCancellationDTO[],
  ): Promise<void>;
  createOrderStatusHistories(histories: OrderStatusHistoryDTO[]): Promise<void>;
  createPaymentTransactions(
    transactions: OrderPaymentTransactionDTO[],
  ): Promise<void>;
}

export interface OrderItemRepository {
  findByOrderIds(orderIds: string[]): Promise<OrderItemDTO[]>;
}

export interface OrderItemCancellationRepository {
  findByOrderIds(orderIds: string[]): Promise<OrderItemCancellationDTO[]>;
}

export interface OrderClaimRepository {
  findByUserId(userId: string): Promise<OrderClaimDTO[]>;
}

export interface OrderStatusHistoryRepository {
  findByOrderIds(orderIds: string[]): Promise<OrderStatusHistoryDTO[]>;
}

export interface OrderPaymentTransactionRepository {
  findByOrderIds(orderIds: string[]): Promise<OrderPaymentTransactionDTO[]>;
}

export interface OrderProductRepository {
  findByIds(ids: number[]): Promise<Product[]>;
}
