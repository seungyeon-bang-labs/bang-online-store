'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageTitle } from '@/components/common/page-title';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import { ChevronDown, Package, Ticket, Star, User } from 'lucide-react';

const MY_PAGE_MENU = [
  {
    title: '주문 관리',
    en: 'Order',
    icon: <Package className="size-4" />,
    items: [
      { label: '주문/배송 조회', href: '/mypage/orders' },
      { label: '취소/교환/반품 내역', href: '/mypage/returns' },
    ],
  },
  {
    title: '혜택 관리',
    en: 'Benefits',
    icon: <Ticket className="size-4" />,
    items: [
      { label: '멤버십 혜택', href: '/mypage/membership' },
      { label: '적립금 내역', href: '/mypage/points' },
      { label: '쿠폰함', href: '/mypage/coupons' },
    ],
  },
  {
    title: '활동 관리',
    en: 'Activity',
    icon: <Star className="size-4" />,
    items: [
      { label: '최근 본 상품', href: '/mypage/recent' },
      { label: '관심 상품', href: '/mypage/wishlist' },
      { label: '나의 리뷰', href: '/mypage/reviews' },
      { label: '1:1 문의 내역', href: '/mypage/inquiries' },
    ],
  },
  {
    title: '정보 관리',
    en: 'Account',
    icon: <User className="size-4" />,
    items: [
      { label: '회원 정보 수정', href: '/mypage/edit' },
      { label: '배송지 관리', href: '/mypage/address' },
    ],
  },
];

function MobileMypageMenu({ pathname }: { pathname: string }) {
  const currentLabel =
    pathname === '/mypage'
      ? '마이페이지 홈'
      : (MY_PAGE_MENU.flatMap(section => section.items).find(
          item => item.href === pathname,
        )?.label ?? '마이페이지 메뉴');
  const mobileItemClassName =
    'w-full cursor-pointer rounded-sm px-3 py-2 text-sm font-bold transition-colors';

  return (
    <div className="md:hidden">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="group flex h-12 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-black outline-none transition-colors hover:border-black focus-visible:border-black">
          {currentLabel}
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="max-h-[calc(var(--radix-dropdown-menu-content-available-height)-4rem)] min-w-[var(--radix-dropdown-menu-trigger-width)] rounded-md border-zinc-200 bg-white p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-lg"
        >
          <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
            <Link
              href="/mypage"
              className={cn(
                mobileItemClassName,
                pathname === '/mypage'
                  ? 'bg-black text-white'
                  : 'text-zinc-800 hover:bg-zinc-100',
              )}
            >
              마이페이지 홈
            </Link>
          </DropdownMenuItem>

          {MY_PAGE_MENU.map(section => (
            <div key={section.title}>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuLabel className="px-3 py-1 text-xs font-black tracking-[0.08em] text-zinc-400">
                {section.title}
              </DropdownMenuLabel>
              {section.items.map(item => (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  className="p-0 focus:bg-transparent"
                >
                  <Link
                    href={item.href}
                    className={cn(
                      mobileItemClassName,
                      pathname === item.href
                        ? 'bg-black text-white'
                        : 'text-zinc-800 hover:bg-zinc-100',
                    )}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MyPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const menuItemClassName =
    'flex w-full items-center rounded-sm px-3 py-2 text-sm font-bold transition-colors';

  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle current="마이페이지" />

      <div className="flex flex-col gap-8 md:flex-row">
        <MobileMypageMenu pathname={pathname} />

        {/* 왼쪽 사이드바 메뉴 */}
        <aside className="hidden shrink-0 md:block md:w-44">
          <nav className="rounded-md border border-zinc-200 bg-white p-3 md:sticky md:top-35">
            <Link
              href="/mypage"
              className={cn(
                menuItemClassName,
                pathname === '/mypage'
                  ? 'bg-black text-white'
                  : 'text-zinc-800 hover:bg-zinc-100 hover:text-black',
              )}
            >
              마이페이지 홈
            </Link>

            <div className="mt-6 space-y-6">
              {MY_PAGE_MENU.map(section => (
                <div key={section.title} className="space-y-2">
                  <h3 className="px-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-400">
                    {section.title}
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {section.items.map(item => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              menuItemClassName,
                              isActive
                                ? 'bg-black text-white'
                                : 'text-zinc-800 hover:bg-zinc-100 hover:text-black',
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>
        </aside>

        {/* 오른쪽 메인 콘텐츠 영역 */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default MyPageLayout;
