import { toProductCardViewModel, type Product } from '@/domains/product';
import type { OrderDTO, OrderItemDTO } from '@/domains/order/dto';
import { formatKoreanDate } from '@/shared/lib/format';
import type { InquiryWriteEntryContext } from './domain';
import type {
  InquiryWriteEntryContextViewModel,
  InquiryWriteOrderOptionViewModel,
  InquiryWriteProductOptionViewModel,
  InquiryWriteSelectionOptionsViewModel,
  InquiryWriteViewModel,
} from './write.view-model';

export function toInquiryWriteViewModel({
  orders,
  items,
  products,
  entryContext,
}: {
  orders: readonly OrderDTO[];
  items: readonly OrderItemDTO[];
  products: readonly Product[];
  entryContext: InquiryWriteEntryContext | null;
}): InquiryWriteViewModel {
  return {
    entryContext: toInquiryWriteEntryContextViewModel(entryContext),
    selectionOptions: toInquiryWriteSelectionOptions({ orders, items, products }),
  };
}

function toInquiryWriteEntryContextViewModel(
  entryContext: InquiryWriteEntryContext | null,
): InquiryWriteEntryContextViewModel {
  if (!entryContext) {
    return {
      orderId: '',
      orderItemId: '',
      productId: '',
    };
  }

  if ('orderId' in entryContext) {
    return {
      orderId: entryContext.orderId,
      orderItemId: entryContext.orderItemId ?? '',
      productId: '',
    };
  }

  return {
    orderId: '',
    orderItemId: '',
    productId: String(entryContext.productId),
  };
}

function toInquiryWriteSelectionOptions({
  orders,
  items,
  products,
}: {
  orders: readonly OrderDTO[];
  items: readonly OrderItemDTO[];
  products: readonly Product[];
}): InquiryWriteSelectionOptionsViewModel {
  const itemsByOrderId = new Map<string, OrderItemDTO[]>();

  for (const item of items) {
    const orderItems = itemsByOrderId.get(item.order_id) ?? [];
    orderItems.push(item);
    itemsByOrderId.set(item.order_id, orderItems);
  }

  const productsById = new Map(products.map(product => [product.id, product]));

  const selectionOptions: InquiryWriteSelectionOptionsViewModel = {
    orders: orders.map<InquiryWriteOrderOptionViewModel>(order => {
      const orderItems = itemsByOrderId.get(order.id) ?? [];
      const representativeItem = orderItems[0];
      const representativeProduct = representativeItem
        ? productsById.get(representativeItem.product_id)
        : null;

      return {
        id: order.id,
        orderNumber: order.order_number,
        orderedAt: formatKoreanDate(order.ordered_at),
        representativeThumbnailUrl: representativeProduct
          ? toProductCardViewModel(representativeProduct).thumbnailUrl
          : null,
        productSummary: toOrderProductSummary({
          representativeProductName: representativeItem?.product_name ?? '주문 상품',
          itemCount: orderItems.length,
        }),
        items: orderItems.map(item => {
          const itemProduct = productsById.get(item.product_id);

          return {
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            thumbnailUrl: itemProduct
              ? toProductCardViewModel(itemProduct).thumbnailUrl
              : null,
            optionLabel: item.option_label,
            quantity: item.quantity,
          };
        }),
      };
    }),
    products: products.map<InquiryWriteProductOptionViewModel>(product => {
      const productCard = toProductCardViewModel(product);

      return {
        id: productCard.id,
        name: productCard.name,
        category: product.category.parent,
        thumbnailUrl: productCard.thumbnailUrl,
        price: productCard.price,
        discountRate: productCard.discountRate,
        discountedPrice: productCard.discountedPrice,
        isSoldOut: productCard.isSoldOut,
      };
    }),
  };

  return selectionOptions;
}

function toOrderProductSummary({
  representativeProductName,
  itemCount,
}: {
  representativeProductName: string;
  itemCount: number;
}) {
  return itemCount > 1
    ? `${representativeProductName} 외 ${itemCount - 1}개`
    : representativeProductName;
}
