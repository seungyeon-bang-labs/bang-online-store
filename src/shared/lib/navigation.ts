import {
  type LucideIcon,
  User,
  Search,
  ShoppingCart,
  House,
  LayoutGrid,
  Aperture,
  Megaphone,
  HelpCircle,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';

export type MenuItem = {
  name: string;
  mobileLabel?: string;
  href: string;
  icon?: LucideIcon;
  requiresAuth?: boolean;
  guestOnly?: boolean;
};

const SHARED_MENU: { [key: string]: MenuItem } = {
  NEW: { name: 'NEW', href: '/new' },
  BEST: { name: 'BEST', href: '/best' },
  SALE: { name: 'SALE', href: '/sale' },
  SNAPSHOT: {
    name: 'SNAPSHOT',
    mobileLabel: '스냅샷',
    href: '/snapshot',
    icon: Aperture,
  },
  EVENT: { name: 'EVENT', href: '/event' },
  CS: { name: '고객센터', href: '/cs' },
  NOTICE: { name: '공지사항', href: '/cs/notice', icon: Megaphone },
  FAQ: { name: '자주 묻는 질문', href: '/cs/faq', icon: HelpCircle },
  INQUIRY: { name: '1:1 문의', href: '/cs/inquiry', icon: MessageSquare },
  RETURN_REQUEST: {
    name: '교환·반품 안내',
    href: '/cs/return-request',
    icon: RotateCcw,
  },
  MY_PAGE: {
    name: '마이페이지',
    href: '/mypage',
    icon: User,
    requiresAuth: true,
  },
  CART: { name: '장바구니', href: '/cart', icon: ShoppingCart },
  SEARCH: { name: '검색', href: '/search', icon: Search },
  ORDER_TRACKING: {
    name: '비회원 주문조회',
    href: '/order-tracking',
    guestOnly: true,
  },
  LOGIN_SIGNUP: {
    name: '로그인/회원가입',
    href: '/login',
    icon: User,
    guestOnly: true,
  },
  HOME: { name: '홈', href: '/', icon: House },
  CATEGORIES: { name: '카테고리', href: '/category', icon: LayoutGrid },
  LOGOUT: { name: '로그아웃', href: '/logout', requiresAuth: true },
};

const MOBILE_MY_PAGE_MENU: MenuItem = {
  ...SHARED_MENU.MY_PAGE,
  requiresAuth: false,
};

export const PC_UTILITY_MENU: MenuItem[] = [
  SHARED_MENU.CS,
  SHARED_MENU.MY_PAGE,
  SHARED_MENU.CART,
  SHARED_MENU.ORDER_TRACKING,
  SHARED_MENU.LOGIN_SIGNUP,
  SHARED_MENU.LOGOUT,
];

export const PC_MAIN_MENU: MenuItem[] = [
  SHARED_MENU.NEW,
  SHARED_MENU.BEST,
  SHARED_MENU.SALE,
  SHARED_MENU.SNAPSHOT,
  SHARED_MENU.EVENT,
];

export const MOBILE_PRODUCT_MENU: MenuItem[] = [
  SHARED_MENU.HOME,
  SHARED_MENU.NEW,
  SHARED_MENU.BEST,
  SHARED_MENU.SALE,
  SHARED_MENU.EVENT,
];

export const MOBILE_DRAWER_MENU: MenuItem[] = [...PC_MAIN_MENU, SHARED_MENU.CS];

export const MOBILE_FOOTER_MENU: MenuItem[] = [
  SHARED_MENU.HOME,
  SHARED_MENU.CATEGORIES,
  SHARED_MENU.SNAPSHOT,
  SHARED_MENU.SEARCH,
  MOBILE_MY_PAGE_MENU,
];

export const CS_MENU: MenuItem[] = [
  SHARED_MENU.NOTICE,
  SHARED_MENU.FAQ,
  SHARED_MENU.RETURN_REQUEST,
  SHARED_MENU.INQUIRY,
];

interface TabItem {
  label: string;
  urlQuery: string;
}

export const NOTICE_TABS: TabItem[] = [
  { label: '전체', urlQuery: 'all' },
  { label: '배송/물류', urlQuery: 'shipping' },
  { label: '점검/업데이트', urlQuery: 'system' },
  { label: '서비스/정책', urlQuery: 'policy' },
  { label: '이벤트 당첨', urlQuery: 'winners' },
];

export const FAQ_TABS: TabItem[] = [
  { label: '전체', urlQuery: 'all' },
  { label: '배송', urlQuery: 'delivery' },
  { label: '주문/결제', urlQuery: 'order' },
  { label: '상품/소재', urlQuery: 'product' },
  { label: '사이즈/가이드', urlQuery: 'size' },
  { label: '취소/반품', urlQuery: 'returns' },
  { label: '회원/혜택', urlQuery: 'account' },
  { label: '이용안내', urlQuery: 'guide' },
  { label: '기타', urlQuery: 'other' },
];

export const PERIOD_TABS: TabItem[] = [
  { label: '실시간', urlQuery: 'realtime' },
  { label: '일간', urlQuery: 'daily' },
  { label: '주간', urlQuery: 'weekly' },
  { label: '월간', urlQuery: 'monthly' },
];

export const CATEGORY_TABS: TabItem[] = [
  { label: 'ALL', urlQuery: 'all' },
  { label: 'OUTER', urlQuery: 'outer' },
  { label: 'TOP', urlQuery: 'top' },
  { label: 'BOTTOM', urlQuery: 'bottom' },
  { label: 'ACC/SHOES', urlQuery: 'acc-shoes' },
];

export const NEW_TABS: TabItem[] = [
  { label: 'NOW', urlQuery: 'now' },
  { label: '신규', urlQuery: 'new-arrivals' },
  { label: '재입고', urlQuery: 'restock' },
  { label: '예정', urlQuery: 'upcoming' },
  { label: 'PAST', urlQuery: 'past' },
];

export const BEST_TABS: TabItem[] = [
  { label: '일간', urlQuery: 'daily' },
  { label: '주간', urlQuery: 'weekly' },
  { label: '월간', urlQuery: 'monthly' },
  { label: '전체', urlQuery: 'total' },
];

export function filterMenuByAuth(
  menuList: MenuItem[],
  isLoggedIn: boolean,
): MenuItem[] {
  return menuList.filter(item => {
    if (item.requiresAuth && !isLoggedIn) return false;
    if (item.guestOnly && isLoggedIn) return false;
    return true;
  });
}
