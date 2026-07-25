export type MypageHomeSummaryItemId =
  | 'member'
  | 'address'
  | 'membership'
  | 'points'
  | 'coupons';

export interface MypageHomeSummaryMenuItem {
  id: MypageHomeSummaryItemId;
  label: string;
  href: string;
  actionLabel: string;
}

export const MYPAGE_HOME_SUMMARY_ROWS = [
  [
    {
      id: 'member',
      label: '회원',
      href: '/mypage/edit',
      actionLabel: '정보 수정',
    },
    {
      id: 'address',
      label: '기본 배송지',
      href: '/mypage/address',
      actionLabel: '배송지 관리',
    },
  ],
  [
    {
      id: 'membership',
      label: '멤버십 등급',
      href: '/mypage/membership',
      actionLabel: '혜택 보기',
    },
    {
      id: 'points',
      label: '적립금',
      href: '/mypage/points',
      actionLabel: '내역 보기',
    },
    {
      id: 'coupons',
      label: '쿠폰',
      href: '/mypage/coupons',
      actionLabel: '쿠폰 보기',
    },
  ],
] as const satisfies readonly (readonly MypageHomeSummaryMenuItem[])[];
