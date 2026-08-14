import {
  orderClaimRepository,
  orderItemCancellationRepository,
  orderItemRepository,
  orderRepository,
} from '@/domains/order';
import { productRepository } from '@/domains/product';
import {
  fixtureRecentProductViewRepository,
  fixtureReviewRepository,
  fixtureWishlistItemRepository,
} from './fixture-repository';
import { createReviewListService } from './review-list.service';
import { createReviewFormService } from './review-form.service';
import { createActivityService } from './service';

export * from './domain';
export * from './dto';
export * from './mapper';
export * from './repository';
export * from './review-list.service';
export * from './review-form.service';
export * from './service';
export * from './view-model';

export const recentProductViewRepository =
  fixtureRecentProductViewRepository;
export const wishlistItemRepository = fixtureWishlistItemRepository;
export const reviewRepository = fixtureReviewRepository;

const activityService = createActivityService({
  recentProductViewRepository,
  wishlistItemRepository,
  productRepository,
});

const reviewServiceDependencies = {
  reviewRepository,
  productRepository,
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  orderItemCancellationRepository,
};

const reviewListService = createReviewListService(reviewServiceDependencies);
const reviewFormService = createReviewFormService(reviewServiceDependencies);

export const getRecentProductItems =
  activityService.getRecentProductItems;
export const getRecentProductPageViewModel =
  activityService.getRecentProductPageViewModel;
export const getWishlistProductItems =
  activityService.getWishlistProductItems;
export const getWishlistPageViewModel =
  activityService.getWishlistPageViewModel;
export const getReviewPageViewModel =
  reviewListService.getReviewPageViewModel;
export const getReviewWriteFormViewModel =
  reviewFormService.getReviewWriteFormViewModel;
export const getReviewEditFormViewModel =
  reviewFormService.getReviewEditFormViewModel;
