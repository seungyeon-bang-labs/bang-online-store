import type {
  OrderDetailPaymentViewModel,
  OrderDetailViewModel,
} from '@/domains/order';

export interface MypageOrderPointBenefitViewModel {
  type: 'purchase' | 'review';
  label: string;
  amountText: string;
}

export interface MypageOrderDetailPaymentViewModel
  extends OrderDetailPaymentViewModel {
  pointUsageAmountText: string | null;
}

export interface MypageOrderDetailViewModel {
  order: Omit<OrderDetailViewModel, 'payment'>;
  payment: MypageOrderDetailPaymentViewModel;
  pointBenefits: MypageOrderPointBenefitViewModel[];
}
