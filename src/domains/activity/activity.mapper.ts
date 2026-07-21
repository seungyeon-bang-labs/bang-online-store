import { formatMypageDate } from '@/domains/mypage/mypage-format';
import type { OrderDTO, OrderItemDTO } from '@/domains/order/order.dto';
import type { Product } from '@/domains/product/product.dto';
import { toProductCardViewModel } from '@/domains/product/product.presenter';
import type { ReviewDTO } from './activity.dto';
import type {
  AvailableReviewViewModel,
  WrittenReviewViewModel,
} from './activity.view-model';

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
    createdAt: formatMypageDate(review.created_at),
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
    orderedAt: formatMypageDate(order.ordered_at),
  };
}
