export interface MypageMenuItem {
  label: string;
  href: string;
}

export interface MypageMenuSection {
  title: string;
  items: readonly MypageMenuItem[];
}

export const MYPAGE_HOME = {
  label: '마이페이지 홈',
  href: '/mypage',
} as const;

export const MYPAGE_MENU_SECTIONS = [
  {
    title: '주문 관리',
    items: [
      { label: '주문 내역', href: '/mypage/orders' },
      { label: '교환/반품 내역', href: '/mypage/returns' },
    ],
  },
  {
    title: '혜택 관리',
    items: [
      { label: '멤버십 혜택', href: '/mypage/membership' },
      { label: '적립금 내역', href: '/mypage/points' },
      { label: '쿠폰함', href: '/mypage/coupons' },
    ],
  },
  {
    title: '활동 관리',
    items: [
      { label: '최근 본 상품', href: '/mypage/recent' },
      { label: '관심 상품', href: '/mypage/wishlist' },
      { label: '나의 리뷰', href: '/mypage/reviews' },
      { label: '1:1 문의 내역', href: '/mypage/inquiries' },
    ],
  },
  {
    title: '정보 관리',
    items: [
      { label: '회원 정보 수정', href: '/mypage/edit' },
      { label: '배송지 관리', href: '/mypage/address' },
    ],
  },
] as const satisfies readonly MypageMenuSection[];

export function isMypagePathActive(pathname: string, href: string) {
  if (href === MYPAGE_HOME.href) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getMypageCurrentLabel(pathname: string) {
  if (isMypagePathActive(pathname, MYPAGE_HOME.href)) {
    return MYPAGE_HOME.label;
  }

  for (const section of MYPAGE_MENU_SECTIONS) {
    const currentItem = section.items.find(item =>
      isMypagePathActive(pathname, item.href),
    );

    if (currentItem) {
      return currentItem.label;
    }
  }

  return '마이페이지 메뉴';
}
