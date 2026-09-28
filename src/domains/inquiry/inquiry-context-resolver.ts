import { requireRelation } from '@/shared/lib/data-integrity';
import type { OrderDTO, OrderItemDTO } from '@/domains/order/dto';
import type { Product } from '@/domains/product/product.dto';
import { toProductCardViewModel } from '@/domains/product/product.presenter';
import type { InquiryDTO } from './dto';
import type { InquiryContextViewModel } from './view-model';

interface InquiryContextResolverDependencies {
  orderById: ReadonlyMap<string, OrderDTO>;
  itemById: ReadonlyMap<string, OrderItemDTO>;
  itemsByOrderId: ReadonlyMap<string, readonly OrderItemDTO[]>;
  productById: ReadonlyMap<number, Product>;
}

export interface InquiryContextResolver {
  resolve(inquiry: InquiryDTO): InquiryContextViewModel | null;
}

export function createInquiryContextResolver({
  orderById,
  itemById,
  itemsByOrderId,
  productById,
}: InquiryContextResolverDependencies): InquiryContextResolver {
  function resolve(inquiry: InquiryDTO): InquiryContextViewModel | null {
    const inquiryOrderItem = inquiry.order_item_id
      ? requireRelation(
          itemById.get(inquiry.order_item_id),
          'inquiries.order_item_id -> order_items.id',
          inquiry.id,
        )
      : null;

    if (inquiry.order_id) {
      const order = requireRelation(
        orderById.get(inquiry.order_id),
        'inquiries.order_id -> orders.id',
        inquiry.id,
      );
      const orderItems = requireRelation(
        itemsByOrderId.get(order.id),
        'inquiries.order_id -> order_items.order_id',
        inquiry.id,
      );
      const representativeItem = orderItems[0];

      return {
        kind: 'order',
        orderId: order.id,
        product: toProductCardViewModel(
          requireRelation(
            productById.get(representativeItem.product_id),
            'order_items.product_id -> products.id',
            representativeItem.id,
          ),
        ),
        productCount: orderItems.length,
        representativeOptionLabel: representativeItem.option_label,
      };
    }

    if (inquiry.product_id) {
      return {
        kind: 'product',
        product: toProductCardViewModel(
          requireRelation(
            productById.get(inquiry.product_id),
            'inquiries.product_id -> products.id',
            inquiry.id,
          ),
        ),
        optionLabel: inquiryOrderItem?.option_label ?? null,
      };
    }

    return null;
  }

  return { resolve };
}
