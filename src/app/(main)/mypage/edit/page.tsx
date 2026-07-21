import { UserRound } from 'lucide-react';
import {
  currentUserRepository,
  toMemberProfileViewModel,
} from '@/domains/member';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';
import { MypageProfileForm } from '@/features/mypage/mypage-profile-form';
import { MypageSectionHeader } from '@/features/mypage/mypage-section-header';

async function EditProfilePage() {
  const user = await currentUserRepository.findCurrent();

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="회원 정보 수정"
        description="이름, 연락처, 이메일 등 기본 회원 정보를 관리할 수 있습니다."
      />
      {user ? (
        <MypageProfileForm profile={toMemberProfileViewModel(user)} />
      ) : (
        <MypageEmptyState
          icon={UserRound}
          title="회원 정보를 확인할 수 없습니다."
          description="회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        />
      )}
    </div>
  );
}

export default EditProfilePage;
