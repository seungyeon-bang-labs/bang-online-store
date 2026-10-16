import { Separator } from '@/shared/components/ui/separator';
import { ButtonLink } from '@/shared/components/ui/button';
import { SignupFlow } from '@/features/auth/signup-flow';
import { termRepository, toSignupTerms } from '@/domains/terms';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import { getAuthFeatureRestriction } from '@/domains/auth/feature-policy.server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function SignupPage() {
  const [access, terms] = await Promise.all([
    getCurrentMemberAccess(),
    termRepository.findEffective(),
  ]);

  if (access.status === 'active') {
    redirect('/');
  }

  const termsViewModel = toSignupTerms(terms);

  return (
    <div className="flex flex-col gap-8">
      <SignupFlow
        termsViewModel={termsViewModel}
        restriction={getAuthFeatureRestriction('signup')}
      />

      <div className="hidden flex-col gap-8 md:flex">
        <Separator label="또는" />

        <div className="flex flex-col gap-3">
          <ButtonLink href="/login" variant="outline" size="xl">
            로그인 페이지로 이동
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
