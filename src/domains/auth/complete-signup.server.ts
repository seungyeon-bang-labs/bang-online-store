import 'server-only';

import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { createAdminClient } from '@/shared/lib/supabase/admin';
import { signupDetailsSchema } from './schema';

type CompletionResult = {
  ok: boolean;
  message: string;
};

export async function completeCurrentSignup(
  input?: unknown,
): Promise<CompletionResult> {
  const authClient = await createAuthClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      message: '인증 정보를 확인할 수 없습니다. 다시 시도해주세요.',
    };
  }

  if (!user.email || !user.email_confirmed_at) {
    return { ok: false, message: '이메일 인증이 필요합니다.' };
  }

  // 이미 가입 완료한 회원은 메타데이터를 다시 검사하지 않습니다.
  const { data: member, error: memberError } = await authClient
    .from('users')
    .select('id, status, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  if (memberError) {
    return { ok: false, message: '회원 정보를 확인하지 못했습니다.' };
  }

  if (member) {
    if (member.status !== 'active' || member.deleted_at) {
      return { ok: false, message: '이용할 수 없는 회원 계정입니다.' };
    }

    return { ok: true, message: '가입이 완료되었습니다.' };
  }

  const parsed = signupDetailsSchema.safeParse(input ?? user.user_metadata);

  if (!parsed.success) {
    return {
      ok: false,
      message: '이름, 휴대폰 번호와 약관 동의를 다시 확인해주세요.',
    };
  }

  const adminClient = await createAdminClient();

  const { error } = await adminClient.rpc('complete_signup', {
    p_user_id: user.id,
    p_email: user.email,
    p_name: parsed.data.name,
    p_phone_number: parsed.data.phone_number,
    p_agreements: parsed.data.agreed_term_ids.map(termId => ({
      termId,
      agreed: true,
    })),
  });

  if (error) {
    return {
      ok: false,
      message: error.message.includes('SIGNUP_TERMS_CHANGED')
        ? '약관이 변경되었습니다. 최신 약관을 확인해주세요.'
        : '가입을 완료하지 못했습니다. 입력값을 확인하고 다시 시도해주세요.',
    };
  }

  return { ok: true, message: '가입이 완료되었습니다.' };
}
