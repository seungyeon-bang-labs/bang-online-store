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

export interface UserAddressDTO {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone_number: string;
  postal_code: string;
  address_line_1: string;
  address_line_2: string | null;
  delivery_note: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
