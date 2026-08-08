import { formatKoreanDate, formatKoreanDateKey } from '@/shared/lib/format';
import type { OrderDTO, OrderItemDTO } from '@/domains/order/dto';
import type { Product } from '@/domains/product/product.dto';
import { toProductCardViewModel } from '@/domains/product/product.presenter';
import type { ReviewDTO } from './dto';
import {
  getReviewDeadlineDday,
  getReviewWriteDeadline,
} from './domain';
import type {
  ActivityProductViewModel,
  AvailableReviewViewModel,
  WrittenReviewViewModel,
} from './view-model';

export function toActivityProductViewModel(
  row: { id: string; recordedAt: string },
  product: Product,
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
  product: Product,
): WrittenReviewViewModel {
  return {
    kind: 'written',
    id: review.id,
    product: toProductCardViewModel(product),
    optionLabel: item.option_label,
    rating: review.rating,
    content: review.content,
    createdAt: formatKoreanDate(review.created_at),
  };
}

export function toAvailableReviewViewModel(
  item: OrderItemDTO,
  order: OrderDTO,
  product: Product,
  now: Date,
): AvailableReviewViewModel {
  if (!order.delivered_at) {
    throw new Error(`Delivered order is missing delivered_at: ${order.id}`);
  }

  const reviewDeadline = getReviewWriteDeadline(order.delivered_at);

  return {
    kind: 'available',
    orderItemId: item.id,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    orderedAt: formatKoreanDate(order.ordered_at),
    reviewDeadlineAt: formatKoreanDate(reviewDeadline.toISOString()),
    reviewDeadlineDday: getReviewDeadlineDday(reviewDeadline, now),
  };
}
