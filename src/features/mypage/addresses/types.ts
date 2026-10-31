import type { UserAddressFormViewModel } from '@/domains/member';

export type MypageAddressFormMode = 'create' | 'edit';

export type MypageAddressFormValues = Omit<UserAddressFormViewModel, 'id'>;

export interface MypageAddressActions {
  onSetDefaultAddress: (addressId: string) => Promise<boolean>;
  onDeleteAddress: (addressId: string) => Promise<boolean>;
}
