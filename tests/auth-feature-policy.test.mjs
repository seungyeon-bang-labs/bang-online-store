import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

test('auth features allow only an explicit true and return feature-specific restrictions otherwise', () => {
  const previous = process.env.AUTH_FEATURES_ENABLED;
  try {
    const { getAuthFeatureRestriction } = loadTs('src/domains/auth/feature-policy.server.ts');
    const messages = {
      signup: '데모 환경에서는 회원가입을 이용할 수 없습니다.',
      emailVerification: '데모 환경에서는 이메일 인증을 진행할 수 없습니다.',
      passwordRecovery: '데모 환경에서는 비밀번호를 재설정할 수 없습니다.',
    };
    process.env.AUTH_FEATURES_ENABLED = 'true';
    for (const feature of Object.keys(messages)) {
      assert.equal(getAuthFeatureRestriction(feature), null);
    }
    for (const value of [undefined, '', 'false', 'TRUE', ' true ', '1']) {
      if (value === undefined) delete process.env.AUTH_FEATURES_ENABLED;
      else process.env.AUTH_FEATURES_ENABLED = value;
      for (const [feature, message] of Object.entries(messages)) {
        assert.deepEqual(getAuthFeatureRestriction(feature), {
          reason: 'feature_disabled', message,
        });
      }
    }
  } finally {
    if (previous === undefined) delete process.env.AUTH_FEATURES_ENABLED;
    else process.env.AUTH_FEATURES_ENABLED = previous;
  }
});
