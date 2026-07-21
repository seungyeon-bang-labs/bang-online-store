import { orderItemRepository, orderRepository } from '@/domains/order';
import { productRepository } from '@/domains/product';
import {
  fixtureRecentProductViewRepository,
  fixtureReviewRepository,
  fixtureWishlistItemRepository,
} from './activity.fixture-repository';
import { createActivityService } from './activity.service';

export * from './activity.domain';
export * from './activity.dto';
export * from './activity.mapper';
export * from './activity.repository';
export * from './activity.service';
export * from './activity.view-model';

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
