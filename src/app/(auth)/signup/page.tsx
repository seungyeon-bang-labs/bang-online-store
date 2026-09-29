import { Separator } from '@/shared/components/ui/separator';
import { ButtonLink } from '@/shared/components/ui/button';
import { SignupForm } from '@/features/auth/signup-form';

function Page() {
  return (
    <div className="flex flex-col gap-8">
      <SignupForm />

      <Separator label="또는" />

      <div className="flex flex-col gap-3">
        <ButtonLink href="/login" variant="outline" size="xl">
          로그인 페이지로 이동
        </ButtonLink>
      </div>
    </div>
  );
}

export default Page;
