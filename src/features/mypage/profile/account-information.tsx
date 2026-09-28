import { Button } from '@/shared/components/ui/button';
import { ChevronRight } from 'lucide-react';
import type { MemberProfileViewModel } from '@/domains/member';
import { MypageFormCard, MypageFormField } from '@/features/mypage/common/form';
import { MypageCard } from '@/features/mypage/common/card';

interface AccountInformationProps {
  profile: MemberProfileViewModel;
}

const fieldLabelClassName =
  'text-xs leading-4 font-medium text-zinc-600 md:text-sm md:leading-5 md:font-bold md:text-black';

export function AccountInformation({ profile }: AccountInformationProps) {
  return (
    <MypageFormCard
      title="계정 정보"
      as="section"
      titleSize="card"
      mobileLayout="full-bleed"
    >
      <MypageCard.Body padding="flush-y" className="divide-y divide-zinc-200">
        <MypageFormField
          layout="horizontal"
          className="grid-cols-[4rem_minmax(0,1fr)] items-start gap-3 py-2.5 md:grid-cols-[120px_minmax(0,1fr)] md:items-center md:py-3"
        >
          <span className={`${fieldLabelClassName} pt-0.5 md:self-center md:pt-0`}>아이디</span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-3 md:min-h-8">
              <p className="min-w-0 truncate text-sm font-medium text-zinc-700">
                {profile.loginId}
              </p>
              <p className="ml-auto hidden shrink-0 text-xs font-medium text-zinc-500 md:block">
                아이디는 변경할 수 없습니다.
              </p>
            </div>
            <p className="mt-0.5 text-xs leading-4 font-medium text-zinc-500 md:hidden">
              아이디는 변경할 수 없습니다.
            </p>
          </div>
        </MypageFormField>
        <MypageFormField
          layout="horizontal"
          className="grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 py-2.5 md:grid-cols-[120px_minmax(0,1fr)] md:py-3"
        >
          <span className={`${fieldLabelClassName} md:self-center`}>이메일</span>
          <div className="flex min-w-0 items-center gap-2 md:min-h-8">
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <p className="min-w-0 truncate text-sm font-medium text-zinc-700">
                {profile.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="이메일 변경으로 이동"
              title="이메일 변경"
              className="ml-auto shrink-0 px-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-black md:border md:border-zinc-300 md:px-3"
            >
              <span className="hidden md:inline">이메일 변경</span>
              <ChevronRight className="size-5 md:hidden" strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </MypageFormField>
        <MypageFormField
          layout="horizontal"
          className="grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 py-2.5 md:grid-cols-[120px_minmax(0,1fr)] md:py-3"
        >
          <span className={`${fieldLabelClassName} md:self-center`}>비밀번호</span>
          <div className="flex min-w-0 items-center gap-2 md:min-h-8">
            <p className="text-sm font-medium tracking-[0.2em] text-zinc-500">
              ••••••••
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="비밀번호 변경으로 이동"
              title="비밀번호 변경"
              className="ml-auto shrink-0 px-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-black md:border md:border-zinc-300 md:px-3"
            >
              <span className="hidden md:inline">비밀번호 변경</span>
              <ChevronRight className="size-5 md:hidden" strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
        </MypageFormField>
      </MypageCard.Body>
    </MypageFormCard>
  );
}
