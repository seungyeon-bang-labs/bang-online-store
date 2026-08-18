import type { PageSlice } from '@/shared/lib/pagination';
import type { StatusViewModel } from '@/shared/types/status';
import type { ProductCardViewModel } from '@/domains/product';
import type { OrderPaymentMethod, OrderStatus } from './dto';
import type { OrderClaimRequestUnavailableReason } from './domain';

export type OrderItemActionType =
  | 'payment'
  | 'cancel'
  | 'inquiry'
  | 'receipt'
  | 'tracking'
  | 'review'
  | 'claim'
  | 'repurchase'
  | 'refund';

export interface OrderItemActionViewModel {
  type: OrderItemActionType;
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
  repurchaseItem: {
    productId: number;
    variantId: string;
    quantity: number;
  } | null;
}

export type OrderItemViewModel = OrderItemBaseViewModel;

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
  paymentMethod: OrderPaymentMethod;
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
  paidAt: string | null;
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

export interface OrderClaimRequestVariantOptionViewModel {
  id: string;
  label: string;
  isAvailable: boolean;
  stock: number;
  unitAmount: number;
}

export interface OrderClaimRequestColorOptionViewModel {
  productId: number;
  label: string;
  hex: string;
  variants: OrderClaimRequestVariantOptionViewModel[];
}

export interface OrderClaimRequestViewModel {
  orderId: string;
  orderNumber: string;
  orderedAt: string;
  orderItemId: string;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  quantity: number;
  itemAmount: number;
  itemAmountText: string;
  collectionAddressText: string;
  isEligible: boolean;
  unavailableReason: OrderClaimRequestUnavailableReason | null;
  currentProductId: number;
  currentVariantId: string;
  currentVariantLabel: string;
  exchangeColorOptions: OrderClaimRequestColorOptionViewModel[];
}
