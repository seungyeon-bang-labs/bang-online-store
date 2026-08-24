import type { ProductCardViewModel } from '@/domains/product';
import type { PageSlice } from '@/shared/lib/pagination';
import type { StatusViewModel } from '@/shared/types/status';
import type { OrderClaimRequestUnavailableReason } from './domain';

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

export interface OrderClaimHistoryViewModel {
  id: string;
  label: string;
  occurredAt: string;
  isCurrent: boolean;
}

export interface OrderClaimProductViewModel {
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  quantity: number;
  lineTotalText: string;
}

export interface OrderClaimSettlementViewModel {
  label: string;
  amountText: string | null;
  description: string;
  tone: 'default' | 'payment' | 'refund';
}

export interface OrderClaimDetailInformationViewModel {
  orderNumber: string;
  requestedAt: string;
  completedAt: string | null;
}

export interface OrderClaimDetailRequestViewModel {
  type: StatusViewModel;
  reason: string;
  description: string | null;
}

export interface OrderClaimDetailRejectionNoticeViewModel {
  reason: string;
}

export interface OrderClaimDetailProcessingHistoryViewModel {
  histories: OrderClaimHistoryViewModel[];
}

export interface OrderClaimDetailExchangeProductViewModel {
  kind: 'exchange';
  orderedItem: OrderClaimProductViewModel;
  exchangeItem: OrderClaimProductViewModel;
}

export interface OrderClaimDetailReturnProductViewModel {
  kind: 'return';
  title: string;
  item: OrderClaimProductViewModel;
}

export type OrderClaimDetailProductViewModel =
  | OrderClaimDetailExchangeProductViewModel
  | OrderClaimDetailReturnProductViewModel;

export interface OrderClaimDetailAddressViewModel {
  title: string;
  description: string | null;
  contactName: string;
  contactPhone: string;
  addressText: string;
  postalCode: string;
}

export interface OrderClaimDetailViewModel {
  information: OrderClaimDetailInformationViewModel;
  request: OrderClaimDetailRequestViewModel;
  rejectionNotice: OrderClaimDetailRejectionNoticeViewModel | null;
  processingHistory: OrderClaimDetailProcessingHistoryViewModel;
  product: OrderClaimDetailProductViewModel;
  address: OrderClaimDetailAddressViewModel;
  refund: OrderClaimSettlementViewModel | null;
}

export interface OrderClaimRequestVariantOptionViewModel {
  id: string;
  label: string;
  isAvailable: boolean;
  isExchangeable: boolean;
  stock: number;
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
