import { reviewRepository } from '@/domains/activity';
import {
  applyReviewedItemActions,
  getOrderListViewModel,
  type OrderListQuery,
} from '@/domains/order';

/** 주문과 리뷰 데이터를 조합해 주문 내역의 후속 액션을 일관되게 만든다. */
export async function getMypageOrderListViewModel(
  userId: string,
  query: OrderListQuery,
) {
  const [orderPage, reviews] = await Promise.all([
    getOrderListViewModel(userId, query),
    reviewRepository.findByUserId(userId),
  ]);

  return applyReviewedItemActions(
    orderPage,
    new Set(reviews.map(review => review.order_item_id)),
  );
}
