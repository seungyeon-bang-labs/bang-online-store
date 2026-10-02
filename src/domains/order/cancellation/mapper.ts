import { toProductCardViewModel, type ProductModel } from '@/domains/product';
import { formatKoreanDate, formatKoreanMoney } from '@/shared/lib/format';
import type { OrderDTO, OrderItemDTO } from '../dto';
import type { OrderCancellationPreviewViewModel } from './view-model';

export function toOrderCancellationPreviewViewModel({
  order,
  item,
  product,
  expectedRefundAmount,
}: {
  order: OrderDTO;
  item: OrderItemDTO;
  product: ProductModel;
  expectedRefundAmount: number;
}): OrderCancellationPreviewViewModel {
  return {
    orderId: order.id,
    orderItemId: item.id,
    orderNumber: order.order_number,
    orderedAt: formatKoreanDate(order.ordered_at),
    item: {
      product: toProductCardViewModel(product),
      productName: item.product_name,
      optionLabel: item.option_label,
      quantity: item.quantity,
      lineTotalText: formatKoreanMoney(item.line_total_amount),
    },
    expectedRefundAmountText: formatKoreanMoney(expectedRefundAmount),
  };
}
