import {
  DataIntegrityError,
  requireRelation,
} from '@/shared/lib/data-integrity';
import { paginate } from '@/shared/lib/pagination';
import type {
  OrderItemRepository,
  OrderRepository,
} from '@/domains/order/repository';
import type { ReviewListQuery } from './domain';
import {
  toActivityProductViewModel,
  toAvailableReviewViewModel,
  toWrittenReviewViewModel,
} from './mapper';
import type {
  ActivityProductRepository,
  RecentProductViewRepository,
  ReviewRepository,
  WishlistItemRepository,
} from './repository';
import type {
  ActivityProductViewModel,
  ReviewItemViewModel,
  ReviewPageViewModel,
} from './view-model';

export interface ActivityServiceDependencies {
  recentProductViewRepository: RecentProductViewRepository;
  wishlistItemRepository: WishlistItemRepository;
  reviewRepository: ReviewRepository;
  productRepository: ActivityProductRepository;
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
}

export interface ActivityService {
  getRecentProductItems(
    userId: string,
  ): Promise<ActivityProductViewModel[]>;
  getWishlistProductItems(
    userId: string,
  ): Promise<ActivityProductViewModel[]>;
  getReviewPageViewModel(
    userId: string,
    query: ReviewListQuery,
  ): Promise<ReviewPageViewModel>;
}

export function createActivityService({
  recentProductViewRepository,
  wishlistItemRepository,
  reviewRepository,
  productRepository,
  orderRepository,
  orderItemRepository,
}: ActivityServiceDependencies): ActivityService {
  async function joinProducts<
    T extends { id: string; product_id: number },
  >(
    rows: readonly T[],
    toRecordedAt: (row: T) => string,
  ): Promise<ActivityProductViewModel[]> {
    const products = await productRepository.findByIds(
      Array.from(new Set(rows.map(row => row.product_id))),
    );
    const productById = new Map(
      products.map(product => [product.id, product]),
    );

    return rows.map(row =>
      toActivityProductViewModel(
        { id: row.id, recordedAt: toRecordedAt(row) },
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
    return joinProducts(rows, row => row.viewed_at);
  }

  async function getWishlistProductItems(
    userId: string,
  ): Promise<ActivityProductViewModel[]> {
    const rows = await wishlistItemRepository.findByUserId(userId);
    return joinProducts(rows, row => row.created_at);
  }

  async function getReviewPageViewModel(
    userId: string,
    query: ReviewListQuery,
  ): Promise<ReviewPageViewModel> {
    const [orders, reviews] = await Promise.all([
      orderRepository.findByUserId(userId),
      reviewRepository.findByUserId(userId),
    ]);
    const deliveredOrders = orders.filter(
      order => order.status === 'delivered',
    );
    const orderItems = await orderItemRepository.findByOrderIds(
      deliveredOrders.map(order => order.id),
    );
    const products = await productRepository.findByIds(
      Array.from(
        new Set([
          ...reviews.map(review => review.product_id),
          ...orderItems.map(item => item.product_id),
        ]),
      ),
    );
    const productById = new Map(
      products.map(product => [product.id, product]),
    );
    const orderById = new Map(
      deliveredOrders.map(order => [order.id, order]),
    );
    const itemById = new Map(orderItems.map(item => [item.id, item]));
    const reviewedItemIds = new Set(
      reviews.map(review => review.order_item_id),
    );

    const items: ReviewItemViewModel[] =
      query.tab === 'completed'
        ? reviews.map(review => {
            const reviewItem = requireRelation(
              itemById.get(review.order_item_id),
              'reviews.order_item_id -> order_items.id',
              review.id,
            );

            if (reviewItem.product_id !== review.product_id) {
              throw new DataIntegrityError(
                'reviews product and order_item mismatch',
                review.id,
              );
            }

            return toWrittenReviewViewModel(
              review,
              requireRelation(
                productById.get(review.product_id),
                'reviews.product_id -> products.id',
                review.id,
              ),
            );
          })
        : orderItems
            .filter(item => !reviewedItemIds.has(item.id))
            .map(item =>
              toAvailableReviewViewModel(
                item,
                requireRelation(
                  orderById.get(item.order_id),
                  'order_items.order_id -> orders.id',
                  item.id,
                ),
                requireRelation(
                  productById.get(item.product_id),
                  'order_items.product_id -> products.id',
                  item.id,
                ),
              ),
            );

    return paginate(items, query.page, 4);
  }

  return {
    getRecentProductItems,
    getWishlistProductItems,
    getReviewPageViewModel,
  };
}
