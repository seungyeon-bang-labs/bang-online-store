import type { Product } from '@/domains/product/product.dto';
import type {
  OrderClaimDTO,
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
} from './dto';

export interface OrderRepository {
  findByUserId(userId: string): Promise<OrderDTO[]>;
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

export interface OrderProductRepository {
  findByIds(ids: number[]): Promise<Product[]>;
}
