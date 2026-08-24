import {
  DataIntegrityError,
  requireRelation,
} from '@/shared/lib/data-integrity';
import { paginate } from '@/shared/lib/pagination';
import type {
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderRepository,
} from '@/domains/order/repository';
import type { OrderClaimRepository } from '@/domains/order/claim/repository';
import {
  isReviewWritable,
  type ReviewListQuery,
  REVIEW_PAGE_SIZE,
} from './domain';
import {
  toAvailableReviewViewModel,
  toWrittenReviewViewModel,
} from './mapper';
import type {
  ActivityProductRepository,
  ReviewRepository,
} from './repository';
import type {
  ReviewItemViewModel,
  ReviewPageViewModel,
} from './view-model';

interface ReviewListServiceDependencies {
  reviewRepository: ReviewRepository;
  productRepository: ActivityProductRepository;
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderClaimRepository: OrderClaimRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
}

export interface ReviewListService {
  getReviewPageViewModel(
    userId: string,
    query: ReviewListQuery,
  ): Promise<ReviewPageViewModel>;
}

export function createReviewListService({
  reviewRepository,
  productRepository,
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  orderItemCancellationRepository,
}: ReviewListServiceDependencies): ReviewListService {
  async function getReviewPageViewModel(
    userId: string,
    query: ReviewListQuery,
  ): Promise<ReviewPageViewModel> {
    const [orders, reviews, claims] = await Promise.all([
      orderRepository.findByUserId(userId),
      reviewRepository.findByUserId(userId),
      orderClaimRepository.findByUserId(userId),
    ]);
    const deliveredOrderIds = orders
      .filter(order => order.status === 'delivered')
      .map(order => order.id);
    const [allOrderItems, itemCancellations] = await Promise.all([
      orderItemRepository.findByOrderIds(orders.map(order => order.id)),
      orderItemCancellationRepository.findByOrderIds(deliveredOrderIds),
    ]);
    const deliveredOrderIdSet = new Set(deliveredOrderIds);
    const deliveredOrderItems = allOrderItems.filter(item =>
      deliveredOrderIdSet.has(item.order_id),
    );
    const products = await productRepository.findByIds(
      Array.from(
        new Set([
          ...reviews.map(review => review.product_id),
          ...allOrderItems.map(item => item.product_id),
        ]),
      ),
    );
    const productById = new Map(products.map(product => [product.id, product]));
    const orderById = new Map(orders.map(order => [order.id, order]));
    const itemById = new Map(allOrderItems.map(item => [item.id, item]));
    const reviewedItemIds = new Set(
      reviews.map(review => review.order_item_id),
    );
    const cancelledItemIds = new Set(
      itemCancellations.map(cancellation => cancellation.order_item_id),
    );
    const completedClaimedItemIds = new Set(
      claims
        .filter(claim => claim.status === 'completed')
        .map(claim => claim.order_item_id),
    );
    const now = new Date();
    const availableItems = deliveredOrderItems.filter(item => {
      const order = requireRelation(
        orderById.get(item.order_id),
        'order_items.order_id -> orders.id',
        item.id,
      );

      return isReviewWritable(
        {
          orderStatus: order.status,
          deliveredAt: order.delivered_at,
          hasReview: reviewedItemIds.has(item.id),
          isCancelled: cancelledItemIds.has(item.id),
          hasCompletedClaim: completedClaimedItemIds.has(item.id),
        },
        now,
      );
    });
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
              reviewItem,
              requireRelation(
                productById.get(review.product_id),
                'reviews.product_id -> products.id',
                review.id,
              ),
            );
          })
        : availableItems.map(item =>
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
              now,
            ),
          );

    return {
      ...paginate(items, query.page, REVIEW_PAGE_SIZE),
      availableCount: availableItems.length,
    };
  }

  return { getReviewPageViewModel };
}
