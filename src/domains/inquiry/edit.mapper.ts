import type { InquiryDTO } from './dto';
import type { InquiryWriteEntryContext } from './domain';
import type { InquiryEditViewModel } from './edit.view-model';
import type { InquiryWriteViewModel } from './write.view-model';

export function toInquiryEditViewModel(
  inquiry: InquiryDTO,
  writeViewModel: InquiryWriteViewModel,
): InquiryEditViewModel {
  return {
    ...writeViewModel,
    inquiry: {
      id: inquiry.id,
      type: inquiry.inquiry_type,
      title: inquiry.title,
      content: inquiry.content,
    },
  };
}

export function toInquiryEditEntryContext(
  inquiry: Pick<
    InquiryDTO,
    'order_id' | 'order_item_id' | 'product_id'
  >,
): InquiryWriteEntryContext | null {
  if (inquiry.order_id) {
    return {
      orderId: inquiry.order_id,
      ...(inquiry.order_item_id ? { orderItemId: inquiry.order_item_id } : {}),
    };
  }

  return inquiry.product_id ? { productId: inquiry.product_id } : null;
}
