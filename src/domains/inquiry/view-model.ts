import type { StatusViewModel } from '@/shared/types/status';
import type { ProductCardViewModel } from '@/domains/product/product.view-model';

export type InquiryContextViewModel =
  | {
      kind: 'order';
      product: ProductCardViewModel;
      productCount: number;
      representativeOptionLabel: string | null;
    }
  | {
      kind: 'product';
      product: ProductCardViewModel;
      optionLabel: string | null;
    };

export interface InquiryViewModel {
  id: string;
  typeLabel: string;
  title: string;
  content: string;
  context: InquiryContextViewModel | null;
  status: StatusViewModel;
  actions: {
    canEdit: boolean;
    canCancel: boolean;
  };
  answerContent: string | null;
  answeredAt: string | null;
  createdAt: string;
}
