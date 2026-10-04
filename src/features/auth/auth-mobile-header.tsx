'use client';

import { ChevronLeft } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ButtonLink } from '@/shared/components/ui/button';

interface AuthMobileHeaderConfig {
  title: string;
  backHref: string;
}

function resolveLoginBackHref(returnTo: string | null) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/';
  }

  return returnTo;
}

function getAuthMobileHeaderConfig(
  pathname: string,
  returnTo: string | null,
): AuthMobileHeaderConfig {
  if (pathname === '/signup') {
    return { title: '회원가입', backHref: '/login' };
  }

  if (pathname === '/find-password') {
    return { title: '비밀번호 찾기', backHref: '/login' };
  }

  return { title: '로그인', backHref: resolveLoginBackHref(returnTo) };
}

export function AuthMobileHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { title, backHref } = getAuthMobileHeaderConfig(
    pathname,
    searchParams.get('returnTo'),
  );

  return (
    <header className="sticky top-0 z-20 grid h-14 grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center border-b border-zinc-200 bg-white md:hidden">
      <ButtonLink
        href={backHref}
        aria-label="이전 페이지로"
        variant="ghost"
        size="icon-md"
        className="ml-2 justify-self-start"
      >
        <ChevronLeft className="size-5.5" strokeWidth={2} aria-hidden="true" />
      </ButtonLink>
      <h1 className="truncate text-center text-lg font-bold leading-6 text-black">
        {title}
      </h1>
      <span aria-hidden="true" />
    </header>
  );
}
