import type { OrderDTO, OrderItemDTO } from '../dto';
import {
  ORDER_FREE_SHIPPING_THRESHOLD,
  ORDER_STANDARD_SHIPPING_FEE,
} from '../domain';

interface OrderCancellationRefundInput {
  itemId: string;
  itemAmount: number;
}

interface OrderCancellationRefundAllocation {
  itemId: string;
  itemAmount: number;
  orderDiscountAmount: number;
  pointUsageAmount: number;
  shippingAdjustmentAmount: number;
  refundAmount: number;
}

function allocateProportionally(
  totalAmount: number,
  items: readonly OrderCancellationRefundInput[],
): Map<string, number> {
  const totalWeight = items.reduce(
    (total, item) => total + item.itemAmount,
    0,
  );

  if (totalAmount <= 0 || totalWeight <= 0) {
    return new Map(items.map(item => [item.itemId, 0]));
  }

  let allocatedAmount = 0;

  return new Map(
    items.map((item, index) => {
      const amount =
        index === items.length - 1
          ? totalAmount - allocatedAmount
          : Math.floor((totalAmount * item.itemAmount) / totalWeight);
      allocatedAmount += amount;
      return [item.itemId, amount];
    }),
  );
}

function calculateCancellationRefundAllocations({
  cancelledItems,
  orderDiscountAmount,
  pointUsageAmount,
  shippingAdjustmentAmount = 0,
}: {
  cancelledItems: readonly OrderCancellationRefundInput[];
  orderDiscountAmount: number;
  pointUsageAmount: number;
  shippingAdjustmentAmount?: number;
}): OrderCancellationRefundAllocation[] {
  const orderDiscountByItem = allocateProportionally(
    orderDiscountAmount,
    cancelledItems,
  );
  const pointUsageByItem = allocateProportionally(
    pointUsageAmount,
    cancelledItems,
  );
  const shippingAdjustmentByItem = allocateProportionally(
    shippingAdjustmentAmount,
    cancelledItems,
  );

  return cancelledItems.map(item => {
    const orderDiscount = orderDiscountByItem.get(item.itemId) ?? 0;
    const pointUsage = pointUsageByItem.get(item.itemId) ?? 0;
    const shippingAdjustment = shippingAdjustmentByItem.get(item.itemId) ?? 0;

    return {
      itemId: item.itemId,
      itemAmount: item.itemAmount,
      orderDiscountAmount: orderDiscount,
      pointUsageAmount: pointUsage,
      shippingAdjustmentAmount: shippingAdjustment,
      refundAmount: Math.max(
        0,
        item.itemAmount - orderDiscount - pointUsage - shippingAdjustment,
      ),
    };
  });
}

function getOrderLevelDiscountAmount(
  order: OrderDTO,
  items: readonly OrderItemDTO[],
): number {
  const directDiscountAmount = items.reduce(
    (total, item) => total + item.discount_amount,
    0,
  );

  return Math.max(0, order.discount_amount - directDiscountAmount);
}

function getOrderPointUsageAmount(
  order: OrderDTO,
  items: readonly OrderItemDTO[],
): number {
  const itemTotalAmount = items.reduce(
    (total, item) => total + item.line_total_amount,
    0,
  );

  return Math.max(0, itemTotalAmount + order.shipping_fee - order.total_amount);
}

function getOrderCancellationShippingAdjustmentAmount({
  order,
  remainingItemAmount,
}: {
  order: OrderDTO;
  remainingItemAmount: number;
}): number {
  return order.shipping_fee === 0 &&
    remainingItemAmount > 0 &&
    remainingItemAmount < ORDER_FREE_SHIPPING_THRESHOLD
    ? ORDER_STANDARD_SHIPPING_FEE
    : 0;
}

function calculateOrderCancellationRefundAllocations({
  order,
  items,
  cancelledOrderItemIds,
  targetOrderItemIds,
}: {
  order: OrderDTO;
  items: readonly OrderItemDTO[];
  cancelledOrderItemIds: ReadonlySet<string>;
  targetOrderItemIds: readonly string[];
}): OrderCancellationRefundAllocation[] {
  const targetOrderItemIdSet = new Set(targetOrderItemIds);
  const targetItems = items.filter(
    item =>
      targetOrderItemIdSet.has(item.id) && !cancelledOrderItemIds.has(item.id),
  );
  const benefitAllocationByItemId = new Map(
    calculateCancellationRefundAllocations({
      cancelledItems: items.map(item => ({
        itemId: item.id,
        itemAmount: item.line_total_amount,
      })),
      orderDiscountAmount: getOrderLevelDiscountAmount(order, items),
      pointUsageAmount: getOrderPointUsageAmount(order, items),
    }).map(allocation => [allocation.itemId, allocation]),
  );
  const remainingItemAmount = items
    .filter(item => !cancelledOrderItemIds.has(item.id))
    .filter(item => !targetOrderItemIdSet.has(item.id))
    .reduce((total, item) => total + item.line_total_amount, 0);
  const shippingAdjustmentAmount = getOrderCancellationShippingAdjustmentAmount(
    { order, remainingItemAmount },
  );
  const shippingAdjustmentByItemId = new Map(
    calculateCancellationRefundAllocations({
      cancelledItems: targetItems.map(item => ({
        itemId: item.id,
        itemAmount: item.line_total_amount,
      })),
      orderDiscountAmount: 0,
      pointUsageAmount: 0,
      shippingAdjustmentAmount,
    }).map(allocation => [allocation.itemId, allocation.shippingAdjustmentAmount]),
  );

  return targetItems.map(item => {
    const benefitAllocation = benefitAllocationByItemId.get(item.id);

    if (!benefitAllocation) {
      throw new Error('환불 금액을 계산할 수 없습니다.');
    }

    const itemShippingAdjustment =
      shippingAdjustmentByItemId.get(item.id) ?? 0;

    return {
      ...benefitAllocation,
      shippingAdjustmentAmount: itemShippingAdjustment,
      refundAmount: Math.max(
        0,
        benefitAllocation.refundAmount - itemShippingAdjustment,
      ),
    };
  });
}

export function getOrderCancellationExpectedRefundAmount({
  order,
  items,
  cancelledOrderItemIds,
  targetOrderItemId,
}: {
  order: OrderDTO;
  items: readonly OrderItemDTO[];
  cancelledOrderItemIds: ReadonlySet<string>;
  targetOrderItemId: string;
}): number {
  const targetItem = items.find(item => item.id === targetOrderItemId);

  if (!targetItem || cancelledOrderItemIds.has(targetItem.id)) {
    throw new Error('취소할 수 없는 주문 상품입니다.');
  }

  const [allocation] = calculateOrderCancellationRefundAllocations({
    order,
    items,
    cancelledOrderItemIds,
    targetOrderItemIds: [targetItem.id],
  });

  if (!allocation) {
    throw new Error('예상 환불 금액을 계산할 수 없습니다.');
  }

  return allocation.refundAmount;
}
