import { UserRound } from 'lucide-react';
import { getMypageHomeViewModel } from '@/domains/mypage';
import { currentUserRepository } from '@/domains/member';
import {
  MypageHomeOrders,
  MypageHomeMenuGrid,
  MypageHomeRecentProducts,
  MypageHomeSummary,
  MypageHomeWishlist,
} from '@/features/mypage/home';
import { MypageEmptyState, MypagePageLayout } from '@/features/mypage/common';

async function MyPageHome() {
  const user = await currentUserRepository.findCurrent();

  if (!user) {
    return (
      <MypageEmptyState
        icon={UserRound}
        title="회원 정보를 확인할 수 없습니다."
        description="회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        fill
      />
    );
  }

  const home = await getMypageHomeViewModel(user);
  const {
    summary,
    orderStatuses,
    recentOrders,
    recentProducts,
    wishlistProducts,
  } = home;

  return (
    <MypagePageLayout spacing="relaxed" mobileSpacing="flush">
      <MypageHomeSummary summary={summary} />
      <MypageHomeMenuGrid />
      <MypageHomeOrders statuses={orderStatuses} orders={recentOrders} />
      <MypageHomeRecentProducts items={recentProducts} />
      <MypageHomeWishlist items={wishlistProducts} />
    </MypagePageLayout>
  );
}

export default MyPageHome;
