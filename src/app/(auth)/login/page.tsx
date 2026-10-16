import { ButtonLink } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import { LoginForm } from '@/features/auth/login-form';
import { LogoutButton } from '@/features/auth/logout-button';
import { AuthSecondaryLink } from '@/features/auth/auth-secondary-link';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import { getAuthFeatureRestriction } from '@/domains/auth/feature-policy.server';
import { redirect } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';

async function LoginPage() {
  const access = await getCurrentMemberAccess();

  if (access.status === 'active') {
    redirect('/');
  }

  if (access.status === 'missing' || access.status === 'unavailable') {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">계정 이용 안내</h2>
        <p role="alert" className="text-sm text-destructive">
          현재 계정으로 서비스를 이용할 수 없습니다. 로그아웃한 후 다른 계정으로
          로그인해주세요.
        </p>
        <LogoutButton logoutAction={logoutAction} />
      </div>
    );
  }

  const demoAccount = getAuthFeatureRestriction('signup')
    ? { email: 'demo@example.com', password: 'demoexample123' }
    : undefined;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <LoginForm demoAccount={demoAccount} />
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
}

export default LoginPage;
