import type {
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderRepository,
} from '@/domains/order/repository';
import type { OrderClaimRepository } from '@/domains/order/claim/repository';
import { isReviewWritable } from './domain';
import { toReviewFormPageViewModel } from './mapper';
import type { ActivityProductRepository, ReviewRepository } from './repository';
import type { ReviewFormPageViewModel } from './view-model';

interface ReviewFormServiceDependencies {
  reviewRepository: ReviewRepository;
  productRepository: ActivityProductRepository;
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderClaimRepository: OrderClaimRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
}

export interface ReviewFormService {
  getReviewWriteFormViewModel(
    userId: string,
    orderItemId: string,
  ): Promise<ReviewFormPageViewModel | null>;
  getReviewEditFormViewModel(
    userId: string,
    reviewId: string,
  ): Promise<ReviewFormPageViewModel | null>;
}

export function createReviewFormService({
  reviewRepository,
  productRepository,
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  orderItemCancellationRepository,
}: ReviewFormServiceDependencies): ReviewFormService {
  async function getReviewWriteFormViewModel(
    userId: string,
    orderItemId: string,
  ): Promise<ReviewFormPageViewModel | null> {
    const item = await orderItemRepository.findById(orderItemId);

    if (!item) return null;

    const [order, reviews, claims, itemCancellations, products] =
      await Promise.all([
        orderRepository.findById(item.order_id),
        reviewRepository.findByOrderItemIds([orderItemId]),
        orderClaimRepository.findByOrderItemIds([orderItemId]),
        orderItemCancellationRepository.findByOrderItemIds([orderItemId]),
        productRepository.findByIds([item.product_id]),
      ]);
    const [product] = products;

    if (!order || order.user_id !== userId || !product) return null;
    const hasCompletedClaim = claims.some(
      claim =>
        claim.order_item_id === item.id && claim.status === 'completed',
    );
    const isCancelled = itemCancellations.some(
      cancellation => cancellation.order_item_id === item.id,
    );

    if (
      !isReviewWritable({
        orderStatus: order.status,
        deliveredAt: order.delivered_at,
        hasReview: reviews.length > 0,
        isCancelled,
        hasCompletedClaim,
      })
    ) {
      return null;
    }

    return toReviewFormPageViewModel('create', item, product);
  }

  async function getReviewEditFormViewModel(
    userId: string,
    reviewId: string,
  ): Promise<ReviewFormPageViewModel | null> {
    const review = await reviewRepository.findById(reviewId);

    if (!review || review.user_id !== userId) return null;

    const item = await orderItemRepository.findById(review.order_item_id);

    if (!item || item.product_id !== review.product_id) return null;

    const [order, products] = await Promise.all([
      orderRepository.findById(item.order_id),
      productRepository.findByIds([review.product_id]),
    ]);
    const [product] = products;

    if (!order || order.user_id !== userId || !product) return null;

    return toReviewFormPageViewModel('edit', item, product, review);
  }

  return { getReviewWriteFormViewModel, getReviewEditFormViewModel };
}
