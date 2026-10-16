import 'server-only';

import type { AuthFeatureRestriction } from './schema';

const restrictionMessages = {
  signup: '데모 환경에서는 회원가입을 이용할 수 없습니다.',
  emailVerification: '데모 환경에서는 이메일 인증을 진행할 수 없습니다.',
  passwordRecovery: '데모 환경에서는 비밀번호를 재설정할 수 없습니다.',
};

export function getAuthFeatureRestriction(
  feature: keyof typeof restrictionMessages,
): AuthFeatureRestriction | null {
  if (process.env.AUTH_FEATURES_ENABLED === 'true') return null;

  return { reason: 'feature_disabled', message: restrictionMessages[feature] };
}
