import { redirect } from 'next/navigation';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import { ButtonLink } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { AuthSecondaryLink } from '@/features/auth/auth-secondary-link';
import { FindPasswordForm } from '@/features/auth/find-password-form';

async function FindPasswordPage() {
  const access = await getCurrentMemberAccess();

  if (access.status === 'active') {
    redirect('/');
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <FindPasswordForm />
        <AuthSecondaryLink variant="password" />
      </div>

      <div className="hidden flex-col gap-8 md:flex">
        <Separator label="또는" />
        <ButtonLink href="/login" variant="outline" size="xl">
          로그인 페이지로 이동
        </ButtonLink>
      </div>
    </div>
  );
}

export default FindPasswordPage;
