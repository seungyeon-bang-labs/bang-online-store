import type { PageSlice } from '@/shared/lib/pagination';
import type { StatusViewModel } from '@/shared/types/status';
import type { ProductCardViewModel } from '@/domains/product';
import type { OrderStatus } from './dto';

export interface OrderItemActionViewModel {
  label: string;
}

export interface OrderItemActionsViewModel {
  primary: OrderItemActionViewModel;
  secondary: OrderItemActionViewModel;
  more: OrderItemActionViewModel[];
}

export interface OrderRefundViewModel {
  id: string;
  label: string;
  amountText: string;
  description: string;
  status: 'pending' | 'completed';
}

export interface OrderItemViewModel {
  id: string;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  quantity: number;
  lineTotalText: string;
  cancellation: {
    refundAmountText: string;
  } | null;
  repurchaseItem: {
    productId: number;
    variantId: string;
    quantity: number;
  } | null;
  actions: OrderItemActionsViewModel | null;
}

export interface OrderListItemViewModel {
  id: string;
  orderNumber: string;
  orderedAt: string;
  statusCode: OrderStatus;
  status: StatusViewModel;
  statusDescription: string;
  totalAmountText: string;
  finalAmountText: string;
  cancelledItemCount: number;
  refunds: OrderRefundViewModel[];
  items: OrderItemViewModel[];
}

export type OrderListPageViewModel = PageSlice<OrderListItemViewModel>;

export interface OrderClaimViewModel {
  id: string;
  orderNumber: string;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  lineTotalText: string;
  status: StatusViewModel;
  reason: string;
  requestedAt: string;
  completedAt: string | null;
}

export type OrderClaimPageViewModel = PageSlice<OrderClaimViewModel>;
