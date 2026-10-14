import { ButtonLink } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { LoginForm } from '@/features/auth/login-form';
import { AuthSecondaryLink } from '@/features/auth/auth-secondary-link';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import { redirect } from 'next/navigation';

async function LoginPage() {
  const access = await getCurrentMemberAccess();

  if (access.status === 'active') {
    redirect('/');
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <LoginForm />
        <AuthSecondaryLink />
      </div>

      <Separator label="또는" />
      <div className="flex flex-col gap-3">
        <ButtonLink href="/signup" variant="outline" size="xl">
          회원가입
        </ButtonLink>
      </div>
    </div>
  );
};

export default LoginPage;
