import { orderItemRepository, orderRepository } from '@/domains/order';
import { productRepository } from '@/domains/product';
import {
  fixtureRecentProductViewRepository,
  fixtureReviewRepository,
  fixtureWishlistItemRepository,
} from './fixture-repository';
import { createActivityService } from './service';

export * from './domain';
export * from './dto';
export * from './mapper';
export * from './repository';
export * from './service';
export * from './view-model';

export const recentProductViewRepository =
  fixtureRecentProductViewRepository;
export const wishlistItemRepository = fixtureWishlistItemRepository;
export const reviewRepository = fixtureReviewRepository;

const activityService = createActivityService({
  recentProductViewRepository,
  wishlistItemRepository,
  reviewRepository,
  productRepository,
  orderRepository,
  orderItemRepository,
});

export const getRecentProductItems =
  activityService.getRecentProductItems;
export const getWishlistProductItems =
  activityService.getWishlistProductItems;
export const getReviewPageViewModel =
  activityService.getReviewPageViewModel;
