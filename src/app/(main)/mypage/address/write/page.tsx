import { MypageAddressForm } from '@/features/mypage/addresses';
import { getMypageAddressHref } from '@/shared/lib/mypage-routes';

function MypageAddressWritePage() {
  return (
    <div className="space-y-8">
      <MypageAddressForm
        mode="create"
        returnHref={getMypageAddressHref()}
      />
    </div>
  );
}

export default MypageAddressWritePage;
