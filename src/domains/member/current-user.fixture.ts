import type { UserDTO } from './member.dto';

export const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';

export const CURRENT_USER: UserDTO = {
  id: DEMO_USER_ID,
  login_id: 'gemini',
  name: 'Kim Gemini',
  email: 'gemini@example.com',
  phone_number: '010-1234-5678',
  birth_date: '1992-03-15',
  email_verified_at: '2026-01-10T09:00:00+09:00',
  created_at: '2025-08-12T10:30:00+09:00',
  updated_at: '2026-07-01T14:20:00+09:00',
};
