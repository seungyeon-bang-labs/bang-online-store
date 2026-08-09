import { Button } from '@/components/ui/button';
import type { MemberProfileViewModel } from '@/domains/member';

const fieldLabelClassName = 'text-sm font-black text-black';
const fieldRowClassName = 'grid gap-3 md:grid-cols-[120px_1fr] md:items-center';

interface AccountInformationProps {
  profile: MemberProfileViewModel;
}

export function AccountInformation({ profile }: AccountInformationProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="px-5 py-4 md:px-6">
        <h2 className="text-base font-black text-black">계정 정보</h2>
      </header>
      <div className="divide-y divide-zinc-200 border-t border-zinc-300 px-5 md:px-6">
        <div className={`${fieldRowClassName} py-4`}>
          <span className={fieldLabelClassName}>아이디</span>
          <p className="text-sm font-medium text-zinc-700">
            {profile.loginId}
          </p>
        </div>
        <div className={`${fieldRowClassName} py-4`}>
          <div className="flex items-center justify-between gap-3">
            <span className={fieldLabelClassName}>이메일</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-7 border-zinc-300 px-2.5 text-sm font-bold shadow-none hover:border-black hover:bg-black hover:text-white md:hidden"
            >
              변경
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-zinc-700">
                {profile.email}
              </p>
              {profile.isEmailVerified && (
                <span className="rounded-sm bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-600">
                  인증 완료
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden shrink-0 border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white md:inline-flex"
            >
              변경
            </Button>
          </div>
        </div>
        <div className={`${fieldRowClassName} py-4`}>
          <div className="flex items-center justify-between gap-3">
            <span className={fieldLabelClassName}>비밀번호</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="h-7 border-zinc-300 px-2.5 text-sm font-bold shadow-none hover:border-black hover:bg-black hover:text-white md:hidden"
            >
              변경
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium tracking-[0.2em] text-zinc-500">
              ••••••••
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden shrink-0 border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white md:inline-flex"
            >
              변경
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
