import {
  requireRelation,
} from '@/shared/lib/data-integrity';
import { paginate } from '@/shared/lib/pagination';
import {
  getRecentProductPolicyDescription,
  groupRecentProductItemsByDate,
  selectRecentProductViews,
  type WishlistListQuery,
  WISHLIST_PAGE_SIZE,
} from './domain';
import { toActivityProductViewModel } from './mapper';
import type {
  ActivityProductRepository,
  RecentProductViewRepository,
  WishlistItemRepository,
} from './repository';
import type {
  ActivityProductViewModel,
  RecentProductPageViewModel,
  WishlistPageViewModel,
} from './view-model';

export interface ActivityServiceDependencies {
  recentProductViewRepository: RecentProductViewRepository;
  wishlistItemRepository: WishlistItemRepository;
  productRepository: ActivityProductRepository;
}

export interface ActivityService {
  getRecentProductItems(
    userId: string,
  ): Promise<ActivityProductViewModel[]>;
  getWishlistProductItems(
    userId: string,
  ): Promise<ActivityProductViewModel[]>;
  getRecentProductPageViewModel(
    userId: string,
  ): Promise<RecentProductPageViewModel>;
  getWishlistPageViewModel(
    userId: string,
    query: WishlistListQuery,
  ): Promise<WishlistPageViewModel>;
}

export function createActivityService({
  recentProductViewRepository,
  wishlistItemRepository,
  productRepository,
}: ActivityServiceDependencies): ActivityService {
  async function joinProducts<
    T extends { id: string; product_id: number },
  >(
    rows: readonly T[],
    getRecordedAt: (row: T) => string,
  ): Promise<ActivityProductViewModel[]> {
    const products = await productRepository.findByIds(
      Array.from(new Set(rows.map(row => row.product_id))),
    );
    const productById = new Map(
      products.map(product => [product.id, product]),
    );

    return rows.map(row =>
      toActivityProductViewModel(
        { id: row.id, recordedAt: getRecordedAt(row) },
        requireRelation(
          productById.get(row.product_id),
          'activity.product_id -> products.id',
          row.id,
        ),
      ),
    );
  }

  async function getRecentProductItems(
    userId: string,
  ): Promise<ActivityProductViewModel[]> {
    const rows = await recentProductViewRepository.findByUserId(userId);
    return joinProducts(selectRecentProductViews(rows), row => row.viewed_at);
  }

  async function getWishlistProductItems(
    userId: string,
  ): Promise<ActivityProductViewModel[]> {
    const rows = await wishlistItemRepository.findByUserId(userId);
    return joinProducts(rows, row => row.created_at);
  }

  async function getRecentProductPageViewModel(
    userId: string,
  ): Promise<RecentProductPageViewModel> {
    const items = await getRecentProductItems(userId);

    return {
      groups: groupRecentProductItemsByDate(items),
      policyDescription: getRecentProductPolicyDescription(),
    };
  }

  async function getWishlistPageViewModel(
    userId: string,
    query: WishlistListQuery,
  ): Promise<WishlistPageViewModel> {
    return paginate(
      await getWishlistProductItems(userId),
      query.page,
      WISHLIST_PAGE_SIZE,
    );
  }

  return {
    getRecentProductItems,
    getRecentProductPageViewModel,
    getWishlistProductItems,
    getWishlistPageViewModel,
  };
}
