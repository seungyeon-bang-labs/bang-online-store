import { Crown } from 'lucide-react';
import { getMembershipViewModel } from '@/domains/benefit';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageSectionHeader,
} from '@/features/mypage/common';
import {
  MypageMembershipEvaluationGuide,
  MypageMembershipOverview,
  MypageMembershipTierBenefits,
} from '@/features/mypage/membership';

async function MembershipPage() {
  const user = await currentUserRepository.findCurrent();
  const membership = user ? await getMembershipViewModel(user.id) : null;

  if (!membership) {
    return (
      <div className="space-y-8">
        <MypageSectionHeader title="멤버십 혜택" />
        <MypageEmptyState
          icon={Crown}
          title="멤버십 정보가 없습니다."
          description="로그인 후 현재 등급과 받을 수 있는 혜택을 확인할 수 있습니다."
        />
      </div>
    );
  }

  const { currentTier, progress, membershipTiers } = membership;

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="멤버십 혜택" />

      <div className="space-y-8 md:space-y-10">
        <MypageMembershipOverview
          currentTier={currentTier}
          progress={progress}
        />
        <MypageMembershipTierBenefits membershipTiers={membershipTiers} />
        <MypageMembershipEvaluationGuide />
      </div>
    </div>
  );
}

export default MembershipPage;
