import type { ProductCardViewModel } from '@/domains/product';

export interface OrderCancellationPreviewViewModel {
  orderId: string;
  orderItemId: string;
  orderNumber: string;
  orderedAt: string;
  item: {
    product: ProductCardViewModel;
    productName: string;
    optionLabel: string;
    quantity: number;
    lineTotalText: string;
  };
  expectedRefundAmountText: string;
}

export type OrderCancellationUnavailableReason =
  | 'already_cancelled'
  | 'status_changed';

export type OrderCancellationRequestViewModel =
  | {
      isEligible: true;
      preview: OrderCancellationPreviewViewModel;
    }
  | {
      isEligible: false;
      orderId: string;
      unavailableReason: OrderCancellationUnavailableReason;
    };
