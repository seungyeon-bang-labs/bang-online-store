import { requireRelation } from '@/shared/lib/data-integrity';
import { toMembershipViewModel } from './mapper';
import type {
  MembershipTierRepository,
  UserMembershipRepository,
} from './repository';
import type { MembershipViewModel } from './view-model';

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

      const sortedTiers = [...tiers].sort((a, b) => a.level - b.level);

      const currentTier = requireRelation(
        sortedTiers.find(tier => tier.id === membership.tier_id),
        'user_memberships.tier_id -> membership_tiers.id',
        membership.id,
      );
      const nextTier =
        sortedTiers
          .filter(tier => tier.level > currentTier.level)
          [0] ?? null;

      return toMembershipViewModel(
        membership,
        currentTier,
        nextTier,
        sortedTiers,
      );
    },
  };
}
