import type { Tables } from '@/shared/types/supabase';

export type UserGender = 'male' | 'female' | 'unspecified';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  birth_date: string | null;
  gender: UserGender;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type UserAddressDTO = Tables<'user_addresses'>;

export type UserAddressWriteDTO = Pick<
  UserAddressDTO,
  | 'label'
  | 'recipient_name'
  | 'phone_number'
  | 'postal_code'
  | 'address_line_1'
  | 'address_line_2'
  | 'delivery_note'
  | 'is_default'
>;

export type MemberAccessDTO = Pick<
  Tables<'users'>,
  'id' | 'status' | 'deleted_at'
>;

export type MemberProfileDTO = Pick<
  Tables<'users'>,
  'id' | 'name' | 'email' | 'phone_number' | 'email_verified_at'
>;
