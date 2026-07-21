import type { Product } from '@/domains/product/product.dto';
import type {
  RecentProductViewDTO,
  ReviewDTO,
  WishlistItemDTO,
} from './activity.dto';

export interface RecentProductViewRepository {
  findByUserId(userId: string): Promise<RecentProductViewDTO[]>;
}

export interface WishlistItemRepository {
  findByUserId(userId: string): Promise<WishlistItemDTO[]>;
}

export interface ReviewRepository {
  findByUserId(userId: string): Promise<ReviewDTO[]>;
}

export interface ActivityProductRepository {
  findByIds(ids: number[]): Promise<Product[]>;
}
