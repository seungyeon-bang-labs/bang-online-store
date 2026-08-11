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

export interface OrderItemBaseViewModel {
  id: string;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  quantity: number;
  lineTotalText: string;
  cancellation: {
    refundAmountText: string;
  } | null;
  actions: OrderItemActionsViewModel | null;
}

export interface OrderItemViewModel extends OrderItemBaseViewModel {
  repurchaseItem: {
    productId: number;
    variantId: string;
    quantity: number;
  } | null;
}

export type OrderDetailItemViewModel = OrderItemBaseViewModel;

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

export interface OrderDetailPaymentViewModel {
  subtotalAmountText: string;
  discountAmountText: string;
  hasDiscount: boolean;
  shippingFeeText: string;
  isFreeShipping: boolean;
  totalAmountText: string;
  paymentMethod: string;
}

export interface OrderDetailShippingViewModel {
  recipientName: string;
  recipientPhone: string;
  addressText: string;
  postalCode: string;
}

export interface OrderStatusHistoryViewModel {
  id: string;
  label: string;
  occurredAt: string;
  isCurrent: boolean;
}

export interface OrderDetailRefundSummaryViewModel {
  items: OrderRefundViewModel[];
  finalPaymentAmountText: string | null;
}

export interface OrderDetailViewModel {
  id: string;
  orderNumber: string;
  orderedAt: string;
  items: OrderDetailItemViewModel[];
  payment: OrderDetailPaymentViewModel;
  shipping: OrderDetailShippingViewModel;
  refund: OrderDetailRefundSummaryViewModel;
  statusHistory: OrderStatusHistoryViewModel[];
}

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
