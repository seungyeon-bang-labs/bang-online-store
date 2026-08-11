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
  async findByUserId(userId) {
    return REVIEWS.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async findByOrderItemIds(orderItemIds) {
    const orderItemIdSet = new Set(orderItemIds);

    return REVIEWS.filter(row => orderItemIdSet.has(row.order_item_id)).map(
      row => ({ ...row }),
    );
  },
};
