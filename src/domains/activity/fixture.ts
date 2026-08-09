import { DEMO_USER_ID } from '@/domains/member/fixture';
import type {
  RecentProductViewDTO,
  ReviewDTO,
  WishlistItemDTO,
} from './dto';

const RECENT_PRODUCT_VIEW_GROUPS = [
  { date: '2026-08-04', productIds: [1, 2, 3, 4, 5] },
  { date: '2026-08-03', productIds: [6, 7, 8, 9] },
  { date: '2026-08-02', productIds: [10, 11, 12, 13, 14] },
  { date: '2026-08-01', productIds: [15, 16, 17] },
  { date: '2026-07-31', productIds: [18, 19, 20, 21, 22] },
  { date: '2026-07-30', productIds: [23, 24, 25, 26] },
  { date: '2026-07-29', productIds: [27, 1, 5, 9, 13] },
  { date: '2026-07-28', productIds: [2, 6, 10] },
  { date: '2026-07-27', productIds: [14, 18, 22, 26] },
  { date: '2026-07-26', productIds: [3, 7, 11] },
  { date: '2026-07-25', productIds: [15, 19, 23, 27] },
  { date: '2026-07-24', productIds: [4, 8, 12] },
  { date: '2026-07-23', productIds: [16, 20] },
] as const;

export const RECENT_PRODUCT_VIEWS: readonly RecentProductViewDTO[] =
  RECENT_PRODUCT_VIEW_GROUPS.flatMap(({ date, productIds }, dateIndex) =>
    productIds.map((product_id, productIndex) => ({
      id: `30000000-0000-4000-8000-${String(dateIndex * 5 + productIndex + 1).padStart(12, '0')}`,
      user_id: DEMO_USER_ID,
      product_id,
      viewed_at: `${date}T${String(20 - productIndex).padStart(2, '0')}:00:00+09:00`,
    })),
  );

const WISHLIST_PRODUCT_IDS = [
  8, 1, 7, 15, 5, 2, 3, 4, 6, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 1, 7, 15, 5, 8,
] as const;

const WISHLIST_CREATED_AT_START = new Date('2026-08-04T09:00:00+09:00');
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const WISHLIST_ITEMS: readonly WishlistItemDTO[] =
  WISHLIST_PRODUCT_IDS.map((product_id, index) => ({
    id: `31000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    user_id: DEMO_USER_ID,
    product_id,
    created_at: new Date(
      WISHLIST_CREATED_AT_START.getTime() -
        index * ONE_DAY_IN_MILLISECONDS,
    ).toISOString(),
  }));

export const REVIEWS: readonly ReviewDTO[] = [
  {
    id: '32000000-0000-4000-8000-000000000001',
    user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000006',
    product_id: 4,
    rating: 5,
    content: '핏과 원단이 기대 이상입니다.',
    created_at: '2026-07-15T14:20:00+09:00',
    updated_at: '2026-07-15T14:20:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000002',
    user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000008',
    product_id: 6,
    rating: 4,
    content: '활용도가 높고 색감이 좋습니다.',
    created_at: '2026-05-12T14:00:00+09:00',
    updated_at: '2026-05-12T14:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000003', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000007', product_id: 5,
    rating: 5, content: '가볍게 걸치기 좋고 마감도 깔끔합니다.',
    created_at: '2026-06-28T12:00:00+09:00', updated_at: '2026-06-28T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000004', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000010', product_id: 1,
    rating: 4, content: '실루엣이 단정해서 자주 입게 됩니다.',
    created_at: '2026-06-25T12:00:00+09:00', updated_at: '2026-06-25T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000005', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000011', product_id: 9,
    rating: 5, content: '색 조합이 좋아서 포인트로 입기 좋습니다.',
    created_at: '2026-06-21T12:00:00+09:00', updated_at: '2026-06-21T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000006', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000012', product_id: 6,
    rating: 4, content: '두께감이 적당해 활용도가 높습니다.',
    created_at: '2026-06-17T12:00:00+09:00', updated_at: '2026-06-17T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000007', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000013', product_id: 10,
    rating: 5, content: '원단이 탄탄하고 착용감이 편안합니다.',
    created_at: '2026-06-12T12:00:00+09:00', updated_at: '2026-06-12T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000008', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000014', product_id: 1,
    rating: 4, content: '기본 디자인이라 매치하기 편합니다.',
    created_at: '2026-06-05T12:00:00+09:00', updated_at: '2026-06-05T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000009', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000026', product_id: 1,
    rating: 5, content: '격식 있는 자리에도 잘 어울립니다.',
    created_at: '2026-07-08T12:00:00+09:00', updated_at: '2026-07-08T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000010', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000027', product_id: 2,
    rating: 4, content: '색감이 차분하고 핏이 안정적입니다.',
    created_at: '2026-07-09T12:00:00+09:00', updated_at: '2026-07-09T12:00:00+09:00',
  },
  {
    id: '32000000-0000-4000-8000-000000000011', user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000028', product_id: 3,
    rating: 5, content: '컬러가 고급스럽고 보온성도 좋습니다.',
    created_at: '2026-07-10T12:00:00+09:00', updated_at: '2026-07-10T12:00:00+09:00',
  },
];
