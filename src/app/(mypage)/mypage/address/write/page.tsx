import { MypageAddressForm } from '@/features/mypage/addresses';
import { MypagePageLayout } from '@/features/mypage/common';
import { getMypageAddressHref } from '@/shared/lib/mypage-routes';
import { createMypageAddressAction } from '../actions';

function MypageAddressWritePage() {
  return (
    <MypagePageLayout mobileSpacing="flush">
      <MypageAddressForm
        mode="create"
        returnHref={getMypageAddressHref()}
        onCreateAddress={createMypageAddressAction}
      />
    </MypagePageLayout>
  );
}

export default MypageAddressWritePage;
