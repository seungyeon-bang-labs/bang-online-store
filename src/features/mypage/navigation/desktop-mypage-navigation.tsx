'use client';

import { MYPAGE_HOME, MYPAGE_MENU_SECTIONS } from './mypage-menu';
import { MypageNavigationLink } from './mypage-navigation-link';

interface DesktopMypageNavigationProps {
  pathname: string;
}

function DesktopMypageNavigation({ pathname }: DesktopMypageNavigationProps) {
  return (
    <aside className="hidden shrink-0 md:block md:w-44">
      <nav
        aria-label="마이페이지 메뉴"
        className="rounded-md border border-zinc-200 bg-white p-3 md:sticky md:top-28"
      >
        <MypageNavigationLink
          pathname={pathname}
          item={MYPAGE_HOME}
        />

        <div className="mt-6 space-y-6">
          {MYPAGE_MENU_SECTIONS.map(section => (
            <div key={section.title} className="space-y-2">
              <h3 className="px-3 text-sm font-black tracking-[0.14em] text-zinc-400">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-1">
                {section.items.map(item => (
                  <li key={item.href}>
                    <MypageNavigationLink
                      pathname={pathname}
                      item={item}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

export default DesktopMypageNavigation;
