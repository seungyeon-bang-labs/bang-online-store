import type { StatusViewModel } from '@/shared/types/status';
import type { PageSlice } from '@/shared/lib/pagination';
import type { ProductCardViewModel } from '@/domains/product';
import type {
  OrderPaymentMethod,
  OrderStatus,
} from './dto';

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
    reason: string;
    reasonDetail: string | null;
    refundAmountLabel: '환불 예정 금액' | '환불 완료 금액';
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

export interface OrderAmountViewModel {
  label: '결제 예정 금액' | '결제 금액' | '최초 결제 금액';
  amountText: string;
}

export interface OrderListItemViewModel {
  id: string;
  orderNumber: string;
  orderedAt: string;
  statusCode: OrderStatus;
  status: StatusViewModel;
  statusDescription: string;
  orderAmount: OrderAmountViewModel;
  cancelledItemCount: number;
  refunds: OrderRefundViewModel[];
  items: OrderItemViewModel[];
}

export interface OrderListPageViewModel
  extends PageSlice<OrderListItemViewModel> {
  unfilteredItemCount: number;
}

export interface OrderDetailPaymentViewModel {
  subtotalAmountText: string;
  discountAmountText: string;
  hasDiscount: boolean;
  shippingFeeText: string;
  isFreeShipping: boolean;
  totalAmountLabel: '총 결제 금액' | '최초 결제 금액';
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
