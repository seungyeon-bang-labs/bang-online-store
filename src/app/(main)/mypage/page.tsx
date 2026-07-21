import { UserRound } from 'lucide-react';
import { getMypageDashboardViewModel } from '@/domains/mypage';
import { MypageDashboard } from '@/features/mypage/mypage-dashboard';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';

export default async function MyPageHome() {
  const dashboard = await getMypageDashboardViewModel();

  return dashboard ? (
    <MypageDashboard dashboard={dashboard} />
  ) : (
    <MypageEmptyState
      icon={UserRound}
      title="회원 정보를 확인할 수 없습니다."
      description="회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
    />
  );
}
