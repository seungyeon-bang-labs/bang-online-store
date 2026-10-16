import { redirect } from 'next/navigation';
import { signupOtpSchema } from '@/domains/auth/schema';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import { getAuthFeatureRestriction } from '@/domains/auth/feature-policy.server';
import { SignupOtpForm } from '@/features/auth/signup-otp-form';
import { ButtonLink } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string | string[] }>;
}

async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const [access, { email: requestedEmail }] = await Promise.all([
    getCurrentMemberAccess(),
    searchParams,
  ]);

  if (access.status === 'active') redirect('/');
  if (access.status === 'unavailable' || access.status === 'missing') {
    redirect('/login');
  }

  const parsed = signupOtpSchema.pick({ email: true }).safeParse({
    email: access.status === 'unverified' ? access.email : requestedEmail,
  });

  return (
    <div className="flex flex-col gap-8">
      {parsed.success ? (
        <SignupOtpForm
          key={parsed.data.email}
          email={parsed.data.email}
          restriction={getAuthFeatureRestriction('emailVerification')}
          initialMemberFailure={
            access.status === 'error'
              ? {
                  ok: false,
                  stage: 'member',
                  retryable: true,
                  message:
                    '인증 상태를 확인하지 못했습니다. 다시 시도해주세요.',
                }
              : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <p role="alert" className="text-sm">
            로그인 화면에서 이메일을 확인하고 인증을 이어가주세요.
          </p>
        </div>
      )}

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

export default VerifyEmailPage;
