import type {
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderRepository,
} from '@/domains/order/repository';
import type { OrderClaimRepository } from '@/domains/order/claim/repository';
import {
  getReviewWriteUnavailableReason,
  validateReviewForm,
} from './domain';
import type { ReviewDTO } from './dto';
import { toReviewFormPageViewModel } from './mapper';
import type { ActivityProductRepository, ReviewRepository } from './repository';
import type {
  ReviewCreateResult,
  ReviewFormPageViewModel,
  ReviewWritePageViewModel,
} from './view-model';

interface ReviewFormServiceDependencies {
  reviewRepository: ReviewRepository;
  productRepository: ActivityProductRepository;
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderClaimRepository: OrderClaimRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
}

export interface ReviewFormService {
  getReviewWritePageViewModel(
    userId: string,
    orderItemId: string,
  ): Promise<ReviewWritePageViewModel | null>;
  getReviewWriteFormViewModel(
    userId: string,
    orderItemId: string,
  ): Promise<ReviewFormPageViewModel | null>;
  getReviewEditFormViewModel(
    userId: string,
    reviewId: string,
  ): Promise<ReviewFormPageViewModel | null>;
  createReview(
    userId: string,
    orderItemId: string,
    input: { rating: number; content: string },
  ): Promise<ReviewCreateResult>;
}

export function createReviewFormService({
  reviewRepository,
  productRepository,
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  orderItemCancellationRepository,
}: ReviewFormServiceDependencies): ReviewFormService {
  async function getReviewWritePageViewModel(
    userId: string,
    orderItemId: string,
  ): Promise<ReviewWritePageViewModel | null> {
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
      claim => claim.order_item_id === item.id && claim.status === 'completed',
    );
    const isCancelled = itemCancellations.some(
      cancellation => cancellation.order_item_id === item.id,
    );
    const reason = getReviewWriteUnavailableReason({
      orderStatus: order.status,
      deliveredAt: order.delivered_at,
      hasReview: reviews.length > 0,
      isCancelled,
      hasCompletedClaim,
    });

    if (reason) return { kind: 'unavailable', reason };

    return {
      kind: 'writable',
      form: toReviewFormPageViewModel('create', item, product),
    };
  }

  async function getReviewWriteFormViewModel(
    userId: string,
    orderItemId: string,
  ): Promise<ReviewFormPageViewModel | null> {
    const pageViewModel = await getReviewWritePageViewModel(
      userId,
      orderItemId,
    );

    return pageViewModel?.kind === 'writable' ? pageViewModel.form : null;
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

  async function createReview(
    userId: string,
    orderItemId: string,
    input: { rating: number; content: string },
  ): Promise<ReviewCreateResult> {
    const validation = validateReviewForm(input);
    if (!validation.isRatingValid || !validation.isContentValid) {
      return 'invalid';
    }

    const [pageViewModel, item] = await Promise.all([
      getReviewWritePageViewModel(userId, orderItemId),
      orderItemRepository.findById(orderItemId),
    ]);
    if (!pageViewModel || !item) return 'invalid';
    if (pageViewModel.kind === 'unavailable') return 'unavailable';

    const createdAt = new Date().toISOString();
    const review: ReviewDTO = {
      id: crypto.randomUUID(),
      user_id: userId,
      order_item_id: item.id,
      product_id: item.product_id,
      rating: input.rating,
      content: input.content.trim(),
      created_at: createdAt,
      updated_at: createdAt,
    };
    await reviewRepository.create(review);
    return 'created';
  }

  return {
    getReviewWritePageViewModel,
    getReviewWriteFormViewModel,
    getReviewEditFormViewModel,
    createReview,
  };
}
