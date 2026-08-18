import {
  toProductCardViewModel,
  toProductColorViewModels,
  type Product,
} from '@/domains/product';
import {
  formatKoreanDate,
  formatKoreanMoney,
} from '@/shared/lib/format';
import type { StatusViewModel } from '@/shared/types/status';
import {
  isOrderClaimProgressStageForType,
  type OrderClaimRequestUnavailableReason,
} from './domain';
import type {
  OrderClaimDTO,
  OrderClaimProgressStage,
  OrderClaimStatus,
  OrderClaimType,
  OrderDTO,
  OrderItemDTO,
} from './dto';
import type {
  OrderClaimRequestViewModel,
  OrderClaimViewModel,
} from './view-model';

const ORDER_CLAIM_TYPE_VIEW: Record<OrderClaimType, StatusViewModel> = {
  exchange: { label: '교환', tone: 'info' },
  return: { label: '반품', tone: 'warning' },
};

const ORDER_CLAIM_STATUS_VIEW: Record<OrderClaimStatus, StatusViewModel> = {
  requested: { label: '신청', tone: 'warning' },
  processing: { label: '처리중', tone: 'info' },
  completed: { label: '처리완료', tone: 'success' },
  rejected: { label: '반려', tone: 'danger' },
};

const ORDER_CLAIM_PROGRESS_STAGE_VIEW: Record<
  OrderClaimProgressStage,
  StatusViewModel
> = {
  collection_scheduled: { label: '회수 예정', tone: 'warning' },
  collection_completed: { label: '회수 완료', tone: 'info' },
  inspecting: { label: '검수 중', tone: 'info' },
  exchange_preparing_shipment: { label: '교환 상품 배송 준비', tone: 'info' },
  exchange_shipping: { label: '교환 상품 배송 중', tone: 'info' },
  refund_processing: { label: '환불 처리 중', tone: 'info' },
};

export const toOrderClaimTypeViewModel = (
  type: OrderClaimType,
): StatusViewModel => ORDER_CLAIM_TYPE_VIEW[type];

export const toOrderClaimStatusViewModel = (
  status: OrderClaimStatus,
): StatusViewModel => ORDER_CLAIM_STATUS_VIEW[status];

function toOrderClaimDisplayStatusViewModel(
  claim: OrderClaimDTO,
): StatusViewModel {
  if (
    claim.progress_stage &&
    isOrderClaimProgressStageForType(claim.claim_type, claim.progress_stage)
  ) {
    const progressStage = ORDER_CLAIM_PROGRESS_STAGE_VIEW[claim.progress_stage];
    const shouldPrefixType =
      claim.progress_stage === 'collection_scheduled' ||
      claim.progress_stage === 'collection_completed' ||
      claim.progress_stage === 'inspecting';

    return {
      ...progressStage,
      label: shouldPrefixType
        ? `${toOrderClaimTypeViewModel(claim.claim_type).label} ${progressStage.label}`
        : progressStage.label,
    };
  }

  const type = toOrderClaimTypeViewModel(claim.claim_type);
  const status = toOrderClaimStatusViewModel(claim.status);

  return {
    ...status,
    label:
      claim.status === 'completed'
        ? `${type.label} 완료`
        : `${type.label} ${status.label}`,
  };
}

export function toOrderClaimViewModel(
  claim: OrderClaimDTO,
  order: OrderDTO,
  item: OrderItemDTO,
  product: Product,
): OrderClaimViewModel {
  const status = toOrderClaimDisplayStatusViewModel(claim);

  return {
    id: claim.id,
    orderNumber: order.order_number,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    lineTotalText: formatKoreanMoney(item.line_total_amount),
    status,
    reason: claim.reason,
    requestedAt: formatKoreanDate(claim.requested_at),
    completedAt: claim.completed_at
      ? formatKoreanDate(claim.completed_at)
      : null,
  };
}

export function toOrderClaimRequestViewModel({
  order,
  item,
  product,
  groupProducts,
  unavailableReason,
}: {
  order: OrderDTO;
  item: OrderItemDTO;
  product: Product;
  groupProducts: Product[];
  unavailableReason: OrderClaimRequestUnavailableReason | null;
}): OrderClaimRequestViewModel {
  const productColors = toProductColorViewModels(groupProducts);

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    orderedAt: formatKoreanDate(order.ordered_at),
    orderItemId: item.id,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    quantity: item.quantity,
    itemAmount: item.line_total_amount,
    itemAmountText: formatKoreanMoney(item.line_total_amount),
    collectionAddressText: order.shipping_address_text,
    isEligible: unavailableReason === null,
    unavailableReason,
    currentProductId: product.id,
    currentVariantId: item.variant_id,
    currentVariantLabel:
      product.variants.find(variant => variant.id === item.variant_id)?.size ??
      item.option_label.split('/').at(-1)?.trim() ??
      '',
    exchangeColorOptions: groupProducts.map(productItem => {
      const color = productColors.find(
        productColor => productColor.id === productItem.id,
      );

      return {
        productId: productItem.id,
        label: color?.label ?? '기본',
        hex: color?.hex ?? '#000000',
        variants: productItem.variants.map(variant => ({
          id: variant.id,
          label: variant.size,
          isAvailable: variant.stock > 0,
          stock: variant.stock,
          unitAmount: productItem.price + variant.price_offset,
        })),
      };
    }),
  };
}
