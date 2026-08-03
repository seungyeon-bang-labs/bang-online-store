export type PointTransactionType = 'earn' | 'use' | 'expire';
export type UserCouponStatus = 'available' | 'used' | 'expired';
export type MembershipTierCode =
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM';

export interface MembershipTierDTO {
  id: string;
  code: MembershipTierCode;
  name: string;
  level: number;
  min_purchase_amount: number;
  point_rate_percent: number;
  benefit_summary: string;
  created_at: string;
  updated_at: string;
}

export interface UserMembershipDTO {
  id: string;
  user_id: string;
  tier_id: string;
  evaluation_purchase_amount: number;
  started_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PointTransactionDTO {
  id: string;
  user_id: string;
  transaction_type: PointTransactionType;
  amount: number;
  order_id: string | null;
  review_id: string | null;
  description: string;
  occurred_at: string;
  expires_at: string | null;
}

export interface UserCouponDTO {
  id: string;
  user_id: string;
  coupon_id: number;
  status: UserCouponStatus;
  issued_at: string;
  expires_at: string;
  used_at: string | null;
  order_id: string | null;
}
