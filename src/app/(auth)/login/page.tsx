import { ButtonLink } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoginForm } from '@/features/auth/login-form';
import { AccountRecoveryLinks } from '@/features/auth/account-recovery-links';

function Page() {
  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <LoginForm />
        <AccountRecoveryLinks />
      </div>

      <Separator label="또는" />
      <div className="flex flex-col gap-3">
        <ButtonLink href="/signup" variant="outline" size="xl">
          회원가입
        </ButtonLink>
      </div>
    </main>
  );
}

export default Page;
