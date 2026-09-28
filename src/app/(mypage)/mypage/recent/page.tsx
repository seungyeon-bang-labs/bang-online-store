import { Clock3 } from 'lucide-react';
import {
  getRecentProductPageViewModel,
  getRecentProductPolicyDescription,
} from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypagePageLayout,
  MypagePolicyCard,
  MypagePageHeader,
} from '@/features/mypage/common';
import { MypageRecentProductList } from '@/features/mypage/activity';

async function RecentProductsPage() {
  const user = await currentUserRepository.findCurrent();
  const recentProductPageViewModel = user
    ? await getRecentProductPageViewModel(user.id)
    : null;

  const { groups, policyDescription } = recentProductPageViewModel ?? {
    groups: [],
    policyDescription: getRecentProductPolicyDescription(),
  };
  const hasRecentProducts = groups.length > 0;

  return (
    <MypagePageLayout fill={!hasRecentProducts}>
      <MypagePageHeader title="최근 본 상품" />
      <MypagePolicyCard items={[policyDescription]} />
      {hasRecentProducts ? (
        <MypageRecentProductList groups={groups} />
      ) : (
        <MypageEmptyState
          icon={Clock3}
          title="최근 본 상품이 없습니다."
          description="상품 상세 페이지를 확인하면 최근 본 상품으로 기록됩니다."
          action={{ href: '/new', label: '상품 보러 가기' }}
          fill
        />
      )}
    </MypagePageLayout>
  );
}

export default RecentProductsPage;
