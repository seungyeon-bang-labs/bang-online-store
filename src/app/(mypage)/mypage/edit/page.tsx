import { UserRound } from 'lucide-react';
import { requireActiveMember } from '@/app/(auth)/require-active-member';
import { toMemberProfileViewModel } from '@/domains/member';
import { createMemberProfileRepository } from '@/domains/member/supabase-repository.server';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import {
  MypageEmptyState,
  MypagePageLayout,
  MypagePageHeader,
} from '@/features/mypage/common';
import { MypageProfileForm } from '@/features/mypage/profile';

async function EditProfilePage() {
  const member = await requireActiveMember();
  const client = await createAuthClient();
  const user = await createMemberProfileRepository(client).findById(member.id);

  return (
    <MypagePageLayout mobileSpacing="flush">
      <MypagePageHeader title="회원 정보 수정" />
      {user ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            현재는 회원 정보 조회만 가능합니다.
          </p>
          <fieldset disabled aria-label="회원 정보 조회" className="min-w-0">
            <MypageProfileForm
              key={user.id}
              profile={toMemberProfileViewModel(user)}
            />
          </fieldset>
        </div>
      ) : (
        <MypageEmptyState
          icon={UserRound}
          title="회원 정보를 확인할 수 없습니다."
          description="회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
        />
      )}
    </MypagePageLayout>
  );
}

export default EditProfilePage;
