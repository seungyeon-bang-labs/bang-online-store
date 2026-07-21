import type {
  MembershipTierDTO,
  PointTransactionDTO,
  UserCouponDTO,
  UserMembershipDTO,
} from './benefit.dto';

export interface MembershipTierRepository {
  findMany(): Promise<MembershipTierDTO[]>;
}

export interface UserMembershipRepository {
  findByUserId(userId: string): Promise<UserMembershipDTO | null>;
}

export interface PointTransactionRepository {
  findByUserId(userId: string): Promise<PointTransactionDTO[]>;
}

export interface UserCouponRepository {
  findByUserId(userId: string): Promise<UserCouponDTO[]>;
}
