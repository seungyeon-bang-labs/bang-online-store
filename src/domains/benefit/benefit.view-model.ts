import type { PageSlice } from '@/domains/mypage/mypage-pagination';
import type { StatusViewModel } from '@/domains/mypage/mypage-status.view-model';
import type {
  MembershipTierCode,
  UserCouponStatus,
} from './benefit.dto';

export interface MembershipViewModel {
  currentTierName: string;
  currentTierCode: MembershipTierCode;
  pointRateText: string;
  benefitSummary: string;
  evaluationPurchaseText: string;
  periodText: string;
  nextTierName: string | null;
  remainingAmountText: string | null;
  progressPercent: number;
  tiers: Array<{
    id: string;
    name: string;
    minPurchaseText: string;
    pointRateText: string;
    benefitSummary: string;
    isCurrent: boolean;
  }>;
}

export interface PointTransactionViewModel {
  id: string;
  type: StatusViewModel;
  description: string;
  amountText: string;
  occurredAt: string;
  expiresAt: string | null;
}

export interface PointPageViewModel
  extends PageSlice<PointTransactionViewModel> {
  balanceText: string;
  earnedThisMonthText: string;
  expiringText: string;
}

export interface UserCouponViewModel {
  id: string;
  name: string;
  statusCode: UserCouponStatus;
  status: StatusViewModel;
  discountText: string;
  conditionText: string;
  expiresAt: string;
  usedAt: string | null;
}

export type UserCouponPageViewModel = PageSlice<UserCouponViewModel>;
