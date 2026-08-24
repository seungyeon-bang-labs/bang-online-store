import type { ProductCardViewModel } from '@/domains/product';

export interface OrderCancellationPreviewViewModel {
  orderId: string;
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
