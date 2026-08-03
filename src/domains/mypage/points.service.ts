import {
  pointTransactionRepository,
  toPointPageViewModel,
  type PointListQuery,
} from '@/domains/benefit';
import { reviewRepository } from '@/domains/activity';
import type { UserDTO } from '@/domains/member';
import { orderItemRepository } from '@/domains/order';
import type { OrderItemDTO } from '@/domains/order';
import { productRepository } from '@/domains/product';

export async function getMypagePointPageViewModel(
  user: UserDTO,
  query: PointListQuery,
) {
  const [transactions, reviews] = await Promise.all([
    pointTransactionRepository.findByUserId(user.id),
    reviewRepository.findByUserId(user.id),
  ]);
  const orderIds = Array.from(
    new Set(
      transactions.flatMap(transaction =>
        transaction.order_id
          ? [transaction.order_id]
          : [],
      ),
    ),
  );
  const [orderItems, products] = await Promise.all([
    orderItemRepository.findByOrderIds(orderIds),
    productRepository.findByIds(
      Array.from(new Set(reviews.map(review => review.product_id))),
    ),
  ]);
  const itemsByOrderId = groupOrderItemsByOrderId(orderItems);
  const reviewById = new Map(reviews.map(review => [review.id, review]));
  const productNameById = new Map(
    products.map(product => [product.id, product.name]),
  );
  const descriptionsByTransactionId = new Map(
    transactions.flatMap(transaction => {
      const description = getPointTransactionDescription(
        transaction.order_id,
        transaction.review_id,
        itemsByOrderId,
        reviewById,
        productNameById,
      );

      return description ? [[transaction.id, description] as const] : [];
    }),
  );

  return toPointPageViewModel(
    transactions,
    query,
    new Date(),
    descriptionsByTransactionId,
  );
}

function groupOrderItemsByOrderId(items: OrderItemDTO[]) {
  const itemsByOrderId = new Map<string, OrderItemDTO[]>();

  items.forEach(item => {
    const orderItems = itemsByOrderId.get(item.order_id) ?? [];
    orderItems.push(item);
    itemsByOrderId.set(item.order_id, orderItems);
  });

  return itemsByOrderId;
}

function getOrderProductSummary(items: OrderItemDTO[]): string | null {
  const firstItem = items[0];

  if (!firstItem) return null;

  return items.length === 1
    ? firstItem.product_name
    : `${firstItem.product_name} 외 ${items.length - 1}개`;
}

function getPointTransactionDescription(
  orderId: string | null,
  reviewId: string | null,
  itemsByOrderId: ReadonlyMap<string, OrderItemDTO[]>,
  reviewById: ReadonlyMap<string, { product_id: number }>,
  productNameById: ReadonlyMap<number, string>,
): string | null {
  if (orderId) {
    return getOrderProductSummary(itemsByOrderId.get(orderId) ?? []);
  }

  if (!reviewId) return null;

  const review = reviewById.get(reviewId);
  const productName = review
    ? productNameById.get(review.product_id)
    : null;

  return productName ?? null;
}
