import { MypageLoadingState, MypagePageLayout } from '@/features/mypage/common';

function MypageLoading() {
  return (
    <MypagePageLayout>
      <MypageLoadingState />
    </MypagePageLayout>
  );
}

export default MypageLoading;
