import {
  RECENT_PRODUCT_VIEWS,
  REVIEWS,
  WISHLIST_ITEMS,
} from './fixture';
import type {
  RecentProductViewRepository,
  ReviewRepository,
  WishlistItemRepository,
} from './repository';

let demoReviews = REVIEWS.map(review => ({ ...review }));

export const fixtureRecentProductViewRepository: RecentProductViewRepository =
  {
    async findByUserId(userId) {
      return RECENT_PRODUCT_VIEWS.filter(row => row.user_id === userId).map(
        row => ({ ...row }),
      );
    },
  };

export const fixtureWishlistItemRepository: WishlistItemRepository = {
  async findByUserId(userId) {
    return WISHLIST_ITEMS.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
};

export const fixtureReviewRepository: ReviewRepository = {
  async create(review) {
    demoReviews = [{ ...review }, ...demoReviews];
  },
  async findById(reviewId) {
    const review = demoReviews.find(row => row.id === reviewId);

    return review ? { ...review } : null;
  },
  async findByUserId(userId) {
    return demoReviews.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async findByOrderItemIds(orderItemIds) {
    const orderItemIdSet = new Set(orderItemIds);

    return demoReviews.filter(row => orderItemIdSet.has(row.order_item_id)).map(
      row => ({ ...row }),
    );
  },
};
