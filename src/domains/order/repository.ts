import type { Product } from '@/domains/product/product.dto';
import type { OrderClaimDTO, OrderDTO, OrderItemDTO } from './dto';

export interface OrderRepository {
  findByUserId(userId: string): Promise<OrderDTO[]>;
}

export interface OrderItemRepository {
  findByOrderIds(orderIds: string[]): Promise<OrderItemDTO[]>;
}

export interface OrderClaimRepository {
  findByUserId(userId: string): Promise<OrderClaimDTO[]>;
}

export interface OrderProductRepository {
  findByIds(ids: number[]): Promise<Product[]>;
}
