import type { PageSlice } from '@/domains/mypage/mypage-pagination';
import type { ProductCardViewModel } from '@/domains/product/product.view-model';

export interface ActivityProductViewModel {
  id: string;
  product: ProductCardViewModel;
  recordedAt: string;
}

export interface WrittenReviewViewModel {
  kind: 'written';
  id: string;
  product: ProductCardViewModel;
  rating: number;
  content: string;
  createdAt: string;
}

export interface AvailableReviewViewModel {
  kind: 'available';
  orderItemId: string;
  orderNumber: string;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  orderedAt: string;
}

export type ReviewItemViewModel =
  | WrittenReviewViewModel
  | AvailableReviewViewModel;

export type ReviewPageViewModel = PageSlice<ReviewItemViewModel>;
