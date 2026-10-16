import { redirect } from 'next/navigation';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import { getAuthFeatureRestriction } from '@/domains/auth/feature-policy.server';
import { FindPasswordFlow } from '@/features/auth/find-password-flow';
import {
  requestPasswordRecoveryAction,
  verifyPasswordRecoveryOtpAction,
  resetPasswordAction,
} from './actions';

async function FindPasswordPage() {
  const access = await getCurrentMemberAccess();

  if (access.status === 'active') {
    redirect('/');
  }

  return (
    <FindPasswordFlow
      restriction={getAuthFeatureRestriction('passwordRecovery')}
      requestAction={requestPasswordRecoveryAction}
      verifyAction={verifyPasswordRecoveryOtpAction}
      resetAction={resetPasswordAction}
    />
  );
}

export default FindPasswordPage;
