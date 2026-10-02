import { formatKoreanDate, formatKoreanDateKey } from '@/shared/lib/format';
import type { OrderDTO, OrderItemDTO } from '@/domains/order/dto';
import {
  toProductCardViewModel,
  type ProductModel,
} from '@/domains/product';
import type { ReviewDTO } from './dto';
import {
  getReviewDeadlineDday,
  getReviewDeleteAvailableAt,
  getReviewWriteDeadline,
  isReviewDeletable,
} from './domain';
import type {
  ActivityProductViewModel,
  AvailableReviewViewModel,
  ReviewFormMode,
  ReviewFormPageViewModel,
  WrittenReviewViewModel,
} from './view-model';

export function toActivityProductViewModel(
  row: { id: string; recordedAt: string },
  product: ProductModel,
): ActivityProductViewModel {
  return {
    id: row.id,
    product: toProductCardViewModel(product),
    recordedDateKey: formatKoreanDateKey(row.recordedAt),
    recordedDateLabel: formatKoreanDate(row.recordedAt),
  };
}

export function toWrittenReviewViewModel(
  review: ReviewDTO,
  item: OrderItemDTO,
  product: ProductModel,
  now: Date,
): WrittenReviewViewModel {
  return {
    kind: 'written',
    id: review.id,
    orderId: item.order_id,
    product: toProductCardViewModel(product),
    optionLabel: item.option_label,
    rating: review.rating,
    content: review.content,
    createdAt: formatKoreanDate(review.created_at),
    canDelete: isReviewDeletable(review.created_at, now),
    deleteAvailableAt: formatKoreanDate(
      getReviewDeleteAvailableAt(review.created_at).toISOString(),
    ),
  };
}

export function toAvailableReviewViewModel(
  item: OrderItemDTO,
  order: OrderDTO,
  product: ProductModel,
  now: Date,
): AvailableReviewViewModel {
  if (!order.delivered_at) {
    throw new Error(`Delivered order is missing delivered_at: ${order.id}`);
  }

  const reviewDeadline = getReviewWriteDeadline(order.delivered_at);

  return {
    kind: 'available',
    orderId: order.id,
    orderItemId: item.id,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    orderedAt: formatKoreanDate(order.ordered_at),
    reviewDeadlineAt: formatKoreanDate(reviewDeadline.toISOString()),
    reviewDeadlineDday: getReviewDeadlineDday(reviewDeadline, now),
  };
}

export function toReviewFormPageViewModel(
  mode: ReviewFormMode,
  item: OrderItemDTO,
  product: ProductModel,
  review?: ReviewDTO,
): ReviewFormPageViewModel {
  return {
    mode,
    orderId: item.order_id,
    orderItemId: item.id,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    initialRating: review?.rating ?? 0,
    initialContent: review?.content ?? '',
  };
}
