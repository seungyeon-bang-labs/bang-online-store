'use client';

import { usePathname } from 'next/navigation';
import DesktopMypageNavigation from './desktop-mypage-navigation';
import MobileMypageNavigation from './mobile-mypage-navigation';

function MypageNavigation() {
  const pathname = usePathname();

  return (
    <>
      <MobileMypageNavigation pathname={pathname} />
      <DesktopMypageNavigation pathname={pathname} />
    </>
  );
}

export default MypageNavigation;
