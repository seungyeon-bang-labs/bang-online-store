import { DEMO_USER_ID } from '@/domains/member/current-user.fixture';
import type {
  RecentProductViewDTO,
  ReviewDTO,
  WishlistItemDTO,
} from './activity.dto';

export const RECENT_PRODUCT_VIEWS: readonly RecentProductViewDTO[] = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    user_id: DEMO_USER_ID,
    product_id: 3,
    viewed_at: '2026-07-16T11:00:00+09:00',
  },
  {
    id: '30000000-0000-4000-8000-000000000002',
    user_id: DEMO_USER_ID,
    product_id: 10,
    viewed_at: '2026-07-15T11:00:00+09:00',
  },
  {
    id: '30000000-0000-4000-8000-000000000003',
    user_id: DEMO_USER_ID,
    product_id: 20,
    viewed_at: '2026-07-14T11:00:00+09:00',
  },
  {
    id: '30000000-0000-4000-8000-000000000004',
    user_id: DEMO_USER_ID,
    product_id: 24,
    viewed_at: '2026-07-13T11:00:00+09:00',
  },
  {
    id: '30000000-0000-4000-8000-000000000005',
    user_id: DEMO_USER_ID,
    product_id: 4,
    viewed_at: '2026-07-12T11:00:00+09:00',
  },
  {
    id: '30000000-0000-4000-8000-000000000006',
    user_id: DEMO_USER_ID,
    product_id: 11,
    viewed_at: '2026-07-11T11:00:00+09:00',
  },
  {
    id: '30000000-0000-4000-8000-000000000007',
    user_id: DEMO_USER_ID,
    product_id: 21,
    viewed_at: '2026-07-10T11:00:00+09:00',
  },
];

export const WISHLIST_ITEMS: readonly WishlistItemDTO[] = [
  {
    id: '31000000-0000-4000-8000-000000000001',
    user_id: DEMO_USER_ID,
    product_id: 8,
    created_at: '2026-07-14T09:00:00+09:00',
  },
  {
    id: '31000000-0000-4000-8000-000000000002',
    user_id: DEMO_USER_ID,
    product_id: 1,
    created_at: '2026-07-13T09:00:00+09:00',
  },
  {
    id: '31000000-0000-4000-8000-000000000003',
    user_id: DEMO_USER_ID,
    product_id: 7,
    created_at: '2026-07-12T09:00:00+09:00',
  },
  {
    id: '31000000-0000-4000-8000-000000000004',
    user_id: DEMO_USER_ID,
    product_id: 15,
    created_at: '2026-07-11T09:00:00+09:00',
  },
  {
    id: '31000000-0000-4000-8000-000000000005',
    user_id: DEMO_USER_ID,
    product_id: 5,
    created_at: '2026-07-10T09:00:00+09:00',
  },
];

export const REVIEWS: readonly ReviewDTO[] = [
  {
    id: '32000000-0000-4000-8000-000000000001',
    user_id: DEMO_USER_ID,
    order_item_id: '21000000-0000-4000-8000-000000000006',
    product_id: 4,
    rating: 5,
    content: '핏과 원단이 기대 이상입니다.',
    created_at: '2026-07-16T18:00:00+09:00',
    updated_at: '2026-07-16T18:00:00+09:00',
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
];
