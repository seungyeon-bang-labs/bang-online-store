import type { PageSlice } from '@/shared/lib/pagination';
import type { ProductCardViewModel } from '@/domains/product/product.view-model';

export interface ActivityProductViewModel {
  id: string;
  product: ProductCardViewModel;
  recordedDateKey: string;
  recordedDateLabel: string;
}

export interface RecentProductDateGroupViewModel {
  dateKey: string;
  dateLabel: string;
  items: ActivityProductViewModel[];
}

export interface RecentProductPageViewModel {
  groups: RecentProductDateGroupViewModel[];
  policyDescription: string;
}

export type WishlistPageViewModel = PageSlice<ActivityProductViewModel>;

export interface WrittenReviewViewModel {
  kind: 'written';
  id: string;
  product: ProductCardViewModel;
  optionLabel: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface AvailableReviewViewModel {
  kind: 'available';
  orderItemId: string;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  orderedAt: string;
  reviewDeadlineAt: string;
  reviewDeadlineDday: string;
}

export type ReviewItemViewModel =
  | WrittenReviewViewModel
  | AvailableReviewViewModel;

export interface ReviewPageViewModel extends PageSlice<ReviewItemViewModel> {
  availableCount: number;
}

export type ReviewFormMode = 'create' | 'edit';

export interface ReviewFormPageViewModel {
  mode: ReviewFormMode;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  initialRating: number;
  initialContent: string;
}
