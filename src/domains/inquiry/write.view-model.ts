import type { InquiryProductCategoryFilter } from './domain';
export interface InquiryWriteEntryContextViewModel {
  orderId: string;
  orderItemId: string;
  productId: string;
}

export interface InquiryWriteOrderItemOptionViewModel {
  id: string;
  productId: number;
  productName: string;
  thumbnailUrl: string | null;
  optionLabel: string;
  quantity: number;
}

export interface InquiryWriteOrderOptionViewModel {
  id: string;
  orderNumber: string;
  orderedAt: string;
  representativeThumbnailUrl: string | null;
  productSummary: string;
  items: readonly InquiryWriteOrderItemOptionViewModel[];
}

export interface InquiryWriteProductOptionViewModel {
  id: number;
  name: string;
  category: Exclude<InquiryProductCategoryFilter, 'all'> | 'unknown';
  thumbnailUrl: string;
  price: number;
  discountRate: number;
  discountedPrice: number;
  isSoldOut: boolean;
}

export interface InquiryWriteSelectionOptionsViewModel {
  orders: readonly InquiryWriteOrderOptionViewModel[];
  products: readonly InquiryWriteProductOptionViewModel[];
}

export interface InquiryWriteViewModel {
  entryContext: InquiryWriteEntryContextViewModel;
  selectionOptions: InquiryWriteSelectionOptionsViewModel;
}
