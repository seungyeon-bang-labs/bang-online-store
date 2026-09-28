import type { OrderPaymentMethod } from '@/domains/order';
import type { MypageOrderReceiptDocumentType } from './order-receipt.domain';

export type { MypageOrderReceiptDocumentType } from './order-receipt.domain';

export interface MypageOrderReceiptOrderInformationViewModel {
  orderNumber: string;
  paidAt: string;
  paymentMethod: OrderPaymentMethod;
}

interface MypageOrderReceiptBaseViewModel {
  type: MypageOrderReceiptDocumentType;
  title: string;
  orderInformation: MypageOrderReceiptOrderInformationViewModel;
}

export interface MypageOrderReceiptPaymentSummaryViewModel {
  subtotalAmountText: string;
  discountAmountText: string;
  hasDiscount: boolean;
  pointUsageAmountText: string | null;
  shippingFeeText: string;
  isFreeShipping: boolean;
  originalPaymentAmountText: string;
  refundedAmountText: string | null;
  finalPaymentAmountText: string;
}

export interface MypageOrderPurchaseReceiptViewModel
  extends MypageOrderReceiptBaseViewModel {
  type: 'purchase';
  items: MypageOrderReceiptItemViewModel[];
  paymentSummary: MypageOrderReceiptPaymentSummaryViewModel;
}

export interface MypageOrderPaymentReceiptViewModel
  extends MypageOrderReceiptBaseViewModel {
  type: 'card' | 'cash';
  paymentDetail: MypageOrderReceiptPaymentDetailViewModel;
  paymentTransactions: MypageOrderReceiptPaymentTransactionViewModel[];
}

export interface MypageOrderReceiptPaymentDetailViewModel {
  title: string;
  rows: readonly {
    label: string;
    value: string;
  }[];
}

export interface MypageOrderRefundReceiptViewModel
  extends MypageOrderReceiptBaseViewModel {
  type: 'refund';
  refunds: MypageOrderReceiptRefundViewModel[];
  originalPaymentAmountText: string;
  refundedAmountText: string | null;
  finalPaymentAmountText: string;
}

export type MypageOrderReceiptViewModel =
  | MypageOrderPurchaseReceiptViewModel
  | MypageOrderPaymentReceiptViewModel
  | MypageOrderRefundReceiptViewModel;

export interface MypageOrderReceiptItemViewModel {
  id: string;
  productName: string;
  optionLabel: string;
  quantity: number;
  amountText: string;
  statusLabel: string | null;
}

export interface MypageOrderReceiptRefundViewModel {
  id: string;
  label: string;
  amountText: string;
  occurredAt: string;
  status: 'pending' | 'completed';
}

export interface MypageOrderReceiptPaymentTransactionViewModel {
  id: string;
  label: string;
  amountText: string;
  occurredAt: string;
  tone: 'default' | 'refund';
}

export interface MypageOrderReceiptDocumentLinkViewModel {
  type: MypageOrderReceiptDocumentType;
  title: string;
  description: string;
  href: string;
}

export interface MypageOrderReceiptDocumentListViewModel {
  orderNumber: string;
  documents: MypageOrderReceiptDocumentLinkViewModel[];
}
