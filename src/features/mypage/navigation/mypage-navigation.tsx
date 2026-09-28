'use client';

import { usePathname } from 'next/navigation';
import DesktopMypageNavigation from './desktop-mypage-navigation';

function MypageNavigation() {
  const pathname = usePathname();

  return <DesktopMypageNavigation pathname={pathname} />;
}

export default MypageNavigation;
