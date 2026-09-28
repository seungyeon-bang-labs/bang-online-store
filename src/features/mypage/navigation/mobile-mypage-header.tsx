'use client';

import {
  ChevronLeft,
  MapPinPlus,
  Printer,
  ShoppingCart,
  SquarePen,
  type LucideIcon,
} from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import {
  getMypageAddressWriteHref,
  getMypageInquiryWriteHref,
} from '@/shared/lib/mypage-routes';
import { getCartHref } from '@/shared/lib/cart-routes';
import { getCartItemCount, useCartStore } from '@/domains/cart';
import { getMypageCurrentLabel } from './mypage-menu';
import {
  CartItemCountBadge,
  getCartAriaLabel,
} from '@/shared/components/layout/cart-item-count-badge';

interface MypageMobileBackHeader {
  backHref: string;
  title: string;
}

interface MypageMobileHeaderAction {
  href: string;
  ariaLabel: string;
  icon: LucideIcon;
}

const RECEIPT_DOCUMENT_TITLES = {
  purchase: '구매 영수증',
  card: '카드 매출전표',
  cash: '현금 영수증',
  refund: '취소·환불 확인서',
} as const;

function getReceiptDocumentTitle(pathname: string): string | null {
  const match = pathname.match(
    /^\/mypage\/orders\/[^/]+\/receipt\/(purchase|card|cash|refund)$/,
  );
  if (!match) return null;

  return RECEIPT_DOCUMENT_TITLES[
    match[1] as keyof typeof RECEIPT_DOCUMENT_TITLES
  ];
}

function isMypageCartShortcutPath(pathname: string): boolean {
  return (
    pathname === '/mypage' ||
    pathname === '/mypage/orders' ||
    /^\/mypage\/orders\/[^/]+$/.test(pathname) ||
    pathname === '/mypage/recent' ||
    pathname === '/mypage/wishlist'
  );
}

function getMypageMobileHeaderAction(
  pathname: string,
  search: string,
): MypageMobileHeaderAction | null {
  if (pathname === '/mypage/address') {
    return {
      href: getMypageAddressWriteHref(),
      ariaLabel: '배송지 추가',
      icon: MapPinPlus,
    };
  }

  if (pathname === '/mypage/inquiries') {
    return {
      href: getMypageInquiryWriteHref({
        returnTo: search ? `${pathname}?${search}` : pathname,
      }),
      ariaLabel: '문의 작성',
      icon: SquarePen,
    };
  }

  if (isMypageCartShortcutPath(pathname)) {
    return {
      href: getCartHref(search ? `${pathname}?${search}` : pathname),
      ariaLabel: '장바구니',
      icon: ShoppingCart,
    };
  }

  return null;
}

function getMypageMobileBackHeader(
  pathname: string,
): MypageMobileBackHeader | null {
  const orderMatch = pathname.match(/^\/mypage\/orders\/([^/]+)/);
  const receiptDocumentTitle = getReceiptDocumentTitle(pathname);

  if (receiptDocumentTitle) {
    return {
      backHref: orderMatch ? `/mypage/orders/${orderMatch[1]}/receipt` : '/mypage/orders',
      title: receiptDocumentTitle,
    };
  }

  if (pathname.endsWith('/receipt')) {
    return {
      backHref: orderMatch ? `/mypage/orders/${orderMatch[1]}` : '/mypage/orders',
      title: '영수증 조회',
    };
  }

  if (pathname.includes('/cancel/')) {
    return {
      backHref: orderMatch ? `/mypage/orders/${orderMatch[1]}` : '/mypage/orders',
      title: '주문 취소 신청',
    };
  }

  if (pathname.includes('/claim/')) {
    return {
      backHref: orderMatch ? `/mypage/orders/${orderMatch[1]}` : '/mypage/orders',
      title: '교환·반품 신청',
    };
  }

  if (orderMatch && pathname !== '/mypage/orders') {
    return { backHref: '/mypage/orders', title: '주문 상세' };
  }

  if (/^\/mypage\/returns\/[^/]+$/.test(pathname)) {
    return { backHref: '/mypage/returns', title: '교환·반품 상세' };
  }

  if (pathname === '/mypage/address/write') {
    return { backHref: '/mypage/address', title: '배송지 추가' };
  }

  if (/^\/mypage\/address\/[^/]+\/edit$/.test(pathname)) {
    return { backHref: '/mypage/address', title: '배송지 수정' };
  }

  if (pathname === '/mypage/inquiries/write') {
    return { backHref: '/mypage/inquiries', title: '1:1 문의 작성' };
  }

  if (/^\/mypage\/inquiries\/[^/]+\/edit$/.test(pathname)) {
    return { backHref: '/mypage/inquiries', title: '1:1 문의 수정' };
  }

  if (/^\/mypage\/reviews\/write\/[^/]+$/.test(pathname)) {
    return { backHref: '/mypage/reviews', title: '리뷰 작성' };
  }

  if (/^\/mypage\/reviews\/[^/]+\/edit$/.test(pathname)) {
    return { backHref: '/mypage/reviews', title: '리뷰 수정' };
  }

  return null;
}

export function MypageMobileHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const backHeader = getMypageMobileBackHeader(pathname);
  const headerAction = getMypageMobileHeaderAction(
    pathname,
    searchParams.toString(),
  );
  const receiptDocumentTitle = getReceiptDocumentTitle(pathname);
  const HeaderActionIcon = headerAction?.icon;
  const cartItemCount = useCartStore(state => getCartItemCount(state.items));
  const isCartAction = headerAction?.ariaLabel === '장바구니';

  const backHref = backHeader?.backHref ?? (pathname === '/mypage' ? null : '/mypage');
  const title = backHeader?.title
    ?? (pathname === '/mypage' ? '마이페이지' : getMypageCurrentLabel(pathname));

  return (
    <div
      className="grid h-14 w-full grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center bg-white md:hidden"
    >
      {backHref ? (
        <ButtonLink
          href={backHref}
          aria-label="이전 페이지로"
          variant="ghost"
          size="icon-md"
          className="ml-2 justify-self-start"
        >
          <ChevronLeft className="size-[22px]" strokeWidth={2} aria-hidden="true" />
        </ButtonLink>
      ) : <span aria-hidden="true" />}
      <p className="truncate text-center text-lg font-bold leading-6 text-black">{title}</p>
      {receiptDocumentTitle ? (
        <Button
          type="button"
          aria-label="인쇄하기"
          variant="ghost"
          size="icon-md"
          className="mr-2 justify-self-end"
          onClick={() => window.print()}
        >
          <Printer className="size-[22px]" aria-hidden="true" />
        </Button>
      ) : headerAction && HeaderActionIcon ? (
        <ButtonLink
          href={headerAction.href}
          aria-label={
            isCartAction ? getCartAriaLabel(cartItemCount) : headerAction.ariaLabel
          }
          variant="ghost"
          size="icon-md"
          className="mr-2 justify-self-end"
        >
          {isCartAction ? (
            <span className="relative inline-flex size-[22px]" aria-hidden="true">
              <HeaderActionIcon className="size-[22px]" />
              <CartItemCountBadge
                count={cartItemCount}
                className="pointer-events-none absolute -right-2 -top-2"
              />
            </span>
          ) : (
            <HeaderActionIcon className="size-[22px]" aria-hidden="true" />
          )}
        </ButtonLink>
      ) : <span aria-hidden="true" />}
    </div>
  );
}
