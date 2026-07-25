import {
  formatKoreanDate,
  formatKoreanDateTime,
} from '@/shared/lib/format';
import type { OrderDTO, OrderItemDTO } from '@/domains/order/dto';
import type { Product } from '@/domains/product/product.dto';
import { toProductCardViewModel } from '@/domains/product/product.presenter';
import type { ReviewDTO } from './dto';
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
    recordedAt: formatKoreanDateTime(row.recordedAt),
  };
}

export function toWrittenReviewViewModel(
  review: ReviewDTO,
  product: Product,
): WrittenReviewViewModel {
  return {
    kind: 'written',
    id: review.id,
    product: toProductCardViewModel(product),
    rating: review.rating,
    content: review.content,
    createdAt: formatKoreanDate(review.created_at),
  };
}

export function toAvailableReviewViewModel(
  item: OrderItemDTO,
  order: OrderDTO,
  product: Product,
): AvailableReviewViewModel {
  return {
    kind: 'available',
    orderItemId: item.id,
    orderNumber: order.order_number,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    orderedAt: formatKoreanDate(order.ordered_at),
  };
}
