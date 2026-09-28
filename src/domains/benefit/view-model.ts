import type { StatusViewModel } from '@/shared/types/status';
import type {
  MembershipTierCode,
  UserCouponStatus,
} from './dto';

export interface MembershipCurrentTierViewModel {
  currentTierName: string;
  currentTierCode: MembershipTierCode;
  benefitSummary: string;
}

export interface MembershipProgressViewModel {
  evaluationPurchaseText: string;
  periodText: string;
  nextTierName: string | null;
  remainingAmountText: string | null;
  progressPercent: number;
}

export interface MembershipTierViewModel {
  id: string;
  name: string;
  minPurchaseText: string;
  pointRateText: string;
  benefitSummary: string;
  isCurrent: boolean;
}

export interface MembershipViewModel {
  currentTier: MembershipCurrentTierViewModel;
  progress: MembershipProgressViewModel;
  membershipTiers: MembershipTierViewModel[];
}

export interface PointTransactionViewModel {
  id: string;
  type: StatusViewModel;
  description: string;
  orderId: string | null;
  amountText: string;
  isDeduction: boolean;
  occurredDate: string;
  occurredTime: string;
  expirationText: string;
}

export interface PointSummaryViewModel {
  balanceText: string;
  earnedThisMonthText: string;
  expiringDateText: string | null;
  expiringText: string;
}

export interface PointDateGroupViewModel {
  date: string;
  transactions: PointTransactionViewModel[];
}

export interface PointTransactionListViewModel {
  dateGroups: PointDateGroupViewModel[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  unfilteredItemCount: number;
}

export interface PointPageViewModel {
  summary: PointSummaryViewModel;
  transactionList: PointTransactionListViewModel;
}

export interface UserCouponViewModel {
  id: string;
  name: string;
  statusCode: UserCouponStatus;
  status: StatusViewModel;
  discountText: string;
  conditionText: string;
  expiresAt: string;
}

export interface UserCouponListViewModel {
  coupons: UserCouponViewModel[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  unfilteredItemCount: number;
}
