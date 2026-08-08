import { Clock3 } from 'lucide-react';
import {
  getRecentProductPageViewModel,
  getRecentProductPolicyDescription,
} from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageSectionHeader,
} from '@/features/mypage/common';
import {
  MypageRecentProductList,
  MypageRecentProductPolicy,
} from '@/features/mypage/activity';

async function RecentProductsPage() {
  const user = await currentUserRepository.findCurrent();
  const recentProductPageViewModel = user
    ? await getRecentProductPageViewModel(user.id)
    : null;

  const { groups, policyDescription } = recentProductPageViewModel ?? {
    groups: [],
    policyDescription: getRecentProductPolicyDescription(),
  };

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="최근 본 상품" />
      <MypageRecentProductPolicy description={policyDescription} />
      {groups.length > 0 ? (
        <MypageRecentProductList groups={groups} />
      ) : (
        <MypageEmptyState
          icon={Clock3}
          title="최근 본 상품이 없습니다."
          description="상품 상세 페이지를 확인하면 최근 본 상품으로 기록됩니다."
        />
      )}
    </div>
  );
}

export default RecentProductsPage;
