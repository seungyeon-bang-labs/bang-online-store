import { Separator } from '@/components/ui/separator';
import { ButtonLink } from '@/components/ui/button';
import { SignupForm } from '@/features/auth/signup-form';

function Page() {
  return (
    <main className="flex flex-col gap-8">
      <SignupForm />

      <Separator label="또는" />

      <div className="flex flex-col gap-3">
        <ButtonLink href="/login" variant="outline" size="xl">
          로그인 페이지로 이동
        </ButtonLink>
      </div>
    </main>
  );
}

export default Page;
