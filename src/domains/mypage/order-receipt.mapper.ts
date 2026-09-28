import type {
  OrderDetailViewModel,
  OrderPaymentReceiptDetailsDTO,
  OrderPaymentTransactionDTO,
} from '@/domains/order';
import {
  formatKoreanDateTime,
  formatKoreanMoney,
  formatKoreanPoints,
} from '@/shared/lib/format';
import { getMypageOrderReceiptHref } from '@/shared/lib/mypage-routes';
import {
  getAvailableMypageOrderReceiptDocumentTypes,
  type MypageOrderReceiptDocumentType,
} from './order-receipt.domain';
import type {
  MypageOrderReceiptDocumentLinkViewModel,
  MypageOrderReceiptDocumentListViewModel,
  MypageOrderReceiptOrderInformationViewModel,
  MypageOrderReceiptPaymentSummaryViewModel,
  MypageOrderReceiptViewModel,
} from './order-receipt.view-model';

const RECEIPT_DOCUMENT_COPY: Record<
  MypageOrderReceiptDocumentType,
  Pick<MypageOrderReceiptDocumentLinkViewModel, 'title' | 'description'>
> = {
  purchase: {
    title: '구매 영수증',
    description: '주문 상품과 결제·환불 내역을 확인할 수 있습니다.',
  },
  card: {
    title: '카드 매출전표',
    description: '신용카드 결제와 취소 내역을 확인할 수 있습니다.',
  },
  cash: {
    title: '현금영수증',
    description: '무통장 입금 결제에 대한 발급 내역을 확인할 수 있습니다.',
  },
  refund: {
    title: '취소·환불 확인서',
    description: '취소된 상품과 환불 처리 내역을 확인할 수 있습니다.',
  },
};

function getAvailableDocumentTypes(
  order: OrderDetailViewModel,
): MypageOrderReceiptDocumentType[] {
  return getAvailableMypageOrderReceiptDocumentTypes({
    hasCompletedPayment: Boolean(order.paidAt),
    paymentMethod: order.payment.paymentMethod,
    hasRefund: order.refund.items.length > 0,
  });
}

function toReceiptPaymentSummary(
  order: OrderDetailViewModel,
  pointUsageAmount: number,
  originalPaymentAmountText: string,
  refundedAmountText: string | null,
  finalPaymentAmountText: string,
): MypageOrderReceiptPaymentSummaryViewModel {
  return {
    subtotalAmountText: order.payment.subtotalAmountText,
    discountAmountText: order.payment.discountAmountText,
    hasDiscount: order.payment.hasDiscount,
    pointUsageAmountText:
      pointUsageAmount > 0 ? formatKoreanPoints(pointUsageAmount) : null,
    shippingFeeText: order.payment.shippingFeeText,
    isFreeShipping: order.payment.isFreeShipping,
    originalPaymentAmountText,
    refundedAmountText,
    finalPaymentAmountText,
  };
}

function toReceiptOrderInformation(
  order: OrderDetailViewModel,
  paidAt: string,
): MypageOrderReceiptOrderInformationViewModel {
  return {
    orderNumber: order.orderNumber,
    paidAt,
    paymentMethod: order.payment.paymentMethod,
  };
}

interface ReceiptPaymentAmounts {
  originalPaymentAmountText: string;
  refundedAmountText: string | null;
  finalPaymentAmountText: string;
}

function toReceiptPaymentAmounts(
  transactions: readonly OrderPaymentTransactionDTO[],
): ReceiptPaymentAmounts {
  const originalPaymentAmount = transactions
    .filter(transaction => transaction.type === 'payment')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const refundedAmount = transactions
    .filter(transaction => transaction.type === 'refund')
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    originalPaymentAmountText: formatKoreanMoney(originalPaymentAmount),
    refundedAmountText:
      refundedAmount > 0 ? formatKoreanMoney(refundedAmount) : null,
    finalPaymentAmountText: formatKoreanMoney(
      Math.max(0, originalPaymentAmount - refundedAmount),
    ),
  };
}

function toReceiptPaymentTransactions(
  transactions: readonly OrderPaymentTransactionDTO[],
) {
  return transactions
    .slice()
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at))
    .map(transaction => ({
      id: transaction.id,
      label: transaction.type === 'payment' ? '결제 완료' : '부분 취소·환불',
      amountText: `${transaction.type === 'refund' ? '- ' : ''}${formatKoreanMoney(
        transaction.amount,
      )}`,
      occurredAt: formatKoreanDateTime(transaction.occurred_at),
      tone:
        transaction.type === 'refund'
          ? ('refund' as const)
          : ('default' as const),
    }));
}

function toReceiptPaymentDetail(
  detail: OrderPaymentReceiptDetailsDTO,
) {
  if (detail.type === 'card') {
    return {
      title: '카드 결제 정보',
      rows: [
        { label: '카드사', value: detail.card_issuer },
        { label: '카드 번호', value: detail.masked_card_number },
        { label: '승인 번호', value: detail.masked_approval_number },
        { label: '할부 기간', value: detail.installment_label },
      ],
    };
  }

  return {
    title: '현금영수증 발급 정보',
    rows: [
      { label: '발급 용도', value: detail.receipt_purpose },
      { label: '발급 수단', value: detail.masked_issuance_identifier },
      { label: '발급 일시', value: formatKoreanDateTime(detail.issued_at) },
    ],
  };
}

export function toMypageOrderReceiptDocumentListViewModel(
  order: OrderDetailViewModel,
): MypageOrderReceiptDocumentListViewModel | null {
  if (!order.paidAt) return null;

  return {
    orderNumber: order.orderNumber,
    documents: getAvailableDocumentTypes(order).map(type => ({
      type,
      ...RECEIPT_DOCUMENT_COPY[type],
      href: getMypageOrderReceiptHref(order.id, type),
    })),
  };
}

export function toMypageOrderReceiptViewModel(
  order: OrderDetailViewModel,
  transactions: readonly OrderPaymentTransactionDTO[],
  pointUsageAmount: number,
  paymentReceiptDetails: OrderPaymentReceiptDetailsDTO | null,
  type: MypageOrderReceiptDocumentType,
): MypageOrderReceiptViewModel | null {
  if (!order.paidAt || !getAvailableDocumentTypes(order).includes(type)) {
    return null;
  }

  const paidAt = order.paidAt;

  const base = {
    type,
    title: RECEIPT_DOCUMENT_COPY[type].title,
    orderInformation: toReceiptOrderInformation(order, paidAt),
  };

  switch (type) {
    case 'purchase': {
      const paymentAmounts = toReceiptPaymentAmounts(transactions);

      return {
        ...base,
        type,
        items: order.items.map(item => ({
          id: item.id,
          productName: item.productName,
          optionLabel: item.optionLabel,
          quantity: item.quantity,
          amountText: item.lineTotalText,
          statusLabel: item.cancellation ? '취소·환불' : null,
        })),
        paymentSummary: toReceiptPaymentSummary(
          order,
          pointUsageAmount,
          paymentAmounts.originalPaymentAmountText,
          paymentAmounts.refundedAmountText,
          paymentAmounts.finalPaymentAmountText,
        ),
      };
    }
    case 'card':
    case 'cash': {
      if (!paymentReceiptDetails || paymentReceiptDetails.type !== type) {
        return null;
      }

      return {
        ...base,
        type,
        paymentDetail: toReceiptPaymentDetail(paymentReceiptDetails),
        paymentTransactions: toReceiptPaymentTransactions(transactions),
      };
    }
    case 'refund': {
      const refundPaymentAmounts = toReceiptPaymentAmounts(transactions);

      return {
        ...base,
        type,
        refunds: order.refund.items.map(refund => ({
          id: refund.id,
          label:
            refund.status === 'pending' ? '환불 예정 금액' : '환불 완료 금액',
          amountText: refund.amountText,
          occurredAt: refund.description,
          status: refund.status,
        })),
        ...refundPaymentAmounts,
      };
    }
  }
}
