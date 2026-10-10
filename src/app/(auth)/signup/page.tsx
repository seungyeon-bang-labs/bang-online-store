import { Separator } from '@/shared/components/ui/separator';
import { ButtonLink } from '@/shared/components/ui/button';
import { SignupFlow } from '@/features/auth/signup-flow';
import { termRepository, toSignupTerms } from '@/domains/terms';

export const dynamic = 'force-dynamic';

async function Page() {
  const terms = await termRepository.findEffective();
  const termsViewModel = toSignupTerms(terms);

  return (
    <div className="flex flex-col gap-8">
      <SignupFlow termsViewModel={termsViewModel} />

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

export default Page;
