import { DEMO_USER_ID } from './current-user.fixture';
import type { UserAddressDTO } from './member.dto';

export const USER_ADDRESSES: readonly UserAddressDTO[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    user_id: DEMO_USER_ID,
    label: '집',
    recipient_name: 'Kim Gemini',
    phone_number: '010-1234-5678',
    postal_code: '06134',
    address_line_1: '서울특별시 강남구 테헤란로 123',
    address_line_2: '101동 1203호',
    delivery_note: '문 앞에 놓아주세요.',
    is_default: true,
    created_at: '2025-08-12T10:40:00+09:00',
    updated_at: '2026-07-01T14:20:00+09:00',
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    user_id: DEMO_USER_ID,
    label: '회사',
    recipient_name: 'Kim Gemini',
    phone_number: '010-1234-5678',
    postal_code: '13494',
    address_line_1: '경기도 성남시 분당구 판교역로 235',
    address_line_2: null,
    delivery_note: null,
    is_default: false,
    created_at: '2026-02-20T11:00:00+09:00',
    updated_at: '2026-02-20T11:00:00+09:00',
  },
];
