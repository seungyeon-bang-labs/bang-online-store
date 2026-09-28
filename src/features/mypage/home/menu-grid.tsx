import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  Eye,
  Heart,
  MessageCircle,
  Repeat2,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { MypageCard } from '@/features/mypage/common';
import {
  MYPAGE_MENU_SECTIONS,
  type MypageMenuItem,
} from '@/features/mypage/navigation/mypage-menu';

const HOME_MENU_ITEM_HREFS = new Set([
  '/mypage/orders',
  '/mypage/returns',
  '/mypage/recent',
  '/mypage/wishlist',
  '/mypage/reviews',
  '/mypage/inquiries',
]);

const iconByHref: Record<string, LucideIcon> = {
  '/mypage/orders': ClipboardList,
  '/mypage/returns': Repeat2,
  '/mypage/recent': Eye,
  '/mypage/wishlist': Heart,
  '/mypage/reviews': Star,
  '/mypage/inquiries': MessageCircle,
};

const homeMenuItems = MYPAGE_MENU_SECTIONS
  .reduce<MypageMenuItem[]>(
    (items, section) => [...items, ...section.items],
    [],
  )
  .filter(item => HOME_MENU_ITEM_HREFS.has(item.href));

export function MypageHomeMenuGrid() {
  return (
    <MypageCard
      aria-label="마이페이지 메뉴"
      className="md:hidden"
      mobileLayout="full-bleed"
    >
      <MypageCard.Body
        padding="flush-y"
        className="grid grid-cols-3 gap-px bg-zinc-200 px-0 md:px-0"
      >
        {homeMenuItems.map(item => {
          const Icon = iconByHref[item.href];

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 bg-white px-2 py-3 text-center text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black"
            >
              <Icon className="size-5 text-black" strokeWidth={1.8} aria-hidden="true" />
              <span className="leading-4">{item.label}</span>
            </Link>
          );
        })}
      </MypageCard.Body>
    </MypageCard>
  );
}
