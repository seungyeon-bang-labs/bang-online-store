import { requireMypageRelation } from '@/domains/mypage/mypage-data-integrity.error';
import { toMembershipViewModel } from './benefit.mapper';
import type {
  MembershipTierRepository,
  UserMembershipRepository,
} from './benefit.repository';
import type { MembershipViewModel } from './benefit.view-model';

export interface MembershipServiceDependencies {
  membershipTierRepository: MembershipTierRepository;
  userMembershipRepository: UserMembershipRepository;
}

export interface MembershipService {
  getMembershipViewModel(
    userId: string,
  ): Promise<MembershipViewModel | null>;
}

export function createMembershipService({
  membershipTierRepository,
  userMembershipRepository,
}: MembershipServiceDependencies): MembershipService {
  return {
    async getMembershipViewModel(userId) {
      const [membership, tiers] = await Promise.all([
        userMembershipRepository.findByUserId(userId),
        membershipTierRepository.findMany(),
      ]);
      if (!membership) return null;

      const currentTier = requireMypageRelation(
        tiers.find(tier => tier.id === membership.tier_id),
        'user_memberships.tier_id -> membership_tiers.id',
        membership.id,
      );
      const nextTier =
        tiers
          .filter(tier => tier.level > currentTier.level)
          .sort((a, b) => a.level - b.level)[0] ?? null;

      return toMembershipViewModel(
        membership,
        currentTier,
        nextTier,
        tiers,
      );
    },
  };
}
