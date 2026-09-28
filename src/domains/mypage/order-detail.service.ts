import { reviewRepository } from '@/domains/activity';
import { pointTransactionRepository } from '@/domains/benefit';
import { getOrderDetailViewModel } from '@/domains/order';
import { toMypageOrderDetailViewModel } from './order-detail.mapper';
import type { MypageOrderDetailViewModel } from './order-detail.view-model';

export async function getMypageOrderDetailViewModel(
  userId: string,
  orderId: string,
): Promise<MypageOrderDetailViewModel | null> {
  const order = await getOrderDetailViewModel(userId, orderId);

  if (!order) return null;

  const [orderPointTransactions, reviews] = await Promise.all([
    pointTransactionRepository.findByOrderIds([order.id]),
    reviewRepository.findByOrderItemIds(order.items.map(item => item.id)),
  ]);
  const reviewPointTransactions = await pointTransactionRepository.findByReviewIds(
    reviews.map(review => review.id),
  );
  return toMypageOrderDetailViewModel(
    order,
    orderPointTransactions,
    reviewPointTransactions,
  );
}
