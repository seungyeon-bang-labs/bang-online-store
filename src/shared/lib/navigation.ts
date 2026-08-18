import {
  type LucideIcon,
  User,
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
  href: string;
  icon?: LucideIcon;
  requiresAuth?: boolean;
  guestOnly?: boolean;
};

const SHARED_MENU: { [key: string]: MenuItem } = {
  NEW: { name: 'NEW', href: '/new' },
  BEST: { name: 'BEST', href: '/best' },
  SALE: { name: 'SALE', href: '/sale' },
  SNAPSHOT: { name: 'SNAPSHOT', href: '/snapshot', icon: Aperture },
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
  CATEGORIES: { name: '카테고리', href: '/categories', icon: LayoutGrid },
  LOGOUT: { name: '로그아웃', href: '/logout', requiresAuth: true },
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
export const MOBILE_DRAWER_MENU: MenuItem[] = [...PC_MAIN_MENU, SHARED_MENU.CS];

export const MOBILE_FOOTER_MENU: MenuItem[] = [
  SHARED_MENU.HOME,
  SHARED_MENU.CATEGORIES,
  SHARED_MENU.SNAPSHOT,
  SHARED_MENU.CART,
  SHARED_MENU.LOGIN_SIGNUP,
  SHARED_MENU.MY_PAGE,
];

export const CS_MENU: MenuItem[] = [
  SHARED_MENU.NOTICE,
  SHARED_MENU.FAQ,
  SHARED_MENU.RETURN_REQUEST,
  SHARED_MENU.INQUIRY,
];

interface MainCategory {
  id: number;
  name: string;
  slug: string;
}

export const MAIN_CATEGORIES: MainCategory[] = [
  { id: 1, name: 'OUTER', slug: 'outer' },
  { id: 2, name: 'TOP', slug: 'top' },
  { id: 3, name: 'BOTTOM', slug: 'bottom' },
  { id: 4, name: 'ACC/SHOES', slug: 'acc-shoes' },
];

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  parentId: number;
  imageUrl: string;
  altText: string;
}

export const SUB_CATEGORIES: SubCategory[] = [
  { id: 1, name: '코트', slug: 'coat', parentId: 1, imageUrl: '/images/categories/coat.png', altText: '코트 이미지' },
  { id: 2, name: '자켓', slug: 'jacket', parentId: 1, imageUrl: '/images/categories/jacket.png', altText: '자켓 이미지' },
  { id: 3, name: '가디건', slug: 'cardigan', parentId: 1, imageUrl: '/images/categories/cardigan.png', altText: '가디건 이미지' },
  { id: 4, name: '패딩', slug: 'padding', parentId: 1, imageUrl: '/images/categories/padding.png', altText: '패딩 이미지' },
  
  { id: 5, name: '티셔츠', slug: 't-shirt', parentId: 2, imageUrl: '/images/categories/t-shirt.png', altText: '티셔츠 이미지' },
  { id: 6, name: '셔츠', slug: 'shirt', parentId: 2, imageUrl: '/images/categories/shirt.png', altText: '셔츠 이미지' },
  { id: 7, name: '니트', slug: 'knit', parentId: 2, imageUrl: '/images/categories/knit.png', altText: '니트 이미지' },
  
  { id: 8, name: '청바지', slug: 'denim', parentId: 3, imageUrl: '/images/categories/denim.png', altText: '청바지 이미지' },
  { id: 9, name: '슬랙스', slug: 'slacks', parentId: 3, imageUrl: '/images/categories/slacks.png', altText:  '슬랙스 이미지' },
  { id: 10, name: '반바지', slug: 'shorts', parentId: 3, imageUrl: '/images/categories/shorts.png', altText: '반바지 이미지' },

  { id: 11, name: '가방', slug: 'bag', parentId: 4, imageUrl: '/images/categories/bag.png', altText: '가방 이미지' },
  { id: 12, name: '신발', slug: 'shoes', parentId: 4, imageUrl: '/images/categories/shoes.png', altText: '신발 이미지' },
  { id: 13, name: '모자', slug: 'hat', parentId: 4, imageUrl: '/images/categories/hat.png', altText: '모자 이미지' },
];

export const CATEGORIES = [
  {
    name: 'OUTER',
    slug: 'outer',
    children: [
      { name: '코트', slug: 'coat', imgUrl: '/images/categories/coat.png' },
      { name: '자켓', slug: 'jacket', imgUrl: '/images/categories/jacket.png' },
      {
        name: '가디건',
        slug: 'cardigan',
        imgUrl: '/images/categories/cardigan.png',
      },
      {
        name: '패딩',
        slug: 'padding',
        imgUrl: '/images/categories/padding.png',
      },
    ],
  },
  {
    name: 'TOP',
    slug: 'top',
    children: [
      {
        name: '티셔츠',
        slug: 't-shirt',
        imgUrl: '/images/categories/t-shirt.png',
      },
      { name: '셔츠', slug: 'shirt', imgUrl: '/images/categories/shirt.png' },
      { name: '니트', slug: 'knit', imgUrl: '/images/categories/knit.png' },
      {
        name: '블라우스',
        slug: 'blouse',
        imgUrl: '/images/categories/blouse.png',
      },
    ],
  },
  {
    name: 'BOTTOM',
    slug: 'bottom',
    children: [
      { name: '청바지', slug: 'denim', imgUrl: '/images/categories/denim.png' },
      {
        name: '슬랙스',
        slug: 'slacks',
        imgUrl: '/images/categories/slacks.png',
      },
      { name: '스커트', slug: 'skirt', imgUrl: '/images/categories/skirt.png' },
      {
        name: '반바지',
        slug: 'shorts',
        imgUrl: '/images/categories/shorts.png',
      },
    ],
  },
  {
    name: 'ACC/SHOES',
    slug: 'acc-shoes',
    children: [
      { name: '가방', slug: 'bag', imgUrl: '/images/categories/bag.png' },
      { name: '신발', slug: 'shoes', imgUrl: '/images/categories/shoes.png' },
      { name: '모자', slug: 'hat', imgUrl: '/images/categories/hat.png' },
      {
        name: '주얼리',
        slug: 'jewelry',
        imgUrl: '/images/categories/jewelry.png',
      },
    ],
  },
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
