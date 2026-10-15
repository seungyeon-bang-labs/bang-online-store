import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

const schemas = loadTs('src/domains/auth/schema.ts');
const signup = password => ({ name: '회원', phone_number: '01012345678', email: 'visitor@example.com', password, confirmPassword: password, agreements: {} });

test('reset and signup preserve the same password boundary rules without transforming passwords', () => {
  assert.ok(schemas.passwordSchema, 'shared password schema must exist');
  for (const password of ['Password!1', 'abcdefgh1', 'a1'.repeat(10), 'abcde!fg']) {
    assert.equal(schemas.passwordSchema.parse(password), password);
    assert.equal(schemas.createSignupFormSchema([]).safeParse(signup(password)).success, true);
  }
  for (const password of ['', 'Abc123!', 'a1'.repeat(10) + 'a', 'abcdefgh', '12345678', '!!!!!!!!', 'Pass word1', ' Password1', 'Password1 ', '비밀번호123!']) {
    assert.equal(schemas.passwordSchema.safeParse(password).success, false, password);
    assert.equal(schemas.createSignupFormSchema([]).safeParse(signup(password)).success, false, password);
  }
});
test('password confirmation mismatch belongs to confirmPassword', () => {
  assert.ok(schemas.resetPasswordFormSchema);
  const result = schemas.resetPasswordFormSchema.safeParse({ password: 'Password!1', confirmPassword: 'Password!2' });
  assert.equal(result.success, false);
  assert.deepEqual(result.error.issues[0].path, ['confirmPassword']);
});
test('recovery accepts exactly six digits and normalizes only email whitespace', () => {
  assert.ok(schemas.passwordRecoveryOtpSchema);
  assert.deepEqual(schemas.passwordRecoveryOtpSchema.parse({ email: ' visitor@example.com ', token: '123456' }), { email: 'visitor@example.com', token: '123456' });
  for (const token of ['12345', '1234567', 'abcdef', ' 123456', '１２３４５６']) {
    assert.equal(schemas.passwordRecoveryOtpSchema.safeParse({ email: 'visitor@example.com', token }).success, false);
  }
  assert.equal(schemas.PASSWORD_RECOVERY_OTP_LENGTH, 6);
  assert.equal(schemas.PASSWORD_RECOVERY_DURATION_SECONDS, 300);
});
test('email request trims surrounding whitespace and rejects missing or invalid input', () => {
  assert.deepEqual(schemas.findPasswordFormSchema.parse({ email: ' visitor@example.com ' }), { email: 'visitor@example.com' });
  for (const email of ['', ' ', 'invalid']) assert.equal(schemas.findPasswordFormSchema.safeParse({ email }).success, false);
});
