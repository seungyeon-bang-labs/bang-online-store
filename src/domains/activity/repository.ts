import type { ProductModel } from '@/domains/product';
import type {
  RecentProductViewDTO,
  ReviewDTO,
  WishlistItemDTO,
} from './dto';

export interface RecentProductViewRepository {
  findByUserId(userId: string): Promise<RecentProductViewDTO[]>;
}

export interface WishlistItemRepository {
  findByUserId(userId: string): Promise<WishlistItemDTO[]>;
}

export interface ReviewRepository {
  create(review: ReviewDTO): Promise<void>;
  findById(reviewId: string): Promise<ReviewDTO | null>;
  findByUserId(userId: string): Promise<ReviewDTO[]>;
  findByOrderItemIds(orderItemIds: string[]): Promise<ReviewDTO[]>;
}

export interface ActivityProductRepository {
  findByIds(ids: number[]): Promise<ProductModel[]>;
}
