import 'server-only';

import { redirect } from 'next/navigation';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';

export async function requireActiveMember() {
  const access = await getCurrentMemberAccess();

  switch (access.status) {
    case 'active':
      return access.member;
    case 'unverified':
      redirect(`/verify-email?email=${encodeURIComponent(access.email)}`);
    case 'unauthenticated':
    case 'missing':
    case 'unavailable':
      redirect('/login');
    case 'error':
      throw new Error('회원 정보를 확인하지 못했습니다. 다시 시도해주세요.');
  }
}
